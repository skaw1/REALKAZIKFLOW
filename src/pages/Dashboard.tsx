

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, MoodboardItem, UserCategory } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProjectsPage from './ProjectsPage';
import MasterCalendarPage from './MasterCalendarPage';
import ClientsPage from './ClientsPage';
import { MoodboardPage } from './MoodboardPage';
import SettingsPage from './SettingsPage';
import DashboardPage from './DashboardPage';
import UsersPage from './UsersPage';
import Footer from '../components/Footer';
import PomodoroPage from './PomodoroPage';
import CollaborationPage from './CollaborationPage';

const Dashboard: React.FC = () => {
    const { activePage, projects, setProjects, user, activeMoodboardProjectId, setActiveMoodboardProjectId } = useAppContext();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderActivePage = () => {
        switch (activePage) {
            case Page.Projects:
                return <ProjectsPage />;
            case Page.MasterCalendar:
                return <MasterCalendarPage />;
            case Page.Clients:
                return <ClientsPage />;
            case Page.Users:
                return <UsersPage />;
            case Page.Moodboard: {
                let projectToShow = projects.find(p => p.id === activeMoodboardProjectId);

                if (!projectToShow && user) {
                    const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
                    const isRestrictedView = user.category ? restrictedCategories.includes(user.category) : false;

                    const userProjects = isRestrictedView
                        ? projects.filter(p => p.ownerId === user.id || p.team.some(m => m.id === user.id))
                        : projects;
                    
                    if (userProjects.length > 0) {
                        projectToShow = userProjects[0];
                    }
                }

                if (!projectToShow) {
                     return (
                        <div className="text-center py-20">
                            <h2 className="text-2xl font-bold">No Moodboard to Display</h2>
                            <p className="text-gray-500 mt-2">Please select a project to view its moodboard, or create one.</p>
                        </div>
                    );
                }

                const finalProject = projectToShow;

                const handleMoodboardChange = (updates: { items?: MoodboardItem[], trashedItems?: MoodboardItem[] }) => {
                    const updatedProject = { 
                        ...finalProject, 
                        moodboardItems: updates.items !== undefined ? updates.items : finalProject.moodboardItems,
                        trashedMoodboardItems: updates.trashedItems !== undefined ? updates.trashedItems : finalProject.trashedMoodboardItems,
                    };
                    setProjects(prevProjects => prevProjects.map(p => p.id === finalProject.id ? updatedProject : p));
                };

                return (
                    <MoodboardPage
                        title={`${finalProject.name}: Moodboard`}
                        items={finalProject.moodboardItems}
                        trashedItems={finalProject.trashedMoodboardItems}
                        onUpdateMoodboard={handleMoodboardChange}
                        isEditable={true}
                        projects={projects}
                        onSelectProject={setActiveMoodboardProjectId}
                        activeProjectId={finalProject.id}
                    />
                );
            }
            case Page.Pomodoro:
                return <PomodoroPage />;
            case Page.Settings:
                return <SettingsPage />;
            case Page.Collaboration:
                return <CollaborationPage />;
            case Page.Dashboard:
            default:
                return <DashboardPage />;
        }
    };

    return (
        <div className="flex h-screen bg-light-primary dark:bg-dark-primary text-gray-800 dark:text-gray-200 relative">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 md:hidden transition-opacity ${isSidebarOpen ? 'bg-black/60' : 'pointer-events-none opacity-0'}`} onClick={() => setSidebarOpen(false)}></div>
            <div className={`fixed z-50 md:hidden h-full top-0 left-0 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <Sidebar isMobile={true} onLinkClick={() => setSidebarOpen(false)} />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(p => !p)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8">
                    {renderActivePage()}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Dashboard;