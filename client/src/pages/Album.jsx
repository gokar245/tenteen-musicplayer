import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { albumsApi, artistsApi } from '../services/api';
import { TrackList } from '../components/music';
import { Button, LoadingPage } from '../components/common';
import { useAudio } from '../context/AudioContext';

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const ShuffleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
);

export default function Album() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [album, setAlbum] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const { playAlbum, shuffleQueue, playSong } = useAudio();

    useEffect(() => {
        fetchAlbum();
    }, [id]);

    useEffect(() => {
        // Auto-play if directed from album card
        if (searchParams.get('autoplay') === 'true' && songs.length > 0) {
            playAlbum(songs);
        }
    }, [songs, searchParams]);

    const fetchAlbum = async () => {
        try {
            setLoading(true);
            const response = await albumsApi.getById(id);
            setAlbum(response.data.album);
            setSongs(response.data.songs || []);
        } catch (error) {
            console.error('Failed to fetch album:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = () => {
        if (songs.length > 0) {
            playAlbum(songs);
        }
    };

    const handleShuffle = () => {
        if (songs.length > 0) {
            // Play with shuffle
            const shuffled = [...songs].sort(() => Math.random() - 0.5);
            playSong(shuffled[0], shuffled, 0);
        }
    };

    // Filter songs based on search
    const filteredSongs = searchQuery
        ? songs.filter(song =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : songs;

    if (loading) {
        return <LoadingPage />;
    }

    if (!album) {
        return (
            <div className="empty-state">
                <h3 className="empty-state-title">Album not found</h3>
                <p className="empty-state-text">The album you're looking for doesn't exist.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        );
    }

    const gradientCss = typeof album.backgroundGradient === 'object' && album.backgroundGradient?.css
        ? album.backgroundGradient.css
        : album.backgroundGradient;

    const backgroundStyle = {
        background: gradientCss || `linear-gradient(180deg, ${album.dominantColor || '#4a90d9'}40 0%, transparent 100%)`
    };

    return (
        <div className="album-page">
            {/* Hero Header */}
            <div
                className="album-hero"
                style={backgroundStyle}
            >
                <div className="album-hero-artwork">
                    {album.poster || album.coverImage ? (
                        <img src={album.poster || album.coverImage} alt={album.name} />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '64px'
                        }}>
                            ♪
                        </div>
                    )}
                </div>
                <div className="album-hero-info">
                    <div className="album-hero-label">Movie / Album</div>
                    <h1 className="album-hero-title">{album.name}</h1>
                    <div className="album-hero-artist">
                        {album.artist && (
                            <Link to={`/artist/${album.artist._id}`}>
                                {album.artist.name}
                            </Link>
                        )}
                    </div>
                    <div className="album-hero-meta">
                        {album.releaseYear && <span>{album.releaseYear}</span>}
                        <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
                    </div>

                    <div className="album-hero-actions">
                        <Button variant="primary" size="lg" icon={<PlayIcon />} onClick={handlePlay}>
                            Play
                        </Button>
                        <Button variant="secondary" size="lg" icon={<ShuffleIcon />} onClick={handleShuffle}>
                            Shuffle
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="album-content">
                {/* Track List */}
                <TrackList songs={filteredSongs} showAlbum={false} />
            </div>
        </div>
    );
}
