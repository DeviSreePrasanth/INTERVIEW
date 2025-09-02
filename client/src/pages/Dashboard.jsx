import React, { useState, useEffect } from "react";
import {
  UsersIcon,
  VideoCameraIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
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
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalInterviews: 0,
    completedAnalyses: 0,
    averageScore: 0,
  });

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [scoreData, setScoreData] = useState([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setStats({
      totalCandidates: 45,
      totalInterviews: 32,
      completedAnalyses: 28,
      averageScore: 7.8,
    });

    setRecentInterviews([
      {
        id: 1,
        candidate: "John Doe",
        role: "Frontend Developer",
        date: "2025-09-01",
        score: 8.5,
      },
      {
        id: 2,
        candidate: "Jane Smith",
        role: "Backend Developer",
        date: "2025-08-31",
        score: 7.2,
      },
      {
        id: 3,
        candidate: "Mike Johnson",
        role: "Full Stack Developer",
        date: "2025-08-30",
        score: 9.1,
      },
      {
        id: 4,
        candidate: "Sarah Wilson",
        role: "UI/UX Designer",
        date: "2025-08-29",
        score: 6.8,
      },
    ]);

    setScoreData([
      { name: "Week 1", technical: 7.5, communication: 8.2, confidence: 7.8 },
      { name: "Week 2", technical: 8.1, communication: 7.9, confidence: 8.3 },
      { name: "Week 3", technical: 7.8, communication: 8.5, confidence: 7.6 },
      { name: "Week 4", technical: 8.7, communication: 8.1, confidence: 8.9 },
    ]);
  }, []);

  const statCards = [
    {
      name: "Total Candidates",
      value: stats.totalCandidates,
      icon: UsersIcon,
      color: "bg-blue-500",
      change: "+4.75%",
      changeType: "increase",
    },
    {
      name: "Total Interviews",
      value: stats.totalInterviews,
      icon: VideoCameraIcon,
      color: "bg-green-500",
      change: "+8.2%",
      changeType: "increase",
    },
    {
      name: "Completed Analyses",
      value: stats.completedAnalyses,
      icon: DocumentChartBarIcon,
      color: "bg-purple-500",
      change: "+2.1%",
      changeType: "increase",
    },
    {
      name: "Average Score",
      value: stats.averageScore.toFixed(1),
      icon: ChartBarIcon,
      color: "bg-orange-500",
      change: "+0.3",
      changeType: "increase",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overview of your interview performance evaluation system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${item.color} p-3 rounded-md`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === "increase"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trends Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Score Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="technical"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Technical"
              />
              <Line
                type="monotone"
                dataKey="communication"
                stroke="#10B981"
                strokeWidth={2}
                name="Communication"
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Interviews */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recent Interviews
          </h3>
          <div className="space-y-4">
            {recentInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {interview.candidate}
                  </p>
                  <p className="text-xs text-gray-500">{interview.role}</p>
                  <p className="text-xs text-gray-400">{interview.date}</p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      interview.score >= 8
                        ? "bg-green-100 text-green-800"
                        : interview.score >= 6
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {interview.score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="text-sm text-primary-600 hover:text-primary-500">
              View all interviews →
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Performance Overview
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Bar dataKey="technical" fill="#3B82F6" name="Technical" />
            <Bar dataKey="communication" fill="#10B981" name="Communication" />
            <Bar dataKey="confidence" fill="#F59E0B" name="Confidence" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
