import { useNavigate } from 'react-router-dom';

export default function ArtistCard({ artist }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/artist/${artist._id}`);
    };

    return (
        <div className="card artist-card" onClick={handleClick} style={{ flexShrink: 0, minWidth: '160px' }}>
            <div className="artist-card-image">
                {artist.image ? (
                    <img src={artist.image} alt={artist.name} style={{ objectPosition: 'center top' }} />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${artist.dominantColor || '#394867'}, var(--color-bg-dark))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '36px'
                    }}>
                        ♫
                    </div>
                )}
            </div>
            <div className="artist-card-name">{artist.name}</div>
        </div>
    );
}
