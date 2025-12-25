import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { artistsApi, albumsApi, uploadApi } from '../services/api';
import { Button, LoadingSpinner } from '../components/common';
import '../styles/pages.css';

export default function EditSong() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [song, setSong] = useState(null);

    // Form State
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('Hindi');
    const [artistId, setArtistId] = useState('');
    const [albumId, setAlbumId] = useState('');

    // File State
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    // Search State
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);

    useEffect(() => {
        fetchSongDetails();
        fetchOptions();
    }, [id]);

    const fetchSongDetails = async () => {
        try {
            // Try fetching via admin route if possible, or public if user owns it?
            // Using public endpoint for reading, but we might need admin one if pending
            let res;
            try {
                res = await api.get(`/admin/media/${id}`);
            } catch (e) {
                // Fallback to public if not admin or fails
                res = await api.get(`/songs/${id}`);
            }

            const s = res.data;
            setSong(s);
            setTitle(s.title);
            setLanguage(s.songLanguage || 'Hindi');
            setArtistId(s.artist?._id || '');
            setAlbumId(s.album?._id || '');
            setCoverPreview(s.coverImage || s.album?.coverImage || s.album?.poster);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load song");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [aRes, alRes] = await Promise.all([
                artistsApi.getAll({ limit: 100 }),
                albumsApi.getAll({ limit: 100 })
            ]);
            setArtists(aRes.data.artists);
            setAlbums(alRes.data.albums);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let coverUrl = null;
            if (coverFile) {
                const formData = new FormData();
                formData.append('image', coverFile);
                const upRes = await uploadApi.image(formData);
                coverUrl = upRes.data.imageUrl;
            }

            const payload = {
                title,
                songLanguage: language,
                artistId: artistId || null,
                albumId: albumId || null
            };
            if (coverUrl) payload.coverImage = coverUrl;

            await api.patch(`/admin/edit/${id}`, payload);
            toast.success("Song updated successfully!");
            navigate(-1);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update song");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="page-container flex-center">
            <LoadingSpinner />
        </div>
    );

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="section-header">
                <h2>Edit Song Details</h2>
                <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>

            <div className="upload-form-layout" style={{ marginTop: '20px' }}>
                <div className="form-section">
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label>Song Title</label>
                            <input
                                className="form-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Artist</label>
                            <select
                                className="form-input"
                                value={artistId}
                                onChange={e => setArtistId(e.target.value)}
                            >
                                <option value="">Select Artist</option>
                                {artists.map(a => (
                                    <option key={a._id} value={a._id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Album</label>
                            <select
                                className="form-input"
                                value={albumId}
                                onChange={e => setAlbumId(e.target.value)}
                            >
                                <option value="">Select Album</option>
                                {albums.map(a => (
                                    <option key={a._id} value={a._id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Language</label>
                            <select
                                className="form-input"
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                            >
                                <option>Hindi</option>
                                <option>English</option>
                                <option>Telugu</option>
                                <option>Tamil</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Cover Image (Optional override)</label>
                            <div className="file-input-wrapper" style={{ padding: '20px' }}>
                                <input type="file" accept="image/*" onChange={handleCoverChange} />
                                <div className="file-input-button">
                                    {coverFile ? 'Change Cover' : 'Upload New Cover'}
                                </div>
                                {coverFile && <div className="file-name">{coverFile.name}</div>}
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '30px' }}>
                            <Button type="submit" variant="primary" size="lg" loading={saving} style={{ width: '100%' }}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="preview-section">
                    <h3>Preview</h3>
                    <div className="song-preview-card">
                        <div className="preview-img" style={{
                            backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                            backgroundColor: '#333'
                        }} />
                        <div className="preview-info">
                            <h4>{title || 'Song Title'}</h4>
                            <p>{artists.find(a => a._id === artistId)?.name || 'Unknown Artist'}</p>
                            <small>{albums.find(a => a._id === albumId)?.name || 'Single'}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
