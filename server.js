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

// ---------- Serve Frontend ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public"))); // folder with index.html

// ---------- Razorpay Setup ----------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---------- Get Products ----------
app.get("/api/products", (req, res) => {
  res.json([
    { _id: "1", name: "Gold Necklace", price: 2500, image: "https://via.placeholder.com/150" },
    { _id: "2", name: "Silver Bracelet", price: 1200, image: "https://via.placeholder.com/150" },
    { _id: "3", name: "Diamond Ring", price: 5000, image: "https://via.placeholder.com/150" },
    { _id: "4", name: "Pearl Earrings", price: 800, image: "https://via.placeholder.com/150" },
  ]);
});

// ---------- Create Razorpay Order ----------
app.post("/api/orders/create", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // ✅ Send back order + key
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
