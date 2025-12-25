import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const LibraryIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const PlayerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
    </svg>
);

const ProfileIcon = ({ user }) => (
    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3D0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }}>
        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
    </div>
);

export default function BottomNav() {
    const { user } = useAuth();

    return (
        <nav className="bottom-nav">
            <ul className="bottom-nav-list">
                <li>
                    <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                        <HomeIcon />
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/search" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                        <SearchIcon />
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/upload" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                        <UploadIcon />
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/library" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                        <LibraryIcon />
                    </NavLink>
                </li>

                <li>
                    <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                        <ProfileIcon user={user} />
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
}


