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

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalInterviews: 0,
    totalInterviewGroups: 0,
    activeGroups: 0,
    completedInterviews: 0,
    analyzedInterviews: 0,
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
        scoreTrendsResponse,
        groupsSummaryResponse,
        statusDistributionResponse,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/dashboard/recent-interviews", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/dashboard/score-trends", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/dashboard/interview-groups-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/dashboard/status-distribution", {
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
        setRecentInterviews(recentData);
      }

      if (scoreTrendsResponse.ok) {
        const trendsData = await scoreTrendsResponse.json();
        setScoreTrends(trendsData);
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "active":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "draft":
        return "text-gray-600 bg-gray-100";
      case "cancelled":
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const statCards = [
    {
      name: "Total Candidates",
      value: stats.totalCandidates || 0,
      icon: UsersIcon,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      change: `+${stats.candidateGrowth || 0}%`,
      changeType: (stats.candidateGrowth || 0) >= 0 ? "increase" : "decrease",
      description: "All registered candidates",
    },
    {
      name: "Interview Groups",
      value: stats.totalInterviewGroups || 0,
      icon: UserGroupIcon,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      change: `${stats.activeGroups || 0} active`,
      changeType: "neutral",
      description: "Total groups created",
    },
    {
      name: "Total Interviews",
      value: stats.totalInterviews || 0,
      icon: VideoCameraIcon,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      change: `+${stats.interviewGrowth || 0}%`,
      changeType: (stats.interviewGrowth || 0) >= 0 ? "increase" : "decrease",
      description: "Interviews conducted",
    },
    {
      name: "Completed Analyses",
      value: stats.analyzedInterviews || 0,
      icon: DocumentChartBarIcon,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      change: `${(
        ((stats.analyzedInterviews || 0) /
          Math.max(stats.totalInterviews || 0, 1)) *
        100
      ).toFixed(0)}%`,
      changeType: "neutral",
      description: "AI analysis completed",
    },
    {
      name: "Average Score",
      value: (stats.averageScore || 0).toFixed(1),
      icon: TrophyIcon,
      color: "bg-gradient-to-r from-yellow-500 to-orange-500",
      change: "Overall performance",
      changeType: "neutral",
      description: "Average interview score",
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
            <p className="text-gray-700 font-semibold text-lg">Loading Dashboard</p>
            <p className="text-gray-500 text-sm">Fetching your latest data...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
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
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Trends
              </h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            {scoreTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={scoreTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="overall"
                    stroke="#3B82F6"
                    fill="url(#colorOverall)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="technical"
                    stroke="#10B981"
                    fill="url(#colorTechnical)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="communication"
                    stroke="#F59E0B"
                    fill="url(#colorCommunication)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient
                      id="colorOverall"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorTechnical"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCommunication"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No performance data available yet</p>
                  <p className="text-sm">
                    Complete some interviews to see trends
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Interview Status Distribution
              </h3>
              <SparklesIcon className="h-5 w-5 text-gray-400" />
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
                  <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentInterviews.length > 0 ? (
                recentInterviews.map((interview, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {interview.candidate?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.candidate?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {interview.interviewGroup?.position || "No position"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {interview.analysis?.overallScore && (
                        <span
                          className={`text-sm font-medium ${getScoreColor(
                            interview.analysis.overallScore
                          )}`}
                        >
                          {interview.analysis.overallScore.toFixed(1)}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          interview.status
                        )}`}
                      >
                        {interview.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <VideoCameraIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent interviews</p>
                  <p className="text-sm">
                    Start conducting interviews to see them here
                  </p>
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
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {interviewGroupsSummary.length > 0 ? (
                interviewGroupsSummary.map((group, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{group.name}</p>
                      <p className="text-sm text-gray-500">{group.college}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-400">
                          {group.currentCandidates}/{group.maxCandidates}{" "}
                          candidates
                        </span>
                        {group.interviewDate && (
                          <span className="text-xs text-gray-400">
                            {new Date(group.interviewDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        group.status
                      )}`}
                    >
                      {group.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No interview groups</p>
                  <p className="text-sm">
                    Create your first interview group to get started
                  </p>
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
              onClick={() => (window.location.href = "/candidates")}
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <UsersIcon className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-900">Add Candidates</p>
                <p className="text-sm text-blue-600">
                  Manage candidate profiles
                </p>
              </div>
            </button>

            <button
              onClick={() => (window.location.href = "/interview-groups")}
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <UserGroupIcon className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-900">Create Group</p>
                <p className="text-sm text-green-600">Setup interview groups</p>
              </div>
            </button>

            <button
              onClick={() => (window.location.href = "/question-sets")}
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-900">Question Sets</p>
                <p className="text-sm text-purple-600">
                  Manage interview questions
                </p>
              </div>
            </button>

            <button
              onClick={() => (window.location.href = "/interviews")}
              className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <VideoCameraIcon className="h-6 w-6 text-orange-600" />
              <div className="text-left">
                <p className="font-medium text-orange-900">Start Interview</p>
                <p className="text-sm text-orange-600">Conduct new interview</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
