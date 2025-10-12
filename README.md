# Arokya Collections 💎

A simple jewelry e-commerce site (earrings, bangles, neckpieces, bracelets) built with HTML, JS, and Express.

## 🚀 Deployment (Render)

1. Push this folder to a GitHub repository.
2. On [Render.com](https://render.com):
   - Create **New Web Service**
   - Connect your GitHub repo
   - **Root Directory:** (leave empty)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add Environment Variables:
   ```
   PORT=4000
   RAZORPAY_KEY_ID=rzp_live_your_key_here
   RAZORPAY_KEY_SECRET=your_secret_here
   ```
4. Deploy! Render will serve both frontend & backend under one URL.

## 🧩 Features

- Add-to-cart system (client-side)
- Razorpay checkout (UPI, credit/debit cards)
- Responsive design
