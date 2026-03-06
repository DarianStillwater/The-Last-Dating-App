import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectFaces, detectModerationLabels, compareFaces } from "./rekognition.ts";
import { validateMetadata } from "./validation.ts";

// Thresholds — kept in sync with APP_CONFIG on the client
const FACE_DETECTION_CONFIDENCE_MIN = 90;
const MODERATION_CONFIDENCE_THRESHOLD = 75;
const FACE_MATCH_SIMILARITY_MIN = 80;
const FACE_MATCH_REVIEW_THRESHOLD = 60;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Auth — verify the caller's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing authorization header", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service role for DB writes
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    // 2. Parse request
    const { photo_storage_path, is_main_photo, device_metadata } = await req.json();

    if (!photo_storage_path) {
      return jsonError("Missing photo_storage_path", 400);
    }

    // 3. Validate device metadata
    const metaResult = validateMetadata(device_metadata);
    if (!metaResult.valid) {
      await insertVerification(supabase, {
        user_id: user.id,
        photo_url: "",
        photo_storage_path,
        is_main_photo: is_main_photo ?? false,
        status: "rejected",
        rejection_reason: metaResult.reason!,
        device_metadata,
      });
      await deletePhoto(supabase, photo_storage_path);
      return jsonResponse({
        verification_id: null,
        status: "rejected",
        rejection_reason: metaResult.reason,
        face_detected: false,
        moderation_passed: false,
      }, 400);
    }

    // 4. Download photo bytes from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("profile-photos")
      .download(photo_storage_path);

    if (downloadError || !fileData) {
      return jsonError("Photo not found in storage", 404);
    }

    const imageBytes = new Uint8Array(await fileData.arrayBuffer());
    const startTime = Date.now();

    // 5. Step A: Face Detection
    const faceResult = await detectFaces(imageBytes);

    if (faceResult.faceCount === 0) {
      return await rejectPhoto(supabase, user.id, photo_storage_path, is_main_photo, device_metadata,
        "no_face", faceResult, null, null, startTime);
    }

    if (faceResult.faceCount > 1 && is_main_photo) {
      return await rejectPhoto(supabase, user.id, photo_storage_path, is_main_photo, device_metadata,
        "multiple_faces", faceResult, null, null, startTime);
    }

    if (faceResult.confidence < FACE_DETECTION_CONFIDENCE_MIN) {
      return await rejectPhoto(supabase, user.id, photo_storage_path, is_main_photo, device_metadata,
        "low_quality", faceResult, null, null, startTime);
    }

    // 6. Step B: Content Moderation
    const moderationResult = await detectModerationLabels(imageBytes, MODERATION_CONFIDENCE_THRESHOLD);

    if (!moderationResult.passed) {
      return await rejectPhoto(supabase, user.id, photo_storage_path, is_main_photo, device_metadata,
        "inappropriate_content", faceResult, moderationResult, null, startTime);
    }

    // 7. Step C: Face Comparison (main photo only, when a prior approved photo exists)
    let faceMatchResult = null;
    let comparedAgainstUrl: string | null = null;

    if (is_main_photo) {
      const { data: lastVerification } = await supabase
        .from("photo_verifications")
        .select("photo_url, photo_storage_path")
        .eq("user_id", user.id)
        .eq("is_main_photo", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastVerification?.photo_storage_path) {
        comparedAgainstUrl = lastVerification.photo_url;

        const { data: refData } = await supabase.storage
          .from("profile-photos")
          .download(lastVerification.photo_storage_path);

        if (refData) {
          const refBytes = new Uint8Array(await refData.arrayBuffer());
          faceMatchResult = await compareFaces(imageBytes, refBytes, FACE_MATCH_SIMILARITY_MIN);

          if (faceMatchResult.similarity < FACE_MATCH_REVIEW_THRESHOLD) {
            return await rejectPhoto(supabase, user.id, photo_storage_path, is_main_photo, device_metadata,
              "face_mismatch", faceResult, moderationResult, faceMatchResult, startTime, comparedAgainstUrl);
          }

          if (faceMatchResult.similarity < FACE_MATCH_SIMILARITY_MIN) {
            // Between review threshold and match min — flag for manual review
            return await flagForReview(supabase, user.id, photo_storage_path, is_main_photo, device_metadata,
              faceResult, moderationResult, faceMatchResult, comparedAgainstUrl, startTime);
          }
        }
      }
      // If no previous photo exists, skip face comparison (first-time user)
    }

    // 8. ALL CHECKS PASSED — approve
    const processingTime = Date.now() - startTime;
    const photoUrl = getPublicUrl(supabase, photo_storage_path);

    const { data: verification } = await insertVerification(supabase, {
      user_id: user.id,
      photo_url: photoUrl,
      photo_storage_path,
      is_main_photo: is_main_photo ?? false,
      status: "approved",
      face_detected: true,
      face_count: faceResult.faceCount,
      face_confidence: faceResult.confidence,
      face_details: faceResult.raw,
      moderation_passed: true,
      moderation_labels: moderationResult.labels,
      moderation_max_confidence: moderationResult.maxConfidence,
      face_match_attempted: !!faceMatchResult,
      face_match_passed: faceMatchResult ? faceMatchResult.matched : null,
      face_match_similarity: faceMatchResult?.similarity ?? null,
      face_match_details: faceMatchResult?.raw ?? null,
      compared_against_url: comparedAgainstUrl,
      device_metadata,
      processing_time_ms: processingTime,
      processed_at: new Date().toISOString(),
    });

    // 9. Update profile
    if (is_main_photo) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("profiles")
        .update({
          photo_verification_status: "verified",
          photo_verified_at: new Date().toISOString(),
          last_verification_id: verification?.id ?? null,
          main_photo_url: photoUrl,
          main_photo_expires_at: expiresAt,
        })
        .eq("id", user.id);
    }

    return jsonResponse({
      verification_id: verification?.id ?? null,
      status: "approved",
      face_detected: true,
      moderation_passed: true,
      face_match_passed: faceMatchResult ? faceMatchResult.matched : undefined,
      face_match_similarity: faceMatchResult?.similarity,
    });
  } catch (error) {
    console.error("verify-photo error:", error);
    return jsonError("Internal server error", 500);
  }
});

// --- Helpers ---

async function rejectPhoto(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  storagePath: string,
  isMain: boolean,
  deviceMetadata: unknown,
  reason: string,
  faceResult: { faceCount: number; confidence: number; raw: unknown } | null,
  moderationResult: { labels: unknown[]; maxConfidence: number } | null,
  faceMatchResult: { similarity: number; raw: unknown } | null,
  startTime: number,
  comparedAgainstUrl?: string | null,
) {
  const processingTime = Date.now() - startTime;

  await insertVerification(supabase, {
    user_id: userId,
    photo_url: getPublicUrl(supabase, storagePath),
    photo_storage_path: storagePath,
    is_main_photo: isMain,
    status: "rejected",
    rejection_reason: reason,
    face_detected: faceResult ? faceResult.faceCount > 0 : false,
    face_count: faceResult?.faceCount ?? null,
    face_confidence: faceResult?.confidence ?? null,
    face_details: faceResult?.raw ?? null,
    moderation_passed: moderationResult?.labels ? moderationResult.labels.length === 0 : null,
    moderation_labels: moderationResult?.labels ?? null,
    moderation_max_confidence: moderationResult?.maxConfidence ?? null,
    face_match_attempted: !!faceMatchResult,
    face_match_passed: faceMatchResult ? false : null,
    face_match_similarity: faceMatchResult?.similarity ?? null,
    face_match_details: faceMatchResult?.raw ?? null,
    compared_against_url: comparedAgainstUrl ?? null,
    device_metadata: deviceMetadata,
    processing_time_ms: processingTime,
    processed_at: new Date().toISOString(),
  });

  await deletePhoto(supabase, storagePath);

  return jsonResponse({
    verification_id: null,
    status: "rejected",
    rejection_reason: reason,
    face_detected: faceResult ? faceResult.faceCount > 0 : false,
    moderation_passed: moderationResult ? moderationResult.labels.length === 0 : false,
    face_match_passed: faceMatchResult ? false : undefined,
    face_match_similarity: faceMatchResult?.similarity,
  }, 400);
}

async function flagForReview(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  storagePath: string,
  isMain: boolean,
  deviceMetadata: unknown,
  faceResult: { faceCount: number; confidence: number; raw: unknown },
  moderationResult: { labels: unknown[]; maxConfidence: number },
  faceMatchResult: { similarity: number; raw: unknown },
  comparedAgainstUrl: string | null,
  startTime: number,
) {
  const processingTime = Date.now() - startTime;
  const photoUrl = getPublicUrl(supabase, storagePath);

  const { data: verification } = await insertVerification(supabase, {
    user_id: userId,
    photo_url: photoUrl,
    photo_storage_path: storagePath,
    is_main_photo: isMain,
    status: "needs_review",
    face_detected: true,
    face_count: faceResult.faceCount,
    face_confidence: faceResult.confidence,
    face_details: faceResult.raw,
    moderation_passed: true,
    moderation_labels: moderationResult.labels,
    moderation_max_confidence: moderationResult.maxConfidence,
    face_match_attempted: true,
    face_match_passed: false,
    face_match_similarity: faceMatchResult.similarity,
    face_match_details: faceMatchResult.raw,
    compared_against_url: comparedAgainstUrl,
    device_metadata: deviceMetadata,
    processing_time_ms: processingTime,
    processed_at: new Date().toISOString(),
  });

  // Set profile to pending review
  await supabase
    .from("profiles")
    .update({ photo_verification_status: "pending" })
    .eq("id", userId);

  return jsonResponse({
    verification_id: verification?.id ?? null,
    status: "needs_review",
    face_detected: true,
    moderation_passed: true,
    face_match_passed: false,
    face_match_similarity: faceMatchResult.similarity,
  });
}

async function insertVerification(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
) {
  return await supabase
    .from("photo_verifications")
    .insert(record)
    .select("id")
    .single();
}

async function deletePhoto(
  supabase: ReturnType<typeof createClient>,
  storagePath: string,
) {
  await supabase.storage.from("profile-photos").remove([storagePath]);
}

function getPublicUrl(
  supabase: ReturnType<typeof createClient>,
  storagePath: string,
): string {
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(storagePath);
  return data.publicUrl;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function jsonError(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}
