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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Dummy products API
app.get("/api/products", (req, res) => {
  res.json([
    { _id: "1", name: "Gold Necklace", price: 2500, image: "https://via.placeholder.com/150" },
    { _id: "2", name: "Silver Bracelet", price: 1200, image: "https://via.placeholder.com/150" },
  ]);
});

// ✅ Razorpay order API
app.post("/api/orders/create", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Debug: confirm Razorpay is initialized with a valid key
    console.log("🟢 Creating order with Razorpay key:", process.env.RAZORPAY_KEY_ID);

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Debug success
    console.log("✅ Razorpay order created successfully:", order);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // Send key to frontend
    });
  } catch (err) {
    console.error("❌ Error creating Razorpay order:");
    console.error("Full error object:", JSON.stringify(err, null, 2));

    // Handle missing keys separately for clarity
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("⚠️ Missing Razorpay credentials in environment variables!");
      return res.status(500).json({
        error: "Server missing Razorpay credentials",
      });
    }

    // Specific HTTP errors from Razorpay SDK
    if (err.statusCode) {
      console.error("🔴 Razorpay API error:", err.error || err.message);
      return res.status(err.statusCode).json({
        error: "Razorpay API Error",
        details: err.error || err.message,
      });
    }

    // Generic server fallback
    res.status(500).json({
      error: "Failed to create Razorpay order",
      details: err.message || "Unknown error",
    });
  }
});

// ✅ Fallback for all unknown routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
