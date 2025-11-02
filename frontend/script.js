// --- Product List ---
const products = [
  { id: 1, name: 'Gold Earrings', price: 1200, image: 'earrings.jpg' },
  { id: 2, name: 'Silver Bangles', price: 900, image: 'bangles.jpg' },
  { id: 3, name: 'Pearl Neckpiece', price: 2500, image: 'neckpiece.jpg' },
  { id: 4, name: 'Diamond Bracelet', price: 3200, image: 'bracelet.jpg' },
];

// --- DOM Elements ---
const productContainer = document.getElementById('main-content');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const cartItemsList = document.getElementById('cart-items');
const checkoutBtn = document.getElementById('checkout-btn');
const closeCart = document.getElementById('close-cart');

// --- State ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- Render Products ---
function renderProducts() {
  productContainer.innerHTML = '<h2>Featured Products</h2><div class="product-grid"></div>';
  const grid = productContainer.querySelector('.product-grid');

  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>
      <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
    `;
    grid.appendChild(div);
  });

  // Attach event listeners after rendering
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      addToCart(id);
    });
  });
}

// --- Add to Cart ---
function addToCart(id) {
  const item = products.find(p => p.id === id);
  const existing = cart.find(p => p.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartUI();
  saveCart();
}

// --- Update Cart UI ---
function updateCartUI() {
  cartBtn.innerText = `Cart (${cart.reduce((sum, i) => sum + i.qty, 0)})`;
}

// --- Open Cart ---
cartBtn.onclick = () => {
  cartModal.classList.remove('hidden');
  renderCartItems();
};

// --- Render Cart Items ---
function renderCartItems() {
  cartItemsList.innerHTML = '';
  if (cart.length === 0) {
    cartItemsList.innerHTML = '<li>Your cart is empty</li>';
    return;
  }

  cart.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} - ₹${item.price} x ${item.qty}
      <button onclick="removeItem(${item.id})">❌</button>
    `;
    cartItemsList.appendChild(li);
  });
}

// --- Remove from Cart ---
function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCartItems();
  updateCartUI();
}

// --- Checkout ---
checkoutBtn.onclick = async () => {
  const amount = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (amount === 0) return alert("Your cart is empty!");

  const res = await fetch('/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const order = await res.json();

  const options = {
    key: order.key,
    amount: order.amount,
    currency: 'INR',
    name: 'Arokya Collections',
    description: 'Jewelry Purchase',
    order_id: order.id,
    handler: function (response) {
      alert('✅ Payment Successful! ID: ' + response.razorpay_payment_id);
      cart = [];
      saveCart();
      updateCartUI();
      cartModal.classList.add('hidden');
    },
    prefill: {
      name: 'Customer',
      email: 'customer@example.com',
      contact: '9999999999',
    },
    theme: { color: '#d63384' },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};

// --- Helpers ---
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}
closeCart.onclick = () => cartModal.classList.add('hidden');

// --- Initialize ---
renderProducts();
updateCartUI();
