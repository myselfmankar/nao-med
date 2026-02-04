import axios from 'axios';

// In development, Vite proxys /api to http://localhost:8000
// In production, it serves from the same origin.
const api = axios.create({
    baseURL: '/api',
});

// Add interceptor to inject API Key from localStorage
api.interceptors.request.use((config) => {
    const geminiKey = localStorage.getItem('gemini_api_key');
    if (geminiKey) {
        config.headers['X-Gemini-API-Key'] = geminiKey;
    }

    const openaiKey = localStorage.getItem('openai_api_key');
    if (openaiKey) {
        config.headers['X-OpenAI-API-Key'] = openaiKey;
    }

    return config;
});

export const setSessionId = (sessionId: string) => {
    api.defaults.headers.common['X-Session-ID'] = sessionId;
};

export default api;
