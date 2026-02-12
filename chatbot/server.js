const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- IMPORTANT ---
// Replace "YOUR_API_KEY" with your actual Google AI Studio API key.
const API_KEY = "YOUR_API_KEY";
// ---

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.')); // Serve static files from the current directory

const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/chat', async (req, res) => {
    try {
        if (!req.body.message) {
            return res.status(400).send({ error: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat();
        const result = await chat.sendMessage(req.body.message);
        const response = await result.response;
        const text = response.text();

        res.send({ reply: text });

    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        // It's good practice to not send detailed internal errors to the client.
        res.status(500).send({ error: 'Failed to generate response from AI.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log("Please open chatbot/index.html in your browser to use the chatbot.");
});
