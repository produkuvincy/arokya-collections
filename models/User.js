// models/User.js
// Simple User schema with hashed password and a list of saved orders.

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: String,
    amount: Number,
    currency: String,
    status: { type: String, default: "paid" }, // you can change this if you add webhooks
  },
  { _id: false, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    orders: [orderSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
