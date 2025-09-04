import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
} from "@heroicons/react/24/solid";

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [interviewGroups, setInterviewGroups] = useState([]);

  // Load reports and interview groups
  useEffect(() => {
    loadReportsData();
    loadInterviewGroups();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/interview-groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterviewGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Error loading interview groups:", err);
    }
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.interviewGroupName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup =
      filterGroup === "all" || report.interviewGroup === filterGroup;
    const matchesStatus =
      filterStatus === "all" || report.analysisStatus === filterStatus;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Analyzed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Processing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Analyzed":
        return <CheckCircleIconSolid className="w-3 h-3 mr-1" />;
      case "Processing":
        return <ClockIconSolid className="w-3 h-3 mr-1" />;
      case "Failed":
        return <ExclamationTriangleIconSolid className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const viewReport = (report) => {
    // Navigate to the interview details page
    navigate(
      `/interviews?group=${report.interviewGroup}&interview=${report._id}`
    );
  };

  const viewGroupReports = (groupId) => {
    setFilterGroup(groupId);
    setSearchTerm("");
  };

  const downloadReport = async (reportId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/reports/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `interview-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error Loading Reports
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={loadReportsData}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Interview Reports
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View and download reports from all interview groups
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search candidates, groups, positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Group Filter */}
            <div className="sm:w-48">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Groups</option>
                {interviewGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:w-40">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Analyzed">Analyzed</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm ||
              filterGroup !== "all" ||
              filterStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterGroup("all");
                  setFilterStatus("all");
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Interview Groups Summary */}
        {interviewGroups.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reports by Interview Group
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviewGroups.map((group) => {
                const groupReports = reports.filter(
                  (r) => r.interviewGroup === group._id
                );
                const analyzedCount = groupReports.filter(
                  (r) => r.analysisStatus === "Analyzed"
                ).length;
                const processingCount = groupReports.filter(
                  (r) => r.analysisStatus === "Processing"
                ).length;

                return (
                  <div
                    key={group._id}
                    onClick={() => viewGroupReports(group._id)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-500">{group.college}</p>
                        <p className="text-xs text-gray-400">
                          {group.position}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {groupReports.length}
                        </p>
                        <p className="text-xs text-gray-500">Reports</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-green-600">
                        ✓ {analyzedCount} Completed
                      </span>
                      <span className="text-yellow-600">
                        ⏳ {processingCount} Processing
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reports Table */}
        {filteredReports.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interview Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr
                      key={report._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                {(report.candidateName || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {report.candidateName || "Unknown Candidate"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {report.candidateEmail || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.interviewGroupName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.college}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.position}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(report.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            report.analysisStatus
                          )}`}
                        >
                          {getStatusIcon(report.analysisStatus)}
                          <span>{report.analysisStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewReport(report)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            title="View Report"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>

                          {report.analysisStatus === "Analyzed" && (
                            <button
                              onClick={() => downloadReport(report._id)}
                              className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                              title="Download Report"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No reports found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterGroup !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filters."
                : "Reports will appear here once interviews are analyzed."}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {filteredReports.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Reports
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredReports.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      filteredReports.filter(
                        (r) => r.analysisStatus === "Analyzed"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Processing
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      filteredReports.filter(
                        (r) => r.analysisStatus === "Processing"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Failed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      filteredReports.filter(
                        (r) => r.analysisStatus === "Failed"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
