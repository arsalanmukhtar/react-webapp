import './Auth.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';


const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = (e) => {
        e.preventDefault();
        console.log('Signing up with:', email, password);
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
