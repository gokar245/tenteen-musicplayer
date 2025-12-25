import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { songsApi } from '../services/api';
import api from '../services/api';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const audioRef = useRef(new Audio());
    const [currentSong, setCurrentSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('volume');
        return saved ? parseFloat(saved) : 0.7;
    });
    const [isBuffering, setIsBuffering] = useState(false);
    const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'one', 'all'
    const [sleepTimerEnd, setSleepTimerEnd] = useState(null); // Timestamp when timer ends


    const audio = audioRef.current;

    // Play a song
    const playSong = useCallback(async (song, songQueue = null, index = 0) => {
        if (!song) return;

        try {
            setIsBuffering(true);
            setCurrentSong(song);

            if (songQueue) {
                setQueue(songQueue);
                setQueueIndex(index);
            }

            // Get stream URL
            const token = localStorage.getItem('token');
            audio.src = `/api/stream/${song._id}?token=${token}`;

            await audio.play();

            // Record to history
            try {
                await api.post('/songs/history', { songId: song._id });
            } catch (error) {
                console.error('Failed to record history:', error);
            }
        } catch (error) {
            console.error('Failed to play song:', error);
            setIsBuffering(false);
        }
    }, [audio]);

    // Play/Pause toggle
    const togglePlay = useCallback(() => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
    }, [audio, isPlaying]);

    // Play next song
    // Play next song
    const playNext = useCallback(async (auto = false) => {
        if (queue.length === 0) return;

        const nextIndex = queueIndex + 1;

        if (nextIndex < queue.length) {
            playSong(queue[nextIndex], queue, nextIndex);
        } else if (repeatMode === 'all') {
            playSong(queue[0], queue, 0);
        } else if (!auto) {
            // If manual next and not repeating, go back to start
            playSong(queue[0], queue, 0);
        } else {
            // Auto-play infinite mode: fetch random song
            try {
                const res = await songsApi.getRandom();
                const newSong = res.data;
                if (newSong) {
                    // Start playing the new song
                    // We append it to the current queue.
                    // Important: We need a new array reference for the queue state to update properly
                    const newQueue = [...queue, newSong];
                    playSong(newSong, newQueue, nextIndex);
                } else {
                    setIsPlaying(false);
                }
            } catch (error) {
                console.error('Failed to auto-play next song:', error);
                setIsPlaying(false);
            }
        }
    }, [queue, queueIndex, playSong, repeatMode]);

    // Set initial volume
    useEffect(() => {
        audio.volume = volume;
    }, []);

    // Audio event listeners
    useEffect(() => {
        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsBuffering(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            if (repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                playNext(true); // pass true for auto-play next
            }
        };


        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleWaiting = () => {
            setIsBuffering(true);
        };

        const handleCanPlay = () => {
            setIsBuffering(false);
        };

        const handleError = (e) => {
            console.error('Audio error:', e);
            setIsBuffering(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [audio, repeatMode, queue, queueIndex, playNext]);



    // Play previous song
    const playPrevious = useCallback(() => {
        if (queue.length === 0) return;

        // If more than 3 seconds in, restart current song
        if (currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
        playSong(queue[prevIndex], queue, prevIndex);
    }, [queue, queueIndex, currentTime, audio, playSong]);

    // Seek to position
    const seekTo = useCallback((time) => {
        if (isNaN(time)) return;
        audio.currentTime = Math.min(Math.max(0, time), duration);
    }, [audio, duration]);

    // Set volume
    const changeVolume = useCallback((newVolume) => {
        const vol = Math.min(Math.max(0, newVolume), 1);
        audio.volume = vol;
        setVolume(vol);
        localStorage.setItem('volume', vol.toString());
    }, [audio]);

    // Play album or playlist
    const playAlbum = useCallback((songs, startIndex = 0) => {
        if (!songs || songs.length === 0) return;
        playSong(songs[startIndex], songs, startIndex);
    }, [playSong]);

    // Shuffle queue
    const shuffleQueue = useCallback(() => {
        if (queue.length <= 1) return;

        const shuffled = [...queue];
        const current = shuffled.splice(queueIndex, 1)[0];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        shuffled.unshift(current);
        setQueue(shuffled);
        setQueueIndex(0);
    }, [queue, queueIndex]);

    // Load saved state on mount
    useEffect(() => {
        const savedQueue = localStorage.getItem('queue');
        const savedIndex = localStorage.getItem('queueIndex');
        const savedSong = localStorage.getItem('currentSong');

        if (savedQueue) {
            try {
                const parsedQueue = JSON.parse(savedQueue);
                setQueue(parsedQueue);
                if (savedIndex) {
                    setQueueIndex(parseInt(savedIndex));
                }
                if (savedSong) {
                    const song = JSON.parse(savedSong);
                    setCurrentSong(song);
                    // Don't auto-play, just load
                    audioRef.current.src = `/api/stream/${song._id}?token=${localStorage.getItem('token')}`;
                    // Attempt to restore time
                    const savedTime = localStorage.getItem('currentTime');
                    if (savedTime && !isNaN(savedTime)) {
                        audioRef.current.currentTime = parseFloat(savedTime);
                        setCurrentTime(parseFloat(savedTime));
                    }
                }
            } catch (e) {
                console.error('Failed to load saved audio state', e);
            }
        }
    }, [audioRef]);

    // Save state changes
    useEffect(() => {
        if (queue.length > 0) {
            localStorage.setItem('queue', JSON.stringify(queue));
        }
        localStorage.setItem('queueIndex', queueIndex.toString());
    }, [queue, queueIndex]);

    useEffect(() => {
        if (currentSong) {
            localStorage.setItem('currentSong', JSON.stringify(currentSong));
        }
    }, [currentSong]);

    // Save current time periodically (e.g. on pause or unload, but here on update filtered)
    // To avoid too many writes, we can just save it when pausing or unloading.
    // simpler: save on pause.
    useEffect(() => {
        const handlePause = () => {
            localStorage.setItem('currentTime', audioRef.current.currentTime.toString());
        };
        // Also save on page unload
        const handleUnload = () => {
            localStorage.setItem('currentTime', audioRef.current.currentTime.toString());
        };

        audioRef.current.addEventListener('pause', handlePause);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            if (audioRef.current) audioRef.current.removeEventListener('pause', handlePause);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [audioRef]);

    // Sleep Timer Logic
    const setSleepTimer = useCallback((minutes) => {
        // Clear existing
        if (audioRef.current.timerId) clearTimeout(audioRef.current.timerId);

        if (minutes && minutes > 0) {
            const ms = minutes * 60 * 1000;
            const endTime = Date.now() + ms;
            setSleepTimerEnd(endTime);
            console.log(`Setting sleep timer for ${minutes} minutes`);

            audioRef.current.timerId = setTimeout(() => {
                audioRef.current.pause();
                setIsPlaying(false);
                setSleepTimerEnd(null);
                console.log('Sleep timer triggered: Music paused.');
            }, ms);
        }
    }, [audio]);

    const cancelSleepTimer = useCallback(() => {
        if (audioRef.current.timerId) {
            clearTimeout(audioRef.current.timerId);
            audioRef.current.timerId = null;
        }
        setSleepTimerEnd(null);
    }, [audio]);

    // Format time helper
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const value = {
        // State
        currentSong,
        queue,
        queueIndex,
        isPlaying,
        duration,
        currentTime,
        volume,
        isBuffering,

        // Actions
        playSong,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        changeVolume,
        playAlbum,
        shuffleQueue,
        toggleRepeatMode: () => {
            const modes = ['off', 'all', 'one'];
            const currentIndex = modes.indexOf(repeatMode);
            setRepeatMode(modes[(currentIndex + 1) % modes.length]);
        },
        repeatMode,


        // Helpers
        formatTime,
        progress: duration > 0 ? (currentTime / duration) * 100 : 0,

        // Sleep Timer
        setSleepTimer,
        cancelSleepTimer,
        sleepTimerEnd, // Expose end time for UI to calculate remaining
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}

export default AudioContext;
