// Mock data for Reports and Analytics

export const mockInterviews = [
  {
    id: 1,
    candidate: "Rajesh Kumar",
    role: "Software Developer",
    date: "2025-01-20",
    scores: {
      technical: 8.5,
      communication: 7.8,
      confidence: 8.2,
      overall: 8.2,
    },
    questionAnalysis: [
      {
        question: "What is React and explain its key features?",
        candidateAnswer:
          "React is a JavaScript library for building user interfaces. Key features include virtual DOM, component-based architecture, unidirectional data flow, and JSX syntax...",
        score: 9,
        feedback:
          "Excellent understanding of React fundamentals and clear explanation",
      },
      {
        question: "Explain state management in React applications",
        candidateAnswer:
          "State management involves managing data that changes over time. In React, we have local state using useState, context API for global state, and external libraries like Redux...",
        score: 8,
        feedback: "Good knowledge of state management concepts",
      },
      {
        question: "What are React Hooks and why are they useful?",
        candidateAnswer:
          "React Hooks are functions that let you use state and other React features in functional components. They provide a cleaner way to manage component logic...",
        score: 8.5,
        feedback: "Very good understanding of hooks and their benefits",
      },
      {
        question: "Explain the difference between SQL and NoSQL databases",
        candidateAnswer:
          "SQL databases are relational with structured schema, while NoSQL databases are non-relational and more flexible with data structure...",
        score: 7.5,
        feedback: "Good basic understanding, could elaborate more on use cases",
      },
    ],
    communicationMetrics: {
      grammarScore: 8.5,
      clarityScore: 7.8,
      fillerWords: 12,
      averageResponseTime: 3.2,
    },
  },
  {
    id: 2,
    candidate: "Priya Sharma",
    role: "Frontend Developer",
    date: "2025-01-18",
    scores: {
      technical: 7.2,
      communication: 8.9,
      confidence: 7.5,
      overall: 7.9,
    },
    questionAnalysis: [
      {
        question: "What is the difference between HTML, CSS, and JavaScript?",
        candidateAnswer:
          "HTML provides structure, CSS handles styling and layout, while JavaScript adds interactivity and dynamic behavior to web pages...",
        score: 8,
        feedback: "Clear understanding of web technologies",
      },
      {
        question: "Explain responsive web design principles",
        candidateAnswer:
          "Responsive design ensures websites work well on all devices using flexible grids, media queries, and scalable images...",
        score: 7.5,
        feedback: "Good knowledge of responsive design concepts",
      },
      {
        question: "What are CSS preprocessors and their benefits?",
        candidateAnswer:
          "CSS preprocessors like Sass and Less extend CSS with features like variables, nesting, and mixins for better maintainability...",
        score: 6.5,
        feedback: "Basic understanding, could provide more specific examples",
      },
      {
        question: "Explain the concept of DOM manipulation",
        candidateAnswer:
          "DOM manipulation involves dynamically changing HTML elements and their properties using JavaScript methods like getElementById, appendChild...",
        score: 7,
        feedback: "Adequate understanding with practical examples",
      },
    ],
    communicationMetrics: {
      grammarScore: 9.0,
      clarityScore: 8.8,
      fillerWords: 8,
      averageResponseTime: 2.8,
    },
  },
  {
    id: 3,
    candidate: "Anil Reddy",
    role: "Data Analyst",
    date: "2025-01-15",
    scores: {
      technical: 8.8,
      communication: 7.2,
      confidence: 8.0,
      overall: 8.0,
    },
    questionAnalysis: [
      {
        question: "What is data analysis and its importance in business?",
        candidateAnswer:
          "Data analysis is the process of examining datasets to draw conclusions and insights that drive business decisions and strategy...",
        score: 9,
        feedback: "Excellent understanding of data analysis fundamentals",
      },
      {
        question: "Explain different types of data visualization charts",
        candidateAnswer:
          "Different charts serve different purposes - bar charts for comparisons, line charts for trends, pie charts for proportions, scatter plots for correlations...",
        score: 8.5,
        feedback: "Very good knowledge of visualization techniques",
      },
      {
        question: "What is SQL and why is it important for data analysis?",
        candidateAnswer:
          "SQL is a programming language for managing relational databases. It's crucial for data analysts to extract, filter, and manipulate data efficiently...",
        score: 8.5,
        feedback: "Strong SQL knowledge with practical application",
      },
      {
        question: "Explain the concept of statistical significance",
        candidateAnswer:
          "Statistical significance indicates whether results are likely due to chance or represent a real effect in the population being studied...",
        score: 9,
        feedback: "Excellent grasp of statistical concepts",
      },
    ],
    communicationMetrics: {
      grammarScore: 7.8,
      clarityScore: 7.0,
      fillerWords: 15,
      averageResponseTime: 3.8,
    },
  },
  {
    id: 4,
    candidate: "Sneha Patel",
    role: "Backend Developer",
    date: "2025-01-12",
    scores: {
      technical: 7.8,
      communication: 8.2,
      confidence: 7.8,
      overall: 7.9,
    },
    questionAnalysis: [
      {
        question: "What is Node.js and its advantages?",
        candidateAnswer:
          "Node.js is a JavaScript runtime built on Chrome's V8 engine. Advantages include non-blocking I/O, single-threaded event loop, and NPM ecosystem...",
        score: 8,
        feedback: "Good understanding of Node.js architecture",
      },
      {
        question: "Explain REST API design principles",
        candidateAnswer:
          "REST APIs follow architectural constraints like statelessness, uniform interface, client-server separation, and proper HTTP methods usage...",
        score: 8.5,
        feedback: "Very good explanation of RESTful principles",
      },
      {
        question: "What is database normalization?",
        candidateAnswer:
          "Database normalization is organizing data to reduce redundancy and improve data integrity through different normal forms...",
        score: 7,
        feedback: "Basic understanding, could elaborate on normal forms",
      },
      {
        question: "Explain authentication vs authorization",
        candidateAnswer:
          "Authentication verifies user identity while authorization determines what authenticated users can access or do in the system...",
        score: 8,
        feedback: "Clear distinction between the two concepts",
      },
    ],
    communicationMetrics: {
      grammarScore: 8.7,
      clarityScore: 8.0,
      fillerWords: 10,
      averageResponseTime: 3.0,
    },
  },
  {
    id: 5,
    candidate: "Vikram Singh",
    role: "Full Stack Developer",
    date: "2025-01-10",
    scores: {
      technical: 9.0,
      communication: 8.5,
      confidence: 8.8,
      overall: 8.8,
    },
    questionAnalysis: [
      {
        question: "Explain the full stack development workflow",
        candidateAnswer:
          "Full stack development involves both frontend and backend. The workflow includes requirement analysis, database design, API development, frontend implementation, testing, and deployment...",
        score: 9.5,
        feedback: "Outstanding comprehensive understanding",
      },
      {
        question: "What are microservices and their benefits?",
        candidateAnswer:
          "Microservices architecture breaks applications into small, independent services that communicate via APIs. Benefits include scalability, technology diversity, and easier maintenance...",
        score: 9,
        feedback: "Excellent knowledge of modern architecture patterns",
      },
      {
        question: "Explain version control best practices",
        candidateAnswer:
          "Best practices include meaningful commit messages, feature branching, regular merging, code reviews, and maintaining clean history...",
        score: 8.5,
        feedback: "Very good understanding of Git workflows",
      },
      {
        question: "What is CI/CD and why is it important?",
        candidateAnswer:
          "CI/CD stands for Continuous Integration/Continuous Deployment. It automates testing and deployment, reducing errors and enabling faster, more reliable releases...",
        score: 9,
        feedback: "Excellent grasp of DevOps practices",
      },
    ],
    communicationMetrics: {
      grammarScore: 9.2,
      clarityScore: 8.8,
      fillerWords: 5,
      averageResponseTime: 2.5,
    },
  },
];

// Function to get all interviews
export const getInterviews = () => {
  return mockInterviews;
};

// Function to get interview by ID
export const getInterviewById = (id) => {
  return mockInterviews.find((interview) => interview.id === parseInt(id));
};

// Function to get interviews filtered by criteria
export const getFilteredInterviews = (filterBy, filterValue) => {
  if (filterBy === "all" || !filterValue) {
    return mockInterviews;
  }

  switch (filterBy) {
    case "candidate":
      return mockInterviews.filter((interview) =>
        interview.candidate.toLowerCase().includes(filterValue.toLowerCase())
      );
    case "role":
      return mockInterviews.filter((interview) =>
        interview.role.toLowerCase().includes(filterValue.toLowerCase())
      );
    case "date":
      return mockInterviews.filter((interview) =>
        interview.date.includes(filterValue)
      );
    default:
      return mockInterviews;
  }
};

// Function to get overall analytics data
export const getOverallAnalytics = () => {
  return mockInterviews.map((interview) => ({
    name: interview.candidate.split(" ")[0],
    technical: interview.scores.technical,
    communication: interview.scores.communication,
    confidence: interview.scores.confidence,
    overall: interview.scores.overall,
  }));
};

// Function to get performance statistics
export const getPerformanceStats = () => {
  const totalInterviews = mockInterviews.length;
  const avgTechnical =
    mockInterviews.reduce(
      (sum, interview) => sum + interview.scores.technical,
      0
    ) / totalInterviews;
  const avgCommunication =
    mockInterviews.reduce(
      (sum, interview) => sum + interview.scores.communication,
      0
    ) / totalInterviews;
  const avgConfidence =
    mockInterviews.reduce(
      (sum, interview) => sum + interview.scores.confidence,
      0
    ) / totalInterviews;
  const avgOverall =
    mockInterviews.reduce(
      (sum, interview) => sum + interview.scores.overall,
      0
    ) / totalInterviews;

  return {
    totalInterviews,
    averageScores: {
      technical: Math.round(avgTechnical * 10) / 10,
      communication: Math.round(avgCommunication * 10) / 10,
      confidence: Math.round(avgConfidence * 10) / 10,
      overall: Math.round(avgOverall * 10) / 10,
    },
  };
};
