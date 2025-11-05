// --- Config & state ---
const API_BASE = window.location.origin;
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let token = localStorage.getItem("token") || null;

// --- Elements ---
const productsEl = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsEl = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const yourOrdersBtn = document.getElementById("your-orders-btn");

// --- Utility: safe POST that tries multiple paths (handles /api/auth/* vs /api/*) ---
async function postJSON(possiblePaths, body, headers = {}) {
  const paths = Array.isArray(possiblePaths) ? possiblePaths : [possiblePaths];
  for (const p of paths) {
    const res = await fetch(`${API_BASE}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    // if 404, try next path; otherwise throw detailed error
    if (res.status !== 404) {
      const msg = await res.text().catch(() => "");
      throw new Error(`POST ${p} failed (${res.status}): ${msg}`);
    }
  }
  throw new Error(`All endpoints failed: ${paths.join(", ")}`);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((s, it) => s + it.qty, 0);
  cartCountBtn.textContent = `Cart (${count})`;
}

function renderCart() {
  if (!cart.length) {
    cartItemsEl.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  cartItemsEl.innerHTML = cart
    .map(
      (it) => `
      <div class="flex items-center justify-between mb-2">
        <span>${it.name} × ${it.qty}</span>
        <span>₹${(it.price * it.qty).toFixed(2)}</span>
        <button class="text-red-600 text-sm remove-item" data-id="${it.id}">Remove</button>
      </div>`
    )
    .join("");
}

// --- Products ---
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    productsEl.innerHTML = products
      .map(
        (p) => `
      <div class="product-card bg-white shadow-md rounded-2xl p-4 flex flex-col items-center">
        <img src="${p.image}" alt="${p.name}" class="rounded-lg mb-4 w-40 h-40 object-cover"/>
        <h3 class="font-semibold mb-1">${p.name}</h3>
        <p class="text-pink-700 font-bold mb-3">₹${p.price}</p>
        <button class="add-to-cart bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg"
          data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">
          Add to Cart
        </button>
      </div>`
      )
      .join("");
  } catch (e) {
    console.error("Failed to load products:", e);
    productsEl.innerHTML =
      `<p class="text-red-600 text-center">⚠️ Failed to load products. Check /api/products on your server.</p>`;
  }
}

// --- Cart interactions (event delegation) ---
productsEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("add-to-cart")) return;
  const { id, name, price } = e.target.dataset;
  const existing = cart.find((it) => it.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price: parseFloat(price), qty: 1 });
  saveCart();
  updateCartCount();
});

cartItemsEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-item")) return;
  const id = e.target.dataset.id;
  cart = cart.filter((it) => it.id !== id);
  saveCart();
  renderCart();
  updateCartCount();
});

cartCountBtn.addEventListener("click", () => {
  renderCart();
  cartModal.classList.remove("hidden");
});
closeCartBtn.addEventListener("click", () => cartModal.classList.add("hidden"));

// --- Checkout ---
checkoutBtn.addEventListener("click", async () => {
  if (!cart.length) return alert("Your cart is empty.");
  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  try {
    const order = await postJSON("/api/orders/create", { amount: total });
    if (!order?.id) throw new Error("Order not created");
    const rzp = new Razorpay({
      key: order.key, // coming from server (must be set in .env)
      amount: order.amount,
      currency: order.currency,
      name: "Arokya Collections",
      description: "Jewellery Purchase",
      order_id: order.id,
      handler: function (resp) {
        alert("✅ Payment Successful! " + resp.razorpay_payment_id);
        cart = [];
        saveCart();
        updateCartCount();
        cartModal.classList.add("hidden");
      },
      theme: { color: "#e91e63" },
    });
    rzp.on("payment.failed", (resp) =>
      alert("❌ Payment failed: " + (resp?.error?.description || "Unknown"))
    );
    rzp.open();
  } catch (e) {
    console.error("Checkout error:", e);
    alert("Could not start checkout. Check server logs.");
  }
});

// --- Auth UI helpers ---
// ---------- AUTH UI ----------
function setAuthUI(isLoggedIn, name = "") {
  const guestBtns = document.querySelectorAll(".guest-btn");
  const profileMenu = document.getElementById("profile-menu");
  const profileName = document.getElementById("profile-name");
  const dropdown = document.getElementById("dropdown-menu");

  if (isLoggedIn) {
    // Hide guest buttons
    guestBtns.forEach((b) => (b.style.display = "none"));
    profileMenu.classList.remove("hidden");
    profileName.textContent = name || "User";

    // Toggle dropdown
    document.getElementById("profile-btn").onclick = () => {
      dropdown.classList.toggle("hidden");
    };

    // Logout handler
    document.getElementById("logout-btn").onclick = () => {
      token = null;
      localStorage.removeItem("token");
      dropdown.classList.add("hidden");
      setAuthUI(false);
      alert("Logged out!");
    };

    // "Your Orders"
    document.getElementById("your-orders-btn").onclick = async () => {
      if (!token) return alert("Please login to view your orders.");
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orders = await res.json();
      if (!orders.length) return alert("No orders yet.");
      const msg = orders
        .map((o) => `• ${o.orderId} — ₹${(o.amount / 100).toFixed(2)} — ${o.status}`)
        .join("\n");
      alert(`Your Orders:\n\n${msg}`);
    };

    // Hide dropdown if clicked outside
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("profile-menu");
      if (!menu.contains(e.target)) dropdown.classList.add("hidden");
    });
  } else {
    // Show guest buttons again
    guestBtns.forEach((b) => (b.style.display = ""));
    profileMenu.classList.add("hidden");
  }
}

// --- Modals (Login / Signup) ---
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

// Ensure close buttons always work
function wireModalCloseButtons() {
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.onclick = () => {
      const modal = btn.closest("div[id$='-modal']");
      if (modal) modal.classList.add("hidden");
    };
  });
}

// Openers for header buttons
function openSignup() { openModal("signup-modal"); }
function openLogin()  { openModal("login-modal"); }

// Submit handlers
async function submitSignup() {
  const name = (document.getElementById("signup-name")?.value || "").trim();
  const email = (document.getElementById("signup-email")?.value || "").trim();
  const password = (document.getElementById("signup-password")?.value || "").trim();
  if (!name || !email || !password) return alert("All fields required.");

  try {
    const data = await postJSON(
      ["/api/auth/signup", "/api/signup"],
      { name, email, password }
    );
    if (!data?.token) throw new Error(data?.message || "Signup failed");
    token = data.token;
    localStorage.setItem("token", token);
    closeModal("signup-modal");
    setAuthUI(true, name);   // ✅ passes the new user’s name to the dropdown
    alert("✅ Signup successful!");
  } catch (e) {
    console.error(e);
    alert(e.message || "Signup failed");
  }
}

async function submitLogin() {
  const email = (document.getElementById("login-email")?.value || "").trim();
  const password = (document.getElementById("login-password")?.value || "").trim();
  if (!email || !password) return alert("Enter email and password.");

  try {
    const data = await postJSON(
      ["/api/auth/login", "/api/login"],
      { email, password }
    );
    if (!data?.token) throw new Error(data?.message || "Login failed");
    token = data.token;
    localStorage.setItem("token", token);
    closeModal("login-modal");
    setAuthUI(true, data.user?.name || "User");   // ✅ displays the username if available
    alert("✅ Login successful!");
  } catch (e) {
    console.error(e);
    alert(e.message || "Login failed");
  }
}

// Wire modal buttons (only once after DOM is ready)
function wireAuthModals() {
  const signupSubmit = document.getElementById("signup-submit");
  const loginSubmit = document.getElementById("login-submit");
  if (signupSubmit) signupSubmit.onclick = submitSignup;
  if (loginSubmit) loginSubmit.onclick = submitLogin;
  if (signupBtn)   signupBtn.onclick = openSignup;
  if (loginBtn)    loginBtn.onclick  = openLogin;
}

// --- Orders (simple alert) ---
async function viewOrders() {
  if (!token) return alert("Please login to view your orders.");
  const res = await fetch(`${API_BASE}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return alert("Could not load orders.");
  const orders = await res.json();
  if (!orders?.length) return alert("No orders yet.");
  alert(
    orders.map((o) => `• ${o.orderId} — ₹${(o.amount / 100).toFixed(2)} — ${o.status}`).join("\n")
  );
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  wireModalCloseButtons();
  wireAuthModals();
  if (yourOrdersBtn) yourOrdersBtn.addEventListener("click", viewOrders);
  loadProducts();
  updateCartCount();
  setAuthUI(!!token);
});
