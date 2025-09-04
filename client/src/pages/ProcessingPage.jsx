import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  SpeakerWaveIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const ProcessingPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState("Processing");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [retryAvailable, setRetryAvailable] = useState(false);

  const isRateLimitError = (errorMessage) => {
    return (
      errorMessage &&
      (errorMessage.includes("rate limit") ||
        errorMessage.includes("API rate limit") ||
        errorMessage.includes("try again later"))
    );
  };

  const handleRetry = async () => {
    try {
      setError(null);
      setRetryAvailable(false);
      setLoading(true);
      setProcessingStatus("Processing");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interviews/${interviewId}/retry`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to retry processing");
      }

      // Start polling again
      checkStatus();
    } catch (err) {
      console.error("Error retrying:", err);
      setError("Failed to retry processing. Please try again later.");
      setRetryAvailable(true);
      setLoading(false);
    }
  };

  // Poll for status updates
  useEffect(() => {
    if (!interviewId) return;

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/interviews/${interviewId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const status = await response.json();
          setProcessingStatus(status.analysisStatus);

          if (status.analysisStatus === "Analyzed") {
            // Fetch full interview data
            const interviewResponse = await fetch(
              `/api/interviews/${interviewId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (interviewResponse.ok) {
              const interviewData = await interviewResponse.json();
              setInterview(interviewData);
              setTranscript(interviewData.analysis?.transcript || "");
              setAnalysis(interviewData.analysis);
              setLoading(false);
            }
          } else if (status.analysisStatus === "Failed") {
            const errorMessage = status.error || "Processing failed";
            setError(errorMessage);
            setRetryAvailable(isRateLimitError(errorMessage));
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error checking status:", err);
        setError("Failed to check processing status");
        setLoading(false);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds if still processing
    const interval = setInterval(() => {
      if (processingStatus === "Processing" || processingStatus === "Pending") {
        checkStatus();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [interviewId, processingStatus]);

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interviews/${interviewId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-report-${
          interview?.candidate?.name || "candidate"
        }.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download PDF report");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Error downloading PDF report");
    }
  };

  const getStatusIcon = () => {
    switch (processingStatus) {
      case "Processing":
      case "Pending":
        return <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />;
      case "Analyzed":
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case "Failed":
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <ArrowPathIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (processingStatus) {
      case "Pending":
        return "Interview queued for processing...";
      case "Processing":
        return "Converting speech to text and analyzing content...";
      case "Analyzed":
        return "Processing completed successfully!";
      case "Failed":
        return "Processing failed. Please try again.";
      default:
        return "Checking status...";
    }
  };

  if (
    loading &&
    (processingStatus === "Processing" || processingStatus === "Pending")
  ) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/interviews")}
              className="mr-4 p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Processing Interview
            </h1>
          </div>

          {/* Processing Status */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-6">{getStatusIcon()}</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {getStatusMessage()}
            </h2>
            <p className="text-gray-600 mb-8">
              We're using OpenAI Whisper to convert your audio to text and
              analyzing the interview content. This typically takes 2-5 minutes
              depending on the audio length.
            </p>

            {/* Progress Steps */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium">
                    ✓
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Upload Complete
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      processingStatus === "Processing"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {processingStatus === "Processing" ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Speech-to-Text
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Analysis & PDF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/interviews")}
              className="mr-4 p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Processing Failed
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Processing Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>

            {isRateLimitError(error) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>Rate Limit Exceeded:</strong> This usually resolves
                  quickly. You can try again in a few minutes, or upgrade your
                  OpenAI plan for higher limits.
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              {retryAvailable && (
                <button
                  onClick={handleRetry}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Try Again
                </button>
              )}
              <button
                onClick={() => navigate("/interviews")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Interviews
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/interviews")}
              className="mr-4 p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Interview Analysis Complete
            </h1>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download PDF Report
          </button>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">
              Speech-to-text processing completed successfully! Analysis and PDF
              report are ready.
            </span>
          </div>
        </div>

        {/* Interview Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Interview Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Candidate
              </label>
              <p className="text-gray-900">{interview?.candidate?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="text-gray-900">{interview?.candidate?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <p className="text-gray-900">{interview?.position}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <p className="text-gray-900">
                {new Date(interview?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Scores */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Scores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.overall_score || 0}/10
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.technical_score || 0}/10
                </div>
                <div className="text-sm text-gray-600">Technical Skills</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.communication_score || 0}/10
                </div>
                <div className="text-sm text-gray-600">Communication</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.confidence_score || 0}/10
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <SpeakerWaveIcon className="h-6 w-6 text-gray-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Interview Transcript
            </h2>
          </div>

          {transcript ? (
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SpeakerWaveIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transcript available</p>
            </div>
          )}
        </div>

        {/* Analysis Summary */}
        {analysis?.feedback && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Summary
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {analysis.feedback}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate("/interviews")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Interviews
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessingPage;
