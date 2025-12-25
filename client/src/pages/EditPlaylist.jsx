import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlistsApi, uploadApi } from '../services/api';
import { ArrowLeft, Upload, Save, Trash2, Globe, Lock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditPlaylist() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [coverImage, setCoverImage] = useState(null);
    const [backgroundColor, setBackgroundColor] = useState('#121212');

    // File Input
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            const res = await playlistsApi.getOne(id);
            const p = res.data;
            setName(p.name);
            setDescription(p.description || '');
            setIsPublic(p.isPublic);
            setCoverImage(p.coverImage);
            setBackgroundColor(p.backgroundColor || '#121212');

            // Check permissions
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user._id !== p.owner?._id && user.role !== 'admin') {
                toast.error('You do not have permission to edit this playlist');
                navigate(`/playlist/${id}`);
            }
        } catch (error) {
            toast.error('Failed to load playlist');
            navigate('/library');
        } finally {
            setLoading(false);
        }
    };

    const extractColor = (imgSrc) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imgSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1;
                canvas.height = 1;
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                resolve(hex);
            };
            img.onerror = () => resolve('#121212');
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'playlists');

        try {
            setProcessing(true);
            const res = await uploadApi.uploadImage(formData);
            const newUrl = res.data.imageUrl;
            setCoverImage(newUrl);

            // Auto-extract color
            const color = await extractColor(newUrl);
            setBackgroundColor(color);
            toast.success('Image uploaded and color extracted');
        } catch (error) {
            toast.error('Image upload failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleSave = async () => {
        try {
            setProcessing(true);
            await playlistsApi.update(id, {
                name,
                description,
                isPublic,
                coverImage,
                backgroundColor
            });
            toast.success('Playlist updated successfully');
            navigate(`/playlist/${id}`);
        } catch (error) {
            toast.error('Failed to update playlist');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this playlist?')) return;
        try {
            await playlistsApi.delete(id);
            toast.success('Playlist deleted');
            navigate('/library');
        } catch (error) {
            toast.error('Failed to delete playlist');
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;

    return (
        <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate(`/playlist/${id}`)} className="btn-icon">
                    <ArrowLeft size={24} />
                </button>
                <h1>Edit Playlist</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Left: Image & Color */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div
                        style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            background: backgroundColor,
                            boxShadow: `0 8px 32px ${backgroundColor}40`,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {coverImage ? (
                            <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={48} className="text-gray-400" />
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = 1}
                            onMouseOut={e => e.currentTarget.style.opacity = 0}
                        >
                            <Upload size={24} />
                            <span>Change Photo</span>
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#ccc' }}>Background Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    background: 'transparent'
                                }}
                            />
                            <button
                                onClick={async () => {
                                    if (coverImage) {
                                        const c = await extractColor(coverImage);
                                        setBackgroundColor(c);
                                    } else {
                                        setBackgroundColor('#121212');
                                    }
                                }}
                                className="btn btn-secondary"
                                title="Auto-detect from image"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Playlist"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's the vibe?"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '24px',
                                    background: isPublic ? 'var(--color-primary)' : '#333',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}
                                onClick={() => setIsPublic(!isPublic)}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '2px',
                                    left: isPublic ? '26px' : '2px',
                                    transition: 'left 0.2s'
                                }} />
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                                {isPublic ? 'Public Playlist' : 'Private Playlist'}
                            </span>
                        </label>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <button
                            className="btn"
                            style={{ color: '#ff4444', border: '1px solid #ff444430', background: 'rgba(255,68,68,0.1)' }}
                            onClick={handleDelete}
                        >
                            <Trash2 size={18} style={{ marginRight: '8px' }} />
                            Delete Playlist
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={processing}
                            style={{ minWidth: '120px' }}
                        >
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
