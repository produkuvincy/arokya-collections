// ======================
//  User Auth Management
// ======================

// HTML elements
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const ordersBtn = document.getElementById("orders-btn");

// Function to check if the user is logged in
function checkAuthStatus() {
  const token = localStorage.getItem("authToken"); // token saved after login
  if (token) {
    // ✅ User is logged in
    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    ordersBtn.style.display = "inline-block";

    // Add logout button dynamically
    if (!document.getElementById("logout-btn")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logout-btn";
      logoutBtn.textContent = "Logout";
      logoutBtn.onclick = handleLogout;
      document.querySelector("nav").appendChild(logoutBtn);
    }
  } else {
    // 🚫 User not logged in
    signupBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    ordersBtn.style.display = "none";
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.remove();
  }
}

// Function to handle logout
function handleLogout() {
  localStorage.removeItem("authToken");
  alert("You have been logged out!");
  checkAuthStatus(); // refresh buttons
}

// Call on page load
checkAuthStatus();
