// ------------------------------
// FRONTEND SCRIPT FOR AROKYA COLLECTIONS
// ------------------------------

const productsContainer = document.getElementById("products");
const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const yourOrdersBtn = document.getElementById("your-orders-btn");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ------------------------------
// FETCH PRODUCTS
// ------------------------------
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    productsContainer.innerHTML = "";

    data.forEach((p) => {
      const div = document.createElement("div");
      div.className =
        "product-card bg-white shadow-md rounded-2xl p-4 text-center hover:shadow-lg transition";
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="w-40 h-40 mx-auto object-cover rounded-lg mb-3">
        <h3 class="font-semibold text-lg">${p.name}</h3>
        <p class="text-pink-700 font-bold">₹${p.price}</p>
        <button class="add-to-cart-btn mt-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition" data-id="${p._id}">Add to Cart</button>
      `;
      productsContainer.appendChild(div);
    });

    document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const product = data.find((p) => p._id === id);
        addToCart(product);
      });
    });
  } catch (err) {
    console.error("❌ Failed to load products:", err);
  }
}

// ------------------------------
// CART FUNCTIONS
// ------------------------------
function addToCart(product) {
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartButton();
  alert(`${product.name} added to cart!`);
}

function updateCartButton() {
  cartCount.textContent = `Cart (${cart.length})`;
}

function showCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cartItems.innerHTML = cart
      .map((item) => `<p>${item.name
