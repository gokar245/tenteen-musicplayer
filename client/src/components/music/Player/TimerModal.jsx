import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAudio } from '../../../context/AudioContext';

// Icons
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export default function TimerModal({ isOpen, onClose }) {
    const { setSleepTimer, cancelSleepTimer, sleepTimerEnd } = useAudio();
    const [customMinutes, setCustomMinutes] = useState('');
    const [remainingTime, setRemainingTime] = useState(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            return;
        }

        if (!sleepTimerEnd) {
            setRemainingTime(null);
            return;
        }

        const updateRemaining = () => {
            const remaining = Math.max(0, sleepTimerEnd - Date.now());
            setRemainingTime(remaining);
            if (remaining === 0) setRemainingTime(null);
        };

        updateRemaining();
        const interval = setInterval(updateRemaining, 1000);
        return () => {
            clearInterval(interval);
            document.body.style.overflow = 'unset';
        };
    }, [sleepTimerEnd, isOpen]);

    const formatRemainingDetailed = (ms) => {
        if (!ms) return '';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let parts = [];
        if (hours > 0) parts.push(`${hours} hr`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes} min`);
        parts.push(`${seconds} sec`);

        return parts.join(' ');
    };

    const handleSetTimer = (minutes) => {
        setSleepTimer(minutes);
        onClose();
    };

    const handleCustomTimer = () => {
        const mins = parseInt(customMinutes);
        if (mins && mins > 0 && mins <= 480) {
            handleSetTimer(mins);
            setCustomMinutes('');
        }
    };

    if (!isOpen) return null;

    const timerActive = !!sleepTimerEnd && remainingTime > 0;

    const presets = [
        { label: '5 min', value: 5 },
        { label: '10 min', value: 10 },
        { label: '15 min', value: 15 },
        { label: '30 min', value: 30 },
        { label: '45 min', value: 45 },
        { label: '1 hour', value: 60 },
        { label: '1.5 hr', value: 90 },
        { label: '2 hr', value: 120 }
    ];

    const modalContent = (
        <div className="sleep-timer-overlay" onClick={onClose}>
            <div className="sleep-timer-modal" onClick={e => e.stopPropagation()}>
                <div className="sleep-timer-header">
                    <div className="header-left">
                        <ClockIcon />
                        <span>Sleep Timer</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                <div className="sleep-timer-body">
                    {timerActive ? (
                        <div className="active-timer-state">
                            <span className="state-label">Music stops in</span>
                            <span className="countdown-text">{formatRemainingDetailed(remainingTime)}</span>
                            <button className="cancel-timer-btn" onClick={cancelSleepTimer}>
                                Cancel Timer
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="timer-presets-grid">
                                {presets.map(preset => (
                                    <button
                                        key={preset.value}
                                        className="preset-pill"
                                        onClick={() => handleSetTimer(preset.value)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="custom-duration-row">
                                <div className="input-group">
                                    <label>Custom duration (minutes)</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            placeholder="Enter minutes"
                                            value={customMinutes}
                                            onChange={(e) => setCustomMinutes(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCustomTimer()}
                                        />
                                        <button
                                            className="start-btn"
                                            onClick={handleCustomTimer}
                                            disabled={!customMinutes}
                                        >
                                            Start
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="end-of-song-option">
                                <button
                                    className="option-row"
                                    onClick={() => handleSetTimer(-1)}
                                >
                                    <span className="radio-dot"></span>
                                    End of current song
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
