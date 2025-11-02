// ----------------------------
// GLOBAL VARIABLES
// ----------------------------
let cart = [];
let currentUser = null;

// API base URL (same domain for Render)
const API_BASE = "";

// DOM elements
const productsContainer = document.getElementById("products");
const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartPopup");
const cartItemsList = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const ordersBtn = document.getElementById("ordersBtn");
const mainContent = document.getElementById("main-content");
const ordersSection = document.getElementById("ordersSection");

// ----------------------------
// INITIALIZATION
// ----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  loadProducts();
  checkLoginState();
});

// ----------------------------
// PRODUCTS SECTION
// ----------------------------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();
    renderProducts(products);
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

function renderProducts(products) {
  productsContainer.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "product-grid";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>
      <button onclick="addToCart('${p.id}', '${p.name}', ${p.price})">Add to Cart</button>
    `;
    grid.appendChild(card);
  });

  productsContainer.appendChild(grid);
}

// ----------------------------
// CART FUNCTIONS
// ----------------------------
function addToCart(id, name, price) {
  const item = cart.find((it) => it.id === id);
  if (item) item.qty++;
  else cart.push({ id, name, price, qty: 1 });
  updateCartCount();
}

function updateCartCount() {
  cartBtn.textContent = `Cart (${cart.reduce((sum, i) => sum + i.qty, 0)})`;
}

cartBtn.onclick = () => {
  renderCart();
  cartModal.classList.remove("hidden");
};

function renderCart() {
  cartItemsList.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ₹${item.price} x ${item.qty}`;
    cartItemsList.appendChild(li);
  });
}

closeCartBtn.onclick = () => {
  cartModal.classList.add("hidden");
};

// ----------------------------
// CHECKOUT WITH RAZORPAY
// ----------------------------
checkoutBtn.onclick = async () => {
  if (cart.length === 0) return alert("Your cart is empty!");

  const amount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const res = await fetch(`${API_BASE}/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  const order = await res.json();

  const options = {
    key: order.key,
    amount: order.amount,
    currency: "INR",
    name: "Arokya Collections",
    description: "Jewelry Purchase",
    order_id: order.id,
    handler: async function (response) {
      alert("✅ Payment Successful! " + response.razorpay_payment_id);
      cart = [];
      updateCartCount();
      cartModal.classList.add("hidden");
    },
    theme: { color: "#d63384" },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};

// ----------------------------
// AUTHENTICATION SECTION
// ----------------------------
signupBtn.onclick = () => renderAuthForm("signup");
loginBtn.onclick = () => renderAuthForm("login");

function renderAuthForm(type) {
  mainContent.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h2>${type === "signup" ? "Create Account" : "Login"}</h2>
        <input id="auth-name" placeholder="Full Name" ${type === "login" ? "style='display:none;'" : ""}>
        <input id="auth-email" placeholder="Email">
        <input id="auth-password" type="password" placeholder="Password">
        <button onclick="${type === "signup" ? "handleSignup()" : "handleLogin()"}">
          ${type === "signup" ? "Sign Up" : "Login"}
        </button>
        <p>
          ${type === "signup"
            ? 'Already have an account? <a href="#" onclick="renderAuthForm(\'login\')">Login</a>'
            : 'New user? <a href="#" onclick="renderAuthForm(\'signup\')">Sign Up</a>'}
        </p>
      </div>
    </div>
  `;
}

async function handleSignup() {
  const name = document.getElementById("auth-name").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();

  const res = await fetch(`${API_BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (data.ok) {
    alert("Signup successful! Please login.");
    renderAuthForm("login");
  } else {
    alert("Signup failed: " + (data.error || "Unknown error"));
  }
}

async function handleLogin() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();

  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.ok && data.token) {
    localStorage.setItem("token", data.token);
    currentUser = data.user;
    updateUIAfterLogin();
  } else {
    alert("Login failed: " + (data.error || "Invalid credentials"));
  }
}

function updateUIAfterLogin() {
  signupBtn.style.display = "none";
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  ordersBtn.style.display = "inline-block";
  mainContent.innerHTML = "<h2>Welcome back, " + currentUser.name + "!</h2>";
}

logoutBtn.onclick = () => {
  localStorage.removeItem("token");
  currentUser = null;
  signupBtn.style.display = "inline-block";
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  ordersBtn.style.display = "none";
  mainContent.innerHTML = "";
  loadProducts();
};

function checkLoginState() {
  const token = localStorage.getItem("token");
  if (token) {
    // Normally verify with backend, but here we assume valid
    updateUIAfterLogin();
  }
}

// ----------------------------
// ORDERS SECTION
// ----------------------------
ordersBtn.onclick = async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please login to view your orders.");

  const res = await fetch(`${API_BASE}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const orders = await res.json();
  renderOrders(orders);
};

function renderOrders(orders) {
  mainContent.innerHTML = "<h2>Your Orders</h2>";

  if (!orders.length) {
    mainContent.innerHTML += "<p>No orders yet.</p>";
    return;
  }

  const list = document.createElement("ul");
  orders.forEach((o) => {
    const li = document.createElement("li");
    li.textContent = `Order ${o.orderId} - ₹${o.amount / 100} (${o.status})`;
    list.appendChild(li);
  });
  mainContent.appendChild(list);
}
