import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { DashboardIcon, ProjectsIcon, CalendarIcon, ClientsIcon, UsersIcon, MoodboardIcon, AiIcon, SettingsIcon, LogoutIcon, PomodoroIcon, TeamIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '../constants';
import AiAssistant from './AiAssistant';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isExpanded }) => {
    const spanClasses = isExpanded
        ? "ml-4 font-medium"
        : "ml-4 font-medium overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100";

    return (
        <li
            onClick={onClick}
            className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 
                ${isActive
                    ? 'bg-brand-teal text-white shadow-lg'
                    : 'text-gray-400 hover:bg-dark-secondary hover:text-white dark:hover:bg-gray-700'
                }`}
        >
            {icon}
            <span className={spanClasses}>
                {label}
            </span>
        </li>
    );
};


interface SidebarProps {
    isMobile?: boolean;
    onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onLinkClick }) => {
    const { user, activePage, setActivePage, systemLogoUrl } = useAppContext();
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
    const [isPinnedOpen, setIsPinnedOpen] = useState(false);

    const navItems = [
        { icon: <DashboardIcon />, label: 'Dashboard', page: Page.Dashboard, adminOnly: false },
        { icon: <ProjectsIcon />, label: 'Projects', page: Page.Projects, adminOnly: false },
        { icon: <CalendarIcon />, label: 'Calendar', page: Page.MasterCalendar, adminOnly: false },
        { icon: <ClientsIcon />, label: 'Clients', page: Page.Clients, adminOnly: false },
        { icon: <UsersIcon />, label: 'Users', page: Page.Users, adminOnly: true },
        { icon: <TeamIcon />, label: 'Collaboration', page: Page.Collaboration, adminOnly: true },
        { icon: <MoodboardIcon />, label: 'Moodboard', page: Page.Moodboard, adminOnly: false },
        { icon: <PomodoroIcon />, label: 'Pomodoro', page: Page.Pomodoro, adminOnly: false },
        { icon: <SettingsIcon />, label: 'Settings', page: Page.Settings, adminOnly: false },
    ];
    
    const handleLogout = () => {
        signOut(auth).catch(error => {
            console.error("Logout Error:", error);
        });
    }
    
    const handleLinkClick = (page: Page) => {
        setActivePage(page);
        if (onLinkClick) {
            onLinkClick();
        }
    };

    const handleTogglePin = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPinnedOpen(prev => !prev);
    };

    const sidebarClasses = isMobile
        ? "w-64 bg-light-secondary dark:bg-dark-secondary shadow-2xl flex flex-col h-full"
        : `group ${isAiPanelOpen ? 'w-[400px]' : (isPinnedOpen ? 'w-64' : 'w-20 hover:w-64')} transition-all duration-300 ease-in-out bg-light-secondary dark:bg-dark-secondary shadow-2xl flex flex-col`;

    const isSidebarExpanded = isMobile || isPinnedOpen;
    
    const bottomSpanClasses = isSidebarExpanded
        ? "ml-4 font-medium"
        : "ml-4 font-medium overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100";


    return (
        <div className={sidebarClasses}>
            {isAiPanelOpen ? (
                <AiAssistant onClose={() => setIsAiPanelOpen(false)} />
            ) : (
                <>
                    <div className="flex-grow flex flex-col overflow-y-auto">
                        <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700 px-4 overflow-hidden flex-shrink-0">
                            <div className={`w-10 h-10 bg-brand-teal rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg ${isSidebarExpanded ? 'hidden' : 'group-hover:hidden'}`}>
                                {systemLogoUrl ? <img src={systemLogoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" /> : 'K'}
                            </div>
                            
                            <div className={`${isSidebarExpanded ? 'block' : 'hidden group-hover:block'} transition-opacity duration-300`}>
                                {systemLogoUrl ? (
                                    <img src={systemLogoUrl} alt="Kazi Flow Logo" className="h-12 max-w-[180px] object-contain" />
                                ) : (
                                    <span className="font-serif text-2xl whitespace-nowrap">Kazi Flow</span>
                                )}
                            </div>
                        </div>
                        <ul className="p-3">
                            {navItems.map((item) => {
                                if (item.adminOnly && !user?.category.includes('Admin')) return null;
                                return (
                                <NavItem
                                        key={item.page}
                                        icon={item.icon}
                                        label={item.label}
                                        isExpanded={isSidebarExpanded}
                                        isActive={activePage === item.page}
                                        onClick={() => handleLinkClick(item.page)}
                                    />
                                )
                            })}
                             <li
                                onClick={() => setIsAiPanelOpen(true)}
                                className="flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 text-gray-400 hover:bg-dark-secondary hover:text-white dark:hover:bg-gray-700"
                            >
                                <AiIcon />
                                <span className={bottomSpanClasses}>
                                    AI Assistant
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {!isMobile && (
                            <li
                                onClick={handleTogglePin}
                                className="flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 text-gray-400 hover:bg-dark-secondary hover:text-white dark:hover:bg-gray-700"
                            >
                                {isPinnedOpen ? <ChevronDoubleLeftIcon /> : <ChevronDoubleRightIcon />}
                                <span className={bottomSpanClasses}>
                                    {isPinnedOpen ? 'Unpin' : 'Pin'}
                                </span>
                            </li>
                        )}
                        <li
                            onClick={handleLogout}
                            className="flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                        >
                            <LogoutIcon />
                            <span className={bottomSpanClasses}>
                                Logout
                            </span>
                        </li>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;