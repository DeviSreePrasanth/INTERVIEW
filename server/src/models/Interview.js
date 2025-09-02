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
    trim: true,
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

const analysisResultSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  expectedAnswer: {
    type: String,
    required: true,
  },
  candidateAnswer: {
    type: String,
    trim: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  feedback: {
    type: String,
    trim: true,
  },
});

const analysisSchema = new mongoose.Schema({
  technical_score: {
    type: Number,
    min: 0,
    max: 10,
  },
  communication_score: {
    type: Number,
    min: 0,
    max: 10,
  },
  confidence_score: {
    type: Number,
    min: 0,
    max: 10,
  },
  overall_score: {
    type: Number,
    min: 0,
    max: 10,
  },
  transcript: {
    type: String,
  },
  questionResponses: [analysisResultSchema],
  communicationMetrics: {
    grammarScore: Number,
    clarityScore: Number,
    fillerWords: Number,
    averageResponseTime: Number,
  },
  feedback: {
    type: String,
  },
  processed_at: {
    type: Date,
    default: Date.now,
  },
});

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interviewGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewGroup",
      required: true,
    },
    questions: [questionSchema],
    questionsFile: {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      path: String,
      url: String,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed"],
      default: "Completed",
    },
    analysisStatus: {
      type: String,
      enum: ["Pending", "Processing", "Analyzed", "Failed"],
      default: "Pending",
    },
    interviewFile: {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      path: String,
      url: String,
    },
    analysis: analysisSchema,
    notes: {
      type: String,
      trim: true,
    },
    interviewDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one interview per candidate per group
interviewSchema.index({ candidate: 1, interviewGroup: 1 }, { unique: true });

// Populate candidate and interviewer by default
interviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "candidate",
    select:
      "name email role phone experience college department batch cgpa skills",
  })
    .populate({
      path: "interviewer",
      select: "name email",
    })
    .populate({
      path: "interviewGroup",
      select: "name college department batch position",
    });
  next();
});

module.exports = mongoose.model("Interview", interviewSchema);
