const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Import models
const User = require("../src/models/User");
const InterviewGroup = require("../src/models/InterviewGroup");
const Candidate = require("../src/models/Candidate");
const Interview = require("../src/models/Interview");

// Sample data
const sampleUsers = [
  {
    name: "John Doe",
    email: "john.doe@company.com",
    password: "password123",
    role: "recruiter",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@company.com",
    password: "password123",
    role: "recruiter",
  },
];

const sampleCandidates = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    role: "Software Developer",
    phone: "+91-9876543210",
    college: "GVP College of Engineering",
    department: "Computer Science",
    skills: ["React", "JavaScript", "Python", "SQL"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    role: "Frontend Developer",
    phone: "+91-9876543211",
    college: "JNTU Hyderabad",
    department: "Information Technology",
    skills: ["HTML", "CSS", "React", "Node.js"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Anil Reddy",
    email: "anil.reddy@email.com",
    role: "Data Analyst",
    phone: "+91-9876543212",
    college: "CBIT",
    department: "Computer Science",
    skills: ["Python", "Data Analysis", "SQL", "Tableau"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Sneha Patel",
    email: "sneha.patel@email.com",
    role: "Backend Developer",
    phone: "+91-9876543213",
    college: "VIT University",
    department: "Computer Science",
    skills: ["Java", "Spring Boot", "Angular", "MySQL"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Karthik Menon",
    email: "karthik.menon@email.com",
    role: "DevOps Engineer",
    phone: "+91-9876543214",
    college: "BITS Pilani",
    department: "Computer Science",
    skills: ["Docker", "Kubernetes", "AWS", "Python"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Deepika Singh",
    email: "deepika.singh@email.com",
    role: "Data Scientist",
    phone: "+91-9876543215",
    college: "IIT Hyderabad",
    department: "Computer Science",
    skills: ["Machine Learning", "Python", "TensorFlow", "Data Science"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Arjun Krishnan",
    email: "arjun.krishnan@email.com",
    role: "System Engineer",
    phone: "+91-9876543216",
    college: "NIT Warangal",
    department: "Computer Science",
    skills: ["C++", "System Programming", "Linux", "Networking"],
    experience: "0-1 years",
    status: "Active",
  },
  {
    name: "Meera Gupta",
    email: "meera.gupta@email.com",
    role: "Full Stack Developer",
    phone: "+91-9876543217",
    college: "Anna University",
    department: "Information Technology",
    skills: ["PHP", "Laravel", "MySQL", "WordPress"],
    experience: "0-1 years",
    status: "Active",
  },
];

const sampleInterviewGroups = [
  {
    name: "GVP_Software_Developer_2025",
    description: "Software Developer positions for 2025 batch",
    college: "GVP College of Engineering",
    department: "Computer Science",
    position: "Software Developer",
    batch: "2025",
    status: "Active",
    maxCandidates: 50,
    interviewDate: new Date("2025-02-15"),
    location: "Campus Auditorium",
    instructions: "Please bring your laptop and resume",
  },
  {
    name: "JNTU_Frontend_Developer_2025",
    description: "Frontend Developer roles for fresh graduates",
    college: "JNTU Hyderabad",
    department: "Information Technology",
    position: "Frontend Developer",
    batch: "2025",
    status: "Completed",
    maxCandidates: 30,
    interviewDate: new Date("2025-01-20"),
    location: "IT Lab 1",
    instructions: "Focus on React and JavaScript concepts",
  },
  {
    name: "CBIT_Data_Analyst_2025",
    description: "Data Analyst positions for analytics roles",
    college: "CBIT",
    department: "Computer Science",
    position: "Data Analyst",
    batch: "2025",
    status: "Draft",
    maxCandidates: 20,
    interviewDate: new Date("2025-03-01"),
    location: "Analytics Lab",
    instructions: "Prepare for statistical analysis questions",
  },
  {
    name: "VIT_Backend_Developer_2025",
    description: "Backend Developer positions focusing on API development",
    college: "VIT University",
    department: "Computer Science",
    position: "Backend Developer",
    batch: "2025",
    status: "Active",
    maxCandidates: 40,
    interviewDate: new Date("2025-02-28"),
    location: "Software Lab 2",
    instructions: "Knowledge of REST APIs and databases required",
  },
];

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/interview_app";
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await InterviewGroup.deleteMany({});
    await Candidate.deleteMany({});
    await Interview.deleteMany({});
    console.log("🗑️  Database cleared");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  }
};

const seedUsers = async () => {
  try {
    const users = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      users.push({
        ...userData,
        password: hashedPassword,
      });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    return [];
  }
};

const seedCandidates = async (users) => {
  try {
    const candidates = sampleCandidates.map((candidate, index) => ({
      ...candidate,
      createdBy: users[index % users.length]._id,
    }));

    const createdCandidates = await Candidate.insertMany(candidates);
    console.log(`✅ Created ${createdCandidates.length} candidates`);
    return createdCandidates;
  } catch (error) {
    console.error("❌ Error seeding candidates:", error);
    return [];
  }
};

const seedInterviewGroups = async (users) => {
  try {
    const interviewGroups = sampleInterviewGroups.map((group, index) => ({
      ...group,
      recruiterId: users[index % users.length]._id,
    }));

    const createdGroups = await InterviewGroup.insertMany(interviewGroups);
    console.log(`✅ Created ${createdGroups.length} interview groups`);
    return createdGroups;
  } catch (error) {
    console.error("❌ Error seeding interview groups:", error);
    return [];
  }
};

const seedInterviews = async (users, candidates, interviewGroups) => {
  try {
    const interviews = [];

    // Create sample interviews with analysis data
    const sampleAnalysisData = [
      {
        overall_score: 8.5,
        technical_score: 8.0,
        communication_score: 9.0,
        confidence_score: 8.5,
      },
      {
        overall_score: 7.2,
        technical_score: 7.5,
        communication_score: 7.0,
        confidence_score: 7.0,
      },
      {
        overall_score: 9.1,
        technical_score: 9.5,
        communication_score: 8.5,
        confidence_score: 9.5,
      },
      {
        overall_score: 6.8,
        technical_score: 6.5,
        communication_score: 7.5,
        confidence_score: 6.5,
      },
      {
        overall_score: 8.9,
        technical_score: 9.0,
        communication_score: 8.5,
        confidence_score: 9.2,
      },
      {
        overall_score: 5.5,
        technical_score: 5.0,
        communication_score: 6.0,
        confidence_score: 5.5,
      },
      {
        overall_score: 7.8,
        technical_score: 8.0,
        communication_score: 7.5,
        confidence_score: 8.0,
      },
      {
        overall_score: 8.3,
        technical_score: 8.5,
        communication_score: 8.0,
        confidence_score: 8.5,
      },
    ];

    const positions = [
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Data Analyst",
    ];

    // Create interviews for each candidate
    candidates.forEach((candidate, index) => {
      const user = users[index % users.length];
      const group = interviewGroups[index % interviewGroups.length];
      const analysis = sampleAnalysisData[index % sampleAnalysisData.length];

      interviews.push({
        candidate: candidate._id,
        interviewer: user._id,
        interviewGroup: group._id,
        position: positions[index % positions.length],
        department: group.department,
        status: index % 4 === 0 ? "Scheduled" : "Completed",
        analysisStatus: index % 4 === 0 ? "Pending" : "Analyzed",
        interviewDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date in last 30 days
        analysis:
          index % 4 === 0
            ? null
            : {
                overall_score: analysis.overall_score,
                technical_score: analysis.technical_score,
                communication_score: analysis.communication_score,
                confidence_score: analysis.confidence_score,
                feedback: "Sample AI-generated feedback for this interview.",
                communicationMetrics: {
                  grammarScore: Math.random() * 10,
                  clarityScore: Math.random() * 10,
                  fillerWords: Math.floor(Math.random() * 20),
                  averageResponseTime: Math.random() * 30 + 10,
                },
              },
      });
    });

    const createdInterviews = await Interview.insertMany(interviews);
    console.log(`✅ Created ${createdInterviews.length} interviews`);
    return createdInterviews;
  } catch (error) {
    console.error("❌ Error seeding interviews:", error);
    return [];
  }
};

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    const candidates = await seedCandidates(users);
    const interviewGroups = await seedInterviewGroups(users);
    const interviews = await seedInterviews(users, candidates, interviewGroups);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Candidates: ${candidates.length}`);
    console.log(`   - Interview Groups: ${interviewGroups.length}`);
    console.log(`   - Interviews: ${interviews.length}`);

    console.log("\n👤 Test Users:");
    users.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - Password: password123`);
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
    process.exit(0);
  }
};

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
