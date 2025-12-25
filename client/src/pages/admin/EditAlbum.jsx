import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { uploadApi, artistsApi } from '../../services/api'; // Correct import path
import { extractColors, generateSpotifyGradient } from '../../utils/colorUtils';
import { Button } from '../../components/common';
import '../../styles/admin.css';

export default function EditAlbum() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState('');
    const [currentImage, setCurrentImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Color State
    const [gradientData, setGradientData] = useState(null);
    const [manualColor, setManualColor] = useState('#667eea');
    const [isManual, setIsManual] = useState(false);

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 1. Fetch Album Data & Artists List
    useEffect(() => {
        const fetchData = async () => {
            try {
                const albumRes = await api.get(`/albums/${id}`);
                const album = albumRes.data.album;

                setName(album.name);
                setCurrentImage(album.coverImage || album.poster);

                // Initialize gradient info
                if (album.backgroundGradient) {
                    setGradientData(album.backgroundGradient);
                    if (album.backgroundGradient.colors && album.backgroundGradient.colors.length > 0) {
                        setManualColor(album.backgroundGradient.colors[0]);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load album data");
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    // 2. Handle Image Change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsManual(false);

            extractColors(file).then(colors => {
                const newGradient = generateSpotifyGradient(colors);
                setGradientData(newGradient);
                if (colors[0]) setManualColor(colors[0]);
            });
        }
    };

    // 3. Manual Color
    useEffect(() => {
        if (isManual && gradientData) {
            const newCss = `linear-gradient(180deg, ${manualColor} 0%, rgba(18,18,18,0.8) 70%, #121212 100%)`;
            setGradientData(prev => ({
                ...prev,
                css: newCss,
                colors: [manualColor, '#121212']
            }));
        }
    }, [manualColor, isManual]);

    // 4. Save
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let imageUrl = currentImage;

            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await uploadApi.image(formData);
                imageUrl = uploadRes.data.imageUrl;
            }

            await api.put(`/albums/${id}`, {
                name,
                coverImage: imageUrl,
                poster: imageUrl,
                backgroundGradient: gradientData
            });

            toast.success("Album updated successfully!");
            navigate('/admin');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update album");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner"></div>;



    return (
        <div className="admin-layout" style={{ minHeight: '100vh', padding: '40px', background: '#000' }}>
            {/* Reusing container styles inline for simplicity as CSS file might change */}
            <div className="settings-container" style={{ margin: '0 auto' }}>
                <div className="page-section-header">
                    <h2>Edit Album</h2>
                    <Button variant="ghost" onClick={() => navigate('/admin')}>&larr; Back to Admin</Button>
                </div>

                <div className="create-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '40px' }}>
                    <form className="create-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>Album Name</label>
                            <input
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>



                        <div className="form-group">
                            <label>Cover Image</label>
                            <div className="file-input-wrapper" style={{ marginTop: '8px' }}>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                <div className="file-input-button">
                                    {imageFile ? 'Change Cover' : 'Upload New Cover'}
                                </div>
                                {imageFile && <span className="file-name">{imageFile.name}</span>}
                            </div>
                        </div>

                        {gradientData && (
                            <div className="form-group">
                                <label>Background Color</label>
                                <div className="color-control" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <div className="color-options" style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className={`btn-primary ${!isManual ? 'active' : ''}`}
                                            style={{ opacity: !isManual ? 1 : 0.5 }}
                                            onClick={() => setIsManual(false)}
                                        >
                                            Auto
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn-primary ${isManual ? 'active' : ''}`}
                                            style={{ opacity: isManual ? 1 : 0.5 }}
                                            onClick={() => setIsManual(true)}
                                        >
                                            Manual
                                        </button>
                                    </div>
                                    {isManual && (
                                        <input
                                            type="color"
                                            value={manualColor}
                                            onChange={e => setManualColor(e.target.value)}
                                            style={{ width: '40px', height: '40px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-actions" style={{ marginTop: '20px' }}>
                            <Button variant="primary" size="lg" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>

                    <div className="create-preview" style={{
                        background: '#0a0a0a',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '16px' }}>Live Preview</h3>
                        <div
                            className="album-preview-card"
                            style={{
                                background: gradientData?.css || '#121212',
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: '12px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div className="preview-poster" style={{
                                flex: 1,
                                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: '#222'
                            }}>
                                <img
                                    src={imagePreview || currentImage || 'https://via.placeholder.com/300'}
                                    style={{ height: '100%', width: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="preview-info">
                                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{name || 'Album Name'}</h1>
                                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Album</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
