function sendMessage() {
    let userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;

    let chatBox = document.getElementById("chat-box");

    let userMessage = document.createElement("div");
    userMessage.className = "chat-message user";
    userMessage.innerText = userInput;
    chatBox.appendChild(userMessage);

    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        let botMessage = document.createElement("div");
        botMessage.className = "chat-message bot";
        
        if (userInput.toLowerCase().includes("document")) {
            botMessage.innerText = "Sure! What type of legal document do you need?";
        } else if (userInput.toLowerCase().includes("service")) {
            botMessage.innerText = "We provide legal consultation, document preparation, and more. How can we assist you?";
        } else {
            botMessage.innerText = "I'm here to help! Can you clarify your question?";
        }

        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);

    document.getElementById("user-input").value = "";
}
