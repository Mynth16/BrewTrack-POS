import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastActivityTime, setLastActivityTime] = useState(Date.now());
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIME = 29 * 60 * 1000; // 29 minutes (1 minute before timeout)

    // Handle user activity - resets inactivity timer
    const handleUserActivity = () => {
        setLastActivityTime(Date.now());
        setShowTimeoutWarning(false);
    };

    // Continue session - dismiss warning and reset timer
    const continueSession = () => {
        handleUserActivity();
    };

    // Auto-logout function
    const autoLogout = () => {
        console.warn('Session expired due to inactivity');
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        setError(null);
        setShowTimeoutWarning(false);
    };

    // Initialize user from token on app load
    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem('authToken');
            if (savedToken) {
                try {
                    const response = await fetch('/api/auth/verify', {
                        headers: {
                            Authorization: `Bearer ${savedToken}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                        setToken(savedToken);
                    } else {
                        localStorage.removeItem('authToken');
                    }
                } catch (err) {
                    console.error('Session restore error:', err);
                    localStorage.removeItem('authToken');
                }
            }
            setLoading(false);
        };

        restoreSession();
    }, []);

    // Set up inactivity timeout and activity listeners
    useEffect(() => {
        if (!user) return; // Only track inactivity when logged in

        // Add activity listeners
        document.addEventListener('mousedown', handleUserActivity);
        document.addEventListener('keydown', handleUserActivity);

        // Inactivity check interval
        const checkInactivityInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivityTime;

            // If past timeout, auto-logout
            if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
                autoLogout();
                clearInterval(checkInactivityInterval);
                return;
            }

            // Show warning if approaching timeout
            if (timeSinceLastActivity >= WARNING_TIME && !showTimeoutWarning) {
                setShowTimeoutWarning(true);
            }
        }, 30 * 1000); // Check every 30 seconds

        // Cleanup listeners and interval on unmount or logout
        return () => {
            document.removeEventListener('mousedown', handleUserActivity);
            document.removeEventListener('keydown', handleUserActivity);
            clearInterval(checkInactivityInterval);
        };
    }, [user, lastActivityTime, showTimeoutWarning]);

    const login = async (username, password) => {
        setError(null);
        const maxRetries = 3;
        const retryDelay = 500; // ms
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                // Retry on 503 or network errors
                if (response.status === 503) {
                    if (attempt < maxRetries - 1) {
                        console.warn(`Backend temporarily unavailable, retrying (${attempt + 1}/${maxRetries})...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                }

                if (!response.ok) {
                    setError('Invalid username or password');
                    return false;
                }

                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                setToken(data.token);
                setUser(data.user);
                return true;
            } catch (err) {
                console.error(`Login error (attempt ${attempt + 1}/${maxRetries}):`, err);
                
                // If this is the last attempt, show error
                if (attempt === maxRetries - 1) {
                    setError('Login failed. Please try again.');
                    return false;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        return false;
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        setError(null);
        setShowTimeoutWarning(false);
        setLastActivityTime(Date.now());
    };

    const isAuthenticated = () => {
        return user !== null;
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, error, loading, showTimeoutWarning, continueSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
