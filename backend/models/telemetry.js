/**
 * Telemetry Model
 *
 * This model defines the schema for telemetry data collection.
 * It stores anonymous aggregated data about suggestion acceptance rates.
 * No user-identifiable data or text content is stored.
 */

const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
    {
        // Date of the telemetry record (day granularity)
        date: {
            type: Date,
            required: true,
            unique: true,
        },

        // Number of suggestions accepted
        acceptanceCount: {
            type: Number,
            default: 0,
        },

        // Total number of suggestions shown
        totalCount: {
            type: Number,
            default: 0,
        },

        // Interaction types (how suggestions were accepted)
        interactionTypes: {
            type: Map,
            of: Number,
            default: {
                tab: 0,
                click: 0,
                "global-click": 0,
                escape: 0,
            },
        },
    },
    {
        // Add timestamps for record creation and updates
        timestamps: true,
    }
);

// Add a virtual property for acceptance rate
telemetrySchema.virtual("acceptanceRate").get(function () {
    if (this.totalCount === 0) return 0;
    return this.acceptanceCount / this.totalCount;
});

// Ensure virtuals are included in JSON output
telemetrySchema.set("toJSON", { virtuals: true });
telemetrySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Telemetry", telemetrySchema);
