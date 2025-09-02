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

    // Get completed interviews (those with analysis)
    const completedAnalyses = await Interview.countDocuments({
      interviewer: req.user._id,
      analysisStatus: "completed",
    });

    // Get average score from completed interviews
    const interviewsWithScores = await Interview.find({
      interviewer: req.user._id,
      analysisStatus: "completed",
      "analysis.overallScore": { $exists: true },
    }).select("analysis.overallScore");

    const averageScore =
      interviewsWithScores.length > 0
        ? interviewsWithScores.reduce(
            (sum, interview) => sum + interview.analysis.overallScore,
            0
          ) / interviewsWithScores.length
        : 0;

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
        completedAnalyses,
        averageScore: Math.round(averageScore * 10) / 10,
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
      .select(
        "candidate interviewGroup status analysisStatus analysis createdAt"
      );

    const formattedInterviews = recentInterviews.map((interview) => ({
      id: interview._id,
      candidateName: interview.candidate?.name || "Unknown",
      candidateRole:
        interview.candidate?.role ||
        interview.interviewGroup?.position ||
        "Unknown",
      groupName: interview.interviewGroup?.name || "Direct Interview",
      status: interview.status,
      analysisStatus: interview.analysisStatus,
      score: interview.analysis?.overallScore || null,
      date: interview.createdAt,
    }));

    res.json({ recentInterviews: formattedInterviews });
  } catch (error) {
    console.error("Recent interviews error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/dashboard/performance-trends
// @desc    Get performance trends data for charts
// @access  Private
router.get("/performance-trends", auth, async (req, res) => {
  try {
    // Get interviews from last 12 weeks with scores
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

    const interviews = await Interview.find({
      interviewer: req.user._id,
      createdAt: { $gte: twelveWeeksAgo },
      analysisStatus: "completed",
      "analysis.overallScore": { $exists: true },
    }).select("analysis createdAt");

    // Group by week
    const weeklyData = {};
    const now = new Date();

    // Initialize 12 weeks of data
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - i * 7);
      const weekKey = `Week ${12 - i}`;
      weeklyData[weekKey] = {
        name: weekKey,
        totalInterviews: 0,
        scores: [],
        technical: [],
        communication: [],
        confidence: [],
      };
    }

    // Process interviews
    interviews.forEach((interview) => {
      const interviewDate = new Date(interview.createdAt);
      const weeksAgo = Math.floor(
        (now - interviewDate) / (7 * 24 * 60 * 60 * 1000)
      );

      if (weeksAgo >= 0 && weeksAgo < 12) {
        const weekKey = `Week ${12 - weeksAgo}`;
        if (weeklyData[weekKey]) {
          weeklyData[weekKey].totalInterviews++;
          weeklyData[weekKey].scores.push(interview.analysis.overallScore);

          // Add component scores if available
          if (interview.analysis.technicalScore) {
            weeklyData[weekKey].technical.push(
              interview.analysis.technicalScore
            );
          }
          if (interview.analysis.communicationScore) {
            weeklyData[weekKey].communication.push(
              interview.analysis.communicationScore
            );
          }
          if (interview.analysis.confidenceScore) {
            weeklyData[weekKey].confidence.push(
              interview.analysis.confidenceScore
            );
          }
        }
      }
    });

    // Calculate averages
    const trendData = Object.values(weeklyData).map((week) => ({
      name: week.name,
      totalInterviews: week.totalInterviews,
      averageScore:
        week.scores.length > 0
          ? Math.round(
              (week.scores.reduce((a, b) => a + b, 0) / week.scores.length) * 10
            ) / 10
          : 0,
      technical:
        week.technical.length > 0
          ? Math.round(
              (week.technical.reduce((a, b) => a + b, 0) /
                week.technical.length) *
                10
            ) / 10
          : 0,
      communication:
        week.communication.length > 0
          ? Math.round(
              (week.communication.reduce((a, b) => a + b, 0) /
                week.communication.length) *
                10
            ) / 10
          : 0,
      confidence:
        week.confidence.length > 0
          ? Math.round(
              (week.confidence.reduce((a, b) => a + b, 0) /
                week.confidence.length) *
                10
            ) / 10
          : 0,
    }));

    res.json({ trendData });
  } catch (error) {
    console.error("Performance trends error:", error);
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

// @route   GET /api/dashboard/score-trends
// @desc    Get score trends for charts
// @access  Private
router.get("/score-trends", auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interviews = await Interview.find({
      interviewer: req.user._id,
      createdAt: { $gte: thirtyDaysAgo },
      analysisStatus: "Completed",
      "analysis.overallScore": { $exists: true },
    }).select("analysis createdAt");

    // Group by week
    const weeklyData = {};
    interviews.forEach((interview) => {
      const weekStart = new Date(interview.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          totalScore: 0,
          count: 0,
          technical: 0,
          communication: 0,
          confidence: 0,
        };
      }

      const analysis = interview.analysis;
      weeklyData[weekKey].totalScore += analysis.overallScore || 0;
      weeklyData[weekKey].technical += analysis.technicalScore || 0;
      weeklyData[weekKey].communication += analysis.communicationScore || 0;
      weeklyData[weekKey].confidence += analysis.confidenceScore || 0;
      weeklyData[weekKey].count++;
    });

    // Calculate averages and format for chart
    const chartData = Object.values(weeklyData)
      .map((week) => ({
        name: `Week ${new Date(week.week).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
        technical: parseFloat((week.technical / week.count).toFixed(1)),
        communication: parseFloat((week.communication / week.count).toFixed(1)),
        confidence: parseFloat((week.confidence / week.count).toFixed(1)),
        overall: parseFloat((week.totalScore / week.count).toFixed(1)),
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week));

    res.json(chartData);
  } catch (error) {
    console.error("Score trends error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
