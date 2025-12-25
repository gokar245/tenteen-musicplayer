import SongRow from './SongRow';

export default function TrackList({ songs, showAlbum = false }) {
    if (!songs || songs.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-title">No tracks found</div>
                <div className="empty-state-text">This album doesn't have any songs yet.</div>
            </div>
        );
    }

    return (
        <div className="track-list">
            <div className="track-list-header">
                <span className="track-list-header-number">#</span>
                <span className="track-list-header-title">Title</span>
                <span className="track-list-header-duration">Duration</span>
            </div>
            {songs.map((song, index) => (
                <SongRow
                    key={song._id}
                    song={song}
                    index={index}
                    showAlbum={showAlbum}
                    queue={songs}
                    queueIndex={index}
                />
            ))}
        </div>
    );
}
