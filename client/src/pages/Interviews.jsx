import React, { useState, useEffect, useRef, useCallback } from "react";
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
  MagnifyingGlassIcon,
  FunnelIcon,
  ListBulletIcon,
  CloudArrowUpIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
} from "@heroicons/react/24/solid";

const Interviews = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State variables
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInterviewGroup, setSelectedInterviewGroup] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form and processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState(null);

  // Multiple concurrent processing support
  const [activePolling, setActivePolling] = useState(new Map()); // Map of interviewId -> intervalId
  const activePollingRef = useRef(new Map()); // Ref to avoid dependency issues
  const [processingInterviews, setProcessingInterviews] = useState(new Set()); // Set of processing interview IDs

  const [formStep, setFormStep] = useState(1);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Legacy transcript processing states (kept for compatibility)
  const [createdInterviewId, setCreatedInterviewId] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptStatus, setTranscriptStatus] = useState("idle");

  // Form data
  const [newInterview, setNewInterview] = useState({
    candidateName: "",
    candidateEmail: "",
    interviewerName: "",
  });

  // Q&A Pagination state
  const [qaCurrentPage, setQaCurrentPage] = useState(1);
  const [qaItemsPerPage] = useState(10);
  const [showFormattedQA, setShowFormattedQA] = useState(false);

  // Refs for uncontrolled inputs to avoid focus loss
  const candidateNameRef = useRef(null);
  const candidateEmailRef = useRef(null);
  const interviewerNameRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      // Clear all active polling intervals
      activePollingRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      activePollingRef.current.clear();
      setActivePolling(new Map());
      setProcessingInterviews(new Set());
    };
  }, []); // No dependencies needed for cleanup

  // Debug: Monitor audioFile state changes
  useEffect(() => {
    console.log("Parent audioFile state changed:", audioFile);
  }, [audioFile]);

  // Debug: Monitor audioPreview state changes
  useEffect(() => {
    console.log("Parent audioPreview state changed:", audioPreview);
  }, [audioPreview]);

  // Keep ref in sync with state
  useEffect(() => {
    activePollingRef.current = activePolling;
  }, [activePolling]);

  // Start polling for transcript - supports multiple concurrent processes
  const startPollingTranscript = useCallback(
    (interviewId) => {
      console.log("=== Starting Polling ===");
      console.log("Interview ID received:", interviewId);
      console.log("Type of ID:", typeof interviewId);

      if (!interviewId) {
        console.error("No interview ID provided to polling function!");
        return;
      }

      // Check if already polling this interview
      if (activePollingRef.current.has(interviewId)) {
        console.log("Already polling interview:", interviewId);
        return;
      }

      // Add to processing set
      setProcessingInterviews((prev) => new Set(prev).add(interviewId));

      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          const url = `/api/interviews/${interviewId}/status`;
          console.log("Polling URL:", url);

          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            console.error(
              "Polling response not OK:",
              response.status,
              response.statusText
            );
            // Stop polling this interview on error
            stopPollingTranscript(interviewId);
            return;
          }

          const data = await response.json();
          console.log("Polling status for", interviewId, ":", data);

          // Stop polling when complete or failed
          if (
            data.analysisStatus === "Analyzed" ||
            data.analysisStatus === "Failed"
          ) {
            console.log(
              "Processing complete for interview:",
              interviewId,
              "Status:",
              data.analysisStatus
            );
            stopPollingTranscript(interviewId);

            // Reload interviews list to show updated status
            await loadInterviewGroupData();

            // Show notification
            const message =
              data.analysisStatus === "Analyzed"
                ? `Audio processing completed for interview ${interviewId.slice(
                    -6
                  )}`
                : `Audio processing failed for interview ${interviewId.slice(
                    -6
                  )}`;

            // Optional: Show a toast notification instead of alert
            console.log(message);
          }
        } catch (error) {
          console.error("Polling error for", interviewId, ":", error);
          stopPollingTranscript(interviewId);
        }
      }, 3000);

      // Store the interval ID
      activePollingRef.current.set(interviewId, interval);
      setActivePolling((prev) => new Map(prev).set(interviewId, interval));
    },
    [] // No dependencies needed since we use refs
  );

  // Stop polling for a specific interview
  const stopPollingTranscript = useCallback((interviewId) => {
    // Clear from ref
    const intervalId = activePollingRef.current.get(interviewId);
    if (intervalId) {
      clearInterval(intervalId);
      activePollingRef.current.delete(interviewId);
    }

    // Update state
    setActivePolling((prev) => {
      const newMap = new Map(prev);
      newMap.delete(interviewId);
      return newMap;
    });

    setProcessingInterviews((prev) => {
      const newSet = new Set(prev);
      newSet.delete(interviewId);
      return newSet;
    });
  }, []);

  // Effect hooks
  useEffect(() => {
    loadInterviewGroupData();
  }, [selectedInterviewGroup]);

  useEffect(() => {
    const initializeInterviewGroup = async () => {
      const selectedGroup = localStorage.getItem("selectedInterviewGroup");
      const groupIdFromUrl = searchParams.get("group");

      if (selectedGroup) {
        const groupData = JSON.parse(selectedGroup);
        if (groupData && (groupData.id || groupData._id)) {
          setSelectedInterviewGroup(groupData);
          setSearchParams({ group: groupData.id || groupData._id });
        }
        localStorage.removeItem("selectedInterviewGroup");
      } else if (groupIdFromUrl && !selectedInterviewGroup) {
        // If we have a group ID from URL but no group data, fetch it
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `/api/interview-groups/${groupIdFromUrl}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setSelectedInterviewGroup(data.interviewGroup);
          }
        } catch (error) {
          console.error("Error fetching interview group from URL:", error);
          navigate("/interview-groups");
        }
      } else if (!selectedGroup && !groupIdFromUrl && !selectedInterviewGroup) {
        navigate("/interview-groups");
        return;
      }
    };

    initializeInterviewGroup();
  }, [navigate, searchParams, setSearchParams, selectedInterviewGroup]);

  // Data loading functions
  const loadInterviewGroupData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!selectedInterviewGroup || !selectedInterviewGroup._id) {
        console.log("No interview group selected");
        setInterviews([]);
        setLoading(false);
        return;
      }

      console.log("Loading interviews for group:", selectedInterviewGroup._id);

      // Use the specific interview group route to get interviews
      const response = await fetch(
        `/api/interview-groups/${selectedInterviewGroup._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load interviews: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Received interview data:", data);

      // The response should have interviews array
      const interviewsArray = data.interviews || [];
      console.log("Setting interviews:", interviewsArray);

      setInterviews(interviewsArray);
    } catch (error) {
      console.error("Error loading interview group data:", error);
      alert("Failed to load interviews for this group.");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [selectedInterviewGroup]);

  // Form handling functions
  const resetForm = () => {
    console.log("resetForm called - clearing all form data");
    setNewInterview({
      candidateName: "",
      candidateEmail: "",
      interviewerName: "",
    });
    setAudioFile(null);
    setAudioPreview(null);
    setFormStep(1);
    setCurrentTranscript(null);
    setProcessingStatus("");
    setIsProcessing(false);
    setTranscript("");
    setTranscriptStatus("idle");
    setCreatedInterviewId(null);

    if (candidateNameRef.current) candidateNameRef.current.value = "";
    if (candidateEmailRef.current) candidateEmailRef.current.value = "";
    if (interviewerNameRef.current) interviewerNameRef.current.value = "";
    
    // Reset Q&A pagination
    setQaCurrentPage(1);
  };

  // Q&A Pagination helper functions
  const resetQaPagination = () => {
    setQaCurrentPage(1);
  };

  const handleQaPageChange = (newPage) => {
    setQaCurrentPage(newPage);
  };

  // Audio file handling
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      // Validate file type
      const allowedTypes = ["audio/", "video/"];
      const isValidType = allowedTypes.some((type) =>
        file.type.startsWith(type)
      );

      if (!isValidType) {
        alert("Please select an audio or video file.");
        return;
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert("File size must be less than 100MB.");
        return;
      }

      setAudioFile(file);
    }
  };

  const removeAudioFile = () => {
    setAudioFile(null);
  };

  // Interview processing functions
  const handleCreateInterview = async (e) => {
    e.preventDefault();

    console.log("=== Create Interview Debug ===");
    console.log("audioFile:", audioFile);
    console.log("newInterview:", newInterview);
    console.log("formStep:", formStep);

    // Get values - use refs if available (Step 1), otherwise use state (Step 2+)
    const candidateNameVal =
      candidateNameRef.current?.value?.trim() ||
      newInterview.candidateName?.trim();
    const candidateEmailVal =
      candidateEmailRef.current?.value?.trim() ||
      newInterview.candidateEmail?.trim();
    const interviewerNameVal =
      interviewerNameRef.current?.value?.trim() ||
      newInterview.interviewerName?.trim();

    console.log("Form values:", {
      candidateNameVal,
      candidateEmailVal,
      interviewerNameVal,
    });

    // Sync latest values from refs if they exist (only in Step 1)
    if (candidateNameRef.current) {
      setNewInterview((prev) => ({
        ...prev,
        candidateName: candidateNameRef.current?.value || prev.candidateName,
        candidateEmail: candidateEmailRef.current?.value || prev.candidateEmail,
        interviewerName:
          interviewerNameRef.current?.value || prev.interviewerName,
      }));
    }

    console.log("Final form values:", {
      candidateNameVal,
      candidateEmailVal,
      interviewerNameVal,
    });

    if (!selectedInterviewGroup || !selectedInterviewGroup._id) {
      alert("Please select an interview group first");
      return;
    }

    if (!candidateNameVal || !candidateEmailVal || !interviewerNameVal) {
      alert("Please fill in all required fields");
      return;
    }

    if (!audioFile) {
      alert("Please upload an audio file for the interview");
      return;
    }

    console.log("All validations passed, proceeding with creation...");

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      // Use FormData for file upload
      const formData = new FormData();
      formData.append("candidateName", candidateNameVal);
      formData.append("candidateEmail", candidateEmailVal);
      formData.append("interviewerName", interviewerNameVal);
      formData.append("position", selectedInterviewGroup.position);
      formData.append("department", selectedInterviewGroup.department);
      formData.append("candidateCollege", selectedInterviewGroup.college);
      formData.append("interviewGroup", selectedInterviewGroup._id);

      // Add audio file if selected
      if (audioFile) {
        formData.append("interviewFile", audioFile);
      }

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      const responseData = await response.json();
      console.log("=== Backend Response ===");
      console.log("Full response:", responseData);

      const createdInterview = responseData.interview;
      console.log("Created interview:", createdInterview);
      console.log("Interview ID:", createdInterview?._id);

      setCreatedInterviewId(createdInterview._id);

      // If audio file was uploaded, start background processing
      if (audioFile) {
        console.log(
          "Starting background processing for ID:",
          createdInterview._id
        );
        // Start polling in background without blocking UI
        startPollingTranscript(createdInterview._id);

        // Immediately return to main view
        setFormStep(1);
        resetForm();
        setShowCreateModal(false);
        await reloadInterviewData();

        // Show success message with processing info
        alert(
          "Interview created successfully! Audio processing has started in the background."
        );
      } else {
        // No audio file, interview created successfully
        setFormStep(1);
        resetForm();
        setShowCreateModal(false);
        await reloadInterviewData();
        alert("Interview created successfully!");
      }
    } catch (error) {
      console.error("Error creating interview:", error);
      alert("Failed to create interview. Please try again.");
      setFormStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteInterview = async () => {
    resetForm();
    setShowCreateModal(false);
    setFormStep(1);
    await reloadInterviewData();
  };

  // Helper function to reload data
  const reloadInterviewData = async () => {
    await loadInterviewGroupData();
  };

  // Helper functions
  const viewInterviewDetails = (interview) => {
    setSelectedInterview(interview);
    setShowDetails(true);
    resetQaPagination(); // Reset pagination when viewing new interview
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

        await reloadInterviewData();
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
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "In Progress":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircleIconSolid className="w-4 h-4" />;
      case "In Progress":
        return <ClockIconSolid className="w-4 h-4" />;
      case "Scheduled":
        return <ClockIcon className="w-4 h-4" />;
      case "Cancelled":
        return <ExclamationTriangleIconSolid className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  // Filter and search functions
  const filteredInterviews = interviews.filter((interview) => {
    // If no search term, consider it a match
    const matchesSearch =
      !searchTerm ||
      (interview.candidateName &&
        interview.candidateName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (interview.candidateEmail &&
        interview.candidateEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (interview.interviewerName &&
        interview.interviewerName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (interview.candidate?.name &&
        interview.candidate.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (interview.candidate?.email &&
        interview.candidate.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" || interview.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoCameraIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">
              Loading interviews...
            </p>
            <p className="text-sm text-gray-500">
              Please wait while we fetch your data
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Interview Form Component
  const InterviewForm = ({ onSubmit, onCancel }) => {
    const [localDragActive, setLocalDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Auto-focus first field when form opens
    useEffect(() => {
      if (formStep === 1 && candidateNameRef.current) {
        candidateNameRef.current.focus();
      } else if (formStep === 2) {
        // Focus the Step 2 container for keyboard navigation
        const step2Container = document.querySelector('[tabIndex="0"]');
        if (step2Container) {
          step2Container.focus();
        }
      }
    }, [formStep]);

    // Keyboard navigation for input fields
    const handleKeyDown = (e, nextFieldRef) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (nextFieldRef && nextFieldRef.current) {
          nextFieldRef.current.focus();
        } else {
          // If no next field, try to proceed to next step
          const nameOk = candidateNameRef.current?.value?.trim();
          const emailOk = candidateEmailRef.current?.value?.trim();
          const interviewerOk = interviewerNameRef.current?.value?.trim();

          if (nameOk && emailOk && interviewerOk) {
            setNewInterview((prev) => ({
              ...prev,
              candidateName: nameOk,
              candidateEmail: emailOk,
              interviewerName: interviewerOk,
            }));
            setFormStep(2);
          } else {
            alert("Please complete all required fields");
          }
        }
      }
    };

    // Keyboard navigation for Step 2 (Audio Upload)
    const handleStep2KeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // If file is selected, proceed to create interview
        if (audioFile && audioPreview) {
          const nameOk = candidateNameRef.current?.value?.trim();
          const emailOk = candidateEmailRef.current?.value?.trim();
          const interviewerOk = interviewerNameRef.current?.value?.trim();

          if (nameOk && emailOk && interviewerOk) {
            onSubmit(e);
          } else {
            alert("Please complete all required fields");
          }
        } else {
          // Open file picker
          document.getElementById("audio-upload")?.click();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setFormStep(1);
      }
    };

    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setLocalDragActive(true);
      } else if (e.type === "dragleave") {
        setLocalDragActive(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setLocalDragActive(false);
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFileSelect(files[0]);
      }
    };

    const handleFileSelect = (file) => {
      console.log("=== File Selection Debug ===");
      console.log("File received:", file);

      if (file) {
        console.log("File details:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });

        // Validate file size (max 500MB)
        const maxSize = 500 * 1024 * 1024; // 500MB in bytes
        if (file.size > maxSize) {
          console.log("File too large:", file.size, "bytes");
          alert("File size must be less than 500MB");
          return;
        }

        // Validate file type
        const allowedTypes = ["audio/", "video/"];
        const isValidType = allowedTypes.some((type) =>
          file.type.startsWith(type)
        );
        console.log("File type validation:", {
          type: file.type,
          isValid: isValidType,
        });

        if (!isValidType) {
          console.log("Invalid file type:", file.type);
          alert("Please select a valid audio or video file");
          return;
        }

        console.log("File validation passed, setting state...");

        // Set the main audioFile state
        setAudioFile(file);
        console.log("setAudioFile called with:", file);

        // Update newInterview state with functional update
        setNewInterview((prev) => {
          const updated = {
            ...prev,
            audioFile: file,
          };
          console.log("setNewInterview updated:", updated);
          return updated;
        });

        // Set preview state
        const preview = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2),
          type: file.type,
        };
        setAudioPreview(preview);
        console.log("setAudioPreview called with:", preview);

        console.log("=== File selection complete ===");
      } else {
        console.log("No file provided to handleFileSelect");
      }
    };

    const removeAudioFile = () => {
      setNewInterview({
        ...newInterview,
        audioFile: null,
      });
      setAudioFile(null);
      setAudioPreview(null);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Create New Interview
            </h1>
            <p className="text-gray-600">
              Add a new interview with AI-powered analysis capabilities
            </p>
          </div>

          {/* Interview Group Banner */}
          {selectedInterviewGroup && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <AcademicCapIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedInterviewGroup.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {selectedInterviewGroup.college}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {selectedInterviewGroup.position}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Interview Group</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {interviews.length + 1}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center space-x-2 ${
                    formStep >= 1 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    {formStep > 1 ? (
                      <CheckCircleIconSolid className="w-5 h-5" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <span className="font-medium">Basic Details</span>
                </div>
                <div
                  className={`h-1 flex-1 mx-4 rounded ${
                    formStep > 1 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`flex items-center space-x-2 ${
                    formStep >= 2 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    {formStep > 2 ? (
                      <CheckCircleIconSolid className="w-5 h-5" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <span className="font-medium">Audio Upload</span>
                </div>
                <div
                  className={`h-1 flex-1 mx-4 rounded ${
                    formStep > 2 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`flex items-center space-x-2 ${
                    formStep >= 3 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    {formStep > 3 ? (
                      <CheckCircleIconSolid className="w-5 h-5" />
                    ) : (
                      "3"
                    )}
                  </div>
                  <span className="font-medium">Transcript</span>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="p-6">
              {/* Step 1: Basic Details */}
              {formStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Candidate Name */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Candidate Name *
                      </label>
                      <input
                        ref={candidateNameRef}
                        type="text"
                        required
                        defaultValue={newInterview.candidateName}
                        onKeyDown={(e) => handleKeyDown(e, candidateEmailRef)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
                        placeholder="Enter candidate's full name"
                      />
                    </div>

                    {/* Candidate Email */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="w-4 h-4 mr-2 text-gray-400">@</span>
                        Candidate Email *
                      </label>
                      <input
                        ref={candidateEmailRef}
                        type="email"
                        required
                        defaultValue={newInterview.candidateEmail}
                        onKeyDown={(e) => handleKeyDown(e, interviewerNameRef)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
                        placeholder="candidate@example.com"
                      />
                    </div>

                    {/* Interviewer Name */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Interviewer Name *
                      </label>
                      <input
                        ref={interviewerNameRef}
                        type="text"
                        required
                        defaultValue={newInterview.interviewerName}
                        onKeyDown={(e) => handleKeyDown(e, null)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
                        placeholder="Enter interviewer's name"
                      />
                    </div>
                  </div>

                  {/* Keyboard Navigation Hints */}
                  <div className="text-center">
                    <div className="text-xs text-gray-400 flex items-center justify-center space-x-4">
                      <span>
                        Press{" "}
                        <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                          Enter
                        </kbd>{" "}
                        to move to next field
                      </span>
                    </div>
                  </div>

                  {/* Step Navigation */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nameOk = candidateNameRef.current?.value?.trim();
                        const emailOk =
                          candidateEmailRef.current?.value?.trim();
                        const interviewerOk =
                          interviewerNameRef.current?.value?.trim();
                        if (!nameOk || !emailOk || !interviewerOk) {
                          alert("Please complete all required fields");
                          return;
                        }
                        // sync to state once advancing
                        setNewInterview((prev) => ({
                          ...prev,
                          candidateName: nameOk,
                          candidateEmail: emailOk,
                          interviewerName: interviewerOk,
                        }));
                        setFormStep(2);
                      }}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      Next: Audio Upload
                      <ArrowLeftIcon className="h-4 w-4 ml-2 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Audio Upload */}
              {formStep === 2 && (
                <div
                  className="space-y-6"
                  onKeyDown={handleStep2KeyDown}
                  tabIndex={0}
                >
                  {/* Audio Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700">
                          <SpeakerWaveIcon className="h-4 w-4 mr-2 text-gray-400" />
                          Interview Audio *
                        </label>
                        <p className="text-xs text-red-600 mt-1">
                          Required for AI analysis and transcription
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <BoltIcon className="h-3 w-3" />
                        <span>AI-Powered Analysis</span>
                      </div>
                    </div>

                    {!audioFile || !audioPreview ? (
                      <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                          localDragActive
                            ? "border-blue-400 bg-blue-50"
                            : "border-red-300 hover:border-red-400 bg-red-50"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              Upload Interview Audio
                            </p>
                            <p className="text-sm text-red-600 mb-4 font-medium">
                              Audio file is required for interview processing
                            </p>
                            <input
                              type="file"
                              accept="audio/*,video/*"
                              onChange={(e) => {
                                console.log("File input onChange triggered");
                                console.log("Files:", e.target.files);
                                console.log(
                                  "Selected file:",
                                  e.target.files[0]
                                );
                                handleFileSelect(e.target.files[0]);
                              }}
                              className="hidden"
                              id="audio-upload"
                            />
                            <label
                              htmlFor="audio-upload"
                              className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer transition-all duration-200"
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-2" />
                              Choose File
                            </label>
                          </div>
                          <div className="text-xs text-gray-500">
                            Supported formats: MP3, WAV, MP4, M4A, FLAC, OGG,
                            WebM (Max 500MB)
                          </div>
                          <div className="text-xs text-gray-400 mt-2 flex items-center justify-center space-x-4">
                            <span>
                              Press{" "}
                              <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                                Enter
                              </kbd>{" "}
                              to browse files
                            </span>
                            <span>•</span>
                            <span>
                              <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                                Esc
                              </kbd>{" "}
                              to go back
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                              <SpeakerWaveIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {audioPreview?.name ||
                                  audioFile?.name ||
                                  "Audio File"}
                              </p>
                              <p className="text-xs text-gray-600">
                                {audioPreview?.size ||
                                  (audioFile?.size / (1024 * 1024)).toFixed(
                                    2
                                  )}{" "}
                                MB •{" "}
                                {audioPreview?.type ||
                                  audioFile?.type ||
                                  "audio"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeAudioFile}
                            className="inline-flex items-center p-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-2 text-sm text-green-700">
                            <CheckCircleIconSolid className="h-4 w-4" />
                            <span className="font-medium">
                              ✅ Audio file uploaded successfully! Ready for AI
                              transcription and analysis.
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-green-600">
                            Click "Create Interview" below to proceed with
                            processing
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Features Info */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
                      <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                        <BoltIcon className="h-4 w-4 mr-2" />
                        AI Analysis Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-purple-700">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Speech-to-text transcription</span>
                        </div>
                        <div className="flex items-center space-x-2 text-purple-700">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Filler word preservation</span>
                        </div>
                        <div className="flex items-center space-x-2 text-purple-700">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Communication pattern analysis</span>
                        </div>
                        <div className="flex items-center space-x-2 text-purple-700">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Technical & soft skills detection</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Step Navigation */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Back
                    </button>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing || !audioFile || !audioPreview}
                        className={`inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white transition-all duration-200 ${
                          audioFile && audioPreview && !isProcessing
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            : "bg-gray-400 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Interview...
                          </>
                        ) : !audioFile || !audioPreview ? (
                          <>
                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                            Audio File Required
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Create Interview
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Transcript Display and Processing */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Audio Processing & Transcript
                    </h3>
                    <p className="text-gray-600">
                      Your interview has been created. Processing audio for
                      transcript...
                    </p>
                  </div>

                  {/* Processing Status */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {transcriptStatus === "processing" ? (
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          </div>
                        ) : transcriptStatus === "completed" ? (
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircleIconSolid className="h-6 w-6 text-white" />
                          </div>
                        ) : transcriptStatus === "error" ? (
                          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                            <XMarkIcon className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
                            <DocumentTextIcon className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {transcriptStatus === "processing" &&
                            "Processing Audio..."}
                          {transcriptStatus === "completed" &&
                            "Transcript Ready"}
                          {transcriptStatus === "error" && "Processing Failed"}
                          {transcriptStatus === "idle" && "Ready to Process"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {transcriptStatus === "processing" &&
                            "AI is analyzing your audio file and generating the transcript..."}
                          {transcriptStatus === "completed" &&
                            "Your interview transcript has been successfully generated"}
                          {transcriptStatus === "error" &&
                            "There was an issue processing your audio file"}
                          {transcriptStatus === "idle" &&
                            "Waiting to begin processing"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transcript Display */}
                  {transcript && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                          <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Interview Transcript
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>Generated with AI</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                          {transcript}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {transcriptStatus === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <div className="flex items-center space-x-3">
                        <XMarkIcon className="h-6 w-6 text-red-600" />
                        <div>
                          <h4 className="text-lg font-semibold text-red-900">
                            Processing Failed
                          </h4>
                          <p className="text-sm text-red-700 mt-1">
                            We encountered an issue while processing your audio
                            file. You can try again with a different file or
                            proceed without the transcript.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Actions */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Back to Audio
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteInterview}
                      disabled={transcriptStatus === "processing"}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Complete Interview
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };

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
                ML Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInterviews.map((interview) => (
              <tr
                key={interview._id}
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {(
                            interview.candidateName ||
                            interview.candidate?.name ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {interview.candidateName ||
                          interview.candidate?.name ||
                          "Unknown Candidate"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <span>
                          {interview.candidateEmail ||
                            interview.candidate?.email ||
                            "No email provided"}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {interview.position ||
                      selectedInterviewGroup?.position ||
                      "N/A"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {interview.department ||
                      selectedInterviewGroup?.college ||
                      "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(
                      interview.createdAt || interview.scheduledDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(
                      interview.createdAt || interview.scheduledDate
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                      interview.status
                    )}`}
                  >
                    {getStatusIcon(interview.status)}
                    <span className="ml-1">{interview.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Check if interview is currently being processed */}
                  {processingInterviews.has(interview._id) ? (
                    <div className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-800 mr-2"></div>
                      Processing...
                    </div>
                  ) : interview.analysisStatus ? (
                    <div
                      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                        interview.analysisStatus === "Analyzed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : interview.analysisStatus === "Processing"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : interview.analysisStatus === "Failed"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {interview.analysisStatus === "Analyzed" && (
                        <CheckCircleIconSolid className="w-3 h-3 mr-1" />
                      )}
                      {interview.analysisStatus === "Processing" && (
                        <ClockIconSolid className="w-3 h-3 mr-1" />
                      )}
                      {interview.analysisStatus === "Failed" && (
                        <ExclamationTriangleIconSolid className="w-3 h-3 mr-1" />
                      )}
                      {interview.analysisStatus}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No audio uploaded
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewInterviewDetails(interview)}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      title="View Interview Details"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
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

    // Enhanced function to parse transcript into Q&A format
    const parseTranscriptToQA = (transcript) => {
      if (!transcript) return [];

      const text =
        typeof transcript === "object"
          ? transcript.cleaned || transcript
          : transcript;
      if (!text) return [];

      // Step 1: Split transcript into sentences using regex
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(sentence => sentence.length > 10); // Filter out very short fragments

      const qaItems = [];
      let currentQuestion = [];
      let currentAnswer = [];
      let isCollectingQuestion = false;
      let isCollectingAnswer = false;

      sentences.forEach((sentence) => {
        if (!sentence) return;

        // Step 2: Detect if sentence belongs to Interviewer or Candidate
        
        // Enhanced Interviewer patterns (Questions)
        const interviewerPatterns = [
          /\?$/,  // Ends with question mark
          /^(what|how|why|when|where|who|which|can you|could you|would you|do you|did you|have you|are you|will you|shall we|let's|please)/i,
          /^(tell me|describe|explain|walk me through|talk about|share|give me|show me)/i,
          /^(interviewer|hr|recruiter|manager):/i,
          /(introduce yourself|about yourself|your background|your experience|your skills)/i,
          /(strengths|weaknesses|challenges|goals|expectations)/i,
          /(why should we|why do you|what makes you|how would you)/i,
        ];

        // Enhanced Candidate patterns (Answers)
        const candidatePatterns = [
          /^(sir|madam|yes|no|well|so|actually|basically|sure|definitely|absolutely|of course|thank you|thanks)/i,
          /^(i |my |me |myself|we |our |us )/i,
          /^(candidate|interviewee|student):/i,
          /^(good morning|good afternoon|good evening|hello|hi)/i,
          /^(as i mentioned|like i said|as you know|from my experience)/i,
        ];

        const isInterviewerSentence = interviewerPatterns.some(pattern => 
          pattern.test(sentence)
        );
        
        const isCandidateSentence = candidatePatterns.some(pattern => 
          pattern.test(sentence)
        );

        // Step 3: Group sentences into Q&A pairs
        
        if (isInterviewerSentence || (!isCandidateSentence && !isCollectingAnswer)) {
          // Start new question or continue current question
          if (isCollectingAnswer && currentQuestion.length > 0 && currentAnswer.length > 0) {
            // Save previous Q&A pair
            qaItems.push({
              question: currentQuestion.join(" ").trim().replace(/^(interviewer|hr|recruiter):\s*/i, ""),
              answer: currentAnswer.join(" ").trim().replace(/^(candidate|interviewee|student):\s*/i, "")
            });
            currentQuestion = [];
            currentAnswer = [];
          }
          
          // Add to current question
          const cleanSentence = sentence.replace(/^(interviewer|hr|recruiter):\s*/i, "");
          currentQuestion.push(cleanSentence);
          isCollectingQuestion = true;
          isCollectingAnswer = false;
          
        } else if (isCandidateSentence || isCollectingAnswer) {
          // Add to current answer
          const cleanSentence = sentence.replace(/^(candidate|interviewee|student):\s*/i, "");
          currentAnswer.push(cleanSentence);
          isCollectingAnswer = true;
          isCollectingQuestion = false;
        } else {
          // Ambiguous sentence - add to whatever we're currently collecting
          if (isCollectingQuestion) {
            currentQuestion.push(sentence);
          } else {
            currentAnswer.push(sentence);
            isCollectingAnswer = true;
          }
        }
      });

      // Add the final Q&A pair
      if (currentQuestion.length > 0 && currentAnswer.length > 0) {
        qaItems.push({
          question: currentQuestion.join(" ").trim().replace(/^(interviewer|hr|recruiter):\s*/i, ""),
          answer: currentAnswer.join(" ").trim().replace(/^(candidate|interviewee|student):\s*/i, "")
        });
      }

      // Step 4: Clean up and validate Q&A pairs
      const validQaItems = qaItems.filter(qa => 
        qa.question.length > 5 && qa.answer.length > 5
      );

      // If no clear Q&A structure detected, create fallback using paragraph splitting
      if (validQaItems.length === 0 && text.length > 0) {
        console.log("Falling back to paragraph-based parsing");
        const paragraphs = text
          .split(/\n\n|\n/)
          .map(p => p.trim())
          .filter(p => p.length > 20);
          
        for (let i = 0; i < paragraphs.length - 1; i += 2) {
          if (paragraphs[i] && paragraphs[i + 1]) {
            validQaItems.push({
              question: paragraphs[i],
              answer: paragraphs[i + 1]
            });
          }
        }
      }

      return validQaItems;
    };

    // Function to convert Q&A items to formatted string (as requested)
    const convertToQaFormat = (qaItems) => {
      if (!qaItems || qaItems.length === 0) {
        return "No Q&A pairs found in the transcript.";
      }

      let formattedString = "";
      qaItems.forEach((qa, index) => {
        formattedString += `Q\n`;
        formattedString += `Question ${index + 1}\n`;
        formattedString += `${qa.question}\n`;
        formattedString += `A\n`;
        formattedString += `${qa.answer}\n`;
        if (index < qaItems.length - 1) {
          formattedString += `\n`;
        }
      });

      return formattedString;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Interview Details</h2>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3">Candidate Information</h3>
              <p>
                <strong>Name:</strong>{" "}
                {selectedInterview.candidateName ||
                  selectedInterview.candidate?.name ||
                  "Unknown"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {selectedInterview.candidateEmail ||
                  selectedInterview.candidate?.email ||
                  "N/A"}
              </p>
              <p>
                <strong>College:</strong>{" "}
                {selectedInterview.candidateCollege ||
                  selectedInterviewGroup?.college ||
                  "N/A"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Interview Information</h3>
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
                <strong>Date:</strong>{" "}
                {new Date(selectedInterview.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* ML Processing Status */}
          {selectedInterview.processingStatus && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Processing Status</h3>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  selectedInterview.processingStatus === "Completed"
                    ? "bg-green-100 text-green-800"
                    : selectedInterview.processingStatus === "Processing"
                    ? "bg-yellow-100 text-yellow-800"
                    : selectedInterview.processingStatus === "Failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {selectedInterview.processingStatus}
              </span>
              {selectedInterview.processingError && (
                <p className="text-red-600 text-sm mt-2">
                  Error: {selectedInterview.processingError}
                </p>
              )}
            </div>
          )}

          {/* Transcript Section */}
          {(selectedInterview.transcript?.cleaned ||
            selectedInterview.transcript) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Interview Transcript
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowFormattedQA(true)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Q&A Format
                  </button>
                  <button
                    onClick={() => {
                      const qaItems = parseTranscriptToQA(
                        selectedInterview.transcript?.cleaned ||
                          selectedInterview.transcript
                      );
                      const formattedQA = convertToQaFormat(qaItems);
                      
                      // Create and download the Q&A formatted text file
                      const blob = new Blob([formattedQA], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedInterview.candidateName || 'interview'}_QA_breakdown.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Q&A
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedInterview.transcript?.cleaned ||
                    selectedInterview.transcript}
                </p>
              </div>

              {/* Question & Answer Format with Pagination */}
              {(() => {
                const qaItems = parseTranscriptToQA(
                  selectedInterview.transcript?.cleaned ||
                    selectedInterview.transcript
                );
                
                if (qaItems.length === 0) {
                  return (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Question & Answer Breakdown
                      </h4>
                      <p className="text-xs text-gray-500 italic text-center py-8">
                        Unable to parse transcript into Q&A format
                      </p>
                    </div>
                  );
                }

                const totalPages = Math.ceil(qaItems.length / qaItemsPerPage);
                const startIndex = (qaCurrentPage - 1) * qaItemsPerPage;
                const endIndex = startIndex + qaItemsPerPage;
                const currentQaItems = qaItems.slice(startIndex, endIndex);

                return (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Question & Answer Breakdown
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {qaItems.length} Q&A pairs detected
                        </span>
                        <span>
                          Enhanced parsing algorithm
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {currentQaItems.map((qa, index) => {
                        const actualIndex = startIndex + index + 1;
                        return (
                          <div
                            key={startIndex + index}
                            className="bg-white rounded-lg border border-gray-200 p-4"
                          >
                            <div className="mb-3">
                              <div className="flex items-start space-x-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  Q
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                      Question {actualIndex}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                    {qa.question}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="ml-8">
                              <div className="flex items-start space-x-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  A
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {qa.answer}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="text-xs text-gray-500">
                          Showing {startIndex + 1} to {Math.min(endIndex, qaItems.length)} of {qaItems.length} Q&A pairs
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQaPageChange(qaCurrentPage - 1)}
                            disabled={qaCurrentPage === 1}
                            className={`p-2 rounded-md text-sm font-medium transition-colors ${
                              qaCurrentPage === 1
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = i + 1;
                              } else if (qaCurrentPage <= 3) {
                                pageNumber = i + 1;
                              } else if (qaCurrentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                              } else {
                                pageNumber = qaCurrentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => handleQaPageChange(pageNumber)}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    qaCurrentPage === pageNumber
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => handleQaPageChange(qaCurrentPage + 1)}
                            disabled={qaCurrentPage === totalPages}
                            className={`p-2 rounded-md text-sm font-medium transition-colors ${
                              qaCurrentPage === totalPages
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <p className="text-xs text-gray-500 mt-2">
                Note: Transcript generated using AI speech recognition
              </p>
            </div>
          )}

          {/* Summary Section */}
          {selectedInterview.summary && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Interview Summary</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {selectedInterview.summary}
                </p>
              </div>
            </div>
          )}

          {/* Insights Section */}
          {selectedInterview.insights && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Interview Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Statistics</h4>
                  <p className="text-sm">
                    Word Count: {selectedInterview.insights.wordCount || 0}
                  </p>
                  <p className="text-sm">
                    Duration:{" "}
                    {selectedInterview.insights.estimatedDuration || "N/A"}
                  </p>
                </div>

                {/* Filler Word Analysis */}
                {selectedInterview.insights.fillerWordAnalysis && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Filler Word Analysis</h4>
                    <p className="text-sm">
                      Total:{" "}
                      {selectedInterview.insights.fillerWordAnalysis
                        .totalFillers || 0}
                    </p>
                    <p className="text-sm">
                      Percentage:{" "}
                      {selectedInterview.insights.fillerWordAnalysis
                        .fillerPercentage || "0%"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedInterview.insights.fillerWordAnalysis
                        .assessment || "No assessment available"}
                    </p>
                  </div>
                )}

                {selectedInterview.insights.technicalSkillsMentioned?.length >
                  0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">
                      Technical Skills Mentioned
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedInterview.insights.technicalSkillsMentioned.map(
                        (skill, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-green-200 text-green-800 rounded"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedInterview.insights.softSkillsMentioned?.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Soft Skills Mentioned</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedInterview.insights.softSkillsMentioned.map(
                        (skill, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Communication Metrics */}
                {selectedInterview.insights.communicationMetrics && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Communication Style</h4>
                    <p className="text-sm">
                      Speaking Rate:{" "}
                      {selectedInterview.insights.communicationMetrics
                        .estimatedSpeakingRate || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedInterview.insights.communicationMetrics
                        .communicationStyle || "No analysis available"}
                    </p>
                  </div>
                )}

                {selectedInterview.insights.keyPhrases?.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg md:col-span-2">
                    <h4 className="font-medium mb-2">Key Phrases</h4>
                    <ul className="text-sm space-y-1">
                      {selectedInterview.insights.keyPhrases
                        .slice(0, 5)
                        .map((phrase, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            {phrase}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <InterviewForm
            onSubmit={handleCreateInterview}
            onCancel={() => setShowCreateModal(false)}
          />
        </div>
      )}

      {/* Main Interview Management Interface */}
      {!showCreateModal && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Professional Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                {/* Left Section */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate("/interview-groups")}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Groups
                  </button>

                  {selectedInterviewGroup && (
                    <div className="flex items-center">
                      <div className="h-8 w-px bg-gray-300 mx-2"></div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                          <AcademicCapIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedInterviewGroup.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedInterviewGroup.college}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Center Section - Title */}
                <div className="flex-1 flex justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Interview Management
                    </h1>
                    <div className="flex items-center justify-center space-x-4 mt-1">
                      <p className="text-sm text-gray-600">
                        AI-Powered Interview Analysis & Management
                      </p>
                      {processingInterviews.size > 0 && (
                        <div className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-800 mr-1"></div>
                          {processingInterviews.size} Processing
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-3">
                  {selectedInterviewGroup && (
                    <>
                      {/* Create Interview Button */}
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Interview
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search and Filter Bar */}
              {selectedInterviewGroup && filteredInterviews.length > 0 && (
                <div className="pb-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between space-x-4">
                    {/* Search */}
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search candidates, interviewers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Filter and Stats */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="text-sm text-gray-600">
                        {filteredInterviews.length} of {interviews.length}{" "}
                        interviews
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Interviews Display */}
            {selectedInterviewGroup && filteredInterviews.length > 0 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <InterviewsTable />
                </div>
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

      {/* Formatted Q&A Modal */}
      {showFormattedQA && selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Formatted Q&A Breakdown</h2>
              <button
                onClick={() => setShowFormattedQA(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 text-sm text-gray-600">
              <p>Below is the structured Q&A format extracted from the interview transcript:</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
                {(() => {
                  const qaItems = parseTranscriptToQA(
                    selectedInterview.transcript?.cleaned ||
                      selectedInterview.transcript
                  );
                  return convertToQaFormat(qaItems);
                })()}
              </pre>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  const qaItems = parseTranscriptToQA(
                    selectedInterview.transcript?.cleaned ||
                      selectedInterview.transcript
                  );
                  const formattedQA = convertToQaFormat(qaItems);
                  
                  // Copy to clipboard
                  navigator.clipboard.writeText(formattedQA).then(() => {
                    alert('Q&A format copied to clipboard!');
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowFormattedQA(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Interviews;
