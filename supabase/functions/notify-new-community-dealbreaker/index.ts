import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

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
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing authorization header", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    // Check admin
    const { data: adminData } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminData) {
      return jsonError("Forbidden: admin access required", 403);
    }

    const { question_id } = await req.json();
    if (!question_id) {
      return jsonError("Missing question_id", 400);
    }

    // Get the question text for the notification
    const { data: question, error: qError } = await supabase
      .from("community_dealbreaker_questions")
      .select("question_text")
      .eq("id", question_id)
      .single();

    if (qError || !question) {
      return jsonError("Question not found", 404);
    }

    // Fetch all active push tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("is_active", true);

    if (tokenError) {
      return jsonError("Failed to fetch push tokens", 500);
    }

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent_count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send notifications in batches
    let sentCount = 0;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map((t: { token: string }) => ({
        to: t.token,
        sound: "default",
        title: "New Community Dealbreaker!",
        body: "A new garden rule has been planted. Answer it to refine your matches!",
        data: {
          type: "community_dealbreaker",
          questionId: question_id,
        },
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });

      if (response.ok) {
        sentCount += batch.length;
      } else {
        console.error("Expo push error:", await response.text());
      }
    }

    return new Response(JSON.stringify({ sent_count: sentCount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return jsonError("Internal server error", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
