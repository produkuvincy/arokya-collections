import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();
const app = express();

// --- Basic setup ---
app.use(express.json());
app.use(cors());

// --- MongoDB ---
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// --- Razorpay ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Auth Middleware ---
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// --- Auth Routes ---
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// --- Razorpay Checkout Order Route ---
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
});

app.get("/api/orders", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.orders || []);
});

// --- Static Products (Frontend Fetches These) ---
app.get("/api/products", (req, res) => {
  res.json([
    {
      _id: "1",
      name: "Gold Necklace",
      price: 1500,
      image: "https://i.imgur.com/T5LzVqf.png",
    },
    {
      _id: "2",
      name: "Silver Bracelet",
      price: 900,
      image: "https://i.imgur.com/qe5k5ez.png",
    },
    {
      _id: "3",
      name: "Diamond Ring",
      price: 2500,
      image: "https://i.imgur.com/7uO3B5I.png",
    },
    {
      _id: "4",
      name: "Pearl Earrings",
      price: 1200,
      image: "https://i.imgur.com/MmWrVdU.png",
    },
  ]);
});

// --- Serve Frontend (Render Static Folder) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "frontend")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
