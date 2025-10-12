import express from 'express';
import Razorpay from 'razorpay';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: 'order_rcptid_' + Date.now(),
    });
    res.json({ id: order.id, amount: order.amount, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating order');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
