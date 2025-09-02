const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const auth = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video files
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "interviewFile") {
      // Video/audio files for interview
      const allowedTypes = /mp4|mp3|wav|avi|mov|m4a|aac/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only audio and video files are allowed for interview"));
      }
    } else if (file.fieldname === "questionsFile") {
      // PDF/document files for questions
      const allowedTypes = /pdf|doc|docx|txt|json/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );

      if (extname) {
        return cb(null, true);
      } else {
        cb(
          new Error(
            "Only PDF, DOC, DOCX, TXT, JSON files are allowed for questions"
          )
        );
      }
    } else {
      cb(new Error("Unknown file field"));
    }
  },
});

// @route   GET /api/interviews
// @desc    Get all interviews
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, analysisStatus } = req.query;
    const query = { interviewer: req.user._id };

    if (status) query.status = status;
    if (analysisStatus) query.analysisStatus = analysisStatus;

    const interviews = await Interview.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get interviews error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/interviews/stats/summary
// @desc    Get interview statistics
// @access  Private
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const totalInterviews = await Interview.countDocuments({
      interviewer: req.user._id,
    });
    const completedInterviews = await Interview.countDocuments({
      interviewer: req.user._id,
      status: "Completed",
    });
    const analyzedInterviews = await Interview.countDocuments({
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
    });
    const pendingAnalysis = await Interview.countDocuments({
      interviewer: req.user._id,
      analysisStatus: { $in: ["Pending", "Processing"] },
    });

    // Calculate average scores
    const analyzedInterviewsData = await Interview.find({
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
      "analysis.overall_score": { $exists: true },
    });

    let averageScore = 0;
    if (analyzedInterviewsData.length > 0) {
      const totalScore = analyzedInterviewsData.reduce(
        (sum, interview) => sum + (interview.analysis.overall_score || 0),
        0
      );
      averageScore =
        Math.round((totalScore / analyzedInterviewsData.length) * 10) / 10;
    }

    res.json({
      totalInterviews,
      completedInterviews,
      analyzedInterviews,
      pendingAnalysis,
      averageScore,
    });
  } catch (error) {
    console.error("Get interview stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get single interview
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json(interview);
  } catch (error) {
    console.error("Get interview error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/interviews
// @desc    Create new interview with file upload
// @route   POST /api/interviews
// @desc    Create a new interview with video and questions
// @access  Private
router.post(
  "/",
  auth,
  upload.fields([
    { name: "interviewFile", maxCount: 1 },
    { name: "questionsFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        candidateName,
        candidateEmail,
        candidatePhone,
        candidateCollege,
        candidateDepartment,
        candidateBatch,
        candidateCGPA,
        candidateSkills,
        position,
        department,
        interviewGroup,
        notes,
        questions,
      } = req.body;

      // Create or find candidate
      let candidate = await Candidate.findOne({
        email: candidateEmail,
        createdBy: req.user._id,
      });

      if (!candidate) {
        candidate = new Candidate({
          name: candidateName,
          email: candidateEmail,
          phone: candidatePhone,
          role: position,
          college: candidateCollege,
          department: candidateDepartment,
          batch: candidateBatch,
          cgpa: candidateCGPA ? parseFloat(candidateCGPA) : undefined,
          skills: candidateSkills
            ? candidateSkills.split(",").map((s) => s.trim())
            : [],
          createdBy: req.user._id,
        });
        await candidate.save();
      }

      // Parse questions if provided as string
      let parsedQuestions = [];
      if (questions) {
        try {
          parsedQuestions =
            typeof questions === "string" ? JSON.parse(questions) : questions;
        } catch (error) {
          return res.status(400).json({ message: "Invalid questions format" });
        }
      }

      // Create interview object
      const interviewData = {
        candidate: candidate._id,
        interviewer: req.user._id,
        interviewGroup: interviewGroup || null,
        questions: parsedQuestions,
        position,
        department,
        notes,
        status: "Completed",
        analysisStatus: "Pending",
      };

      // Add interview file information if uploaded
      if (req.files && req.files.interviewFile) {
        const file = req.files.interviewFile[0];
        interviewData.interviewFile = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`,
        };
      }

      // Add questions file information if uploaded
      if (req.files && req.files.questionsFile) {
        const file = req.files.questionsFile[0];
        interviewData.questionsFile = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`,
        };
      }

      const interview = new Interview(interviewData);
      await interview.save();

      // Populate the created interview
      await interview.populate([
        {
          path: "candidate",
          select:
            "name email role phone experience college department batch cgpa skills",
        },
        { path: "interviewer", select: "name email" },
        {
          path: "interviewGroup",
          select: "name college department batch position",
        },
      ]);

      // Mock AI analysis (replace with actual AI service call)
      setTimeout(async () => {
        try {
          const analysisResult = {
            technical_score: Math.round((Math.random() * 3 + 7) * 10) / 10, // 7-10 range
            communication_score: Math.round((Math.random() * 3 + 7) * 10) / 10,
            confidence_score: Math.round((Math.random() * 3 + 7) * 10) / 10,
            transcript: "Mock transcript of the interview...",
            questionAnalysis: parsedQuestions.map((q) => ({
              question: q.question,
              candidateAnswer: "Mock candidate answer...",
              expectedAnswer: q.expectedAnswer,
              score: Math.round((Math.random() * 3 + 7) * 10) / 10,
              feedback: "Mock feedback for this question...",
            })),
            communicationMetrics: {
              grammarScore: Math.round((Math.random() * 2 + 8) * 10) / 10,
              clarityScore: Math.round((Math.random() * 2 + 8) * 10) / 10,
              fillerWords: Math.floor(Math.random() * 20 + 5),
              averageResponseTime:
                Math.round((Math.random() * 3 + 2) * 10) / 10,
            },
            feedback: "Overall mock feedback for the interview...",
          };

          // Calculate overall score
          analysisResult.overall_score =
            Math.round(
              ((analysisResult.technical_score +
                analysisResult.communication_score +
                analysisResult.confidence_score) /
                3) *
                10
            ) / 10;

          // Update interview with analysis
          await Interview.findByIdAndUpdate(interview._id, {
            analysis: analysisResult,
            analysisStatus: "Analyzed",
          });

          console.log(`Analysis completed for interview ${interview._id}`);
        } catch (error) {
          console.error("Analysis simulation error:", error);
          await Interview.findByIdAndUpdate(interview._id, {
            analysisStatus: "Failed",
          });
        }
      }, 3000); // Simulate 3 second processing time

      res.status(201).json({
        message: "Interview created successfully",
        interview,
      });
    } catch (error) {
      console.error("Create interview error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// @route   PUT /api/interviews/:id
// @desc    Update interview
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { questions, notes, status } = req.body;

    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Update fields
    if (questions) interview.questions = questions;
    if (notes) interview.notes = notes;
    if (status) interview.status = status;

    await interview.save();

    res.json({
      message: "Interview updated successfully",
      interview,
    });
  } catch (error) {
    console.error("Update interview error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/interviews/:id
// @desc    Delete interview
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Delete associated file if exists
    if (interview.interviewFile && interview.interviewFile.path) {
      try {
        fs.unlinkSync(interview.interviewFile.path);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }

    await Interview.findByIdAndDelete(req.params.id);

    res.json({ message: "Interview deleted successfully" });
  } catch (error) {
    console.error("Delete interview error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
