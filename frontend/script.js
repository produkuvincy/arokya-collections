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
    div.innerHTML = `<h3>${p.name}</h3><p>₹${p.price}</p><button onclick="addToCart(${p.id})">Add to Cart</button>`;
    productContainer.appendChild(div);
  });
}

function addToCart(id) {
  const item = products.find(p => p.id === id);
  cart.push(item);
  cartBtn.innerText = `Cart (${cart.length})`;
}

cartBtn.onclick = () => {
  cartModal.classList.remove('hidden');
  cartItemsList.innerHTML = '';
  cart.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - ₹${item.price}`;
    cartItemsList.appendChild(li);
  });
};

closeCart.onclick = () => cartModal.classList.add('hidden');

checkoutBtn.onclick = async () => {
  const amount = cart.reduce((sum, item) => sum + item.price, 0);
  const res = await fetch('/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
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
      alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
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
};

renderProducts();
