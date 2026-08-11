// js/chat.js
checkAuth(true);

// 1. Connect to backend Socket.io server
const socket = io("http://localhost:5000"); 

let currentUserId = null;
let currentChatPartnerId = null; 

async function initChat() {
  try {
    // 2. Fetch logged-in user's profile to get their MongoDB ID
    const response = await fetch(`${BASE_URL}/profile`, getFetchOptions('GET'));
    const result = await response.json();
    
    if (response.ok && result.success) {
      currentUserId = result.data.userId; // Logged-in user's ID
      
      // 3. Emit join_user event (Just like we did in Hoppscotch)
      socket.emit("join_user", currentUserId);
      console.log("Connected to socket room:", currentUserId);
      
      // Extract partner's ID from the URL (e.g., chat.html?partner=64a1b2c3...)
      const urlParams = new URLSearchParams(window.location.search);
      const partnerId = urlParams.get('partner');
      
      if (partnerId) {
        currentChatPartnerId = partnerId;
        document.getElementById('chat-partner-name').innerText = `Chatting with Partner ID: ${partnerId.substring(0, 6)}...`;
      } else {
        document.getElementById('chat-partner-name').innerText = `No partner selected`;
      }
    }
  } catch (err) {
    console.error("Failed to initialize chat:", err);
  }
}

// 4. Listen for incoming messages
socket.on("receive_message", (data) => {
  const { senderId, text } = data;
  
  // Only display if the message is from the person we are currently chatting with
  if (senderId === currentChatPartnerId) {
    displayMessage(text, 'received');
  }
});

// 5. Send a message
function sendMessage() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();

  if (!text || !currentChatPartnerId || !currentUserId) return;

  // Emit send_message event (Just like we did in Hoppscotch)
  socket.emit("send_message", {
    senderId: currentUserId,
    receiverId: currentChatPartnerId,
    text: text
  });

  // Display the message instantly on our own screen
  displayMessage(text, 'sent');
  input.value = ''; // Clear input field
}

// Helper function to render messages in the UI
function displayMessage(text, type) {
  const messagesArea = document.getElementById('messages-area');
  const msgDiv = document.createElement('div');
  
  msgDiv.className = `msg-bubble ${type === 'sent' ? 'msg-sent' : 'msg-received'}`;
  msgDiv.innerText = text;
  
  messagesArea.appendChild(msgDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight; // Auto-scroll to latest message
}

// Allow sending message with 'Enter' key
document.getElementById('msg-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

initChat();