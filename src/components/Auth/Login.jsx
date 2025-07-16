import './Auth.css';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Logging in with:', email, password);
    };

    return (
        <div className="auth-page-container flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-8">
                <h1 className="text-3xl font-semibold text-zinc-800 mb-6">Log in</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                            Email address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400
                focus:outline-none focus:border-green-500 focus:ring-0
                hover:border-green-500 active:border-green-400"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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