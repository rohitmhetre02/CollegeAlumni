import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rohitmhetre2004:MrRoya02@alumniportal.cnjugkh.mongodb.net/?appName=AlumniPortal";

const approvedById = new mongoose.Types.ObjectId("6907c99700f10ec7641becbd");

const profilePictureUrl =
  "https://res.cloudinary.com/demo/image/upload/v1700000000/sample_profile.jpg";

const resumeUrl =
  "https://res.cloudinary.com/demo/raw/upload/v1700000000/sample_resume.pdf";

const alumni = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Neha Joshi",
    email: "neha.joshi@microsoft.com",
    password: "neha.joshi@microsoft.com",
    role: "alumni",
    department: "Computer Engineering",
    phone: "9503582266",
    workExperience: 5,
    skills: ["C#", "Core Java", "SQL Server", "Microservices Architecture", "API Security"],
    isActive: true,
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Employee Skill Tracker System",
        githubLink: "",
        projectLink: "",
        description:
          "Designed an internal tool for employee skill mapping using React and Azure Functions.",
        skills: ["React", "Bootstrap", "CSS", "EmailJS", "Flex/Grid"],
      },
    ],
    languages: [
      {
        _id: new mongoose.Types.ObjectId(),
        language: "English",
        proficiency: "Fluent",
      },
    ],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "Microsoft India",
        description:
          "Built and deployed scalable cloud-based microservices on Azure. Mentored 10+ new engineers through Microsoft LEAP program.",
      },
    ],
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: approvedById,
    company: "Microsoft India",
    currentPosition: "Senior Software Engineer",
    gender: "Female",
    headline: "Cloud Developer | Microservices | Azure Architect",
    location: "Pune",
    profilePicture: profilePictureUrl,
    staffId: "",
    bio: "Software Engineer at Microsoft India with 5+ years of experience in backend architecture and Azure cloud technologies.",
    college: "ABC College of Engineering",
    degree: "B.E. Computer Science and Engineering",
    graduationYear: 2018,
    portfolioUrl: "",
    instagramUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    resumeUrl,
    profileLink: "neha-joshi",
  },

  // 2. INFORMATION TECHNOLOGY
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Aakash Sharma",
    email: "aakash.sharma@google.com",
    password: "aakash.sharma@google.com",
    role: "alumni",
    department: "Information Technology",
    phone: "9876543101",
    workExperience: 4,
    skills: ["JavaScript", "React", "Node.js", "Firebase", "Next.js"],
    isActive: true,
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Realtime Chat Platform",
        description: "Built a scalable chat application using Firebase and React.",
        skills: ["React", "Firebase", "Tailwind"],
      },
    ],
    languages: [{ _id: new mongoose.Types.ObjectId(), language: "English", proficiency: "Fluent" }],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "Google India",
        description: "Working on frontend performance optimization for Google Maps.",
      },
    ],
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: approvedById,
    company: "Google India",
    currentPosition: "Frontend Engineer",
    gender: "Male",
    headline: "Frontend Engineer | Performance Optimization",
    location: "Mumbai",
    profilePicture: profilePictureUrl,
    college: "XYZ College",
    degree: "B.E. Information Technology",
    graduationYear: 2019,
    resumeUrl,
  },

  // 3. AI & DATA SCIENCE
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Riya Kulkarni",
    email: "riya.kulkarni@ibm.com",
    password: "riya.kulkarni@ibm.com",
    role: "alumni",
    department: "Artificial Intelligence and Data Science",
    phone: "9876543102",
    workExperience: 3,
    skills: ["Python", "TensorFlow", "Pandas", "ML Models"],
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "AI Healthcare Predictor",
        description: "Built ML models for disease prediction.",
        skills: ["TensorFlow", "Pandas"],
      },
    ],
    languages: [{ _id: new mongoose.Types.ObjectId(), language: "English", proficiency: "Fluent" }],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "IBM India",
        description: "Developing AI-based intelligent automation systems.",
      },
    ],
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: approvedById,
    currentPosition: "Machine Learning Engineer",
    company: "IBM India",
    gender: "Female",
    profilePicture: profilePictureUrl,
    resumeUrl,
    graduationYear: 2020,
    college: "AP College of Engineering",
    degree: "B.E. AI & DS",
  },

  // 4. ELECTRONICS & TELECOMMUNICATION
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Sagar Deshmukh",
    email: "sagar.deshmukh@samsung.com",
    password: "sagar.deshmukh@samsung.com",
    role: "alumni",
    department: "Electronics and Telecommunication",
    phone: "9876543103",
    workExperience: 6,
    skills: ["Embedded C", "IoT", "Microcontrollers"],
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Smart IoT Controller",
        description: "Designed real-time IoT-based device controller.",
        skills: ["C", "IoT", "Sensors"],
      },
    ],
    languages: [{ _id: new mongoose.Types.ObjectId(), language: "English", proficiency: "Fluent" }],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "Samsung India",
        description: "Developing embedded systems for consumer electronics.",
      },
    ],
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: approvedById,
    currentPosition: "Embedded Systems Engineer",
    company: "Samsung Electronics",
    gender: "Male",
    profilePicture: profilePictureUrl,
    resumeUrl,
  },

  // 5. CIVIL ENGINEERING
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Pooja Chavan",
    email: "pooja.chavan@lnt.com",
    password: "pooja.chavan@lnt.com",
    role: "alumni",
    department: "Civil Engineering",
    phone: "9876543104",
    workExperience: 5,
    skills: ["AutoCAD", "STAAD Pro", "Structural Analysis"],
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Earthquake Resistant Structures",
        description: "Worked on building safe structural designs.",
      },
    ],
    languages: [{ _id: new mongoose.Types.ObjectId(), language: "English", proficiency: "Fluent" }],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "L&T Construction",
        description: "Worked in structural building design.",
      },
    ],
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: approvedById,
    currentPosition: "Structural Engineer",
    company: "L&T",
    gender: "Female",
    profilePicture: profilePictureUrl,
    resumeUrl,
  },

  // 6. ELECTRICAL ENGINEERING
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Nikhil Patil",
    email: "nikhil.patil@tata.com",
    password: "nikhil.patil@tata.com",
    role: "alumni",
    department: "Electrical Engineering",
    phone: "9876543105",
    workExperience: 4,
    skills: ["Power Systems", "Circuit Design"],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "Tata Power",
        description: "Worked on power grid optimization.",
      },
    ],
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Smart Grid Automation",
        description: "Implemented automation for energy distribution.",
      },
    ],
    approvalStatus: "approved",
    approvedBy: approvedById,
    approvedAt: new Date(),
    currentPosition: "Electrical Engineer",
    company: "Tata Power",
    gender: "Male",
    profilePicture: profilePictureUrl,
    resumeUrl,
  },

  // 7. MECHANICAL ENGINEERING
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Aditi Verma",
    email: "aditi.verma@bosch.com",
    password: "aditi.verma@bosch.com",
    role: "alumni",
    department: "Mechanical Engineering",
    phone: "9876543106",
    workExperience: 5,
    skills: ["SolidWorks", "Thermodynamics"],
    projects: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Automotive Thermal System",
        description: "Designed improvement system for vehicle cooling.",
      },
    ],
    languages: [{ _id: new mongoose.Types.ObjectId(), language: "English", proficiency: "Fluent" }],
    experience: [
      {
        _id: new mongoose.Types.ObjectId(),
        company: "Bosch India",
        description: "Working on mechanical design for automotive components.",
      },
    ],
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: approvedById,
    currentPosition: "Mechanical Design Engineer",
    company: "Bosch India",
    gender: "Female",
    profilePicture: profilePictureUrl,
    resumeUrl,
  },
];
async function start() {
    try {
      console.log("Connecting to DB…");
      await mongoose.connect(MONGODB_URI);
      console.log("DB Connected!");
  
      for (const alum of alumni) {
        const hashedPassword = await bcrypt.hash(alum.password, 10);
  
        // Prevent MongoDB from trying to update _id
        const { _id, ...rest } = alum;
  
        await User.updateOne(
          { email: alum.email },
          {
            $set: {
              ...rest,
              password: hashedPassword,
              approvalStatus: "approved",
            },
            $setOnInsert: { _id }, // _id only used when inserting new document
          },
          { upsert: true }
        );
      }
  
      console.log("✅ Alumni inserted successfully!");
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      mongoose.disconnect();
    }
  }
  
  start();
  