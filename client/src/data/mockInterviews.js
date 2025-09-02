// Mock data for Interviews
export const mockInterviews = [
  {
    _id: "int1",
    candidate: {
      _id: "c1",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+91 9876543210",
      college: "GVP College of Engineering",
      department: "Computer Science",
      batch: "2025",
      cgpa: 8.5,
      skills: ["React", "JavaScript", "Python", "SQL"],
    },
    status: "Completed",
    analysisStatus: "Analyzed",
    interviewFile: {
      url: "/uploads/interview1.mp4",
      originalname: "rajesh_interview.mp4",
    },
    questionsFile: {
      url: "/uploads/questions1.pdf",
      originalname: "technical_questions.pdf",
    },
    analysis: {
      overall_score: 8.2,
      technical_score: 8.5,
      communication_score: 7.8,
      confidence_score: 8.0,
      problem_solving_score: 8.3,
      feedback:
        "Strong technical skills with good problem-solving approach. Communication could be improved slightly.",
    },
    questions: [
      {
        question: "Explain the concept of React hooks",
        expectedAnswer:
          "React hooks are functions that allow you to use state and other React features in functional components",
        category: "technical",
        difficulty: "medium",
        points: 10,
      },
      {
        question: "What is the difference between SQL and NoSQL databases?",
        expectedAnswer:
          "SQL databases are relational with structured schema, NoSQL are non-relational with flexible schema",
        category: "technical",
        difficulty: "easy",
        points: 8,
      },
    ],
    notes: "Candidate showed excellent problem-solving skills",
    createdAt: "2025-01-20T00:00:00.000Z",
  },
  {
    _id: "int2",
    candidate: {
      _id: "c2",
      name: "Priya Sharma",
      email: "priya.sharma@email.com",
      phone: "+91 9876543211",
      college: "JNTU Hyderabad",
      department: "Information Technology",
      batch: "2025",
      cgpa: 8.8,
      skills: ["HTML", "CSS", "React", "Node.js"],
    },
    status: "Completed",
    analysisStatus: "Analyzed",
    interviewFile: {
      url: "/uploads/interview2.mp4",
      originalname: "priya_interview.mp4",
    },
    questionsFile: {
      url: "/uploads/questions2.pdf",
      originalname: "frontend_questions.pdf",
    },
    analysis: {
      overall_score: 9.1,
      technical_score: 9.2,
      communication_score: 8.9,
      confidence_score: 9.0,
      problem_solving_score: 9.3,
      feedback:
        "Excellent candidate with strong frontend skills and clear communication. Highly recommended.",
    },
    questions: [
      {
        question: "How do you optimize React application performance?",
        expectedAnswer:
          "Use React.memo, useMemo, useCallback, code splitting, lazy loading",
        category: "technical",
        difficulty: "hard",
        points: 15,
      },
      {
        question: "Explain CSS Grid vs Flexbox",
        expectedAnswer:
          "Grid is 2D layout system, Flexbox is 1D layout system for alignment",
        category: "technical",
        difficulty: "medium",
        points: 12,
      },
    ],
    notes:
      "Outstanding candidate with excellent technical and communication skills",
    createdAt: "2025-01-21T00:00:00.000Z",
  },
  {
    _id: "int3",
    candidate: {
      _id: "c3",
      name: "Anil Reddy",
      email: "anil.reddy@email.com",
      phone: "+91 9876543212",
      college: "CBIT",
      department: "Computer Science",
      batch: "2025",
      cgpa: 8.2,
      skills: ["Python", "Data Analysis", "SQL", "Tableau"],
    },
    status: "In Progress",
    analysisStatus: "Pending",
    interviewFile: null,
    questionsFile: null,
    analysis: null,
    questions: [],
    notes: "Interview scheduled for next week",
    createdAt: "2025-01-22T00:00:00.000Z",
  },
  {
    _id: "int4",
    candidate: {
      _id: "c4",
      name: "Sneha Patel",
      email: "sneha.patel@email.com",
      phone: "+91 9876543213",
      college: "VIT University",
      department: "Computer Science",
      batch: "2025",
      cgpa: 9.1,
      skills: ["Java", "Spring Boot", "Angular", "MySQL"],
    },
    status: "Completed",
    analysisStatus: "Processing",
    interviewFile: {
      url: "/uploads/interview4.mp4",
      originalname: "sneha_interview.mp4",
    },
    questionsFile: {
      url: "/uploads/questions4.pdf",
      originalname: "backend_questions.pdf",
    },
    analysis: null,
    questions: [
      {
        question: "Explain Spring Boot auto-configuration",
        expectedAnswer:
          "Spring Boot auto-configuration automatically configures beans based on classpath dependencies",
        category: "technical",
        difficulty: "hard",
        points: 15,
      },
    ],
    notes: "Strong backend development skills demonstrated",
    createdAt: "2025-01-23T00:00:00.000Z",
  },
  {
    _id: "int5",
    candidate: {
      _id: "c5",
      name: "Karthik Menon",
      email: "karthik.menon@email.com",
      phone: "+91 9876543214",
      college: "BITS Pilani",
      department: "Computer Science",
      batch: "2025",
      cgpa: 8.9,
      skills: ["Docker", "Kubernetes", "AWS", "Python"],
    },
    status: "Completed",
    analysisStatus: "Analyzed",
    interviewFile: {
      url: "/uploads/interview5.mp4",
      originalname: "karthik_interview.mp4",
    },
    questionsFile: {
      url: "/uploads/questions5.pdf",
      originalname: "devops_questions.pdf",
    },
    analysis: {
      overall_score: 8.7,
      technical_score: 9.0,
      communication_score: 8.2,
      confidence_score: 8.8,
      problem_solving_score: 8.9,
      feedback:
        "Excellent DevOps knowledge with hands-on experience. Good problem-solving approach.",
    },
    questions: [
      {
        question: "Explain Docker containerization benefits",
        expectedAnswer:
          "Docker provides isolation, portability, scalability, and consistent environments",
        category: "technical",
        difficulty: "medium",
        points: 12,
      },
      {
        question: "What is Kubernetes orchestration?",
        expectedAnswer:
          "Kubernetes automates deployment, scaling, and management of containerized applications",
        category: "technical",
        difficulty: "hard",
        points: 15,
      },
    ],
    notes: "Strong DevOps background with practical experience",
    createdAt: "2025-01-24T00:00:00.000Z",
  },
];

// Mock function to get interviews by group
export const getInterviewsByGroup = (groupId) => {
  // For demo purposes, return different interviews based on group
  switch (groupId) {
    case "1": // GVP_Software_Developer_2025
      return mockInterviews.filter((interview) =>
        ["int1", "int2", "int3"].includes(interview._id)
      );
    case "2": // JNTU_Frontend_Developer_2025
      return mockInterviews.filter((interview) =>
        ["int2", "int4"].includes(interview._id)
      );
    case "3": // CBIT_Data_Analyst_2025
      return mockInterviews.filter((interview) =>
        ["int3"].includes(interview._id)
      );
    case "4": // VIT_Full_Stack_Developer_2025
      return mockInterviews.filter((interview) =>
        ["int4", "int5"].includes(interview._id)
      );
    case "5": // BITS_DevOps_Engineer_2025
      return mockInterviews.filter((interview) =>
        ["int5"].includes(interview._id)
      );
    default:
      return [];
  }
};

// Mock function to get all interviews
export const getAllInterviews = () => {
  return [...mockInterviews];
};

// Mock function to get interview by ID
export const getInterviewById = (id) => {
  return mockInterviews.find((interview) => interview._id === id);
};

// Mock function to get interviews with filters
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
    // This would need to be matched with group data in a real scenario
    filteredInterviews = filteredInterviews.filter((interview) =>
      interview.candidate.skills.some((skill) =>
        skill.toLowerCase().includes(filters.position.toLowerCase())
      )
    );
  }

  return filteredInterviews;
};
