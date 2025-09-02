const mongoose = require("mongoose");

const interviewGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    college: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Completed", "Archived"],
      default: "Draft",
    },
    interviewDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    maxCandidates: {
      type: Number,
      default: 100,
    },
    currentCandidates: {
      type: Number,
      default: 0,
    },
    statistics: {
      totalInterviews: { type: Number, default: 0 },
      completedInterviews: { type: Number, default: 0 },
      analyzedInterviews: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      topScore: { type: Number, default: 0 },
      lowestScore: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Add index for search functionality
interviewGroupSchema.index({ name: "text", college: "text", position: "text" });

// Pre-save middleware to update statistics
interviewGroupSchema.pre("save", async function (next) {
  if (this.isModified("statistics") || this.isNew) {
    // Statistics will be updated by the Interview model hooks
  }
  next();
});

module.exports = mongoose.model("InterviewGroup", interviewGroupSchema);
