// File: /village-info-backend/routes/gemini.js

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

  const prompt = `You are an expert in rural development. Suggest realistic and impactful development ideas for the village '${village}', located in block '${block}', district '${district}', state '${state}', India.

Available facilities in the village:
${facilityList}

Based on this, what areas (education, healthcare, agriculture, transportation, etc.) need attention and what should be developed or improved? Present your answer in bullet points.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ suggestions: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to fetch suggestions from Gemini." });
  }
});

module.exports = router;
