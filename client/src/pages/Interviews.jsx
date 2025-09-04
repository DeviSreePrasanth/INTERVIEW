import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusIcon,
  ArrowLeftIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserIcon,
  EyeIcon,
  TrashIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Interviews = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State variables
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comingFromGroups, setComingFromGroups] = useState(false);
  const [selectedInterviewGroup, setSelectedInterviewGroup] = useState(null);

  const [newInterview, setNewInterview] = useState({
    candidateName: "",
    candidateEmail: "",
    interviewerName: "",
  });

  // Effect hooks
  useEffect(() => {
    loadInterviewGroupData();
  }, [selectedInterviewGroup]);

  useEffect(() => {
    const selectedGroup = localStorage.getItem("selectedInterviewGroup");
    const groupIdFromUrl = searchParams.get("group");

    if (!selectedGroup && !groupIdFromUrl && !selectedInterviewGroup) {
      navigate("/interview-groups");
      return;
    }
  }, [selectedInterviewGroup, navigate, searchParams]);

  useEffect(() => {
    const selectedGroup = localStorage.getItem("selectedInterviewGroup");

    if (selectedGroup) {
      const groupData = JSON.parse(selectedGroup);

      if (groupData && (groupData.id || groupData._id)) {
        setComingFromGroups(true);
        setSelectedInterviewGroup(groupData);
        setSearchParams({ group: groupData.id || groupData._id });

        setNewInterview((prev) => ({
          ...prev,
          interviewGroup: groupData.id || groupData._id,
          position: groupData.position,
          department: groupData.department,
          candidateCollege: groupData.college,
          candidateBatch: groupData.batch,
        }));
      }

      localStorage.removeItem("selectedInterviewGroup");
    }
  }, [setSearchParams]);

  // Data loading functions
  const loadInterviewGroupData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!selectedInterviewGroup || !selectedInterviewGroup._id) {
        setInterviews([]);
        setLoading(false);
        return;
      }

      const interviewsResponse = await fetch(
        `/api/interviews?interviewGroup=${selectedInterviewGroup._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!interviewsResponse.ok) {
        throw new Error(
          `Failed to load interviews: ${interviewsResponse.status}`
        );
      }

      const allInterviews = await interviewsResponse.json();
      let interviewsArray = Array.isArray(allInterviews)
        ? allInterviews
        : allInterviews.interviews || [];

      setInterviews(interviewsArray);
    } catch (error) {
      console.error("Error loading interview group data:", error);
      alert("Failed to load interviews for this group.");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Interview processing functions
  const handleCreateInterview = async (e) => {
    e.preventDefault();

    if (!selectedInterviewGroup || !selectedInterviewGroup._id) {
      alert("Please select an interview group first");
      return;
    }

    if (
      !newInterview.candidateName ||
      !newInterview.candidateEmail ||
      !newInterview.interviewerName
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const interviewData = {
        candidateName: newInterview.candidateName,
        candidateEmail: newInterview.candidateEmail,
        interviewerName: newInterview.interviewerName,
        position: selectedInterviewGroup.position,
        department: selectedInterviewGroup.department,
        candidateCollege: selectedInterviewGroup.college,
        interviewGroup: selectedInterviewGroup._id,
        status: "Completed"
      };

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      const createdInterview = await response.json();
      
      // Reset form and close modal
      setNewInterview({
        candidateName: "",
        candidateEmail: "",
        interviewerName: "",
        position: "",
        department: "",
        candidateCollege: "",
        candidateBatch: "",
        interviewGroup: "",
      });
      
      setShowCreateModal(false);
      
      // Reload interviews
      await loadInterviewGroupData();
      
      alert("Interview created successfully!");
    } catch (error) {
      console.error("Error creating interview:", error);
      alert("Failed to create interview. Please try again.");
    }
  };

  // Helper functions
  const viewInterviewDetails = (interview) => {
    setSelectedInterview(interview);
    setShowDetails(true);
  };

  const handleDeleteInterview = async (interviewId) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/interviews/${interviewId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to delete interview");
        }

        loadInterviewGroupData();
        alert("Interview deleted successfully!");
      } catch (error) {
        console.error("Error deleting interview:", error);
        alert(`Error deleting interview: ${error.message}`);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Inline Interview Form Component
  const InterviewForm = ({ onSubmit, onCancel }) => (
    <div className="p-8">
      {/* Interview Group Info */}
      {selectedInterviewGroup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Interview Group: {selectedInterviewGroup.name}
              </p>
              <p className="text-xs text-blue-600">
                {selectedInterviewGroup.college} • {selectedInterviewGroup.position}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Enter candidate's full name"
            />
          </div>

          {/* Candidate Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="candidate@example.com"
            />
          </div>

          {/* Interviewer Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Enter interviewer's name"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg"
          >
            Create Interview
          </button>
        </div>
      </form>
    </div>
  );

  // Inline Interviews Table Component
  const InterviewsTable = () => (
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
            {interviews.map((interview) => (
              <tr key={interview._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {interview.candidate?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {interview.candidate?.email || "No email"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{interview.position}</div>
                  <div className="text-sm text-gray-500">{interview.department}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(interview.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                    {interview.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedInterview(interview);
                        setShowDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteInterview(interview._id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Interview"
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
  );

  // Inline Interview Details Modal Component
  const InterviewDetailsModal = () => {
    if (!showDetails || !selectedInterview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Interview Details</h2>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3">Candidate Information</h3>
              <p><strong>Name:</strong> {selectedInterview.candidate?.name || "Unknown"}</p>
              <p><strong>Email:</strong> {selectedInterview.candidate?.email || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Interview Information</h3>
              <p><strong>Position:</strong> {selectedInterview.position}</p>
              <p><strong>Department:</strong> {selectedInterview.department}</p>
              <p><strong>Status:</strong> {selectedInterview.status}</p>
              <p><strong>Date:</strong> {new Date(selectedInterview.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Interview Details Modal */}
      <InterviewDetailsModal />
      
      {/* Create Interview Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Create New Interview</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <InterviewForm
              onSubmit={handleCreateInterview}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Main Interview Management Interface */}
      {!showCreateModal && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Professional Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Back Button */}
                <div className="flex items-center">
                  <button
                    onClick={() => navigate("/interview-groups")}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Groups
                  </button>
                </div>

                {/* Centered Title */}
                <div className="flex-1 flex justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Interview Management
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedInterviewGroup
                        ? `${selectedInterviewGroup.name} - ${selectedInterviewGroup.college}`
                        : "Select an interview group to manage interviews"}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center">
                  {selectedInterviewGroup && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Interview
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group Information Banner */}
          {selectedInterviewGroup && (
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedInterviewGroup.college}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedInterviewGroup.position}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <VideoCameraIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {interviews.length} Interview
                      {interviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Interviews Table */}
            {selectedInterviewGroup && interviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <InterviewsTable />
              </div>
            )}

            {/* Professional Empty State */}
            {interviews.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="text-center py-16 px-6">
                  <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
                    <VideoCameraIcon className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {selectedInterviewGroup
                      ? `No interviews in ${selectedInterviewGroup.name}`
                      : "Welcome to Interview Management"}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                    {selectedInterviewGroup
                      ? `Ready to process your first interview for ${selectedInterviewGroup.name}? Click the button below to get started with professional interview analysis.`
                      : "Please select an interview group from the groups page to view and manage interviews for that specific group."}
                  </p>
                  {selectedInterviewGroup ? (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Process First Interview
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/interview-groups")}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      <ArrowLeftIcon className="h-5 w-5 mr-2" />
                      Go to Interview Groups
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Details Modal */}
      <InterviewDetailsModal
        showDetails={showDetails}
        selectedInterview={selectedInterview}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
};

export default Interviews;
