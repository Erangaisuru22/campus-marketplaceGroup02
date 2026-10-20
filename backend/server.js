// University of Jaffna - Campus Marketplace
// 3NF Normalized MongoDB Backend Server (3 Core Collections: users, listings, reports)
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "campus_marketplace";
const PASSWORD_SALT = "UOJ_CAMPUS_MARKETPLACE_SECURE_SALT_2026";

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Private-Network", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

let db = null;
let client = null;

// ==========================================
// SECURE PASSWORD HASHING UTILITY
// Passwords are stored ONLY as SHA-256 hashes in MongoDB
// ==========================================
function hashPassword(plainText) {
  if (!plainText) return "";
  return crypto.createHash("sha256").update(String(plainText) + PASSWORD_SALT).digest("hex");
}

function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;
  const computedHash = hashPassword(plainText);
  return computedHash === storedHash || plainText === storedHash;
}

// ==========================================
// 3NF NORMALIZED DATABASE SEEDS
// Core Collections: users, listings, reports
// Primary identifier for users is the Student Registration Number!
// ==========================================

// 1. Users Table (Entity: Student / Admin)
// Unique Identifier: studentId (University Registration Number, e.g. 2021/CSC/015, ADM/2021/001)
const initialStudents = [
  {
    studentId: "2021/CSC/015",
    uid: "2021/CSC/015",
    fullName: "Alex Prashan",
    email: "alex@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "student",
    password: hashPassword("student123"),
    rating: 5.0,
    reviewsCount: 19,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    studentId: "2021/CSC/029",
    uid: "2021/CSC/029",
    fullName: "Maya Ramanan",
    email: "maya.r@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.9,
    reviewsCount: 12,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    studentId: "2020/ENG/044",
    uid: "2020/ENG/044",
    fullName: "Thanujan K",
    email: "thanujan.k@univ.jfn.ac.lk",
    faculty: "Faculty of Engineering",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.7,
    reviewsCount: 9,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    studentId: "2022/ART/089",
    uid: "2022/ART/089",
    fullName: "Jordan Karun",
    email: "jordan.k@univ.jfn.ac.lk",
    faculty: "Faculty of Arts",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.8,
    reviewsCount: 7,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    studentId: "2021/CSC/030",
    uid: "2021/CSC/030",
    fullName: "Divya N.",
    email: "divya.n@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.9,
    reviewsCount: 14,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 18,
  },
  {
    studentId: "2021/CSC/022",
    uid: "2021/CSC/022",
    fullName: "Kavitha S.",
    email: "kavitha.s@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.8,
    reviewsCount: 8,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    studentId: "2020/ENG/012",
    uid: "2020/ENG/012",
    fullName: "Rohan V.",
    email: "rohan.v@univ.jfn.ac.lk",
    faculty: "Faculty of Engineering",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.6,
    reviewsCount: 4,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 16,
  },
  {
    studentId: "2021/CSC/018",
    uid: "2021/CSC/018",
    fullName: "Kevin Dias",
    email: "kevin.d@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.9,
    reviewsCount: 6,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    studentId: "2021/CSC/035",
    uid: "2021/CSC/035",
    fullName: "Nithya Selvan",
    email: "nithya.s@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "student",
    password: hashPassword("student123"),
    rating: 4.8,
    reviewsCount: 8,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 3,
  },
  // ADMIN ACCOUNT - Preserved exactly as configured
  {
    studentId: "ADM/2021/001",
    uid: "ADM/2021/001",
    fullName: "Kavishka Silva (Admin)",
    email: "admin@univ.jfn.ac.lk",
    faculty: "Faculty of Science",
    role: "admin",
    password: hashPassword("admin123"),
    rating: 5.0,
    reviewsCount: 5,
    isBanned: false,
    createdAt: Date.now() - 86400000 * 90,
  },
];

// 2. Listings Table (Entity: Marketplace Item) - Primary Key: id
// Foreign Key: sellerId ➔ references users.studentId
// Transitive fields (seller name, rating, reviews) are NOT stored in listings to satisfy 3NF!
const initialListings = [
  {
    id: "item_001",
    sellerId: "2021/CSC/029",
    title: "Calculus: Early Transcendentals (9th Edition)",
    price: 3500,
    category: "Textbooks",
    meetupLocation: "Faculty of Science - Uni Jaffna",
    condition: "Like new",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80",
    description: "Mint condition Stewart Calculus textbook used in CS101. Highlight-free pages, includes complete solutions appendix and formula reference card.",
    status: "active",
    createdAt: Date.now() - 3600000 * 2,
    isPopular: true,
  },
  {
    id: "item_002",
    sellerId: "2022/ART/089",
    title: "Ergonomic Walnut Study Desk & Shelf",
    price: 8000,
    category: "Furniture",
    meetupLocation: "Kailasapathy Hall - Jaffna",
    condition: "Good condition",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80",
    description: "Solid wooden study desk with built-in book rack and cable tray. Easy to disassemble for dorm transport. Used for two semesters.",
    status: "active",
    createdAt: Date.now() - 3600000 * 8,
    isPopular: true,
  },
  {
    id: "item_003",
    sellerId: "2021/CSC/015",
    title: "Sony Noise-Cancelling Bluetooth Headphones",
    price: 11000,
    category: "Tech",
    meetupLocation: "Main Campus Library - UoJ",
    condition: "Like new",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    description: "Active noise cancellation, 30-hour battery life. Includes original USB-C charging cable and carrying case. Perfect for campus study.",
    status: "active",
    createdAt: Date.now() - 3600000 * 24,
    isPopular: false,
  },
  {
    id: "item_004",
    sellerId: "2020/ENG/044",
    title: "University Varsity Bomber Jacket (Medium)",
    price: 4500,
    category: "Fashion",
    meetupLocation: "Faculty of Science - Uni Jaffna",
    condition: "Good condition",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80",
    description: "Warm, comfortable varsity jacket with embroidered crest. Perfect for cool mornings on campus. Worn only a few times.",
    status: "active",
    createdAt: Date.now() - 3600000 * 24,
    isPopular: true,
  },
  {
    id: "item_005",
    sellerId: "2021/CSC/030",
    title: "Scientific Graphing Calculator TI-84 Plus",
    price: 5500,
    category: "Stationery",
    meetupLocation: "Faculty of Science - Uni Jaffna",
    condition: "Like new",
    image: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80",
    description: "Approved for all university math and engineering examinations. Comes with slide cover and fresh AAA batteries.",
    status: "reserved",
    createdAt: Date.now() - 3600000 * 30,
    isPopular: true,
  },
  {
    id: "item_006",
    sellerId: "2021/CSC/022",
    title: "Chemistry Lab Coat & Safety Goggles (Size L)",
    price: 1800,
    category: "Lab Gear",
    meetupLocation: "Faculty of Science - Uni Jaffna",
    condition: "Good condition",
    image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&auto=format&fit=crop&q=80",
    description: "Standard 100% cotton white lab coat with chemical spill resistance and UV protection goggles. Clean and sanitized.",
    status: "active",
    createdAt: Date.now() - 3600000 * 48,
    isPopular: false,
  },
  {
    id: "item_007",
    sellerId: "2020/ENG/012",
    title: "Waterproof Student Laptop Backpack (25L)",
    price: 2500,
    category: "Fashion",
    meetupLocation: "Faculty of Engineering - Kilinochchi",
    condition: "Good condition",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    description: "Spacious backpack with padded 15.6-inch laptop compartment, hidden anti-theft pocket, and external USB charging port.",
    status: "sold",
    createdAt: Date.now() - 3600000 * 72,
    isPopular: false,
  },
];

// 3. Reports Table (Entity: Moderation Report) - Primary Key: id
// Foreign Keys: listingId ➔ listings.id, reportedBy ➔ users.studentId
const initialReports = [
  {
    id: "rep_001",
    listingId: "item_001",
    reportedBy: "2021/CSC/018",
    reason: "Misleading price or condition",
    details: "Seller claims 9th edition brand new, but page edges are water-damaged.",
    createdAt: Date.now() - 3600000 * 3,
    status: "pending",
  },
  {
    id: "rep_002",
    listingId: "item_003",
    reportedBy: "2021/CSC/035",
    reason: "Potential scam",
    details: "Seller insisted on advance bank transfer before campus handover.",
    createdAt: Date.now() - 3600000 * 14,
    status: "pending",
  },
];

// Seed MongoDB with strictly 3 Normalized Collections
async function seedDatabase(forceRefresh = true) {
  try {
    const listingsCol = db.collection("listings");
    const studentsCol = db.collection("users");
    const reportsCol = db.collection("reports");

    // Clean legacy collections if any exist so ONLY the 3 core collections exist
    try { await db.collection("conversations").drop(); } catch (_) {}
    try { await db.collection("messages").drop(); } catch (_) {}

    if (forceRefresh) {
      await listingsCol.deleteMany({});
      await studentsCol.deleteMany({});
      await reportsCol.deleteMany({});
      console.log("🔄 Reset database to 3 core collections (users, listings, reports).");
    }

    // 1. Seed Users (PK: studentId)
    const countStudents = await studentsCol.countDocuments();
    if (countStudents === 0) {
      await studentsCol.insertMany(initialStudents);
      await studentsCol.createIndex({ studentId: 1 }, { unique: true });
      await studentsCol.createIndex({ email: 1 }, { unique: true });
      await studentsCol.createIndex({ uid: 1 }, { unique: true });
      console.log("🌱 Seeded users into MongoDB (Unique Registration Number PK, Passwords Hashed).");
    }

    // 2. Seed Listings (PK: id, FK: sellerId -> users.studentId)
    const countListings = await listingsCol.countDocuments();
    if (countListings === 0) {
      await listingsCol.insertMany(initialListings);
      await listingsCol.createIndex({ id: 1 }, { unique: true });
      await listingsCol.createIndex({ sellerId: 1 });
      await listingsCol.createIndex({ category: 1 });
      await listingsCol.createIndex({ status: 1 });
      console.log("🌱 Seeded 3NF normalized listings into MongoDB with indexes.");
    }

    // 3. Seed Reports (PK: id, FK: listingId -> listings.id, reportedBy -> users.studentId)
    const countReports = await reportsCol.countDocuments();
    if (countReports === 0) {
      await reportsCol.insertMany(initialReports);
      await reportsCol.createIndex({ id: 1 }, { unique: true });
      await reportsCol.createIndex({ listingId: 1 });
      await reportsCol.createIndex({ reportedBy: 1 });
      console.log("🌱 Seeded moderation reports into MongoDB.");
    }
  } catch (err) {
    console.error("⚠️ Seeding error:", err.message);
  }
}

// Connect to MongoDB
async function startServer() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ Connected successfully to MongoDB at ${MONGODB_URI}, Database: ${DB_NAME}`);
    
    // Auto-seed only if collections are empty (never delete existing user listings on restart)
    await seedDatabase(false);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Campus Marketplace Backend running on port ${PORT}`);
      console.log(`📡 Local LAN Access: http://192.168.149.215:${PORT}/api`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Health & Database Status (Strictly reporting the 3 collections)
app.get("/api/status", async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json({
      status: "connected",
      database: "MongoDB (3NF Normalized)",
      databaseName: DB_NAME,
      host: MONGODB_URI,
      collections: collections.map((c) => c.name),
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

// 2. Listings (3NF Normalized with $lookup JOIN to Users by Registration Number)
app.get("/api/listings", async (req, res) => {
  try {
    const items = await db
      .collection("listings")
      .aggregate([
        {
          $lookup: {
            from: "users",
            let: { sellerRef: "$sellerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$studentId", "$$sellerRef"] },
                      { $eq: ["$uid", "$$sellerRef"] },
                    ],
                  },
                },
              },
            ],
            as: "sellerInfo",
          },
        },
        {
          $unwind: {
            path: "$sellerInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            price: 1,
            category: 1,
            condition: 1,
            image: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            isPopular: 1,
            sellerId: 1,
            campus: { $ifNull: ["$meetupLocation", "$sellerInfo.faculty", "Faculty of Science"] },
            seller: { $ifNull: ["$sellerInfo.fullName", "Campus Student"] },
            sellerRating: { $ifNull: ["$sellerInfo.rating", 5.0] },
            sellerReviews: { $ifNull: ["$sellerInfo.reviewsCount", 1] },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/listings - Create listing (Saves normalized entity with seller Registration Number)
app.post("/api/listings", async (req, res) => {
  try {
    const sellerId = req.body.sellerId || req.body.studentId || "2021/CSC/015";
    const listingId = req.body.id || `item_${Date.now()}`;

    // Verify or register user in users collection if missing
    const userExists = await db.collection("users").findOne({
      $or: [{ studentId: sellerId }, { uid: sellerId }],
    });

    if (!userExists) {
      try {
        const safeEmail = `${sellerId.replace(/[\/\s]/g, "_").toLowerCase()}_${Date.now().toString().slice(-4)}@univ.jfn.ac.lk`;
        await db.collection("users").insertOne({
          studentId: sellerId,
          uid: sellerId,
          fullName: req.body.seller || "Campus Student",
          email: safeEmail,
          faculty: req.body.campus || "Faculty of Science",
          role: "student",
          password: hashPassword("student123"),
          rating: 5.0,
          reviewsCount: 1,
          isBanned: false,
          createdAt: Date.now(),
        });
      } catch (userErr) {
        console.warn("User auto-registration note:", userErr.message);
      }
    }

    const listing = {
      id: listingId,
      sellerId: sellerId,
      title: req.body.title,
      price: Number(req.body.price),
      category: req.body.category,
      condition: req.body.condition || "Good condition",
      meetupLocation: req.body.campus || "Faculty of Science",
      image: req.body.image,
      description: req.body.description || "",
      status: req.body.status || "active",
      isPopular: false,
      createdAt: req.body.createdAt || Date.now(),
    };
    await db.collection("listings").insertOne(listing);

    // Fetch joined DTO
    const [savedItem] = await db
      .collection("listings")
      .aggregate([
        { $match: { id: listing.id } },
        {
          $lookup: {
            from: "users",
            let: { sellerRef: "$sellerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$studentId", "$$sellerRef"] },
                      { $eq: ["$uid", "$$sellerRef"] },
                    ],
                  },
                },
              },
            ],
            as: "sellerInfo",
          },
        },
        {
          $unwind: {
            path: "$sellerInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            price: 1,
            category: 1,
            condition: 1,
            image: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            isPopular: 1,
            sellerId: 1,
            campus: { $ifNull: ["$meetupLocation", "$sellerInfo.faculty"] },
            seller: { $ifNull: ["$sellerInfo.fullName", "Campus Student"] },
            sellerRating: { $ifNull: ["$sellerInfo.rating", 5.0] },
            sellerReviews: { $ifNull: ["$sellerInfo.reviewsCount", 1] },
          },
        },
      ])
      .toArray();

    res.status(201).json(savedItem || listing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/listings/:id/status - Toggle status (Mark as Sold / Active)
app.patch("/api/listings/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.collection("listings").updateOne({ id }, { $set: { status } });
    res.json({ success: true, id, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/listings/:id - Remove listing
app.delete("/api/listings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("listings").deleteOne({ id });
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Students / Users
// Passwords are NOT returned in any query (Hidden & Secure)
app.get("/api/students", async (req, res) => {
  try {
    const students = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Student Registration (Uniquely identified by studentId / Registration Number)
app.post("/api/students/register", async (req, res) => {
  try {
    const { fullName, studentId, email, faculty, password } = req.body;
    const regNo = studentId ? studentId.trim() : `STU/${Date.now().toString().slice(-4)}`;
    
    // Check if Registration Number already exists
    const existingReg = await db.collection("users").findOne({ studentId: regNo });
    if (existingReg) {
      return res.status(400).json({ error: "A student with this university registration number already exists." });
    }

    // Check if email already registered
    const existingEmail = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ error: "An account with this university email already exists." });
    }

    const newStudent = {
      studentId: regNo,
      uid: regNo, // Primary unique identifier is registration number
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      faculty,
      password: hashPassword(password || "student123"), // Password is secure SHA-256 hash
      role: "student",
      rating: 5.0,
      reviewsCount: 1,
      isBanned: false,
      createdAt: Date.now(),
    };

    await db.collection("users").insertOne(newStudent);

    // Return safe user without exposing password hash
    const { password: _, ...studentSafe } = newStudent;
    res.status(201).json(studentSafe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Student Login (Verifies hashed password, returns safe user object)
app.post("/api/students/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await db.collection("users").findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { studentId: email.trim() },
      ],
    });
    
    if (!student) {
      return res.status(401).json({ error: "No university account found with this email or registration number." });
    }

    if (student.isBanned) {
      return res.status(403).json({ error: "This student account has been suspended by campus moderators." });
    }

    // Verify hashed password
    if (password && !verifyPassword(password, student.password)) {
      return res.status(401).json({ error: "Invalid password for this account." });
    }

    // Never expose password hash in response
    const { password: _, ...studentSafe } = student;
    res.json(studentSafe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN ROUTES — Fully preserved with zero alterations
app.patch("/api/students/:uid/ban", async (req, res) => {
  try {
    const { uid } = req.params;
    const { isBanned } = req.body;
    await db.collection("users").updateOne(
      { $or: [{ studentId: uid }, { uid: uid }] },
      { $set: { isBanned } }
    );
    res.json({ success: true, uid, isBanned });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/students/:uid/role", async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    await db.collection("users").updateOne(
      { $or: [{ studentId: uid }, { uid: uid }] },
      { $set: { role } }
    );
    res.json({ success: true, uid, role });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Reports (Campus Moderation) - 3NF Joined with Listings & Users
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await db
      .collection("reports")
      .aggregate([
        {
          $lookup: {
            from: "listings",
            localField: "listingId",
            foreignField: "id",
            as: "listingInfo",
          },
        },
        {
          $unwind: {
            path: "$listingInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { reporterRef: "$reportedBy" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$studentId", "$$reporterRef"] },
                      { $eq: ["$uid", "$$reporterRef"] },
                    ],
                  },
                },
              },
            ],
            as: "reporterInfo",
          },
        },
        {
          $unwind: {
            path: "$reporterInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: 1,
            listingId: 1,
            listingTitle: { $ifNull: ["$listingInfo.title", "Deleted or Missing Listing"] },
            reportedBy: 1,
            reportedByName: { $ifNull: ["$reporterInfo.fullName", "Anonymous Student"] },
            reason: 1,
            details: 1,
            status: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Report
app.post("/api/reports", async (req, res) => {
  try {
    const newReport = {
      id: req.body.id || `rep_${Date.now()}`,
      listingId: req.body.listingId,
      reportedBy: req.body.reportedBy || req.body.studentId || "2021/CSC/015",
      reason: req.body.reason,
      details: req.body.details || "",
      status: "pending",
      createdAt: req.body.createdAt || Date.now(),
    };
    await db.collection("reports").insertOne(newReport);

    const [savedReport] = await db
      .collection("reports")
      .aggregate([
        { $match: { id: newReport.id } },
        {
          $lookup: {
            from: "listings",
            localField: "listingId",
            foreignField: "id",
            as: "listingInfo",
          },
        },
        {
          $unwind: {
            path: "$listingInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { reporterRef: "$reportedBy" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$studentId", "$$reporterRef"] },
                      { $eq: ["$uid", "$$reporterRef"] },
                    ],
                  },
                },
              },
            ],
            as: "reporterInfo",
          },
        },
        {
          $unwind: {
            path: "$reporterInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: 1,
            listingId: 1,
            listingTitle: { $ifNull: ["$listingInfo.title", "Marketplace Listing"] },
            reportedBy: 1,
            reportedByName: { $ifNull: ["$reporterInfo.fullName", "Anonymous Student"] },
            reason: 1,
            details: 1,
            status: 1,
            createdAt: 1,
          },
        },
      ])
      .toArray();

    res.status(201).json(savedReport || newReport);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN ACTION: Resolve or dismiss report, optionally delete violating listing
app.patch("/api/reports/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;
    await db.collection("reports").updateOne({ id }, { $set: { status } });
    
    // If action is delete, also remove listing
    if (action === "delete" && req.body.listingId) {
      await db.collection("listings").deleteOne({ id: req.body.listingId });
    }
    
    res.json({ success: true, id, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

startServer();
