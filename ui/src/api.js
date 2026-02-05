import axios from 'axios';

// Configure Axios
const api = axios.create({
    baseURL: 'http://localhost:8234',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error.response || error.message);
        return Promise.reject(error);
    }
);

export const apiService = {
    // Start a new research task
    startResearch: async (title, mode = 'local') => {
        return api.post('/api/research/start', { title, mode });
    },

    // Get status of a specific task
    getTaskStatus: async (taskId) => {
        return api.get(`/api/research/status/${taskId}`);
    },

    // Get knowledge graph statistics
    getGraphStats: async () => {
        return api.get('/api/graph/stats');
    },

    // Health check
    healthCheck: async () => {
        return api.get('/health');
    }
};

export default apiService;
