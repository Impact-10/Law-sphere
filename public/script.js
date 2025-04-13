// Function to add messages to the chat box
function addMessage(message, isUser = false) {
    const chatBox = document.getElementById('chatBox');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.className = isUser ? 'user-message' : 'bot-message';
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
}

// Function to send query to Replit chatbot
async function sendChatQuery() {
    const userInput = document.getElementById('userInput').value.trim();
    if (!userInput) return;

    // Display user message
    addMessage(userInput, true);
    document.getElementById('userInput').value = '';

    try {
        const response = await fetch('https://<your-app>.repl.co/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userInput })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Display bot response
        addMessage(data.reply || 'Sorry, I couldn’t process that.');
    } catch (error) {
        addMessage('Error: Could not connect to the chatbot. Please try again later.');
        console.error('Error:', error);
    }
}

// Allow sending with Enter key
document.getElementById('userInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') sendChatQuery();
});