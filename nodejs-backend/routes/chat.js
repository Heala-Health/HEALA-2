const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseClient');

router.post('/', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return res.status(500).json({ error: 'Deepseek API key not configured' });
    }

    // Get auth user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

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
      await supabase.from("messages").insert([
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

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
