document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "";
  const main = document.getElementById("main-content");
  const cartBtn = document.getElementById("cart-btn");
  const cartModal = document.getElementById("cart-modal");
  const cartItemsList = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkout-btn");
  const closeCart = document.getElementById("close-cart");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const ordersBtn = document.getElementById("orders-btn");

  if (cartModal) cartModal.classList.add("hidden");

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  updateCartButton();

  async function loadProducts() {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const products = await res.json();
      renderProducts(products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      main.innerHTML += `<p style="color:red;">⚠️ Could not load products.</p>`;
    }
  }

  function renderProducts(products) {
    main.innerHTML = `<h2>Featured Products</h2>
      <div class="products-grid" id="products-container"></div>`;
    const container = document.getElementById("products-container");
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button class="add-to-cart" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll(".add-to-cart").forEach((btn) =>
      btn.addEventListener("click", () => {
        const item = {
          id: btn.dataset.id,
          name: btn.dataset.name,
          price: Number(btn.dataset.price),
        };
        addToCart(item);
      })
    );
  }

  function addToCart(item) {
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartButton();
    alert(`${item.name} added to cart`);
  }

  function updateCartButton() {
    if (cartBtn) cartBtn.textContent = `Cart (${cart.length})`;
  }

  function renderCartItems() {
    cartItemsList.innerHTML = "";
    if (cart.length === 0) {
      cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
      return;
    }
    cart.forEach((it) => {
      const li = document.createElement("li");
      li.textContent = `${it.name} - ₹${it.price}`;
      cartItemsList.appendChild(li);
    });
  }

  cartBtn?.addEventListener("click", () => {
    renderCartItems();
    cartModal.classList.remove("hidden");
  });
  closeCart?.addEventListener("click", () => cartModal.classList.add("hidden"));
  checkoutBtn?.addEventListener("click", () =>
    alert("Checkout feature coming soon!")
  );

  loginBtn?.addEventListener("click", () => alert("Login form coming soon"));
  signupBtn?.addEventListener("click", () => alert("Signup form coming soon"));
  ordersBtn?.addEventListener("click", () => alert("Orders feature coming soon"));

  loadProducts();
});
