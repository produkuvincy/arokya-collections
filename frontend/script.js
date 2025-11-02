// -----------------------------
// Global Elements
// -----------------------------
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const ordersSection = document.getElementById("ordersSection");
const yourCartPopup = document.getElementById("cartPopup");

// -----------------------------
// Helper: Get stored JWT token
// -----------------------------
function getToken() {
  return localStorage.getItem("authToken");
}

// -----------------------------
// Check login state & update UI
// -----------------------------
function checkAuthStatus() {
  const token = getToken();
  if (token) {
    // ✅ User logged in
    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    ordersSection.style.display = "block";
  } else {
    // 🚫 Not logged in
    signupBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    ordersSection.style.display = "none";
  }
}

// -----------------------------
// SIGNUP: Create new user
// -----------------------------
async function handleSignup() {
  const name = prompt("Enter your name:");
  const email = prompt("Enter your email:");
  const password = prompt("Enter a password:");

  if (!name || !email || !password) return alert("All fields required!");

  const res = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("authToken", data.token);
    alert("✅ Account created successfully!");
    checkAuthStatus();
  } else {
    alert(data.error || "Signup failed");
  }
}

// -----------------------------
// LOGIN: Existing user login
// -----------------------------
async function handleLogin() {
  const email = prompt("Enter your email:");
  const password = prompt("Enter your password:");

  if (!email || !password) return alert("All fields required!");

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("authToken", data.token);
    alert("✅ Login successful!");
    checkAuthStatus();
  } else {
    alert(data.error || "Login failed");
  }
}

// -----------------------------
// LOGOUT: Remove JWT
// -----------------------------
function handleLogout() {
  localStorage.removeItem("authToken");
  alert("Logged out successfully!");
  checkAuthStatus();
}

// -----------------------------
// FETCH ORDERS (Protected)
// -----------------------------
async function fetchOrders() {
  const token = getToken();
  if (!token) return alert("Please log in to view your orders.");

  try {
    const res = await fetch("/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.orders) {
      renderOrders(data.orders);
    } else {
      ordersSection.innerHTML = "<p>No orders found.</p>";
    }
  } catch (err) {
    console.error("Error fetching orders:", err);
    alert("Failed to fetch orders.");
  }
}

// -----------------------------
// Render Orders List
// -----------------------------
function renderOrders(orders) {
  if (orders.length === 0) {
    ordersSection.innerHTML = "<p>No orders found.</p>";
    return;
  }

  const html = orders
    .map(
      (order) => `
      <div class="order-card">
        <p><b>Order ID:</b> ${order.orderId}</p>
        <p><b>Amount:</b> ₹${order.amount}</p>
        <p><b>Status:</b> ${order.status}</p>
        <p><b>Date:</b> ${new Date(order.createdAt).toLocaleString()}</p>
      </div>
    `
    )
    .join("");

  ordersSection.innerHTML = html;
}

// -----------------------------
// Hide cart popup on load
// -----------------------------
window.addEventListener("load", () => {
  if (yourCartPopup) {
    yourCartPopup.style.display = "none"; // Prevent auto-popup on load
  }
  checkAuthStatus(); // Update UI based on token
});

// -----------------------------
// Button Event Listeners
// -----------------------------
if (signupBtn) signupBtn.addEventListener("click", handleSignup);
if (loginBtn) loginBtn.addEventListener("click", handleLogin);
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

// Optional: Fetch orders when "Your Orders" page is opened
if (ordersSection) fetchOrders();
