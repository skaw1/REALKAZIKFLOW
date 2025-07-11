import React, { useState } from 'react';
import { useTheme } from '../context/AppContext';
import { SunIcon, MoonIcon } from '../constants';
import Footer from '../components/Footer';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { theme, setTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setIsLoading(true);
        const success = await onLogin(email, password);
        if (!success) {
            setError('Invalid credentials. Please check your email and password.');
            setIsLoading(false);
        }
        // On success, the main App component will handle navigation via the auth state listener.
    }

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-dark-primary text-white' : 'bg-light-primary text-black'}`}>
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-2 rounded-full bg-dark-secondary/50 dark:bg-light-secondary/10 hover:bg-dark-secondary dark:hover:bg-light-secondary/20 transition-colors"
                aria-label="Toggle theme"
            >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="w-full max-w-md p-8 space-y-6 bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-4xl font-serif text-brand-teal">Kazi Flow</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Your team's command center.</p>
                </div>

                <form className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                            placeholder="your password"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center" role="alert">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-teal hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal transition-all disabled:bg-opacity-50"
                    >
                        {isLoading ? 'Signing In...' : 'Sign in'}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
};
