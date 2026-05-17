import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { songsApi, artistsApi } from '../services/api';
import { SongRow, ArtistCard } from '../components/music';
import { LoadingPage } from '../components/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [recentSongs, setRecentSongs] = useState([]);
    const [trendingSongs, setTrendingSongs] = useState([]);
    const [recommendedArtists, setRecommendedArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    const artistsScrollRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch recent playback history
            const historyRes = await songsApi.getHistory(20);
            const historyData = historyRes.data;
            const history = Array.isArray(historyData)
                ? historyData
                : (historyData?.history || []);

            // Extract songs from history
            const songs = history
                .filter(h => h.song)
                .map(h => ({ ...h.song, progress: h.progress }));
            setRecentSongs(songs);

            // Fetch all songs sorted by plays (trending)
            const songsRes = await songsApi.getAll({ limit: 20, page: 1 });
            const allSongs = songsRes.data.songs || [];
            const trending = [...allSongs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
            setTrendingSongs(trending);

            // Fetch artists (for recommendations)
            const artistsRes = await artistsApi.getAll({ limit: 10 });
            setRecommendedArtists(artistsRes.data.artists || []);

        } catch (error) {
            console.error('Failed to fetch home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollHorizontal = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = 300;
            const targetScroll = ref.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            ref.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    const HorizontalScrollSection = ({ title, linkTo, linkText, scrollRef, children, showArrows = true }) => (
        <section className="home-section">
            <div className="section-header" style={{ gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                    <h2 className="section-title">{title}</h2>
                    {linkTo && <Link to={linkTo} className="section-link">{linkText || 'View All'}</Link>}
                </div>
                {showArrows && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                            onClick={() => scrollHorizontal(scrollRef, 'left')}
                            className="scroll-btn"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'background 0.2s'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scrollHorizontal(scrollRef, 'right')}
                            className="scroll-btn"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'background 0.2s'
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
            <div
                ref={scrollRef}
                className="horizontal-scroll"
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '24px',
                    paddingBottom: '16px',
                    scrollBehavior: 'smooth',
                    maxWidth: '100%'
                }}
            >
                {children}
            </div>
        </section>
    );

    if (loading) {
        return <LoadingPage />;
    }

    return (
        <div className="home-page">
            {/* Recently Played Songs */}
            {recentSongs.length > 0 && (
                <section className="home-section">
                    <div className="section-header">
                        <h2 className="section-title">Recently Played</h2>
                    </div>
                    <div className="recent-songs-list">
                        {recentSongs.slice(0, 10).map((song, index) => (
                            <SongRow
                                key={song._id}
                                song={song}
                                index={index}
                                showProgress={true}
                                progress={song.progress}
                                queue={recentSongs.slice(0, 10)}
                                queueIndex={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Trending / Popular Songs */}
            {trendingSongs.length > 0 && (
                <section className="home-section">
                    <div className="section-header">
                        <h2 className="section-title">Trending / Popular</h2>
                    </div>
                    <div className="recent-songs-list">
                        {trendingSongs.map((song, index) => (
                            <SongRow
                                key={song._id}
                                song={song}
                                index={index}
                                showProgress={false}
                                queue={trendingSongs}
                                queueIndex={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Recommended Artists */}
            {recommendedArtists.length > 0 && (
                <HorizontalScrollSection
                    title="Artists You Might Like"
                    linkTo="/library"
                    linkText="View All"
                    scrollRef={artistsScrollRef}
                >
                    {recommendedArtists.map(artist => (
                        <ArtistCard key={artist._id} artist={artist} />
                    ))}
                </HorizontalScrollSection>
            )}

            {/* Empty State */}
            {recentSongs.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="16" r="3" />
                        </svg>
                    </div>
                    <h3 className="empty-state-title">Start Your Music Journey</h3>
                    <p className="empty-state-text">
                        Upload some music or explore your library to get started.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <Link to="/upload" className="btn btn-primary">Upload Music</Link>
                        <Link to="/library" className="btn btn-secondary">Browse Library</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
