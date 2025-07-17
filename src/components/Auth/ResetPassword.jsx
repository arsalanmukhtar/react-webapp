import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const location = useLocation(); // To get URL parameters
    const navigate = useNavigate();

    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Password reset token is missing.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!token) {
            setError('Password reset token is missing.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword })
            });

            if (res.ok) {
                setMessage('Your password has been reset successfully. You can now log in with your new password.');
                // Redirect to login page after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 3000); // Redirect after 3 seconds
            } else {
                const errorData = await res.json();
                setError(errorData.detail || 'Failed to reset password. Please try again.');
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-8">
                <h1 className="text-3xl font-semibold text-zinc-800 mb-6">Reset Password</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
              focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
              focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        Reset Password
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

export default ResetPassword;
