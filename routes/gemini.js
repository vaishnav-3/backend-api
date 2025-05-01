const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini client with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/gemini", async (req, res) => {
  const { village, block, district, state, facilities } = req.body;

  if (!village || !block || !district || !state) {
    return res.status(400).json({ error: "Missing location data" });
  }

  const facilityList = facilities?.map((f) => `- ${f.facilityName} (${f.category.trim()} - ${f.subcategory})`).join("\n") || "No facilities listed.";

  const prompt = `You are an expert in rural development. Based on the following information, provide 5 concise and impactful development suggestions for the village '${village}', located in block '${block}', district '${district}', state '${state}', India.

Available facilities in the village:
${facilityList}

Instructions:
- Each suggestion should be structured as an object with a 'title' and a 'points' array should be 6 suggestions.
- The 'title' should be a short heading with relevant emojis (e.g., 🚰 Water Supply, 🌾 Agriculture).
- The 'points' should be 2 short, concise, clear, and engaging bullet points describing actionable development ideas related to the title.
- Use a touch of local relevance wherever applicable to make each suggestion feel personalized for that location.
- DO NOT use markdown or any formatting symbols (e.g., ** or *).
- Return ONLY a valid JSON array of suggestions in the format:

[
  {
    "title": "🚰 Water Access",
    "points": [
      "Install community-level rainwater harvesting tanks.",
      "Promote drip irrigation to conserve water for crops."
    ]
  },
  ...
]

Only return the raw JSON array, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log("Gemini API response:", text);
    // We will parse the response as JSON array
    const suggestions = JSON.parse(text);

    // Send the response as structured suggestions
    res.json({ suggestions });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to fetch suggestions from Gemini." });
  }
});



// Development Score Calculation Route
router.post("/gemini-score", async (req, res) => {
  const { village, block, district, state, facilities } = req.body;

  if (!village || !block || !district || !state) {
    return res.status(400).json({ error: "Missing location data" });
  }

  const facilityList = facilities?.map((f) => `- ${f.facilityName} (${f.category.trim()} - ${f.subcategory})`).join("\n") || "No facilities listed.";

  const prompt = `You are an AI rural development analyst. Based on the village name "${village}" in ${block}, ${district}, ${state}, and the listed facilities, assess the development level of the following sectors: Education, Healthcare, Water Supply, and Electricity.

Provide:
1. A score from 0–100 for each sector.
2. A one-sentence reason for the score.
3. Include local context if possible.

Available facilities:
${facilityList}

Respond with ONLY a valid JSON object in the following format:
{
  "education": [ "score": 70, "reason": "One secondary school is available but no colleges." ],
  "healthcare": [ "score": 40, "reason": "Only one dispensary exists, no hospital nearby." ],
  "waterSupply": [ "score": 85, "reason": "Multiple tube wells and rainwater systems are active." ],
  "electricity": [ "score": 90, "reason": "Majority of households have stable electricity." ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log("Gemini API response:", text);

    const cleaned = text.replace(/```json|```/g, "").trim();
    const scores = JSON.parse(cleaned);

    res.json({ scores });
  } catch (error) {
    console.error("Gemini Score API error:", error);
    res.status(500).json({ error: "Failed to fetch development scores from Gemini." });
  }
});

// Village Progress Simulation Route
router.post("/gemini-progress", async (req, res) => {
  const { village, block, district, state, facilities } = req.body;

  if (!village || !block || !district || !state) {
    return res.status(400).json({ error: "Missing location data" });
  }

  const facilityList = facilities?.map((f) => `- ${f.facilityName} (${f.category.trim()} - ${f.subcategory})`).join("\n") || "No facilities listed.";

  const prompt = `
You are an AI rural progress simulator. Given the village "${village}" in ${block}, ${district}, ${state}, simulate the year-wise development score trends for the last five years (2019 to 2023) across four sectors: Education, Healthcare, Water Supply, and Electricity.

Consider the following facilities while estimating growth trends:
${facilityList}

Respond ONLY with a valid JSON array in the format:
[
  { "year": "2019", "education": 55, "healthcare": 40, "waterSupply": 50, "electricity": 60 },
  { "year": "2020", "education": 58, "healthcare": 43, "waterSupply": 54, "electricity": 65 },
  ...
  { "year": "2023", "education": 75, "healthcare": 60, "waterSupply": 70, "electricity": 90 }
]
Do not return anything else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log("Gemini Progress API response:", text);

    const cleaned = text.replace(/```json|```/g, "").trim();
    const progress = JSON.parse(cleaned);

    res.json({ progress });
  } catch (error) {
    console.error("Gemini Progress API error:", error);
    res.status(500).json({ error: "Failed to fetch development progress from Gemini." });
  }
});


module.exports = router;