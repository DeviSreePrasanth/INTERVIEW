// Mock data for Interviews page
import { getGroups } from "./mockInterviewGroups";
import { getCandidates } from "./mockCandidates";

export const mockInterviews = [
  {
    _id: "int1",
    candidateName: "Rajesh Kumar",
    candidateEmail: "rajesh.kumar@email.com",
    candidateCollege: "GVP College of Engineering",
    interviewerName: "Dr. Priya Sharma",
    position: "Software Developer",
    department: "Engineering",
    interviewDate: "2025-01-20",
    status: "Completed",
    analysisStatus: "Analyzed",
    interviewFile: "rajesh_kumar_interview.mp3",
    duration: "8:30",
    uploadDate: "2025-01-15",
    createdAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-01-20T00:00:00.000Z",
    analysis: {
      transcript: {
        text: "Hello, my name is Rajesh Kumar. I have been working with React for about 3 years now. I started my journey with JavaScript and gradually moved to modern frameworks. React appealed to me because of its component-based architecture and the virtual DOM concept. I have built several projects using React, including e-commerce applications and dashboard interfaces. My experience includes working with Redux for state management, React Router for navigation, and various UI libraries like Material-UI and Ant Design. I am confident in my ability to create scalable and maintainable React applications.",
        duration: "2:45",
        words: 95,
      },
      scores: {
        technical_depth: 8.5,
        confidence: 8.2,
        communication: 7.8,
        overall_score: 8.2,
      },
      insights: [
        "Demonstrates strong technical knowledge and expertise",
        "Displays excellent confidence and self-assurance",
        "Good communication skills with minor areas for improvement",
      ],
      keywords: [
        "React",
        "JavaScript",
        "Redux",
        "component",
        "architecture",
        "virtual DOM",
        "scalable",
        "maintainable",
      ],
      sentiment: "Positive",
      fluency_metrics: {
        words_per_minute: 138,
        total_words: 95,
        speaking_duration: "2:45",
        fluency_rating: "Medium",
      },
      technical_terms: [
        "React",
        "JavaScript",
        "Redux",
        "component-based architecture",
        "virtual DOM",
        "React Router",
        "Material-UI",
      ],
    },
  },
  {
    _id: "int2",
    candidateName: "Priya Sharma",
    candidateEmail: "priya.sharma@email.com",
    candidateCollege: "JNTU Hyderabad",
    interviewerName: "Mr. Arun Kumar",
    position: "Frontend Developer",
    department: "Engineering",
    interviewDate: "2025-01-21",
    status: "Completed",
    analysisStatus: "Analyzed",
    interviewFile: "priya_sharma_interview.mp3",
    duration: "7:15",
    uploadDate: "2025-01-16",
    createdAt: "2025-01-16T00:00:00.000Z",
    updatedAt: "2025-01-21T00:00:00.000Z",
    analysis: {
      transcript: {
        text: "Thank you for this opportunity. I have been passionate about web development since my college days. I started with HTML and CSS, then learned JavaScript and server-side technologies. I am proficient in both frontend and backend development. On the frontend, I work with React and Vue.js, while on the backend, I use Node.js and Express. I have experience with databases like MongoDB and PostgreSQL. I enjoy solving complex problems and creating user-friendly interfaces. I am always eager to learn new technologies and stay updated with industry trends.",
        duration: "2:58",
        words: 92,
      },
      scores: {
        technical_depth: 7.8,
        confidence: 8.5,
        communication: 8.9,
        overall_score: 8.4,
      },
      insights: [
        "Shows good technical understanding with room for deeper insights",
        "Displays excellent confidence and self-assurance",
        "Excellent communication skills with clear, structured responses",
      ],
      keywords: [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Vue.js",
        "Node.js",
        "Express",
        "MongoDB",
        "PostgreSQL",
      ],
      sentiment: "Positive",
      fluency_metrics: {
        words_per_minute: 142,
        total_words: 92,
        speaking_duration: "2:58",
        fluency_rating: "Medium",
      },
      technical_terms: [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Vue.js",
        "Node.js",
        "Express",
        "MongoDB",
        "PostgreSQL",
      ],
    },
  },
  {
    _id: "int3",
    candidateName: "Anil Reddy",
    candidateEmail: "anil.reddy@email.com",
    candidateCollege: "CBIT",
    interviewerName: "Dr. Sunita Rao",
    position: "Data Analyst",
    department: "Analytics",
    interviewDate: "2025-01-22",
    status: "Completed",
    analysisStatus: "Analyzed",
    interviewFile: "anil_reddy_interview.mp3",
    duration: "9:45",
    uploadDate: "2025-01-17",
    createdAt: "2025-01-17T00:00:00.000Z",
    updatedAt: "2025-01-22T00:00:00.000Z",
    analysis: {
      transcript: {
        text: "Good morning. I am excited to discuss my background in data science. I have strong skills in Python programming, particularly with libraries like pandas, numpy, and scikit-learn. I have worked on machine learning projects involving classification and regression problems. My experience includes data preprocessing, feature engineering, and model evaluation. I am comfortable with statistical analysis and have used visualization tools like matplotlib and seaborn to present findings. I believe my analytical mindset and attention to detail make me a good fit for data-driven roles.",
        duration: "3:12",
        words: 87,
      },
      scores: {
        technical_depth: 9.1,
        confidence: 7.6,
        communication: 8.2,
        overall_score: 8.3,
      },
      insights: [
        "Demonstrates strong technical knowledge and expertise",
        "Shows reasonable confidence with some areas for improvement",
        "Excellent communication skills with clear, structured responses",
      ],
      keywords: [
        "Python",
        "pandas",
        "numpy",
        "scikit-learn",
        "machine learning",
        "classification",
        "regression",
        "data preprocessing",
      ],
      sentiment: "Positive",
      fluency_metrics: {
        words_per_minute: 135,
        total_words: 87,
        speaking_duration: "3:12",
        fluency_rating: "Medium",
      },
      technical_terms: [
        "Python",
        "pandas",
        "numpy",
        "scikit-learn",
        "machine learning",
        "classification",
        "regression",
        "feature engineering",
        "matplotlib",
        "seaborn",
      ],
    },
  },
  {
    _id: "int4",
    candidateName: "Sneha Patel",
    candidateEmail: "sneha.patel@email.com",
    candidateCollege: "VIT University",
    interviewerName: "Mr. Rahul Mehta",
    position: "Backend Developer",
    department: "Engineering",
    interviewDate: "2025-01-23",
    status: "Scheduled",
    analysisStatus: "Pending",
    interviewFile: "sneha_patel_interview.mp3",
    duration: "0:00",
    uploadDate: "2025-01-18",
    createdAt: "2025-01-18T00:00:00.000Z",
    updatedAt: "2025-01-18T00:00:00.000Z",
    analysis: null,
  },
  {
    _id: "int5",
    candidateName: "Karthik Menon",
    candidateEmail: "karthik.menon@email.com",
    candidateCollege: "BITS Pilani",
    interviewerName: "Ms. Kavya Nair",
    position: "DevOps Engineer",
    department: "Engineering",
    interviewDate: "2025-01-24",
    status: "In Progress",
    analysisStatus: "Processing",
    interviewFile: "karthik_menon_interview.mp3",
    duration: "5:20",
    uploadDate: "2025-01-19",
    createdAt: "2025-01-19T00:00:00.000Z",
    updatedAt: "2025-01-19T00:00:00.000Z",
    analysis: null,
  },
];

// Function to get all interviews
export const getInterviews = () => {
  return mockInterviews;
};

// Function to get interviews with applied filters
export const getFilteredInterviews = (filters) => {
  let filteredInterviews = [...mockInterviews];

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
    filteredInterviews = filteredInterviews.filter((interview) =>
      interview.position.toLowerCase().includes(filters.position.toLowerCase())
    );
  }

  return filteredInterviews;
};

// Function to get interview by ID
export const getInterviewById = (id) => {
  return mockInterviews.find((interview) => interview._id === id);
};

// Function to create a new interview
export const createInterview = (interviewData) => {
  const newInterview = {
    _id: `int${mockInterviews.length + 1}`,
    ...interviewData,
    status: "Scheduled",
    analysisStatus: "Not Started",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analysis: null,
  };

  mockInterviews.push(newInterview);
  return newInterview;
};

// Function to update an interview
export const updateInterview = (id, updates) => {
  const index = mockInterviews.findIndex((interview) => interview._id === id);
  if (index !== -1) {
    mockInterviews[index] = {
      ...mockInterviews[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockInterviews[index];
  }
  return null;
};

// Function to delete an interview
export const deleteInterview = (id) => {
  const index = mockInterviews.findIndex((interview) => interview._id === id);
  if (index !== -1) {
    const deletedInterview = mockInterviews.splice(index, 1)[0];
    return deletedInterview;
  }
  return null;
};

// Function to get interview statistics
export const getInterviewStats = () => {
  const total = mockInterviews.length;
  const completed = mockInterviews.filter(
    (interview) => interview.status === "Completed"
  ).length;
  const scheduled = mockInterviews.filter(
    (interview) => interview.status === "Scheduled"
  ).length;
  const analyzed = mockInterviews.filter(
    (interview) => interview.analysisStatus === "Analyzed"
  ).length;

  return {
    total,
    completed,
    scheduled,
    analyzed,
    pending: completed - analyzed,
  };
};
