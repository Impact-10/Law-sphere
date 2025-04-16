const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

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

  fetch('https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  .then(response => response.json())
  .then(data => {
    addMessage(data.reply, false);
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