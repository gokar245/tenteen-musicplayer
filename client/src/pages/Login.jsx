import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common';

const MusicIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(email, password, displayName, inviteCode);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <MusicIcon />
                    </div>
                    <div className="login-logo-text">TenTeen</div>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    <h2 className="login-title">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                padding: 'var(--space-md)',
                                background: 'rgba(231, 76, 60, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-error)',
                                marginBottom: 'var(--space-lg)',
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                {error}
                            </div>
                        )}

                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">Display Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Your name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">Invite Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="XXXXXXXX"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    required
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            style={{ width: '100%' }}
                        >
                            {isRegister ? 'Create Account' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="login-footer">
                        {isRegister ? (
                            <>
                                Already have an account?{' '}
                                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(false); setError(''); }}>
                                    Sign in
                                </a>
                            </>
                        ) : (
                            <>
                                Have an invite code?{' '}
                                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(true); setError(''); }}>
                                    Create account
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
