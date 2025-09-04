const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const InterviewGroup = require("../models/InterviewGroup");
const auth = require("../middleware/auth");
const {
  updateInterviewGroupStats,
} = require("../services/interviewGroupService");

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
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
  },
  fileFilter: (req, file, cb) => {
    console.log(`Processing file: ${file.fieldname} - ${file.originalname}`);

    if (file.fieldname === "interviewFile") {
      // Video/audio files for interview - expanded to include more formats
      const allowedTypes = /mp4|mp3|wav|avi|mov|m4a|aac|ogg|flac|webm/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );

      if (extname) {
        console.log(`Accepted audio/video file: ${file.originalname}`);
        return cb(null, true);
      } else {
        console.log(`Rejected file: ${file.originalname} - Invalid type`);
        cb(new Error("Only audio and video files are allowed for interview"));
      }
    } else if (file.fieldname === "questionsFile") {
      // PDF/document files for questions
      const allowedTypes = /pdf|doc|docx|txt|json/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );

      if (extname) {
        console.log(`Accepted document file: ${file.originalname}`);
        return cb(null, true);
      } else {
        console.log(
          `Rejected file: ${file.originalname} - Invalid document type`
        );
        cb(
          new Error(
            "Only PDF, DOC, DOCX, TXT, JSON files are allowed for questions"
          )
        );
      }
    } else {
      console.log(`Unknown file field: ${file.fieldname}`);
      cb(new Error("Unknown file field"));
    }
  },
});

// @route   GET /api/interviews
// @desc    Get all interviews
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      analysisStatus,
      interviewGroup,
    } = req.query;
    const query = { interviewer: req.user._id };

    if (status) query.status = status;
    if (analysisStatus) query.analysisStatus = analysisStatus;

    // Only add interviewGroup filter if it's a valid ObjectId
    if (
      interviewGroup &&
      interviewGroup !== "undefined" &&
      interviewGroup !== "null"
    ) {
      // Validate that it's a proper ObjectId format
      if (/^[0-9a-fA-F]{24}$/.test(interviewGroup)) {
        query.interviewGroup = interviewGroup;
      } else {
        console.log(
          `Invalid interviewGroup ObjectId format: ${interviewGroup}`
        );
      }
    }

    console.log("Interview query:", query);

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
    const baseQuery = { interviewer: req.user._id };
    const totalInterviews = await Interview.countDocuments(baseQuery);
    const completedInterviews = await Interview.countDocuments({
      ...baseQuery,
      status: "Completed",
    });
    const analyzedInterviews = await Interview.countDocuments({
      ...baseQuery,
      analysisStatus: "Analyzed",
    });
    const pendingAnalysis = await Interview.countDocuments({
      ...baseQuery,
      analysisStatus: { $in: ["Pending", "Processing"] },
    });

    // Instead of average score (removed scoring), compute average word count for analyzed transcripts
    const analyzedWithTranscript = await Interview.find({
      ...baseQuery,
      analysisStatus: "Analyzed",
      "analysis.transcript": { $exists: true, $ne: null },
    }).select("analysis.transcript");

    let averageWordCount = 0;
    if (analyzedWithTranscript.length > 0) {
      const totalWords = analyzedWithTranscript.reduce((sum, i) => {
        const wc = (i.analysis.transcript || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        return sum + wc;
      }, 0);
      averageWordCount = Math.round(totalWords / analyzedWithTranscript.length);
    }

    res.json({
      totalInterviews,
      completedInterviews,
      analyzedInterviews,
      pendingAnalysis,
      averageWordCount,
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
  (req, res, next) => {
    // Add error handling middleware for multer
    upload.fields([
      { name: "interviewFile", maxCount: 1 },
      { name: "questionsFile", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "File too large. Maximum size is 100MB.",
          });
        }
        return res.status(400).json({
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log("=== Creating new interview ===");
      console.log(
        "Files received:",
        req.files ? Object.keys(req.files) : "No files"
      );
      console.log("Body received:", Object.keys(req.body));
      console.log("User ID:", req.user?._id);

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
        interviewerName, // Add this field
      } = req.body;

      console.log("Extracted fields:", {
        candidateName,
        candidateEmail,
        position: position || "Interview Position",
        department: department || "General",
      });

      // Validate required fields
      if (!candidateName || !candidateEmail) {
        console.log("Validation failed: Missing required fields");
        return res.status(400).json({
          message: "Candidate name and email are required",
        });
      }

      console.log("=== Creating/Finding candidate ===");

      console.log("=== Creating/Finding candidate ===");

      // Create or find candidate
      let candidate = await Candidate.findOne({
        email: candidateEmail,
        createdBy: req.user._id,
      });

      if (!candidate) {
        console.log("Creating new candidate...");
        candidate = new Candidate({
          name: candidateName,
          email: candidateEmail,
          phone: candidatePhone,
          role: position || "Interview Position",
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
        console.log("New candidate created:", candidate._id);
      } else {
        console.log("Found existing candidate:", candidate._id);
      }

      console.log("=== Processing questions ===");

      console.log("=== Processing questions ===");

      // Parse questions if provided as string
      let parsedQuestions = [];
      if (questions) {
        try {
          parsedQuestions =
            typeof questions === "string" ? JSON.parse(questions) : questions;
          console.log("Questions parsed successfully:", parsedQuestions.length);
        } catch (error) {
          console.log("Questions parsing failed:", error.message);
          return res.status(400).json({ message: "Invalid questions format" });
        }
      }

      console.log("=== Creating interview object ===");

      console.log("=== Creating interview object ===");

      // Create interview object
      const interviewData = {
        candidate: candidate._id,
        interviewer: req.user._id,
        interviewGroup: interviewGroup || null,
        questions: parsedQuestions,
        position: position || "Interview Position",
        department: department || "General",
        notes: notes || "",
        status: "Completed",
        analysisStatus: "Pending",
      };

      console.log("Interview data prepared:", {
        candidateId: interviewData.candidate,
        interviewerId: interviewData.interviewer,
        position: interviewData.position,
        hasQuestions: parsedQuestions.length > 0,
      });

      console.log("=== Processing files ===");

      console.log("=== Processing files ===");

      // Add interview file information if uploaded
      if (req.files && req.files.interviewFile) {
        const file = req.files.interviewFile[0];
        console.log(
          "Interview file found:",
          file.originalname,
          "Size:",
          file.size
        );
        interviewData.interviewFile = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`,
        };
      } else {
        console.log("No interview file uploaded");
      }

      // Add questions file information if uploaded
      if (req.files && req.files.questionsFile) {
        const file = req.files.questionsFile[0];
        console.log("Questions file found:", file.originalname);
        interviewData.questionsFile = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`,
        };
      }

      console.log("=== Saving interview to database ===");

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

      // Start processing immediately if audio file is uploaded
      if (interviewData.interviewFile && interviewData.interviewFile.path) {
        console.log("=== Starting automatic speech-to-text processing ===");

        // Update status to processing immediately
        await Interview.findByIdAndUpdate(interview._id, {
          analysisStatus: "Processing",
        });

        // Audio file uploaded successfully - no processing needed
        console.log("Interview audio file saved successfully");
      } else {
        // No audio file uploaded, create simple placeholder
        setTimeout(async () => {
          try {
            const analysisResult = {
              transcript: "No audio file provided for transcription.",
              metadata: {
                processingTime: new Date().toISOString(),
              },
              communicationMetrics: {
                wordsPerMinute: 0,
                totalWords: 0,
                duration: 0,
                durationSeconds: 0,
              },
            };

            await Interview.findByIdAndUpdate(interview._id, {
              analysis: analysisResult,
              analysisStatus: "Analyzed",
            });

            console.log(
              `Placeholder analysis completed for interview ${interview._id}`
            );
          } catch (error) {
            console.error("Placeholder analysis error:", error);
            await Interview.findByIdAndUpdate(interview._id, {
              analysisStatus: "Failed",
            });
          }
        }, 2000);
      }

      console.log("=== Interview creation successful ===");
      res.status(201).json({
        message: "Interview created successfully",
        interview,
      });
    } catch (error) {
      console.error("=== Create interview error ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // Return more specific error information
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          details: error.message,
        });
      }

      if (error.name === "MongoError" || error.name === "MongooseError") {
        return res.status(500).json({
          message: "Database error",
          details: error.message,
        });
      }

      res.status(500).json({
        message: "Server error",
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
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

// @route   GET /api/interviews/:id/report
// @desc    Download interview report PDF
// @access  Private
router.get("/:id/report", auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (!interview.reportFile || !interview.reportFile.path) {
      return res.status(404).json({
        message: "Report not found. Please process the interview first.",
      });
    }

    // Check if file exists
    if (!fs.existsSync(interview.reportFile.path)) {
      return res
        .status(404)
        .json({ message: "Report file not found on server" });
    }

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${interview.reportFile.filename}"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(interview.reportFile.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/interviews/:id/status
// @desc    Get processing status of an interview
// @access  Private
router.get("/:id/status", auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    }).select("analysisStatus analysisError reportFile");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({
      analysisStatus: interview.analysisStatus,
      hasReport: !!interview.reportFile,
      reportUrl: interview.reportFile ? interview.reportFile.url : null,
      error: interview.analysisError || null,
    });
  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
