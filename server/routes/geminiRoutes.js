const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   POST api/gemini/chat
// @desc    Send query to Gemini API (proxied through backend)
// @access  Private
router.post('/chat', auth, async (req, res) => {
    const { userQuery, userData } = req.body;

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const arrayToString = (value) => {
        if (Array.isArray(value)) return value.join(', ');
        return value || '';
    };

    const profileContext = `
        User Profile Summary:
        Name: ${userData.name || 'N/A'}
        Age: ${userData.age || 'N/A'}
        Weight: ${userData.weight || 'N/A'} kg, Height: ${userData.height || 'N/A'} cm
        Goal: ${userData.goal || 'General Health'}
        Region: ${userData.region || 'All India'}
        Diet Preference: ${userData.dietPreference || 'N/A'}
        Health Issues: ${arrayToString(userData.healthIssues) || 'None'}
        Allergies: ${arrayToString(userData.allergies) || 'None'}
    `;

    const systemPrompt = `
        You are the Swasth Bharat AI Nutrition Assistant. Your primary goal is to provide accurate, safe, and personalized dietary and nutrition advice tailored for the Indian population.

        Knowledge Base: Your advice MUST be grounded in established Indian nutritional science, citing information relevant to the user's region, diet, and health condition. You MUST use the latest ICMR-NIN Dietary Guidelines for Indians (2024) and data from the Indian Food Composition Tables (IFCT 2017) as your foundation.

        Persona: Be helpful, empathetic, and encouraging. Respond concisely and clearly. Incorporate Hindi greetings (like Namaste) or phrases when appropriate.

        Instructions:
        1. Use the provided Google Search tool (grounding) to access current, specific, and external data, especially when discussing specific food items, clinical recommendations, or updated guidelines.
        2. When providing recipe ideas, prioritize ingredients common to the user's specified region (${userData.region || 'India'}).
        3. Always explicitly consider the user's **Health Issues** and **Allergies** in your response.
        4. Provide the answer in rich, conversational text format.

        ${profileContext}
    `;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const MAX_RETRIES = 5;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                let sources = [];
                
                if (candidate.groundingMetadata?.groundingAttributions) {
                    sources = candidate.groundingMetadata.groundingAttributions
                        .map(attr => ({
                            uri: attr.web?.uri,
                            title: attr.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }

                return res.json({ text, sources });
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            console.error(`Gemini API attempt ${i + 1} failed:`, error);
            if (i === MAX_RETRIES - 1) {
                return res.status(500).json({ 
                    text: "Sorry, I encountered an error. Please try again.", 
                    sources: [] 
                });
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
});

module.exports = router;