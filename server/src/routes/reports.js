const express = require("express");
const Interview = require("../models/Interview");
const InterviewGroup = require("../models/InterviewGroup");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all interview reports across all groups
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, group, status, search } = req.query;

    // Build query
    const query = { interviewer: req.user._id };

    if (group && group !== "all") {
      query.interviewGroup = group;
    }

    if (status && status !== "all") {
      query.analysisStatus = status;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { "candidate.name": searchRegex },
        { "candidate.email": searchRegex },
        { position: searchRegex },
        { department: searchRegex },
      ];
    }

    // Get interviews with populated candidate and group data
    const interviews = await Interview.find(query)
      .populate("candidate", "name email")
      .populate("interviewGroup", "name college department position")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Transform data for reports view
    const reports = interviews.map((interview) => ({
      _id: interview._id,
      candidateName:
        interview.candidate?.name || interview.candidateName || "Unknown",
      candidateEmail:
        interview.candidate?.email || interview.candidateEmail || "",
      interviewGroupName: interview.interviewGroup?.name || "Unknown Group",
      college:
        interview.interviewGroup?.college || interview.candidateCollege || "",
      position: interview.position || interview.interviewGroup?.position || "",
      department:
        interview.department || interview.interviewGroup?.department || "",
      interviewGroup: interview.interviewGroup?._id || null,
      analysisStatus: interview.analysisStatus || "Pending",
      hasTranscript: !!interview.transcript,
      hasAnalysis: !!interview.analysis,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      reportUrl: interview.reportFile?.url || null,
    }));

    // Get total count for pagination
    const total = await Interview.countDocuments(query);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/stats
// @desc    Get report statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const query = { interviewer: req.user._id };

    const [
      totalReports,
      analyzedReports,
      processingReports,
      failedReports,
      pendingReports,
    ] = await Promise.all([
      Interview.countDocuments(query),
      Interview.countDocuments({ ...query, analysisStatus: "Analyzed" }),
      Interview.countDocuments({ ...query, analysisStatus: "Processing" }),
      Interview.countDocuments({ ...query, analysisStatus: "Failed" }),
      Interview.countDocuments({ ...query, analysisStatus: "Pending" }),
    ]);

    // Group by interview group
    const groupStats = await Interview.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$interviewGroup",
          count: { $sum: 1 },
          analyzed: {
            $sum: {
              $cond: [{ $eq: ["$analysisStatus", "Analyzed"] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ["$analysisStatus", "Processing"] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$analysisStatus", "Failed"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "interviewgroups",
          localField: "_id",
          foreignField: "_id",
          as: "group",
        },
      },
      {
        $unwind: {
          path: "$group",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          groupName: "$group.name",
          count: 1,
          analyzed: 1,
          processing: 1,
          failed: 1,
        },
      },
    ]);

    res.json({
      overview: {
        totalReports,
        analyzedReports,
        processingReports,
        failedReports,
        pendingReports,
      },
      groupStats,
    });
  } catch (error) {
    console.error("Get report stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/reports/:id/download
// @desc    Download a specific report
// @access  Private
router.get("/:id/download", auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewer: req.user._id,
    })
      .populate("candidate")
      .populate("interviewGroup");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.analysisStatus !== "Analyzed") {
      return res.status(400).json({
        message: "Report not available. Interview analysis is not complete.",
      });
    }

    // If report file exists, serve it
    if (interview.reportFile && interview.reportFile.path) {
      const fs = require("fs");
      const path = require("path");

      const filePath = path.resolve(interview.reportFile.path);

      if (fs.existsSync(filePath)) {
        res.download(
          filePath,
          interview.reportFile.originalname ||
            `interview-report-${interview._id}.pdf`
        );
        return;
      }
    }

    // Generate report on-the-fly if no file exists
    const reportData = generateReportData(interview);

    // For now, return JSON data (you can implement PDF generation later)
    res.json({
      message: "Report generated successfully",
      data: reportData,
      downloadUrl: `/api/interviews/${interview._id}/report`,
    });
  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Helper function to generate report data
function generateReportData(interview) {
  return {
    candidate: {
      name: interview.candidate?.name || interview.candidateName,
      email: interview.candidate?.email || interview.candidateEmail,
    },
    interview: {
      position: interview.position,
      department: interview.department,
      date: interview.createdAt,
      interviewer: interview.interviewer,
    },
    analysis: {
      transcript: interview.transcript,
      analysisStatus: interview.analysisStatus,
      communicationMetrics: interview.analysis?.communicationMetrics,
      segments: interview.analysis?.segments,
    },
    interviewGroup: {
      name: interview.interviewGroup?.name,
      college: interview.interviewGroup?.college,
      department: interview.interviewGroup?.department,
    },
  };
}

module.exports = router;
