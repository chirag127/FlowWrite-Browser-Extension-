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
        const { context, apiKey, pageContext } = req.body;

        // Validate request
        if (!context || !apiKey) {
            return res
                .status(400)
                .json({ error: "Missing required parameters" });
        }

        // Log if page context is provided (for debugging)
        if (pageContext) {
            console.log("Page context provided:", {
                size: JSON.stringify(pageContext).length,
                fields: Object.keys(pageContext),
                pageContentSize: pageContext.pageContent
                    ? pageContext.pageContent.length
                    : 0,
                inputFieldContextSize: pageContext.inputFieldContext
                    ? pageContext.inputFieldContext.length
                    : 0,
                relevantSectionsCount: pageContext.relevantSections
                    ? pageContext.relevantSections.length
                    : 0,
            });
            console.log("Page content:", pageContext.pageContent);
            console.log("Input field context:", pageContext.inputFieldContext);
            console.log("Relevant sections:", pageContext.relevantSections);
            console.log("Page title:", pageContext.pageTitle);
            console.log("Page URL:", pageContext.pageUrl);
            console.log("Meta description:", pageContext.pageMeta);
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
        let contents = `**Role:** You are an AI inline writing assistant, like GitHub Copilot for general text.
**Goal:** Predict the most likely and helpful text continuation based on the user's input. The suggestion should be contextually relevant, and natural-sounding.
**Context:** This suggestion will appear inline in real-time as the user types in any web text field (email, chat, form, etc.). The user accepts it by pressing the **Tab** key or by clicking directly on the suggestion.
**Output Requirements:**
*   Return *only* the raw predicted text continuation after the user's cursor.
*   Do *not* include any preamble, labels, explanations, or markdown formatting.
*   Include a leading space *if and only if* it is grammatically appropriate to follow the provided input text (e.g., if the input doesn't end in a space).
*   Avoid suggestions that are too generic or unrelated to the context.
*   IMPORTANT: only send the suggestion if you are more confident than 80% that it is correct. If you are not confident, return an empty string.
*   Avoid excessive repetition of the same word or phrase.`;

        // Add page context if available
        if (pageContext) {
            contents += `\n\n**Page Context:**
* Page Title: "${pageContext.pageTitle || ""}"
* Page URL: "${pageContext.pageUrl || ""}"
* Meta Description: "${pageContext.pageMeta || ""}"
* Input Field Context: "${pageContext.inputFieldContext || ""}"
* Relevant Sections: ${JSON.stringify(pageContext.relevantSections || [])}
* Page Content: "${pageContext.pageContent || ""}"`;
        }

        // Add the user's input text
        contents += `\n\n**Text before caret:**
"${context}"`;

        // Generate content using the Gemini API without streaming
        const response = await ai.models.generateContent({
            model,
            contents,
            config,
        });

        // Collect the response chunks
        let suggestion = response.text || ""; // Fallback to empty string if no text is returned

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
 *
 * @param {boolean} accepted - Whether the suggestion was accepted
 * @param {string} interactionType - How the suggestion was accepted (tab, click, etc.)
 */
router.post("/telemetry", async (req, res) => {
    try {
        const { accepted, interactionType = "tab" } = req.body;

        // Only proceed if MongoDB is connected
        if (!process.env.MONGODB_URI) {
            return res.status(200).json({ message: "Telemetry not enabled" });
        }

        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Prepare the update object
        const updateObj = {
            $inc: {
                acceptanceCount: accepted ? 1 : 0,
                totalCount: 1,
            },
        };

        // Track interaction types separately
        if (accepted && interactionType) {
            // Use MongoDB's dot notation to increment the specific interaction type counter
            updateObj.$inc[`interactionTypes.${interactionType}`] = 1;
        }

        // Update or create telemetry record for today
        await Telemetry.findOneAndUpdate({ date: today }, updateObj, {
            upsert: true,
        });

        return res.status(200).json({ message: "Telemetry recorded" });
    } catch (error) {
        console.error("Error recording telemetry:", error);
        // Don't fail the request if telemetry fails
        return res.status(200).json({ message: "Telemetry not recorded" });
    }
});

module.exports = router;
