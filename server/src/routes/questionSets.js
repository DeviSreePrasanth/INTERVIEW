const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const QuestionSet = require("../models/QuestionSet");
const auth = require("../middleware/auth");

const router = express.Router();

// Configure multer for question file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/questions");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "questions-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /json|csv|xlsx|txt/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JSON, CSV, XLSX, and TXT files are allowed"));
    }
  },
});

// @route   GET /api/question-sets
// @desc    Get all question sets
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, position, department, college } = req.query;
    const query = { createdBy: req.user._id };

    if (position) query.position = new RegExp(position, "i");
    if (department) query.department = new RegExp(department, "i");
    if (college) query.college = new RegExp(college, "i");

    const questionSets = await QuestionSet.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuestionSet.countDocuments(query);

    res.json({
      questionSets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching question sets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/question-sets/:id
// @desc    Get question set by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const questionSet = await QuestionSet.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!questionSet) {
      return res.status(404).json({ message: "Question set not found" });
    }

    res.json(questionSet);
  } catch (error) {
    console.error("Error fetching question set:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/question-sets
// @desc    Create question set manually
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, position, department, college, questions } =
      req.body;

    const questionSet = new QuestionSet({
      title,
      description,
      position,
      department,
      college,
      questions,
      createdBy: req.user._id,
    });

    await questionSet.save();

    res.status(201).json({
      message: "Question set created successfully",
      questionSet,
    });
  } catch (error) {
    console.error("Error creating question set:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/question-sets/upload
// @desc    Upload questions from file (JSON/CSV/Excel)
// @access  Private
router.post(
  "/upload",
  auth,
  upload.single("questionsFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, description, position, department, college } = req.body;
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      let questions = [];

      // Parse file based on type
      if (fileExtension === ".json") {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(fileContent);
        questions = data.questions || data;
      } else if (fileExtension === ".csv") {
        const csv = require("csv-parser");
        const results = [];

        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", resolve)
            .on("error", reject);
        });

        questions = results.map((row) => ({
          question: row.question || row.Question,
          expectedAnswer:
            row.expectedAnswer || row.ExpectedAnswer || row["Expected Answer"],
          category: row.category || row.Category || "general",
          difficulty: row.difficulty || row.Difficulty || "medium",
          points: parseInt(row.points || row.Points) || 10,
        }));
      } else if (fileExtension === ".txt") {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const lines = fileContent.split("\n").filter((line) => line.trim());

        for (let i = 0; i < lines.length; i += 2) {
          if (lines[i] && lines[i + 1]) {
            questions.push({
              question: lines[i].replace(/^Q:\s*/, "").trim(),
              expectedAnswer: lines[i + 1].replace(/^A:\s*/, "").trim(),
              category: "general",
              difficulty: "medium",
              points: 10,
            });
          }
        }
      }

      // Validate questions
      if (!questions.length) {
        return res
          .status(400)
          .json({ message: "No valid questions found in file" });
      }

      const questionSet = new QuestionSet({
        title,
        description,
        position,
        department,
        college,
        questions,
        createdBy: req.user._id,
      });

      await questionSet.save();

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.status(201).json({
        message: `Question set created successfully with ${questions.length} questions`,
        questionSet,
      });
    } catch (error) {
      console.error("Error uploading questions:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// @route   PUT /api/question-sets/:id
// @desc    Update question set
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      position,
      department,
      college,
      questions,
      isActive,
    } = req.body;

    const questionSet = await QuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({ message: "Question set not found" });
    }

    // Check ownership
    if (questionSet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update fields
    if (title) questionSet.title = title;
    if (description) questionSet.description = description;
    if (position) questionSet.position = position;
    if (department) questionSet.department = department;
    if (college) questionSet.college = college;
    if (questions) questionSet.questions = questions;
    if (typeof isActive !== "undefined") questionSet.isActive = isActive;

    await questionSet.save();

    res.json({
      message: "Question set updated successfully",
      questionSet,
    });
  } catch (error) {
    console.error("Error updating question set:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/question-sets/:id
// @desc    Delete question set
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const questionSet = await QuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({ message: "Question set not found" });
    }

    // Check ownership
    if (questionSet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await QuestionSet.findByIdAndDelete(req.params.id);

    res.json({ message: "Question set deleted successfully" });
  } catch (error) {
    console.error("Error deleting question set:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
