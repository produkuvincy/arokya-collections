// Import mongoose to define the User schema and interact with MongoDB
import mongoose from "mongoose";

// Define the structure (schema) of a User document in MongoDB
const userSchema = new mongoose.Schema({
  // User's full name
  name: { 
    type: String, 
    required: true 
  },

  // Unique email address used for login
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  // Encrypted (hashed) password, stored securely
  password: { 
    type: String, 
    required: true 
  },

  // Optional list of past orders for the user
  orders: [
    {
      orderId: String,      // Razorpay or custom order ID
      amount: Number,       // Total amount paid
      currency: String,     // Usually "INR"
      status: String,       // e.g., "paid", "shipped"
      createdAt: { 
        type: Date, 
        default: Date.now   // Automatically set the order date
      }
    }
  ],
});

// Create and export the User model so it can be used in server.js
export default mongoose.model("User", userSchema);
