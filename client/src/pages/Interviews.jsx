import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusIcon,
  EyeIcon,
  TrashIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CloudArrowUpIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { processInterviewAudio } from "../services/speechAnalysisService";

const Interviews = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [interviews, setInterviews] = useState([]);
  const [interviewGroups, setInterviewGroups] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comingFromGroups, setComingFromGroups] = useState(false);
  const [selectedGroupCollege, setSelectedGroupCollege] = useState(
    searchParams.get("college") || null
  );

  const [newInterview, setNewInterview] = useState({
    // Essential fields only
    candidateName: "",
    candidateEmail: "",
    interviewerName: "",
    interviewFile: null,
  });

  const [filters, setFilters] = useState({
    status: "",
    analysisStatus: "",
    position: "",
  });

  useEffect(() => {
    // Load static data for demonstration
    loadStaticData();
  }, [filters, selectedGroupCollege]);

  // Redirect to Interview Groups if no college is selected
  useEffect(() => {
    const collegeParam = searchParams.get("college");
    const selectedGroup = localStorage.getItem("selectedInterviewGroup");

    // If no college parameter and no localStorage context, redirect to interview groups
    if (!collegeParam && !selectedGroup && !selectedGroupCollege) {
      navigate("/interview-groups");
      return;
    }
  }, [searchParams, selectedGroupCollege, navigate]);

  const loadStaticData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Load interview groups
      const groupsResponse = await fetch("/api/interview-groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const groups = await groupsResponse.json();
      setInterviewGroups(groups);

      // Load candidates - filter by college if a group is selected
      const candidatesResponse = await fetch("/api/candidates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allCandidates = await candidatesResponse.json();

      let filteredCandidates = [];
      if (selectedGroupCollege) {
        filteredCandidates = allCandidates.filter(
          (candidate) => candidate.college === selectedGroupCollege
        );
      }
      setCandidates(filteredCandidates);

      // Load interviews - only if a specific college is selected
      if (selectedGroupCollege) {
        const interviewsResponse = await fetch("/api/interviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allInterviews = await interviewsResponse.json();

        // Filter by college and apply other filters
        let filteredInterviews = allInterviews.filter(
          (interview) => interview.candidate?.college === selectedGroupCollege
        );

        // Apply additional filters
        if (filters.status) {
          filteredInterviews = filteredInterviews.filter(
            (interview) => interview.status === filters.status
          );
        }
        if (filters.analysisStatus) {
          filteredInterviews = filteredInterviews.filter(
            (interview) => interview.analysisStatus === filters.analysisStatus
          );
        }
        if (filters.position) {
          filteredInterviews = filteredInterviews.filter(
            (interview) => interview.position === filters.position
          );
        }

        setInterviews(filteredInterviews);
      } else {
        setInterviews([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }; // Handle context from Interview Groups page
  useEffect(() => {
    const selectedGroup = localStorage.getItem("selectedInterviewGroup");
    const preselectedCandidate = localStorage.getItem("preselectedCandidate");

    if (selectedGroup) {
      const groupData = JSON.parse(selectedGroup);
      setComingFromGroups(true);
      setSelectedGroupCollege(groupData.college);

      // Update URL with college parameter
      setSearchParams({ college: groupData.college });

      setNewInterview((prev) => ({
        ...prev,
        interviewGroup: groupData.id,
        position: groupData.position,
        department: groupData.department,
        candidateCollege: groupData.college,
        candidateBatch: groupData.batch,
      }));

      // Clear the stored context after using it
      localStorage.removeItem("selectedInterviewGroup");
    }

    if (preselectedCandidate) {
      const candidateData = JSON.parse(preselectedCandidate);
      setNewInterview((prev) => ({
        ...prev,
        candidateName: candidateData.name,
        candidateEmail: candidateData.email,
      }));

      // Clear the stored context and show the create modal
      localStorage.removeItem("preselectedCandidate");
      setShowCreateModal(true);
    }
  }, [setSearchParams]); // Run only on component mount

  // Update URL when selectedGroupCollege changes
  useEffect(() => {
    if (selectedGroupCollege) {
      setSearchParams({ college: selectedGroupCollege });
    } else {
      setSearchParams({});
    }
  }, [selectedGroupCollege, setSearchParams]);

  const handleCreateInterview = async (e) => {
    e.preventDefault();

    try {
      // Generate a duration for the uploaded file (mock)
      const mockDuration = `${Math.floor(Math.random() * 15) + 5}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, "0")}`;

      // Create interview data
      const interviewData = {
        candidateName: newInterview.candidateName,
        candidateEmail: newInterview.candidateEmail,
        interviewerName: newInterview.interviewerName,
        interviewFile: newInterview.interviewFile?.name || "audio_file.mp3",
        candidateCollege: selectedGroupCollege || "Unknown College",
        position: "Interview Position",
        department: "General",
        duration: mockDuration,
        uploadDate: new Date().toISOString().split("T")[0],
        status: "Completed",
        analysisStatus: "Processing",
      };

      // Create the interview record first
      const newInterviewRecord = createInterview(interviewData);

      // Process the uploaded audio file with speech analysis
      if (newInterview.interviewFile) {
        try {
          // Simulate processing the audio file
          const analysisResult = await processInterviewAudio(
            newInterview.interviewFile
          );

          // Update the interview with analysis results
          updateInterview(newInterviewRecord._id, {
            analysis: analysisResult,
            analysisStatus: "Analyzed",
          });
        } catch (analysisError) {
          console.error("Error analyzing audio:", analysisError);
          // Keep interview record but mark analysis as failed
          updateInterview(newInterviewRecord._id, {
            analysisStatus: "Failed",
          });
        }
      }

      // Refresh the interviews list with college filter
      loadStaticData();

      // Reset form and close modal
      setShowCreateModal(false);
      setComingFromGroups(false);
      resetForm();

      alert(
        "Interview uploaded successfully! Analysis will be available shortly."
      );
    } catch (error) {
      console.error("Error uploading interview:", error);
      alert("Error uploading interview");
    }
  };

  const resetForm = () => {
    setComingFromGroups(false);
    setNewInterview({
      candidateName: "",
      candidateEmail: "",
      interviewerName: "",
      interviewFile: null,
    });
  };

  const viewInterviewDetails = async (interview) => {
    setSelectedInterview(interview);
    setShowDetails(true);
  };

  const handleDeleteInterview = async (interviewId) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      try {
        // Delete interview using static data function
        const deletedInterview = deleteInterview(interviewId);

        if (deletedInterview) {
          // Refresh the interviews list
          const updatedInterviews = getFilteredInterviews(filters);
          setInterviews(updatedInterviews);
          alert("Interview deleted successfully!");
        } else {
          alert("Interview not found");
        }
      } catch (error) {
        console.error("Error deleting interview:", error);
        alert("Error deleting interview");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAnalysisStatusColor = (status) => {
    switch (status) {
      case "Analyzed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        <div className="flex items-center space-x-4">
          {comingFromGroups && (
            <button
              onClick={() => navigate("/interview-groups")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
            <p className="text-gray-600">
              {selectedGroupCollege
                ? `Manage interviews for ${selectedGroupCollege} students`
                : "Select a college from Interview Groups to view and manage interviews"}
            </p>
            {selectedGroupCollege && (
              <div className="mt-2 flex items-center">
                <AcademicCapIcon className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600 font-medium">
                  Showing interviews from: {selectedGroupCollege}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {selectedGroupCollege && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Upload Interview</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters - Only show when college is selected */}
      {selectedGroupCollege && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Status
              </label>
              <select
                value={filters.analysisStatus}
                onChange={(e) =>
                  setFilters({ ...filters, analysisStatus: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Analysis Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Analyzed">Analyzed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={filters.position}
                onChange={(e) =>
                  setFilters({ ...filters, position: e.target.value })
                }
                placeholder="Filter by position"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Interviews List - Only show when college is selected */}
      {selectedGroupCollege && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analysis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {interview.candidateName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {interview.candidateEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interview.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {interview.candidateCollege || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          interview.status
                        )}`}
                      >
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAnalysisStatusColor(
                          interview.analysisStatus
                        )}`}
                      >
                        {interview.analysisStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interview.analysis?.scores?.overall_score?.toFixed(1) ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewInterviewDetails(interview)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInterview(interview._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {interviews.length === 0 && (
        <div className="text-center py-12">
          <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedGroupCollege
              ? `No interviews from ${selectedGroupCollege}`
              : "Select a College to View Interviews"}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedGroupCollege
              ? `Upload your first interview for students from ${selectedGroupCollege}`
              : "Go to Interview Groups and select a college to view and manage interviews for that college"}
          </p>
          {selectedGroupCollege ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Interview
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchParams({});
                navigate("/interview-groups");
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Interview Groups
            </button>
          )}
        </div>
      )}

      {/* Upload Interview Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upload New Interview</h2>

            {/* College Information Banner */}
            {selectedGroupCollege && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Showing candidates from: {selectedGroupCollege}
                    </p>
                    <p className="text-xs text-blue-600">
                      Only students from this college will be available for
                      selection
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info message when coming from Interview Groups */}
            {comingFromGroups && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <VideoCameraIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    Interview group information has been pre-populated. Please
                    add candidate details and upload the interview recording.
                  </p>
                </div>
              </div>
            )}

            {/* Automatic Analysis Information */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CloudArrowUpIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Automatic Speech Analysis
                  </p>
                  <p className="text-xs text-green-700">
                    Your uploaded audio will be automatically processed using
                    advanced NLP techniques to analyze technical depth,
                    confidence, communication skills, and generate comprehensive
                    insights with scoring.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateInterview} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInterview.candidateName}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        candidateName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter candidate name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newInterview.candidateEmail}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        candidateEmail: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter candidate email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interviewer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInterview.interviewerName}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        interviewerName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter interviewer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Audio File *
                  </label>
                  <input
                    type="file"
                    required
                    accept="audio/*"
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        interviewFile: e.target.files[0],
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: MP3, WAV, M4A, AAC and other audio formats
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setComingFromGroups(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview Details Modal */}
      {showDetails && selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Interview Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3">Candidate Information</h3>
                <p>
                  <strong>Name:</strong> {selectedInterview.candidateName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedInterview.candidateEmail}
                </p>
                <p>
                  <strong>College:</strong> {selectedInterview.candidateCollege}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Interview Information</h3>
                <p>
                  <strong>Interviewer:</strong>{" "}
                  {selectedInterview.interviewerName}
                </p>
                <p>
                  <strong>Position:</strong> {selectedInterview.position}
                </p>
                <p>
                  <strong>Department:</strong> {selectedInterview.department}
                </p>
                <p>
                  <strong>Status:</strong> {selectedInterview.status}
                </p>
                <p>
                  <strong>Analysis Status:</strong>{" "}
                  {selectedInterview.analysisStatus}
                </p>
                <p>
                  <strong>Interview Date:</strong>{" "}
                  {selectedInterview.interviewDate}
                </p>
                <p>
                  <strong>Duration:</strong> {selectedInterview.duration}
                </p>
                <p>
                  <strong>Upload Date:</strong> {selectedInterview.uploadDate}
                </p>
              </div>
            </div>

            {selectedInterview.analysis && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4 text-lg">Analysis Results</h3>

                {/* Scores Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">
                      Overall Score
                    </p>
                    <p className="text-2xl font-bold text-blue-800">
                      {selectedInterview.analysis.scores?.overall_score?.toFixed(
                        1
                      )}
                      /10
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">
                      Technical Depth
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      {selectedInterview.analysis.scores?.technical_depth?.toFixed(
                        1
                      )}
                      /10
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">
                      Communication
                    </p>
                    <p className="text-2xl font-bold text-purple-800">
                      {selectedInterview.analysis.scores?.communication?.toFixed(
                        1
                      )}
                      /10
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium">
                      Confidence
                    </p>
                    <p className="text-2xl font-bold text-orange-800">
                      {selectedInterview.analysis.scores?.confidence?.toFixed(
                        1
                      )}
                      /10
                    </p>
                  </div>
                </div>

                {/* Transcript Section */}
                {selectedInterview.analysis.transcript && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-gray-800">
                      Interview Transcript
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>
                            Duration:{" "}
                            {selectedInterview.analysis.transcript.duration}
                          </span>
                          <span>
                            Words: {selectedInterview.analysis.transcript.words}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedInterview.analysis.transcript.text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {selectedInterview.analysis.insights &&
                  selectedInterview.analysis.insights.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-800">
                        Key Insights
                      </h4>
                      <div className="space-y-2">
                        {selectedInterview.analysis.insights.map(
                          (insight, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-gray-700">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Technical Terms & Keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {selectedInterview.analysis.technical_terms &&
                    selectedInterview.analysis.technical_terms.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">
                          Technical Terms
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedInterview.analysis.technical_terms.map(
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

                  {selectedInterview.analysis.keywords &&
                    selectedInterview.analysis.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">
                          Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedInterview.analysis.keywords.map(
                            (keyword, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                              >
                                {keyword}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Fluency Metrics & Sentiment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedInterview.analysis.fluency_metrics && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-indigo-800">
                        Fluency Analysis
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-indigo-600">
                            Words per minute:
                          </span>
                          <span className="font-medium text-indigo-800">
                            {
                              selectedInterview.analysis.fluency_metrics
                                .words_per_minute
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-600">Total words:</span>
                          <span className="font-medium text-indigo-800">
                            {
                              selectedInterview.analysis.fluency_metrics
                                .total_words
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-600">
                            Speaking duration:
                          </span>
                          <span className="font-medium text-indigo-800">
                            {
                              selectedInterview.analysis.fluency_metrics
                                .speaking_duration
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-600">
                            Fluency rating:
                          </span>
                          <span
                            className={`font-medium px-2 py-1 rounded ${
                              selectedInterview.analysis.fluency_metrics
                                .fluency_rating === "High"
                                ? "bg-green-100 text-green-800"
                                : selectedInterview.analysis.fluency_metrics
                                    .fluency_rating === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {
                              selectedInterview.analysis.fluency_metrics
                                .fluency_rating
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedInterview.analysis.sentiment && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-green-800">
                        Sentiment Analysis
                      </h4>
                      <div className="flex items-center justify-center">
                        <span
                          className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                            selectedInterview.analysis.sentiment === "Positive"
                              ? "bg-green-100 text-green-800"
                              : selectedInterview.analysis.sentiment ===
                                "Neutral"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedInterview.analysis.sentiment}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedInterview.questions &&
              selectedInterview.questions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">
                    Questions ({selectedInterview.questions.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedInterview.questions.map((question, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            Q{index + 1}: {question.question}
                          </h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {question.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {question.expectedAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {selectedInterview.interviewFile && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Files</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <VideoCameraIcon className="h-5 w-5 text-blue-600" />
                    <a
                      href={`http://localhost:5000${selectedInterview.interviewFile.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {selectedInterview.interviewFile.originalname}
                    </a>
                  </div>
                  {selectedInterview.questionsFile && (
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-5 w-5 text-green-600" />
                      <a
                        href={`http://localhost:5000${selectedInterview.questionsFile.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        {selectedInterview.questionsFile.originalname}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedInterview.notes && (
              <div>
                <h3 className="font-semibold mb-3">Notes</h3>
                <p className="text-gray-700">{selectedInterview.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;
