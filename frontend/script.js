// --- FRONTEND SCRIPT FOR AROKYA COLLECTIONS ---
// Handles product display, cart logic, user authentication, and Razorpay checkout.

// --- Global State ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let token = localStorage.getItem("token");
const API_URL = window.location.origin;

// --- DOM Elements ---
const main = document.getElementById("main-content");
const cartBtn = document.getElementById("cart-btn");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const ordersBtn = document.getElementById("orders-btn");

// --- Load Products ---
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();

    main.innerHTML = `
      <h2>Featured Products</h2>
      <div class="product-grid">
        ${products
          .map(
            (p) => `
          <div class="product-card">
            <img src="${p.image}" alt="${p.name}" />
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
            <button onclick="addToCart('${p._id}', '${p.name}', ${p.price}, '${p.image}')">Add to Cart</button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p style="color:red;">Failed to load products. Please try again later.</p>`;
  }
}

// --- Add to Cart ---
window.addToCart = function (id, name, price, image) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartButton();
  alert(`${name} added to cart!`);
};

// --- Update Cart Button Count ---
function updateCartButton() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  cartBtn.textContent = `Cart (${count})`;
}

// --- Load Cart Page ---
cartBtn.addEventListener("click", () => {
  main.innerHTML = `
    <h2>Your Cart</h2>
    ${
      cart.length
        ? `<ul class="cart-list">
            ${cart
              .map(
                (item, i) => `
              <li>
                <img src="${item.image}" alt="${item.name}" />
                <span>${item.name} (x${item.qty}) - ₹${item.price * item.qty}</span>
                <button onclick="removeFromCart(${i})">Remove</button>
              </li>
            `
              )
              .join("")}
          </ul>
          <button onclick="checkout()">Checkout</button>`
        : `<p>Your cart is empty.</p>`
    }
  `;
});

// --- Remove Item from Cart ---
window.removeFromCart = function (index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartButton();
  cartBtn.click();
};

// --- Checkout with Razorpay ---
window.checkout = async function () {
  try {
    const amount = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    if (!amount) return alert("Your cart is empty!");

    const res = await fetch(`${API_URL}/api/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    const order = await res.json();

    if (!order.id) throw new Error("Order creation failed");

    const options = {
      key: "<YOUR_RAZORPAY_KEY_ID>",
      amount: order.amount,
      currency: "INR",
      name: "Arokya Collections",
      description: "Jewelry Purchase",
      order_id: order.id,
      handler: function (response) {
        alert("Payment successful!");
        cart = [];
        localStorage.removeItem("cart");
        updateCartButton();
      },
      prefill: {
        name: "Customer",
        email: "customer@example.com",
      },
      theme: { color: "#f06292" },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert("Checkout failed. Please try again.");
  }
};

// --- Login / Signup UI ---
loginBtn.addEventListener("click", () => showAuthForm("login"));
signupBtn.addEventListener("click", () => showAuthForm("signup"));

function showAuthForm(type) {
  main.innerHTML = `
    <h2>${type === "login" ? "Login" : "Sign Up"}</h2>
    <form id="auth-form">
      ${type === "signup" ? '<input type="text" id="name" placeholder="Name" required />' : ""}
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">${type === "login" ? "Login" : "Sign Up"}</button>
    </form>
  `;
  document
    .getElementById("auth-form")
    .addEventListener("submit", (e) => handleAuth(e, type));
}

// --- Handle Login / Signup ---
async function handleAuth(e, type) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const name = type === "signup" ? document.getElementById("name").value : null;

  try {
    const res = await fetch(`${API_URL}/api/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!data.token) throw new Error(data.message || "Failed");

    localStorage.setItem("token", data.token);
    token = data.token;
    updateAuthUI();
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

// --- Orders Page ---
ordersBtn.addEventListener("click", async () => {
  if (!token) return alert("Please login to view your orders.");
  try {
    const res = await fetch(`${API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await res.json();

    main.innerHTML = `
      <h2>Your Orders</h2>
      ${
        orders.length
          ? `<ul>${orders
              .map(
                (o) => `
              <li>
                <strong>Order ID:</strong> ${o.orderId}<br/>
                <strong>Amount:</strong> ₹${o.amount}<br/>
                <strong>Status:</strong> ${o.status}<br/>
                <strong>Date:</strong> ${new Date(o.createdAt).toLocaleString()}
              </li>
            `
              )
              .join("")}</ul>`
          : "<p>No orders found.</p>"
      }
    `;
  } catch (err) {
    alert("Failed to fetch orders.");
  }
});

// --- Update UI on Auth ---
function updateAuthUI() {
  if (token) {
    signupBtn.style.display = "none";
    loginBtn.textContent = "Logout";
    loginBtn.onclick = () => {
      localStorage.removeItem("token");
      token = null;
      signupBtn.style.display = "inline-block";
      loginBtn.textContent = "Login";
      loginBtn.onclick = null;
      loadProducts();
    };
  } else {
    signupBtn.style.display = "inline-block";
    loginBtn.textContent = "Login";
  }
}

// --- Initialize Page ---
updateCartButton();
updateAuthUI();
loadProducts();
