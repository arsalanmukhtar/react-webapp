import './Auth.css';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState(''); // Changed from email to username
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
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
                    setError('Login successful, but failed to retrieve user profile.');
                }

            } else {
                const errorData = await loginRes.json();
                console.error('Login failed:', errorData.detail || 'Unknown error');
                setError(errorData.detail || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Network or unexpected error during login:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-page-container flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-8">
                <h1 className="text-3xl font-semibold text-zinc-800 mb-6">Log in</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username" // Changed id to username
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400
                focus:outline-none focus:border-green-500 focus:ring-0
                hover:border-green-500 active:border-green-400"
                            placeholder="your username" // Updated placeholder
                            value={username} // Using username state
                            onChange={(e) => setUsername(e.target.value)} // Updated onChange
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-green-500 hover:underline hover:cursor-pointer"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            id="password"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400
                focus:outline-none focus:border-green-500 focus:ring-0
                hover:border-green-500 active:border-green-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Display error message if any */}
                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-medium transition duration-200
              border border-green-400 hover:bg-green-400 hover:border-green-800
              focus:outline-none focus:ring-0 focus:border-green-500
              active:border-green-800 hover:cursor-pointer"
                    >
                        Continue
                    </button>
                </form>

                {/* Contact Support */}
                <p className="text-sm text-center text-zinc-500 mt-6">
                    Need help?{' '}
                    <a href="#" className="underline hover:text-green-500 hover:cursor-pointer">
                        Contact support
                    </a>
                </p>

                {/* Sign Up Link */}
                <p className="text-sm text-center text-zinc-600 mt-4">
                    Don’t have an account?{' '}
                    <Link
                        to="/signup"
                        className="text-green-500 hover:underline hover:cursor-pointer"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
