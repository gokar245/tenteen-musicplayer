import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { uploadApi } from '../../services/api';
import { extractColors, generateSpotifyGradient } from '../../utils/colorUtils';
import { Button } from '../../components/common';
import '../../styles/admin.css'; // Re-use simplified styles or create new ones if needed

export default function EditArtist() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState('');
    const [currentImage, setCurrentImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Color State
    const [gradientData, setGradientData] = useState(null); // { colors, css }
    const [manualColor, setManualColor] = useState('#667eea');
    const [isManual, setIsManual] = useState(false);

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 1. Fetch Artist Data
    useEffect(() => {
        const fetchArtist = async () => {
            try {
                const res = await api.get(`/artists/${id}`);
                const artist = res.data.artist;

                setName(artist.name);
                setCurrentImage(artist.image || artist.photo);

                // Initialize gradient info
                if (artist.backgroundGradient) {
                    setGradientData(artist.backgroundGradient);
                    // Try to set manual color reference if it exists
                    if (artist.backgroundGradient.colors && artist.backgroundGradient.colors.length > 0) {
                        setManualColor(artist.backgroundGradient.colors[0]);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load artist");
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchArtist();
    }, [id, navigate]);

    // 2. Handle Image Change & Color Extraction
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsManual(false); // Reset to auto-generate mode on new image

            // Auto-extract colors
            extractColors(file).then(colors => {
                const newGradient = generateSpotifyGradient(colors);
                setGradientData(newGradient);
                if (colors[0]) setManualColor(colors[0]);
            });
        }
    };

    // 3. Handle Manual Color Override
    useEffect(() => {
        if (isManual && gradientData) {
            const newCss = `linear-gradient(180deg, ${manualColor} 0%, rgba(18,18,18,0.8) 70%, #121212 100%)`;
            setGradientData(prev => ({
                ...prev,
                css: newCss,
                colors: [manualColor, '#121212'] // Update colors array just in case
            }));
        }
    }, [manualColor, isManual]);

    // 4. Save
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let imageUrl = currentImage;

            // Upload new image if selected
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await uploadApi.image(formData);
                imageUrl = uploadRes.data.imageUrl;
            }

            // Update Artist
            await api.put(`/artists/${id}`, {
                name,
                image: imageUrl,
                photo: imageUrl,
                backgroundGradient: gradientData
            });

            toast.success("Artist updated successfully!");
            navigate('/admin');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update artist");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="admin-layout" style={{ minHeight: '100vh', padding: '40px', background: '#000' }}>
            <div className="settings-container" style={{ margin: '0 auto' }}>
                <div className="page-section-header">
                    <h2>Edit Artist</h2>
                    <Button variant="ghost" onClick={() => navigate('/admin')}>&larr; Back to Admin</Button>
                </div>

                <div className="create-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '40px' }}>
                    {/* Form Side */}
                    <form className="create-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>Artist Name</label>
                            <input
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>



                        <div className="form-group">
                            <label>Artist Photo</label>
                            <div className="file-input-wrapper" style={{ marginTop: '8px' }}>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                <div className="file-input-button">
                                    {imageFile ? 'Change Photo' : 'Upload New Photo'}
                                </div>
                                {imageFile && <span className="file-name">{imageFile.name}</span>}
                            </div>
                        </div>

                        {/* Color Control (Existing or New) */}
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
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                border: 'none',
                                                padding: 0,
                                                background: 'none',
                                                cursor: 'pointer'
                                            }}
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

                    {/* Preview Side */}
                    <div className="create-preview" style={{
                        background: '#0a0a0a',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '16px' }}>Live Preview</h3>
                        <div
                            className="artist-preview-card"
                            style={{
                                background: gradientData?.css || '#121212',
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                padding: '24px',
                                textAlign: 'center'
                            }}
                        >
                            <div className="preview-image" style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                marginBottom: '24px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                            }}>
                                <img
                                    src={imagePreview || currentImage || 'https://via.placeholder.com/300'}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>{name || 'Artist Name'}</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
