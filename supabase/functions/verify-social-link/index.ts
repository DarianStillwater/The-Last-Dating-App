import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

/**
 * Verify a social media link (Instagram or LinkedIn).
 *
 * Expected body:
 *   { provider: "instagram" | "linkedin", access_token: string }
 *
 * The function validates the token against the provider's API,
 * extracts the user ID and username, and stores a verified link.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing authorization header", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    const { provider, access_token } = await req.json();

    if (!provider || !access_token) {
      return jsonError("Missing provider or access_token");
    }

    if (!["instagram", "linkedin"].includes(provider)) {
      return jsonError("Invalid provider. Must be 'instagram' or 'linkedin'.");
    }

    let providerUserId: string;
    let providerUsername: string;

    if (provider === "instagram") {
      // Instagram Basic Display API / Graph API
      const res = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`,
      );

      if (!res.ok) {
        return jsonError("Failed to verify Instagram token. Please try again.");
      }

      const data = await res.json();
      providerUserId = data.id;
      providerUsername = data.username;
    } else {
      // LinkedIn userinfo endpoint (OpenID Connect)
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!res.ok) {
        return jsonError(
          "Failed to verify LinkedIn token. Please try again.",
        );
      }

      const data = await res.json();
      providerUserId = data.sub;
      providerUsername = data.name || data.email || data.sub;
    }

    // Upsert the social link
    const { error: upsertError } = await supabase
      .from("social_links")
      .upsert(
        {
          user_id: user.id,
          provider,
          provider_user_id: providerUserId,
          provider_username: providerUsername,
          verified: true,
          linked_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );

    if (upsertError) {
      return jsonError(`Database error: ${upsertError.message}`, 500);
    }

    // Recalculate trust score
    await supabase.rpc("calculate_trust_score", {
      target_user_id: user.id,
    });

    return jsonResponse({
      success: true,
      provider,
      username: providerUsername,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonError(message, 500);
  }
});
