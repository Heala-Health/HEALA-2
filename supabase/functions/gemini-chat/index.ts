
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId } = await req.json();
    
    const deepseekApiKey = "sk-acbf08689b8c4be984c98b87e8267925";
    if (!deepseekApiKey) {
      throw new Error("Deepseek API key not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6em5veGN0cXliY2JlcnJrZ2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA3NzY5MywiZXhwIjoyMDYzNjUzNjkzfQ.j2UuVL1Ai07V3dzPgDk3GPVVi7Elk2-FtJpjr04OGug") ?? ""
    );

    // Get auth user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) throw new Error("User not authenticated");

    // Call Deepseek API
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a helpful medical AI assistant. Please provide helpful, informative responses about health and medical topics. Always remind users to consult with healthcare professionals for serious concerns."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Save the conversation to database if conversationId is provided
    if (conversationId) {
      await supabaseClient.from("messages").insert([
        {
          conversation_id: conversationId,
          content: message,
          sender_type: "patient",
          sender_id: user.id
        },
        {
          conversation_id: conversationId,
          content: aiResponse,
          sender_type: "ai",
          message_type: "text"
        }
      ]);
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
