


import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Project, CalendarEvent, Page, UserCategory } from '../types';
import ProgressBar from '../components/ProgressBar';
import { Icon, ProjectsIcon, ClientsIcon, BellIcon, PomodoroIcon } from '../constants';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`bg-light-secondary dark:bg-dark-secondary p-4 sm:p-6 rounded-2xl shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border', 'bg')}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const NavCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void; }> = ({ title, description, icon, color, onClick }) => (
    <div onClick={onClick} className={`group bg-light-secondary dark:bg-dark-secondary p-6 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 col-span-2 lg:col-span-4 border-l-4 ${color}`}>
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border', 'bg')}`}>
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-xl">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
            </div>
        </div>
        <div className="text-right">
             <span className="font-semibold text-sm text-brand-teal group-hover:underline">Open Feature &rarr;</span>
        </div>
    </div>
);


const UpcomingDeadlines: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
    const upcoming = events
        .filter(e => e.type === 'deadline' && e.start > new Date())
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 3);

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-6 rounded-2xl shadow-lg col-span-2 lg:col-span-2">
            <h3 className="font-bold text-xl mb-4">Upcoming Deadlines</h3>
            {upcoming.length > 0 ? (
                <ul className="space-y-3">
                    {upcoming.map((event, i) => (
                        <li key={i} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-dark-primary/50">
                            <span className="font-semibold">{event.title}</span>
                            <span className="text-sm text-brand-coral font-medium">{event.start.toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines.</p>
            )}
        </div>
    );
};

const ProjectsOverview: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const overallCompletion = projects.length > 0
        ? Math.round(projects.reduce((acc, p) => acc + p.completion, 0) / projects.length)
        : 0;
    
    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-6 rounded-2xl shadow-lg col-span-2 lg:col-span-2">
            <h3 className="font-bold text-xl mb-4">Projects Overview</h3>
            <div className="space-y-4">
                {projects.slice(0, 2).map(project => (
                     <div key={project.id}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-sm">{project.name}</span>
                            <span className="text-sm font-bold text-brand-teal">{project.completion}%</span>
                        </div>
                        <ProgressBar progress={project.completion} />
                    </div>
                ))}
                 {projects.length === 0 && <p className="text-gray-500 dark:text-gray-400">No active projects.</p>}
            </div>
            {projects.length > 0 && 
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-sm">Overall progress: <span className="font-bold">{overallCompletion}%</span></p>
                </div>
            }
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const { user, projects, clients, events, notifications, setActivePage } = useAppContext();
    
    const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
    const isRestrictedView = user?.category ? restrictedCategories.includes(user.category) : false;

    const userProjects = isRestrictedView
        ? projects.filter(p => p.ownerId === user?.id || p.team.some(m => m.id === user?.id))
        : projects;
    
    const userClients = isRestrictedView
        ? clients.filter(c => c.ownerId === user?.id)
        : clients;
    
    const userEvents = isRestrictedView
        ? events.filter(e => e.ownerId === user?.id)
        : events;

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome, {user?.name.split(' ')[0]}!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Here's your command center at a glance.</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard 
                    title="Credits" 
                    value={user?.productivityScore || 0}
                    icon={<Icon path="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385a.563.563 0 01.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988h5.385a.563.563 0 00.475-.321L11.48 3.5z" className="w-6 h-6"/>} 
                    color="border-brand-gold"
                />
                 <StatCard 
                    title={isRestrictedView ? "My Projects" : "All Projects"}
                    value={userProjects.length}
                    icon={<ProjectsIcon />} 
                    color="border-brand-teal"
                />
                <StatCard 
                    title={isRestrictedView ? "My Contacts" : "All Clients"} 
                    value={userClients.length}
                    icon={<ClientsIcon />} 
                    color="border-blue-500"
                />
                <StatCard 
                    title="Unread" 
                    value={notifications.filter(n => !n.read).length}
                    icon={<BellIcon />} 
                    color="border-brand-coral"
                />
                
                <ProjectsOverview projects={userProjects} />
                <UpcomingDeadlines events={userEvents} />

                <NavCard
                    title="Focus Timer"
                    description="Use the Pomodoro Technique to boost your productivity with focused work sessions."
                    icon={<PomodoroIcon />}
                    color="border-brand-coral"
                    onClick={() => setActivePage(Page.Pomodoro)}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
