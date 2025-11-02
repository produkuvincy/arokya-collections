const mainContent = document.getElementById("main-content");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsList = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCart = document.getElementById("close-cart");

let cart = [];

// ✅ Load products on page load
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    mainContent.innerHTML = "";
    products.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" width="150">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
      `;
      mainContent.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    mainContent.innerHTML = "<p>⚠️ Failed to load products.</p>";
  }
}

// ✅ Add product to cart
function addToCart(id, name, price) {
  cart.push({ id, name, price });
  cartBtn.textContent = `Cart (${cart.length})`;
}

// ✅ Show cart
cartBtn.onclick = () => {
  cartModal.classList.remove("hidden");
  cartItemsList.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ₹${item.price}`;
    cartItemsList.appendChild(li);
  });
};

// ✅ Close cart
closeCart.onclick = () => cartModal.classList.add("hidden");

// ✅ Checkout (Razorpay)
checkoutBtn.onclick = async () => {
  const amount = cart.reduce((sum, item) => sum + item.price, 0);
  if (amount <= 0) return alert("Your cart is empty!");

  const res = await fetch("/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const order = await res.json();

  const options = {
    key: order.key,
    amount: order.amount,
    currency: "INR",
    name: "Arokya Collections",
    description: "Jewelry Purchase",
    order_id: order.id,
    handler: function (response) {
      alert("✅ Payment Successful: " + response.razorpay_payment_id);
      cart = [];
      cartBtn.textContent = "Cart (0)";
    },
    theme: { color: "#d63384" },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};

// ✅ Load products initially
loadProducts();
