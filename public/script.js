const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
// const loginButton = document.getElementById('login-button'); // Removed

// Backend chat URL (hardcoded to your current Replit URL)
const CHAT_URL = 'https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev/chat';

function addMessage(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, true);
  userInput.value = '';

  fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message })
  })
    .then(response => {
      console.log('Response status:', response.status); // Debug log
      return response.json();
    })
    .then(data => {
      addMessage(data.reply, false);
    })
    .catch(error => {
      addMessage('Error: Something went wrong.', false);
      console.error('Fetch error:', error);
    });
}

// Allow sending message with Enter key
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});