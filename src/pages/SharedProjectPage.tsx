





import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Project, Task, ProjectURL, MoodboardItem } from '../types';
import { MoodboardPage } from './MoodboardPage';
import Footer from '../components/Footer';
import { Icon, TrashIcon, LinkIcon, PlusCircleIcon, CheckCircleIcon, ClipboardIcon } from '../constants';

const NoteRenderer: React.FC<{ text: string }> = React.memo(({ text }) => {
    const parts = text.split(/(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})/g);
    return (
        <div className="whitespace-pre-wrap leading-relaxed">
            {parts.map((part, index) => {
                if (/(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})/g.test(part)) {
                    const hex = part.substring(1);
                    const r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.substring(0, 2), 16);
                    const g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.substring(2, 4), 16);
                    const b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.substring(4, 6), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    const textColor = luminance > 0.5 ? '#000' : '#fff';
                    return <span key={index} className="px-1 py-0.5 rounded" style={{ backgroundColor: part, color: textColor }}>{part}</span>;
                }
                return part;
            })}
        </div>
    );
});

const EditableNotes: React.FC<{
    notes: string;
    onSave: (newNotes: string) => void;
    isEditable: boolean;
}> = ({ notes, onSave, isEditable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentNotes, setCurrentNotes] = useState(notes);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setCurrentNotes(notes); }, [notes]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (currentNotes !== notes) {
            onSave(currentNotes);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentNotes(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    if (isEditing && isEditable) {
        return <textarea ref={textareaRef} value={currentNotes} onChange={handleTextareaChange} onBlur={handleSave} placeholder="Add notes..." className="w-full p-4 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-brand-teal ring-2 ring-brand-teal/50 rounded-lg shadow-inner resize-none overflow-hidden min-h-[150px] leading-relaxed" />;
    }

    return (
        <div onClick={() => isEditable && setIsEditing(true)} className={`w-full p-4 rounded-lg bg-white dark:bg-dark-primary/50 min-h-[150px] ${isEditable ? 'cursor-text hover:bg-gray-50 dark:hover:bg-dark-primary/70 transition-colors' : ''}`}>
            {notes ? <NoteRenderer text={notes} /> : <p className="text-gray-400">{isEditable ? 'Click to add notes...' : 'No notes provided.'}</p>}
        </div>
    );
};

const ProjectDetailsView: React.FC<{
    project: Project;
    onUpdate: (updatedProject: Project) => void;
    isEditable: boolean;
}> = ({ project, onUpdate, isEditable }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newUrlLabel, setNewUrlLabel] = useState('');

    const handleUpdate = (updates: Partial<Project>) => {
        onUpdate({ ...project, ...updates });
    };

    const handleAddTask = () => {
        if (!isEditable || !newTaskText.trim()) return;
        const newTask: Task = { id: `t${Date.now()}`, text: newTaskText, completed: false };
        handleUpdate({ tasks: [...project.tasks, newTask] });
        setNewTaskText('');
    };

    const handleToggleTask = (taskId: string) => {
        if (!isEditable) return;
        const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        handleUpdate({ tasks: updatedTasks });
    };
    
    const handleRemoveTask = (taskId: string) => {
        if (!isEditable) return;
        handleUpdate({ tasks: project.tasks.filter(t => t.id !== taskId) });
    };

    const handleAddUrl = () => {
        if (!isEditable || !newUrl.trim() || !newUrlLabel.trim()) return;
        const newProjectUrl: ProjectURL = { id: `u${Date.now()}`, url: newUrl, label: newUrlLabel };
        handleUpdate({ urls: [...project.urls, newProjectUrl] });
        setNewUrl('');
        setNewUrlLabel('');
    };

    const handleRemoveUrl = (urlId: string) => {
        if (!isEditable) return;
        handleUpdate({ urls: project.urls.filter(u => u.id !== urlId) });
    };

    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-4 sm:p-8 rounded-2xl shadow-xl">
             <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                 <div className="flex flex-col sm:flex-row items-start gap-6">
                     {project.logoUrl && <img src={project.logoUrl} alt={`${project.name} logo`} className="w-20 h-20 rounded-full object-cover border-4 border-light-secondary dark:border-dark-secondary shadow-md" />}
                     <div className="flex-1">
                         <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{project.name}</h2>
                         <p className="text-gray-500 dark:text-gray-400 mt-2">{project.description}</p>
                     </div>
                 </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     {/* Task Panel */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Icon path="M9 12.75L11.25 15 15 9.75" className="w-6 h-6 text-brand-teal" />
                            <h3 className="text-2xl font-semibold">Tasks ({completedTasks}/{totalTasks})</h3>
                        </div>
                         {isEditable && (
                             <div className="flex gap-2 mb-4">
                                <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddTask()} placeholder="Add a new task..." className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <button onClick={handleAddTask} className="p-2 bg-brand-teal text-white rounded-md"><PlusCircleIcon /></button>
                            </div>
                         )}
                        <ul className="space-y-2">
                            {project.tasks.map(task => (
                                <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-primary/50 group">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleToggleTask(task.id)} disabled={!isEditable}>
                                            <CheckCircleIcon solid={task.completed} className={`w-6 h-6 transition-colors ${task.completed ? 'text-brand-teal' : `text-gray-400 ${isEditable ? 'hover:text-brand-teal' : ''}`}`}/>
                                        </button>
                                        <span className={`transition-colors ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{task.text}</span>
                                    </div>
                                    {isEditable && <button onClick={() => handleRemoveTask(task.id)} className="text-gray-400 hover:text-brand-coral opacity-0 group-hover:opacity-100"><TrashIcon /></button>}
                                </li>
                            ))}
                            {project.tasks.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet.</p>}
                        </ul>
                    </div>
                </div>
                 <div className="space-y-8">
                    {/* Notes */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardIcon className="w-6 h-6 text-brand-gold" />
                            <h3 className="text-2xl font-semibold">Notes</h3>
                        </div>
                        <EditableNotes notes={project.notes} onSave={(newNotes) => handleUpdate({ notes: newNotes })} isEditable={isEditable} />
                    </div>
                     {/* URLs */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <LinkIcon className="w-6 h-6 text-blue-500" />
                            <h3 className="text-2xl font-semibold">Project Links</h3>
                        </div>
                        <ul className="space-y-2 mb-4">
                            {project.urls.map(url => (
                                <li key={url.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-primary/50 group">
                                    <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline truncate">{url.label}</a>
                                    {isEditable && <button onClick={() => handleRemoveUrl(url.id)} className="text-gray-400 hover:text-brand-coral opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>}
                                </li>
                            ))}
                            {project.urls.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-2">No links added.</p>}
                        </ul>
                         {isEditable && (
                            <div className="flex gap-2">
                                <input type="text" value={newUrlLabel} onChange={e => setNewUrlLabel(e.target.value)} placeholder="Label" className="w-1/3 px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <button onClick={handleAddUrl} className="p-2 bg-brand-teal text-white rounded-md"><PlusCircleIcon /></button>
                            </div>
                         )}
                    </div>
                 </div>
             </div>
        </div>
    );
};

const SharedProjectPage: React.FC<{ linkId: string }> = ({ linkId }) => {
    const { projects, setProjects } = useAppContext();
    const [project, setProject] = useState<Project | null>(null);
    const [permission, setPermission] = useState<'view' | 'edit' | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'moodboard'>('details');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const foundProject = projects.find(p => p.sharing?.isEnabled && p.sharing.linkId === linkId);
        if (foundProject) {
            setProject(foundProject);
            setPermission(foundProject.sharing!.permission);
        } else {
            setError("Project not found, or sharing is disabled for this link.");
        }
    }, [linkId, projects]);

    const handleUpdateProject = useCallback((updatedProject: Project) => {
        setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
        setProject(updatedProject);
    }, [setProjects]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-light-primary dark:bg-dark-primary p-4">
                <h1 className="text-3xl font-bold text-brand-coral">Access Denied</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
                <a href="/" className="mt-6 text-brand-teal hover:underline">Return to Kazi Flow</a>
            </div>
        );
    }
    
    if (!project) {
        return <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary">Loading...</div>;
    }

    const isEditable = permission === 'edit';

    const handleMoodboardUpdate = (updates: { items?: MoodboardItem[], trashedItems?: MoodboardItem[] }) => {
        const updatedProject = {
            ...project,
            moodboardItems: updates.items !== undefined ? updates.items : project.moodboardItems,
            trashedMoodboardItems: updates.trashedItems !== undefined ? updates.trashedItems : project.trashedMoodboardItems,
        };
        handleUpdateProject(updatedProject);
    };

    return (
        <div className="min-h-screen flex flex-col bg-light-primary dark:bg-dark-primary text-gray-800 dark:text-gray-200">
            <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 bg-light-secondary/50 dark:bg-dark-secondary/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700/50">
                 <span className="font-serif text-2xl whitespace-nowrap">Kazi Flow</span>
                 {permission === 'edit' && <span className="text-sm font-bold text-brand-coral px-3 py-1 bg-brand-coral/10 rounded-full">Editing Mode</span>}
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
                    <button onClick={() => setActiveTab('details')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'details' ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-gray-500 hover:text-gray-800'}`}>Project Details</button>
                    <button onClick={() => setActiveTab('moodboard')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'moodboard' ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-gray-500 hover:text-gray-800'}`}>Moodboard</button>
                </div>
                
                {activeTab === 'details' && <ProjectDetailsView project={project} onUpdate={handleUpdateProject} isEditable={isEditable} />}
                {activeTab === 'moodboard' && (
                    <MoodboardPage
                        title={`${project.name} Moodboard`}
                        isEditable={isEditable}
                        items={project.moodboardItems}
                        trashedItems={project.trashedMoodboardItems}
                        onUpdateMoodboard={handleMoodboardUpdate}
                    />
                )}
            </main>
            
            <Footer />
        </div>
    );
};

export default SharedProjectPage;