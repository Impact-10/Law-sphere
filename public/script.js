const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const loginButton = document.getElementById('login-button');

const BASE_URL = 'https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev';
const CHAT_URL = `${BASE_URL}/chat`;
const GOOGLE_AUTH_URL = `${BASE_URL}/auth/google`;

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
    credentials: 'include', // Send cookies for session
    body: JSON.stringify({ message })
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      addMessage(data.reply || 'No reply', false);

      // If response contains a signal to create a Google Doc
      if (data.createDoc) {
        createGoogleDoc(data.reply);
      }
    })
    .catch(error => {
      addMessage('Error: Something went wrong.', false);
      console.error('Fetch error:', error);
    });
}

// Optional: Create Google Doc after response
function createGoogleDoc(content) {
  fetch(`${BASE_URL}/create-doc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content })
  })
    .then(res => res.json())
    .then(doc => {
      if (doc.url) {
        addMessage(`📄 Document created: ${doc.url}`, false);
      } else {
        addMessage(`⚠️ Failed to create document.`, false);
      }
    })
    .catch(err => {
      addMessage('Failed to create Google Doc.', false);
      console.error(err);
    });
}

// Enter key support
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Redirect to Google login
loginButton.addEventListener('click', () => {
  window.location.href = GOOGLE_AUTH_URL;
});
