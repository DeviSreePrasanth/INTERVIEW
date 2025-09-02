const express = require("express");
const Candidate = require("../models/Candidate");
const Interview = require("../models/Interview");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/candidates
// @desc    Get all candidates
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { createdBy: req.user._id };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const candidates = await Candidate.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Add interview count for each candidate
    const candidatesWithInterviews = await Promise.all(
      candidates.map(async (candidate) => {
        const interviewCount = await Interview.countDocuments({
          candidate: candidate._id,
        });
        return {
          ...candidate.toObject(),
          interviews: interviewCount,
        };
      })
    );

    const total = await Candidate.countDocuments(query);

    res.json({
      candidates: candidatesWithInterviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get candidates error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/candidates/stats/summary
// @desc    Get candidates statistics
// @access  Private
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments({
      createdBy: req.user._id,
    });
    const activeCandidates = await Candidate.countDocuments({
      createdBy: req.user._id,
      status: "Active",
    });
    const hiredCandidates = await Candidate.countDocuments({
      createdBy: req.user._id,
      status: "Hired",
    });

    res.json({
      totalCandidates,
      activeCandidates,
      hiredCandidates,
      rejectedCandidates: totalCandidates - activeCandidates - hiredCandidates,
    });
  } catch (error) {
    console.error("Get candidate stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/candidates/:id
// @desc    Get single candidate
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(candidate);
  } catch (error) {
    console.error("Get candidate error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/candidates
// @desc    Create new candidate
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { name, email, role, phone, experience } = req.body;

    // Check if candidate with same email already exists for this user
    const existingCandidate = await Candidate.findOne({
      email,
      createdBy: req.user._id,
    });

    if (existingCandidate) {
      return res
        .status(400)
        .json({ message: "Candidate with this email already exists" });
    }

    const candidate = new Candidate({
      name,
      email,
      role,
      phone,
      experience,
      createdBy: req.user._id,
    });

    await candidate.save();

    res.status(201).json({
      message: "Candidate created successfully",
      candidate,
    });
  } catch (error) {
    console.error("Create candidate error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/candidates/:id
// @desc    Update candidate
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, email, role, phone, experience, status } = req.body;

    const candidate = await Candidate.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Check if email is being changed and if it already exists
    if (email !== candidate.email) {
      const existingCandidate = await Candidate.findOne({
        email,
        createdBy: req.user._id,
        _id: { $ne: req.params.id },
      });

      if (existingCandidate) {
        return res
          .status(400)
          .json({ message: "Candidate with this email already exists" });
      }
    }

    // Update fields
    candidate.name = name || candidate.name;
    candidate.email = email || candidate.email;
    candidate.role = role || candidate.role;
    candidate.phone = phone || candidate.phone;
    candidate.experience = experience || candidate.experience;
    candidate.status = status || candidate.status;

    await candidate.save();

    res.json({
      message: "Candidate updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("Update candidate error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/candidates/:id
// @desc    Delete candidate
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    await Candidate.findByIdAndDelete(req.params.id);

    res.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Delete candidate error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
