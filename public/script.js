const API_BASE = window.location.origin;

// Elements
const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");

const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const yourOrdersBtn = document.getElementById("your-orders-btn");

// State
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let token = localStorage.getItem("token") || null;

// ---------- UI helpers ----------
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((s, it) => s + it.qty, 0);
  cartCountBtn.textContent = `Cart (${count})`;
}

function setAuthUI(loggedIn, name) {
  const guestBtns = document.querySelectorAll(".guest-btn");
  const profileMenu = document.getElementById("profile-menu");
  const profileName = document.getElementById("profile-name");
  const dropdown = document.getElementById("dropdown-menu");

  if (loggedIn) {
    // Hide guest buttons
    guestBtns.forEach((b) => (b.style.display = "none"));
    profileMenu.classList.remove("hidden");
    profileName.textContent = name || "User";

    // Toggle dropdown on click
    document.getElementById("profile-btn").onclick = () => {
      dropdown.classList.toggle("hidden");
    };

    // Logout
    document.getElementById("logout-btn").onclick = () => {
      token = null;
      localStorage.removeItem("token");
      dropdown.classList.add("hidden");
      setAuthUI(false);
      alert("Logged out!");
    };
  } else {
    // Show guest buttons
    guestBtns.forEach((b) => (b.style.display = ""));
    profileMenu.classList.add("hidden");
  }

  // Close dropdown if clicking outside
  document.addEventListener("click", (e) => {
    const profileArea = document.getElementById("profile-menu");
    if (!profileArea.contains(e.target)) dropdown.classList.add("hidden");
  });
}

// ---------- Auth flows ----------
async function checkMe() {
  if (!token) return setAuthUI(false);
  try {
    const res = await fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    const me = await res.json();
    setAuthUI(true, me?.name);
  } catch {
    token = null;
    localStorage.removeItem("token");
    setAuthUI(false);
  }
}

async function signupFlow() {
  const name = prompt("Enter name:");
  const email = prompt("Enter email:");
  const password = prompt("Enter password:");
  if (!name || !email || !password) return;

  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("Signup successful!");
    setAuthUI(true, name);
  } else {
    alert(data.message || "Signup failed");
  }
}

async function loginFlow() {
  const email = prompt("Enter email:");
  const password = prompt("Enter password:");
  if (!email || !password) return;

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("Login successful!");
    setAuthUI(true, data.user?.name);
  } else {
    alert(data.message || "Login failed");
  }
}

function logout() {
  token = null;
  localStorage.removeItem("token");
  setAuthUI(false);
  alert("Logged out");
}

// ---------- Products ----------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();

    productsContainer.innerHTML = products
      .map(
        (p) => `
        <div class="product-card bg-white shadow-lg rounded-2xl p-4 flex flex-col items-center">
          <img src="${p.image}" alt="${p.name}" class="rounded-lg mb-4 w-40 h-40 object-cover" />
          <h3 class="font-semibold">${p.name}</h3>
          <p class="text-pink-700 font-bold mb-3">₹${p.price}</p>
          <button class="add-to-cart bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg"
            data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">
            Add to Cart
          </button>
        </div>`
      )
      .join("");

    // attach click handlers
    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const product = {
          id: e.target.dataset.id,
          name: e.target.dataset.name,
          price: parseFloat(e.target.dataset.price),
          qty: 1,
        };
        const existing = cart.find((it) => it.id === product.id);
        if (existing) existing.qty++;
        else cart.push(product);
        saveCart();
        updateCartCount();
        alert(`${product.name} added to cart!`);
      });
    });
  } catch (e) {
    console.error("Failed to load products:", e);
    productsContainer.innerHTML = `<p class="text-red-500">Failed to load products.</p>`;
  }
}

// ---------- Cart modal ----------
function showCart() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
  } else {
    cartItemsContainer.innerHTML = cart
      .map((item) => `<p>${item.name} - ₹${item.price} × ${item.qty}</p>`)
      .join("");
  }
  cartModal.classList.remove("hidden");
}
window.showCart = showCart; // used by onclick in index.html

closeCartBtn.addEventListener("click", () => cartModal.classList.add("hidden"));

// ---------- Checkout ----------
checkoutBtn.addEventListener("click", async () => {
  try {
    if (!token) {
      alert("Please login before checkout.");
      return;
    }

    const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
    if (total <= 0) return alert("Your cart is empty!");

    // Create order on server — includes key id in response
    const res = await fetch(`${API_BASE}/api/orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });
    const order = await res.json();
    if (!order.id) return alert("Failed to create order. Try again.");

    const rzp = new Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: "Arokya Collections",
      description: "Jewellery Purchase",
      order_id: order.id,
      handler: async function (response) {
        // Save the order to user history
        await fetch(`${API_BASE}/api/orders/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: "paid",
          }),
        });
        alert("✅ Payment Successful! Payment ID: " + response.razorpay_payment_id);
        cart = [];
        saveCart();
        updateCartCount();
        cartModal.classList.add("hidden");
      },
      theme: { color: "#e91e63" },
    });

    rzp.on("payment.failed", function (resp) {
      console.error("Payment failed:", resp.error);
      alert("❌ Payment failed: " + (resp?.error?.description || "Unknown error"));
    });

    rzp.open();
  } catch (e) {
    console.error("Checkout error:", e);
    alert("Something went wrong during checkout.");
  }
});

// ---------- Orders ----------
yourOrdersBtn.addEventListener("click", async () => {
  if (!token) return alert("Please login to view your orders.");
  const res = await fetch(`${API_BASE}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
  const orders = await res.json();
  if (!orders?.length) return alert("No orders yet.");
  const msg = orders
    .map((o) => `• ${o.orderId}  —  ₹${(o.amount / 100).toFixed(2)}  —  ${o.status}`)
    .join("\n");
  alert(`Your Orders:\n\n${msg}`);
});

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  await checkMe();
  updateCartCount();
  signupBtn.addEventListener("click", signupFlow);
  // loginBtn click is wired inside setAuthUI() / checkMe()
});

// ---------- Modal helpers ----------
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeAllModals() {
  document.querySelectorAll(".close-modal").forEach(btn =>
    btn.addEventListener("click", () =>
      btn.closest("div[id$='-modal']").classList.add("hidden")
    )
  );
}
closeAllModals();

// ---------- Auth Modals ----------
signupBtn.addEventListener("click", () => openModal("signup-modal"));
loginBtn.addEventListener("click", () => openModal("login-modal"));

// ---------- Signup ----------
document.getElementById("signup-submit").addEventListener("click", async () => {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  if (!name || !email || !password) return alert("All fields required");

  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("✅ Signup successful!");
    document.getElementById("signup-modal").classList.add("hidden");
    setAuthUI(true, name);
  } else alert(data.message || "Signup failed");
});

// ---------- Login ----------
document.getElementById("login-submit").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  if (!email || !password) return alert("Enter both email and password");

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("✅ Login successful!");
    document.getElementById("login-modal").classList.add("hidden");
    setAuthUI(true, data.user?.name);
  } else alert(data.message || "Login failed");
});

