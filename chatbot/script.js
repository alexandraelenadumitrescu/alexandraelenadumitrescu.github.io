document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const userText = userInput.value.trim();
        if (userText === '') return;

        appendMessage(userText, 'user-message');
        userInput.value = '';

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userText }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.reply) {
                appendMessage(data.reply, 'bot-message');
            } else {
                appendMessage('Error: No reply from bot.', 'bot-message');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            appendMessage('Sorry, something went wrong.', 'bot-message');
        });
    }

    function appendMessage(text, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        messageElement.innerText = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
