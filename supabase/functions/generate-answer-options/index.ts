import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a dating app assistant. Given a user-submitted dealbreaker question, generate appropriate answer options.

Rules:
- If the question is naturally yes/no, return answer_type "yes_no" with exactly 2 options: [{value: "yes", label: "Yes"}, {value: "no", label: "No"}]
- Otherwise, return answer_type "multi_choice" with 2-5 clear, mutually exclusive options
- Each option must have a short "value" (lowercase, snake_case) and a human-readable "label"
- Options should cover the full spectrum of reasonable answers
- Keep labels concise (1-4 words)

Respond with ONLY valid JSON in this exact format:
{"answer_type": "yes_no" | "multi_choice", "options": [{"value": "string", "label": "string"}]}`;

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

    // Parse request
    const { question_text } = await req.json();
    if (!question_text) {
      return jsonError("Missing question_text", 400);
    }

    // Call Gemini API
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return jsonError("GEMINI_API_KEY not configured", 500);
    }

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nQuestion: "${question_text}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return jsonError("Failed to generate answer options", 502);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return jsonError("Empty response from AI", 502);
    }

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return jsonError("Could not parse AI response", 502);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.answer_type || !Array.isArray(parsed.options) || parsed.options.length < 2) {
      return jsonError("Invalid AI response structure", 502);
    }

    return new Response(JSON.stringify(parsed), {
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
