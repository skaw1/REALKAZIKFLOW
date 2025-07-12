

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Project, Task, ProjectURL, Page, UserCategory, SentEmail } from '../types';
import ProgressBar from '../components/ProgressBar';
import { useAppContext } from '../context/AppContext';
import { Icon, TrashIcon, LinkIcon, ClipboardIcon, PlusCircleIcon, CheckCircleIcon, ArrowLeftIcon, ClientsIcon, MoodboardIcon } from '../constants';
import { generateProgressUpdateEmail } from '../services/geminiService';
import { db } from '../services/firebase';

// Renders notes with color highlighting for hex codes and improved text contrast
const NoteRenderer: React.FC<{ text: string }> = React.memo(({ text }) => {
    const parts = text.split(/(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})/g);
    return (
        <div className="whitespace-pre-wrap leading-relaxed">
            {parts.map((part, index) => {
                if (/(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})/g.test(part)) {
                    // Simple contrast logic to determine if text should be black or white
                    const hex = part.substring(1);
                    const r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.substring(0, 2), 16);
                    const g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.substring(2, 4), 16);
                    const b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.substring(4, 6), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    const textColor = luminance > 0.5 ? '#000' : '#fff';

                    return (
                        <span key={index} className="px-1 py-0.5 rounded" style={{ backgroundColor: part, color: textColor }}>
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </div>
    );
});

// A component that allows in-place editing for notes
const EditableNotes: React.FC<{
    notes: string;
    onSave: (newNotes: string) => void;
}> = ({ notes, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentNotes, setCurrentNotes] = useState(notes);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentNotes(notes);
    }, [notes]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Auto-size on edit start
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
        // Auto-size while typing
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                value={currentNotes}
                onChange={handleTextareaChange}
                onBlur={handleSave}
                placeholder="Add notes for this project. Use hex codes like #0a777b to highlight colors."
                className="w-full p-4 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-brand-teal ring-2 ring-brand-teal/50 rounded-lg shadow-inner resize-none overflow-hidden min-h-[200px] leading-relaxed"
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="w-full p-4 rounded-lg bg-white dark:bg-dark-primary/50 min-h-[200px] cursor-text hover:bg-gray-50 dark:hover:bg-dark-primary/70 transition-colors"
        >
            {notes ? <NoteRenderer text={notes} /> : <p className="text-gray-400">Click to add notes...</p>}
        </div>
    );
};

const ShareProject: React.FC<{
    project: Project;
    onUpdateProject: (updatedProject: Partial<Project>) => void;
}> = ({ project, onUpdateProject }) => {
    const [copied, setCopied] = useState(false);

    const shareLink = useMemo(() => {
        if (project.sharing?.isEnabled && project.sharing.linkId) {
            return `${window.location.origin}/share/project/${project.sharing.linkId}`;
        }
        return null;
    }, [project.sharing]);

    const handleToggleSharing = (isEnabled: boolean) => {
        let sharingUpdate: Project['sharing'];
        if (isEnabled) {
            sharingUpdate = {
                isEnabled: true,
                linkId: project.sharing?.linkId || crypto.randomUUID(),
                permission: project.sharing?.permission || 'view',
            };
        } else {
             sharingUpdate = {
                ...(project.sharing || { linkId: crypto.randomUUID(), permission: 'view' }),
                isEnabled: false,
            };
        }
        onUpdateProject({ sharing: sharingUpdate });
    };

    const handlePermissionChange = (permission: 'view' | 'edit') => {
        if (!project.sharing) return;
        const sharingUpdate: Project['sharing'] = {
            ...project.sharing,
            permission,
        };
        onUpdateProject({ sharing: sharingUpdate });
    };

    const copyToClipboard = () => {
        if (!shareLink) return;
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Icon path="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.186 2.25 2.25 0 00-3.933 2.186z" className="w-6 h-6 text-purple-500" />
                <h3 className="text-2xl font-semibold">Share Project</h3>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-dark-primary/50 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="font-medium">Enable Public Link</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={project.sharing?.isEnabled || false} onChange={(e) => handleToggleSharing(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-teal"></div>
                    </label>
                </div>

                {project.sharing?.isEnabled && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-medium mb-1">Permissions</label>
                            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-dark-primary p-1 rounded-lg">
                                <button onClick={() => handlePermissionChange('view')} className={`flex-1 text-sm font-semibold py-1 px-2 rounded-md transition-colors ${project.sharing?.permission === 'view' ? 'bg-white dark:bg-dark-secondary text-brand-teal shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}>View Only</button>
                                <button onClick={() => handlePermissionChange('edit')} className={`flex-1 text-sm font-semibold py-1 px-2 rounded-md transition-colors ${project.sharing?.permission === 'edit' ? 'bg-white dark:bg-dark-secondary text-brand-teal shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}>Can Edit</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Shareable Link</label>
                            <div className="flex items-center gap-2">
                                <input type="text" readOnly value={shareLink || ''} className="flex-grow px-3 py-2 bg-gray-100 dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-md text-sm truncate" />
                                <button onClick={copyToClipboard} className="p-2 bg-brand-teal text-white rounded-md hover:bg-opacity-90">
                                    {copied ? <CheckCircleIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// Project Detail View Component
const ProjectDetailPage: React.FC<{
    project: Project;
    onUpdateProject: (projectId: string, updatedProject: Partial<Project>) => void;
    onBack: () => void;
}> = ({ project, onUpdateProject, onBack }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newUrlLabel, setNewUrlLabel] = useState('');
    const { clients, setActivePage, setInitialSelectedClientId, setActiveMoodboardProjectId } = useAppContext();

    const handleUpdate = (updates: Partial<Project>) => {
        onUpdateProject(project.id, updates);
    };

    const handleAddTask = () => {
        if (!newTaskText.trim()) return;
        const newTask: Task = { id: `t${Date.now()}`, text: newTaskText, completed: false };
        handleUpdate({ tasks: [...project.tasks, newTask] });
        setNewTaskText('');
    };

    const handleToggleTask = (taskId: string) => {
        const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        handleUpdate({ tasks: updatedTasks });
    };

    const handleRemoveTask = (taskId: string) => {
        handleUpdate({ tasks: project.tasks.filter(t => t.id !== taskId) });
    };
    
    const handleAddUrl = () => {
        if (!newUrl.trim() || !newUrlLabel.trim()) return;
        const newProjectUrl: ProjectURL = { id: `u${Date.now()}`, url: newUrl, label: newUrlLabel };
        handleUpdate({ urls: [...project.urls, newProjectUrl] });
        setNewUrl('');
        setNewUrlLabel('');
    };
    
    const handleRemoveUrl = (urlId: string) => {
        handleUpdate({ urls: project.urls.filter(u => u.id !== urlId) });
    };

    const handleLinkClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedClientId = e.target.value;
        handleUpdate({ clientId: selectedClientId || undefined });
    };
    
    const viewClient = (clientId: string) => {
        setInitialSelectedClientId(clientId);
        setActivePage(Page.Clients);
    }

    const viewMoodboard = () => {
        setActiveMoodboardProjectId(project.id);
        setActivePage(Page.Moodboard);
    };

    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;
    const linkedClient = project.clientId ? clients.find(c => c.id === project.clientId) : null;

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-teal dark:hover:text-brand-teal transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to All Projects
            </button>
            <div className="bg-light-secondary dark:bg-dark-secondary p-4 sm:p-8 rounded-2xl shadow-xl">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        {project.logoUrl && (
                            <img src={project.logoUrl} alt={`${project.name} logo`} className="w-20 h-20 rounded-full object-cover border-4 border-light-secondary dark:border-dark-secondary shadow-md" />
                        )}
                        <div className="flex-1 flex justify-between items-start gap-4">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{project.name}</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">{project.description}</p>
                            </div>
                            <button
                                onClick={viewMoodboard}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-brand-coral text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors"
                            >
                                <MoodboardIcon className="w-5 h-5"/>
                                View Moodboard
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-sm">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${project.status === 'Real' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'}`}>
                            {project.status}
                        </span>
                        {project.status === 'Real' && project.deadline && (
                            <>
                                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
                                <span className="font-semibold text-sm">Deadline:</span>
                                <span className="font-medium">{project.deadline.toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Task Panel */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon path="M9 12.75L11.25 15 15 9.75" className="w-6 h-6 text-brand-teal" />
                            <h3 className="text-2xl font-semibold">Tasks ({completedTasks}/{totalTasks})</h3>
                        </div>
                         <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={e => setNewTaskText(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddTask()}
                                placeholder="Add a new task..."
                                className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            />
                            <button onClick={handleAddTask} className="p-2 bg-brand-teal text-white rounded-md hover:bg-opacity-90 transition-colors">
                                <PlusCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {project.tasks.map(task => (
                                <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-primary/50 group">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleToggleTask(task.id)}>
                                            <CheckCircleIcon solid={task.completed} className={`w-6 h-6 transition-colors ${task.completed ? 'text-brand-teal' : 'text-gray-400 hover:text-brand-teal'}`}/>
                                        </button>
                                        <span className={`transition-colors ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{task.text}</span>
                                    </div>
                                    <button onClick={() => handleRemoveTask(task.id)} className="text-gray-400 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon />
                                    </button>
                                </li>
                            ))}
                            {project.tasks.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet. Add one above!</p>}
                        </ul>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-8">
                        {/* Client Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ClientsIcon />
                                <h3 className="text-2xl font-semibold">Client</h3>
                            </div>
                            <div className="p-4 rounded-lg bg-white dark:bg-dark-primary/50">
                                {linkedClient ? (
                                    <div>
                                        <button onClick={() => viewClient(linkedClient.id)} className="font-bold text-brand-teal hover:underline">{linkedClient.name}</button>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{linkedClient.contactPerson}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No client linked.</p>
                                )}
                                 <select onChange={handleLinkClient} value={project.clientId || ''} className="mt-3 w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal">
                                    <option value="">{linkedClient ? 'Unlink Client' : 'Link a client...'}</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ClipboardIcon className="w-6 h-6 text-brand-gold" />
                                <h3 className="text-2xl font-semibold">Notes</h3>
                            </div>
                            <EditableNotes
                                notes={project.notes}
                                onSave={(newNotes) => handleUpdate({ notes: newNotes })}
                            />
                        </div>

                        {/* URLs */}
                        <div>
                           <div className="flex items-center gap-2 mb-4">
                                <LinkIcon className="w-5 h-5 text-blue-500" />
                                <h3 className="text-2xl font-semibold">Project Links</h3>
                            </div>
                            <ul className="space-y-2 mb-4">
                                {project.urls.map(url => (
                                    <li key={url.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-primary/50 group">
                                        <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline truncate">{url.label}</a>
                                        <button onClick={() => handleRemoveUrl(url.id)} className="text-gray-400 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </li>
                                ))}
                                {project.urls.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-2">No links added.</p>}
                            </ul>
                            <div className="flex gap-2">
                                <input type="text" value={newUrlLabel} onChange={e => setNewUrlLabel(e.target.value)} placeholder="Label" className="w-1/3 px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <button onClick={handleAddUrl} className="p-2 bg-brand-teal text-white rounded-md hover:bg-opacity-90 transition-colors"><PlusCircleIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                        
                        <ShareProject project={project} onUpdateProject={handleUpdate} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectCard: React.FC<{ project: Project; onViewDetails: () => void; }> = ({ project, onViewDetails }) => (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-3 mb-2">
                {project.logoUrl && (
                    <img src={project.logoUrl} alt={`${project.name} logo`} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-dark-primary" />
                )}
                <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 truncate flex-1">{project.name}</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm h-10 overflow-hidden text-ellipsis">{project.description}</p>
        </div>
        <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progress</span>
                <span className="text-sm font-bold text-brand-teal">{project.completion}%</span>
            </div>
            <ProgressBar progress={project.completion} />
            <div className="flex items-center justify-between mt-4">
                <div className="flex -space-x-2">
                    {project.team.map(member => (
                        <img key={member.id} src={member.avatarUrl} alt={member.name} title={member.name} className="w-8 h-8 rounded-full border-2 border-light-secondary dark:border-dark-secondary" />
                    ))}
                </div>
                <button onClick={onViewDetails} className="text-sm font-semibold text-brand-teal hover:underline">View Details</button>
            </div>
        </div>
    </div>
);

const AddProjectModal: React.FC<{ 
    onClose: () => void; 
    onSave: (project: Omit<Project, 'id' | 'completion' | 'team' | 'ownerId' | 'tasks' | 'notes' | 'urls' | 'moodboardItems' | 'trashedMoodboardItems' | 'sharing'>, clientId?: string) => void;
    initialClientId?: string;
}> = ({ onClose, onSave, initialClientId }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'Draft' | 'Real'>('Draft');
    const [deadline, setDeadline] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoType, setLogoType] = useState<'url' | 'file'>('url');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || (status === 'Real' && !deadline)) return;
        onSave({
            name,
            description,
            status,
            deadline: status === 'Real' ? new Date(deadline) : null,
            logoUrl: logoUrl || undefined,
            clientId: initialClientId,
        }, initialClientId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6">Add New Project</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                        <input type="text" id="projectName" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                    </div>
                    <div>
                        <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea id="projectDescription" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <div className="flex items-center space-x-4 mt-1">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="status" value="Draft" checked={status === 'Draft'} onChange={() => setStatus('Draft')} className="form-radio text-brand-teal focus:ring-brand-teal" />
                                <span className="text-gray-800 dark:text-gray-200">Draft</span>
                            </label>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="status" value="Real" checked={status === 'Real'} onChange={() => setStatus('Real')} className="form-radio text-brand-teal focus:ring-brand-teal" />
                                <span className="text-gray-800 dark:text-gray-200">Real (w/ Deadline)</span>
                            </label>
                        </div>
                    </div>
                    {status === 'Real' && (
                        <div>
                             <label htmlFor="projectDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                            <input type="date" id="projectDeadline" value={deadline} onChange={e => setDeadline(e.target.value)} required={status === 'Real'} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo (Optional)</label>
                        <div className="flex items-center space-x-2 mb-2">
                             <button type="button" onClick={() => setLogoType('url')} className={`px-3 py-1 text-xs rounded-md ${logoType === 'url' ? 'bg-brand-teal text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>URL</button>
                             <button type="button" onClick={() => setLogoType('file')} className={`px-3 py-1 text-xs rounded-md ${logoType === 'file' ? 'bg-brand-teal text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Upload</button>
                        </div>
                        {logoType === 'url' ? (
                             <input type="url" id="projectLogoUrl" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                        ) : (
                            <input type="file" id="projectLogoFile" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20 cursor-pointer"/>
                        )}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-brand-teal text-white font-semibold hover:bg-opacity-90 transition-colors shadow-md">Add Project</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ProjectsPage: React.FC = () => {
    const { user, users, projects, setProjects, setSentEmails, initialSelectedProjectId, setInitialSelectedProjectId, triggerProjectCreationForClientId, setTriggerProjectCreationForClientId } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('completion-desc');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Real'>('all');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [initialClientIdForModal, setInitialClientIdForModal] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        if (initialSelectedProjectId) {
            const project = projects.find(p => p.id === initialSelectedProjectId);
            if (project) {
                setSelectedProject(project);
            }
            setInitialSelectedProjectId(null);
        }
    }, [initialSelectedProjectId, projects, setInitialSelectedProjectId]);

    useEffect(() => {
        if (triggerProjectCreationForClientId) {
            setInitialClientIdForModal(triggerProjectCreationForClientId);
            setModalOpen(true);
            setTriggerProjectCreationForClientId(null);
        }
    }, [triggerProjectCreationForClientId, setTriggerProjectCreationForClientId]);


    const handleSaveProject = async (newProjectData: Omit<Project, 'id' | 'completion' | 'team' | 'ownerId' | 'tasks' | 'notes' | 'urls' | 'moodboardItems' | 'trashedMoodboardItems' | 'sharing'>, clientId?: string) => {
        if (!user) return;
        const projectDataForFirestore: Omit<Project, 'id'> = {
            ...newProjectData,
            completion: 0,
            ownerId: user.id,
            team: [user],
            tasks: [],
            notes: 'Initial notes... #0a777b',
            urls: [],
            clientId: clientId,
            moodboardItems: [],
            trashedMoodboardItems: [],
            sharing: {
                isEnabled: false,
                linkId: crypto.randomUUID(),
                permission: 'view',
            },
        };

        try {
            const docRef = await db.collection('projects').add(projectDataForFirestore);
            const newProjectForState: Project = {
                id: docRef.id,
                ...projectDataForFirestore,
            };
            // The onSnapshot listener in AppContext will update the state,
            // but we can add it here for immediate optimistic-like update.
            setProjects(prevProjects => [...prevProjects, newProjectForState]);
        } catch (error) {
            console.error("Error adding project:", error);
            alert("Failed to save project. Please check your connection and try again.");
        }
    };
    
    const handleUpdateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
        const oldProject = projects.find(p => p.id === projectId);
        if (!oldProject) return;

        let finalUpdates = { ...updates };

        if(updates.tasks) {
            const totalTasks = updates.tasks.length;
            const completedTasks = updates.tasks.filter(t => t.completed).length;
            const newCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const oldCompletion = oldProject.completion;
            
            finalUpdates.completion = newCompletion;
            
            const milestones = [25, 50, 75, 100];
            const crossedMilestone = milestones.find(m => oldCompletion < m && newCompletion >= m);

            if (crossedMilestone) {
                const owner = users.find(u => u.id === oldProject.ownerId);
                if (owner && owner.notificationPreferences.progressUpdates === 'milestones') {
                    const projectWithNewCompletion = { ...oldProject, ...finalUpdates };
                    generateProgressUpdateEmail(projectWithNewCompletion, owner.name.split(' ')[0]).then(async emailContent => {
                         const newEmail: Omit<SentEmail, 'id'> = {
                            to: owner.notificationPreferences.notificationEmail,
                            ...emailContent,
                            timestamp: new Date(),
                            read: false,
                        };
                         await db.collection("sentEmails").add(newEmail);
                    });
                }
            }
        }
        
        try {
            const projectDocRef = db.collection('projects').doc(projectId);
            await projectDocRef.update(finalUpdates);
            
            // The onSnapshot listener in AppContext handles the state update from Firestore.
            // For a more responsive feel, we can update the local state immediately.
            setProjects(prevProjects => prevProjects.map(p =>
                p.id === projectId ? { ...p, ...finalUpdates } as Project : p
            ));
            
            if(selectedProject?.id === projectId){
                setSelectedProject(prev => prev ? {...prev, ...finalUpdates} as Project : null);
            }
        } catch (error) {
            console.error("Error updating project:", error);
            // Optionally, revert the optimistic update here
            alert("Failed to update project. Please check your connection and try again.");
        }

    }, [projects, users, setSentEmails, selectedProject, setProjects]);


    const displayedProjects = useMemo(() => {
        const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
        const isRestrictedView = user?.category ? restrictedCategories.includes(user.category) : false;
        
        const userProjects = isRestrictedView
            ? projects.filter(p => p.ownerId === user?.id || p.team.some(m => m.id === user?.id))
            : projects;
        
        let filtered = userProjects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'completion-asc':
                    return a.completion - b.completion;
                case 'completion-desc':
                    return b.completion - a.completion;
                default:
                    return 0;
            }
        });
    }, [projects, user, searchQuery, sortBy, statusFilter]);
    
    if (selectedProject) {
        return <ProjectDetailPage project={selectedProject} onUpdateProject={handleUpdateProject} onBack={() => setSelectedProject(null)} />
    }
    
    const filterOptions: { key: 'all' | 'Real' | 'Draft'; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'Real', label: 'Real' },
        { key: 'Draft', label: 'Drafts' },
    ];

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Active Projects</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Filter projects..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-dark-secondary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                    />
                    <div className="flex-shrink-0 bg-gray-200 dark:bg-dark-primary p-1 rounded-lg">
                        {filterOptions.map((option) => (
                            <button
                                key={option.key}
                                onClick={() => setStatusFilter(option.key)}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                    statusFilter === option.key
                                        ? 'bg-white dark:bg-dark-secondary text-brand-teal shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-300/50 dark:hover:bg-dark-secondary/50'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-dark-secondary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                    >
                        <option value="completion-desc">Sort by Progress: High-Low</option>
                        <option value="completion-asc">Sort by Progress: Low-High</option>
                        <option value="name-asc">Sort by Name: A-Z</option>
                        <option value="name-desc">Sort by Name: Z-A</option>
                    </select>
                    <button onClick={() => { setInitialClientIdForModal(undefined); setModalOpen(true); }} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                        Add New Project
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {displayedProjects.length > 0 ? displayedProjects.map(project => (
                    <ProjectCard key={project.id} project={project} onViewDetails={() => setSelectedProject(project)} />
                )) : (
                    <p className="text-gray-500 dark:text-gray-400 col-span-full text-center">No projects match your criteria.</p>
                )}
            </div>
            {isModalOpen && <AddProjectModal onClose={() => setModalOpen(false)} onSave={handleSaveProject} initialClientId={initialClientIdForModal} />}
        </div>
    );
};

export default ProjectsPage;
