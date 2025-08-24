// frontend/context/AuthContext.js
'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // On app start, check if a token is in localStorage
        const storedToken = localStorage.getItem('memoria_token');
        if (storedToken) {
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = (newToken) => {
        setToken(newToken);
        localStorage.setItem('memoria_token', newToken);
        router.push('/dashboard'); // Redirect to dashboard after login
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('memoria_token');
        router.push('/login'); // Redirect to login after logout
    };

    return (
        <AuthContext.Provider value={{ token, login, logout, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily use the auth context in other components
export const useAuth = () => useContext(AuthContext);