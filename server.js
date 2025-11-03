import express from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// --- Setup paths for serving frontend ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Razorpay setup ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- API ROUTES ---

// ✅ PRODUCTS API
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

// ✅ CREATE ORDER API (for Razorpay checkout)
app.post("/api/orders/create", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // 👈 send key to frontend
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});


// --- Serve frontend files (index.html, script.js, etc.) ---
app.use(express.static(path.join(__dirname, "frontend")));

// Fallback route for SPA (React-style) — optional but safe
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
);

// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
