import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Sample products
const PRODUCTS = [
  {
    id: 1,
    name: "Gold Earrings",
    price: 1200,
    image: "https://i.imgur.com/7P8yZzI.png",
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

// ✅ API route to get products
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

// ✅ Razorpay order route
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ✅ Serve index.html for all routes
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
