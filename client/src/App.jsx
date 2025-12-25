import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { Layout } from './components/layout';
import {
    Login,
    Home,
    Album,
    Artist,
    Search,
    Upload,
    Library,
    Settings,
    Admin,
    EditSong,
    Playlist,
    EditPlaylist,
    EditArtist,
    EditAlbum
} from './pages';
import { LoadingPage } from './components/common';
import { Toaster } from 'react-hot-toast';

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Public Route wrapper (redirects if already logged in)
function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// Admin Route wrapper (requires admin role)
function AdminRoute({ children }) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            {/* Protected Routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Home />} />
                <Route path="/album/:id" element={<Album />} />
                <Route path="/artist/:id" element={<Artist />} />
                <Route path="/search" element={<Search />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/library" element={<Library />} />
                <Route path="/playlist/:id" element={<Playlist />} />
                <Route path="/playlist/:id/edit" element={<EditPlaylist />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/edit-song/:id" element={<EditSong />} />
            </Route>

            {/* Admin Route */}
            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <Admin />
                    </AdminRoute>
                }
            />
            <Route
                path="/admin/edit-artist/:id"
                element={
                    <AdminRoute>
                        <EditArtist />
                    </AdminRoute>
                }
            />
            <Route
                path="/admin/edit-album/:id"
                element={
                    <AdminRoute>
                        <EditAlbum />
                    </AdminRoute>
                }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AudioProvider>
                    <AppRoutes />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#282828',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)'
                            },
                            success: {
                                iconTheme: {
                                    primary: '#1DB954',
                                    secondary: '#fff'
                                }
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ff4444',
                                    secondary: '#fff'
                                }
                            }
                        }}
                    />
                </AudioProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
