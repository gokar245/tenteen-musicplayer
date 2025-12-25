import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        const { token: newToken, ...userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        setLoading(false); // Ensure loading is false after login

        return userData;
    };

    const register = async (email, password, displayName, inviteCode) => {
        const response = await api.post('api/auth/register', {
            email,
            password,
            displayName,
            inviteCode
        });
        const { token: newToken, ...userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        setLoading(false); // Ensure loading is false after register

        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (data) => {
        const response = await api.put('api/auth/profile', data);
        setUser(response.data);
        return response.data;
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
