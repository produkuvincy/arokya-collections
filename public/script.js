const API_BASE = window.location.origin;
const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let token = localStorage.getItem("token") || null;

// ---------- Load Products ----------
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
          <button 
            class="add-to-cart bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition" 
            data-id="${p._id}" 
            data-name="${p.name}" 
            data-price="${p.price}">
            Add to Cart
          </button>
        </div>`
      )
      .join("");

    // Bind click listeners after products load
    document.querySelectorAll(".add-to-cart").forEach((btn) =>
      btn.addEventListener("click", addToCart)
    );
  } catch (err) {
    console.error("Failed to load products:", err);
    productsContainer.innerHTML =
      `<p class="text-red-500">Failed to load products. Please refresh.</p>`;
  }
}

// ---------- Add to Cart ----------
function addToCart(e) {
  const btn = e.target;
  const product = {
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: parseFloat(btn.dataset.price),
    qty: 1,
  };

  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push(product);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert(`${product.name} added to cart!`);
}

// ---------- Update Cart Count ----------
function updateCartCount() {
  cartCountBtn.textContent = `Cart (${cart.length})`;
}

// ---------- Show Cart ----------
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

// ---------- Close Cart ----------
closeCartBtn.addEventListener("click", () => {
  cartModal.classList.add("hidden");
});

// ---------- Checkout ----------
checkoutBtn.addEventListener("click", async () => {
  try {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (total === 0) {
      alert("Your cart is empty!");
      return;
    }

    const res = await fetch(`${API_BASE}/api/orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });

    const order = await res.json();
    if (!order.id) {
      alert("Failed to create order.");
      return;
    }

    const options = {
      key: order.key || "rzp_test_xxxxxxxxx", // Replace with real test key
      amount: order.amount,
      currency: order.currency,
      name: "Arokya Collections",
      description: "Jewellery Purchase",
      order_id: order.id,
      handler: function (response) {
        alert("✅ Payment Successful! Payment ID: " + response.razorpay_payment_id);
        localStorage.removeItem("cart");
        cart = [];
        updateCartCount();
        cartModal.classList.add("hidden");
      },
      theme: { color: "#e91e63" },
    };

    const rzp = new Razorpay(options);
    rzp.open();

    rzp.on("payment.failed", function (response) {
      alert("❌ Payment Failed: " + response.error.description);
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    alert("Something went wrong during checkout.");
  }
});

// ---------- Auth UI ----------
function setAuthUI(loggedIn, name) {
  const guestBtns = document.querySelectorAll(".guest-btn");
  const profileMenu = document.getElementById("profile-menu");
  const profileName = document.getElementById("profile-name");
  const dropdown = document.getElementById("dropdown-menu");

  if (loggedIn) {
    guestBtns.forEach((b) => (b.style.display = "none"));
    profileMenu.classList.remove("hidden");
    profileName.textContent = name || "User";

    document.getElementById("profile-btn").onclick = () =>
      dropdown.classList.toggle("hidden");

    document.getElementById("logout-btn").onclick = () => {
      token = null;
      localStorage.removeItem("token");
      dropdown.classList.add("hidden");
      setAuthUI(false);
      alert("Logged out!");
    };
  } else {
    guestBtns.forEach((b) => (b.style.display = ""));
    profileMenu.classList.add("hidden");
  }

  document.addEventListener("click", (e) => {
    const profileArea = document.getElementById("profile-menu");
    if (!profileArea.contains(e.target)) dropdown.classList.add("hidden");
  });
}

// ---------- Modal Helpers ----------
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// Attach close button behavior once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".close-modal").forEach((btn) =>
    btn.addEventListener("click", () => {
      const modal = btn.closest("div[id$='-modal']");
      modal.classList.add("hidden");
    })
  );
});

// ---------- Auth Modals ----------
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");

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
    closeModal("signup-modal");
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
    closeModal("login-modal");
    setAuthUI(true, data.user?.name);
  } else alert(data.message || "Login failed");
});

// ---------- Orders ----------
document.getElementById("your-orders-btn").addEventListener("click", async () => {
  if (!token) return alert("Please login to view your orders.");
  const res = await fetch(`${API_BASE}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const orders = await res.json();
  if (!orders?.length) return alert("No orders yet.");
  const msg = orders
    .map((o) => `• ${o.orderId} — ₹${(o.amount / 100).toFixed(2)} — ${o.status}`)
    .join("\n");
  alert(`Your Orders:\n\n${msg}`);
});

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
  if (token) setAuthUI(true);
});
