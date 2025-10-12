// ------------------ INITIAL SETUP ------------------
const mainContent = document.getElementById("main-content");
const authContainer = document.getElementById("auth-container");
const ordersContainer = document.getElementById("orders-container");
const authTitle = document.getElementById("auth-title");
const authForm = document.getElementById("auth-form");
const authClose = document.getElementById("auth-close");
const ordersList = document.getElementById("orders-list");
const ordersClose = document.getElementById("orders-close");

const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const ordersBtn = document.getElementById("orders-btn");

const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsList = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCart = document.getElementById("close-cart");

let cart = [];
let token = localStorage.getItem("token") || null;

// ------------------ AUTH ------------------
function showAuth(type) {
  authContainer.classList.remove("hidden");
  authTitle.textContent = type === "login" ? "Login" : "Sign Up";
  authForm.dataset.type = type;
}
function hideAuth() { authContainer.classList.add("hidden"); }
loginBtn.onclick = () => showAuth("login");
signupBtn.onclick = () => showAuth("signup");
authClose.onclick = hideAuth;

authForm.onsubmit = async e => {
  e.preventDefault();
  const type = authForm.dataset.type;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const body = type === "signup" ? { name, email, password } : { email, password };

  const res = await fetch(`/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert(type === "signup" ? "Signup successful" : "Login successful");
    hideAuth();
  } else {
    alert(data.error || "Error");
  }
};

// ------------------ ORDERS ------------------
ordersBtn.onclick = async () => {
  if (!token) return alert("Please login first!");
  ordersContainer.classList.remove("hidden");
  ordersList.innerHTML = "<li>Loading...</li>";
  const res = await fetch("/orders", { headers: { Authorization: "Bearer " + token } });
  const data = await res.json();
  if (data.orders) {
    ordersList.innerHTML = "";
    data.orders.forEach(o => {
      const li = document.createElement("li");
      li.textContent = `${o.orderId} - ₹${o.amount} - ${o.status}`;
      ordersList.appendChild(li);
    });
  } else {
    ordersList.innerHTML = "<li>No orders found.</li>";
  }
};
ordersClose.onclick = () => ordersContainer.classList.add("hidden");

// ------------------ PRODUCTS ------------------
const products = [
  { id: 1, name: "Gold Earrings", price: 1200 },
  { id: 2, name: "Silver Bangles", price: 900 },
  { id: 3, name: "Pearl Neckpiece", price: 2500 },
  { id: 4, name: "Diamond Bracelet", price: 3200 },
];
const productContainer = document.getElementById("products");

function renderProducts() {
  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
      <button onclick="payNow(${p.id})">Pay Now</button>
    `;
    productContainer.appendChild(div);
  });
}

// ------------------ CART ------------------
function addToCart(id) {
  const item = products.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  updateCartCount();
}
function updateCartCount() {
  const totalQty = cart.reduce((sum,i)=>sum+i.qty,0);
  cartBtn.innerText = `Cart (${totalQty})`;
}
cartBtn.onclick = () => { renderCart(); cartModal.classList.remove("hidden"); };
closeCart.onclick = () => cartModal.classList.add("hidden");

function renderCart() {
  cartItemsList.innerHTML = "";
  if (!cart.length) { cartItemsList.innerHTML="<li>Your cart is empty.</li>"; return; }
  cart.forEach((item,i)=>{
    const li=document.createElement("li");
    li.innerHTML = `${item.name} - ₹${item.price*item.qty}
      <div class="quantity-controls">
        <button onclick="decreaseQty(${i})">-</button>
        <span>${item.qty}</span>
        <button onclick="increaseQty(${i})">+</button>
      </div>`;
    cartItemsList.appendChild(li);
  });
  const total=cart.reduce((sum,i)=>sum+i.price*i.qty,0);
  const liTotal=document.createElement("li");
  liTotal.innerHTML=`<strong>Total: ₹${total}</strong>`;
  cartItemsList.appendChild(liTotal);
}
function increaseQty(i){ cart[i].qty++; renderCart(); updateCartCount(); }
function decreaseQty(i){ if(cart[i].qty>1) cart[i].qty--; else cart.splice(i,1); renderCart(); updateCartCount(); }

// ------------------ RAZORPAY ------------------
checkoutBtn.onclick = () => {
  if (!cart.length) return alert("Cart is empty!");
  if (!token) return alert("Please login to checkout!");
  createRazorpayOrder(cart);
};

function payNow(id){
  if (!token) return alert("Please login first!");
  const item = products.find(p=>p.id===id);
  createRazorpayOrder([{ ...item, qty:1 }]);
}

async function createRazorpayOrder(items){
  const amount=items.reduce((sum,i)=>sum+i.price*i.qty,0);
  try{
    const res=await fetch('/create-order',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({amount})
    });
    const order=await res.json();
    const options={
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: "Arokya Collections",
      description:"Jewelry Purchase",
      order_id: order.id,
      handler: async function(response){
        alert("Payment Successful! ID: "+response.razorpay_payment_id);
        // Save order to user
        await fetch("/orders",{
          method:"POST",
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
          body: JSON.stringify({ orderId: response.razorpay_order_id, amount: order.amount, currency: order.currency, status:"paid" })
        });
        if(items.length===cart.length){ cart=[]; updateCartCount(); cartModal.classList.add("hidden"); }
      },
      prefill:{name:"",email:"",contact:""},
      theme:{color:"#d63384"}
    };
    const rzp=new Razorpay(options);
    rzp.open();
  }catch(err){ console.error(err); alert("Error creating payment"); }
}

// ------------------ INIT ------------------
renderProducts();
updateCartCount();
