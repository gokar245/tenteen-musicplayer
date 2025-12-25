import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { artistsApi } from '../services/api';
import { AlbumCard, TrackList } from '../components/music';
import { Button, LoadingPage } from '../components/common';
import { useAudio } from '../context/AudioContext';

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

export default function Artist() {
    const { id } = useParams();
    const [artist, setArtist] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    const { playAlbum } = useAudio();

    useEffect(() => {
        fetchArtist();
    }, [id]);

    const fetchArtist = async () => {
        try {
            setLoading(true);
            const response = await artistsApi.getById(id);
            setArtist(response.data.artist);
            setAlbums(response.data.albums || []);
            setSongs(response.data.songs || []);
        } catch (error) {
            console.error('Failed to fetch artist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayAll = () => {
        if (songs.length > 0) {
            playAlbum(songs);
        }
    };

    if (loading) {
        return <LoadingPage />;
    }

    if (!artist) {
        return (
            <div className="empty-state">
                <h3 className="empty-state-title">Artist not found</h3>
                <p className="empty-state-text">The artist you're looking for doesn't exist.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        );
    }

    const gradientCss = typeof artist.backgroundGradient === 'object' && artist.backgroundGradient?.css
        ? artist.backgroundGradient.css
        : artist.backgroundGradient;

    const backgroundStyle = {
        background: gradientCss || `linear-gradient(180deg, ${artist.dominantColor || '#394867'}40 0%, transparent 100%)`
    };

    return (
        <div className="artist-page">
            {/* Hero */}
            <div
                className="artist-hero"
                style={backgroundStyle}
            >
                <div className="artist-hero-image">
                    {artist.image || artist.photo ? (
                        <img src={artist.image || artist.photo} alt={artist.name} />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '48px'
                        }}>
                            ♪
                        </div>
                    )}
                </div>
                <div className="artist-hero-info">
                    <h1>{artist.name}</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                        {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                    </p>
                    <Button variant="primary" size="lg" icon={<PlayIcon />} onClick={handlePlayAll}>
                        Play All
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="album-content">
                {/* Apps often show "Popular" or "Latest Release". Here just "All Songs" or "Popular Songs" per spec */}

                {/* All Songs */}
                {songs.length > 0 && (
                    <section style={{ marginTop: 'var(--space-xl)' }}>
                        <h2 className="section-title" style={{ marginBottom: 'var(--space-lg)' }}>
                            Popular Songs
                        </h2>
                        <TrackList songs={songs} showAlbum={true} />
                    </section>
                )}
            </div>
        </div>
    );
}
