import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

const InterviewGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [candidates, setCandidates] = useState([]);

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    college: "",
    department: "",
    batch: "",
    position: "",
    interviewDate: "",
    location: "",
    instructions: "",
    maxCandidates: 50,
  });

  const [filters, setFilters] = useState({
    status: "",
    college: "",
    position: "",
  });

  useEffect(() => {
    fetchInterviewGroups();
    fetchCandidates();
  }, [filters]);

  const fetchInterviewGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      if (filters.status) queryParams.append("status", filters.status);
      if (filters.college) queryParams.append("college", filters.college);
      if (filters.position) queryParams.append("position", filters.position);

      const response = await fetch(
        `http://localhost:5000/api/interview-groups?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGroups(data.interviewGroups || []);
      } else {
        console.error("Error fetching interview groups");
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching interview groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/candidates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setCandidates([]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/interview-groups",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newGroup),
        }
      );

      if (response.ok) {
        setShowCreateModal(false);
        setNewGroup({
          name: "",
          description: "",
          college: "",
          department: "",
          batch: "",
          position: "",
          interviewDate: "",
          location: "",
          instructions: "",
          maxCandidates: 50,
        });
        fetchInterviewGroups();
      } else {
        const data = await response.json();
        alert(data.message || "Error creating interview group");
      }
    } catch (error) {
      console.error("Error creating interview group:", error);
      alert("Error creating interview group");
    }
  };

  const navigateToInterviews = (group) => {
    // Store the current group context in localStorage for the Interviews page
    localStorage.setItem(
      "selectedInterviewGroup",
      JSON.stringify({
        id: group._id,
        name: group.name,
        college: group.college,
        department: group.department,
        position: group.position,
        batch: group.batch,
      })
    );

    // Navigate to interviews page with college parameter
    navigate(`/interviews?college=${encodeURIComponent(group.college)}`);
  };

  const deleteGroup = async (groupId) => {
    if (
      window.confirm("Are you sure you want to delete this interview group?")
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/interview-groups/${groupId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          fetchInterviewGroups();
        } else {
          const data = await response.json();
          alert(data.message || "Error deleting interview group");
        }
      } catch (error) {
        console.error("Error deleting interview group:", error);
        alert("Error deleting interview group");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Groups</h1>
          <p className="text-gray-600">
            Manage batch interviews and group evaluations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Filters */}
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
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College
            </label>
            <input
              type="text"
              value={filters.college}
              onChange={(e) =>
                setFilters({ ...filters, college: e.target.value })
              }
              placeholder="Filter by college"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
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

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group._id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.name}
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      group.status
                    )}`}
                  >
                    {group.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateToInterviews(group)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Create Interview"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteGroup(group._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                  <span>{group.college || "No college specified"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{group.position}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  <span>
                    {group.currentCandidates}/{group.maxCandidates} candidates
                  </span>
                </div>
                {group.interviewDate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(group.interviewDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {group.statistics?.analyzedInterviews || 0} analyzed
                </div>
                <div className="text-sm font-medium text-blue-600">
                  Avg: {group.statistics?.averageScore?.toFixed(1) || "0.0"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && !loading && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No interview groups found
          </h3>
          <p className="text-gray-600 mb-4">
            You haven't created any interview groups yet. Create your first
            group to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Interview Group
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Interview Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })
                    }
                    placeholder="e.g., GVP_Interview_2025"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroup.position}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, position: e.target.value })
                    }
                    placeholder="e.g., Software Developer"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College
                  </label>
                  <input
                    type="text"
                    value={newGroup.college}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, college: e.target.value })
                    }
                    placeholder="e.g., GVP College of Engineering"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newGroup.department}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, department: e.target.value })
                    }
                    placeholder="e.g., Computer Science"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={newGroup.batch}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, batch: e.target.value })
                    }
                    placeholder="e.g., 2025"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Candidates
                  </label>
                  <input
                    type="number"
                    value={newGroup.maxCandidates}
                    onChange={(e) =>
                      setNewGroup({
                        ...newGroup,
                        maxCandidates: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="200"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={newGroup.interviewDate}
                    onChange={(e) =>
                      setNewGroup({
                        ...newGroup,
                        interviewDate: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newGroup.location}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, location: e.target.value })
                  }
                  placeholder="e.g., Campus Auditorium"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                  placeholder="Brief description of the interview group"
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={newGroup.instructions}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, instructions: e.target.value })
                  }
                  placeholder="Special instructions for candidates"
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewGroups;
