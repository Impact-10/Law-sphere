// ====================== Global Variables ======================
const mainContent = document.getElementById('main-content');
const documentsBrowser = document.getElementById('documents-browser');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const loginButton = document.getElementById('login-button');
const sendBtn = document.getElementById('send-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const fetchDocsBtn = document.getElementById('fetch-docs');

// ====================== Firebase Configuration ======================
const firebaseConfig = {
  apiKey: "AIzaSyBoiTgE744HFmOd7rFajV1k-nmsIETjOLs",
  authDomain: "law-sphere.firebaseapp.com",
  projectId: "law-sphere",
  storageBucket: "law-sphere.firebasestorage.app",
  messagingSenderId: "662426188020",
  appId: "1:662426188020:web:532de487ccfb6fe70646a1",
  measurementId: "G-SXSJBVD62M"
};

// ====================== Document Categories Configuration ======================
const categories = {
  'Identity Proof': { desc: 'Government-issued identity documents', keywords: ['aadhaar', 'pan', 'passport'] },
  'Address Proof': { desc: 'Documents to verify residential address', keywords: ['utility', 'rent', 'agreement'] },
  'Bank Documents': { desc: 'Banking-related forms or statements', keywords: ['nach', 'bank', 'statement'] },
  'Income Proof': { desc: 'Documents to prove income', keywords: ['salary', 'itr'] },
  'Education Documents': { desc: 'Academic credentials', keywords: ['degree', 'marksheet'] },
  'Employment Documents': { desc: 'Job-related documents', keywords: ['offer', 'experience'] },
  'Legal Documents': { desc: 'Legal declarations and authorizations', keywords: ['affidavit', 'power of attorney'] },
  'Health Documents': { desc: 'Health or insurance records', keywords: ['insurance', 'medical'] },
  'Form': { desc: 'Various application and legal forms', keywords: [
    'form', 'affidavit', 'agreement', 'application', 'complaint', 'petition',
    'contract', 'template', 'registration', 'license', 'licence', 'claim',
    'nomination', 'declaration', 'certificate', 'renewal', 'format', 'bond'
  ] },
  'Miscellaneous': { desc: 'Other uncategorized documents', keywords: [] }
};

// ====================== API Configuration ======================
const BASE_URL = 'https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev';
const CHAT_URL = `${BASE_URL}/chat`;
const GOOGLE_AUTH_URL = `${BASE_URL}/auth/google`;

// ====================== Document Variables ======================
let activeCategory = 'all';
let latestCategoriesData = {};

// ====================== Page Navigation Functions ======================
// Expose backToHome to global scope for HTML onclick
window.backToHome = function() {
  documentsBrowser.style.display = 'none';
  mainContent.style.display = 'block';
};

// Show document browser
function showDocumentsBrowser() {
  mainContent.style.display = 'none';
  documentsBrowser.style.display = 'block';
  renderDocumentsBrowser();
}

// Render document browser UI
function renderDocumentsBrowser() {
  documentsBrowser.innerHTML = `
    <div class="browser-header">
      <h1 class="browser-title">Law Sphere - Documents</h1>
      <button class="back-home-btn" onclick="backToHome()">Back to Home</button>
    </div>
    <div id="doc-categories"></div>
  `;
  
  // Initialize Firebase if needed
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    loadFirebaseScripts();
  } else {
    fetchDocuments();
  }
}

function loadFirebaseScripts() {
  const script1 = document.createElement('script');
  script1.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
  script1.onload = () => {
    const script2 = document.createElement('script');
    script2.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js";
    script2.onload = () => {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      fetchDocuments();
    };
    document.body.appendChild(script2);
  };
  document.body.appendChild(script1);
}

// ====================== Chatbot Functions ======================
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
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      addMessage(data.reply || 'No reply', false);
      if (data.createDoc) createGoogleDoc(data.reply);
    })
    .catch(error => {
      addMessage('Error: Something went wrong.', false);
      console.error('Chat Fetch error:', error);
    });
}

function createGoogleDoc(content) {
  fetch(`${BASE_URL}/create-doc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content })
  })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) throw new Error('Authentication required. Please log in with Google.');
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

function clearChat() {
  chatBox.innerHTML = '';
}

// ====================== Document Functions ======================
function addDocMessage(message) {
  const docCategories = document.getElementById('doc-categories');
  if (!docCategories) return;

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', 'bot-message');
  messageDiv.textContent = message;
  docCategories.appendChild(messageDiv);
}

function fetchDocuments() {
  const docCategories = document.getElementById('doc-categories');
  if (!docCategories) return;

  docCategories.innerHTML = '<p class="loading">Loading documents...</p>';
  const categoriesData = {};

  firebase.firestore().collection('legal_documents')
    .get()
    .then((querySnapshot) => {
      docCategories.innerHTML = '';
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let category = 'Miscellaneous';
        const filename = data.title.toLowerCase().replace(/\.pdf$|\.doc$/, '');
        
        for (const [cat, { keywords }] of Object.entries(categories)) {
          if (data.category === cat || keywords.some(k => filename.includes(k))) {
            category = cat;
            break;
          }
        }
        
        if (!categoriesData[category]) categoriesData[category] = [];
        categoriesData[category].push({ title: filename, url: data.url, desc: `Download ${filename}` });
      });

      latestCategoriesData = categoriesData;

      // Create category buttons only for categories with documents
      const categoryBar = document.createElement('div');
      categoryBar.className = 'category-bar';
      
      const allButton = document.createElement('button');
      allButton.textContent = 'All';
      allButton.className = 'category-btn';
      allButton.addEventListener('click', () => switchCategory('all'));
      categoryBar.appendChild(allButton);
      
      const validCategories = Object.keys(categoriesData).filter(cat => categoriesData[cat].length > 0);
      validCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = 'category-btn';
        btn.addEventListener('click', () => switchCategory(cat));
        categoryBar.appendChild(btn);
      });
      
      docCategories.appendChild(categoryBar);
      switchCategory(activeCategory, categoriesData);
      addDocMessage(`Fetched ${querySnapshot.size} documents across ${validCategories.length} categories.`);
    })
    .catch((error) => {
      addDocMessage('Error fetching documents: ' + error.message);
      console.error('Firestore fetch error:', error);
    });
}

function switchCategory(category, data = null) {
  const docCategories = document.getElementById('doc-categories');
  if (!docCategories) return;

  activeCategory = category;
  const categoriesData = data || latestCategoriesData;

  // Remove old category content (but keep the category bar and messages)
  const oldContent = docCategories.querySelector('.category-content');
  if (oldContent) oldContent.remove();

  // Update active state on category buttons
  docCategories.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === category || (category === 'all' && btn.textContent === 'All'));
  });

  // Build new content
  const content = document.createElement('div');
  content.className = 'category-content';
  
  const displayCategories = category === 'all'
    ? Object.entries(categoriesData)
    : [[category, categoriesData[category]]];

  displayCategories.forEach(([cat, docs]) => {
    if (categoriesData[cat]?.length > 0) {
      const catDiv = document.createElement('div');
      catDiv.className = 'category-section';
      catDiv.innerHTML = `<h2>${cat}</h2>`; // No question mark after category
      
      const table = document.createElement('table');
      table.className = 'doc-table';
      
      docs.forEach(doc => {
        const row = table.insertRow();
        const cellTitle = row.insertCell(0);
        const cellDesc = row.insertCell(1);
        
        cellTitle.textContent = doc.title; // No icons
        cellDesc.textContent = doc.desc;
        
        cellTitle.className = 'doc-title';
        cellDesc.className = 'doc-desc';
        
        row.addEventListener('click', () => downloadFile(doc.url, doc.title + '.pdf'));
      });
      
      catDiv.appendChild(table);
      content.appendChild(catDiv);
    }
  });

  // Append the new content after the category bar (and after any messages)
  const bar = docCategories.querySelector('.category-bar');
  if (bar) {
    let insertAfter = bar;
    let next = insertAfter.nextSibling;
    while (next && next.classList && next.classList.contains('bot-message')) {
      insertAfter = next;
      next = insertAfter.nextSibling;
    }
    insertAfter.parentNode.insertBefore(content, insertAfter.nextSibling);
  } else {
    docCategories.appendChild(content);
  }
}

function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ====================== Event Listeners ======================
document.addEventListener('DOMContentLoaded', function() {
  // Chat event listeners
  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage());
  if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  // Login
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = GOOGLE_AUTH_URL;
    });
  }

  // Quick question buttons
  document.querySelectorAll('.quick-question').forEach(button => {
    button.addEventListener('click', () => {
      const message = button.getAttribute('data-message');
      sendMessage(message);
    });
  });
  
  // Fetch documents button
  if (fetchDocsBtn) {
    fetchDocsBtn.addEventListener('click', showDocumentsBrowser);
  }
  
  // Smooth scroll for navbar
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
});
