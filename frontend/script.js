// Base URL - same domain (works for Render deployment)
const API_BASE = window.location.origin;

// Select DOM elements
const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");

// Load cart from local storage (or empty)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ---------- LOAD PRODUCTS ----------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();

    // Render products dynamically
    productsContainer.innerHTML = products
      .map(
        (p) => `
        <div class="product-card bg-white shadow-lg rounded-2xl p-4 flex flex-col items-center">
          <img src="${p.image}" alt="${p.name}" class="rounded-lg mb-4 w-40 h-40 object-cover" />
          <h3 class="font-semibold text-lg">${p.name}</h3>
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
  } catch (err) {
    console.error("Failed to load products:", err);
    productsContainer.innerHTML = `<p class="text-red-500">⚠️ Failed to load products. Please refresh.</p>`;
  }
}

// ---------- ADD TO CART ----------
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart")) {
    const product = {
      id: e.target.dataset.id,
      name: e.target.dataset.name,
      price: parseFloat(e.target.dataset.price),
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
  }
});

// ---------- UPDATE CART COUNT ----------
function updateCartCount() {
  cartCountBtn.textContent = `Cart (${cart.length})`;
}

// ---------- SHOW CART ----------
function showCart() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
  } else {
    cartItemsContainer.innerHTML = cart
      .map(
        (item) =>
          `<p>${item.name} - ₹${item.price} × ${item.qty}</p>`
      )
      .join("");
  }
  cartModal.classList.remove("hidden");
}

// ---------- CLOSE CART ----------
closeCartBtn.addEventListener("click", () => {
  cartModal.classList.add("hidden");
});

// ---------- CHECKOUT ----------
checkoutBtn.addEventListener("click", async () => {
  try {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (total === 0) {
      alert("🛒 Your cart is empty!");
      return;
    }

    // Create order on backend
    const res = await fetch(`${API_BASE}/api/orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });

    const order = await res.json();

    if (!order.id) {
      alert("❌ Failed to create order. Please try again.");
      return;
    }

    // Razorpay checkout setup
    const options = {
      key: "rzp_test_xxxxxxxxxxxxx", // 🔑 Replace this with your actual RAZORPAY_KEY_ID
      amount: order.amount,
      currency: "INR",
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

    const rzp1 = new Razorpay(options);
    rzp1.open();
  } catch (err) {
    console.error("Checkout Error:", err);
    alert("Something went wrong during checkout.");
  }
});

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
});
