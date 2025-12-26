import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { songsApi, albumsApi, playlistsApi, artistsApi } from '../services/api';
import { AlbumCard, SongRow, ArtistCard } from '../components/music';
import { LoadingPage } from '../components/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [recentSongs, setRecentSongs] = useState([]);
    const [recentAlbums, setRecentAlbums] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [publicPlaylists, setPublicPlaylists] = useState([]);
    const [trendingSongs, setTrendingSongs] = useState([]);
    const [recommendedAlbums, setRecommendedAlbums] = useState([]);
    const [recommendedArtists, setRecommendedArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Refs for horizontal scroll containers
    const albumsScrollRef = useRef(null);
    const playlistsScrollRef = useRef(null);
    const artistsScrollRef = useRef(null);
    const recommendedAlbumsScrollRef = useRef(null);

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

            // Extract unique albums from history
            const albumMap = new Map();
            history.forEach(h => {
                if (h.song?.album?._id && !albumMap.has(h.song.album._id)) {
                    albumMap.set(h.song.album._id, h.song.album);
                }
            });
            setRecentAlbums(Array.from(albumMap.values()).slice(0, 10));

            // Fetch user's playlists
            const playlistsRes = await playlistsApi.getAll();
            setUserPlaylists(Array.isArray(playlistsRes.data) ? playlistsRes.data : []);

            // Fetch public playlists
            const publicPlaylistsRes = await playlistsApi.getPublic();
            setPublicPlaylists(Array.isArray(publicPlaylistsRes.data) ? publicPlaylistsRes.data : []);

            // Fetch all songs sorted by plays (trending)
            const songsRes = await songsApi.getAll({ limit: 20, page: 1 });
            const allSongs = songsRes.data.songs || [];
            // Sort by plays (descending)
            const trending = [...allSongs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
            setTrendingSongs(trending);

            // Fetch recommended albums (if not enough from history, fetch recent)
            if (albumMap.size < 6) {
                const albumsRes = await albumsApi.getAll({ limit: 10 });
                const fetchedAlbums = albumsRes.data.albums || [];
                fetchedAlbums.forEach(album => {
                    if (!albumMap.has(album._id)) {
                        albumMap.set(album._id, album);
                    }
                });
            }
            setRecommendedAlbums(Array.from(albumMap.values()).slice(0, 10));

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
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
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
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
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
                onWheel={(e) => {
                    // Enable horizontal scroll with mouse wheel
                    e.preventDefault();
                    if (scrollRef.current) {
                        scrollRef.current.scrollLeft += e.deltaY;
                    }
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
            {/* Recently Played Albums */}
            {recentAlbums.length > 0 && (
                <HorizontalScrollSection
                    title="Jump Back In"
                    linkTo="/library"
                    linkText="View All"
                    scrollRef={albumsScrollRef}
                >
                    {recentAlbums.map(album => (
                        <AlbumCard key={album._id} album={album} />
                    ))}
                </HorizontalScrollSection>
            )}

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
                                showAlbum={true}
                                showProgress={true}
                                progress={song.progress}
                                queue={recentSongs.slice(0, 10)}
                                queueIndex={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Your Playlists */}
            {userPlaylists.length > 0 && (
                <HorizontalScrollSection
                    title="Your Playlists"
                    linkTo="/library?tab=playlists"
                    linkText="View All"
                    scrollRef={playlistsScrollRef}
                >
                    {userPlaylists.map(playlist => (
                        <div
                            key={playlist._id}
                            className="card album-card"
                            style={{ cursor: 'pointer', minWidth: '180px' }}
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
                                    by {playlist.owner?.displayName || 'You'}
                                </div>
                            </div>
                        </div>
                    ))}
                </HorizontalScrollSection>
            )}

            {/* Public Playlists */}
            {publicPlaylists.length > 0 && (
                <HorizontalScrollSection
                    title="Community Playlists"
                    linkTo="/library?tab=playlists"
                    linkText=""
                    scrollRef={null}
                >
                    {publicPlaylists.map(playlist => (
                        <div
                            key={playlist._id}
                            className="card album-card"
                            style={{ cursor: 'pointer', minWidth: '180px' }}
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
                                <div className="album-card-title" style={{ fontSize: '1rem' }}>{playlist.name}</div>
                                <div className="album-card-artist" style={{ fontSize: '12px', opacity: 0.7 }}>
                                    by {playlist.owner?.displayName || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    ))}
                </HorizontalScrollSection>
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
                                showAlbum={true}
                                showProgress={false}
                                queue={trendingSongs}
                                queueIndex={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Recommended Albums */}
            {recommendedAlbums.length > 0 && (
                <HorizontalScrollSection
                    title="Recommended For You"
                    linkTo="/library?tab=albums"
                    linkText="View All"
                    scrollRef={recommendedAlbumsScrollRef}
                >
                    {recommendedAlbums.map(album => (
                        <AlbumCard key={album._id} album={album} />
                    ))}
                </HorizontalScrollSection>
            )}

            {/* Recommended Artists */}
            {recommendedArtists.length > 0 && (
                <HorizontalScrollSection
                    title="Artists You Might Like"
                    linkTo="/library?tab=artists"
                    linkText="View All"
                    scrollRef={artistsScrollRef}
                >
                    {recommendedArtists.map(artist => (
                        <ArtistCard key={artist._id} artist={artist} />
                    ))}
                </HorizontalScrollSection>
            )}

            {/* Empty State */}
            {recentAlbums.length === 0 && recentSongs.length === 0 && (
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
