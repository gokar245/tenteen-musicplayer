import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { searchApi } from '../../services/api';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthContext';

// Simple Search Icon
const SearchIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);


export default function TopBar({ onSearch, placeholder, toggleMobileMenu }) {

    const { user, logout } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const searchRef = useRef(null);
    const profileRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { playSong } = useAudio();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Debounce search
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            if (onSearch) {
                onSearch(query);
            } else {
                setLoading(true);
                try {
                    const res = await searchApi.global(query);
                    setResults(res.data);
                    setShowResults(true);
                } catch (err) {
                    console.error('Search error:', err);
                } finally {
                    setLoading(false);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        return 'What do you want to play?';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setShowResults(false);
        if (onSearch) {
            onSearch(query);
        } else {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const handleSongClick = (song) => {
        playSong(song);
        setShowResults(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="topbar">
            {/* Mobile Menu Toggle */}
            <button
                className="mobile-menu-btn"
                onClick={toggleMobileMenu}
                style={{
                    display: 'none',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px'
                }}
            >
                <MenuIcon />
            </button>

            {/* Search Bar - Centered/Prominent */}

            <div className="search-container" ref={searchRef}>
                <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%' }}>
                    <SearchIcon className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={getPlaceholder()}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (results && query.length >= 2) setShowResults(true);
                        }}
                    />
                </form>

                {/* Search Suggestions Dropdown */}
                {showResults && !onSearch && results && (
                    <div className="search-dropdown" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        background: '#282828',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '4px'
                    }}>
                        {loading && <div style={{ padding: '10px', textAlign: 'center', color: '#888' }}>Searching...</div>}

                        {/* Artists */}
                        {results.artists?.length > 0 && (
                            <div className="search-section">
                                <h4 style={{ padding: '8px 12px', margin: '4px 0 0', fontSize: '11px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase' }}>Artists</h4>
                                {results.artists.map(artist => (
                                    <div
                                        key={artist._id}
                                        onClick={() => { navigate(`/artist/${artist._id}`); setShowResults(false); }}
                                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e3e3e'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
                                            {(artist.image || artist.photo) && <img src={artist.image || artist.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        </div>
                                        <div style={{ color: '#fff', fontSize: '14px' }}>{artist.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Albums / Movies */}
                        {results.albums?.length > 0 && (
                            <div className="search-section">
                                <h4 style={{ padding: '8px 12px', margin: '8px 0 0', fontSize: '11px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase' }}>Albums & Movies</h4>
                                {results.albums.map(album => (
                                    <div
                                        key={album._id}
                                        onClick={() => { navigate(`/album/${album._id}`); setShowResults(false); }}
                                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e3e3e'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 2, background: '#333', overflow: 'hidden' }}>
                                            {(album.poster || album.coverImage) && <img src={album.poster || album.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        </div>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '14px' }}>{album.name}</div>
                                            <div style={{ color: '#b3b3b3', fontSize: '12px' }}>{album.artist?.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Playlists */}
                        {results.playlists?.length > 0 && (
                            <div className="search-section">
                                <h4 style={{ padding: '8px 12px', margin: '8px 0 0', fontSize: '11px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase' }}>Playlists</h4>
                                {results.playlists.map(playlist => (
                                    <div
                                        key={playlist._id}
                                        onClick={() => { navigate(`/playlist/${playlist._id}`); setShowResults(false); }}
                                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e3e3e'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 2, background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {(playlist.coverImage) ? (
                                                <img src={playlist.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '10px', color: '#fff' }}>♫</span>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '14px' }}>{playlist.name}</div>
                                            <div style={{ color: '#b3b3b3', fontSize: '12px' }}>by {playlist.owner?.displayName || 'User'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Songs */}
                        {results.songs?.length > 0 && (
                            <div className="search-section">
                                <h4 style={{ padding: '8px 12px', margin: '8px 0 0', fontSize: '11px', color: '#b3b3b3', fontWeight: 'bold', textTransform: 'uppercase' }}>Songs</h4>
                                {results.songs.map(song => (
                                    <div
                                        key={song._id}
                                        onClick={() => handleSongClick(song)}
                                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e3e3e'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 2, background: '#333', overflow: 'hidden' }}>
                                            {(song.coverImage || song.album?.poster || song.album?.coverImage) && (
                                                <img src={song.coverImage || song.album?.poster || song.album?.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '14px' }}>{song.title}</div>
                                            <div style={{ color: '#b3b3b3', fontSize: '12px' }}>{song.artist?.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(!results.songs?.length && !results.albums?.length && !results.artists?.length) && (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#b3b3b3', fontSize: '14px' }}>
                                No results found for "{query}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT: Actions & Profile */}
            <div className="topbar-actions" ref={profileRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 20 }}>
                <Link to="/upload" className="btn btn-primary" style={{ height: '40px', padding: '0 20px' }}>
                    Upload Music
                </Link>


                <div style={{ position: 'relative' }}>
                    <div
                        className="profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        title="Profile"
                        style={{ cursor: 'pointer' }}
                    >
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid transparent' }} />
                        ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3D0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    {showProfileMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            width: '200px',
                            backgroundColor: '#181818',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                                <div style={{ color: 'white', fontWeight: 'bold' }}>{user?.displayName}</div>
                                <div style={{ color: '#888', fontSize: '12px' }}>{user?.email}</div>
                            </div>
                            <Link to="/settings" className="dropdown-item" style={{ padding: '10px 12px', textDecoration: 'none', color: '#e0e0e0', fontSize: '14px', borderRadius: '4px' }} onMouseEnter={e => e.target.style.background = '#333'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                                Settings
                            </Link>
                            <div onClick={handleLogout} className="dropdown-item" style={{ padding: '10px 12px', cursor: 'pointer', color: '#ff4444', fontSize: '14px', borderRadius: '4px' }} onMouseEnter={e => e.target.style.background = 'rgba(255, 68, 68, 0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                                Log out
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
