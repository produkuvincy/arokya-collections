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

// Add to Cart with quantity tracking
function addToCart(id) {
  const item = products.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartCount();
}

// Update cart button count
function updateCartCount() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBtn.innerText = `Cart (${totalQty})`;
}

// Open cart modal
cartBtn.onclick = () => {
  renderCart();
  cartModal.classList.remove('hidden');
};

// Close cart modal
closeCart.onclick = () => cartModal.classList.add('hidden');

// Render cart items
function renderCart() {
  cartItemsList.innerHTML = '';
  if (!cart.length) {
    cartItemsList.innerHTML = '<li>Your cart is empty.</li>';
    return;
  }

  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} x ${item.qty} - ₹${(item.price * item.qty).toFixed(2)}`;
    cartItemsList.appendChild(li);
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const liTotal = document.createElement('li');
  liTotal.innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
  cartItemsList.appendChild(liTotal);
}

// Checkout all items in cart
checkoutBtn.onclick = () => {
  if (!cart.length) {
    alert('Your cart is empty!');
    return;
  }
  createRazorpayOrder(cart);
};

// Pay Now for individual product
function payNow(id) {
  const item = products.find(p => p.id === id);
  createRazorpayOrder([{ ...item, qty: 1 }]);
}

// Create Razorpay order
async function createRazorpayOrder(items) {
  const amount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  try {
    const res = await fetch('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const order = await res.json();

    if (!order.id) {
      alert('Failed to create order.');
      return;
    }

    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'Arokya Collections',
      description: 'Jewelry Purchase',
      order_id: order.id,
      handler: function (response) {
        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
        // Clear cart if it was a full checkout
        if (items.length === cart.length) {
          cart = [];
          updateCartCount();
          cartModal.classList.add('hidden');
        }
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999',
      },
      theme: { color: '#d63384' }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert('Something went wrong while creating payment.');
  }
}

renderProducts();
