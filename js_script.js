const chatContainer = document.getElementById('messages');
const input = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const newConversationButton = document.getElementById('newConversation');
const conversationList = document.getElementById('conversationList');

let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
let currentConversationId = conversations.length > 0 ? conversations[0].id : null;

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createNewConversation() {
    const id = generateId();
    const conversation = {
        id,
        title: 'New Conversation',
        messages: [{ role: 'system', content: 'You are a helpful AI assistant powered by GPT-4o.' }]
    };
    conversations.unshift(conversation);
    saveConversations();
    switchConversation(id);
    addMessage('assistant', 'Hello! I\'m powered by GPT-4o. How can I help you today?');
}

function switchConversation(id) {
    currentConversationId = id;
    const conv = conversations.find(c => c.id === id);
    chatContainer.innerHTML = '';
    conv.messages.forEach(msg => {
        if (msg.role !== 'system') {
            addMessage(msg.role, msg.content, msg.role === 'user');
        }
    });
    updateConversationList();
}

function saveConversations() {
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

function updateConversationList() {
    conversationList.innerHTML = '';
    conversations.forEach(conv => {
        const div = document.createElement('div');
        div.className = `conversation-item p-3 rounded-lg cursor-pointer transition-all duration-300 ${conv.id === currentConversationId ? 'active bg-gray-200 font-medium' : 'hover:bg-gray-100'}`;
        div.textContent = conv.title;
        div.onclick = () => switchConversation(conv.id);
        conversationList.appendChild(div);
    });
}

function updateConversationTitle() {
    if (conversations.length === 0) return;
    const conv = conversations.find(c => c.id === currentConversationId);
    const firstUserMessage = conv.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
        conv.title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
        saveConversations();
        updateConversationList();
    }
}

function addMessage(role, content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message flex ${isUser ? 'justify-end' : 'justify-start'}`;
    const bubbleClass = isUser ? 'user-bubble message-bubble' : 'ai-bubble message-bubble';
    messageDiv.innerHTML = `<div class="${bubbleClass}">${content}</div>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text, true);
    const conv = conversations.find(c => c.id === currentConversationId);
    conv.messages.push({ role: 'user', content: text });
    updateConversationTitle();
    saveConversations();
    input.value = '';

    sendButton.disabled = true;
    sendButton.innerHTML = '<span class="animate-spin">⏳</span> Thinking...';

    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 30000));
        const responsePromise = puter.ai.chat({
            model: 'gpt-4o',
            messages: conv.messages,
            temperature: 0.7,
            max_tokens: 500
        });
        const response = await Promise.race([responsePromise, timeoutPromise]);
        const aiResponse = response.choices[0].message.content;
        addMessage('assistant', aiResponse);
        conv.messages.push({ role: 'assistant', content: aiResponse });
        saveConversations();
    } catch (error) {
        addMessage('assistant', `Sorry, there was an error: ${error.message}. Please try again.`);
        console.error(error);
    }

    sendButton.disabled = false;
    sendButton.textContent = 'Send';
}

sendButton.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

newConversationButton.addEventListener('click', createNewConversation);

// Initial load
if (conversations.length === 0) {
    createNewConversation();
} else {
    updateConversationList();
    switchConversation(currentConversationId);
}

// Mobile toggle for sidebar
const aside = document.querySelector('aside');
const toggleButton = document.createElement('button');
toggleButton.textContent = '☰ Conversations';
toggleButton.className = 'md:hidden w-full bg-white border-2 border-black text-black px-4 py-2 rounded-xl font-semibold hover:bg-gpt-orange hover:text-white hover:border-gpt-orange transition-all duration-300 shadow-md mb-4';
toggleButton.onclick = () => {
    aside.classList.toggle('hidden');
};
document.querySelector('main').insertBefore(toggleButton, document.querySelector('aside'));