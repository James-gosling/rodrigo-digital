// --- 1. Conexiones (DOM) v1.2 ---
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn'); // <-- ¡NUEVO!
const keyStatus = document.getElementById('key-status');
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- 2. Configuración ---
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=';
let conversationHistory = [];
const KEY_NAME = 'gemini-api-key'; // <-- (Buena práctica)

// --- 3. Lógica de API Key (La Magia v1.2) ---

// (NUEVO) Esto se ejecuta en cuanto carga la página
document.addEventListener('DOMContentLoaded', checkForKey);

// (NUEVO) Revisa si la clave YA EXISTE en localStorage
function checkForKey() {
    const key = localStorage.getItem(KEY_NAME);
    if (key) {
        // ¡Sí existe! Activa la app y esconde el input de la clave
        activateApp();
    } else {
        // No existe. Muestra la sección para pegar la clave
        deactivateApp();
    }
}

// (NUEVO) Lógica para guardar la clave
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        // ¡LA CLAVE! Usamos localStorage en lugar de sessionStorage
        localStorage.setItem(KEY_NAME, key);
        activateApp();
    } else {
        keyStatus.textContent = 'Estado: ❌ No has puesto una clave';
        keyStatus.style.color = '#dc3545'; // rojo
    }
});

// (NUEVO) Lógica para borrar la clave
clearKeyBtn.addEventListener('click', () => {
    localStorage.removeItem(KEY_NAME);
    location.reload(); // Recarga la página para resetear todo
});

// (NUEVO) Función para activar la app (cuando SÍ hay clave)
function activateApp() {
    // Esconde el input de la clave y el botón de guardar
    apiKeyInput.style.display = 'none';
    saveKeyBtn.style.display = 'none';
    
    // Muestra el estado "OK" y el botón de "Borrar Clave"
    keyStatus.textContent = 'Estado: ✅ ¡Clave guardada permanentemente!';
    keyStatus.style.color = '#28a745';
    clearKeyBtn.style.display = 'inline-block'; // <-- La muestra

    // Activa el chat
    userInput.disabled = false;
    sendBtn.disabled = false;
    
    // Limpia el chat si es la primera vez
    if (chatHistory.children.length <= 1) { // Si solo está el mensaje de "bienvenida"
        chatHistory.innerHTML = ''; 
        addMessageToHistory('bot', '¡Genial, bro! Tu clave ya estaba guardada. ¿Qué onda?');
    }
}

// (NUEVO) Función para desactivar la app (cuando NO hay clave)
function deactivateApp() {
    // Muestra el input de clave y el botón de guardar
    apiKeyInput.style.display = 'inline-block';
    saveKeyBtn.style.display = 'inline-block';
    
    // Muestra el estado "NO" y esconde el botón de "Borrar"
    keyStatus.textContent = 'Estado: ❌ No hay clave';
    keyStatus.style.color = '#dc3545';
    clearKeyBtn.style.display = 'none'; // <-- La esconde

    // Desactiva el chat
    userInput.disabled = true;
    sendBtn.disabled = true;
    chatHistory.innerHTML = '<div class="message bot"><p>Hola bro, soy Rodrigo Digital v1.2. Pega tu API key arriba para empezar.</p></div>';
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
        loadingMessage.remove();
        addMessageToHistory('bot', botResponse);
        conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
    } catch (error) {
        loadingMessage.remove();
        addMessageToHistory('bot', `¡Upps! Error, bro: ${error.message}`);
        console.error(error);
    }
}

// --- 5. Helper: Añadir Mensaje a la UI (Sin cambios) ---
function addMessageToHistory(role, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role);
    const p = document.createElement('p');
    p.textContent = text;
    messageElement.appendChild(p);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageElement;
}

// --- 6. El Cerebro (Llamada a Gemini) ---
// (Modificado para usar la KEY_NAME de localStorage)
async function getGeminiResponse() {
    const key = localStorage.getItem(KEY_NAME); // <-- ¡USA LOCALSTORAGE!
    if (!key) throw new Error('No se encontró API key en localStorage.');

    const payload = {
        contents: conversationHistory,
        systemInstruction: {
            role: "system",
            parts: [
                { "text": "Eres 'Rodrigo Digital v1.2', una inteligencia artificial de asistencia. Tu propósito es actuar como un 'agente' de productividad y código, similar a GitHub Copilot HQ y Gemini for Workspace. Eres profesional, analítico y te especializas en código, servidores (Docker, Linux), automatización (GitHub Actions) y productividad. Tu objetivo es dar respuestas directas, técnicas y eficientes. **Importante: No uses NUNCA formato Markdown (asteriscos, negritas, etc.) en tus respuestas. Responde solo con texto plano.**" }
            ]
        },
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
