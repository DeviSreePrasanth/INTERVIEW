const mongoose = require("mongoose");

const audioSessionSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  path: String,
  url: String,
  transcript: String,
  analysisStatus: {
    type: String,
    enum: ["Pending", "Processing", "Analyzed", "Failed"],
    default: "Pending",
  },
  analysisError: String,
  analysis: {
    transcript: String,
    segments: [
      new mongoose.Schema(
        {
          start: Number,
          end: Number,
          text: String,
        },
        { _id: false }
      ),
    ],
    communicationMetrics: {
      wordsPerMinute: Number,
      totalWords: Number,
      duration: Number,
      durationSeconds: Number,
    },
    metadata: {
      processingTimeMs: Number,
      model: String,
      language: String,
      createdAt: Date,
    },
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

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
      required: false, // Make this optional
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
    // Multiple audio sessions support
    audioSessions: [audioSessionSchema],

    // Legacy fields for backward compatibility
    // Uploaded interview audio/video file metadata
    interviewFile: {
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
    notes: {
      type: String,
      trim: true,
    },
    interviewDate: {
      type: Date,
      default: Date.now,
    },
    // Simple transcript field for quick access (flat string)
    transcript: {
      type: String,
      trim: true,
    },
    // Processing state for automated analysis / transcription
    analysisStatus: {
      type: String,
      enum: ["Pending", "Processing", "Analyzed", "Failed"],
      default: "Pending",
      index: true,
    },
    analysisError: {
      type: String,
      trim: true,
    },
    // Rich analysis object (extensible)
    analysis: {
      transcript: { type: String, trim: true },
      segments: [
        new mongoose.Schema(
          {
            start: Number,
            end: Number,
            text: String,
          },
          { _id: false }
        ),
      ],
      communicationMetrics: {
        wordsPerMinute: Number,
        totalWords: Number,
        duration: Number, // in seconds
        durationSeconds: Number, // alias / backward compatibility
      },
      metadata: {
        processingTimeMs: Number,
        model: String,
        language: String,
        createdAt: Date,
      },
    },
    // Optional generated report file
    reportFile: {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      path: String,
      url: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance (no unique constraint to allow multiple interviews per candidate)
interviewSchema.index(
  { candidate: 1, interviewGroup: 1 },
  { name: "candidate_interviewGroup_lookup" }
);
interviewSchema.index({ candidate: 1 }, { name: "candidate_lookup" });
interviewSchema.index({ interviewer: 1 }, { name: "interviewer_lookup" });
interviewSchema.index({ interviewDate: -1 }, { name: "date_lookup" });

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
