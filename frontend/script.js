// ------------------------------
// Arokya Collections Frontend
// ------------------------------

// Elements from the DOM
const mainContent = document.getElementById("main-content");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsList = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCart = document.getElementById("close-cart");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const ordersBtn = document.getElementById("orders-btn");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let user = JSON.parse(localStorage.getItem("user")) || null;

// ------------------------------
// Helper: Update Cart Button
// ------------------------------
function updateCartCount() {
  cartBtn.innerText = `Cart (${cart.length})`;
}

// ------------------------------
// Render Products from API
// ------------------------------
async function loadProducts() {
  try {
    const res = await fetch("/api/products"); // ✅ works on Render too
    if (!res.ok) throw new Error("Failed to load products");
    const products = await res.json();

    mainContent.innerHTML = `
      <h2 style="text-align:center;">Featured Products</h2>
      <div class="product-grid">
        ${products
          .map(
            (p) => `
            <div class="product-card">
              <img src="${p.image}" alt="${p.name}" class="product-img">
              <h3>${p.name}</h3>
              <p>${p.description}</p>
              <p><strong>₹${p.price}</strong></p>
              <button onclick="addToCart('${p.id}', '${p.name}', ${p.price})">
                Add to Cart
              </button>
            </div>`
          )
          .join("")}
      </div>
    `;
  } catch (err) {
    console.error("Error loading products:", err);
    mainContent.innerHTML =
      "<p style='color:red;text-align:center;'>⚠️ Unable to load products. Please refresh.</p>";
  }
}

// ------------------------------
// Add to Cart
// ------------------------------
function addToCart(id, name, price) {
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert(`${name} added to cart!`);
}

// ------------------------------
// Show Cart Modal
// ------------------------------
cartBtn.onclick = () => {
  cartModal.classList.remove("hidden");
  renderCart();
};

closeCart.onclick = () => cartModal.classList.add("hidden");

// ------------------------------
// Render Cart Items
// ------------------------------
function renderCart() {
  cartItemsList.innerHTML = "";
  if (cart.length === 0) {
    cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
    return;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (x${item.qty}) - ₹${item.price * item.qty}`;
    cartItemsList.appendChild(li);
  });
}

// ------------------------------
// Checkout with Razorpay
// ------------------------------
checkoutBtn.onclick = async () => {
  if (!user) {
    alert("Please log in to proceed with checkout!");
    return;
  }

  const amount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (amount <= 0) return alert("Your cart is empty!");

  try {
    const res = await fetch("/api/create-order", {
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
      handler: function (response) {
        alert("✅ Payment Successful! ID: " + response.razorpay_payment_id);
        cart = [];
        localStorage.removeItem("cart");
        updateCartCount();
        renderCart();
      },
      prefill: {
        name: user.name || "Customer",
        email: user.email || "example@email.com",
      },
      theme: { color: "#d63384" },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Checkout error:", err);
    alert("❌ Payment failed. Please try again.");
  }
};

// ------------------------------
// Login / Logout Logic
// ------------------------------
loginBtn.onclick = async () => {
  const email = prompt("Enter email:");
  const password = prompt("Enter password:");

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.token) {
    user = data.user;
    localStorage.setItem("user", JSON.stringify(user));
    alert("✅ Logged in successfully!");
    updateAuthButtons();
  } else {
    alert("❌ Login failed: " + (data.error || "Unknown error"));
  }
};

signupBtn.onclick = async () => {
  const name = prompt("Enter your name:");
  const email = prompt("Enter email:");
  const password = prompt("Enter password:");

  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (data.token) {
    user = data.user;
    localStorage.setItem("user", JSON.stringify(user));
    alert("🎉 Account created successfully!");
    updateAuthButtons();
  } else {
    alert("❌ Signup failed: " + (data.error || "Unknown error"));
  }
};

ordersBtn.onclick = async () => {
  if (!user) {
    alert("Please login to view your orders!");
    return;
  }
  const res = await fetch(`/api/orders?email=${user.email}`);
  const orders = await res.json();

  mainContent.innerHTML = `
    <h2>Your Orders</h2>
    <ul>
      ${orders
        .map(
          (o) =>
            `<li>Order ID: ${o.orderId} | Amount: ₹${o.amount / 100} | Status: ${o.status}</li>`
        )
        .join("")}
    </ul>
  `;
};

// ------------------------------
// Update Buttons (Hide signup/login if logged in)
// ------------------------------
function updateAuthButtons() {
  if (user) {
    loginBtn.style.display = "none";
    signupBtn.style.display = "none";
    ordersBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    signupBtn.style.display = "inline-block";
    ordersBtn.style.display = "none";
  }
}

// ------------------------------
// Initial Load
// ------------------------------
updateAuthButtons();
updateCartCount();
loadProducts();
