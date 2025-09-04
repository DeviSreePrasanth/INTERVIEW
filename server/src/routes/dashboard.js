const express = require("express");
const Candidate = require("../models/Candidate");
const Interview = require("../models/Interview");
const InterviewGroup = require("../models/InterviewGroup");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    // Get basic counts
    const totalCandidates = await Candidate.countDocuments({
      createdBy: req.user._id,
    });

    const totalInterviews = await Interview.countDocuments({
      interviewer: req.user._id,
    });

    const totalInterviewGroups = await InterviewGroup.countDocuments({
      recruiterId: req.user._id,
    });

    // Get active interview groups
    const activeGroups = await InterviewGroup.countDocuments({
      recruiterId: req.user._id,
      status: "Active",
    });

    // Get recent activity stats
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentCandidates = await Candidate.countDocuments({
      createdBy: req.user._id,
      createdAt: { $gte: last30Days },
    });

    const recentInterviews = await Interview.countDocuments({
      interviewer: req.user._id,
      createdAt: { $gte: last30Days },
    });

    // Get status distribution for candidates
    const candidateStatusDistribution = await Candidate.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get interview group status distribution
    const groupStatusDistribution = await InterviewGroup.aggregate([
      { $match: { recruiterId: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalCandidates,
        totalInterviews,
        totalInterviewGroups,
        activeGroups,
        recentCandidates,
        recentInterviews,
      },
      distributions: {
        candidateStatus: candidateStatusDistribution,
        groupStatus: groupStatusDistribution,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/dashboard/recent-interviews
// @desc    Get recent interviews for dashboard
// @access  Private
router.get("/recent-interviews", auth, async (req, res) => {
  try {
    const recentInterviews = await Interview.find({
      interviewer: req.user._id,
    })
      .populate("candidate", "name role")
      .populate("interviewGroup", "name position")
      .sort({ createdAt: -1 })
      .limit(10)
      .select("candidate interviewGroup status createdAt");

    const formattedInterviews = recentInterviews.map((interview) => ({
      id: interview._id,
      candidateName: interview.candidate?.name || "Unknown",
      candidateRole:
        interview.candidate?.role ||
        interview.interviewGroup?.position ||
        "Unknown",
      groupName: interview.interviewGroup?.name || "Direct Interview",
      status: interview.status,
      date: interview.createdAt,
    }));

    res.json({ recentInterviews: formattedInterviews });
  } catch (error) {
    console.error("Recent interviews error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/dashboard/upcoming-interviews
// @desc    Get upcoming scheduled interviews
// @access  Private
router.get("/upcoming-interviews", auth, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const upcomingGroups = await InterviewGroup.find({
      recruiterId: req.user._id,
      interviewDate: { $gte: now, $lte: nextWeek },
      status: { $in: ["Active", "Draft"] },
    })
      .select(
        "name college position interviewDate currentCandidates maxCandidates"
      )
      .sort({ interviewDate: 1 })
      .limit(5);

    res.json({ upcomingInterviews: upcomingGroups });
  } catch (error) {
    console.error("Upcoming interviews error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/dashboard/interview-groups-summary
// @desc    Get interview groups summary for dashboard
// @access  Private
router.get("/interview-groups-summary", auth, async (req, res) => {
  try {
    const groups = await InterviewGroup.find({ recruiterId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "name college position status maxCandidates currentCandidates interviewDate"
      );

    // Get interview count for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const interviewCount = await Interview.countDocuments({
          interviewGroup: group._id,
        });
        return {
          ...group.toObject(),
          currentCandidates: interviewCount,
        };
      })
    );

    res.json(groupsWithStats);
  } catch (error) {
    console.error("Interview groups summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/dashboard/status-distribution
// @desc    Get status distribution for pie charts
// @access  Private
router.get("/status-distribution", auth, async (req, res) => {
  try {
    // Interview status distribution
    const interviewStatuses = await Interview.aggregate([
      { $match: { interviewer: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Interview groups status distribution
    const groupStatuses = await InterviewGroup.aggregate([
      { $match: { recruiterId: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format for pie charts
    const interviewStatusData = interviewStatuses.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    const groupStatusData = groupStatuses.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    res.json({
      interviewStatuses: interviewStatusData,
      groupStatuses: groupStatusData,
    });
  } catch (error) {
    console.error("Status distribution error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
