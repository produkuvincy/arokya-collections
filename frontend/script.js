document.addEventListener("DOMContentLoaded", () => {
  const API_URL = ""; // Leave blank if backend is on same domain

  // --- DOM ELEMENTS ---
  const main = document.getElementById("main-content");
  const cartBtn = document.getElementById("cart-btn");
  const cartModal = document.getElementById("cart-modal");
  const cartItemsList = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkout-btn");
  const closeCart = document.getElementById("close-cart");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const ordersBtn = document.getElementById("orders-btn");

  let cart = [];
  let token = localStorage.getItem("token");

  // --- INITIAL STATE ---
  if (cartModal) cartModal.classList.add("hidden"); // Ensure cart modal starts hidden

  // Hide signup if user is logged in
  if (token) {
    if (signupBtn) signupBtn.style.display = "none";
    if (loginBtn) loginBtn.textContent = "Logout";
  }

  // --- LOAD PRODUCTS (STATIC FALLBACK) ---
  async function loadProducts() {
    try {
      // Example static product list if no backend route yet
      const products = [
        {
          id: 1,
          name: "Elegant Gold Necklace",
          price: 12000,
          image: "https://i.imgur.com/Y5YFv3G.jpg"
        },
        {
          id: 2,
          name: "Classic Diamond Ring",
          price: 8500,
          image: "https://i.imgur.com/XmCL5mS.jpg"
        },
        {
          id: 3,
          name: "Silver Anklet Set",
          price: 2500,
          image: "https://i.imgur.com/hl3aYvA.jpg"
        }
      ];

      renderProducts(products);
    } catch (err) {
      console.error("❌ Failed to load products:", err);
      main.innerHTML = "<p>Unable to load products. Please try again later.</p>";
    }
  }

  // --- RENDER PRODUCTS ---
  function renderProducts(products) {
    if (!main) return;
    main.innerHTML = `
      <h2>Featured Products</h2>
      <div id="products-container" class="products-grid"></div>
    `;
    const container = document.getElementById("products-container");
    products.forEach(p => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
      `;
      container.appendChild(div);
    });

    // Attach event listeners for "Add to Cart" buttons
    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const item = {
          id: e.target.dataset.id,
          name: e.target.dataset.name,
          price: parseInt(e.target.dataset.price)
        };
        addToCart(item);
      });
    });
  }

  // --- ADD TO CART ---
  function addToCart(item) {
    cart.push(item);
    updateCartCount();
  }

  function updateCartCount() {
    if (cartBtn) cartBtn.textContent = `Cart (${cart.length})`;
  }

  // --- RENDER CART ITEMS ---
  function renderCartItems() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = "";
    if (cart.length === 0) {
      cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
      return;
    }
    cart.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} - ₹${item.price}`;
      cartItemsList.appendChild(li);
    });
  }

  // --- EVENT LISTENERS ---
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      if (!token) return alert("Please login first!");
      cartModal.classList.remove("hidden");
      renderCartItems();
    });
  }

  if (closeCart) {
    closeCart.addEventListener("click", () => {
      if (cartModal) cartModal.classList.add("hidden");
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) return alert("Your cart is empty!");
      alert("Proceeding to checkout...");
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (token) {
        localStorage.removeItem("token");
        alert("Logged out successfully!");
        window.location.reload();
      } else {
        alert("Login flow not implemented yet.");
      }
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      alert("Signup flow not implemented yet.");
    });
  }

  if (ordersBtn) {
    ordersBtn.addEventListener("click", () => {
      if (!token) return alert("Please login first!");
      alert("Your orders page coming soon!");
    });
  }

  // --- RUN ON LOAD ---
  loadProducts();
});
