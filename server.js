// ------------------------------------------
// server.js – Arokya Collections Backend
// ------------------------------------------

// Import required packages
import express from "express";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Initialize environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware setup
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// ----------------------
// MongoDB CONNECTION
// ----------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ----------------------
// FILE PATH CONFIG (for serving frontend)
// ----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "frontend"))); // Serve static frontend files

// ----------------------
// MODELS
// ----------------------
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  orders: [
    {
      orderId: String,
      amount: Number,
      currency: String,
      status: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);

// ----------------------
// RAZORPAY CONFIG
// ----------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ----------------------
// PRODUCT DATA (temporary mock data)
// ----------------------
const products = [
  {
    id: "p1",
    name: "Gold Necklace",
    price: 8999,
    image: "/images/gold-necklace.png",
  },
  {
    id: "p2",
    name: "Diamond Earrings",
    price: 4999,
    image: "/images/diamond-earrings.png",
  },
  {
    id: "p3",
    name: "Silver Bracelet",
    price: 2999,
    image: "/images/silver-bracelet.png",
  },
];

// ----------------------
// API ROUTES
// ----------------------

// ✅ Fetch all products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// ✅ Create Razorpay Order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: "receipt_" + Math.floor(Math.random() * 10000),
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ✅ USER SIGNUP
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.json({ ok: false, error: "Email already registered" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ name, email, password: hashed });
    await user.save();

    res.json({ ok: true, message: "User created successfully" });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ ok: false, error: "Server error during signup" });
  }
});

// ✅ USER LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: false, error: "User not found" });

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ ok: false, error: "Incorrect password" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      ok: true,
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ ok: false, error: "Server error during login" });
  }
});

// ✅ MIDDLEWARE – Authenticate JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
}

// ✅ USER ORDERS (Protected Route)
app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.orders);
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ error: "Server error fetching orders" });
  }
});

// ----------------------
// FRONTEND SERVING (for Render deployment)
// ----------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
