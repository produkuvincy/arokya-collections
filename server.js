import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// File path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Razorpay configuration
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ Missing Razorpay credentials in environment variables!");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Sample products for display
const PRODUCTS = [
  {
    id: 1,
    name: "Gold Earrings",
    price: 1200,
    image: "https://i.imgur.com/pw3r2sZ.png",
  },
  {
    id: 2,
    name: "Silver Bangles",
    price: 900,
    image: "https://i.imgur.com/N7yDJbU.png",
  },
  {
    id: 3,
    name: "Pearl Neckpiece",
    price: 2500,
    image: "https://i.imgur.com/8tRkC1W.png",
  },
  {
    id: 4,
    name: "Diamond Bracelet",
    price: 3200,
    image: "https://i.imgur.com/f8ZC5TD.png",
  },
];

// ✅ Endpoint to get products
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

// ✅ Create Razorpay order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_" + Date.now(),
    });

    console.log("✅ Razorpay order created:", order.id);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res
      .status(500)
      .json({ error: "Error creating order", details: error.message });
  }
});

// ✅ Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
