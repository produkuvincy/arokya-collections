const cart = [];
const cartButton = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const checkoutButton = document.getElementById("checkout-btn");
const closeCartButton = document.getElementById("close-cart");

cartButton.addEventListener("click", () => {
  renderCart();
  cartModal.style.display = "block";
});

closeCartButton.addEventListener("click", () => {
  cartModal.style.display = "none";
});

// Add to cart
function addToCart(name, price) {
  cart.push({ name, price });
  updateCartCount();
}

function updateCartCount() {
  document.getElementById("cart-count").textContent = cart.length;
}

function renderCart() {
  cartItemsContainer.innerHTML = "";
  let total = 0;
  cart.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = `${item.name} - ₹${item.price}`;
    cartItemsContainer.appendChild(div);
    total += item.price;
  });

  const totalDiv = document.createElement("div");
  totalDiv.style.marginTop = "10px";
  totalDiv.innerHTML = `<strong>Total: ₹${total}</strong>`;
  cartItemsContainer.appendChild(totalDiv);

  checkoutButton.onclick = () => checkout(total);
}

// ✅ Checkout with Razorpay
async function checkout(amount) {
  if (amount <= 0) {
    alert("Your cart is empty!");
    return;
  }

  try {
    // Create order from backend
    const response = await fetch("/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    // Ensure JSON response
    const data = await response.json();

    if (!response.ok) {
      console.error("Server error:", data);
      alert("Server error while creating order.");
      return;
    }

    // Initialize Razorpay payment
    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      name: "Arokya Collections",
      description: "Jewelry Purchase",
      order_id: data.id,
      handler: function (response) {
        alert("✅ Payment successful! Payment ID: " + response.razorpay_payment_id);
        cart.length = 0;
        updateCartCount();
        cartModal.style.display = "none";
      },
      prefill: {
        name: "Customer Name",
        email: "customer@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#c2185b",
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Checkout error:", err);
    alert("❌ Unable to start payment. Please try again.");
  }
}
