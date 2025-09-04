const Interview = require("../models/Interview");
const InterviewGroup = require("../models/InterviewGroup");

/**
 * Updates statistics for an interview group after an interview is processed
 */
const updateInterviewGroupStats = async (interviewGroupId) => {
  try {
    if (!interviewGroupId) {
      console.log("No interview group ID provided, skipping stats update");
      return;
    }

    console.log(`Updating statistics for interview group: ${interviewGroupId}`);

    const group = await InterviewGroup.findById(interviewGroupId);
    if (!group) {
      console.log("Interview group not found:", interviewGroupId);
      return;
    }

    // Get all interviews for this group
    const interviews = await Interview.find({
      interviewGroup: interviewGroupId,
    });

    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(
      (i) => i.status === "Completed"
    ).length;
    const analyzedInterviews = interviews.filter(
      (i) => i.analysisStatus === "Analyzed"
    ).length;

    // Calculate score statistics for analyzed interviews
    const analyzedWithScores = interviews.filter(
      (i) =>
        i.analysisStatus === "Analyzed" &&
        i.analysis &&
        i.analysis.overall_score !== undefined
    );

    let averageScore = 0;
    let topScore = 0;
    let lowestScore = 0;

    if (analyzedWithScores.length > 0) {
      const scores = analyzedWithScores.map((i) => i.analysis.overall_score);
      averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      topScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    // Update group statistics
    group.currentCandidates = totalInterviews;
    group.statistics = {
      totalInterviews,
      completedInterviews,
      analyzedInterviews,
      averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
      topScore,
      lowestScore,
    };

    await group.save();
    console.log(`✅ Updated statistics for interview group "${group.name}":`, {
      totalInterviews,
      completedInterviews,
      analyzedInterviews,
      averageScore: group.statistics.averageScore,
      topScore,
      lowestScore,
    });
  } catch (error) {
    console.error("❌ Error updating interview group statistics:", error);
  }
};

module.exports = {
  updateInterviewGroupStats,
};
