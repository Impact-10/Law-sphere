const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const loginButton = document.getElementById('login-button');

// Backend base URL
const BASE_URL = 'https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev';

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

  fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message })
  })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      addMessage(data.reply || 'No response', false);
    })
    .catch(error => {
      addMessage('Error: Something went wrong.', false);
      console.error('Error:', error);
    });
}

// Allow sending message with Enter key
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Google login redirect (comment out for now due to verification issue)
// loginButton.addEventListener('click', () => {
//   window.location.href = `${BASE_URL}/auth/google`;
// });