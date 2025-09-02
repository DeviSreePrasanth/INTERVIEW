const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  expectedAnswer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["technical", "behavioral", "situational", "general"],
    default: "general",
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  points: {
    type: Number,
    default: 10,
  },
});

const questionSetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      trim: true,
    },
    questions: [questionSchema],
    totalQuestions: {
      type: Number,
      default: function () {
        return this.questions.length;
      },
    },
    totalPoints: {
      type: Number,
      default: function () {
        return this.questions.reduce((sum, q) => sum + q.points, 0);
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Update totals before saving
questionSetSchema.pre("save", function (next) {
  this.totalQuestions = this.questions.length;
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  next();
});

module.exports = mongoose.model("QuestionSet", questionSetSchema);
