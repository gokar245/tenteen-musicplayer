import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/admin.css';

// ============================================
// ICONS (Custom SVGs for consistency)
// ============================================
const Icon = ({ name, className = "" }) => {
    const icons = {
        dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
        pending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v15l3-3h7a2 2 0 0 0 2-2z" /><path d="M11 7h2" /><path d="M11 11h2" /><path d="M11 15h2" /></svg>,
        music: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>,
        artist: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
        album: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
        playlist: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
        users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
        settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
        refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
        dots: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
        plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
        trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
        edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
        check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
        close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
        eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
        userPlus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>,
        shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
        userMinus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
    };
    return <span className={`icon-wrapper ${className}`} style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icons[name] || null}</span>;
};

// ============================================
// ADMIN PAGE COMPONENT
// ============================================
export default function Admin() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [pendingSongs, setPendingSongs] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [invites, setInvites] = useState([]);

    // UI State
    const [openMenu, setOpenMenu] = useState(null);
    const [editModal, setEditModal] = useState({ show: false, type: null, item: null });
    const [editForm, setEditForm] = useState({});
    const [inviteForm, setInviteForm] = useState({ type: 'permanent', duration: '1d' });
    const [saving, setSaving] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Initial data fetch
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchAllData();
    }, [user, navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchSettings(),
                fetchPendingUploads(),
                fetchUsers(),
                fetchArtists(),
                fetchAlbums(),
                fetchPlaylists(),
                fetchInvites()
            ]);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchPendingUploads = async () => {
        try {
            const res = await api.get('/admin/pending');
            setPendingSongs(res.data.songs || []);
        } catch (error) { console.error(error); }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setActiveUsers(res.data || []);
        } catch (error) { console.error(error); }
    };

    const fetchArtists = async () => {
        try {
            const res = await api.get('/artists');
            setArtists(res.data.artists || []);
        } catch (error) { console.error(error); }
    };

    const fetchAlbums = async () => {
        try {
            const res = await api.get('/albums');
            setAlbums(res.data.albums || []);
        } catch (error) { console.error(error); }
    };

    const fetchPlaylists = async () => {
        try {
            const res = await api.get('/admin/playlists');
            setPlaylists(res.data || []);
        } catch (error) { console.error(error); }
    };

    const fetchInvites = async () => {
        try {
            const res = await api.get('/admin/invites');
            setInvites(res.data || []);
        } catch (error) { console.error(error); }
    };

    // Actions
    const handleToggleUploads = async () => {
        try {
            const newValue = !settings?.uploadsEnabled;
            // Optimistic update
            setSettings(prev => ({ ...prev, uploadsEnabled: newValue }));
            await api.post('/admin/settings', { uploadsEnabled: newValue });
        } catch (error) {
            console.error(error);
            fetchSettings(); // Revert on error
        }
    };

    const handleApproveSong = async (songId) => {
        try {
            await api.post(`/admin/approve/${songId}`);
            setPendingSongs(prev => prev.filter(s => s._id !== songId));
            setOpenMenu(null);
        } catch (error) { alert('Failed to approve'); }
    };

    const handleRejectSong = async (songId) => {
        setConfirmModal({
            show: true,
            title: 'Reject Upload',
            message: 'Are you sure you want to reject and delete this song?',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/reject/${songId}`);
                    setPendingSongs(prev => prev.filter(s => s._id !== songId));
                    setConfirmModal({ show: false });
                } catch (error) { alert('Failed to reject'); }
            }
        });
    };

    const handleDeleteUser = async (userId) => {
        setConfirmModal({
            show: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${userId}`);
                    setActiveUsers(prev => prev.filter(u => u._id !== userId));
                    toast.success('User deleted');
                    setConfirmModal({ show: false });
                } catch (error) {
                    toast.error('Failed to delete user');
                    setConfirmModal({ show: false });
                }
            }
        });
    };

    const updateUserRole = async (userId, role) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role });
            setActiveUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
            toast.success(`User role updated to ${role}`);
            setOpenMenu(null);
        } catch (error) {
            toast.error('Failed to update role');
            console.error(error);
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            const { data } = await api.patch(`/admin/users/${userId}/toggle-status`);
            setActiveUsers(prev => prev.map(u => u._id === userId ? { ...u, isDisabled: data.user.isDisabled } : u));
            toast.success(data.message);
            setOpenMenu(null);
        } catch (error) {
            toast.error('Failed to update user status');
            console.error(error);
        }
    };

    const handleDeleteArtist = (artistId, artistName) => {
        console.log('Attempting to delete artist:', artistId, artistName);
        setConfirmModal({
            show: true,
            title: 'Delete Artist',
            message: `Are you sure you want to delete "${artistName}"? This will only work if the artist has no songs or albums associated with them.`,
            onConfirm: async () => {
                setConfirmModal({ show: false }); // Close immediately to show toast

                const deletePromise = api.delete(`/artists/${artistId}`);

                toast.promise(deletePromise, {
                    loading: `Deleting artist "${artistName}"...`,
                    success: () => {
                        setArtists(prev => prev.filter(a => a._id !== artistId));
                        return 'Artist deleted successfully';
                    },
                    error: (error) => {
                        console.error('Delete artist failed:', error);
                        const errorMessage = error.response?.data?.message || 'Failed to delete artist';
                        // Re-open modal with error
                        setConfirmModal({
                            show: true,
                            title: 'Cannot Delete Artist',
                            message: errorMessage,
                            isError: true,
                            onConfirm: () => setConfirmModal({ show: false })
                        });
                        return 'Delete failed';
                    }
                });
            }
        });
    };

    const handleDeleteAlbum = (albumId, albumTitle) => {
        console.log('Attempting to delete album:', albumId, albumTitle);
        setConfirmModal({
            show: true,
            title: 'Delete Album',
            message: `Are you sure you want to delete "${albumTitle}"? This will only work if the album has no songs in it.`,
            onConfirm: async () => {
                setConfirmModal({ show: false });

                const deletePromise = api.delete(`/albums/${albumId}`);

                toast.promise(deletePromise, {
                    loading: `Deleting album "${albumTitle}"...`,
                    success: () => {
                        setAlbums(prev => prev.filter(a => a._id !== albumId));
                        return 'Album deleted successfully';
                    },
                    error: (error) => {
                        console.error('Delete album failed:', error);
                        const errorMessage = error.response?.data?.message || 'Failed to delete album';
                        setConfirmModal({
                            show: true,
                            title: 'Cannot Delete Album',
                            message: errorMessage,
                            isError: true,
                            onConfirm: () => setConfirmModal({ show: false })
                        });
                        return 'Delete failed';
                    }
                });
            }
        });
    };

    const handleGenerateInvite = async () => {
        try {
            await api.post('/admin/invite', inviteForm);
            fetchInvites();
            toast.success("Invite code generated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate invite");
        }
    };

    const handleDeleteInvite = async (code) => {
        try {
            await api.delete(`/admin/invite/${code}`);
            setInvites(prev => prev.filter(i => i.code !== code));
            toast.success("Invite deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete invite");
        }
    };

    const handleSaveModal = async () => {
        setSaving(true);
        try {
            const { type, item } = editModal;
            if (type === 'artist') {
                const formData = new FormData();
                formData.append('name', editForm.name);
                if (editForm.imageFile) formData.append('image', editForm.imageFile);

                if (item) {
                    await api.put(`/artists/${item._id}`, { name: editForm.name, image: item.image }); // Simplified, usually you'd handle image upload
                } else {
                    await api.post('/artists', { name: editForm.name });
                }
                fetchArtists();
            } else if (type === 'album') {
                if (item) {
                    await api.put(`/albums/${item._id}`, { name: editForm.title, artist: editForm.artistId, releaseYear: editForm.year });
                } else {
                    await api.post('/albums', { name: editForm.title, artist: editForm.artistId, releaseYear: editForm.year });
                }
                fetchAlbums();
            }
            setEditModal({ show: false });
        } catch (error) { alert('Save failed'); }
        setSaving(false);
    };

    // Helpers
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getOnlineCount = () => {
        return activeUsers.filter(u => new Date(u.updatedAt) > new Date(Date.now() - 5 * 60 * 1000)).length;
    };

    if (loading) return <div className="admin-layout" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="loading-spinner"></div></div>;

    const renderDashboard = () => (
        <div className="dashboard-grid">
            <div className="metric-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon"><Icon name="users" /></div>
                <div className="metric-info">
                    <span className="metric-value">{activeUsers.length}</span>
                    <span className="metric-label">Total Users</span>
                </div>
            </div>
            <div className="metric-card">
                <div className="metric-icon"><Icon name="eye" /></div>
                <div className="metric-info">
                    <span className="metric-value">{getOnlineCount()}</span>
                    <span className="metric-label">Active Users (Live)</span>
                </div>
            </div>
            <div className="metric-card" onClick={() => setActiveTab('artists')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon"><Icon name="artist" /></div>
                <div className="metric-info">
                    <span className="metric-value">{artists.length}</span>
                    <span className="metric-label">Total Artists</span>
                </div>
            </div>
            <div className="metric-card" onClick={() => setActiveTab('albums')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon"><Icon name="album" /></div>
                <div className="metric-info">
                    <span className="metric-value">{albums.length}</span>
                    <span className="metric-label">Total Albums</span>
                </div>
            </div>
            <div className="metric-card" onClick={() => setActiveTab('playlists')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon"><Icon name="playlist" /></div>
                <div className="metric-info">
                    <span className="metric-value">{playlists.length}</span>
                    <span className="metric-label">Total Playlists</span>
                </div>
            </div>
            <div className="metric-card" onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon"><Icon name="pending" /></div>
                <div className="metric-info">
                    <span className="metric-value">{pendingSongs.length}</span>
                    <span className="metric-label">Pending Uploads</span>
                </div>
            </div>
        </div>
    );

    const renderPending = () => (
        <div className="table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Song / Album Name</th>
                        <th>Type</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingSongs.map(song => (
                        <tr key={song._id}>
                            <td>
                                <div className="user-cell">
                                    <div className="user-mini-avatar">{song.uploadedBy?.displayName?.[0] || 'U'}</div>
                                    <span>{song.uploadedBy?.displayName || 'Unknown'}</span>
                                </div>
                            </td>
                            <td>{song.title}</td>
                            <td>{song.album ? 'Album' : 'Song'}</td>
                            <td>{formatDate(song.createdAt)}</td>
                            <td><span className="role-badge user">PENDING</span></td>
                            <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button className="action-btn-mini btn-approve" onClick={() => handleApproveSong(song._id)}>Approve</button>
                                    <button className="action-btn-mini btn-reject" onClick={() => handleRejectSong(song._id)}>Reject</button>
                                    <button className="action-btn-mini btn-view" onClick={() => navigate(`/edit-song/${song._id}`)}>
                                        <Icon name="eye" className="mini" /> View
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {pendingSongs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No pending requests</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderUsers = () => (
        <div className="table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th style={{ textAlign: 'right' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {activeUsers.map((u, index) => (
                        <tr key={u._id}>
                            <td>
                                <div className="user-cell">
                                    <div className="user-mini-avatar" style={{ background: u.role === 'admin' ? 'var(--color-accent)' : '#1a1a1a', color: 'white' }}>
                                        {u.displayName?.[0] || 'U'}
                                    </div>
                                    <span>{u.displayName}</span>
                                </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                                <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                                    {u.role?.toUpperCase()}
                                </span>
                            </td>
                            <td>
                                <span className={`role-badge ${u.isDisabled ? 'disabled' : 'active'}`} style={{
                                    background: u.isDisabled ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 200, 81, 0.1)',
                                    color: u.isDisabled ? '#ff4444' : '#00c851',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {u.isDisabled ? 'DISABLED' : 'ACTIVE'}
                                </span>
                            </td>
                            <td>{formatDate(u.createdAt)}</td>
                            <td style={{ textAlign: 'right' }}>
                                <div className="dots-menu">
                                    <button className="icon-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenu(openMenu === u._id ? null : u._id);
                                    }}>
                                        <Icon name="dots" />
                                    </button>
                                    {openMenu === u._id && (
                                        <div className="dropdown-popover" onClick={e => e.stopPropagation()} style={{
                                            minWidth: '160px',
                                            top: index === activeUsers.length - 1 && index > 0 ? 'auto' : '100%',
                                            bottom: index === activeUsers.length - 1 && index > 0 ? '100%' : 'auto'
                                        }}>
                                            {u.role === 'admin' ? (
                                                <div className="popover-item" onClick={() => updateUserRole(u._id, 'user')}>
                                                    <Icon name="user" /> Make Regular User
                                                </div>
                                            ) : (
                                                <div className="popover-item" onClick={() => updateUserRole(u._id, 'admin')}>
                                                    <Icon name="shield" /> Make Admin
                                                </div>
                                            )}

                                            <div className="popover-item" onClick={() => handleToggleUserStatus(u._id, u.isDisabled)}>
                                                {u.isDisabled ? (
                                                    <><Icon name="play" /> Enable User</>
                                                ) : (
                                                    <><Icon name="close" /> Disable User</>
                                                )}
                                            </div>

                                            <div className="popover-item danger" onClick={() => handleDeleteUser(u._id)}>
                                                <Icon name="trash" /> Delete User
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderGrid = (items, type) => (
        <div className="admin-grid">
            {items.map(item => (
                <div key={item._id} className="admin-card">
                    <div className="card-image">
                        <img src={item.image || item.coverImage || 'https://via.placeholder.com/300?text=No+Image'} alt={item.name || item.title} />
                        <div className="card-actions-overlay" onClick={e => e.stopPropagation()}>
                            <button className="icon-btn" style={{ background: 'white', color: 'black' }} onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (type === 'artist') navigate(`/admin/edit-artist/${item._id}`);
                                else navigate(`/admin/edit-album/${item._id}`);
                            }}>
                                <Icon name="edit" />
                            </button>
                            <button className="icon-btn" style={{ background: '#e74c3c', color: 'white' }} onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (type === 'artist') handleDeleteArtist(item._id, item.name);
                                else handleDeleteAlbum(item._id, item.name || item.title);
                            }}>
                                <Icon name="trash" />
                            </button>
                        </div>
                    </div>
                    <div className="card-name">{item.name || item.title}</div>
                    <div className="card-subtitle">
                        {type === 'artist' ? `${item.albums?.length || 0} Albums` : (item.artist?.name || 'Various Artists')}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderSettings = () => (
        <div className="settings-container">
            <div className="settings-group">
                <div className="settings-header">
                    <h3>Invitation Code System</h3>
                    <p className="settings-desc">Generate codes for new users.</p>
                </div>

                <div className="setting-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>User Type</label>
                            <select
                                className="form-input"
                                value={inviteForm.type}
                                onChange={e => setInviteForm({ ...inviteForm, type: e.target.value })}
                            >
                                <option value="permanent">Permanent User</option>
                                <option value="temporary">Temporary User</option>
                            </select>
                        </div>

                        {inviteForm.type === 'temporary' && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Duration</label>
                                <select
                                    className="form-input"
                                    value={inviteForm.duration}
                                    onChange={e => setInviteForm({ ...inviteForm, duration: e.target.value })}
                                >
                                    <option value="1d">1 Day</option>
                                    <option value="1w">1 Week</option>
                                    <option value="1m">1 Month</option>
                                    <option value="3m">3 Months</option>
                                    <option value="1min">1 Minute (Test)</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn-primary" onClick={handleGenerateInvite}>Generate Code</button>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', width: '100%' }}>
                        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Active Invites</h4>
                        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Type</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invites.map(invite => (
                                        <tr key={invite._id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: '1.1em', letterSpacing: '1px' }}>{invite.code}</td>
                                            <td>
                                                <span className={`role-badge ${invite.userType === 'permanent' ? 'admin' : 'user'}`} style={{ background: invite.userType === 'permanent' ? 'var(--color-accent)' : '#e67e22' }}>
                                                    {invite.userType?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                {invite.userType === 'temporary' ? (
                                                    invite.userValidityDuration === 86400000 ? '1 Day' :
                                                        invite.userValidityDuration === 604800000 ? '1 Week' :
                                                            invite.userValidityDuration === 2592000000 ? '1 Month' :
                                                                invite.userValidityDuration === 7776000000 ? '3 Months' :
                                                                    invite.userValidityDuration === 60000 ? '1 Minute' : 'Custom'
                                                ) : '-'}
                                            </td>
                                            <td>{invite.isUsed ? 'Used' : 'Active'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {!invite.isUsed && (
                                                    <button className="icon-btn" style={{ color: '#ff4444' }} onClick={() => handleDeleteInvite(invite.code)}>
                                                        <Icon name="trash" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {invites.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No active invites</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-group">
                <div className="settings-header">
                    <h3>System Settings</h3>
                </div>
                <div className="setting-row">
                    <div className="setting-label">
                        <span className="setting-title">Upload Auto-Approval</span>
                        <span className="setting-desc">If enabled, uploads will be visible immediately without admin review.</span>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings?.uploadsEnabled || false}
                            onChange={handleToggleUploads}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div className="settings-group">
                <div className="settings-header">
                    <h3>Account</h3>
                </div>
                <div className="setting-row" style={{ justifyContent: 'flex-start' }}>
                    <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => logout()}>Logout</button>
                </div>
            </div>
        </div>
    );



    // ... (rest of code) ...

    return (
        <div className="admin-layout" onClick={() => setOpenMenu(null)}>
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-accent)' }}>TenTeen</h1>
                    <button className="icon-btn mobile-close-btn" onClick={() => setSidebarOpen(false)}>
                        <Icon name="close" />
                    </button>
                </div>
                {/* ... existing nav ... */}
                <nav className="sidebar-nav">
                    <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
                        <Icon name="dashboard" /> Dashboard
                    </div>
                    {/* ... other nav items ... */}
                    <div className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); setSidebarOpen(false); }}>
                        <Icon name="pending" /> Pending Uploads
                        {pendingSongs.length > 0 && <span className="nav-badge">{pendingSongs.length}</span>}
                    </div>
                    <div className={`nav-item ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => { setActiveTab('artists'); setSidebarOpen(false); }}>
                        <Icon name="artist" /> Artists
                    </div>
                    <div className={`nav-item ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => { setActiveTab('albums'); setSidebarOpen(false); }}>
                        <Icon name="album" /> Albums
                    </div>
                    <div className={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => { setActiveTab('playlists'); setSidebarOpen(false); }}>
                        <Icon name="playlist" /> Playlists
                    </div>
                    <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}>
                        <Icon name="users" /> Users
                    </div>
                    <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}>
                        <Icon name="settings" /> Settings
                    </div>
                </nav>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99
            }}></div>}

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div className="header-title">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn" title="Refresh" onClick={fetchAllData}>
                            <Icon name="refresh" />
                        </button>
                        <div className="admin-profile" onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === 'profile' ? null : 'profile');
                        }}>
                            <div className="profile-avatar">{user?.displayName?.[0] || 'A'}</div>
                            {openMenu === 'profile' && (
                                <div className="dropdown-popover" style={{ top: '100%', right: 0 }}>
                                    <div className="popover-item" onClick={() => navigate('/settings')}>
                                        <Icon name="settings" /> Profile Settings
                                    </div>
                                    <div className="popover-item danger" onClick={logout}>
                                        <Icon name="close" /> Logout
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    {/* Header for dynamic pages */}
                    {activeTab !== 'dashboard' && activeTab !== 'settings' && (
                        <div className="page-section-header">
                            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                            {(activeTab === 'artists' || activeTab === 'albums') && (
                                <button className="btn-primary" onClick={() => setEditModal({ show: true, type: activeTab.slice(0, -1), item: null })}>
                                    <Icon name="plus" /> Add {activeTab.slice(0, -1)}
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'pending' && renderPending()}
                    {activeTab === 'artists' && renderGrid(artists, 'artist')}
                    {activeTab === 'albums' && renderGrid(albums, 'album')}
                    {activeTab === 'playlists' && (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Playlist Name</th>
                                        <th>Visibility</th>
                                        <th>Owner</th>
                                        <th>Songs</th>
                                        <th>Created</th>
                                        <th style={{ textAlign: 'right' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {playlists.map(p => (
                                        <tr key={p._id}>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td><span className="role-badge user">{p.isPublic ? 'PUBLIC' : 'PRIVATE'}</span></td>
                                            <td>{p.creator?.displayName || 'System'}</td>
                                            <td>{p.songs?.length || 0}</td>
                                            <td>{formatDate(p.createdAt)}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="icon-btn"><Icon name="dots" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'settings' && renderSettings()}
                </div>
            </main>

            {/* Modals & Overlays */}
            {editModal.show && (
                <div className="modal-overlay open">
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editModal.item ? 'Edit' : 'Add'} {editModal.type}</h2>
                            <button className="icon-btn" onClick={() => setEditModal({ show: false })}><Icon name="close" /></button>
                        </div>
                        <div className="modal-body">
                            {editModal.type === 'artist' && (
                                <div className="form-group">
                                    <label>Artist Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                            )}
                            {editModal.type === 'album' && (
                                <>
                                    <div className="form-group">
                                        <label>Album Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editForm.title || ''}
                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Artist</label>
                                        <select
                                            className="form-input"
                                            value={editForm.artistId || ''}
                                            onChange={e => setEditForm({ ...editForm, artistId: e.target.value })}
                                        >
                                            <option value="">Select Artist</option>
                                            {artists.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Release Year</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editForm.year || ''}
                                            onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => setEditModal({ show: false })}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveModal} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.show && (
                <div className="modal-overlay open">
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', borderTop: confirmModal.isError ? '4px solid #ff4444' : 'none' }}>
                        <div className="modal-header">
                            <h2 style={{ color: confirmModal.isError ? '#ff4444' : 'inherit' }}>{confirmModal.title}</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{confirmModal.message}</p>
                        </div>
                        <div className="modal-footer">
                            {!confirmModal.isError && (
                                <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => setConfirmModal({ show: false })}>Cancel</button>
                            )}
                            <button className="btn-primary" onClick={confirmModal.onConfirm} style={{ background: confirmModal.isError ? '#ff4444' : '' }}>
                                {confirmModal.isError ? 'Okay' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
