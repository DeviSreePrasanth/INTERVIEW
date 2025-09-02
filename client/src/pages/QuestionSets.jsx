import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

const QuestionSets = () => {
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [newQuestionSet, setNewQuestionSet] = useState({
    title: "",
    description: "",
    position: "",
    department: "",
    college: "",
    questions: [],
  });

  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    position: "",
    department: "",
    college: "",
    file: null,
  });

  const [filters, setFilters] = useState({
    position: "",
    department: "",
    college: "",
  });

  useEffect(() => {
    fetchQuestionSets();
  }, [filters]);

  const fetchQuestionSets = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(
        `http://localhost:5000/api/question-sets?${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setQuestionSets(data.questionSets || []);
    } catch (error) {
      console.error("Error fetching question sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestionSet = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/question-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newQuestionSet),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewQuestionSet({
          title: "",
          description: "",
          position: "",
          department: "",
          college: "",
          questions: [],
        });
        fetchQuestionSets();
      } else {
        const data = await response.json();
        alert(data.message || "Error creating question set");
      }
    } catch (error) {
      console.error("Error creating question set:", error);
      alert("Error creating question set");
    }
  };

  const handleUploadQuestionSet = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert("Please select a file");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("questionsFile", uploadData.file);
      formData.append("title", uploadData.title);
      formData.append("description", uploadData.description);
      formData.append("position", uploadData.position);
      formData.append("department", uploadData.department);
      formData.append("college", uploadData.college);

      const response = await fetch(
        "http://localhost:5000/api/question-sets/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setShowUploadModal(false);
        setUploadData({
          title: "",
          description: "",
          position: "",
          department: "",
          college: "",
          file: null,
        });
        fetchQuestionSets();
        const data = await response.json();
        alert(data.message);
      } else {
        const data = await response.json();
        alert(data.message || "Error uploading question set");
      }
    } catch (error) {
      console.error("Error uploading question set:", error);
      alert("Error uploading question set");
    }
  };

  const viewQuestionSetDetails = async (questionSet) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/question-sets/${questionSet._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setSelectedQuestionSet(data);
      setShowDetails(true);
    } catch (error) {
      console.error("Error fetching question set details:", error);
    }
  };

  const deleteQuestionSet = async (questionSetId) => {
    if (window.confirm("Are you sure you want to delete this question set?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/question-sets/${questionSetId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          fetchQuestionSets();
        } else {
          const data = await response.json();
          alert(data.message || "Error deleting question set");
        }
      } catch (error) {
        console.error("Error deleting question set:", error);
        alert("Error deleting question set");
      }
    }
  };

  const addQuestion = () => {
    setNewQuestionSet({
      ...newQuestionSet,
      questions: [
        ...newQuestionSet.questions,
        {
          question: "",
          expectedAnswer: "",
          category: "general",
          difficulty: "medium",
          points: 10,
        },
      ],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...newQuestionSet.questions];
    updatedQuestions[index][field] = value;
    setNewQuestionSet({ ...newQuestionSet, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = newQuestionSet.questions.filter(
      (_, i) => i !== index
    );
    setNewQuestionSet({ ...newQuestionSet, questions: updatedQuestions });
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
          <h1 className="text-2xl font-bold text-gray-900">Question Sets</h1>
          <p className="text-gray-600">
            Manage interview questions and answer templates
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <CloudArrowUpIcon className="h-5 w-5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Manually</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              placeholder="Filter by department"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
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
        </div>
      </div>

      {/* Question Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionSets.map((questionSet) => (
          <div
            key={questionSet._id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {questionSet.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {questionSet.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewQuestionSetDetails(questionSet)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteQuestionSet(questionSet._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{questionSet.position}</span>
                </div>
                {questionSet.college && (
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    <span>{questionSet.college}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  <span>{questionSet.totalQuestions} questions</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {questionSet.totalPoints} total points
                </div>
                <div className="text-sm font-medium text-blue-600">
                  {new Date(questionSet.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questionSets.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No question sets
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first question set to get started
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Upload File
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Manually
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Upload Question Set</h2>
            <form onSubmit={handleUploadQuestionSet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
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
                  value={uploadData.position}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, position: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={uploadData.department}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, department: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College
                </label>
                <input
                  type="text"
                  value={uploadData.college}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, college: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <input
                  type="file"
                  required
                  accept=".json,.csv,.txt"
                  onChange={(e) =>
                    setUploadData({ ...uploadData, file: e.target.files[0] })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JSON, CSV, TXT
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Manual Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Question Set</h2>
            <form onSubmit={handleCreateQuestionSet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestionSet.title}
                    onChange={(e) =>
                      setNewQuestionSet({
                        ...newQuestionSet,
                        title: e.target.value,
                      })
                    }
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
                    value={newQuestionSet.position}
                    onChange={(e) =>
                      setNewQuestionSet({
                        ...newQuestionSet,
                        position: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newQuestionSet.department}
                    onChange={(e) =>
                      setNewQuestionSet({
                        ...newQuestionSet,
                        department: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College
                  </label>
                  <input
                    type="text"
                    value={newQuestionSet.college}
                    onChange={(e) =>
                      setNewQuestionSet({
                        ...newQuestionSet,
                        college: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newQuestionSet.description}
                  onChange={(e) =>
                    setNewQuestionSet({
                      ...newQuestionSet,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              {/* Questions */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                </div>

                {newQuestionSet.questions.map((question, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 mb-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={question.category}
                          onChange={(e) =>
                            updateQuestion(index, "category", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical</option>
                          <option value="behavioral">Behavioral</option>
                          <option value="situational">Situational</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty
                        </label>
                        <select
                          value={question.difficulty}
                          onChange={(e) =>
                            updateQuestion(index, "difficulty", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(index, "question", e.target.value)
                        }
                        rows="2"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Answer
                      </label>
                      <textarea
                        value={question.expectedAnswer}
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "expectedAnswer",
                            e.target.value
                          )
                        }
                        rows="3"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "points",
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max="100"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                ))}
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
                  Create Question Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Set Details Modal */}
      {showDetails && selectedQuestionSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{selectedQuestionSet.title}</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p>
                <strong>Position:</strong> {selectedQuestionSet.position}
              </p>
              <p>
                <strong>Department:</strong> {selectedQuestionSet.department}
              </p>
              <p>
                <strong>College:</strong> {selectedQuestionSet.college}
              </p>
              <p>
                <strong>Total Questions:</strong>{" "}
                {selectedQuestionSet.totalQuestions}
              </p>
              <p>
                <strong>Total Points:</strong> {selectedQuestionSet.totalPoints}
              </p>
              {selectedQuestionSet.description && (
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedQuestionSet.description}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Questions</h3>
              <div className="space-y-4">
                {selectedQuestionSet.questions.map((question, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <div className="flex space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {question.category}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {question.difficulty}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {question.points} pts
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-900 mb-3">{question.question}</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Expected Answer:
                      </p>
                      <p className="text-gray-600">{question.expectedAnswer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionSets;
