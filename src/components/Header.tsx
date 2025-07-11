import React, { useState } from 'react';
import { useAppContext, useTheme } from '../context/AppContext';
import { SunIcon, MoonIcon, BellIcon, CloseIcon, Icon } from '../constants';
import { Notification } from '../types';

const NotificationPanel: React.FC<{ notifications: Notification[], onClose: () => void }> = ({ notifications, onClose }) => (
    <div className="absolute top-16 right-0 w-80 bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold">Notifications</h4>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                <CloseIcon />
            </button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
            {notifications.map(n => (
                <li key={n.id} className={`p-4 border-b border-gray-100 dark:border-gray-700 ${!n.read ? 'bg-brand-teal/5' : ''}`}>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.timestamp}</p>
                </li>
            ))}
        </ul>
    </div>
);


const Header: React.FC<{ onMenuClick: () => void; }> = ({ onMenuClick }) => {
    const { user, credits, notifications } = useAppContext();
    const { theme, setTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    return (
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 bg-light-secondary/50 dark:bg-dark-secondary/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center">
                 <button onClick={onMenuClick} className="md:hidden mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-serif text-gray-800 dark:text-gray-100">Kazi Flow</h1>
                    <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name.split(' ')[0]}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
                <div className="hidden lg:flex items-center space-x-2 bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-full">
                    <Icon path="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385a.563.563 0 01.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988h5.385a.563.563 0 00.475-.321L11.48 3.5z" className="w-5 h-5"/>
                    <span className="font-semibold text-sm">{credits} Credits</span>
                </div>

                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <BellIcon />
                        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-coral ring-2 ring-white dark:ring-dark-secondary"></span>}
                    </button>
                    {showNotifications && <NotificationPanel notifications={notifications} onClose={() => setShowNotifications(false)}/>}
                </div>
                
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>

                <div className="flex items-center space-x-3">
                    <img src={user?.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-brand-teal" />
                    <div className="hidden sm:block">
                        <p className="font-semibold text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.category}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;