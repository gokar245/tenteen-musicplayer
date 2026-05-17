import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD
        ? '/api'
        : 'http://localhost:5000/api'
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export const artistsApi = {
    getAll: (params) => api.get('/artists', { params }),
    getOne: (id) => api.get(`/artists/${id}`),
    create: (data) => api.post('/artists', data),
    update: (id, data) => api.put(`/artists/${id}`, data),
    delete: (id) => api.delete(`/artists/${id}`)
};

export const songsApi = {
    getAll: (params) => api.get('/songs', { params }),
    getOne: (id) => api.get(`/songs/${id}`),
    create: (data) => api.post('/songs', data),
    update: (id, data) => api.put(`/songs/${id}`, data),
    delete: (id) => api.delete(`/songs/${id}`),
    getHistory: () => api.get('/songs/history'),
    getRandom: () => api.get('/songs/random')
};

export const searchApi = {
    global: (query) => api.get('/search/global', { params: { query } })
};

export const uploadApi = {
    audio: (formData, onProgress) =>
        api.post('/upload/audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            }
        }),

    image: (formData) =>
        api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
};

export default api;
