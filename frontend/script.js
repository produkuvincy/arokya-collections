document.addEventListener("DOMContentLoaded", () => {
  // ✅ Backend API base URL
  const API_URL = "";

  // ✅ Elements
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

  // ✅ Hide signup if logged in
  if (token) {
    signupBtn.style.display = "none";
    loginBtn.textContent = "Logout";
  }

  // ✅ Fetch products
  async function loadProducts() {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error("Failed to load products");
      const products = await res.json();
      renderProducts(products);
    } catch (err) {
      console.error(err);
      main.innerHTML = "<p>❌ Failed to load products. Please try again later.</p>";
    }
  }

  // ✅ Render products to UI
  function renderProducts(products) {
    main.innerHTML = "";
    products.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" style="width:150px;height:150px;object-fit:cover;">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button data-id="${p._id}" class="add-to-cart">Add to Cart</button>
      `;
      main.appendChild(div);
    });

    // Attach click handlers to Add to Cart buttons
    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        addToCart(products.find((p) => p._id === id));
      });
    });
  }

  // ✅ Add to cart
  function addToCart(item) {
    cart.push(item);
    cartBtn.textContent = `Cart (${cart.length})`;
  }

  // ✅ Show cart
  cartBtn.addEventListener("click", () => {
    if (loginBtn.textContent === "Logout") {
      cartModal.classList.remove("hidden");
      renderCartItems();
    } else {
      alert("Please login first!");
    }
  });

  // ✅ Close cart
  closeCart.addEventListener("click", () => cartModal.classList.add("hidden"));

  // ✅ Render items in cart modal
  function renderCartItems() {
    cartItemsList.innerHTML = "";
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} - ₹${item.price}`;
      cartItemsList.appendChild(li);
    });
  }

  // ✅ Checkout handler (Razorpay)
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Cart is empty!");

    const amount = cart.reduce((sum, item) => sum + item.price, 0);
    const res = await fetch(`${API_URL}/api/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const order = await res.json();
    if (!order.id) return alert("Order creation failed.");

    const options = {
      key: order.key || "rzp_test_key",
      amount: order.amount,
      currency: "INR",
      name: "Arokya Collections",
      description: "Jewelry Purchase",
      order_id: order.id,
      handler: function (response) {
        alert("✅ Payment Successful: " + response.razorpay_payment_id);
      },
      theme: { color: "#d63384" },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  });

  // ✅ Auth Handlers
  loginBtn.addEventListener("click", () => {
    if (loginBtn.textContent === "Logout") {
      localStorage.removeItem("token");
      location.reload();
    } else {
      const email = prompt("Enter email:");
      const password = prompt("Enter password:");
      login(email, password);
    }
  });

  signupBtn.addEventListener("click", () => {
    const name = prompt("Enter name:");
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");
    signup(name, email, password);
  });

  async function signup(name, email, password) {
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        alert("✅ Signup successful!");
        location.reload();
      } else alert("Signup failed: " + data.message);
    } catch (err) {
      alert("Signup error: " + err.message);
    }
  }

  async function login(email, password) {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        alert("✅ Login successful!");
        location.reload();
      } else alert("Login failed: " + data.message);
    } catch (err) {
      alert("Login error: " + err.message);
    }
  }

  // ✅ Load products on page load
  loadProducts();
});
