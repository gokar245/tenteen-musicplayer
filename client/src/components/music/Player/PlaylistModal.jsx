import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// Icons
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const MusicIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

export default function PlaylistModal({ isOpen, onClose, song }) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [originalIds, setOriginalIds] = useState(new Set());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchPlaylists();
        } else {
            document.body.style.overflow = 'unset';
            setShowCreate(false);
            setNewPlaylistName('');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const res = await api.get('/playlists');

            // Filter: Show playlists owned by user, OR all if admin
            const myPlaylists = res.data.filter(p => {
                if (user?.role === 'admin') return true;
                const pOwnerId = (p.owner?._id || p.owner || '').toString();
                const uId = (user?._id || user?.id || '').toString();
                return pOwnerId === uId;
            });

            setPlaylists(myPlaylists);

            const initiallyIn = new Set();
            myPlaylists.forEach(playlist => {
                const hasSong = playlist.songs?.some(s => {
                    const sId = (s._id || s || '').toString();
                    const targetId = (song?._id || song?.id || '').toString();
                    return sId === targetId;
                });

                if (hasSong) {
                    initiallyIn.add(playlist._id);
                }
            });
            setSelectedIds(new Set(initiallyIn));
            setOriginalIds(new Set(initiallyIn));
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
            toast.error('Failed to load playlists');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const toAdd = Array.from(selectedIds).filter(id => !originalIds.has(id));
            const toRemove = Array.from(originalIds).filter(id => !selectedIds.has(id));

            if (toAdd.length === 0 && toRemove.length === 0) {
                onClose();
                return;
            }

            await Promise.all([
                ...toAdd.map(id => api.post(`/playlists/${id}/songs`, { songId: song._id })),
                ...toRemove.map(id => api.delete(`/playlists/${id}/songs/${song._id}`))
            ]);

            toast.success('Playlists updated');
            onClose();
        } catch (error) {
            console.error('Failed to save playlist changes:', error);
            const msg = error.response?.data?.message || 'Failed to update playlists';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        setSaving(true);
        try {
            const res = await api.post('/playlists', {
                name: newPlaylistName.trim(),
                isPublic: newPlaylistPublic
            });

            toast.success('Playlist created');

            // Update local state: The new playlist is automatically owned by the user
            const createdPlaylist = res.data;
            setPlaylists([createdPlaylist, ...playlists]);
            setSelectedIds(prev => new Set([...prev, createdPlaylist._id]));
            setShowCreate(false);
            setNewPlaylistName('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create playlist');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="add-playlist-overlay" onClick={onClose}>
            <div className="add-playlist-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add to Playlist</h3>
                    <button className="close-btn" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                <div className="song-compact-row">
                    <div className="song-art">
                        {song?.coverImage || song?.album?.coverImage ? (
                            <img src={song.coverImage || song.album?.coverImage} alt="" />
                        ) : <MusicIcon />}
                    </div>
                    <div className="song-meta">
                        <span className="song-name">{song?.title}</span>
                        <span className="artist-name">{song?.artist?.name}</span>
                    </div>
                </div>

                <div className="modal-body">
                    {showCreate ? (
                        <div className="inline-create-input">
                            <input
                                type="text"
                                placeholder="Playlist name"
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                            />
                            <div className="create-actions">
                                <label className="check-label">
                                    <input type="checkbox" checked={newPlaylistPublic} onChange={e => setNewPlaylistPublic(e.target.checked)} />
                                    <span>Public</span>
                                </label>
                                <button className="confirm-create" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>
                                    OK
                                </button>
                                <button className="cancel-create" onClick={() => setShowCreate(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button className="create-trigger" onClick={() => setShowCreate(true)}>
                            <PlusIcon />
                            <span>Create new playlist</span>
                        </button>
                    )}

                    <div className="playlists-scroll-list">
                        {loading ? (
                            <div className="list-status">Loading...</div>
                        ) : playlists.length === 0 ? (
                            <div className="list-status">No playlists found.</div>
                        ) : (
                            playlists.map(p => (
                                <div
                                    key={p._id}
                                    className={`playlist-row-item ${selectedIds.has(p._id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection(p._id)}
                                >
                                    <div className="row-left">
                                        <div className="status-circle"></div>
                                        <div className="details">
                                            <span className="p-name">{p.name}</span>
                                            <span className="p-meta">
                                                {p.songs?.length || 0} songs {p.isPublic && '• Public'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedIds.has(p._id) && (
                                        <div className="row-right">
                                            <CheckIcon />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="footer-btn secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="footer-btn primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
