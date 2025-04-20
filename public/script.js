const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const themeToggle = document.getElementById('theme-toggle');
const loginButton = document.getElementById('login-button');

const BASE_URL = 'https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev';
const CHAT_URL = `${BASE_URL}/chat`;
const GOOGLE_AUTH_URL = `${BASE_URL}/auth/google`; // Ensure this matches backend route

function addMessage(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage(message = userInput.value.trim()) {
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
      console.log('Chat Response status:', response.status);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('Chat Response data:', data);
      addMessage(data.reply || 'No reply', false);

      // If response contains a signal to create a Google Doc
      if (data.createDoc) {
        createGoogleDoc(data.reply);
      }
    })
    .catch(error => {
      addMessage('Error: Something went wrong.', false);
      console.error('Chat Fetch error:', error);
    });
}

// Create Google Doc after response with login prompt if needed
function createGoogleDoc(content) {
  fetch(`${BASE_URL}/create-doc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content })
  })
    .then(res => {
      console.log('Doc Creation Response status:', res.status);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in with Google.');
        }
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(doc => {
      if (doc.url) {
        addMessage(`📄 Document created: ${doc.url}`, false);
      } else {
        addMessage(`⚠️ Failed to create document.`, false);
      }
    })
    .catch(err => {
      if (err.message.includes('Authentication required')) {
        addMessage('Please log in with Google to create documents.', false);
      } else {
        addMessage('Failed to create Google Doc.', false);
      }
      console.error('Doc Creation error:', err);
    });
}

// Handle quick questions
document.querySelectorAll('.quick-question').forEach(button => {
  button.addEventListener('click', () => {
    const message = button.getAttribute('data-message');
    sendMessage(message);
  });
});

// Clear chat
function clearChat() {
  chatBox.innerHTML = '';
}

// Toggle dark mode
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Toggle Light Mode' : 'Toggle Dark Mode';
});

// Redirect to Google login with debug
loginButton.addEventListener('click', () => {
  console.log('Attempting to redirect to:', GOOGLE_AUTH_URL);
  try {
    window.location.href = GOOGLE_AUTH_URL;
    console.log('Redirect initiated');
  } catch (error) {
    console.error('Redirect failed:', error);
    addMessage('Error: Login redirect failed.', false);
  }
});

// Enter key support
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});