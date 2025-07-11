import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Client, ClientStatus, ProjectURL, Page, UserCategory } from '../types';
import { useAppContext } from '../context/AppContext';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, TrashIcon, LinkIcon, ClipboardIcon, PlusCircleIcon, ClientsIcon, CalendarIcon, ProjectsIcon } from '../constants';
import { db } from '../services/firebase';
import { doc, addDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';

const statusInfo: Record<ClientStatus, { color: string; bg: string; border: string }> = {
    'Pending': { color: 'text-yellow-800 dark:text-yellow-200', bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-500' },
    'Confirmed': { color: 'text-blue-800 dark:text-blue-200', bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-500' },
    'Completed Project': { color: 'text-green-800 dark:text-green-200', bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-500' },
    'Canceled': { color: 'text-red-800 dark:text-red-200', bg: 'bg-red-100 dark:bg-red-900/50', border: 'border-red-500' },
    'Not Interested': { color: 'text-gray-800 dark:text-gray-200', bg: 'bg-gray-200 dark:bg-gray-600', border: 'border-gray-500' },
};
const clientStatuses: ClientStatus[] = ['Pending', 'Confirmed', 'Completed Project', 'Canceled', 'Not Interested'];

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
}> = ({ title, value, icon, onClick, isActive }) => (
    <div onClick={onClick} className={`bg-light-secondary dark:bg-dark-secondary p-4 rounded-xl shadow-md flex items-center gap-4 border-l-4 border-brand-teal cursor-pointer transition-all hover:shadow-lg hover:-translate-y-px ${isActive ? 'ring-2 ring-brand-teal' : ''}`}>
        <div className="p-3 bg-brand-teal/10 rounded-full text-brand-teal">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

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

const EditableNotes: React.FC<{ notes: string; onSave: (newNotes: string) => void; }> = ({ notes, onSave }) => {
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

    if (isEditing) {
        return (
            <textarea ref={textareaRef} value={currentNotes} onChange={handleTextareaChange} onBlur={handleSave}
                placeholder="Add notes for this client..."
                className="w-full p-4 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-brand-teal ring-2 ring-brand-teal/50 rounded-lg shadow-inner resize-none overflow-hidden min-h-[150px] leading-relaxed"
            />
        );
    }

    return (
        <div onClick={() => setIsEditing(true)} className="w-full p-4 rounded-lg bg-white dark:bg-dark-primary/50 min-h-[150px] cursor-text hover:bg-gray-50 dark:hover:bg-dark-primary/70 transition-colors">
            {notes ? <NoteRenderer text={notes} /> : <p className="text-gray-400">Click to add notes...</p>}
        </div>
    );
};

const ClientDetailPage: React.FC<{
    client: Client;
    onUpdateClient: (clientId: string, updatedClient: Partial<Client>) => void;
    onBack: () => void;
    onEdit: (client: Client) => void;
}> = ({ client, onUpdateClient, onBack, onEdit }) => {
    const [newUrl, setNewUrl] = useState('');
    const [newUrlLabel, setNewUrlLabel] = useState('');
    const { projects, setActivePage, setInitialSelectedProjectId, setTriggerProjectCreationForClientId } = useAppContext();

    const clientProjects = useMemo(() => projects.filter(p => p.clientId === client.id), [projects, client.id]);
    const unassignedProjects = useMemo(() => projects.filter(p => !p.clientId), [projects]);

    const handleUpdate = (updates: Partial<Client>) => {
        onUpdateClient(client.id, updates);
    };
    
    const handleAddUrl = () => {
        if (!newUrl.trim() || !newUrlLabel.trim()) return;
        const newProjectUrl: ProjectURL = { id: `u${Date.now()}`, url: newUrl, label: newUrlLabel };
        handleUpdate({ urls: [...client.urls, newProjectUrl] });
        setNewUrl('');
        setNewUrlLabel('');
    };
    
    const handleRemoveUrl = (urlId: string) => {
        handleUpdate({ urls: client.urls.filter(u => u.id !== urlId) });
    };

    const handleCreateProjectForClient = () => {
        setTriggerProjectCreationForClientId(client.id);
        setActivePage(Page.Projects);
    };

    const handleLinkProject = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const projectId = e.target.value;
        if (!projectId) return;
        const projectDocRef = doc(db, 'projects', projectId);
        await updateDoc(projectDocRef, { clientId: client.id });
        e.target.value = ''; // Reset select
    };

    const viewProject = (projectId: string) => {
        setInitialSelectedProjectId(projectId);
        setActivePage(Page.Projects);
    }

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-teal dark:hover:text-brand-teal transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to All Clients
            </button>
            <div className="bg-light-secondary dark:bg-dark-secondary p-4 sm:p-8 rounded-2xl shadow-xl">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{client.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Contact: {client.contactPerson}</p>
                        </div>
                        <button onClick={() => onEdit(client)} className="text-sm font-semibold text-brand-teal hover:underline">Edit Client</button>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-sm">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo[client.status].bg} ${statusInfo[client.status].color}`}>
                            {client.status}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Projects Section */}
                         <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ProjectsIcon />
                                <h3 className="text-2xl font-semibold">Associated Projects</h3>
                            </div>
                            <div className="p-4 rounded-lg bg-white dark:bg-dark-primary/50 space-y-2">
                               {clientProjects.length > 0 ? (
                                   clientProjects.map(p => (
                                       <div key={p.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-primary/80">
                                            <button onClick={() => viewProject(p.id)} className="font-semibold text-brand-teal hover:underline">{p.name}</button>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">({p.status})</span>
                                       </div>
                                   ))
                               ) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No projects linked to this client.</p>}
                                <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row gap-2">
                                    <button onClick={handleCreateProjectForClient} className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-md bg-brand-teal text-white hover:bg-opacity-90">Create New Project</button>
                                    <select onChange={handleLinkProject} className="flex-1 px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md" disabled={unassignedProjects.length === 0}>
                                        <option value="">Link Existing Project...</option>
                                        {unassignedProjects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* Links Section */}
                         <div>
                            <div className="flex items-center gap-2 mb-4">
                                <LinkIcon className="w-6 h-6 text-blue-500" />
                                <h3 className="text-2xl font-semibold">Relevant Links</h3>
                            </div>
                            <ul className="space-y-2 mb-4">
                                {client.urls.map(url => (
                                    <li key={url.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-primary/50 group">
                                        <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline truncate">{url.label}</a>
                                        <button onClick={() => handleRemoveUrl(url.id)} className="text-gray-400 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                                    </li>
                                ))}
                                {client.urls.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-2">No links added.</p>}
                            </ul>
                            <div className="flex gap-2">
                                <input type="text" value={newUrlLabel} onChange={e => setNewUrlLabel(e.target.value)} placeholder="Label" className="w-1/3 px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <button onClick={handleAddUrl} className="p-2 bg-brand-teal text-white rounded-md hover:bg-opacity-90 transition-colors"><PlusCircleIcon /></button>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ClipboardIcon className="w-6 h-6 text-brand-gold" />
                                <h3 className="text-2xl font-semibold">Notes</h3>
                            </div>
                            <EditableNotes notes={client.notes} onSave={(newNotes) => handleUpdate({ notes: newNotes })} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientModal: React.FC<{ onClose: () => void; onSave: (client: Partial<Client>) => void; clientToEdit: Client | null; }> = ({ onClose, onSave, clientToEdit }) => {
    const [formData, setFormData] = useState<Partial<Client>>({ status: 'Pending', ...clientToEdit });

    useEffect(() => {
        setFormData({ status: 'Pending', ...clientToEdit });
    }, [clientToEdit]);

    const handleChange = (field: keyof Omit<Client, 'createdAt'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.contactPerson || !formData.email) return;
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6">{clientToEdit ? 'Edit Client' : 'Add New Client'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" id="clientName" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="Company Name" required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <input type="text" id="contactPerson" value={formData.contactPerson || ''} onChange={e => handleChange('contactPerson', e.target.value)} placeholder="Contact Person" required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <input type="email" id="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="Email" required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <input type="tel" id="phone" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="Phone" className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select id="status" value={formData.status} onChange={e => handleChange('status', e.target.value as ClientStatus)} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
                           {clientStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-brand-teal text-white font-semibold">{clientToEdit ? 'Save Changes' : 'Add Client'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="text-gray-600 dark:text-gray-400 mb-6">{children}</div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const ClientCard: React.FC<{ client: Client; onRemove: (client: Client) => void; onEdit: (client: Client) => void; onView: (client: Client) => void; }> = ({ client, onRemove, onEdit, onView }) => (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-md p-4 flex flex-col space-y-3 cursor-pointer" onClick={() => onView(client)}>
        <div>
            <div className="flex justify-between items-start">
                 <p className="font-bold text-gray-900 dark:text-white truncate">{client.name}</p>
                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo[client.status].bg} ${statusInfo[client.status].color}`}>{client.status}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{client.contactPerson}</p>
        </div>
        <div className="pt-2 mt-auto border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(client); }} className="text-xs font-medium text-brand-teal hover:underline">Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(client); }} className="text-xs font-medium text-brand-coral hover:underline">Remove</button>
        </div>
    </div>
);

type SortKey = 'name' | 'contactPerson' | 'email' | 'status';
type AnalyticsFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

const ClientsPage: React.FC = () => {
    const { user, clients, initialSelectedClientId, setInitialSelectedClientId } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc'});
    const [analyticsFilter, setAnalyticsFilter] = useState<AnalyticsFilter | null>(null);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);

    useEffect(() => {
        if (initialSelectedClientId) {
            const client = clients.find(c => c.id === initialSelectedClientId);
            if (client) {
                setSelectedClient(client);
            }
            setInitialSelectedClientId(null);
        }
    }, [initialSelectedClientId, clients, setInitialSelectedClientId]);


    const clientStats = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const dayOfWeek = now.getDay(); 
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
        const isRestrictedView = user?.category ? restrictedCategories.includes(user.category) : false;
        const allClientData = isRestrictedView ? clients.filter(c => c.ownerId === user?.id) : clients;

        return {
            daily: allClientData.filter(c => c.createdAt >= startOfDay).length,
            weekly: allClientData.filter(c => c.createdAt >= startOfWeek).length,
            monthly: allClientData.filter(c => c.createdAt >= startOfMonth).length,
            yearly: allClientData.filter(c => c.createdAt >= startOfYear).length,
        };
    }, [clients, user]);

    const handleSaveClient = async (clientData: Partial<Client>) => {
        if (!user) return;
        if (clientData.id) { // Editing existing client
            const clientDocRef = doc(db, 'clients', clientData.id);
            await updateDoc(clientDocRef, clientData);
        } else { // Adding new client
            const newClient: Omit<Client, 'id'> = {
                ownerId: user.id,
                urls: [],
                notes: '',
                createdAt: new Date(),
                ...clientData,
            } as Omit<Client, 'id'>;
            await addDoc(collection(db, 'clients'), newClient);
        }
    };

    const handleUpdateClient = useCallback(async (clientId: string, updatedClient: Partial<Client>) => {
        const clientDocRef = doc(db, 'clients', clientId);
        await updateDoc(clientDocRef, updatedClient);
        if(selectedClient?.id === clientId) {
            setSelectedClient(prev => prev ? {...prev, ...updatedClient} as Client : null);
        }
    }, [selectedClient]);

    const handleConfirmRemove = async () => {
        if (deletingClient) {
            await deleteDoc(doc(db, "clients", deletingClient.id));
            setDeletingClient(null);
        }
    };
    
    const handleOpenModal = (client: Client | null = null) => {
        setClientToEdit(client);
        setModalOpen(true);
    };

    const displayedClients = useMemo(() => {
        const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
        const isRestrictedView = user?.category ? restrictedCategories.includes(user.category) : false;
        
        let filtered = isRestrictedView ? clients.filter(c => c.ownerId === user?.id) : [...clients];

        if (analyticsFilter) {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const dayOfWeek = now.getDay(); // Sunday - 0, ...
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            
            switch (analyticsFilter) {
                case 'daily':
                    filtered = filtered.filter(c => c.createdAt >= startOfDay);
                    break;
                case 'weekly':
                    filtered = filtered.filter(c => c.createdAt >= startOfWeek);
                    break;
                case 'monthly':
                    filtered = filtered.filter(c => c.createdAt >= startOfMonth);
                    break;
                case 'yearly':
                    filtered = filtered.filter(c => c.createdAt >= startOfYear);
                    break;
            }
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [clients, user, searchQuery, statusFilter, sortConfig, analyticsFilter]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig?.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />;
    };
    
    const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-3">
            <button onClick={() => requestSort(sortKey)} className="flex items-center uppercase font-bold tracking-wider">{children}{getSortIcon(sortKey)}</button>
        </th>
    );

    if (selectedClient) {
        return <ClientDetailPage client={selectedClient} onBack={() => setSelectedClient(null)} onUpdateClient={handleUpdateClient} onEdit={handleOpenModal} />
    }

    const filterOptions: { key: 'all' | ClientStatus; label: string }[] = [{key: 'all', label: 'All'}, ...clientStatuses.map(s => ({key: s, label: s}))];

    const statItems: {key: AnalyticsFilter, title: string, value: string | number, icon: React.ReactNode}[] = [
        { key: 'daily', title: 'New Today', value: clientStats.daily, icon: <CalendarIcon /> },
        { key: 'weekly', title: 'New This Week', value: clientStats.weekly, icon: <CalendarIcon /> },
        { key: 'monthly', title: 'New This Month', value: clientStats.monthly, icon: <CalendarIcon /> },
        { key: 'yearly', title: 'Total This Year', value: clientStats.yearly, icon: <ClientsIcon /> }
    ];

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Client Database</h2>
                <button onClick={() => handleOpenModal()} className="md:hidden bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md w-full">Add New Client</button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statItems.map(stat => (
                    <StatCard 
                        key={stat.key}
                        title={stat.title} 
                        value={stat.value} 
                        icon={stat.icon} 
                        isActive={analyticsFilter === stat.key}
                        onClick={() => setAnalyticsFilter(prev => prev === stat.key ? null : stat.key)}
                    />
                ))}
            </div>
            
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 p-4 bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-md">
                <div className="flex-grow">
                     <input type="text" placeholder="Search by name or contact..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg"/>
                </div>
                 <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
                    <span className="text-sm font-semibold flex-shrink-0">Status:</span>
                     {filterOptions.map(option => (
                        <button key={option.key} onClick={() => setStatusFilter(option.key)}
                            className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${ statusFilter === option.key ? 'bg-brand-teal text-white' : 'bg-gray-200 dark:bg-dark-primary text-gray-500 hover:bg-gray-300/50'}`}>
                            {option.label}
                        </button>
                    ))}
                 </div>
                 <button onClick={() => handleOpenModal()} className="hidden md:block bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors flex-shrink-0">Add Client</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:hidden">
                {displayedClients.length > 0 ? displayedClients.map(client => (
                    <ClientCard key={client.id} client={client} onRemove={setDeletingClient} onEdit={handleOpenModal} onView={setSelectedClient} />
                )) : <p className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">No clients match.</p>}
            </div>

            <div className="hidden md:block bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <SortableHeader sortKey="name">Company Name</SortableHeader>
                            <SortableHeader sortKey="contactPerson">Contact</SortableHeader>
                            <SortableHeader sortKey="status">Status</SortableHeader>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedClients.length > 0 ? displayedClients.map(client => (
                            <tr key={client.id} onClick={() => setSelectedClient(client)} className="bg-light-secondary dark:bg-dark-secondary border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20 cursor-pointer">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{client.name}</td>
                                <td className="px-6 py-4">{client.contactPerson}<br/><span className="text-xs text-gray-400">{client.email}</span></td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo[client.status].bg} ${statusInfo[client.status].color}`}>{client.status}</span></td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="font-medium text-brand-teal hover:underline">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeletingClient(client); }} className="font-medium text-brand-coral hover:underline">Remove</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-8">No clients match your criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ClientModal onClose={() => setModalOpen(false)} onSave={handleSaveClient} clientToEdit={clientToEdit} />}
            <ConfirmModal
              isOpen={!!deletingClient}
              onClose={() => setDeletingClient(null)}
              onConfirm={handleConfirmRemove}
              title="Confirm Deletion"
            >
              Are you sure you want to remove client <span className="font-bold">{deletingClient?.name}</span>? This action cannot be undone.
            </ConfirmModal>
        </div>
    );
};

export default ClientsPage;