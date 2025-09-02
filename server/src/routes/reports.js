const express = require("express");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/reports/batch-analytics
// @desc    Get batch/college-wise analytics
// @access  Private
router.get("/batch-analytics", auth, async (req, res) => {
  try {
    const { college, department, batch, position } = req.query;

    // Build aggregation pipeline
    const matchStage = {
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
    };
    if (position) matchStage.position = new RegExp(position, "i");

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          as: "candidateData",
        },
      },
      { $unwind: "$candidateData" },
    ];

    // Add filters for candidate data
    const candidateMatch = {};
    if (college)
      candidateMatch["candidateData.college"] = new RegExp(college, "i");
    if (department)
      candidateMatch["candidateData.department"] = new RegExp(department, "i");
    if (batch) candidateMatch["candidateData.batch"] = new RegExp(batch, "i");

    if (Object.keys(candidateMatch).length > 0) {
      pipeline.push({ $match: candidateMatch });
    }

    // Group by college, department, and batch
    pipeline.push({
      $group: {
        _id: {
          college: "$candidateData.college",
          department: "$candidateData.department",
          batch: "$candidateData.batch",
          position: "$position",
        },
        totalCandidates: { $sum: 1 },
        averageScore: { $avg: "$analysis.overall_score" },
        maxScore: { $max: "$analysis.overall_score" },
        minScore: { $min: "$analysis.overall_score" },
        averageTechnicalScore: { $avg: "$analysis.technical_score" },
        averageCommunicationScore: { $avg: "$analysis.communication_score" },
        averageConfidenceScore: { $avg: "$analysis.confidence_score" },
        candidates: {
          $push: {
            name: "$candidateData.name",
            email: "$candidateData.email",
            overallScore: "$analysis.overall_score",
            technicalScore: "$analysis.technical_score",
            communicationScore: "$analysis.communication_score",
            confidenceScore: "$analysis.confidence_score",
            interviewDate: "$createdAt",
            interviewId: "$_id",
          },
        },
      },
    });

    pipeline.push({ $sort: { averageScore: -1 } });

    const batchAnalytics = await Interview.aggregate(pipeline);

    res.json({
      success: true,
      data: batchAnalytics,
      summary: {
        totalBatches: batchAnalytics.length,
        totalCandidatesAnalyzed: batchAnalytics.reduce(
          (sum, batch) => sum + batch.totalCandidates,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching batch analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/top-performers
// @desc    Get top performing candidates across batches
// @access  Private
router.get("/top-performers", auth, async (req, res) => {
  try {
    const {
      limit = 10,
      college,
      department,
      batch,
      position,
      minScore = 0,
    } = req.query;

    const matchStage = {
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
      "analysis.overall_score": { $gte: parseFloat(minScore) },
    };

    if (position) matchStage.position = new RegExp(position, "i");

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          as: "candidateData",
        },
      },
      { $unwind: "$candidateData" },
    ];

    // Add candidate filters
    const candidateMatch = {};
    if (college)
      candidateMatch["candidateData.college"] = new RegExp(college, "i");
    if (department)
      candidateMatch["candidateData.department"] = new RegExp(department, "i");
    if (batch) candidateMatch["candidateData.batch"] = new RegExp(batch, "i");

    if (Object.keys(candidateMatch).length > 0) {
      pipeline.push({ $match: candidateMatch });
    }

    pipeline.push(
      {
        $project: {
          candidateId: "$candidate",
          candidateName: "$candidateData.name",
          candidateEmail: "$candidateData.email",
          college: "$candidateData.college",
          department: "$candidateData.department",
          batch: "$candidateData.batch",
          cgpa: "$candidateData.cgpa",
          skills: "$candidateData.skills",
          position: "$position",
          overallScore: "$analysis.overall_score",
          technicalScore: "$analysis.technical_score",
          communicationScore: "$analysis.communication_score",
          confidenceScore: "$analysis.confidence_score",
          interviewDate: "$createdAt",
          interviewId: "$_id",
          // Calculate composite score
          compositeScore: {
            $add: [
              { $multiply: ["$analysis.overall_score", 0.4] },
              { $multiply: ["$analysis.technical_score", 0.3] },
              { $multiply: ["$analysis.communication_score", 0.2] },
              { $multiply: ["$analysis.confidence_score", 0.1] },
            ],
          },
        },
      },
      { $sort: { compositeScore: -1, overallScore: -1 } },
      { $limit: parseInt(limit) }
    );

    const topPerformers = await Interview.aggregate(pipeline);

    // Get statistics
    const stats = {
      totalEvaluated: await Interview.countDocuments({
        interviewer: req.user._id,
        analysisStatus: "Analyzed",
      }),
      averageScore: 0,
      scoreDistribution: {
        excellent: 0, // 8-10
        good: 0, // 6-8
        average: 0, // 4-6
        poor: 0, // 0-4
      },
    };

    if (topPerformers.length > 0) {
      stats.averageScore =
        topPerformers.reduce(
          (sum, candidate) => sum + candidate.overallScore,
          0
        ) / topPerformers.length;

      topPerformers.forEach((candidate) => {
        const score = candidate.overallScore;
        if (score >= 8) stats.scoreDistribution.excellent++;
        else if (score >= 6) stats.scoreDistribution.good++;
        else if (score >= 4) stats.scoreDistribution.average++;
        else stats.scoreDistribution.poor++;
      });
    }

    res.json({
      success: true,
      topPerformers,
      stats,
      filters: { college, department, batch, position, minScore, limit },
    });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/hiring-recommendations
// @desc    Get hiring recommendations based on scores and criteria
// @access  Private
router.get("/hiring-recommendations", auth, async (req, res) => {
  try {
    const {
      positions = 5,
      college,
      department,
      batch,
      position,
      minTechnicalScore = 6,
      minCommunicationScore = 5,
      minOverallScore = 6,
    } = req.query;

    const matchStage = {
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
      "analysis.overall_score": { $gte: parseFloat(minOverallScore) },
      "analysis.technical_score": { $gte: parseFloat(minTechnicalScore) },
      "analysis.communication_score": {
        $gte: parseFloat(minCommunicationScore),
      },
    };

    if (position) matchStage.position = new RegExp(position, "i");

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          as: "candidateData",
        },
      },
      { $unwind: "$candidateData" },
    ];

    // Add candidate filters
    const candidateMatch = {};
    if (college)
      candidateMatch["candidateData.college"] = new RegExp(college, "i");
    if (department)
      candidateMatch["candidateData.department"] = new RegExp(department, "i");
    if (batch) candidateMatch["candidateData.batch"] = new RegExp(batch, "i");

    if (Object.keys(candidateMatch).length > 0) {
      pipeline.push({ $match: candidateMatch });
    }

    pipeline.push(
      {
        $project: {
          candidateId: "$candidate",
          candidateName: "$candidateData.name",
          candidateEmail: "$candidateData.email",
          candidatePhone: "$candidateData.phone",
          college: "$candidateData.college",
          department: "$candidateData.department",
          batch: "$candidateData.batch",
          cgpa: "$candidateData.cgpa",
          skills: "$candidateData.skills",
          experience: "$candidateData.experience",
          position: "$position",
          overallScore: "$analysis.overall_score",
          technicalScore: "$analysis.technical_score",
          communicationScore: "$analysis.communication_score",
          confidenceScore: "$analysis.confidence_score",
          interviewDate: "$createdAt",
          // Weighted hiring score
          hiringScore: {
            $add: [
              { $multiply: ["$analysis.technical_score", 0.4] },
              { $multiply: ["$analysis.overall_score", 0.3] },
              { $multiply: ["$analysis.communication_score", 0.2] },
              { $multiply: ["$analysis.confidence_score", 0.1] },
            ],
          },
          // Add bonus for CGPA if available
          cgpaBonus: {
            $cond: {
              if: { $gte: ["$candidateData.cgpa", 8] },
              then: 0.5,
              else: {
                $cond: {
                  if: { $gte: ["$candidateData.cgpa", 7] },
                  then: 0.3,
                  else: 0,
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          finalScore: { $add: ["$hiringScore", "$cgpaBonus"] },
        },
      },
      { $sort: { finalScore: -1, hiringScore: -1 } },
      { $limit: parseInt(positions) }
    );

    const recommendations = await Interview.aggregate(pipeline);

    res.json({
      success: true,
      message: `Top ${positions} hiring recommendations`,
      recommendations,
      criteria: {
        minTechnicalScore,
        minCommunicationScore,
        minOverallScore,
        positions,
        filters: { college, department, batch, position },
      },
    });
  } catch (error) {
    console.error("Error generating hiring recommendations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/dashboard
// @desc    Get dashboard analytics data
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    // Get overall statistics
    const totalCandidates = await Candidate.countDocuments({
      createdBy: req.user._id,
    });
    const totalInterviews = await Interview.countDocuments({
      interviewer: req.user._id,
    });
    const completedAnalyses = await Interview.countDocuments({
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
    });

    // Get recent interviews
    const recentInterviews = await Interview.find({
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("candidate analysis.overall_score createdAt");

    // Calculate average score
    const analyzedInterviews = await Interview.find({
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
      "analysis.overall_score": { $exists: true },
    });

    let averageScore = 0;
    if (analyzedInterviews.length > 0) {
      const totalScore = analyzedInterviews.reduce(
        (sum, interview) => sum + (interview.analysis.overall_score || 0),
        0
      );
      averageScore =
        Math.round((totalScore / analyzedInterviews.length) * 10) / 10;
    }

    // Get score trends (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekInterviews = await Interview.find({
        interviewer: req.user._id,
        analysisStatus: "Analyzed",
        createdAt: { $gte: weekStart, $lte: weekEnd },
      });

      if (weekInterviews.length > 0) {
        const avgTechnical =
          weekInterviews.reduce(
            (sum, i) => sum + (i.analysis.technical_score || 0),
            0
          ) / weekInterviews.length;
        const avgCommunication =
          weekInterviews.reduce(
            (sum, i) => sum + (i.analysis.communication_score || 0),
            0
          ) / weekInterviews.length;
        const avgConfidence =
          weekInterviews.reduce(
            (sum, i) => sum + (i.analysis.confidence_score || 0),
            0
          ) / weekInterviews.length;

        weeklyData.push({
          name: `Week ${4 - i}`,
          technical: Math.round(avgTechnical * 10) / 10,
          communication: Math.round(avgCommunication * 10) / 10,
          confidence: Math.round(avgConfidence * 10) / 10,
        });
      }
    }

    res.json({
      stats: {
        totalCandidates,
        totalInterviews,
        completedAnalyses,
        averageScore,
      },
      recentInterviews: recentInterviews.map((interview) => ({
        id: interview._id,
        candidate: interview.candidate.name,
        role: interview.candidate.role,
        date: interview.createdAt.toISOString().split("T")[0],
        score: interview.analysis.overall_score,
      })),
      scoreData: weeklyData,
    });
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/interview/:id
// @desc    Get detailed interview report
// @access  Private
router.get("/interview/:id", auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.analysisStatus !== "Analyzed") {
      return res
        .status(400)
        .json({ message: "Interview analysis not completed yet" });
    }

    // Format the report data
    const reportData = {
      id: interview._id,
      candidate: interview.candidate.name,
      role: interview.candidate.role,
      date: interview.createdAt.toISOString().split("T")[0],
      scores: {
        technical: interview.analysis.technical_score,
        communication: interview.analysis.communication_score,
        confidence: interview.analysis.confidence_score,
        overall: interview.analysis.overall_score,
      },
      questionAnalysis: interview.analysis.questionAnalysis || [],
      communicationMetrics: interview.analysis.communicationMetrics || {},
      transcript: interview.analysis.transcript || "",
      feedback: interview.analysis.feedback || "",
      notes: interview.notes || "",
    };

    res.json(reportData);
  } catch (error) {
    console.error("Get interview report error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/analytics
// @desc    Get comprehensive analytics
// @access  Private
router.get("/analytics", auth, async (req, res) => {
  try {
    const { filterBy = "all", startDate, endDate } = req.query;

    // Build query based on filters
    let query = { interviewer: req.user._id, analysisStatus: "Analyzed" };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const interviews = await Interview.find(query);

    // Overall performance data
    const overallData = interviews.map((interview) => ({
      name: interview.candidate.name.split(" ")[0],
      candidate: interview.candidate.name,
      role: interview.candidate.role,
      technical: interview.analysis.technical_score,
      communication: interview.analysis.communication_score,
      confidence: interview.analysis.confidence_score,
      overall: interview.analysis.overall_score,
      date: interview.createdAt.toISOString().split("T")[0],
    }));

    // Role-wise analytics
    const roleStats = {};
    interviews.forEach((interview) => {
      const role = interview.candidate.role;
      if (!roleStats[role]) {
        roleStats[role] = {
          count: 0,
          totalTechnical: 0,
          totalCommunication: 0,
          totalConfidence: 0,
          totalOverall: 0,
        };
      }
      roleStats[role].count++;
      roleStats[role].totalTechnical += interview.analysis.technical_score;
      roleStats[role].totalCommunication +=
        interview.analysis.communication_score;
      roleStats[role].totalConfidence += interview.analysis.confidence_score;
      roleStats[role].totalOverall += interview.analysis.overall_score;
    });

    const roleAnalytics = Object.keys(roleStats).map((role) => ({
      role,
      count: roleStats[role].count,
      avgTechnical:
        Math.round(
          (roleStats[role].totalTechnical / roleStats[role].count) * 10
        ) / 10,
      avgCommunication:
        Math.round(
          (roleStats[role].totalCommunication / roleStats[role].count) * 10
        ) / 10,
      avgConfidence:
        Math.round(
          (roleStats[role].totalConfidence / roleStats[role].count) * 10
        ) / 10,
      avgOverall:
        Math.round(
          (roleStats[role].totalOverall / roleStats[role].count) * 10
        ) / 10,
    }));

    // Score distribution
    const scoreRanges = {
      excellent: 0, // 9-10
      good: 0, // 7-8.9
      average: 0, // 5-6.9
      poor: 0, // 0-4.9
    };

    interviews.forEach((interview) => {
      const score = interview.analysis.overall_score;
      if (score >= 9) scoreRanges.excellent++;
      else if (score >= 7) scoreRanges.good++;
      else if (score >= 5) scoreRanges.average++;
      else scoreRanges.poor++;
    });

    res.json({
      overallData,
      roleAnalytics,
      scoreDistribution: [
        {
          name: "Excellent (9-10)",
          value: scoreRanges.excellent,
          color: "#10B981",
        },
        { name: "Good (7-8.9)", value: scoreRanges.good, color: "#3B82F6" },
        {
          name: "Average (5-6.9)",
          value: scoreRanges.average,
          color: "#F59E0B",
        },
        { name: "Poor (0-4.9)", value: scoreRanges.poor, color: "#EF4444" },
      ],
      totalInterviews: interviews.length,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/candidate-performance/:candidateId
// @desc    Get performance history for a specific candidate
// @access  Private
router.get("/candidate-performance/:candidateId", auth, async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Verify candidate belongs to user
    const candidate = await Candidate.findOne({
      _id: candidateId,
      createdBy: req.user._id,
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Get all interviews for this candidate
    const interviews = await Interview.find({
      candidate: candidateId,
      interviewer: req.user._id,
      analysisStatus: "Analyzed",
    }).sort({ createdAt: 1 });

    const performanceHistory = interviews.map((interview, index) => ({
      interview: index + 1,
      date: interview.createdAt.toISOString().split("T")[0],
      technical: interview.analysis.technical_score,
      communication: interview.analysis.communication_score,
      confidence: interview.analysis.confidence_score,
      overall: interview.analysis.overall_score,
    }));

    res.json({
      candidate: {
        name: candidate.name,
        role: candidate.role,
        email: candidate.email,
      },
      performanceHistory,
      totalInterviews: interviews.length,
    });
  } catch (error) {
    console.error("Get candidate performance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
