// Sample Products
const products = [
  { id: 1, name: 'Gold Earrings', price: 1200 },
  { id: 2, name: 'Silver Bangles', price: 900 },
  { id: 3, name: 'Pearl Neckpiece', price: 2500 },
  { id: 4, name: 'Diamond Bracelet', price: 3200 },
];

const productContainer = document.getElementById('products');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const cartItemsList = document.getElementById('cart-items');
const checkoutBtn = document.getElementById('checkout-btn');
const closeCart = document.getElementById('close-cart');

let cart = [];

// Render Products
function renderProducts() {
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
      <button onclick="payNow(${p.id})">Pay Now</button>
    `;
    productContainer.appendChild(div);
  });
}

// Add to Cart
function addToCart(id) {
  const item = products.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  updateCartCount();
}

// Update Cart Count
function updateCartCount() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBtn.innerText = `Cart (${totalQty})`;
}

// Open/Close Cart Modal
cartBtn.addEventListener('click', () => {
  renderCart();
  cartModal.classList.remove('hidden');
});

closeCart.addEventListener('click', () => {
  cartModal.classList.add('hidden');
});

// Render Cart Items
function renderCart() {
  cartItemsList.innerHTML = '';
  if (!cart.length) {
    cartItemsList.innerHTML = '<li>Your cart is empty.</li>';
    return;
  }

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} - ₹${(item.price * item.qty).toFixed(2)}
      <div class="quantity-controls">
        <button onclick="decreaseQty(${index})">-</button>
        <span>${item.qty}</span>
        <button onclick="increaseQty(${index})">+</button>
      </div>
    `;
    cartItemsList.appendChild(li);
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const liTotal = document.createElement('li');
  liTotal.innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
  cartItemsList.appendChild(liTotal);
}

// Quantity Controls
function increaseQty(index) {
  cart[index].qty += 1;
  renderCart();
  updateCartCount();
}

function decreaseQty(index) {
  if (cart[index].qty > 1) cart[index].qty -= 1;
  else cart.splice(index, 1);
  renderCart();
  updateCartCount();
}

// Checkout Cart
checkoutBtn.addEventListener('click', () => {
  if (!cart.length) return alert('Your cart is empty!');
  createRazorpayOrder(cart);
});

// Pay Now for individual product
function payNow(id) {
  const item = products.find(p => p.id === id);
  createRazorpayOrder([{ ...item, qty: 1 }]);
}

// Create Razorpay Order
async function createRazorpayOrder(items) {
  const amount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  try {
    const res = await fetch('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const order = await res.json();

    if (!order.id) return alert('Failed to create order.');

    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'Arokya Collections',
      description: 'Jewelry Purchase',
      order_id: order.id,
      handler: function (response) {
        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
        // Clear cart if full checkout
        if (items.length === cart.length) {
          cart = [];
          updateCartCount();
          cartModal.classList.add('hidden');
        }
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#d63384' }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert('Error creating payment.');
  }
}

// Initialize
renderProducts();
updateCartCount();
