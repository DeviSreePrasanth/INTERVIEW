import React, { useState, useEffect } from "react";
import {
  UsersIcon,
  VideoCameraIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  ClockIcon,
  AcademicCapIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  CpuChipIcon,
  ArrowRightIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalInterviews: 0,
    totalInterviewGroups: 0,
    activeGroups: 0,
    completedInterviews: 0,
    analyzedInterviews: 0,
    pendingAnalysis: 0,
    processingInterviews: 0,
    averageScore: 0,
    recentCandidates: 0,
    recentInterviews: 0,
    candidateGrowth: 0,
    interviewGrowth: 0,
  });

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [scoreTrends, setScoreTrends] = useState([]);
  const [interviewGroupsSummary, setInterviewGroupsSummary] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState({
    interviewStatuses: [],
    groupStatuses: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [
        statsResponse,
        recentInterviewsResponse,
        groupsSummaryResponse,
        statusDistributionResponse,
      ] = await Promise.all([
        fetch("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/recent-interviews", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/interview-groups-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/status-distribution", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsResponse.ok) {
        const responseData = await statsResponse.json();
        console.log("Stats data received:", responseData);
        const statsData = responseData.stats || responseData; // Handle both formats
        // Ensure all required properties exist with defaults
        setStats({
          totalCandidates: 0,
          totalInterviews: 0,
          totalInterviewGroups: 0,
          activeGroups: 0,
          completedInterviews: 0,
          analyzedInterviews: 0,
          pendingAnalysis: 0,
          processingInterviews: 0,
          averageScore: 0,
          recentCandidates: 0,
          recentInterviews: 0,
          candidateGrowth: 0,
          interviewGrowth: 0,
          ...statsData, // Override with actual data
        });
      } else {
        console.error("Failed to fetch stats:", statsResponse.status);
      }

      if (recentInterviewsResponse.ok) {
        const recentData = await recentInterviewsResponse.json();
        setRecentInterviews(recentData.recentInterviews || recentData);
      }

      if (groupsSummaryResponse.ok) {
        const groupsData = await groupsSummaryResponse.json();
        setInterviewGroupsSummary(groupsData);
      }

      if (statusDistributionResponse.ok) {
        const distributionData = await statusDistributionResponse.json();
        setStatusDistribution(distributionData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: "Interview Groups",
      value: stats.totalInterviewGroups || 0,
      icon: UserGroupIcon,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      change: `${stats.activeGroups || 0} active`,
      changeType: "neutral",
      description: "Total groups created",
      action: () => navigate("/interview-groups"),
    },
    {
      name: "Total Interviews",
      value: stats.totalInterviews || 0,
      icon: VideoCameraIcon,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      change: `+${stats.interviewGrowth || 0}%`,
      changeType: (stats.interviewGrowth || 0) >= 0 ? "increase" : "decrease",
      description: "Interviews conducted",
      action: () => navigate("/interviews"),
    },
    {
      name: "AI Transcriptions",
      value: stats.analyzedInterviews || 0,
      icon: MicrophoneIcon,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      change: `${stats.pendingAnalysis || 0} pending`,
      changeType: "neutral",
      description: "AI analysis completed",
      action: () => navigate("/interviews"),
    },
    {
      name: "Processing Queue",
      value: stats.processingInterviews || 0,
      icon: CpuChipIcon,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      change: "Currently processing",
      changeType: "neutral",
      description: "Audio files in queue",
      action: () => navigate("/interviews"),
    },
    {
      name: "Completion Rate",
      value: `${(
        ((stats.analyzedInterviews || 0) /
          Math.max(stats.totalInterviews || 0, 1)) *
        100
      ).toFixed(0)}%`,
      icon: TrophyIcon,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      change: "Success rate",
      changeType: "neutral",
      description: "Analysis completion",
      action: () => navigate("/interviews"),
    },
  ];

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-lg">
              Loading Dashboard
            </p>
            <p className="text-gray-500 text-sm">
              Fetching your latest data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name || "User"}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Here's what's happening with your interviews today.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarDaysIcon className="h-5 w-5" />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={card.action}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${card.color} shadow-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {card.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    {card.changeType === "increase" && (
                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    )}
                    {card.changeType === "decrease" && (
                      <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        card.changeType === "increase"
                          ? "text-green-600"
                          : card.changeType === "decrease"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {card.change}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {card.description}
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Processing Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                AI Processing Pipeline
              </h3>
              <CpuChipIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      Audio Transcription
                    </p>
                    <p className="text-sm text-blue-600">Using Whisper AI</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {stats.analyzedInterviews || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900">In Processing</p>
                    <p className="text-sm text-yellow-600">
                      Currently analyzing
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {stats.processingInterviews || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Pending Analysis
                    </p>
                    <p className="text-sm text-gray-600">Waiting in queue</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-600">
                  {stats.pendingAnalysis || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Interview Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Interview Status Overview
              </h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            {statusDistribution.interviewStatuses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution.interviewStatuses}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.interviewStatuses.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No status data available</p>
                  <p className="text-sm">
                    Create some interviews to see distribution
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity and Groups Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Interviews */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Interviews
              </h3>
              <button
                onClick={() => navigate("/interviews")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View All
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentInterviews.length > 0 ? (
                recentInterviews.map((interview, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate("/interviews")}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.candidateName || "Unnamed Candidate"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {interview.fileName || "No file name"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {interview.createdAt
                            ? new Date(interview.createdAt).toLocaleDateString()
                            : "Recent"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          interview.analysisStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : interview.analysisStatus === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : interview.analysisStatus === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {interview.analysisStatus === "completed"
                          ? "Completed"
                          : interview.analysisStatus === "processing"
                          ? "Processing"
                          : interview.analysisStatus === "failed"
                          ? "Failed"
                          : "Pending"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MicrophoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">No interviews yet</p>
                  <p className="text-sm mb-4">
                    Start by uploading an interview audio file
                  </p>
                  <button
                    onClick={() => navigate("/interviews")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Upload Interview
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interview Groups Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Interview Groups
              </h3>
              <button
                onClick={() => navigate("/interview-groups")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View All
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {interviewGroupsSummary.length > 0 ? (
                interviewGroupsSummary.map((group, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate("/interview-groups")}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {group.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {group.position}
                        </p>
                        <p className="text-xs text-gray-400">
                          {group.interviewCount} interviews
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {group.completedCount || 0} completed
                      </p>
                      <p className="text-xs text-gray-500">
                        {group.processingCount || 0} processing
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">No interview groups yet</p>
                  <p className="text-sm mb-4">
                    Create groups to organize your interviews
                  </p>
                  <button
                    onClick={() => navigate("/interview-groups")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/interviews")}
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <MicrophoneIcon className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-900">Upload Interview</p>
                <p className="text-sm text-blue-600">
                  Start audio transcription
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate("/interview-groups")}
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <UserGroupIcon className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-900">Create Group</p>
                <p className="text-sm text-green-600">Setup interview groups</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/interviews")}
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-900">View Transcripts</p>
                <p className="text-sm text-purple-600">
                  Browse analyzed interviews
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate("/interview-groups")}
              className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <CpuChipIcon className="h-6 w-6 text-orange-600" />
              <div className="text-left">
                <p className="font-medium text-orange-900">AI Processing</p>
                <p className="text-sm text-orange-600">Monitor AI pipeline</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
