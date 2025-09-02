import React, { useState, useEffect } from "react";
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  BriefcaseIcon,
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
import {
  getInterviews,
  getFilteredInterviews,
  getInterviewById,
  getInterviewStats,
} from "../data/mockInterviewsData";

const Reports = () => {
  const [selectedInterview, setSelectedInterview] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [filterBy, setFilterBy] = useState("all"); // all, college, position, status
  const [filterValue, setFilterValue] = useState(""); // specific filter value
  const [stats, setStats] = useState(null);
  const [filteredInterviews, setFilteredInterviews] = useState([]);

  useEffect(() => {
    // Load interviews data from the main data source
    const interviewsData = getInterviews();
    setInterviews(interviewsData);

    // Load overall statistics
    const statsData = getInterviewStats();
    setStats(statsData);
  }, []);

  // Filter interviews based on selected criteria
  useEffect(() => {
    let filtered = [...interviews];

    if (filterBy !== "all" && filterValue) {
      switch (filterBy) {
        case "college":
          filtered = filtered.filter(
            (interview) => interview.candidateCollege === filterValue
          );
          break;
        case "position":
          filtered = filtered.filter(
            (interview) => interview.position === filterValue
          );
          break;
        case "status":
          filtered = filtered.filter(
            (interview) => interview.analysisStatus === filterValue
          );
          break;
        default:
          break;
      }
    }

    setFilteredInterviews(filtered);
  }, [interviews, filterBy, filterValue]);

  // Get unique values for filter options
  const getFilterOptions = () => {
    switch (filterBy) {
      case "college":
        return [
          ...new Set(interviews.map((interview) => interview.candidateCollege)),
        ];
      case "position":
        return [...new Set(interviews.map((interview) => interview.position))];
      case "status":
        return [
          ...new Set(interviews.map((interview) => interview.analysisStatus)),
        ];
      default:
        return [];
    }
  };

  const handleFilterByChange = (newFilterBy) => {
    setFilterBy(newFilterBy);
    setFilterValue(""); // Reset filter value when changing filter type
  };

  const handleInterviewSelect = (interviewId) => {
    setSelectedInterview(interviewId);
    const interview = getInterviewById(interviewId);
    setReportData(interview);
  };

  const generatePDF = async () => {
    if (!reportData) return;

    const pdf = new jsPDF();
    const reportElement = document.getElementById("report-content");

    if (reportElement) {
      const canvas = await html2canvas(reportElement);
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${reportData.candidateName}_interview_report.pdf`);
    }
  };

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  // Prepare chart data based on new structure
  const scoreData = reportData?.analysis?.scores
    ? [
        {
          name: "Technical Depth",
          score: reportData.analysis.scores.technical_depth,
          color: "#3B82F6",
        },
        {
          name: "Communication",
          score: reportData.analysis.scores.communication,
          color: "#10B981",
        },
        {
          name: "Confidence",
          score: reportData.analysis.scores.confidence,
          color: "#F59E0B",
        },
      ]
    : [];

  const radarData = reportData?.analysis?.scores
    ? [
        {
          subject: "Technical Depth",
          score: reportData.analysis.scores.technical_depth,
          fullMark: 10,
        },
        {
          subject: "Communication",
          score: reportData.analysis.scores.communication,
          fullMark: 10,
        },
        {
          subject: "Confidence",
          score: reportData.analysis.scores.confidence,
          fullMark: 10,
        },
        {
          subject: "Fluency",
          score:
            reportData.analysis.fluency_metrics?.words_per_minute / 20 || 5, // Normalize to 0-10
          fullMark: 10,
        },
      ]
    : [];

  // Generate overall analytics from filtered interviews
  const generateOverallAnalytics = () => {
    const dataSource =
      filteredInterviews.length > 0 ? filteredInterviews : interviews;
    const analyzedInterviews = dataSource.filter(
      (interview) => interview.analysis
    );

    return analyzedInterviews.map((interview) => ({
      name: interview.candidateName.split(" ")[0], // First name only for chart
      technical_depth: interview.analysis.scores.technical_depth,
      communication: interview.analysis.scores.communication,
      confidence: interview.analysis.scores.confidence,
      overall: interview.analysis.scores.overall_score,
      college: interview.candidateCollege,
      position: interview.position,
    }));
  };

  const overallAnalytics = generateOverallAnalytics();

  // Generate college-wise performance data from filtered interviews
  const generateCollegePerformance = () => {
    const dataSource =
      filteredInterviews.length > 0 ? filteredInterviews : interviews;
    const collegeMap = {};
    dataSource
      .filter((interview) => interview.analysis)
      .forEach((interview) => {
        const college = interview.candidateCollege;
        if (!collegeMap[college]) {
          collegeMap[college] = {
            name: college,
            totalScore: 0,
            count: 0,
            technical: 0,
            communication: 0,
            confidence: 0,
          };
        }

        collegeMap[college].totalScore +=
          interview.analysis.scores.overall_score;
        collegeMap[college].technical +=
          interview.analysis.scores.technical_depth;
        collegeMap[college].communication +=
          interview.analysis.scores.communication;
        collegeMap[college].confidence += interview.analysis.scores.confidence;
        collegeMap[college].count += 1;
      });

    return Object.values(collegeMap).map((college) => ({
      ...college,
      avgScore: (college.totalScore / college.count).toFixed(1),
      technical: (college.technical / college.count).toFixed(1),
      communication: (college.communication / college.count).toFixed(1),
      confidence: (college.confidence / college.count).toFixed(1),
    }));
  };

  const collegePerformance = generateCollegePerformance();

  // Generate position-wise performance data
  const generatePositionPerformance = () => {
    const dataSource =
      filteredInterviews.length > 0 ? filteredInterviews : interviews;
    const positionMap = {};
    dataSource
      .filter((interview) => interview.analysis)
      .forEach((interview) => {
        const position = interview.position;
        if (!positionMap[position]) {
          positionMap[position] = {
            name: position,
            totalScore: 0,
            count: 0,
            technical: 0,
            communication: 0,
            confidence: 0,
          };
        }

        positionMap[position].totalScore +=
          interview.analysis.scores.overall_score;
        positionMap[position].technical +=
          interview.analysis.scores.technical_depth;
        positionMap[position].communication +=
          interview.analysis.scores.communication;
        positionMap[position].confidence +=
          interview.analysis.scores.confidence;
        positionMap[position].count += 1;
      });

    return Object.values(positionMap).map((position) => ({
      ...position,
      avgScore: (position.totalScore / position.count).toFixed(1),
      technical: (position.technical / position.count).toFixed(1),
      communication: (position.communication / position.count).toFixed(1),
      confidence: (position.confidence / position.count).toFixed(1),
    }));
  };

  const positionPerformance = generatePositionPerformance();

  // Generate status-wise performance data
  const generateStatusPerformance = () => {
    const dataSource =
      filteredInterviews.length > 0 ? filteredInterviews : interviews;
    const statusMap = {};
    dataSource.forEach((interview) => {
      const status = interview.analysisStatus;
      if (!statusMap[status]) {
        statusMap[status] = {
          name: status,
          count: 0,
          avgScore: 0,
          totalScore: 0,
          analyzedCount: 0,
        };
      }

      statusMap[status].count += 1;
      if (interview.analysis) {
        statusMap[status].totalScore += interview.analysis.scores.overall_score;
        statusMap[status].analyzedCount += 1;
      }
    });

    return Object.values(statusMap).map((status) => ({
      ...status,
      avgScore:
        status.analyzedCount > 0
          ? (status.totalScore / status.analyzedCount).toFixed(1)
          : 0,
    }));
  };

  const statusPerformance = generateStatusPerformance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Detailed analysis and performance reports for interviews
          </p>
        </div>
        {reportData && (
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download PDF
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Interview
            </label>
            <select
              value={selectedInterview}
              onChange={(e) => handleInterviewSelect(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Choose an interview...</option>
              {(filteredInterviews.length > 0
                ? filteredInterviews
                : interviews
              ).map((interview) => (
                <option key={interview._id} value={interview._id}>
                  {interview.candidateName} - {interview.position} (
                  {interview.interviewDate})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group By
            </label>
            <select
              value={filterBy}
              onChange={(e) => handleFilterByChange(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Interviews</option>
              <option value="college">By College</option>
              <option value="position">By Position</option>
              <option value="status">By Analysis Status</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filterBy === "college" && "Select College"}
              {filterBy === "position" && "Select Position"}
              {filterBy === "status" && "Select Status"}
              {filterBy === "all" && "Filter Value"}
            </label>
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={filterBy === "all"}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {filterBy === "all" ? "No filter applied" : `All ${filterBy}s`}
              </option>
              {getFilterOptions().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {filterBy !== "all" && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  {filterValue
                    ? `Showing ${filteredInterviews.length} interviews filtered by ${filterBy}: ${filterValue}`
                    : `Ready to filter by ${filterBy}`}
                </span>
              </div>
              {filterValue && (
                <button
                  onClick={() => {
                    setFilterBy("all");
                    setFilterValue("");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Interviews
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Analyzed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.analyzed}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BriefcaseIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Pending Analysis
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Analytics based on Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {filterBy === "all" && "Individual Performance Analysis"}
            {filterBy === "college" &&
              (filterValue
                ? `Performance in ${filterValue}`
                : "College-wise Performance")}
            {filterBy === "position" &&
              (filterValue
                ? `Performance for ${filterValue}`
                : "Position-wise Performance")}
            {filterBy === "status" &&
              (filterValue
                ? `${filterValue} Interviews`
                : "Status-wise Analysis")}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            {filterBy === "status" ? (
              <PieChart>
                <Pie
                  data={statusPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <BarChart data={overallAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar
                  dataKey="technical_depth"
                  fill="#3B82F6"
                  name="Technical Depth"
                />
                <Bar
                  dataKey="communication"
                  fill="#10B981"
                  name="Communication"
                />
                <Bar dataKey="confidence" fill="#F59E0B" name="Confidence" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {filterBy === "college" && "College Comparison"}
            {filterBy === "position" && "Position Comparison"}
            {filterBy === "status" && "Status Distribution"}
            {filterBy === "all" && "College-wise Performance"}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            {filterBy === "position" ? (
              <AreaChart data={positionPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="technical"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  name="Technical"
                />
                <Area
                  type="monotone"
                  dataKey="communication"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  name="Communication"
                />
                <Area
                  type="monotone"
                  dataKey="confidence"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  name="Confidence"
                />
              </AreaChart>
            ) : filterBy === "status" ? (
              <BarChart
                data={statusPerformance.filter((s) => s.analyzedCount > 0)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#8B5CF6" name="Average Score" />
              </BarChart>
            ) : (
              <AreaChart data={collegePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="technical"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  name="Technical"
                />
                <Area
                  type="monotone"
                  dataKey="communication"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  name="Communication"
                />
                <Area
                  type="monotone"
                  dataKey="confidence"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  name="Confidence"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      {filterBy !== "all" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detailed {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}{" "}
            Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  {filterBy !== "status" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technical
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Communication
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                    </>
                  )}
                  {filterBy === "status" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Analyzed
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(filterBy === "college"
                  ? collegePerformance
                  : filterBy === "position"
                  ? positionPerformance
                  : statusPerformance
                ).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count}
                    </td>
                    {filterBy !== "status" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              parseFloat(item.avgScore) >= 8
                                ? "bg-green-100 text-green-800"
                                : parseFloat(item.avgScore) >= 6
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.avgScore}/10
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.technical}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.communication}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.confidence}/10
                        </td>
                      </>
                    )}
                    {filterBy === "status" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.analyzedCount} / {item.count}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Report */}
      {reportData && (
        <div id="report-content" className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Interview Analysis Report: {reportData.candidateName}
            </h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>Position: {reportData.position}</div>
              <div>College: {reportData.candidateCollege}</div>
              <div>Date: {reportData.interviewDate}</div>
              <div>
                Overall Score:{" "}
                {reportData.analysis?.scores?.overall_score?.toFixed(1) ||
                  "N/A"}
                /10
              </div>
            </div>
          </div>

          {reportData.analysis ? (
            <>
              {/* Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {scoreData.map((score, index) => (
                  <div key={score.name} className="text-center">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {score.name}
                      </h4>
                      <div
                        className="text-3xl font-bold"
                        style={{ color: score.color }}
                      >
                        {score.score.toFixed(1)}/10
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: score.color,
                              width: `${(score.score / 10) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Radar Chart */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Skills Assessment Radar
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 10]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Score Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={scoreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, score }) =>
                          `${name}: ${score.toFixed(1)}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="score"
                      >
                        {scoreData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transcript Analysis */}
              {reportData.analysis.transcript && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Interview Transcript Analysis
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-blue-600">
                          {reportData.analysis.transcript.duration}
                        </span>
                        <span className="text-gray-600">Duration</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-green-600">
                          {reportData.analysis.transcript.words}
                        </span>
                        <span className="text-gray-600">Total Words</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-purple-600">
                          {reportData.analysis.fluency_metrics
                            ?.words_per_minute || "N/A"}
                        </span>
                        <span className="text-gray-600">Words/Minute</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300 pt-4">
                      <h5 className="font-medium text-gray-800 mb-2">
                        Transcript:
                      </h5>
                      <p className="text-gray-700 leading-relaxed">
                        {reportData.analysis.transcript.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {reportData.analysis.insights &&
                reportData.analysis.insights.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Key Analysis Insights
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {reportData.analysis.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-blue-800">{insight}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Technical Terms & Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {reportData.analysis.technical_terms &&
                  reportData.analysis.technical_terms.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Technical Terms Used
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {reportData.analysis.technical_terms.map(
                          (term, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {term}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {reportData.analysis.keywords &&
                  reportData.analysis.keywords.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Key Concepts
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {reportData.analysis.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Fluency Metrics & Sentiment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportData.analysis.fluency_metrics && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 text-indigo-800">
                      Fluency Analysis
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-600">
                          Words per minute:
                        </span>
                        <span className="font-bold text-indigo-800">
                          {reportData.analysis.fluency_metrics.words_per_minute}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-600">Total words:</span>
                        <span className="font-bold text-indigo-800">
                          {reportData.analysis.fluency_metrics.total_words}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-600">
                          Speaking duration:
                        </span>
                        <span className="font-bold text-indigo-800">
                          {
                            reportData.analysis.fluency_metrics
                              .speaking_duration
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-600">Fluency rating:</span>
                        <span
                          className={`font-bold px-3 py-1 rounded-full text-sm ${
                            reportData.analysis.fluency_metrics
                              .fluency_rating === "High"
                              ? "bg-green-100 text-green-800"
                              : reportData.analysis.fluency_metrics
                                  .fluency_rating === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {reportData.analysis.fluency_metrics.fluency_rating}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {reportData.analysis.sentiment && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 text-green-800">
                      Sentiment Analysis
                    </h4>
                    <div className="text-center">
                      <span
                        className={`text-3xl font-bold px-6 py-3 rounded-lg ${
                          reportData.analysis.sentiment === "Positive"
                            ? "bg-green-100 text-green-800"
                            : reportData.analysis.sentiment === "Neutral"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {reportData.analysis.sentiment}
                      </span>
                      <p className="mt-2 text-sm text-green-600">
                        Overall interview sentiment
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Analysis Not Available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This interview has not been analyzed yet or analysis is in
                progress.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!reportData && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No report selected
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Select an interview from the dropdown above to view detailed
            analytics.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
