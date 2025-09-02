import React, { useState, useEffect } from "react";
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  BriefcaseIcon,
  UserGroupIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filterBy, setFilterBy] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/reports/interview-groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.groups || []);
        setSummary(data.summary || {});
      } else {
        console.error("Failed to fetch reports data");
        setReportData([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGroups = () => {
    if (filterBy === "all" || !filterValue) return reportData;

    return reportData.filter((groupReport) => {
      const group = groupReport.group;
      switch (filterBy) {
        case "college":
          return group.college?.toLowerCase().includes(filterValue.toLowerCase());
        case "position":
          return group.position?.toLowerCase().includes(filterValue.toLowerCase());
        case "status":
          return group.status?.toLowerCase() === filterValue.toLowerCase();
        case "department":
          return group.department?.toLowerCase().includes(filterValue.toLowerCase());
        default:
          return true;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  const exportGroupReport = async (groupReport) => {
    const pdf = new jsPDF();
    const group = groupReport.group;
    const stats = groupReport.statistics;

    // Add title
    pdf.setFontSize(20);
    pdf.text(`Interview Group Report: ${group.name}`, 20, 30);

    // Add group details
    pdf.setFontSize(12);
    pdf.text(`College: ${group.college || "N/A"}`, 20, 50);
    pdf.text(`Position: ${group.position}`, 20, 60);
    pdf.text(`Department: ${group.department || "N/A"}`, 20, 70);
    pdf.text(`Batch: ${group.batch || "N/A"}`, 20, 80);

    // Add statistics
    pdf.setFontSize(14);
    pdf.text("Statistics:", 20, 100);
    pdf.setFontSize(12);
    pdf.text(`Total Interviews: ${stats.totalInterviews}`, 20, 115);
    pdf.text(`Completed: ${stats.completedInterviews}`, 20, 125);
    pdf.text(`Pending: ${stats.pendingInterviews}`, 20, 135);
    pdf.text(`Average Score: ${stats.averageScore}`, 20, 145);
    pdf.text(`Top Score: ${stats.topScore}`, 20, 155);
    pdf.text(`Completion Rate: ${stats.completionRate}%`, 20, 165);

    // Add interview list
    let yPosition = 185;
    pdf.setFontSize(14);
    pdf.text("Interviews:", 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    groupReport.interviews.forEach((interview, index) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      const candidateName = interview.candidate?.name || "Unknown";
      const score = interview.analysis?.overallScore || "N/A";
      const status = interview.analysisStatus || "Pending";
      
      pdf.text(`${index + 1}. ${candidateName} - Score: ${score} - Status: ${status}`, 20, yPosition);
      yPosition += 10;
    });

    pdf.save(`${group.name}_report.pdf`);
  };

  const filteredGroups = getFilteredGroups();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Reports</h1>
          <p className="text-gray-600 mt-2">
            Analyze performance and track progress across interview groups
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {viewMode === "grid" ? "List View" : "Grid View"}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm font-medium opacity-90">Total Groups</p>
                <p className="text-2xl font-bold">{summary.totalGroups}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm font-medium opacity-90">Total Interviews</p>
                <p className="text-2xl font-bold">{summary.totalInterviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm font-medium opacity-90">Completed</p>
                <p className="text-2xl font-bold">{summary.totalCompletedInterviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm font-medium opacity-90">Avg Score</p>
                <p className="text-2xl font-bold">{summary.overallAverageScore}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          <select
            value={filterBy}
            onChange={(e) => {
              setFilterBy(e.target.value);
              setFilterValue("");
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Groups</option>
            <option value="college">College</option>
            <option value="position">Position</option>
            <option value="department">Department</option>
            <option value="status">Status</option>
          </select>

          {filterBy !== "all" && filterBy === "status" && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          )}

          {filterBy !== "all" && filterBy !== "status" && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={`Filter by ${filterBy}...`}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          )}

          {filterValue && (
            <button
              onClick={() => {
                setFilterBy("all");
                setFilterValue("");
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Groups Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((groupReport) => (
            <GroupCard
              key={groupReport.group._id}
              groupReport={groupReport}
              onViewDetails={setSelectedGroup}
              onExport={exportGroupReport}
              getStatusColor={getStatusColor}
              getScoreColor={getScoreColor}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGroups.map((groupReport) => (
                  <GroupRow
                    key={groupReport.group._id}
                    groupReport={groupReport}
                    onViewDetails={setSelectedGroup}
                    onExport={exportGroupReport}
                    getStatusColor={getStatusColor}
                    getScoreColor={getScoreColor}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredGroups.length === 0 && !loading && (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No reports found
          </h3>
          <p className="text-gray-600">
            {filterValue
              ? "Try adjusting your filters or create some interview groups."
              : "Create interview groups and conduct interviews to see reports here."}
          </p>
        </div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <GroupDetailsModal
          groupReport={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          getStatusColor={getStatusColor}
          getScoreColor={getScoreColor}
        />
      )}
    </div>
  );
};

// Group Card Component for Grid View
const GroupCard = ({ groupReport, onViewDetails, onExport, getStatusColor, getScoreColor }) => {
  const { group, statistics } = groupReport;

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
              {group.status}
            </span>
          </div>
          <button
            onClick={() => onExport(groupReport)}
            className="text-gray-400 hover:text-gray-600"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            <span>{group.college || "N/A"}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            <span>{group.position}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <AcademicCapIcon className="h-4 w-4 mr-2" />
            <span>{group.department || "N/A"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{statistics.totalInterviews}</p>
            <p className="text-xs text-gray-500">Total Interviews</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${getScoreColor(statistics.averageScore)}`}>
              {statistics.averageScore}
            </p>
            <p className="text-xs text-gray-500">Avg Score</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Completion Rate</span>
            <span>{statistics.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${statistics.completionRate}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(groupReport)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

// Group Row Component for List View
const GroupRow = ({ groupReport, onViewDetails, onExport, getStatusColor, getScoreColor }) => {
  const { group, statistics } = groupReport;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{group.name}</div>
          <div className="text-sm text-gray-500">{group.college} • {group.position}</div>
          <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
            {group.status}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {statistics.completedInterviews}/{statistics.totalInterviews} Completed
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${statistics.completionRate}%` }}
          ></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${getScoreColor(statistics.averageScore)}`}>
          Avg: {statistics.averageScore}
        </div>
        <div className="text-sm text-gray-500">
          Top: {statistics.topScore}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(groupReport)}
            className="text-blue-600 hover:text-blue-900"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onExport(groupReport)}
            className="text-green-600 hover:text-green-900"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Group Details Modal Component
const GroupDetailsModal = ({ groupReport, onClose, getStatusColor, getScoreColor }) => {
  const { group, statistics, interviews } = groupReport;

  const chartData = [
    { name: "Technical", score: statistics.averageTechnical },
    { name: "Communication", score: statistics.averageCommunication },
    { name: "Confidence", score: statistics.averageConfidence },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{group.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Group Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Group Information</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">College:</span> {group.college || "N/A"}</div>
              <div><span className="font-medium">Position:</span> {group.position}</div>
              <div><span className="font-medium">Department:</span> {group.department || "N/A"}</div>
              <div><span className="font-medium">Batch:</span> {group.batch || "N/A"}</div>
              <div><span className="font-medium">Max Candidates:</span> {group.maxCandidates}</div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(group.status)}`}>
                  {group.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Performance Statistics</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Total Interviews:</span> {statistics.totalInterviews}</div>
              <div><span className="font-medium">Completed:</span> {statistics.completedInterviews}</div>
              <div><span className="font-medium">Pending:</span> {statistics.pendingInterviews}</div>
              <div><span className="font-medium">Completion Rate:</span> {statistics.completionRate}%</div>
              <div>
                <span className="font-medium">Average Score:</span>
                <span className={`ml-2 font-bold ${getScoreColor(statistics.averageScore)}`}>
                  {statistics.averageScore}
                </span>
              </div>
              <div><span className="font-medium">Top Score:</span> {statistics.topScore}</div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        {statistics.completedInterviews > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Average Scores by Category</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Interviews List */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Interviews ({interviews.length})
          </h4>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Candidate
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {interview.candidate?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {interview.analysis?.overallScore ? (
                        <span className={`font-medium ${getScoreColor(interview.analysis.overallScore)}`}>
                          {interview.analysis.overallScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        interview.analysisStatus === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {interview.analysisStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
