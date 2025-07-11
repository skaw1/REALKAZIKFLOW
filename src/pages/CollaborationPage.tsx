
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { CollaborationSpace, User, Page, CalendarEvent, ProjectURL, MoodboardItem } from '../types';
import { Icon, TrashIcon, TeamIcon, PlusCircleIcon, CalendarIcon, ProjectsIcon, LinkIcon, MoodboardIcon, CloseIcon } from '../constants';
import { MoodboardPage } from './MoodboardPage';

const MemberManagement: React.FC<{ space: CollaborationSpace; onUpdate: (space: CollaborationSpace) => void; }> = ({ space, onUpdate }) => {
    const { users, setNotifications } = useAppContext();
    const [selectedUserId, setSelectedUserId] = useState('');

    const availableUsers = useMemo(() => {
        const currentMemberIds = new Set([...space.members, ...space.pendingMembers, space.ownerId]);
        return users.filter(u => !currentMemberIds.has(u.id));
    }, [users, space]);

    const handleAddMember = () => {
        if (!selectedUserId) return;
        const updatedSpace = { ...space, pendingMembers: [...space.pendingMembers, selectedUserId] };
        onUpdate(updatedSpace);

        const newNotification = {
            id: `notif-${Date.now()}`,
            message: `You've been invited to join the "${space.name}" collaboration space.`,
            timestamp: new Date().toLocaleDateString(),
            read: false,
        };
        // This is a simplified approach. In a real app, this would target the specific user.
        // For this demo, we'll add it to the general notification list.
        setNotifications(prev => [newNotification, ...prev]);

        setSelectedUserId('');
    };
    
    const handleRemoveMember = (userId: string, type: 'member' | 'pending') => {
        let updatedSpace: CollaborationSpace;
        if (type === 'member') {
            updatedSpace = { ...space, members: space.members.filter(id => id !== userId) };
        } else {
            updatedSpace = { ...space, pendingMembers: space.pendingMembers.filter(id => id !== userId) };
        }
        onUpdate(updatedSpace);
    };

    const getUser = (id: string) => users.find(u => u.id === id);

    return (
        <div className="bg-white dark:bg-dark-primary/50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-4">Manage Members</h4>
            <div className="flex gap-2 mb-6">
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
                    <option value="">Select a user to invite...</option>
                    {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <button onClick={handleAddMember} className="p-2 bg-brand-teal text-white rounded-md"><PlusCircleIcon /></button>
            </div>
            
            <div>
                <h5 className="font-medium mb-2">Active Members</h5>
                <ul className="space-y-2">
                    {[space.ownerId, ...space.members].map(id => {
                        const member = getUser(id);
                        if (!member) return null;
                        return (
                             <li key={id} className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-dark-primary/30">
                                <div className="flex items-center gap-2">
                                    <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
                                    <span>{member.name} {id === space.ownerId && <span className="text-xs text-brand-gold">(Owner)</span>}</span>
                                </div>
                                {id !== space.ownerId && <button onClick={() => handleRemoveMember(id, 'member')}><TrashIcon className="w-4 h-4 text-gray-400 hover:text-brand-coral" /></button>}
                            </li>
                        )
                    })}
                </ul>
            </div>

            {space.pendingMembers.length > 0 && (
                <div className="mt-4">
                    <h5 className="font-medium mb-2">Pending Invitations</h5>
                     <ul className="space-y-2">
                        {space.pendingMembers.map(id => {
                            const member = getUser(id);
                            if (!member) return null;
                            return (
                                <li key={id} className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-dark-primary/30 opacity-70">
                                    <div className="flex items-center gap-2">
                                        <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
                                        <span>{member.name}</span>
                                    </div>
                                    <button onClick={() => handleRemoveMember(id, 'pending')}><TrashIcon className="w-4 h-4 text-gray-400 hover:text-brand-coral" /></button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

const SpaceDetailView: React.FC<{ space: CollaborationSpace, onUpdate: (space: CollaborationSpace) => void, onBack: () => void }> = ({ space, onUpdate, onBack }) => {
    const { projects, setActivePage, setInitialSelectedProjectId } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');

    const viewProject = (projectId: string) => {
        setInitialSelectedProjectId(projectId);
        setActivePage(Page.Projects);
    };
    
    const tabs = [
        { id: 'overview', label: 'Overview', icon: <TeamIcon /> },
        { id: 'meetings', label: 'Meetings', icon: <CalendarIcon /> },
        { id: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
        { id: 'research', label: 'Research', icon: <LinkIcon /> },
        { id: 'moodboard', label: 'Moodboard', icon: <MoodboardIcon /> },
    ];
    
    const handleMoodboardUpdate = (updates: { items?: MoodboardItem[], trashedItems?: MoodboardItem[] }) => {
        const updatedSpace = {
            ...space,
            moodboardItems: updates.items !== undefined ? updates.items : space.moodboardItems,
            trashedMoodboardItems: updates.trashedItems !== undefined ? updates.trashedItems : space.trashedMoodboardItems,
        };
        onUpdate(updatedSpace);
    };

    return (
        <div>
            <button onClick={onBack} className="text-sm font-semibold text-brand-teal mb-4">&larr; Back to Spaces</button>
            <div className="bg-light-secondary dark:bg-dark-secondary p-6 rounded-2xl shadow-xl">
                 <h2 className="text-3xl font-bold">{space.name}</h2>
                 <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">{space.description}</p>
                 
                 <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                             <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-brand-teal text-brand-teal' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                 </div>
                 
                 <div className="mt-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <h4 className="font-semibold text-lg mb-4">Space Details</h4>
                                <div className="space-y-4">
                                    <p><strong className="font-medium">Owner:</strong> {useAppContext().users.find(u => u.id === space.ownerId)?.name || 'Unknown'}</p>
                                    <p><strong className="font-medium">Members:</strong> {space.members.length + 1}</p>
                                    <p><strong className="font-medium">Linked Projects:</strong> {space.linkedProjectIds.length}</p>
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <MemberManagement space={space} onUpdate={onUpdate} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'meetings' && (
                        <div>
                            <h4 className="font-semibold text-lg mb-4">Scheduled Meetings</h4>
                            <ul className="space-y-2">
                                {space.meetings.map(m => (
                                    <li key={m.id} className="p-3 rounded-md bg-white dark:bg-dark-primary/50">
                                        <p className="font-semibold">{m.title}</p>
                                        <p className="text-sm text-gray-500">{m.start.toLocaleString()}</p>
                                    </li>
                                ))}
                                {space.meetings.length === 0 && <p className="text-gray-500">No meetings scheduled.</p>}
                            </ul>
                        </div>
                    )}
                    {activeTab === 'projects' && (
                        <div>
                            <h4 className="font-semibold text-lg mb-4">Linked Projects</h4>
                            <ul className="space-y-2">
                                {space.linkedProjectIds.map(id => {
                                    const project = projects.find(p => p.id === id);
                                    if (!project) return null;
                                    return (
                                        <li key={id} onClick={() => viewProject(id)} className="p-3 rounded-md bg-white dark:bg-dark-primary/50 hover:bg-gray-100 dark:hover:bg-dark-primary/80 cursor-pointer">
                                            <p className="font-semibold text-brand-teal">{project.name}</p>
                                            <p className="text-sm text-gray-500">{project.description}</p>
                                        </li>
                                    )
                                })}
                                {space.linkedProjectIds.length === 0 && <p className="text-gray-500">No projects linked to this space.</p>}
                            </ul>
                        </div>
                    )}
                    {activeTab === 'research' && (
                        <div>
                            <h4 className="font-semibold text-lg mb-4">Research & Links</h4>
                             <ul className="space-y-2">
                                {space.researchLinks.map(link => (
                                    <li key={link.id} className="p-3 rounded-md bg-white dark:bg-dark-primary/50">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-teal hover:underline">{link.label}</a>
                                    </li>
                                ))}
                                {space.researchLinks.length === 0 && <p className="text-gray-500">No research links added.</p>}
                            </ul>
                        </div>
                    )}
                    {activeTab === 'moodboard' && (
                        <MoodboardPage
                            title=""
                            items={space.moodboardItems}
                            trashedItems={space.trashedMoodboardItems}
                            onUpdateMoodboard={handleMoodboardUpdate}
                            isEditable={true}
                        />
                    )}
                 </div>
            </div>
        </div>
    );
};


const AddSpaceModal: React.FC<{ onClose: () => void; onSave: (space: Omit<CollaborationSpace, 'id' | 'ownerId' | 'members' | 'pendingMembers' | 'meetings' | 'researchLinks' | 'moodboardItems' | 'trashedMoodboardItems' | 'linkedProjectIds'>) => void; }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ name, description });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6">Create New Collaboration Space</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Space Name" required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-brand-teal text-white font-semibold">Create Space</button>
                    </div>
                 </form>
            </div>
        </div>
    );
};


const CollaborationPage: React.FC = () => {
    const { user, collaborationSpaces, setCollaborationSpaces, users } = useAppContext();
    const [selectedSpace, setSelectedSpace] = useState<CollaborationSpace | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveSpace = (data: Omit<CollaborationSpace, 'id' | 'ownerId' | 'members' | 'pendingMembers' | 'meetings' | 'researchLinks' | 'moodboardItems' | 'trashedMoodboardItems' | 'linkedProjectIds'>) => {
        if (!user) return;
        const newSpace: CollaborationSpace = {
            id: `cs${Date.now()}`,
            ownerId: user.id,
            members: [],
            pendingMembers: [],
            meetings: [],
            researchLinks: [],
            moodboardItems: [],
            trashedMoodboardItems: [],
            linkedProjectIds: [],
            ...data,
        };
        setCollaborationSpaces(prev => [...prev, newSpace]);
    };

    const handleUpdateSpace = useCallback((updatedSpace: CollaborationSpace) => {
        setCollaborationSpaces(prev => prev.map(s => s.id === updatedSpace.id ? updatedSpace : s));
        setSelectedSpace(updatedSpace);
    }, [setCollaborationSpaces]);

    if (selectedSpace) {
        return <SpaceDetailView space={selectedSpace} onUpdate={handleUpdateSpace} onBack={() => setSelectedSpace(null)} />;
    }

    return (
         <div>
            {isModalOpen && <AddSpaceModal onClose={() => setModalOpen(false)} onSave={handleSaveSpace} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Collaboration Spaces</h2>
                <button onClick={() => setModalOpen(true)} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90">
                    <PlusCircleIcon className="w-5 h-5 inline-block mr-2 -mt-1"/>
                    New Space
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborationSpaces.map(space => (
                    <div key={space.id} onClick={() => setSelectedSpace(space)} className="bg-light-secondary dark:bg-dark-secondary p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
                        <h3 className="font-bold text-xl text-brand-teal">{space.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm h-10 overflow-hidden">{space.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                             <div className="flex -space-x-2">
                                {[space.ownerId, ...space.members].slice(0, 5).map(id => {
                                    const member = users.find(u => u.id === id);
                                    if (!member) return null;
                                    return <img key={id} src={member.avatarUrl} title={member.name} alt={member.name} className="w-8 h-8 rounded-full border-2 border-light-secondary dark:border-dark-secondary" />
                                })}
                                {(space.members.length + 1) > 5 && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold border-2 border-light-secondary dark:border-dark-secondary">+{space.members.length - 4}</div>}
                            </div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{(space.members.length + 1)} Members</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CollaborationPage;
