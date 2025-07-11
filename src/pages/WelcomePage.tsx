
import React from 'react';
import { useTheme } from '../context/AppContext';

const WelcomePage: React.FC<{ isExiting: boolean }> = ({ isExiting }) => {
    const { theme } = useTheme();

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-dark-primary text-white' : 'bg-light-primary text-black'} ${isExiting ? 'fade-out' : ''}`}>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    .fade-in { animation: fadeIn 1.5s ease-out forwards; }
                    .fade-in-up { animation: fadeInUp 1s ease-out forwards; }
                    .fade-out { animation: fadeOut 0.5s ease-out forwards; }
                    .delay-500 { animation-delay: 0.5s; }
                    .delay-1000 { animation-delay: 1s; }
                `}
            </style>
            <div className="text-center">
                <h1 className="text-6xl font-serif text-brand-teal fade-in-up">Kazi Flow</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 fade-in-up delay-500 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    Your team's command center.
                </p>
            </div>
            <div className="absolute bottom-16 flex items-center space-x-2 fade-in delay-1000 opacity-0" style={{ animationFillMode: 'forwards' }}>
                <div className="w-3 h-3 bg-brand-teal rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-brand-teal rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-brand-teal rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
};

export default WelcomePage;
