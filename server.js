import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// ---------- Setup ----------
app.use(express.json());
app.use(cors());

// ---------- Resolve Paths ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Razorpay Instance ----------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---------- Product Data ----------
const products = [
  {
    _id: "1",
    name: "Gold Necklace",
    price: 2500,
    image: "https://i.imgur.com/9M7L4rL.png",
  },
  {
    _id: "2",
    name: "Silver Earrings",
    price: 1200,
    image: "https://i.imgur.com/6o5D6Hc.png",
  },
  {
    _id: "3",
    name: "Diamond Ring",
    price: 5000,
    image: "https://i.imgur.com/lU9t6yN.png",
  },
  {
    _id: "4",
    name: "Pearl Bracelet",
    price: 1800,
    image: "https://i.imgur.com/3V9g2mZ.png",
  },
];

// ---------- API Routes ----------

// Fetch Products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Create Razorpay Order
app.post("/api/orders/create", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json(order);
  } catch (err) {
    console.error("❌ Error creating order:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// ---------- Serve Frontend ----------
const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));

// For SPA routes or direct access
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
