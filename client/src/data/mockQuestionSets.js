// Mock data for Question Sets
export const mockQuestionSets = [
  {
    _id: "qs1",
    title: "Software Development Basics",
    totalQuestions: 25,
    category: "Technical",
    description: "Fundamental questions about software development concepts",
    difficulty: "Medium",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    _id: "qs2",
    title: "Frontend Technologies",
    totalQuestions: 20,
    category: "Technical",
    description: "Questions focused on HTML, CSS, JavaScript, and React",
    difficulty: "Medium",
    createdAt: "2025-01-02T00:00:00.000Z",
  },
  {
    _id: "qs3",
    title: "Behavioral Questions",
    totalQuestions: 15,
    category: "Behavioral",
    description: "Questions to assess soft skills and cultural fit",
    difficulty: "Easy",
    createdAt: "2025-01-03T00:00:00.000Z",
  },
  {
    _id: "qs4",
    title: "Data Structures & Algorithms",
    totalQuestions: 30,
    category: "Technical",
    description: "Advanced questions on DSA concepts and problem solving",
    difficulty: "Hard",
    createdAt: "2025-01-04T00:00:00.000Z",
  },
  {
    _id: "qs5",
    title: "System Design",
    totalQuestions: 18,
    category: "Technical",
    description: "Architecture and system design questions",
    difficulty: "Hard",
    createdAt: "2025-01-05T00:00:00.000Z",
  },
  {
    _id: "qs6",
    title: "Database Concepts",
    totalQuestions: 22,
    category: "Technical",
    description: "SQL, NoSQL, and database design questions",
    difficulty: "Medium",
    createdAt: "2025-01-06T00:00:00.000Z",
  },
];

// Mock function to get question sets
export const getQuestionSets = () => {
  return [...mockQuestionSets];
};

// Mock function to get question set by ID
export const getQuestionSetById = (id) => {
  return mockQuestionSets.find((qs) => qs._id === id);
};
