const productContainer = document.getElementById("main-content");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsList = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCart = document.getElementById("close-cart");

let cart = [];

// ✅ Fetch and display products from backend
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    productContainer.innerHTML = ""; // Clear existing content

    products.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="product-img">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
      `;
      productContainer.appendChild(div);
    });
  } catch (err) {
    productContainer.innerHTML = "<p>⚠️ Failed to load products.</p>";
    console.error(err);
  }
}

// ✅ Add item to cart
function addToCart(id, name, price) {
  cart.push({ id, name, price });
  cartBtn.innerText = `Cart (${cart.length})`;
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

// ✅ Close cart modal
closeCart.onclick = () => cartModal.classList.add("hidden");

// ✅ Checkout and trigger Razorpay
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
      alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
      cart = [];
      cartBtn.innerText = "Cart (0)";
    },
    theme: { color: "#d63384" },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};

// ✅ Initial page load
loadProducts();
