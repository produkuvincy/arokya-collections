// Base URL (auto-detects for Render deployment)
const API_BASE = window.location.origin;

// DOM elements
const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartCountBtn = document.getElementById("cart-count");

// Load cart from local storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ---------- LOAD PRODUCTS ----------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();

    productsContainer.innerHTML = products
      .map(
        (p) => `
        <div class="product-card bg-white shadow-lg rounded-2xl p-4 flex flex-col items-center hover:scale-105 transition-transform">
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
    saveCart();
    updateCartCount();
  }
});

// ---------- SAVE CART ----------
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// ---------- UPDATE CART COUNT ----------
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountBtn.textContent = `Cart (${count})`;
}

// ---------- RENDER CART ----------
function renderCart() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p class="text-gray-600">🛒 Your cart is empty.</p>`;
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;

  const cartHTML = cart
    .map(
      (item, index) => `
      <div class="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-2">
        <div class="text-left">
          <p class="font-semibold">${item.name}</p>
          <p class="text-sm text-pink-700">₹${item.price}</p>
        </div>
        <div class="flex items-center space-x-2">
          <button class="decrease bg-gray-300 px-2 rounded" data-index="${index}">−</button>
          <span>${item.qty}</span>
          <button class="increase bg-gray-300 px-2 rounded" data-index="${index}">+</button>
          <button class="remove text-red-500 font-bold ml-2" data-index="${index}">×</button>
        </div>
      </div>`
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  cartItemsContainer.innerHTML = `
    ${cartHTML}
    <div class="border-t border-gray-300 mt-4 pt-3 text-lg font-semibold text-pink-700">
      Total: ₹${total.toFixed(2)}
    </div>
  `;
}

// ---------- CART ACTIONS ----------
cartItemsContainer.addEventListener("click", (e) => {
  const index = e.target.dataset.index;
  if (e.target.classList.contains("increase")) {
    cart[index].qty++;
  } else if (e.target.classList.contains("decrease")) {
    if (cart[index].qty > 1) cart[index].qty--;
    else cart.splice(index, 1);
  } else if (e.target.classList.contains("remove")) {
    cart.splice(index, 1);
  } else {
    return;
  }
  saveCart();
  renderCart();
});

// ---------- SHOW CART ----------
function showCart() {
  renderCart();
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

    const options = {
      key: "rzp_test_xxxxxxxxxxxxx", // Replace with your RAZORPAY_KEY_ID
      amount: order.amount,
      currency: "INR",
      name: "Arokya Collections",
      description: "Jewellery Purchase",
      order_id: order.id,
      handler: function (response) {
        alert("✅ Payment Successful! Payment ID: " + response.razorpay_payment_id);
        cart = [];
        saveCart();
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
