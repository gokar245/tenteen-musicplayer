import { useState, useRef } from 'react';
import { albumsApi, uploadApi } from '../../services/api';
import { Button, LoadingSpinner } from '../common';

export default function AlbumModal({ artistId, isOpen, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [language, setLanguage] = useState('Hindi');
    const [manualColor, setManualColor] = useState('#394867');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !imageFile) {
            setError('Name and cover image are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Upload image
            const formData = new FormData();
            formData.append('image', imageFile);
            const uploadRes = await uploadApi.image(formData);
            const { imageUrl, dominantColor } = uploadRes.data;

            // 2. Create album
            const albumRes = await albumsApi.create({
                name,
                artist: artistId,
                coverImage: imageUrl,
                releaseYear: year,
                dominantColor: manualColor || dominantColor,
                language,
                manualColor
            });

            onSuccess(albumRes.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create album');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Create New Album</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Album / Movie Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter album name"
                            required
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Release Year</label>
                            <input
                                type="number"
                                className="form-input"
                                value={year}
                                onChange={e => setYear(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Language</label>
                            <select className="form-input" value={language} onChange={e => setLanguage(e.target.value)}>
                                <option value="Hindi">Hindi</option>
                                <option value="English">English</option>
                                <option value="Telugu">Telugu</option>
                                <option value="Tamil">Tamil</option>
                                <option value="Malayalam">Malayalam</option>
                                <option value="Urdu">Urdu</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Theme Color (Hex)</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={manualColor}
                                onChange={e => setManualColor(e.target.value)}
                                style={{ width: '40px', height: '40px', padding: '0', border: 'none' }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                value={manualColor}
                                onChange={e => setManualColor(e.target.value)}
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cover Image *</label>
                        <div
                            className="image-upload-preview"
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                width: '100%',
                                height: '200px',
                                background: '#1a1a1a',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '2px dashed #333',
                                overflow: 'hidden'
                            }}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666' }}>
                                    <span>Click to upload cover</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={loading} style={{ flex: 1 }}>Create Album</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
