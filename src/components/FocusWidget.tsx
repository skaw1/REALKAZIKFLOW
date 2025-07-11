

import React, { useState, useEffect } from 'react';

const FocusWidget: React.FC = () => {
    const [focus, setFocus] = useState(() => {
        try {
            return localStorage.getItem('kazi-flow-focus-goal') || '';
        } catch (error) {
            console.error("Could not access localStorage", error);
            return '';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('kazi-flow-focus-goal', focus);
        } catch (error) {
            console.error("Could not write to localStorage", error);
        }
    }, [focus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFocus(e.target.value);
    };

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-6 rounded-2xl shadow-lg flex flex-col h-full">
            <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-gray-100">My Focus for Today</h3>
            <textarea
                value={focus}
                onChange={handleChange}
                placeholder="What is your main goal for this session?"
                className="w-full h-full flex-grow p-3 rounded-lg bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-teal focus:outline-none transition-shadow resize-none min-h-[150px] sm:min-h-0"
            />
        </div>
    );
};

export default FocusWidget;