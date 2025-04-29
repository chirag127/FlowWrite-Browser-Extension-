/**
 * API Routes for FlowWrite Backend
 *
 * This file defines the API routes for the FlowWrite backend:
 * - /suggest: Handles suggestion requests from the extension
 * - /telemetry: Collects anonymous telemetry data
 */

const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const Telemetry = require("../models/telemetry");

/**
 * POST /api/suggest
 *
 * Handles suggestion requests from the extension.
 * Receives text context and API key, forwards to Google Gemini API,
 * and returns suggestions.
 *
 * CRITICAL: API key is used only for the immediate request and not stored.
 */
router.post("/suggest", async (req, res) => {
    try {
        const { context, apiKey } = req.body;

        // Validate request
        if (!context || !apiKey) {
            return res
                .status(400)
                .json({ error: "Missing required parameters" });
        }

        // Initialize Google GenAI with the provided API key
        const ai = new GoogleGenAI({ apiKey });

        // Configure the request
        const config = {
            thinkingConfig: {
                thinkingBudget: 0,
            },
            responseMimeType: "text/plain",
        };

        // Use the model specified in the PRD
        const model = "gemini-2.5-flash-preview-04-17";
        // const model = 'gemini-2.0-flash-lite';

        // Prepare the content for the API request
        const contents = [
            {
                role: "user",
                parts: [
                    {
                        text: `Act as an inline writing suggestion tool (like GitHub Copilot for text). Predict a helpful and natural continuation (1-2 sentences max) for the following input, suitable for a real-time suggestion. Return *only* the predicted text continuation, nothing else. Input: "${context}"`,
                    },
                ],
            },
        ];

        // Generate content using the Gemini API
        const response = await ai.models.generateContentStream({
            model,
            contents,
            config,
        });

        // Collect the response chunks
        let suggestion = "";
        for await (const chunk of response) {
            suggestion += chunk.text || "";
        }
        console.log(suggestion);

        // Return the suggestion
        return res.json({ suggestion });
    } catch (error) {
        console.error("Error generating suggestion:", error);

        // Handle specific error types
        if (error.message?.includes("API key")) {
            return res.status(401).json({ error: "Invalid API key" });
        } else if (error.message?.includes("quota")) {
            return res.status(429).json({ error: "API quota exceeded" });
        } else if (error.message?.includes("unavailable")) {
            return res.status(503).json({ error: "Service unavailable" });
        }

        // Generic error
        return res.status(500).json({ error: "Failed to generate suggestion" });
    }
});

/**
 * POST /api/telemetry
 *
 * Collects anonymous telemetry data about suggestion acceptance.
 * No user-identifiable data or text content is stored.
 */
router.post("/telemetry", async (req, res) => {
    try {
        const { accepted } = req.body;

        // Only proceed if MongoDB is connected
        if (!process.env.MONGODB_URI) {
            return res.status(200).json({ message: "Telemetry not enabled" });
        }

        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update or create telemetry record for today
        await Telemetry.findOneAndUpdate(
            { date: today },
            { $inc: { acceptanceCount: accepted ? 1 : 0, totalCount: 1 } },
            { upsert: true }
        );

        return res.status(200).json({ message: "Telemetry recorded" });
    } catch (error) {
        console.error("Error recording telemetry:", error);
        // Don't fail the request if telemetry fails
        return res.status(200).json({ message: "Telemetry not recorded" });
    }
});

module.exports = router;
