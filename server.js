import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import User from "./models/User.js"; // Import user schema

// Load environment variables from .env file
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 4000;

// Resolve directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); // Serve static frontend

/* ======================================================
   🔹 MONGODB CONNECTION
====================================================== */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ======================================================
   🔹 RAZORPAY INSTANCE
====================================================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ======================================================
   🔹 AUTH MIDDLEWARE (JWT VERIFICATION)
====================================================== */
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token." });
    req.user = user;
    next();
  });
}

/* ======================================================
   🔹 USER SIGNUP
====================================================== */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ message: "Signup successful. Please log in." });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Server error during signup." });
  }
});

/* ======================================================
   🔹 USER LOGIN
====================================================== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    // Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ message: "Login successful", token, name: user.name });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

/* ======================================================
   🔹 CREATE RAZORPAY ORDER
====================================================== */
app.post("/create-order", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert INR to paise
      currency: "INR",
      receipt: "order_rcpt_" + Date.now(),
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Error creating Razorpay order:", err);
    res.status(500).json({ message: "Error creating order." });
  }
});

/* ======================================================
   🔹 SAVE ORDER AFTER PAYMENT SUCCESS
====================================================== */
app.post("/save-order", authenticateToken, async (req, res) => {
  try {
    const { orderId, amount, currency, status } = req.body;

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Save order details
    user.orders.push({ orderId, amount, currency, status });
    await user.save();

    res.json({ message: "Order saved successfully!" });
  } catch (err) {
    console.error("❌ Error saving order:", err);
    res.status(500).json({ message: "Error saving order." });
  }
});

/* ======================================================
   🔹 FETCH USER ORDERS
====================================================== */
app.get("/orders", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json(user.orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders." });
  }
});

/* ======================================================
   🔹 FETCH PRODUCTS (Demo Data or from MongoDB)
====================================================== */
app.get("/api/products", async (req, res) => {
  try {
    // Temporary static product list
    const products = [
      {
        id: 1,
        name: "Gold-Plated Necklace",
        price: 1499,
        image: "images/necklace.jpg",
      },
      {
        id: 2,
        name: "Silver Bracelet",
        price: 799,
        image: "images/bracelet.jpg",
      },
      {
        id: 3,
        name: "Diamond Ring",
        price: 2499,
        image: "images/ring.jpg",
      },
      {
        id: 4,
        name: "Pearl Earrings",
        price: 999,
        image: "images/earrings.jpg",
      },
    ];

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

/* ======================================================
   🔹 SERVE FRONTEND (for Render/Production)
====================================================== */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/index.html"));
});

/* ======================================================
   🔹 START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
