// ====================== Firebase Configuration ======================
import { firebaseConfig } from './firebaseConfig.js';

// ====================== API Configuration ======================
const BASE_URL = 'https://0d741327-a5e5-4ad9-a587-70d23bc5bb36-00-3r683pxcjo2u7.pike.replit.dev';
const CHAT_URL = `${BASE_URL}/chat`;
const GOOGLE_AUTH_URL = `${BASE_URL}/auth/google`;

// ====================== DOM Elements ======================
const mainContent = document.getElementById('main-content');
const documentsBrowser = document.getElementById('documents-browser');
const documentGenerator = document.getElementById('document-generator');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const loginButton = document.getElementById('login-button');
const sendBtn = document.getElementById('send-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const fetchDocsBtn = document.getElementById('fetch-docs');
const generateDocBtn = document.getElementById('generate-doc');

// ====================== Global Variables ======================
let activeCategory = 'all';
let categoriesData = {};

// Document Generator State
let currentDocument = null;
let documentQuestions = [];
let documentResponses = {};
let currentQuestionIndex = 0;

// ====================== Firebase Initialization ======================
if (!window.firebase.apps.length) {
  window.firebase.initializeApp(firebaseConfig);
}
const db = window.firebase.firestore();

// ====================== Event Listeners ======================
document.addEventListener('DOMContentLoaded', function() {
  // Chat Functionality
  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage());
  if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Document Buttons
  if (fetchDocsBtn) fetchDocsBtn.addEventListener('click', showDocumentsBrowser);
  if (generateDocBtn) generateDocBtn.addEventListener('click', showDocumentGenerator);

  // Login Button
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = GOOGLE_AUTH_URL;
    });
  }

  // Quick Questions
  document.querySelectorAll('.quick-question').forEach(button => {
    button.addEventListener('click', () => {
      const message = button.getAttribute('data-message');
      sendMessage(message);
    });
  });

  // Navbar Smooth Scroll
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

// ====================== Chatbot Functions ======================
function sendMessage(message = userInput.value.trim()) {
  if (!message) return;
  addMessage(message, true);
  userInput.value = '';

  fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
    .then(response => {
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      addMessage(data.reply || 'No response', false);
    })
    .catch(error => {
      console.error('Chat error:', error);
      addMessage('Sorry, there was an error processing your request.', false);
    });
}

function addMessage(text, isUser) {
  if (!chatBox) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
  if (chatBox) chatBox.innerHTML = '';
}

// ====================== Document Browser Functions ======================
function showDocumentsBrowser() {
  // Create full document browser layout that replaces entire page
  const browserHTML = `
    <div class="documents-container">
      <div class="document-header">
        <div class="document-header-actions">
          <div class="browse-btn active">Browse Documents</div>
          <button class="generate-btn" id="generate-doc-btn">Generate Document</button>
        </div>
        <button class="back-btn" id="back-home-btn">Back to Home</button>
      </div>
      <div class="category-tabs" id="category-tabs">
        <button class="category-tab active" data-category="all">All</button>
      </div>
      <div id="document-content"></div>
    </div>
  `;

  mainContent.style.display = 'none';
  documentGenerator.style.display = 'none';
  documentsBrowser.style.display = 'block';
  documentsBrowser.innerHTML = browserHTML;

  // Set up event listeners for dynamic buttons
  document.getElementById('back-home-btn').addEventListener('click', backToHome);
  document.getElementById('generate-doc-btn').addEventListener('click', showDocumentGenerator);

  // Load documents
  loadDocuments();
}

function backToHome() {
  documentsBrowser.style.display = 'none';
  documentGenerator.style.display = 'none';
  mainContent.style.display = 'block';
}

function loadDocuments() {
  const documentContent = document.getElementById('document-content');
  const categoryTabs = document.getElementById('category-tabs');

  documentContent.innerHTML = '<p style="text-align: center; padding: 20px;">Loading documents...</p>';

  db.collection('legal_documents')
    .get()
    .then((querySnapshot) => {
      categoriesData = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const title = data.title.replace(/\.pdf$|\.doc$/, '');
        const category = determineCategory(title, data.category);
        if (!categoriesData[category]) categoriesData[category] = [];
        categoriesData[category].push({
          title: title,
          url: data.url
        });
      });

      // Create category tabs
      const allCategories = Object.keys(categoriesData).sort();
      // Remove existing tabs except "All"
      const tabs = categoryTabs.querySelectorAll('.category-tab:not([data-category="all"])');
      tabs.forEach(tab => tab.remove());
      // Add category tabs
      allCategories.forEach(category => {
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        tab.textContent = category;
        tab.dataset.category = category;
        tab.addEventListener('click', () => {
          document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          displayDocumentsByCategory(category, documentContent);
        });
        categoryTabs.appendChild(tab);
      });

      // Display all documents initially
      displayDocumentsByCategory('all', documentContent);

      // Add success message
      const totalDocs = Object.values(categoriesData).reduce((acc, docs) => acc + docs.length, 0);
      const messageElement = document.createElement('div');
      messageElement.className = 'bot-message';
      messageElement.textContent = `Fetched ${totalDocs} documents across ${allCategories.length} categories.`;
      documentContent.prepend(messageElement);
    })
    .catch((error) => {
      documentContent.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Error loading documents: ${error.message}</p>`;
      console.error('Firestore error:', error);
    });
}

function determineCategory(title, existingCategory) {
  const categories = {
    'Form': ['form', 'application', 'declaration', 'nomination', 'certificate', 'letter'],
    'Bank Documents': ['bank', 'account', 'nach', 'statement', 'transfer'],
    'Legal Documents': ['legal', 'affidavit', 'power of attorney', 'agreement', 'contract'],
    'Address Proof': ['address', 'residence', 'utility', 'rent']
  };
  if (existingCategory && Object.keys(categories).includes(existingCategory)) {
    return existingCategory;
  }
  const lowercaseTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowercaseTitle.includes(keyword))) {
      return category;
    }
  }
  return 'Miscellaneous';
}

function displayDocumentsByCategory(category, contentElement) {
  contentElement.innerHTML = '';
  if (category === 'all') {
    Object.entries(categoriesData).forEach(([cat, documents]) => {
      if (documents.length > 0) {
        const categoryElement = createCategoryElement(cat, documents);
        contentElement.appendChild(categoryElement);
      }
    });
  } else {
    if (categoriesData[category] && categoriesData[category].length > 0) {
      const categoryElement = createCategoryElement(category, categoriesData[category]);
      contentElement.appendChild(categoryElement);
    } else {
      contentElement.innerHTML = '<p style="text-align: center; padding: 20px;">No documents found in this category.</p>';
    }
  }
}

function createCategoryElement(category, documents) {
  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'document-category';
  const categoryTitle = document.createElement('h2');
  categoryTitle.className = 'document-category-title';
  categoryTitle.textContent = category;
  categoryDiv.appendChild(categoryTitle);
  const documentsList = document.createElement('div');
  documentsList.className = 'document-list';
  documents.forEach(doc => {
    const docItem = document.createElement('div');
    docItem.className = 'document-item';
    docItem.innerHTML = `
      <div class="document-title">${doc.title}</div>
      <div class="document-action">Download ${doc.title}</div>
    `;
    docItem.addEventListener('click', () => downloadDocument(doc.url, doc.title));
    documentsList.appendChild(docItem);
  });
  categoryDiv.appendChild(documentsList);
  return categoryDiv;
}

function downloadDocument(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ====================== Document Generator Functions ======================
async function showDocumentGenerator() {
  mainContent.style.display = 'none';
  documentsBrowser.style.display = 'none';
  documentGenerator.style.display = 'block';

  documentGenerator.innerHTML = `
    <div class="generator-container">
      <div class="generator-header">
        <h2>AI Document Generator</h2>
        <button class="back-home-btn" id="back-home-gen-btn">Back to Home</button>
      </div>
      <div class="generator-steps">
        <div id="template-selection" class="step active">
          <h3>1. Select Document Template</h3>
          <div class="template-grid" id="template-grid"></div>
        </div>
        <div id="questionnaire" class="step">
          <h3>2. Answer Questions</h3>
          <div id="questions-container"></div>
          <div class="question-nav">
            <button id="prev-question">Previous</button>
            <button id="next-question">Next</button>
          </div>
        </div>
        <div id="document-preview" class="step">
          <h3>3. Preview & Download</h3>
          <div id="preview-content"></div>
          <button id="download-doc">Download Document</button>
          <button id="start-over">Start Over</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-home-gen-btn').addEventListener('click', backToHome);

  await loadTemplates();
  setupGeneratorEventListeners();
}

async function loadTemplates() {
  const templateGrid = document.getElementById('template-grid');
  templateGrid.innerHTML = '<div class="loading">Loading templates...</div>';
  try {
    const querySnapshot = await db.collection('legal_documents').get();
    templateGrid.innerHTML = '';
    querySnapshot.forEach(doc => {
      const template = doc.data();
      const templateCard = document.createElement('div');
      templateCard.className = 'template-card';
      templateCard.innerHTML = `
        <h4>${template.title}</h4>
        <p>${template.description || 'Legal document template'}</p>
      `;
      templateCard.addEventListener('click', () => selectTemplate(template.title));
      templateGrid.appendChild(templateCard);
    });
  } catch (error) {
    templateGrid.innerHTML = '<div class="error">Error loading templates</div>';
  }
}

async function selectTemplate(templateTitle) {
  currentDocument = templateTitle;
  document.querySelector('#template-selection').classList.remove('active');
  document.querySelector('#questionnaire').classList.add('active');
  currentQuestionIndex = 0;
  documentResponses = {};
  try {
    const response = await fetch(`${BASE_URL}/get-document-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentTitle: templateTitle })
    });
    const data = await response.json();
    documentQuestions = data.questions;
    renderQuestions();
  } catch (error) {
    alert('Error loading questions');
  }
}

function renderQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  documentQuestions.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = `question${index === 0 ? ' active' : ''}`;
    questionDiv.innerHTML = `
      <label>${question.question}</label>
      <input type="text" id="q-${question.id}" 
             data-field="${question.fieldName}" 
             ${question.required ? 'required' : ''}>
    `;
    container.appendChild(questionDiv);
  });
}

function setupGeneratorEventListeners() {
  document.getElementById('prev-question').addEventListener('click', () => {
    const questions = document.querySelectorAll('.question');
    if (currentQuestionIndex > 0) {
      questions[currentQuestionIndex].classList.remove('active');
      currentQuestionIndex--;
      questions[currentQuestionIndex].classList.add('active');
    }
  });

  document.getElementById('next-question').addEventListener('click', async () => {
    const questions = document.querySelectorAll('.question');
    const currentQuestion = questions[currentQuestionIndex];
    const input = currentQuestion.querySelector('input');
    documentResponses[input.dataset.field] = input.value;
    if (currentQuestionIndex < documentQuestions.length - 1) {
      currentQuestion.classList.remove('active');
      currentQuestionIndex++;
      questions[currentQuestionIndex].classList.add('active');
    } else {
      await generateDocument();
    }
  });

  document.getElementById('start-over').addEventListener('click', () => {
    document.querySelector('#template-selection').classList.add('active');
    document.querySelector('#questionnaire').classList.remove('active');
    document.querySelector('#document-preview').classList.remove('active');
    currentDocument = null;
    documentQuestions = [];
    documentResponses = {};
    currentQuestionIndex = 0;
    loadTemplates();
  });

  document.getElementById('download-doc').addEventListener('click', () => {
    const pdfData = document.getElementById('download-doc').dataset.pdf;
    const blob = b64toBlob(pdfData, 'application/pdf');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

async function generateDocument() {
  try {
    const response = await fetch(`${BASE_URL}/generate-filled-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentTitle: currentDocument,
        responses: documentResponses
      })
    });
    const data = await response.json();
    document.querySelector('#questionnaire').classList.remove('active');
    document.querySelector('#document-preview').classList.add('active');
    document.getElementById('preview-content').innerHTML = 
      data.documentContent.replace(/\n/g, '<br>');
    document.getElementById('download-doc').dataset.pdf = data.pdfBase64;
  } catch (error) {
    alert('Error generating document');
  }
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}
