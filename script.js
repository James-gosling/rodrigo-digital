// --- 1. Conexiones (DOM) ---
// Aquí conectamos el JS con todas las piezas del HTML
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key-btn');
const keyStatus = document.getElementById('key-status');
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- 2. Configuración ---
// Usamos el modelo 1.5 Flash (rápido y potente)
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=';
// Aquí guardaremos el historial para que el bot tenga contexto
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
    if
