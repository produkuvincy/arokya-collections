document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "";

  // ✅ Grab all elements safely
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
  if (token && signupBtn) {
    signupBtn.style.display = "none";
    if (loginBtn) loginBtn.textContent = "Logout";
  }

  // ✅ Attach event listeners safely
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      if (loginBtn && loginBtn.textContent === "Logout") {
        if (cartModal) cartModal.classList.remove("hidden");
        renderCartItems();
      } else {
        alert("Please login first!");
      }
    });
  } else {
    console.warn("⚠️ cartBtn not found in DOM");
  }

  if (closeCart) {
    closeCart.addEventListener("click", () => cartModal?.classList.add("hidden"));
  } else {
    console.warn("⚠️ closeCart button not found");
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      if (cart.length === 0) return alert("Cart is empty!");
      const amount = cart.reduce((sum, item) => sum + item.price, 0);

      try {
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
      } catch (err) {
        alert("Checkout error: " + err.message);
      }
    });
  } else {
    console.warn("⚠️ checkoutBtn not found in DOM");
  }

  // Rest of your logic (loadProducts, renderProducts, addToCart, etc.)
});
