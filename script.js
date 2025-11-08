// --- 1. Conexiones (DOM) ---
// Aquí conectamos el JS con todas las piezas del HTML
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key-btn');
const keyStatus = document.getElementById('key-status');
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- 2. Configuración ---
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=';
let conversationHistory = [];

// --- 3. Lógica de la API Key ---
// Esto se ejecuta cuando das clic en "Guardar Clave"
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        // (Clave de seguridad) Lo guardamos en 'sessionStorage'.
        // Esto es seguro: la clave vive en tu navegador y se borra al cerrar la pestaña.
        // NUNCA toca el código de GitHub.
        sessionStorage.setItem('gemini-api-key', key);
        
        // Actualizamos la UI
        keyStatus.textContent = 'Estado: ✅ ¡Clave guardada en esta sesión!';
        keyStatus.style.color = '#28a745'; // verde
        userInput.disabled = false;
        sendBtn.disabled = false;
        
        // Limpiamos el mensaje inicial y damos bienvenida
        chatHistory.innerHTML = ''; // Borra el "pega tu clave"
        addMessageToHistory('bot', '¡Genial, bro! Ya estoy listo. ¿Qué onda?');
    } else {
        keyStatus.textContent = 'Estado: ❌ No has puesto una clave';
        keyStatus.style.color = '#dc3545'; // rojo
    }
});

// --- 4. Lógica de Envío ---
// Para que funcione con "Enter" y con el botón
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // 'Enter' pero no 'Shift+Enter'
        e.preventDefault(); // Evita que 'Enter' ponga un salto de línea
        handleSendMessage();
    }
});

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return; // No hacer nada si el mensaje está vacío

    // 1. Muestra tu mensaje en el chat
    addMessageToHistory('user', message);
    
    // 2. Añade tu mensaje al historial de JS
    conversationHistory.push({ role: 'user', parts: [{ text: message }] });

    // 3. Limpia el input y muestra "Escribiendo..."
    userInput.value = '';
    const loadingMessage = addMessageToHistory('bot', 'Escribiendo...');

    try {
        // 4. Llama a la API de Gemini
        const botResponse = await getGeminiResponse();
        
        // 5. Quita el "Escribiendo..." y pone la respuesta real
        loadingMessage.remove();
        addMessageToHistory('bot', botResponse);
        
        // 6. Añade la respuesta del bot al historial de JS
        conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });

    } catch (error) {
        // Manejo de errores
        loadingMessage.remove();
        addMessageToHistory('bot', `¡Upps! Error, bro: ${error.message}`);
        console.error(error);
    }
}

// --- 5. Helper: Añadir Mensaje a la UI ---
// Función que crea los divs de 'user' y 'bot' en el HTML
function addMessageToHistory(role, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role);
    
    const p = document.createElement('p');
    p.textContent = text; // Usar textContent es más seguro
    messageElement.appendChild(p);
    
    chatHistory.appendChild(messageElement);
    
    // Auto-scroll: para que el chat siempre baje a lo último
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageElement; // Lo retornamos para poder borrar el "Escribiendo..."
}


// --- 6. El Cerebro (Llamada a Gemini) ---
// ESTA ES LA FUNCIÓN MÁS IMPORTANTE
async function getGeminiResponse() {
    const key = sessionStorage.getItem('gemini-api-key');
    if (!key) throw new Error('No se encontró API key en la sesión.');

    // Prepara el "paquete" para enviar a Google
    const payload = {
        contents: conversationHistory, // Envía TODO el historial
        
        // --------- ¡EL ALMA DE RODRIGO DIGITAL! ---------
        // Aquí defines la personalidad. Edita esto como quieras.
        systemInstruction: {
            role: "system",
            parts: [
                { "text": "Eres 'Rodrigo Digital', un asistente basado en la personalidad de Rodrigo. Eres informal, te gusta la tecnología y eres estudiante de 5to semestre de Ing. en TI. Siempre llamas 'bro' al usuario y usas un lenguaje casual. Te encanta hablar de servidores, Docker, Linux y proyectos de GitHub." }
            ]
        },
        // --------------------------------------------------

        generationConfig: { // Configs para que no se aloque
            "temperature": 0.7,
            "topP": 1,
            "topK": 1
        }
    };

    // La llamada 'fetch'
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
    
    // Saca el texto de la respuesta (el camino puede ser complejo, pero este es)
    const botText = data.candidates[0].content.parts[0].text;
    return botText;
}
