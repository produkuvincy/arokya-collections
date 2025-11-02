import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";

import User from "./models/User.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("✅ MongoDB connected"))
  .catch(err=>console.error(err));

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Auth middleware
const auth = (req,res,next)=>{
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({error:"Unauthorized"});
  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  }catch{res.status(401).json({error:"Invalid token"});}
};

// --------- AUTH ROUTES ---------
app.post("/signup", async(req,res)=>{
  const {name,email,password}=req.body;
  if(!name||!email||!password) return res.status(400).json({error:"Missing fields"});
  const existing = await User.findOne({email});
  if(existing) return res.status(400).json({error:"User already exists"});
  const hashed = await bcrypt.hash(password,10);
  const user = new User({name,email,password:hashed});
  await user.save();
  const token = jwt.sign({id:user._id,email:user.email},JWT_SECRET);
  res.json({message:"User created",token});
});

app.post("/login", async(req,res)=>{
  const {email,password}=req.body;
  if(!email||!password) return res.status(400).json({error:"Missing fields"});
  const user = await User.findOne({email});
  if(!user) return res.status(400).json({error:"User not found"});
  const valid = await bcrypt.compare(password,user.password);
  if(!valid) return res.status(400).json({error:"Invalid password"});
  const token = jwt.sign({id:user._id,email:user.email},JWT_SECRET);
  res.json({message:"Login successful",token});
});

// --------- ORDERS ---------
app.post("/orders", auth, async(req,res)=>{
  const {orderId,amount,currency,status} = req.body;
  if(!orderId||!amount||!currency||!status) return res.status(400).json({error:"Missing fields"});
  const user = await User.findById(req.user.id);
  if(!user) return res.status(404).json({error:"User not found"});
  user.orders.push({orderId,amount,currency,status});
  await user.save();
  res.json({message:"Order saved"});
});

app.get("/orders", auth, async(req,res)=>{
  const user = await User.findById(req.user.id);
  if(!user) return res.status(404).json({error:"User not found"});
  res.json({orders:user.orders});
});

// --------- RAZORPAY ORDER ---------
app.post("/create-order", async(req,res)=>{
  const {amount} = req.body;
  if(!amount || amount<=0) return res.status(400).json({error:"Invalid amount"});
  try{
    const order = await razorpay.orders.create({
      amount: Math.round(amount*100),
      currency:"INR",
      receipt:"order_rcptid_"+Date.now(),
      payment_capture:1
    });
    res.json({id:order.id,amount:order.amount,currency:order.currency,key:process.env.RAZORPAY_KEY_ID});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Razorpay order creation failed"});
  }
});

// Serve frontend
app.get("*",(req,res)=>{res.sendFile(path.join(__dirname,"frontend/index.html"));});

app.listen(PORT,()=>console.log(`✅ Server running on port ${PORT}`));
