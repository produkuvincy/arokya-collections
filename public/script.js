const API_BASE = window.location.origin;
const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let token = localStorage.getItem("token") || null;

// ---------- LOAD PRODUCTS ----------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();

    productsContainer.innerHTML = products
      .map(
        (p) => `
        <div class="product-card bg-white shadow-md rounded-2xl p-4 flex flex-col items-center">
          <img src="${p.image}" alt="${p.name}" class="rounded-lg mb-4 w-40 h-40 object-cover"/>
          <h3 class="font-semibold mb-1">${p.name}</h3>
          <p class="text-pink-700 font-bold mb-3">₹${p.price}</p>
          <button class="add-to-cart bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition"
            data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">
            Add to Cart
          </button>
        </div>`
      )
      .join("");

    document.querySelectorAll(".add-to-cart").forEach((btn) =>
      btn.addEventListener("click", addToCart)
    );
  } catch (err) {
    console.error("Failed to load products:", err);
    productsContainer.innerHTML = `<p class="text-red-600 text-center">⚠️ Failed to load products. Please refresh.</p>`;
  }
}

// ---------- CART LOGIC ----------
function addToCart(e) {
  const btn = e.target;
  const product = {
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: parseFloat(btn.dataset.price),
    qty: 1,
  };

  const existing = cart.find((i) => i.id === product.id);
  if (existing) existing.qty++;
  else cart.push(product);

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function updateCartCount() {
  cartCountBtn.textContent = `Cart (${cart.reduce((a, i) => a + i.qty, 0)})`;
}

function renderCart() {
  if (!cart.length) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  cartItemsContainer.innerHTML = cart
    .map(
      (item) => `
    <div class="flex justify-between items-center mb-2">
      <span>${item.name} × ${item.qty}</span>
      <span>₹${item.price * item.qty}</span>
      <button class="text-red-500 text-sm" onclick="removeFromCart('${item.id}')">Remove</button>
    </div>`
    )
    .join("");
}

cartCountBtn.addEventListener("click", () => {
  renderCart();
  cartModal.classList.remove("hidden");
});

closeCartBtn.addEventListener("click", () =>
  cartModal.classList.add("hidden")
);

// ---------- CHECKOUT ----------
checkoutBtn.addEventListener("click", async () => {
  if (!cart.length) return alert("Your cart is empty.");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  try {
    const res = await fetch(`${API_BASE}/api/orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });
    const order = await res.json();

    if (!order.id) throw new Error(order.error || "Order creation failed.");

    const rzp = new Razorpay({
      key: order.key || "rzp_test_xxxxxxxxx", // replace with test key if needed
      amount: order.amount,
      currency: "INR",
      name: "Arokya Collections",
      description: "Jewellery Purchase",
      order_id: order.id,
      handler: function (response) {
        alert("✅ Payment successful: " + response.razorpay_payment_id);
        cart = [];
        localStorage.removeItem("cart");
        updateCartCount();
        cartModal.classList.add("hidden");
      },
      theme: { color: "#e91e63" },
    });

    rzp.open();
  } catch (err) {
    console.error("Checkout Error:", err);
    alert("Payment failed. Please try again.");
  }
});

// ---------- AUTH LOGIC ----------
async function loginFlow() {
  const email = prompt("Enter email:");
  const password = prompt("Enter password:");
  if (!email || !password) return alert("Please fill all fields");

  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("Login successful!");
  } else alert(data.message || "Login failed");
}

async function signupFlow() {
  const name = prompt("Enter name:");
  const email = prompt("Enter email:");
  const password = prompt("Enter password:");
  if (!name || !email || !password) return alert("Please fill all fields");

  const res = await fetch(`${API_BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("Signup successful!");
  } else alert(data.message || "Signup failed");
}

// ---------- ORDERS ----------
async function viewOrders() {
  if (!token) return alert("Please login to view orders.");
  const res = await fetch(`${API_BASE}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const orders = await res.json();
  if (!orders.length) return alert("No orders yet.");
  alert(
    "Your Orders:\n\n" +
      orders.map((o) => `${o.orderId} - ₹${o.amount / 100} - ${o.status}`).join("\n")
  );
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
  document.getElementById("login-btn").addEventListener("click", loginFlow);
  document.getElementById("signup-btn").addEventListener("click", signupFlow);
  document.getElementById("your-orders-btn").addEventListener("click", viewOrders);
});
