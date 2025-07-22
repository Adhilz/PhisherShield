// phishing-detection/backend/public/report_app/src/AuthForm.tsx
import React, { useState } from 'react';
import { useFirebase } from './AuthContext';

interface AuthFormProps {
    type: 'login' | 'signup';
    onSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSuccess }) => {
    const { login, signup, loading: authLoading } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (type === 'login') {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                {type === 'login' ? 'Login' : 'Sign Up'}
            </h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                    Email:
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                />
            </div>
            <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                    Password:
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    required
                />
            </div>
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-150 ease-in-out"
                disabled={loading || authLoading}
            >
                {loading || authLoading ? 'Processing...' : (type === 'login' ? 'Login' : 'Sign Up')}
            </button>
        </form>
    );
};

export default AuthForm;