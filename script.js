// --- 1. Conexiones (DOM) v1.2 ---
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn');
const keyStatus = document.getElementById('key-status');
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- 2. Configuración ---
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=';
let conversationHistory = [];
const KEY_NAME = 'gemini-api-key';

// --- 3. Lógica de API Key (v1.2) ---
document.addEventListener('DOMContentLoaded', checkForKey);

function checkForKey() {
    const key = localStorage.getItem(KEY_NAME);
    if (key) {
        activateApp();
    } else {
        deactivateApp();
    }
}

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem(KEY_NAME, key);
        activateApp();
    } else {
        keyStatus.textContent = 'Estado: ❌ No has puesto una clave';
        keyStatus.style.color = '#dc3545'; // rojo
    }
});

clearKeyBtn.addEventListener('click', () => {
    localStorage.removeItem(KEY_NAME);
    location.reload();
});

function activateApp() {
    apiKeyInput.style.display = 'none';
    saveKeyBtn.style.display = 'none';
    keyStatus.textContent = 'Estado: ✅ ¡Clave guardada permanentemente!';
    keyStatus.style.color = '#28a745';
    clearKeyBtn.style.display = 'inline-block';
    userInput.disabled = false;
    sendBtn.disabled = false;
    if (chatHistory.children.length <= 1) {
        chatHistory.innerHTML = '';
        addMessageToHistory('bot', '¡Genial, bro! Tu clave ya estaba guardada. ¿Qué onda?');
    }
}

function deactivateApp() {
    apiKeyInput.style.display = 'inline-block';
    saveKeyBtn.style.display = 'inline-block';
    keyStatus.textContent = 'Estado: ❌ No hay clave';
    keyStatus.style.color = '#dc3545';
    clearKeyBtn.style.display = 'none';
    userInput.disabled = true;
    sendBtn.disabled = true;
    chatHistory.innerHTML = '<div class="message bot"><p>Hola bro, soy Rodrigo Digital v1.3. Pega tu API key arriba para empezar.</p></div>';
}

// --- 4. Lógica de Envío (Sin cambios) ---
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToHistory('user', message);
    conversationHistory.push({ role: 'user', parts: [{ text: message }] });
    userInput.value = '';
    const loadingMessage = addMessageToHistory('bot', 'Escribiendo...');

    try {
        const botResponse = await getGeminiResponse();
        loadingMessage.remove(); // Quita el "Escribiendo..."
        addMessageToHistory('bot', botResponse); // <-- Pasa la respuesta al nuevo renderer
        conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
    } catch (error) {
        loadingMessage.remove();
        addMessageToHistory('bot', `¡Upps! Error, bro: ${error.message}`);
        console.error(error);
    }
}

// --- 5. Helper: Añadir Mensaje a la UI (¡MEJORADO v1.3!) ---
function addMessageToHistory(role, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role);

    // (NUEVO) HACK DE RENDERIZADO DE CÓDIGO
    // Reemplaza los ``` (con o sin 'javascript', 'python', etc.) con <pre><code>
    // y los ``` de cierre con </code></pre>
    // ¡Esto nos permite renderizar código sin librerías externas!
    let processedText = text.replace(/```(\w*)\n/g, '<pre><code>\n'); // Apertura
    processedText = processedText.replace(/```/g, '</code></pre>'); // Cierre

    // Si no es un bloque de código, envuélvelo en <p>
    if (!processedText.startsWith('<pre>')) {
        const p = document.createElement('p');
        p.textContent = text; // Usamos textContent (seguro) para texto normal
        messageElement.appendChild(p);
    } else {
        messageElement.innerHTML = processedText; // Usamos innerHTML (con cuidado) SOLO para el código
    }

    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageElement;
}


// --- 6. El Cerebro (Llamada a Gemini) (¡MEJORADO v1.3!) ---
async function getGeminiResponse() {
    const key = localStorage.getItem(KEY_NAME);
    if (!key) throw new Error('No se encontró API key en localStorage.');

    const payload = {
        contents: conversationHistory,

        // --------- ¡EL ALMA DE RODRIGO DIGITAL v1.3! ---------
        systemInstruction: {
            role: "system",
            parts: [
                { "text": "Eres 'Rodrigo Digital v1.3', una inteligencia artificial de asistencia. Tu propósito es actuar como un 'agente' de productividad y código. Eres profesional, analítico y te especializas en código (Python, JS, Docker, Linux) y automatización (GitHub Actions). **Importante: No uses NUNCA formato Markdown (como asteriscos para negritas o itálicas). Responde solo con texto plano. LA ÚNICA EXCEPCIÓN: SÍ debes usar backticks (```) para envolver cualquier bloque de código.**" }
            ]
        },
        // --------------------------------------------------

        generationConfig: {
            "temperature": 0.7,
            "topP": 1,
            "topK": 1
        }
    };

    const response = await fetch(API_URL + key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error en la API');
    }

    const data = await response.json();
    const botText = data.candidates[0].content.parts[0].text;
    return botText;
}