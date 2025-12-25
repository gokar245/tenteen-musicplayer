import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { albumsApi, artistsApi, playlistsApi } from '../services/api';
import { AlbumCard, ArtistCard } from '../components/music';
import { LoadingPage } from '../components/common';
import { MoreVertical, Edit, Trash2, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Library() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'albums');
    const [loading, setLoading] = useState(true);
    const [menuOpenId, setMenuOpenId] = useState(null);

    useEffect(() => {
        fetchLibrary();
    }, []);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const fetchLibrary = async () => {
        try {
            setLoading(true);
            const [albumsRes, artistsRes, playlistsRes] = await Promise.all([
                albumsApi.getAll({ limit: 50 }),
                artistsApi.getAll({ limit: 50 }),
                playlistsApi.getAll()
            ]);

            setAlbums(albumsRes.data.albums || []);
            setArtists(artistsRes.data.artists || []);
            setPlaylists(playlistsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch library:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlaylist = async (playlistId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this playlist?')) {
            return;
        }

        try {
            await playlistsApi.delete(playlistId);
            toast.success('Playlist deleted');
            fetchLibrary();
            setMenuOpenId(null);
        } catch (error) {
            toast.error('Failed to delete playlist');
        }
    };

    const handleTogglePublic = async (playlist, e) => {
        e.stopPropagation();
        try {
            await playlistsApi.update(playlist._id, { isPublic: !playlist.isPublic });
            toast.success(`Playlist is now ${!playlist.isPublic ? 'public' : 'private'}`);
            fetchLibrary();
            setMenuOpenId(null);
        } catch (error) {
            toast.error('Failed to update playlist visibility');
        }
    };

    if (loading) {
        return <LoadingPage />;
    }

    const tabs = [
        { id: 'albums', label: 'Albums', count: albums.length },
        { id: 'artists', label: 'Artists', count: artists.length },
        { id: 'playlists', label: 'Playlists', count: playlists.length }
    ];

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="library-page">
            <h1 style={{ marginBottom: 'var(--space-xl)' }}>Your Library</h1>

            {/* Tabs */}
            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Albums */}
            {activeTab === 'albums' && (
                <div>
                    {albums.length > 0 ? (
                        <div className="search-results-grid">
                            {albums.map(album => (
                                <AlbumCard key={album._id} album={album} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No albums yet</h3>
                            <p className="empty-state-text">Upload some music to get started.</p>
                            <Link to="/upload" className="btn btn-primary">Upload Music</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Artists */}
            {activeTab === 'artists' && (
                <div>
                    {artists.length > 0 ? (
                        <div className="search-results-grid">
                            {artists.map(artist => (
                                <ArtistCard key={artist._id} artist={artist} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No artists yet</h3>
                            <p className="empty-state-text">Upload some music to get started.</p>
                            <Link to="/upload" className="btn btn-primary">Upload Music</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Playlists */}
            {activeTab === 'playlists' && (
                <div>
                    {playlists.length > 0 ? (
                        <div className="search-results-grid">
                            {playlists.map(playlist => {
                                const isOwner = currentUser._id === playlist.owner?._id;
                                const isAdmin = currentUser.role === 'admin';
                                const canManage = isOwner || isAdmin;
                                return (
                                    <div
                                        key={playlist._id}
                                        className="card album-card"
                                        style={{
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'transform 0.2s'
                                        }}
                                        onClick={() => navigate(`/playlist/${playlist._id}`)}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {/* Three-dot menu - only show for owner or admin */}
                                        {canManage && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '8px',
                                                    right: '8px',
                                                    zIndex: 10
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId(menuOpenId === playlist._id ? null : playlist._id);
                                                    }}
                                                    className="player-btn"
                                                    style={{
                                                        background: 'transparent',
                                                        width: '24px',
                                                        height: '24px',
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--color-text-secondary)'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {menuOpenId === playlist._id && (
                                                    <div
                                                        className="dropdown-menu"
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '100%',
                                                            right: 0,
                                                            background: 'var(--color-bg-secondary)',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                                            minWidth: '160px',
                                                            zIndex: 1000,
                                                            marginBottom: '4px'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/playlist/${playlist._id}`);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                padding: '10px 12px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '13px'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Edit size={14} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleTogglePublic(playlist, e)}
                                                            style={{
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                padding: '10px 12px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '13px'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {playlist.isPublic ? <Lock size={14} /> : <Globe size={14} />}
                                                            Make {playlist.isPublic ? 'Private' : 'Public'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeletePlaylist(playlist._id, e)}
                                                            style={{
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                padding: '10px 12px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#ff4444',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '13px'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="album-card-artwork">
                                            {playlist.coverImage ? (
                                                <img src={playlist.coverImage} alt={playlist.name} />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-surface))',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '32px'
                                                }}>
                                                    ♫
                                                </div>
                                            )}
                                        </div>
                                        <div className="album-card-info" style={{ paddingRight: '24px' }}>
                                            <div className="album-card-title" style={{ marginBottom: '4px' }}>
                                                {playlist.name}
                                            </div>
                                            <div className="album-card-artist" style={{ fontSize: '11px', opacity: 0.7 }}>
                                                by {playlist.owner?.displayName || 'Unknown'}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                opacity: 0.6,
                                                marginTop: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {playlist.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                                                {playlist.songs?.length || 0} songs
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No playlists yet</h3>
                            <p className="empty-state-text">Create a playlist to organize your music.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
