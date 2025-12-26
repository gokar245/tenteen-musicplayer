import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { artistsApi, albumsApi, uploadApi } from '../services/api';
import { Button, LoadingSpinner } from '../components/common';
import { toast } from 'react-hot-toast';
import { extractColors, generateSpotifyGradient } from '../utils/colorUtils';

// --- FULL SCREEN CREATE VIEW COMPONENTS ---

const CreateArtistView = ({ onBack, onSuccess }) => {
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [gradientData, setGradientData] = useState(null); // { colors, css }
    const [manualColor, setManualColor] = useState('#667eea');
    const [isManual, setIsManual] = useState(false);
    const [loading, setLoading] = useState(false);

    // Auto-extract
    useEffect(() => {
        if (imageFile) {
            extractColors(imageFile).then(colors => {
                setGradientData(generateSpotifyGradient(colors));
                if (colors[0]) setManualColor(colors[0]); // Preset manual ref
            });
        }
    }, [imageFile]);

    // Manual override
    useEffect(() => {
        if (isManual && gradientData) {
            const newCss = `linear-gradient(180deg, ${manualColor} 0%, rgba(18,18,18,0.8) 70%, #121212 100%)`;
            setGradientData(prev => ({ ...prev, css: newCss }));
        }
    }, [manualColor, isManual]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsManual(false); // Reset to auto
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        // Prevent multiple submissions
        if (loading) return;
        setLoading(true);
        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append('image', imageFile);
            const uploadRes = await uploadApi.image(formData);
            const { imageUrl } = uploadRes.data;

            // 2. Create Artist
            const artistRes = await artistsApi.create({
                name,
                photo: imageUrl,
                backgroundGradient: gradientData
            });

            onSuccess(artistRes.data);
            toast.success('Artist created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create artist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="full-screen-create fade-in">
            <div className="create-header">
                <Button variant="ghost" onClick={onBack}>&larr; Back</Button>
                <h2>Create New Artist</h2>
            </div>

            <div className="create-layout">
                {/* Left: Form */}
                <form className="create-form" onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Artist Name *</label>
                        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Arijit Singh" />
                    </div>

                    <div className="form-group">
                        <label>Artist Photo *</label>
                        <div className="file-input-wrapper">
                            <input type="file" accept="image/*" onChange={handleImageChange} required />
                            <div className="file-input-button">
                                {imageFile ? 'Change Photo' : 'Upload Photo'}
                            </div>
                            {imageFile && <span className="file-name">{imageFile.name}</span>}
                        </div>
                    </div>

                    {gradientData && (
                        <div className="form-group">
                            <label>Background Color</label>
                            <div className="color-control">
                                <div className="color-options">
                                    <button type="button" className={`color-btn ${!isManual ? 'active' : ''}`} onClick={() => setIsManual(false)}>Auto</button>
                                    <button type="button" className={`color-btn ${isManual ? 'active' : ''}`} onClick={() => setIsManual(true)}>Manual</button>
                                </div>
                                {isManual && (
                                    <input
                                        type="color"
                                        value={manualColor}
                                        onChange={e => setManualColor(e.target.value)}
                                        className="color-picker-input"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <Button variant="primary" size="lg" type="submit" loading={loading} disabled={!name || !imageFile}>Save Artist</Button>
                    </div>
                </form>

                {/* Right: Preview */}
                <div className="create-preview">
                    <h3>Live Preview</h3>
                    <div
                        className="artist-preview-card"
                        style={{ background: gradientData?.css || '#121212' }}
                    >
                        <div className="preview-content">
                            <div className="preview-image">
                                {imagePreview ? <img src={imagePreview} /> : <div className="placeholder-img">📷</div>}
                            </div>
                            <h1 className="preview-name">{name || 'Artist Name'}</h1>
                            <div className="preview-badge">Verified Artist</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateAlbumView = ({ artist, onBack, onSuccess }) => {
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [gradientData, setGradientData] = useState(null);
    const [manualColor, setManualColor] = useState('#667eea');
    const [isManual, setIsManual] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (imageFile) {
            extractColors(imageFile).then(colors => {
                setGradientData(generateSpotifyGradient(colors));
                if (colors[0]) setManualColor(colors[0]);
            });
        }
    }, [imageFile]);

    useEffect(() => {
        if (isManual && gradientData) {
            const newCss = `linear-gradient(180deg, ${manualColor} 0%, rgba(18,18,18,0.8) 70%, #121212 100%)`;
            setGradientData(prev => ({ ...prev, css: newCss }));
        }
    }, [manualColor, isManual]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsManual(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        // Prevent multiple submissions
        if (loading) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            const uploadRes = await uploadApi.image(formData);
            const { imageUrl } = uploadRes.data;

            const albumRes = await albumsApi.create({
                name,
                artist: artist?._id || null, // Optional
                poster: imageUrl,
                backgroundGradient: gradientData
            });

            onSuccess(albumRes.data);
            toast.success('Album created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create album');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="full-screen-create fade-in">
            <div className="create-header">
                <Button variant="ghost" onClick={onBack}>&larr; Back</Button>
                <h2>Create New Album</h2>
            </div>

            <div className="create-layout">
                <form className="create-form" onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Album / Movie Name *</label>
                        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Rockstar" />
                    </div>

                    <div className="form-group">
                        <label>Poster Image *</label>
                        <div className="file-input-wrapper">
                            <input type="file" accept="image/*" onChange={handleImageChange} required />
                            <div className="file-input-button">
                                {imageFile ? 'Change Poster' : 'Upload Poster'}
                            </div>
                            {imageFile && <span className="file-name">{imageFile.name}</span>}
                        </div>
                    </div>

                    {gradientData && (
                        <div className="form-group">
                            <label>Background Color</label>
                            <div className="color-control">
                                <div className="color-options">
                                    <button type="button" className={`color-btn ${!isManual ? 'active' : ''}`} onClick={() => setIsManual(false)}>Auto</button>
                                    <button type="button" className={`color-btn ${isManual ? 'active' : ''}`} onClick={() => setIsManual(true)}>Manual</button>
                                </div>
                                {isManual && (
                                    <input
                                        type="color"
                                        value={manualColor}
                                        onChange={e => setManualColor(e.target.value)}
                                        className="color-picker-input"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <Button variant="primary" size="lg" type="submit" loading={loading} disabled={!name || !imageFile}>Save Album</Button>
                    </div>
                </form>

                <div className="create-preview">
                    <h3>Live Preview</h3>
                    <div
                        className="album-preview-card"
                        style={{ background: gradientData?.css || '#121212' }}
                    >
                        <div className="preview-poster">
                            {imagePreview ? <img src={imagePreview} /> : <div className="placeholder-poster">🎬</div>}
                        </div>
                        <div className="preview-info">
                            <h1 className="preview-title">{name || 'Album Name'}</h1>
                            <p className="preview-artist">{artist?.name || 'Unknown Artist'}</p>
                            <div className="preview-year">2024 • Album</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Upload() {
    const navigate = useNavigate();
    const [view, setView] = useState('wizard'); // 'wizard', 'create-artist', 'create-album'
    const [step, setStep] = useState(1);

    // Data State
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [selectedAlbum, setSelectedAlbum] = useState(null);

    // Song Details
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('Hindi');

    // Search
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);

    // Search Logic
    useEffect(() => {
        if (view !== 'wizard') return;
        const search = async () => {
            if (!query.trim() && step !== 2) { setResults([]); return; }
            setSearching(true);
            try {
                if (step === 1) {
                    const res = await artistsApi.getAll({ query });
                    setResults(res.data.artists);
                } else if (step === 2) {
                    const res = await albumsApi.getAll({ query, artistId: selectedArtist?._id });
                    setResults(res.data.albums);
                }
            } catch (err) { console.error(err); }
            finally { setSearching(false); }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [query, step, selectedArtist, view]);

    // Handlers
    const handleAudioDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0] || e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            setAudioFile(file);
            setTitle(file.name.replace(/\.[^/.]+$/, ""));
        } else {
            toast.error("Please upload a valid audio file");
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleFinalUpload = async () => {
        // Prevent multiple submissions
        if (loading) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('title', title);
            formData.append('language', language);
            if (coverFile) formData.append('coverImage', coverFile);
            if (selectedArtist) formData.append('artistId', selectedArtist._id);
            if (selectedAlbum) formData.append('albumId', selectedAlbum._id);

            await uploadApi.audio(formData);
            toast.success('Song uploaded successfully!');

            if (selectedArtist) navigate(`/artist/${selectedArtist._id}`);
            else navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderStep1 = () => (
        <div className="step-container">
            <h2>Select Artist</h2>
            <div className="search-box">
                <input
                    placeholder="Search artist name..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="form-input"
                    autoFocus
                />
            </div>

            <div className="results-grid">
                {results.map(artist => (
                    <div key={artist._id} className="result-card" onClick={() => { setSelectedArtist(artist); setStep(2); setQuery(''); }}>
                        <div className="card-img" style={{ backgroundImage: `url(${artist.photo || artist.image})` }} />
                        <span>{artist.name}</span>
                    </div>
                ))}
            </div>

            <div className="actions-row">
                <Button onClick={() => setView('create-artist')}>+ Create New Artist</Button>
                <div className="divider">OR</div>
                <Button variant="ghost" onClick={() => { setSelectedArtist(null); setStep(3); }}>Quick Upload (Unknown Artist)</Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-container">
            <h2>Select Album / Movie {selectedArtist && `for ${selectedArtist.name}`}</h2>
            <div className="search-box">
                <input
                    placeholder="Search album..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="form-input"
                    autoFocus
                />
            </div>

            <div className="results-grid">
                {results.map(album => (
                    <div key={album._id} className="result-card" onClick={() => { setSelectedAlbum(album); setStep(3); }}>
                        <div className="card-img" style={{ backgroundImage: `url(${album.poster || album.coverImage})` }} />
                        <span>{album.name}</span>
                    </div>
                ))}
            </div>

            <div className="actions-row">
                <Button onClick={() => setView('create-album')}>+ Create New Album</Button>
                <div className="divider">OR</div>
                <Button variant="ghost" onClick={() => { setSelectedAlbum(null); setStep(3); }}>Skip Album (Single Song)</Button>
            </div>
            <div className="back-link" onClick={() => { setStep(1); setQuery(''); }}>&larr; Back to Artist</div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-container upload-form-layout">
            <div className="form-section">
                <h2>Upload Song</h2>
                <div className="form-group dropzone" onDrop={handleAudioDrop} onDragOver={e => e.preventDefault()} onClick={() => document.getElementById('audio-input').click()}>
                    <input id="audio-input" type="file" accept="audio/*" onChange={handleAudioDrop} style={{ display: 'none' }} />
                    {audioFile ? (
                        <div className="file-info">🎵 {audioFile.name}</div>
                    ) : (
                        <div className="placeholder">Drag & Drop Audio File</div>
                    )}
                </div>

                <div className="form-group">
                    <label>Song Title *</label>
                    <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
                </div>

                <div className="form-group">
                    <label>Language</label>
                    <select className="form-input" value={language} onChange={e => setLanguage(e.target.value)}>
                        <option>Hindi</option>
                        <option>English</option>
                        <option>Telugu</option>
                        <option>Tamil</option>
                        <option>Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Cover Image (Song Level)</label>
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="form-input" />
                </div>

                <Button variant="primary" onClick={() => setStep(4)} disabled={!audioFile || !title} style={{ width: '100%', marginTop: '20px' }}>Continue to Review</Button>
                <Button variant="ghost" onClick={() => setStep(selectedArtist ? 2 : 1)} style={{ width: '100%' }}>Back</Button>
            </div>

            <div className="preview-section">
                <h3>Song Preview</h3>
                <div className="song-preview-card">
                    <div className="preview-img" style={{
                        backgroundImage: coverPreview ? `url(${coverPreview})` :
                            selectedAlbum?.poster ? `url(${selectedAlbum.poster})` : 'none',
                        backgroundColor: '#333'
                    }} />
                    <div className="preview-info">
                        <h4>{title || 'Song Title'}</h4>
                        <p>{selectedArtist ? selectedArtist.name : 'Unknown Artist'}</p>
                        <small>{selectedAlbum ? selectedAlbum.name : 'Single'}</small>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="step-container review-step">
            <h2>Review & Publish</h2>
            <div className="summary-card">
                <div className="row"><label>Artist</label><span>{selectedArtist ? selectedArtist.name : 'Unknown Artist'}</span></div>
                <div className="row"><label>Album</label><span>{selectedAlbum ? selectedAlbum.name : 'Single / None'}</span></div>
                <div className="row"><label>Song</label><span>{title}</span></div>
            </div>
            <div className="actions-row">
                <Button variant="ghost" onClick={() => setStep(3)}>Edit</Button>
                <Button variant="primary" onClick={handleFinalUpload} loading={loading}>Publish</Button>
            </div>
        </div>
    );

    // Main Render
    if (view === 'create-artist') {
        return <CreateArtistView onBack={() => setView('wizard')} onSuccess={(artist) => {
            setSelectedArtist(artist);
            setStep(2); // Auto-advance
            setView('wizard');
            toast.success("Artist created & selected!");
        }} />;
    }

    if (view === 'create-album') {
        return <CreateAlbumView artist={selectedArtist} onBack={() => setView('wizard')} onSuccess={(album) => {
            setSelectedAlbum(album);
            setStep(3); // Auto-advance
            setView('wizard');
            toast.success("Album created & selected!");
        }} />;
    }

    return (
        <div className="upload-page page-container">
            <div className="wizard-progress">
                <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>1. Artist</div>
                <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>2. Album</div>
                <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>3. Song</div>
                <div className={`wizard-step ${step >= 4 ? 'active' : ''}`}>4. Review</div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </div>
    );
}
