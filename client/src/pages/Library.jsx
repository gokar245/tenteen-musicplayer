import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artistsApi } from '../services/api';
import { ArtistCard } from '../components/music';
import { LoadingPage } from '../components/common';
import { useAuth } from '../context/AuthContext';

export default function Library() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        try {
            setLoading(true);
            const artistsRes = await artistsApi.getAll({ limit: 50 });
            setArtists(artistsRes.data.artists || []);
        } catch (error) {
            console.error('Failed to fetch library:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingPage />;
    }

    return (
        <div className="library-page">
            <h1 style={{ marginBottom: 'var(--space-xl)' }}>Your Library</h1>

            {/* Artists */}
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
        </div>
    );
}
