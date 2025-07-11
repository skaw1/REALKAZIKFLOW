import React from 'react';
import PomodoroTimer from '../components/PomodoroTimer';
import FocusWidget from '../components/FocusWidget';

const PomodoroPage: React.FC = () => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Pomodoro Focus</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Use the timer to break down work into intervals, separated by short breaks.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                <div className="lg:col-span-3">
                     <PomodoroTimer />
                </div>
                <div className="lg:col-span-2">
                    <FocusWidget />
                </div>
            </div>
        </div>
    );
};

export default PomodoroPage;
