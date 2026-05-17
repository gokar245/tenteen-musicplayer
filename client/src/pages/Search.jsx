import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchApi } from '../services/api';
import { ArtistCard, SongRow } from '../components/music';
import { LoadingPage } from '../components/common';
import { useAudio } from '../context/AudioContext';

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();
    const { playSong } = useAudio();
    const query = new URLSearchParams(location.search).get('q') || '';

    const [results, setResults] = useState({ songs: [], artists: [] });
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
                artists: res.data.artists || []
            });
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !results.songs.length && !results.artists.length) {
        return <LoadingPage />;
    }

    const tabs = [
        { id: 'songs', label: 'Songs', count: results.songs.length },
        { id: 'artists', label: 'Artists', count: results.artists.length }
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
