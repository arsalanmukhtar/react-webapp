import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(''); // To display success or error messages
    const [error, setError] = useState(''); // To display specific error messages

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setError(''); // Clear previous errors

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                const data = await res.json();
                setMessage(data.message); // Display the success message from the backend
            } else {
                const errorData = await res.json();
                setError(errorData.detail || 'Failed to send reset link. Please try again.'); // Display specific error or generic
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-8">
                <h1 className="text-3xl font-semibold text-zinc-800 mb-6">Forgot Password</h1>

                <form onSubmit={handleReset} className="space-y-5">
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

                    {message && (
                        <p className="text-green-600 text-sm text-center">{message}</p>
                    )}
                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400
            hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
            active:border-green-800 hover:cursor-pointer"
                    >
                        Send Reset Link
                    </button>
                </form>

                <p className="text-sm text-center text-zinc-600 mt-6">
                    Back to{' '}
                    <Link to="/login" className="text-green-500 hover:underline hover:cursor-pointer">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;