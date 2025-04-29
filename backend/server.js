/**
 * FlowWrite Backend Server
 *
 * This server handles requests from the FlowWrite Chrome extension,
 * forwards them to the Google Gemini API, and returns suggestions.
 * It also optionally collects anonymous telemetry data.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

// Import routes
const apiRoutes = require("./routes/api");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Connect to MongoDB (for optional telemetry)
if (process.env.MONGODB_URI) {
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => console.error("MongoDB connection error:", err));
}

// Use routes
app.use("/api", apiRoutes);

// Basic route for testing
app.get("/", (req, res) => {
    res.json({ message: "FlowWrite API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
