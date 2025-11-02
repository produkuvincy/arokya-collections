import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Razorpay from "razorpay";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import { fileURLToPath } from "url";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ------------------------------
// Paths
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "frontend")));

// ------------------------------
// MongoDB Connection
// ------------------------------
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------------------
// Razorpay Config
// ------------------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------------------
// JWT Middleware
// ------------------------------
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// ------------------------------
// Products Route
// ------------------------------
const products = [
  {
    id: "1",
    name: "Gold Necklace",
    description: "Elegant 22K gold necklace perfect for occasions.",
    price: 35999,
    image:
      "https://arokya-collections.s3.ap-south-1.amazonaws.com/products/gold-necklace.png",
  },
  {
    id: "2",
    name: "Silver Earrings",
    description: "Beautiful handcrafted silver earrings.",
    price: 2499,
    image:
      "https://arokya-collections.s3.ap-south-1.amazonaws.com/products/silver-earrings.png",
  },
  {
    id: "3",
    name: "Diamond Ring",
    description: "Sparkling diamond ring set in platinum.",
    price: 89999,
    image:
      "https://arokya-collections.s3.ap-south-1.amazonaws.com/products/diamond-ring.png",
  },
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

// ------------------------------
// Auth Routes (Signup / Login)
// ------------------------------
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ------------------------------
// Razorpay Order Creation
// ------------------------------
app.post("/api/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // amount in paise
      currency: "INR",
      receipt: "order_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json({ id: order.id, amount: order.amount, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ------------------------------
// Orders (Mock)
// ------------------------------
app.get("/api/orders", async (req, res) => {
  // In a real app, you'd fetch from DB
  const mockOrders = [
    {
      orderId: "order_123",
      amount: 12000,
      status: "paid",
    },
    {
      orderId: "order_456",
      amount: 5500,
      status: "shipped",
    },
  ];
  res.json(mockOrders);
});

// ------------------------------
// Serve Frontend (Render)
// ------------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ------------------------------
// Start Server
// ------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
