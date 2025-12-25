import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import api from '../../services/api';
import { TimerModal, PlaylistModal } from '../music';

// Icons
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

const PrevIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="19 20 9 12 19 4 19 20" />
        <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const NextIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 4 15 12 5 20 5 4" />
        <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const RepeatIcon = ({ mode }) => {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: mode !== 'off' ? 'var(--color-accent)' : 'inherit' }}>
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            {mode === 'one' && (
                <text x="12" y="15" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle">1</text>
            )}
        </svg>
    );
};

const ShuffleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
);


const VolumeIcon = ({ volume }) => {
    if (volume === 0) {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
        );
    }
    if (volume < 0.5) {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
    );
};

const LoadingSpinner = () => (
    <div className="loading-spinner" style={{ width: 20, height: 20 }} />
);

// New Icons
const PlaylistAddIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
);

const TimerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);


export default function AudioPlayer() {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const { user } = useAuth();

    const {
        currentSong,
        isPlaying,
        isBuffering,
        duration,
        currentTime,
        volume,
        progress,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        changeVolume,
        formatTime,
        repeatMode,
        toggleRepeatMode,
        shuffleQueue,
        sleepTimerEnd
    } = useAudio();

    // Track if timer is active
    const timerActive = !!sleepTimerEnd && sleepTimerEnd > Date.now();

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const handleProgressClick = (e) => {
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seekTo(percent * duration);
    };

    const handleVolumeChange = (e) => {
        changeVolume(parseFloat(e.target.value));
    };

    // Playlist Logic
    const fetchPlaylists = async () => {
        try {
            const res = await api.get('/playlists');
            setPlaylists(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addToPlaylist = async (playlistId) => {
        try {
            await api.post(`/playlists/${playlistId}/songs`, { songId: currentSong._id });
            alert('Added to playlist!');
            setShowPlaylistModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add');
        }
    };

    const createAndAdd = async () => {
        if (!newPlaylistName.trim()) return;
        try {
            const res = await api.post('/playlists', { name: newPlaylistName });
            await addToPlaylist(res.data._id);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create');
        }
    };

    const openPlaylistModal = () => {
        fetchPlaylists();
        setShowPlaylistModal(true);
    };

    // Timer Logic
    const handleSetTimer = (minutes) => {
        setSleepTimer(minutes);
        setTimerActive(true);
        setShowTimerModal(false);
        alert(`Music will stop in ${minutes} minutes`);
    };

    const handleCancelTimer = () => {
        cancelSleepTimer();
        setTimerActive(false);
        setShowTimerModal(false);
        alert('Timer cancelled');
    };

    const handleDeleteSong = async () => {
        if (!confirm(`Are you sure you want to delete "${currentSong.title}"? This cannot be undone.`)) return;

        try {
            // Stop playback first
            playNext();
            // Or trigger a specialized stop, but playNext is safer to clear the current buffer

            // Use the songs endpoint which allows admins
            await api.delete(`/songs/${currentSong._id}`);
            alert('Song deleted successfully');
            // Optimistically we moved to next song, but we might want to refresh lists if we were on a page showing it.
            // For now, simple deletion is enough.
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete song');
        }
    };

    // Don't render if no song is loaded
    if (!currentSong) {
        return (
            <div className="audio-player">
                <div className="player-left">
                    <div className="player-artwork" style={{ background: 'var(--color-surface)' }} />
                    <div className="player-info">
                        <div className="player-title text-muted">No song playing</div>
                        <div className="player-artist">Select a song to play</div>
                    </div>
                </div>
                <div className="player-center">
                    <div className="player-controls">
                        <button className="player-btn" disabled><PrevIcon /></button>
                        <button className="player-btn play-btn" disabled><PlayIcon /></button>
                        <button className="player-btn" disabled><NextIcon /></button>
                    </div>
                    <div className="player-progress">
                        <span className="player-time">0:00</span>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '0%' }} />
                        </div>
                        <span className="player-time">0:00</span>
                    </div>
                </div>
                <div className="player-right">
                    <div className="volume-control">
                        <button className="player-btn"><VolumeIcon volume={volume} /></button>
                        <input
                            type="range"
                            className="volume-slider"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic Background for Full Screen
    const bgStyle = isFullScreen ? {
        background: `linear-gradient(180deg, ${currentSong?.dominantColor || currentSong?.album?.dominantColor || '#1a1f2e'} 0%, #000000 100%)`
    } : {};

    return (
        <div className={`audio-player ${isFullScreen ? 'full-screen' : ''}`} style={bgStyle}>
            {/* Left - Song Info */}
            <div className="player-left">
                <div className="player-artwork" onClick={toggleFullScreen}>
                    {(currentSong.coverImage || currentSong.album?.coverImage || currentSong.album?.poster) ? (
                        <img src={currentSong.coverImage || currentSong.album?.coverImage || currentSong.album?.poster} alt={currentSong.title} />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, var(--color-accent), var(--color-surface))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '24px'
                        }}>
                            ♪
                        </div>
                    )}
                </div>
                <div className="player-info">
                    <div className="player-title">{currentSong.title}</div>
                    <div className="player-artist">{currentSong.artist?.name || 'Unknown Artist'}</div>
                </div>
                {/* Extra Actions for Full Screen Mobile */}
                {isFullScreen && (
                    <div className="mobile-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        <button className="player-btn" onClick={(e) => { e.stopPropagation(); openPlaylistModal(); }} title="Add to Playlist">
                            <PlaylistAddIcon />
                        </button>
                        <button className="player-btn" onClick={(e) => { e.stopPropagation(); setShowTimerModal(true); }} title="Sleep Timer" style={{ color: timerActive ? 'var(--color-accent)' : 'inherit' }}>
                            <TimerIcon />
                        </button>
                        {user?.role === 'admin' && (
                            <button className="player-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSong(); }} title="Delete Song (Admin)" style={{ color: '#ff4444' }}>
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Center - Controls & Progress */}
            <div className="player-center">
                <div className="player-controls">
                    <button className="player-btn shuffle-btn" onClick={shuffleQueue} title="Shuffle">
                        <ShuffleIcon />
                    </button>
                    <button className="player-btn" onClick={playPrevious}>
                        <PrevIcon />
                    </button>
                    <button className="player-btn play-btn" onClick={togglePlay}>
                        {isBuffering ? <LoadingSpinner /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button className="player-btn" onClick={playNext}>
                        <NextIcon />
                    </button>
                    <button className="player-btn repeat-btn" onClick={toggleRepeatMode} title={`Repeat Mode: ${repeatMode}`}>
                        <RepeatIcon mode={repeatMode} />
                    </button>
                </div>

                <div className="player-progress">
                    <span className="player-time">{formatTime(currentTime)}</span>
                    <div className="progress-bar" onClick={handleProgressClick}>
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="player-time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right - Volume (Desktop) */}
            <div className="player-right">
                <div className="volume-control">
                    <button className="player-btn" onClick={() => changeVolume(volume > 0 ? 0 : 0.7)}>
                        <VolumeIcon volume={volume} />
                    </button>
                    <input
                        type="range"
                        className="volume-slider"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                </div>
                {/* Desktop Extra Actions */}
                <button className="player-btn" onClick={openPlaylistModal} title="Add to Playlist" style={{ marginLeft: '10px' }}>
                    <PlaylistAddIcon />
                </button>
                {user?.role === 'admin' && (
                    <button className="player-btn" onClick={handleDeleteSong} title="Delete Song (Admin)" style={{ marginLeft: '10px', color: '#ff4444' }}>
                        <DeleteIcon />
                    </button>
                )}
            </div>

            {/* Modals - Using new components */}
            <TimerModal
                isOpen={showTimerModal}
                onClose={() => setShowTimerModal(false)}
            />
            <PlaylistModal
                isOpen={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                song={currentSong}
            />
        </div>
    );
}
