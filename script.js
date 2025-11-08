// --- 1. Conexiones (DOM) v1.5 ---
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn');
const keyStatus = document.getElementById('key-status');
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const fileBtn = document.getElementById('file-btn');

// --- 2. Configuración ---
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=';
let conversationHistory = [];
const KEY_NAME = 'gemini-api-key';
let selectedFile = null; // v1.5: Almacena el archivo seleccionado
const REQUEST_TIMEOUT = 60000; // 60 segundos timeout

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

// (V1.4) Lógica para borrar la clave
clearKeyBtn.addEventListener('click', () => {
    localStorage.removeItem(KEY_NAME);
    deactivateApp(); // Ya no recargamos toda la página
});

function activateApp() {
    apiKeyInput.style.display = 'none';
    saveKeyBtn.style.display = 'none';
    keyStatus.textContent = 'Estado: ✅ ¡Clave guardada permanentemente!';
    keyStatus.style.color = '#28a745';
    clearKeyBtn.style.display = 'inline-block';
    userInput.disabled = false;
    sendBtn.disabled = false;
    fileBtn.disabled = false; // v1.5: Habilitar botón de archivo
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
    fileBtn.disabled = true; // v1.5: Deshabilitar botón de archivo
    chatHistory.innerHTML = '<div class="message bot"><p>Hola bro, soy Rodrigo Digital v1.5. Pega tu API key arriba para empezar.</p></div>';
}

// --- 4. Lógica de Envío (v1.5 con File Upload) ---
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// v1.5: File Upload Logic
fileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        fileBtn.textContent = `📎 ${file.name}`;
        fileBtn.style.backgroundColor = '#5d34ff';
    }
});

async function handleSendMessage() {
    const message = userInput.value.trim();
    
    // v1.5: Leer el archivo si existe
    let finalMessage = '';
    if (selectedFile) {
        try {
            const fileContent = await readFileContent(selectedFile);
            finalMessage = `[FILE_CONTENT_START]\n${fileContent}\n[FILE_CONTENT_END]\n`;
            if (message) {
                finalMessage += `[USER_PROMPT]\n${message}`;
            }
            // Mostrar al usuario que se envió un archivo
            addMessageToHistory('user', `📎 Archivo: ${selectedFile.name}\n${message || '(Analiza este archivo)'}`);
        } catch (error) {
            addMessageToHistory('bot', `Error al leer el archivo: ${error.message}`);
            return;
        }
        // Reset file input
        selectedFile = null;
        fileInput.value = '';
        fileBtn.textContent = '📎 Subir Archivo';
        fileBtn.style.backgroundColor = '';
    } else {
        if (!message) return;
        finalMessage = message;
        addMessageToHistory('user', message);
    }

    conversationHistory.push({ role: 'user', parts: [{ text: finalMessage }] });
    userInput.value = '';
    const loadingMessage = addMessageToHistory('bot', 'Escribiendo...');

    try {
        const botResponse = await getGeminiResponse();
        loadingMessage.remove(); // Quita el "Escribiendo..."
        await addMessageToHistory('bot', botResponse); // v1.5: Await para typewriter
        conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
    } catch (error) {
        loadingMessage.remove();
        addMessageToHistory('bot', `¡Upps! Error, bro: ${error.message}`);
        console.error(error);
    }
}

// v1.5: Helper para leer archivos
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}

// --- 5. Helper: Añadir Mensaje a la UI (¡MEJORADO v1.5 con Typewriter!) ---
async function addMessageToHistory(role, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // v1.5: Typewriter effect solo para bot
    if (role === 'bot') {
        await typewriterEffect(messageElement, text);
    } else {
        // Usuario: mostrar inmediatamente
        const p = document.createElement('p');
        p.textContent = text;
        messageElement.appendChild(p);
    }

    return messageElement;
}

// v1.5: Efecto Typewriter con soporte para bloques de código
async function typewriterEffect(element, text) {
    const delay = 30; // 30ms por carácter
    
    // Detectar si hay bloques de código
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Separar texto normal de bloques de código
    while ((match = codeBlockRegex.exec(text)) !== null) {
        // Texto antes del bloque de código
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }
        // Bloque de código
        parts.push({
            type: 'code',
            language: match[1],
            content: match[2]
        });
        lastIndex = match.index + match[0].length;
    }
    
    // Texto restante después del último bloque de código
    if (lastIndex < text.length) {
        parts.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }
    
    // Si no hay bloques de código, todo es texto
    if (parts.length === 0) {
        parts.push({
            type: 'text',
            content: text
        });
    }
    
    // Renderizar cada parte
    for (const part of parts) {
        if (part.type === 'code') {
            // Renderizar bloque de código completo (sin typewriter dentro del código)
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = part.content;
            pre.appendChild(code);
            element.appendChild(pre);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            // Pequeña pausa después del bloque de código
            await new Promise(resolve => setTimeout(resolve, delay * 10));
        } else {
            // Renderizar texto con efecto typewriter
            const p = document.createElement('p');
            element.appendChild(p);
            
            for (let i = 0; i < part.content.length; i++) {
                p.textContent += part.content[i];
                chatHistory.scrollTop = chatHistory.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}


// --- 6. El Cerebro (Llamada a Gemini) (¡MEJORADO v1.3!) ---
async function getGeminiResponse() {
    const key = localStorage.getItem(KEY_NAME);
    if (!key) throw new Error('No se encontró API key en localStorage.');

    const payload = {
        contents: conversationHistory,

        // --------- ¡EL ALMA DE RODRIGO DIGITAL v1.5! ---------
        systemInstruction: {
            role: "system",
            parts: [
                { "text": "Eres 'Rodrigo Digital v1.5', una inteligencia artificial de asistencia. Tu propósito es actuar como un 'agente' de productividad y código. Eres profesional, analítico y te especializas en código (Python, JS, Docker, Linux) y automatización (GitHub Actions). **Importante: No uses NUNCA formato Markdown (como asteriscos para negritas o itálicas). Responde solo con texto plano. LA ÚNICA EXCEPCIÓN: SÍ debes usar backticks (```) para envolver cualquier bloque de código.**" }
            ]
        },
        // --------------------------------------------------

        generationConfig: {
            "temperature": 0.7,
            "topP": 1,
            "topK": 1
        }
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(API_URL + key, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || !data.candidates || data.candidates.length === 0) {
            throw new Error('La API no devolvió respuestas. Verifica tu API key o intenta de nuevo.');
        }

        const candidate = data.candidates[0];
        
        // Check if response was blocked
        if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
            throw new Error(`Respuesta bloqueada por: ${candidate.finishReason}. Intenta reformular tu pregunta.`);
        }

        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new Error('La API devolvió una respuesta vacía.');
        }

        const botText = candidate.content.parts[0].text;
        return botText;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado. Intenta de nuevo o verifica tu conexión.');
        }
        throw error;
    }
}