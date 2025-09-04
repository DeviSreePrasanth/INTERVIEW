const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    college: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Hired", "Rejected"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for search functionality
candidateSchema.index({ name: "text", email: "text", role: "text" });

module.exports = mongoose.model("Candidate", candidateSchema);
