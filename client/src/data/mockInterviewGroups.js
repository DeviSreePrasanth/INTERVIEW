// Mock data for Interview Groups
export const mockInterviewGroups = [
  {
    _id: "1",
    name: "GVP_Software_Developer_2025",
    description: "Software Developer positions for 2025 batch",
    college: "GVP College of Engineering",
    department: "Computer Science",
    position: "Software Developer",
    batch: "2025",
    status: "Active",
    maxCandidates: 50,
    currentCandidates: 12,
    interviewDate: "2025-02-15",
    location: "Campus Auditorium",
    createdAt: "2025-01-15T00:00:00.000Z",
    statistics: {
      analyzedInterviews: 8,
      averageScore: 7.2,
    },
  },
  {
    _id: "2",
    name: "JNTU_Frontend_Developer_2025",
    description: "Frontend Developer roles for fresh graduates",
    college: "JNTU Hyderabad",
    department: "Information Technology",
    position: "Frontend Developer",
    batch: "2025",
    status: "Completed",
    maxCandidates: 30,
    currentCandidates: 25,
    interviewDate: "2025-01-20",
    location: "IT Lab 1",
    createdAt: "2025-01-10T00:00:00.000Z",
    statistics: {
      analyzedInterviews: 25,
      averageScore: 8.1,
    },
  },
  {
    _id: "3",
    name: "CBIT_Data_Analyst_2025",
    description: "Data Analyst positions for analytics roles",
    college: "CBIT",
    department: "Computer Science",
    position: "Data Analyst",
    batch: "2025",
    status: "Draft",
    maxCandidates: 20,
    currentCandidates: 5,
    interviewDate: "2025-03-01",
    location: "Conference Room A",
    createdAt: "2025-01-25T00:00:00.000Z",
    statistics: {
      analyzedInterviews: 0,
      averageScore: 0,
    },
  },
  {
    _id: "4",
    name: "VIT_Full_Stack_Developer_2025",
    description: "Full Stack Developer positions for experienced candidates",
    college: "VIT University",
    department: "Computer Science",
    position: "Full Stack Developer",
    batch: "2025",
    status: "Active",
    maxCandidates: 40,
    currentCandidates: 18,
    interviewDate: "2025-02-25",
    location: "Tech Center",
    createdAt: "2025-01-18T00:00:00.000Z",
    statistics: {
      analyzedInterviews: 12,
      averageScore: 7.8,
    },
  },
  {
    _id: "5",
    name: "BITS_DevOps_Engineer_2025",
    description: "DevOps Engineer roles for cloud infrastructure",
    college: "BITS Pilani",
    department: "Computer Science",
    position: "DevOps Engineer",
    batch: "2025",
    status: "Archived",
    maxCandidates: 15,
    currentCandidates: 15,
    interviewDate: "2025-01-10",
    location: "Cloud Lab",
    createdAt: "2025-01-05T00:00:00.000Z",
    statistics: {
      analyzedInterviews: 15,
      averageScore: 8.5,
    },
  },
];

// Mock function to get filtered groups
// Function to get all groups
export const getGroups = () => {
  return mockInterviewGroups;
};

// Function to get filtered groups
export const getFilteredGroups = (filters) => {
  let filteredGroups = [...mockInterviewGroups];

  if (filters.status) {
    filteredGroups = filteredGroups.filter(
      (group) => group.status === filters.status
    );
  }

  if (filters.college) {
    filteredGroups = filteredGroups.filter((group) =>
      group.college.toLowerCase().includes(filters.college.toLowerCase())
    );
  }

  if (filters.position) {
    filteredGroups = filteredGroups.filter((group) =>
      group.position.toLowerCase().includes(filters.position.toLowerCase())
    );
  }

  return filteredGroups;
};

// Mock function to get group details
export const getGroupDetails = (groupId) => {
  const group = mockInterviewGroups.find((g) => g._id === groupId);
  if (!group) return null;

  return {
    interviewGroup: {
      _id: group._id,
      name: group.name,
      description: group.description,
      college: group.college,
      department: group.department,
      position: group.position,
      batch: group.batch,
      status: group.status,
      maxCandidates: group.maxCandidates,
      currentCandidates: group.currentCandidates,
      interviewDate: group.interviewDate,
      location: group.location,
      createdAt: group.createdAt,
    },
  };
};
