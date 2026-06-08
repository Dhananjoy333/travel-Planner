const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// restrict cors to only accept from specific url
app.use(cors({
    origin: "https://travel-ease123.netlify.app"
}));

// Parse incoming JSON payloads
app.use(express.json());

// Proxy endpoint for Gemini API
app.post('/api/plan-itinerary', async (req, res) => {
    try {
        const { query, budget, pace } = req.body;
        console.log(query)

        if (!query) {
            return res.status(400).json({ error: "Query parameters are required." });
        }

        // Construct the structured prompt safely on the server side
        const structuredSystemPrompt = `You are a professional travel assistant agent inside the TravelEase ecosystem. 
The traveler is asking for: "${query}". 
Incorporate these parameters into your recommendation details:
- Budget Style: ${budget}
- Travel Intensity Pace: ${pace}.
Format your response cleanly with brief line breaks where appropriate. Do not use complex raw markdown syntax blocks like hashes, keep it clear and easy to read.`;

        const apiKey = process.env.GEMINI_API_KEY;
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

        // Forward the request payload to Google Gemini APIs
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: structuredSystemPrompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            return res.status(response.status).json({ error: "Failed to fetch response from Gemini AI." });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: "Internal server error occurred." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});