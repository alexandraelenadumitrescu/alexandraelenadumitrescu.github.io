require('dotenv').config();
const express = require('express');
const { CohereClient } = require('cohere-ai');

const API_KEY = process.env.API_KEY;

if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    console.error("Error: API_KEY is not defined. Please create a .env file and add your Cohere API key.");
    process.exit(1); // Stop the server if the key is not set, still not working
}

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.')); // Serve static files from the current directory

const cohere = new CohereClient({
    token: API_KEY,
});

app.post('/chat', async (req, res) => {
    try {
        if (!req.body.message) {
            return res.status(400).send({ error: 'Message is required' });
        }

        const chatResponse = await cohere.chat({
            message: req.body.message,
        });

        res.send({ reply: chatResponse.text });

    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).send({ error: 'Failed to generate response from AI.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log("Please open chatbot/index.html in your browser to use the chatbot.");
});
