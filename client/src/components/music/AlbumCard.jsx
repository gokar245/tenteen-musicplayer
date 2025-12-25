import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../context/AudioContext';

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

export default function AlbumCard({ album, songs = [] }) {
    const navigate = useNavigate();
    const { playAlbum } = useAudio();

    const handleClick = () => {
        navigate(`/album/${album._id}`);
    };

    const handlePlay = (e) => {
        e.stopPropagation();
        if (songs.length > 0) {
            playAlbum(songs);
        } else {
            // Navigate to album and auto-play
            navigate(`/album/${album._id}?autoplay=true`);
        }
    };

    return (
        <div className="card album-card" onClick={handleClick}>
            <div className="album-card-artwork">
                {album.poster || album.coverImage ? (
                    <img src={album.poster || album.coverImage} alt={album.name} />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: album.backgroundGradient || `linear-gradient(135deg, ${album.dominantColor || '#4a90d9'}, var(--color-bg-dark))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '48px'
                    }}>
                        ♪
                    </div>
                )}
                <button className="album-card-play" onClick={handlePlay}>
                    <PlayIcon />
                </button>
            </div>
            <div className="album-card-info">
                <div className="album-card-title">{album.name}</div>
                <div className="album-card-artist">
                    {album.artist?.name || 'Unknown Artist'}
                </div>
            </div>
        </div>
    );
}
