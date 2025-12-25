import axios from 'axios';

const api = axios.create({
    baseURL: ''
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
            // window.location.href = '/login'; // Optional: Redirect on 401
        }
        return Promise.reject(error);
    }
);

export const artistsApi = {
    getAll: (params) => api.get('/artists', { params }),
    getOne: (id) => api.get(`/artists/${id}`),
    getById: (id) => api.get(`/artists/${id}`), // Alias
    create: (data) => api.post('/artists', data),
    update: (id, data) => api.put(`/artists/${id}`, data),
    delete: (id) => api.delete(`/artists/${id}`)
};

export const albumsApi = {
    getAll: (params) => api.get('/albums', { params }),
    getOne: (id) => api.get(`/albums/${id}`),
    getById: (id) => api.get(`/albums/${id}`), // Alias for getOne
    create: (data) => api.post('/albums', data),
    update: (id, data) => api.put(`/albums/${id}`, data),
    delete: (id) => api.delete(`/albums/${id}`)
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

export const playlistsApi = {
    getAll: (params) => api.get('/playlists', { params }),
    getOne: (id) => api.get(`/playlists/${id}`),
    create: (data) => api.post('/playlists', data),
    update: (id, data) => api.put(`/playlists/${id}`, data),
    delete: (id) => api.delete(`/playlists/${id}`),
    addSong: (id, songId) => api.post(`/playlists/${id}/songs`, { songId }),
    removeSong: (id, songId) => api.delete(`/playlists/${id}/songs/${songId}`),
    getPublic: () => api.get('/playlists/public')
};

export const adminApi = {
    // Stats
    getStats: () => api.get('/admin/stats'),

    // Users
    getUsers: (params) => api.get('/admin/users', { params }),
    getUserMedia: (userId) => api.get(`/admin/user/${userId}/media`),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),

    // Pending uploads
    getPending: (params) => api.get('/admin/pending', { params }),
    getMedia: (mediaId) => api.get(`/admin/media/${mediaId}`),
    approveMedia: (mediaId) => api.post(`/admin/approve/${mediaId}`),
    rejectMedia: (mediaId) => api.delete(`/admin/reject/${mediaId}`),
    editMedia: (mediaId, data) => api.patch(`/admin/edit/${mediaId}`, data),
    approveAll: () => api.post('/admin/approve-all'),

    // Settings
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (settings) => api.post('/admin/settings', settings),

    // Invites
    generateInvite: (data) => api.post('/admin/invite', data),
    getInvites: () => api.get('/admin/invites'),
    deleteInvite: (code) => api.delete(`/admin/invite/${code}`)
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
        }),

    quick: (formData, onProgress) =>
        api.post('/upload/quick', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            }
        })
};

export default api;
