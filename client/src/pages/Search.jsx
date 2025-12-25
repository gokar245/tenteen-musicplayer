import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchApi } from '../services/api';
import { AlbumCard, ArtistCard, SongRow } from '../components/music';
import { LoadingPage } from '../components/common';
import { useAudio } from '../context/AudioContext';

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();
    const { playSong } = useAudio();
    const query = new URLSearchParams(location.search).get('q') || '';

    const [results, setResults] = useState({ songs: [], albums: [], artists: [], playlists: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('songs');

    useEffect(() => {
        if (query) {
            handleSearch();
        }
    }, [query]);

    const handleSearch = async () => {
        try {
            setLoading(true);
            const res = await searchApi.global(query);
            setResults({
                songs: res.data.songs || [],
                albums: res.data.albums || [],
                artists: res.data.artists || [],
                playlists: res.data.playlists || []
            });
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !results.songs.length && !results.albums.length && !results.artists.length && !results.playlists.length) {
        return <LoadingPage />;
    }

    const tabs = [
        { id: 'songs', label: 'Songs', count: results.songs.length },
        { id: 'albums', label: 'Albums', count: results.albums.length },
        { id: 'artists', label: 'Artists', count: results.artists.length },
        { id: 'playlists', label: 'Playlists', count: results.playlists.length }
    ];

    return (
        <div className="search-page">
            <h1 style={{ marginBottom: 'var(--space-xl)' }}>
                {query ? `Search results for "${query}"` : 'Search'}
            </h1>

            {/* Results Tabs */}
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

            <div className="search-results-content" style={{ marginTop: 'var(--space-xl)' }}>
                {/* Songs View */}
                {activeTab === 'songs' && (
                    <div className="songs-results">
                        {results.songs.length > 0 ? (
                            <div className="songs-list">
                                {results.songs.map((song, index) => (
                                    <SongRow
                                        key={song._id}
                                        song={song}
                                        index={index}
                                        onPlay={() => playSong(song)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="empty-state-text">No songs found.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Albums View */}
                {activeTab === 'albums' && (
                    <div className="albums-results">
                        {results.albums.length > 0 ? (
                            <div className="search-results-grid">
                                {results.albums.map(album => (
                                    <AlbumCard key={album._id} album={album} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="empty-state-text">No albums found.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Playlists View */}
                {activeTab === 'playlists' && (
                    <div className="playlists-results">
                        {results.playlists.length > 0 ? (
                            <div className="search-results-grid">
                                {results.playlists.map(playlist => (
                                    <div
                                        key={playlist._id}
                                        className="card album-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/playlist/${playlist._id}`)}
                                    >
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
                                        <div className="album-card-info">
                                            <div className="album-card-title">{playlist.name}</div>
                                            <div className="album-card-artist" style={{ fontSize: '12px', opacity: 0.7 }}>
                                                by {playlist.owner?.displayName || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="empty-state-text">No playlists found.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Artists View */}
                {activeTab === 'artists' && (
                    <div className="artists-results">
                        {results.artists.length > 0 ? (
                            <div className="search-results-grid">
                                {results.artists.map(artist => (
                                    <ArtistCard key={artist._id} artist={artist} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="empty-state-text">No artists found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
