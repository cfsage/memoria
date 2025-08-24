// frontend/app/login/page.js
'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // IMPORT useAuth
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // GET the login function from our context
    const router = useRouter(); // Initialize the router

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // FastAPI's token endpoint expects form data, not JSON
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to login');
            }
            
            // This is the important part: it saves the token and redirects
            login(data.access_token); 

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-gray-800">Welcome Back</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full px-4 py-2 text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:bg-gray-400">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-sm">
                    Donot have an account?{' '}
                    <Link href="/register" className="font-medium text-violet-600 hover:text-violet-500">
                        Register
                    </Link>
                </p>
            </div>
        </main>
    );
}