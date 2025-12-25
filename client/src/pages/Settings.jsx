import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common';
import { adminApi } from '../services/api';

export default function Settings() {
    const { user, updateProfile, isAdmin } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    // Admin state
    const [inviteCode, setInviteCode] = useState('');
    const [generatingInvite, setGeneratingInvite] = useState(false);
    const [inviteType, setInviteType] = useState('permanent');
    const [inviteDuration, setInviteDuration] = useState('1d');

    // Animation state
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setMessage('');
        setSuccess(false);
        setSaving(true);

        try {
            await updateProfile({ displayName });
            setMessage('Profile updated successfully!');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            setMessage('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateInvite = async () => {
        setGeneratingInvite(true);
        try {
            const response = await adminApi.generateInvite({
                userType: inviteType,
                duration: inviteDuration
            });
            setInviteCode(response.data.code);
        } catch (error) {
            console.error('Failed to generate invite:', error);
            setMessage('Failed to generate invite');
        } finally {
            setGeneratingInvite(false);
        }
    };

    const copyInviteCode = () => {
        navigator.clipboard.writeText(inviteCode);
        setMessage('Code copied!');
        setTimeout(() => setMessage(''), 2000);
    };

    return (
        <div className={`settings-page ${loaded ? 'fade-in-up' : ''}`} style={{
            maxWidth: '700px',
            margin: '0 auto',
            padding: '40px 20px',
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
            ...(loaded ? { opacity: 1, transform: 'translateY(0)' } : {})
        }}>
            <h1 style={{
                marginBottom: '40px',
                fontSize: '42px',
                fontWeight: '600',
                letterSpacing: '-0.02em',
                color: 'var(--color-text-light)'
            }}>Settings</h1>

            {/* Profile Section */}
            <div className="card" style={{
                padding: '40px',
                marginBottom: '30px',
                background: 'linear-gradient(145deg, #111 0%, #050505 100%)',
                border: '1px solid rgba(255,255,255,0.03)'
            }}>
                <div style={{ marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '500', color: 'var(--color-text-light)', marginBottom: '8px' }}>Profile</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Manage your public profile and preferences.</p>
                </div>

                <form onSubmit={handleSaveProfile}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={user?.email || ''}
                            disabled
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Display Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={saving}
                            style={{
                                padding: '14px 32px',
                                fontSize: '16px',
                                background: success ? '#2ecc71' : 'var(--color-accent)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {success ? 'Saved ✓' : 'Save Changes'}
                        </Button>

                        {message && !success && (
                            <span style={{ color: 'var(--color-error)', fontSize: '14px' }}>{message}</span>
                        )}
                    </div>
                </form>
            </div>

            {/* Admin Section */}
            {isAdmin && (
                <div className="card" style={{
                    padding: '40px',
                    marginBottom: '30px',
                    background: 'linear-gradient(145deg, #150505 0%, #050000 100%)',
                    border: '1px solid rgba(149, 1, 1, 0.1)'
                }}>
                    <h3 style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--color-text-light)' }}>Invite Codes</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', fontSize: '14px' }}>
                        Generate exclusive invite codes. Select user type and validity.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label className="form-label">User Type</label>
                            <select
                                className="form-input"
                                value={inviteType}
                                onChange={(e) => setInviteType(e.target.value)}
                            >
                                <option value="permanent">Permanent User</option>
                                <option value="temporary">Temporary User</option>
                            </select>
                        </div>

                        {inviteType === 'temporary' && (
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label className="form-label">Duration</label>
                                <select
                                    className="form-input"
                                    value={inviteDuration}
                                    onChange={(e) => setInviteDuration(e.target.value)}
                                >
                                    <option value="1d">1 Day</option>
                                    <option value="1w">1 Week</option>
                                    <option value="1m">1 Month</option>
                                    <option value="3m">3 Months</option>
                                    <option value="1min">1 Minute (Test)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {inviteCode && (
                        <div style={{
                            padding: '24px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            marginBottom: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Your {inviteType === 'temporary' ? `Temporary (${inviteDuration})` : 'Permanent'} Code
                                </div>
                                <div style={{
                                    fontFamily: 'monospace',
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    color: 'var(--color-accent)',
                                    letterSpacing: '0.1em'
                                }}>
                                    {inviteCode}
                                </div>
                            </div>
                            <Button variant="secondary" onClick={copyInviteCode}>
                                Copy Code
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        onClick={handleGenerateInvite}
                        loading={generatingInvite}
                        style={{ border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
                    >
                        Generate Code
                    </Button>
                </div>
            )}

            {/* About Section */}
            <div className="card" style={{ padding: '30px', textAlign: 'center', background: 'transparent', boxShadow: 'none' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', opacity: 0.6 }}>
                    TenTeen v1.0.0 • Premium Audio Experience
                </p>
            </div>
        </div>
    );
}
