// js/auth.js
// Run checkAuth: If already logged in, send them to feed.html
checkAuth(false); 

function toggleAuth() {
  document.getElementById('login-section').classList.toggle('hidden');
  document.getElementById('register-section').classList.toggle('hidden');
}

async function loginUser() {
  const userId = document.getElementById('login-userid').value.trim();
  const password = document.getElementById('login-password').value;
  const alertBox = document.getElementById('login-alert');

  if (!userId || !password) return alertBox.innerText = "Please enter credentials.";

  alertBox.style.color = '#262626';
  alertBox.innerText = "Logging in...";

  try {
    // Calls the login route[cite: 5, 6]
    const response = await fetch(`${BASE_URL}/login`, getFetchOptions('POST', { userId, password }));
    const data = await response.json();
console.log("Login Response:", data);
    if (response.ok && data.token) {
      localStorage.setItem('auth_token', data.token);
      window.location.href = 'feed.html'; // Redirect to feed
    } else {
      alertBox.style.color = '#ed4956';
      alertBox.innerText = data.message || "Invalid credentials.";
    }
  } catch (err) {
    alertBox.style.color = '#ed4956';
    alertBox.innerText = "Network Error.";
  }
}

// (You can add your registerUser() and verifyOtp() functions here similar to the previous implementation)