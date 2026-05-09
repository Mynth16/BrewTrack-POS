import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize user from token on app load
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await fetch('/api/auth/verify', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
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
        setError(null);
    };

    const isAuthenticated = () => {
        return user !== null;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, error, loading }}>
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
