const API_BASE = window.location.origin;
const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");

// Initialize cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

    // ✅ Reattach click listeners after loading products
    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", addToCart);
    });
  } catch (err) {
    console.error("Failed to load products:", err);
    productsContainer.innerHTML = `<p class="text-red-500">Failed to load products. Please refresh.</p>`;
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
      key: order.key,
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

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
});

// ---------- Auth & Orders (placeholders) ----------
document.getElementById("login-btn").addEventListener("click", () => {
  alert("🔐 Login feature coming soon!");
});

document.getElementById("signup-btn").addEventListener("click", () => {
  alert("📝 Signup feature coming soon!");
});

document.getElementById("your-orders-btn").addEventListener("click", () => {
  alert("📦 Your Orders feature coming soon!");
});
