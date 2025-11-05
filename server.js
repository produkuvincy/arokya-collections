// server.js
// Serves frontend, exposes products + Razorpay order creation,
// and adds full JWT auth (signup/login/me) + save/list orders.

import express from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------- Resolve paths and serve frontend ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public"))); // index.html, script.js, etc.

// ---------- Connect MongoDB ----------
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in environment.");
}
mongoose
  .connect(process.env.MONGO_URI, { dbName: "arokya" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => console.error("❌ MongoDB error:", e.message));

// ---------- Razorpay ----------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---------- Helpers ----------
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ---------- Catalog (sample products) ----------
app.get("/api/products", (req, res) => {
  res.json([
    { _id: "1", name: "Gold Necklace", price: 2500, image: "https://via.placeholder.com/160" },
    { _id: "2", name: "Silver Earrings", price: 1200, image: "https://via.placeholder.com/160" },
    { _id: "3", name: "Diamond Ring", price: 5000, image: "https://via.placeholder.com/160" },
    { _id: "4", name: "Pearl Bracelet", price: 1800, image: "https://via.placeholder.com/160" },
  ]);
});

// ---------- Auth ----------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, orders: [] });
    const token = signToken(user._id);
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });
    const token = signToken(user._id);
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/signup", async (req, res) => {
  req.url = "/api/auth/signup";
  app._router.handle(req, res);
});

app.post("/api/login", async (req, res) => {
  req.url = "/api/auth/login";
  app._router.handle(req, res);
});

app.get("/api/me", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email");
  res.json(user);
});

// ---------- Razorpay: create order ----------
app.post("/api/orders/create", async (req, res) => {
  try {
    const { amount } = req.body || {};
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    // Send order + key id to frontend
    res.json({ id: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("❌ Error creating Razorpay order:", JSON.stringify(err, null, 2));
    res.status(502).json({ error: "Razorpay order failed" });
  }
});

// ---------- Orders: save and list ----------
app.post("/api/orders/save", auth, async (req, res) => {
  try {
    const { orderId, amount, currency, status = "paid" } = req.body || {};
    if (!orderId || !amount) return res.status(400).json({ message: "Missing order details" });
    const user = await User.findById(req.userId);
    user.orders.push({ orderId, amount, currency, status });
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Could not save order" });
  }
});

app.get("/api/orders", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("orders");
  res.json(user?.orders || []);
});

// ---------- Fallback to frontend ----------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- Boot ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
