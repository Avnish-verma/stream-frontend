// js/api.js
const BASE_URL = 'http://localhost:5000'; 

// Common fetch options with Automatic Authorization Header
const getFetchOptions = (method, body = null) => {
  // 1. LocalStorage se token nikalna
  const token = localStorage.getItem('auth_token');
  
  // 2. Default headers setup karna
  const headers = { 
    'Content-Type': 'application/json' 
  };

  // 3. Agar token hai, toh usko headers me attach karna
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    credentials: 'include' 
  };
  
  if (body) options.body = JSON.stringify(body);
  return options;
};

// Check if user is authenticated
function checkAuth(requireAuth = true) {
  const token = localStorage.getItem('auth_token');
  
  if (requireAuth && !token) {
    // Agar auth required hai aur token nahi hai, toh login par bhejo
    window.location.href = 'auth.html';
  } else if (!requireAuth && token) {
    // Agar login page par hai aur token hai, toh seedha feed par bhejo
    window.location.href = 'feed.html';
  }
  return token;
}

// Global Logout
function logoutUser() {
  localStorage.removeItem('auth_token');
  window.location.href = 'auth.html';
}