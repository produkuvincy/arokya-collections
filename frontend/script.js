document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = ""; // blank => same origin
  const main = document.getElementById("main-content");
  const cartBtn = document.getElementById("cart-btn");
  const cartModal = document.getElementById("cart-modal");
  const cartItemsList = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkout-btn");
  const closeCart = document.getElementById("close-cart");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const ordersBtn = document.getElementById("orders-btn");

  // Ensure modal is hidden on load
  if (cartModal) cartModal.classList.add("hidden");

  // Keep local cart
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  updateCartButton();

  // Load products (try backend first, otherwise use static)
  async function loadProducts() {
    let products = null;
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) products = await res.json();
      else throw new Error("No products from API");
    } catch (err) {
      // fallback static products so page never breaks
      products = [
        { id: "1", name: "Gold Necklace", price: 12000, image: "https://i.imgur.com/Y5YFv3G.jpg" },
        { id: "2", name: "Diamond Ring", price: 8500, image: "https://i.imgur.com/XmCL5mS.jpg" },
        { id: "3", name: "Silver Anklet", price: 2500, image: "https://i.imgur.com/hl3aYvA.jpg" }
      ];
      console.warn("Products fallback used:", err);
    }

    renderProducts(products);
  }

  function renderProducts(products) {
    if (!main) return;
    main.innerHTML = `<h2>Featured Products</h2>
      <div class="products-grid" id="products-container"></div>`;
    const container = document.getElementById("products-container");
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
      `;
      container.appendChild(card);
    });

    // attach events safely
    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price);
        addToCart({ id, name, price });
      });
    });
  }

  function addToCart(item) {
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartButton();
    alert(`${item.name} added to cart`);
  }

  function updateCartButton() {
    if (!cartBtn) return;
    cartBtn.textContent = `Cart (${cart.length})`;
  }

  function renderCartItems() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = "";
    if (cart.length === 0) {
      cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
      return;
    }
    cart.forEach(it => {
      const li = document.createElement("li");
      li.textContent = `${it.name} - ₹${it.price}`;
      cartItemsList.appendChild(li);
    });
  }

  // Safe event wiring
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      cartModal?.classList.remove("hidden");
      renderCartItems();
    });
  }
  if (closeCart) closeCart.addEventListener("click", () => cartModal?.classList.add("hidden"));
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) return alert("Cart empty");
    alert("Checkout flow (Razorpay) will run here.");
  });

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      alert("Login flow - simple prompt demo");
      const email = prompt("Email:");
      const pass = prompt("Password:");
      if (email && pass) {
        localStorage.setItem("token", "demo-token");
        alert("You are now logged in (demo)");
        if (signupBtn) signupBtn.style.display = "none";
      }
    });
  }
  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      alert("Signup flow - demo only");
    });
  }
  if (ordersBtn) {
    ordersBtn.addEventListener("click", () => {
      alert("Orders page - demo");
    });
  }

  // Start
  loadProducts();
});
