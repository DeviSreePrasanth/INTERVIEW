// Mock data for Candidates - Simplified Schema
export const mockCandidates = [
  {
    _id: "c1",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    college: "GVP College of Engineering",
    department: "Computer Science",
    skills: ["React", "JavaScript", "Python", "SQL"],
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    _id: "c2",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    college: "JNTU Hyderabad",
    department: "Information Technology",
    skills: ["HTML", "CSS", "React", "Node.js"],
    createdAt: "2025-01-11T00:00:00.000Z",
  },
  {
    _id: "c3",
    name: "Anil Reddy",
    email: "anil.reddy@email.com",
    college: "CBIT",
    department: "Computer Science",
    skills: ["Python", "Data Analysis", "SQL", "Tableau"],
    createdAt: "2025-01-12T00:00:00.000Z",
  },
  {
    _id: "c4",
    name: "Sneha Patel",
    email: "sneha.patel@email.com",
    college: "VIT University",
    department: "Computer Science",
    skills: ["Java", "Spring Boot", "Angular", "MySQL"],
    createdAt: "2025-01-13T00:00:00.000Z",
  },
  {
    _id: "c5",
    name: "Karthik Menon",
    email: "karthik.menon@email.com",
    college: "BITS Pilani",
    department: "Computer Science",
    skills: ["Docker", "Kubernetes", "AWS", "Python"],
    createdAt: "2025-01-14T00:00:00.000Z",
  },
  {
    _id: "c6",
    name: "Deepika Singh",
    email: "deepika.singh@email.com",
    college: "GVP College of Engineering",
    department: "Information Technology",
    skills: ["JavaScript", "Vue.js", "PHP", "MongoDB"],
    createdAt: "2025-01-15T00:00:00.000Z",
  },
  {
    _id: "c7",
    name: "Rohit Gupta",
    email: "rohit.gupta@email.com",
    college: "JNTU Hyderabad",
    department: "Computer Science",
    skills: ["C++", "Machine Learning", "TensorFlow", "OpenCV"],
    address: "Karimnagar, Telangana",
    createdAt: "2025-01-16T00:00:00.000Z",
  },
  {
    _id: "c8",
    name: "Anitha Rao",
    email: "anitha.rao@email.com",
    college: "CBIT",
    department: "Information Technology",
    skills: ["React Native", "Flutter", "Firebase", "GraphQL"],
    createdAt: "2025-01-17T00:00:00.000Z",
  },
];

// Mock function to get all candidates
export const getCandidates = () => {
  return [...mockCandidates];
};

// Mock function to get candidate by ID
export const getCandidateById = (id) => {
  return mockCandidates.find((candidate) => candidate._id === id);
};

// Mock function to get candidates by college
export const getCandidatesByCollege = (college) => {
  return mockCandidates.filter((candidate) =>
    candidate.college.toLowerCase().includes(college.toLowerCase())
  );
};

// Mock function to get candidates by skills
export const getCandidatesBySkills = (skills) => {
  if (!Array.isArray(skills)) return [];

  return mockCandidates.filter((candidate) =>
    skills.some((skill) =>
      candidate.skills.some((candidateSkill) =>
        candidateSkill.toLowerCase().includes(skill.toLowerCase())
      )
    )
  );
};
