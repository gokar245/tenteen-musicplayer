import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlistsApi } from '../services/api';
import { SongRow } from '../components/music';
import { LoadingPage } from '../components/common';
import { MoreVertical, Edit, Trash2, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Playlist() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            setLoading(true);
            const res = await playlistsApi.getOne(id);
            setPlaylist(res.data);

            // Debug info for permissions
            console.log('Playlist Debug:', {
                playlistId: res.data._id,
                ownerId: res.data.owner?._id,
                currentUserId: user?._id,
                role: user?.role
            });
        } catch (error) {
            console.error('Failed to fetch playlist:', error);
            toast.error('Failed to load playlist');
            navigate('/library?tab=playlists');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublic = async () => {
        try {
            await playlistsApi.update(id, { isPublic: !playlist.isPublic });
            toast.success(`Playlist is now ${!playlist.isPublic ? 'public' : 'private'}`);
            fetchPlaylist();
            setShowMenu(false);
        } catch (error) {
            toast.error('Failed to update playlist visibility');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
            return;
        }

        try {
            await playlistsApi.delete(id);
            toast.success('Playlist deleted');
            navigate('/library?tab=playlists');
        } catch (error) {
            toast.error('Failed to delete playlist');
        }
    };

    const handleRemoveSong = async (songId) => {
        try {
            await playlistsApi.removeSong(id, songId);
            toast.success('Song removed from playlist');
            fetchPlaylist();
        } catch (error) {
            toast.error('Failed to remove song');
        }
    };

    if (loading) {
        return <LoadingPage />;
    }

    if (!playlist) {
        return (
            <div className="empty-state">
                <h3>Playlist not found</h3>
            </div>
        );
    }

    // Permission Logic - Updated with loose equality check
    const isOwner = user && playlist.owner && (user._id == playlist.owner._id || user.id == playlist.owner._id);
    const isAdmin = user && user.role === 'admin';
    const canManage = isOwner || isAdmin;

    const bgStyle = playlist.backgroundColor
        ? `linear-gradient(135deg, ${playlist.backgroundColor}, ${playlist.backgroundColor}40)`
        : 'linear-gradient(135deg, var(--color-accent), var(--color-surface))';

    return (
        <div className="album-page" style={{ position: 'relative' }}>
            {/* Playlist Hero */}
            <div className="album-hero" style={{
                position: 'relative',
                background: playlist.backgroundColor ? `linear-gradient(to bottom, ${playlist.backgroundColor}80, transparent)` : undefined
            }}>

                {/* 3-Dots Menu - Absolute Top Right */}
                {canManage && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="btn-icon"
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                width: '40px',
                                height: '40px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Playlist Options"
                        >
                            <MoreVertical size={24} />
                        </button>
                        {showMenu && (
                            <div
                                className="dropdown-menu"
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    background: '#282828',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    minWidth: '200px',
                                    marginTop: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    overflow: 'hidden',
                                    zIndex: 101,
                                    padding: '4px 0'
                                }}
                            >
                                <button
                                    onClick={() => navigate(`/playlist/${id}/edit`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        width: '100%', padding: '12px 16px',
                                        background: 'transparent', border: 'none', color: 'white',
                                        cursor: 'pointer', textAlign: 'left',
                                        fontSize: '14px'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Edit size={16} /> Edit Details
                                </button>
                                <button
                                    onClick={handleTogglePublic}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        width: '100%', padding: '12px 16px',
                                        background: 'transparent', border: 'none', color: 'white',
                                        cursor: 'pointer', textAlign: 'left',
                                        fontSize: '14px'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {playlist.isPublic ? <Lock size={16} /> : <Globe size={16} />}
                                    Make {playlist.isPublic ? 'Private' : 'Public'}
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        width: '100%', padding: '12px 16px',
                                        background: 'transparent', border: 'none', color: '#ff4444',
                                        cursor: 'pointer', textAlign: 'left',
                                        fontSize: '14px'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Trash2 size={16} /> Delete Playlist
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="album-hero-artwork">
                    {playlist.coverImage ? (
                        <img src={playlist.coverImage} alt={playlist.name} />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: bgStyle,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '64px'
                        }}>
                            ♫
                        </div>
                    )}
                </div>
                <div className="album-hero-info">
                    <div className="album-hero-label">Playlist</div>
                    <h1 className="album-hero-title">{playlist.name}</h1>
                    {playlist.description && (
                        <p style={{ marginBottom: '1rem', opacity: 0.8 }}>{playlist.description}</p>
                    )}
                    <div className="album-hero-artist" style={{ fontSize: '14px', marginBottom: '12px' }}>
                        by <span style={{ fontWeight: '600' }}>{playlist.owner?.displayName || 'Unknown'}</span>
                    </div>
                    <div className="album-hero-meta">
                        <span>{playlist.songs?.length || 0} songs</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {playlist.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                            {playlist.isPublic ? 'Public' : 'Private'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Playlist Content */}
            <div className="album-content">
                {playlist.songs && playlist.songs.length > 0 ? (
                    <div className="track-list">
                        {playlist.songs.map((song, index) => (
                            <SongRow
                                key={song._id}
                                song={song}
                                index={index}
                                showAlbum={true}
                                queue={playlist.songs}
                                queueIndex={index}
                                showRemove={canManage}
                                onRemove={() => handleRemoveSong(song._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <h3>No songs in this playlist</h3>
                        <p>Add songs to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
