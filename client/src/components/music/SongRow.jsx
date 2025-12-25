import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

const MoreIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
    </svg>
);

export default function SongRow({
    song,
    index,
    showAlbum = true,
    showProgress = false,
    progress = 0,
    queue = [],
    queueIndex = 0
}) {
    const navigate = useNavigate();
    const { currentSong, isPlaying, playSong, togglePlay } = useAudio();
    const { user } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    const isCurrentSong = currentSong?._id === song._id;
    const isAdmin = user?.role === 'admin';

    const handleClick = () => {
        if (isCurrentSong) {
            togglePlay();
        } else {
            playSong(song, queue.length > 0 ? queue : [song], queueIndex);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this song?')) return;
        try {
            await api.delete(`/admin/reject/${song._id}`);
            toast.success('Song deleted successfully');
            window.location.reload();
        } catch (err) {
            toast.error('Failed to delete song');
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        navigate(`/edit-song/${song._id}`);
        setShowMenu(false);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`song-row ${isCurrentSong ? 'playing' : ''}`}
            onClick={handleClick}
            style={{ position: 'relative' }}
        >
            {/* Track Number / Play Icon */}
            <div className="song-row-number">{index + 1}</div>
            <div className="song-row-play">
                {isCurrentSong && isPlaying ? <PauseIcon /> : <PlayIcon />}
            </div>

            {/* Album Artwork (if showing album) */}
            {showAlbum && (
                <div className="song-row-artwork">
                    {song.coverImage || song.album?.poster || song.album?.coverImage ? (
                        <img src={song.coverImage || song.album?.poster || song.album?.coverImage} alt={song.title} />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, var(--color-accent), var(--color-surface))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px'
                        }}>
                            ♪
                        </div>
                    )}
                </div>
            )}

            {/* Song Info */}
            <div className="song-row-info">
                <div className="song-row-title">{song.title}</div>
                <div className="song-row-artist">
                    {song.artist?.name || 'Unknown Artist'}
                    {showAlbum && song.album?.name && ` • ${song.album.name}`}
                </div>
            </div>

            {/* Progress Indicator (for recently played) */}
            {showProgress && progress > 0 && progress < 1 && (
                <div className="song-row-progress">
                    <div
                        className="song-row-progress-fill"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            )}

            {/* Duration & Admin Actions */}
            <div className="song-row-duration" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>{formatDuration(song.duration)}</span>

                {isAdmin && (
                    <div className="admin-actions-dropdown" style={{ position: 'relative' }}>
                        <button
                            className="admin-more-btn"
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            <MoreIcon />
                        </button>

                        {showMenu && (
                            <div className="song-admin-menu" style={{
                                position: 'absolute',
                                right: '0',
                                top: '100%',
                                background: '#282828',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                padding: '4px 0',
                                zIndex: '1000',
                                minWidth: '100px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}>
                                <button onClick={handleEdit} style={{
                                    display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                                    background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem'
                                }}>Edit</button>
                                <button onClick={handleDelete} style={{
                                    display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                                    background: 'transparent', border: 'none', color: '#ff4444', fontSize: '0.85rem'
                                }}>Delete</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
