const express = require("express");
const InterviewGroup = require("../models/InterviewGroup");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/interview-groups
// @desc    Get all interview groups
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, college, position } = req.query;
    const query = { recruiterId: req.user._id };

    if (status) query.status = status;
    if (college) query.college = new RegExp(college, "i");
    if (position) query.position = new RegExp(position, "i");

    const interviewGroups = await InterviewGroup.find(query)
      .populate("recruiterId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get interview counts for each group
    const groupsWithCounts = await Promise.all(
      interviewGroups.map(async (group) => {
        const interviewCount = await Interview.countDocuments({
          interviewGroup: group._id,
        });
        
        // Update the currentCandidates field with the actual interview count
        await InterviewGroup.findByIdAndUpdate(group._id, {
          currentCandidates: interviewCount,
        });
        
        return {
          ...group.toObject(),
          currentCandidates: interviewCount,
        };
      })
    );

    const total = await InterviewGroup.countDocuments(query);

    res.json({
      interviewGroups: groupsWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching interview groups:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/interview-groups/:id
// @desc    Get interview group by ID with interviews
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const interviewGroup = await InterviewGroup.findById(
      req.params.id
    ).populate("recruiterId", "name email");

    if (!interviewGroup) {
      return res.status(404).json({ message: "Interview group not found" });
    }

    // Get all interviews in this group
    const interviews = await Interview.find({ interviewGroup: req.params.id })
      .populate("candidate")
      .sort({ createdAt: -1 });

    // Update the currentCandidates field with the actual interview count
    const updatedGroup = await InterviewGroup.findByIdAndUpdate(
      req.params.id,
      { currentCandidates: interviews.length },
      { new: true }
    ).populate("recruiterId", "name email");

    res.json({
      interviewGroup: updatedGroup,
      interviews,
      totalInterviews: interviews.length,
    });
  } catch (error) {
    console.error("Error fetching interview group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/interview-groups
// @desc    Create new interview group
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      college,
      department,
      batch,
      position,
      interviewDate,
      location,
      instructions,
      maxCandidates,
    } = req.body;

    // Check if group name already exists for this recruiter
    const existingGroup = await InterviewGroup.findOne({
      name: name.trim(),
      recruiterId: req.user._id,
    });

    if (existingGroup) {
      return res.status(400).json({
        message: "Interview group with this name already exists",
      });
    }

    const interviewGroup = new InterviewGroup({
      name,
      description,
      college,
      department,
      batch,
      position,
      recruiterId: req.user._id,
      interviewDate,
      location,
      instructions,
      maxCandidates,
    });

    await interviewGroup.save();

    res.status(201).json({
      message: "Interview group created successfully",
      interviewGroup,
    });
  } catch (error) {
    console.error("Error creating interview group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/interview-groups/:id
// @desc    Update interview group
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      college,
      department,
      batch,
      position,
      status,
      interviewDate,
      location,
      instructions,
      maxCandidates,
    } = req.body;

    const interviewGroup = await InterviewGroup.findById(req.params.id);

    if (!interviewGroup) {
      return res.status(404).json({ message: "Interview group not found" });
    }

    // Check ownership
    if (interviewGroup.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update fields
    if (name) interviewGroup.name = name;
    if (description) interviewGroup.description = description;
    if (college) interviewGroup.college = college;
    if (department) interviewGroup.department = department;
    if (batch) interviewGroup.batch = batch;
    if (position) interviewGroup.position = position;
    if (status) interviewGroup.status = status;
    if (interviewDate) interviewGroup.interviewDate = interviewDate;
    if (location) interviewGroup.location = location;
    if (instructions) interviewGroup.instructions = instructions;
    if (maxCandidates) interviewGroup.maxCandidates = maxCandidates;

    await interviewGroup.save();

    res.json({
      message: "Interview group updated successfully",
      interviewGroup,
    });
  } catch (error) {
    console.error("Error updating interview group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/interview-groups/:id/add-candidates
// @desc    Add multiple candidates to interview group
// @access  Private
router.post("/:id/add-candidates", auth, async (req, res) => {
  try {
    const { candidateIds } = req.body;

    if (
      !candidateIds ||
      !Array.isArray(candidateIds) ||
      candidateIds.length === 0
    ) {
      return res.status(400).json({ message: "Candidate IDs are required" });
    }

    const interviewGroup = await InterviewGroup.findById(req.params.id);

    if (!interviewGroup) {
      return res.status(404).json({ message: "Interview group not found" });
    }

    // Check ownership
    if (interviewGroup.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if adding candidates exceeds max limit
    const currentCount = await Interview.countDocuments({
      interviewGroup: req.params.id,
    });
    if (currentCount + candidateIds.length > interviewGroup.maxCandidates) {
      return res.status(400).json({
        message: `Cannot add candidates. Maximum limit is ${interviewGroup.maxCandidates}`,
      });
    }

    const results = {
      success: [],
      failed: [],
      totalAdded: 0,
      totalFailed: 0,
    };

    for (const candidateId of candidateIds) {
      try {
        // Check if candidate exists
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
          results.failed.push({
            candidateId,
            reason: "Candidate not found",
          });
          continue;
        }

        // Check if interview already exists for this candidate in this group
        const existingInterview = await Interview.findOne({
          candidate: candidateId,
          interviewGroup: req.params.id,
        });

        if (existingInterview) {
          results.failed.push({
            candidateId,
            candidateName: candidate.name,
            reason: "Interview already exists for this candidate in this group",
          });
          continue;
        }

        // Create new interview
        const interview = new Interview({
          candidate: candidateId,
          interviewer: req.user._id,
          interviewGroup: req.params.id,
          position: interviewGroup.position,
          department: interviewGroup.department,
          status: "Scheduled",
          analysisStatus: "Pending",
        });

        await interview.save();

        results.success.push({
          candidateId,
          candidateName: candidate.name,
          interviewId: interview._id,
        });
        results.totalAdded++;
      } catch (error) {
        results.failed.push({
          candidateId,
          reason: error.message,
        });
      }
    }

    results.totalFailed = results.failed.length;

    // Update interview group statistics
    const totalInterviews = await Interview.countDocuments({
      interviewGroup: req.params.id,
    });
    interviewGroup.currentCandidates = totalInterviews;
    interviewGroup.statistics.totalInterviews = totalInterviews;
    await interviewGroup.save();

    res.json({
      message: `${results.totalAdded} candidates added successfully`,
      results,
    });
  } catch (error) {
    console.error("Error adding candidates to interview group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/interview-groups/:id/remove-candidate/:candidateId
// @desc    Remove candidate from interview group
// @access  Private
router.delete("/:id/remove-candidate/:candidateId", auth, async (req, res) => {
  try {
    const { id: groupId, candidateId } = req.params;

    const interviewGroup = await InterviewGroup.findById(groupId);

    if (!interviewGroup) {
      return res.status(404).json({ message: "Interview group not found" });
    }

    // Check ownership
    if (interviewGroup.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find and delete the interview
    const interview = await Interview.findOne({
      candidate: candidateId,
      interviewGroup: groupId,
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found for this candidate in this group",
      });
    }

    await Interview.findByIdAndDelete(interview._id);

    // Update interview group statistics
    const totalInterviews = await Interview.countDocuments({
      interviewGroup: groupId,
    });
    interviewGroup.currentCandidates = totalInterviews;
    interviewGroup.statistics.totalInterviews = totalInterviews;
    await interviewGroup.save();

    res.json({
      message: "Candidate removed from interview group successfully",
    });
  } catch (error) {
    console.error("Error removing candidate from interview group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/interview-groups/:id/statistics
// @desc    Get detailed statistics for interview group
// @access  Private
router.get("/:id/statistics", auth, async (req, res) => {
  try {
    const interviewGroup = await InterviewGroup.findById(req.params.id);

    if (!interviewGroup) {
      return res.status(404).json({ message: "Interview group not found" });
    }

    // Get all interviews in this group
    const interviews = await Interview.find({ interviewGroup: req.params.id });

    const statistics = {
      totalInterviews: interviews.length,
      completedInterviews: interviews.filter((i) => i.status === "Completed")
        .length,
      analyzedInterviews: interviews.filter(
        (i) => i.analysisStatus === "Analyzed"
      ).length,
      pendingAnalysis: interviews.filter((i) => i.analysisStatus === "Pending")
        .length,
      inProgress: interviews.filter((i) => i.status === "In Progress").length,
      scheduled: interviews.filter((i) => i.status === "Scheduled").length,
    };

    // Calculate score statistics for analyzed interviews
    const analyzedInterviews = interviews.filter(
      (i) =>
        i.analysisStatus === "Analyzed" &&
        i.analysis &&
        i.analysis.overall_score
    );

    if (analyzedInterviews.length > 0) {
      const scores = analyzedInterviews.map((i) => i.analysis.overall_score);
      statistics.averageScore =
        scores.reduce((a, b) => a + b, 0) / scores.length;
      statistics.topScore = Math.max(...scores);
      statistics.lowestScore = Math.min(...scores);

      // Score distribution
      statistics.scoreDistribution = {
        excellent: scores.filter((s) => s >= 8).length,
        good: scores.filter((s) => s >= 6 && s < 8).length,
        average: scores.filter((s) => s >= 4 && s < 6).length,
        poor: scores.filter((s) => s < 4).length,
      };
    } else {
      statistics.averageScore = 0;
      statistics.topScore = 0;
      statistics.lowestScore = 0;
      statistics.scoreDistribution = {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0,
      };
    }

    // Update interview group statistics
    interviewGroup.statistics = {
      ...interviewGroup.statistics,
      ...statistics,
    };
    await interviewGroup.save();

    res.json({
      interviewGroup: {
        _id: interviewGroup._id,
        name: interviewGroup.name,
        college: interviewGroup.college,
        department: interviewGroup.department,
        batch: interviewGroup.batch,
        position: interviewGroup.position,
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching interview group statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/interview-groups/:id
// @desc    Delete interview group
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const interviewGroup = await InterviewGroup.findById(req.params.id);

    if (!interviewGroup) {
      return res.status(404).json({ message: "Interview group not found" });
    }

    // Check ownership
    if (interviewGroup.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if there are interviews in this group
    const interviewCount = await Interview.countDocuments({
      interviewGroup: req.params.id,
    });

    if (interviewCount > 0) {
      return res.status(400).json({
        message: `Cannot delete group. It contains ${interviewCount} interviews. Please remove all interviews first.`,
      });
    }

    await InterviewGroup.findByIdAndDelete(req.params.id);

    res.json({ message: "Interview group deleted successfully" });
  } catch (error) {
    console.error("Error deleting interview group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
