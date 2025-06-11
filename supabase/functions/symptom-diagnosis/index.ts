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
    const { symptoms } = await req.json();

    if (!symptoms) {
      return new Response(JSON.stringify({ error: 'Missing symptoms input' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY"); // Assuming this is set as a Supabase secret
    if (!deepseekApiKey) {
      throw new Error("Deepseek API key not configured");
    }

    // Get auth user (optional, but good for logging/auditing)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    // Define the system prompt for the AI
    const systemPrompt = `You are a highly knowledgeable medical AI assistant specializing in common diseases and health conditions prevalent in Nigeria.
    When a user describes their symptoms, provide a concise and informative diagnosis.
    Your response MUST be a JSON object with the following structure:
    {
      "possibleConditions": [
        {
          "name": "Condition Name",
          "severity": "low" | "medium" | "high" | "critical",
          "advice": "General advice for this condition.",
          "recommendedAction": "Specific action to take (e.g., 'Rest and hydrate', 'See a general practitioner', 'Seek immediate medical attention').",
          "specialistRequired": "Optional: e.g., 'Cardiologist', 'Pediatrician', 'Infectious Disease Specialist'"
        },
        // ... up to 3 most likely conditions
      ],
      "disclaimer": "IMPORTANT: This information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment."
    }
    
    Prioritize conditions common in Nigeria such as Malaria, Typhoid, Cholera, Lassa Fever, Tuberculosis, HIV/AIDS, Hypertension, Diabetes, etc.
    Ensure the 'severity' is appropriate for the condition.
    If no specific condition can be confidently identified, provide general health advice and strongly recommend seeing a doctor.
    Always include the disclaimer.`;

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
              content: systemPrompt
            },
            {
              role: "user",
              content: `Symptoms: ${symptoms}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          response_format: { type: "json_object" } // Request JSON output
        })
      }
    );

    const data = await response.json();
    const aiResponseContent = data.choices?.[0]?.message?.content;

    if (!aiResponseContent) {
      throw new Error("AI did not return a valid response.");
    }

    // Attempt to parse the AI's JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", aiResponseContent, parseError);
      throw new Error("AI returned an unparseable response.");
    }

    return new Response(
      JSON.stringify(parsedResponse), // Return the parsed JSON directly
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
