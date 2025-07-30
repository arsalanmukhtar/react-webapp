import './Auth.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path
import { useNavigate } from 'react-router-dom';


const Signup = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        const signupRes = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        if (signupRes.ok) {
            console.log(`Signup successful for username: ${username}`);

            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (loginRes.ok) {
                const data = await loginRes.json();
                const accessToken = data.access_token;
                // console.log('Login successful! Access Token:', accessToken);

                login(accessToken);

                const userMeRes = await fetch('/api/data/users/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (userMeRes.ok) {
                    const userData = await userMeRes.json();
                    // console.log('Successfully fetched user data from /api/data/users/me:', userData);
                    navigate('/map-dashboard');
                } else {
                    console.error('Failed to fetch user data from /api/data/users/me');
                    setError('Signup successful, but failed to retrieve user profile.');
                }

            } else {
                const errorData = await loginRes.json();
                console.error('Login failed after signup:', errorData.detail || 'Unknown error');
                setError(errorData.detail || 'Login failed after signup. Please try again.');
            }

        } else {
            const errorData = await signupRes.json();
            console.error('Signup failed:', errorData.detail || 'Unknown error');
            setError(errorData.detail || 'Signup failed. Please try again.');
        }
    };

    return (
        <div className="auth-page-container flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-8">
                <h1 className="text-3xl font-semibold text-zinc-800 mb-6">Sign Up</h1>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
              focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
              focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
              focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400
            hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
            active:border-green-800 hover:cursor-pointer"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-sm text-center text-zinc-600 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-500 hover:underline hover:cursor-pointer">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
