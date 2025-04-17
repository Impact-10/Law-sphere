const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// In-memory conversation history
const conversation = [
  {
    role: "user",
    parts: [
      {
        text: "You are a legal advice assistant. Provide concise, practical legal advice without disclaimers or lengthy explanations. Maintain the conversation context.",
      },
    ],
  },
];

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message.toLowerCase(); // Normalize for search

  conversation.push({ role: "user", parts: [{ text: userMessage }] });
  if (conversation.length > 10) conversation.shift();

  try {
    const result = await model.generateContent({
      contents: conversation,
    });
    const reply = result.response.text() || "No response generated.";
    if (!reply) console.log("Debug: Empty response from model");

    conversation.push({ role: "model", parts: [{ text: reply }] });

    res.json({ reply });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Legal Chatbot is live");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} - Access at Replit URL`);
});