


import React, { useState, useEffect } from 'react';
import { CalendarEvent, ContentCalendarEntry, ContentPlatform, ContentStatus, PlatformPublishInfo, UserCategory } from '../types';
import { useAppContext } from '../context/AppContext';
import { CloseIcon, TrashIcon, PlusCircleIcon, NewspaperIcon, XIcon, InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon } from '../constants';

type CalendarView = 'master' | 'content';

const eventColorMap: Record<CalendarEvent['type'], string> = {
    task: 'bg-blue-500',
    reminder: 'bg-brand-gold',
    deadline: 'bg-brand-coral',
    meeting: 'bg-purple-500',
};
const eventTypes: CalendarEvent['type'][] = ['task', 'reminder', 'deadline', 'meeting'];

const statusColorMap: Record<ContentStatus, string> = {
    'Idea': 'border-yellow-500',
    'Draft': 'border-gray-400',
    'In Progress': 'border-blue-500',
    'Review': 'border-orange-500',
    'Scheduled': 'border-purple-500',
    'Published': 'border-green-500',
};

const PlatformIcon: React.FC<{platform: ContentPlatform, className?: string}> = ({platform, className="w-4 h-4"}) => {
    switch (platform) {
        case 'Blog': return <NewspaperIcon className={className} />;
        case 'X': return <XIcon className={className} />;
        case 'Instagram': return <InstagramIcon className={className} />;
        case 'TikTok': return <TikTokIcon className={className} />;
        case 'Facebook': return <FacebookIcon className={className} />;
        case 'LinkedIn': return <LinkedInIcon className={className} />;
        default: return null;
    }
}

const formatTimeToHHMM = (date: Date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const ExpandedDayView: React.FC<{
    date: Date;
    events: CalendarEvent[];
    onClose: () => void;
    onAddEvent: (event: Omit<CalendarEvent, 'id' | 'end' | 'ownerId'>) => void;
    onUpdateEvent: (event: CalendarEvent) => void;
    onDeleteEvent: (eventId: string) => void;
}> = ({ date, events, onClose, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('09:00');
    const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('task');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingTime, setEditingTime] = useState('');

    const handleSubmitNew = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;
        const [hours, minutes] = newEventTime.split(':').map(Number);
        const newStartDate = new Date(date);
        newStartDate.setHours(hours, minutes, 0, 0);

        onAddEvent({ title: newEventTitle, type: newEventType, start: newStartDate });
        setNewEventTitle('');
        setNewEventTime('09:00');
        setNewEventType('task');
    };

    const handleStartEdit = (event: CalendarEvent) => {
        setEditingEventId(event.id);
        setEditingTitle(event.title);
        setEditingTime(formatTimeToHHMM(event.start));
    };

    const handleCancelEdit = () => {
        setEditingEventId(null);
        setEditingTitle('');
        setEditingTime('');
    };

    const handleSaveEdit = (event: CalendarEvent) => {
        if (!editingTitle.trim()) {
            onDeleteEvent(event.id);
        } else {
            const [hours, minutes] = editingTime.split(':').map(Number);
            const newStartDate = new Date(event.start);
            newStartDate.setHours(hours, minutes, 0, 0);
            onUpdateEvent({ ...event, title: editingTitle, start: newStartDate });
        }
        handleCancelEdit();
    };

    const handleKeyDown = (e: React.KeyboardEvent, event: CalendarEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit(event);
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    return (
        <div className="bg-white dark:bg-dark-secondary p-4 rounded-xl shadow-lg h-full flex flex-col animate-fade-in">
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <CloseIcon />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Events</h4>
                        <ul className="space-y-2">
                            {events.sort((a,b) => a.start.getTime() - b.start.getTime()).map(event => (
                                <li key={event.id} className="p-2 rounded-md bg-gray-50 dark:bg-dark-primary/50 group">
                                    {editingEventId === event.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={editingTime}
                                                onChange={(e) => setEditingTime(e.target.value)}
                                                className="bg-transparent text-sm focus:outline-none border-b border-brand-teal w-20"
                                            />
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onBlur={() => handleSaveEdit(event)}
                                                onKeyDown={(e) => handleKeyDown(e, event)}
                                                className="flex-grow bg-transparent text-sm focus:outline-none border-b border-brand-teal"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={() => handleStartEdit(event)}>
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${eventColorMap[event.type]}`}></span>
                                                <span className="font-semibold text-sm w-16">{event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span className="text-sm">{event.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">{event.type}</span>
                                                <button onClick={() => onDeleteEvent(event.id)} className="text-gray-400 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                            {events.length === 0 && <p className="text-sm text-center py-4 text-gray-500 dark:text-gray-400">No events scheduled for this day.</p>}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Add New Detail</h4>
                        <form onSubmit={handleSubmitNew} className="space-y-3">
                            <input
                                type="text"
                                value={newEventTitle}
                                onChange={e => setNewEventTitle(e.target.value)}
                                placeholder="New event title..."
                                required
                                className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            />
                            <input
                                type="time"
                                value={newEventTime}
                                onChange={e => setNewEventTime(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            />
                             <select
                                value={newEventType}
                                onChange={e => setNewEventType(e.target.value as CalendarEvent['type'])}
                                className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            >
                               {eventTypes.map(typeKey => (
                                   <option key={typeKey} value={typeKey} className="capitalize">{typeKey}</option>
                               ))}
                            </select>
                            <button type="submit" className="w-full px-4 py-2 rounded-md bg-brand-teal text-white font-semibold hover:bg-opacity-90 transition-colors shadow-md">Add Event</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExpandedContentDayView: React.FC<{
    date: Date;
    entries: ContentCalendarEntry[];
    onClose: () => void;
    onAddEntry: (date: Date) => void;
    onEditEntry: (entry: ContentCalendarEntry) => void;
}> = ({ date, entries, onClose, onAddEntry, onEditEntry }) => {
    return (
        <div className="bg-white dark:bg-dark-secondary p-4 rounded-xl shadow-lg h-full flex flex-col animate-fade-in">
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    Content for {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <CloseIcon />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3 mb-4">
                {entries.sort((a,b) => {
                    const timeA = a.executionTime || a.platformInfo[0]?.publishTime || '00:00';
                    const timeB = b.executionTime || b.platformInfo[0]?.publishTime || '00:00';
                    return timeA.localeCompare(timeB);
                }).map(entry => (
                    <div key={entry.id} onClick={() => onEditEntry(entry)} className={`p-3 rounded-md border-l-4 hover:bg-gray-100 dark:hover:bg-dark-primary/70 cursor-pointer transition-colors ${statusColorMap[entry.status]}`}>
                        <div className="flex justify-between items-start">
                            <p className="font-bold">{entry.title}</p>
                            <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">{entry.status}</span>
                        </div>
                        {entry.executionTime && (
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Task Time: {entry.executionTime}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {entry.platformInfo.map(pInfo => (
                                <div key={pInfo.id} className="flex items-center gap-1.5 text-sm">
                                    <PlatformIcon platform={pInfo.platform} className="w-4 h-4" />
                                    <span>{pInfo.publishTime}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {entries.length === 0 && <p className="text-sm text-center py-4 text-gray-500 dark:text-gray-400">No content scheduled for this day.</p>}
            </div>

            <button 
                onClick={() => onAddEntry(date)} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-brand-teal text-white font-semibold hover:bg-opacity-90 transition-colors shadow-md mt-auto">
                <PlusCircleIcon className="w-5 h-5"/>
                Add New Post
            </button>
        </div>
    );
};

const ContentEntryModal: React.FC<{
    entry: Partial<ContentCalendarEntry> | null;
    date: Date;
    onClose: () => void;
    onSave: (entry: ContentCalendarEntry) => void;
    onDelete: (id: string) => void;
}> = ({ entry, date, onClose, onSave, onDelete }) => {
    const { user } = useAppContext();
    const [formData, setFormData] = useState<Partial<ContentCalendarEntry>>(
        entry || { publishDate: date, status: 'Idea', platformInfo: [] }
    );

    useEffect(() => {
        setFormData(entry || { publishDate: date, status: 'Idea', platformInfo: [], executionTime: '' });
    }, [entry, date]);

    const handleChange = (field: keyof Omit<ContentCalendarEntry, 'platformInfo'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePlatformInfoChange = (id: string, field: 'platform' | 'publishTime', value: string) => {
        setFormData(prev => ({
            ...prev,
            platformInfo: (prev.platformInfo || []).map(pInfo => 
                pInfo.id === id ? { ...pInfo, [field]: value } : pInfo
            )
        }));
    };

    const addPlatformInfo = () => {
        const newPlatformInfo: PlatformPublishInfo = {
            id: `pi${Date.now()}`,
            platform: 'Instagram',
            publishTime: '12:00'
        };
        setFormData(prev => ({ ...prev, platformInfo: [...(prev.platformInfo || []), newPlatformInfo]}));
    };

    const removePlatformInfo = (id: string) => {
        setFormData(prev => ({ ...prev, platformInfo: (prev.platformInfo || []).filter(pInfo => pInfo.id !== id)}));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !user) return;
        const finalEntry: ContentCalendarEntry = {
            id: formData.id || `cc${Date.now()}`,
            ownerId: formData.ownerId || user.id,
            projectId: formData.projectId || null,
            notes: formData.notes || '',
            script: formData.script || '',
            ...formData,
            title: formData.title!,
            publishDate: formData.publishDate!,
            platformInfo: formData.platformInfo || [],
            status: formData.status!,
            executionTime: formData.executionTime || undefined,
        };
        onSave(finalEntry);
    };

    const platforms: ContentPlatform[] = ['Blog', 'X', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn'];
    const statuses: ContentStatus[] = ['Idea', 'Draft', 'In Progress', 'Review', 'Scheduled', 'Published'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{entry?.id ? 'Edit' : 'Add'} Content Post</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                     <input type="text" placeholder="Content Title" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                             <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal">
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Execution Time (Optional)</label>
                             <input type="time" value={formData.executionTime || ''} onChange={e => handleChange('executionTime', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publishing Times</label>
                        <div className="space-y-2">
                           {(formData.platformInfo || []).map(pInfo => (
                               <div key={pInfo.id} className="flex items-center gap-2">
                                   <select
                                     value={pInfo.platform}
                                     onChange={(e) => handlePlatformInfoChange(pInfo.id, 'platform', e.target.value)}
                                     className="w-1/3 px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"
                                   >
                                       {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                                   </select>
                                   <input
                                     type="time"
                                     value={pInfo.publishTime}
                                     onChange={(e) => handlePlatformInfoChange(pInfo.id, 'publishTime', e.target.value)}
                                     className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"
                                     required
                                   />
                                   <button type="button" onClick={() => removePlatformInfo(pInfo.id)} className="p-2 text-gray-400 hover:text-brand-coral">
                                     <TrashIcon />
                                   </button>
                               </div>
                           ))}
                           <button type="button" onClick={addPlatformInfo} className="text-sm font-semibold text-brand-teal hover:underline mt-2">+ Add Publishing Time</button>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Script / Copy</label>
                        <textarea rows={6} placeholder="Write your content here..." value={formData.script || ''} onChange={e => handleChange('script', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                        <textarea rows={2} placeholder="Internal notes, links, etc." value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                     </div>
                </form>
                 <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        {entry?.id && (
                            <button onClick={() => onDelete(entry.id!)} className="px-4 py-2 rounded-md text-brand-coral hover:bg-brand-coral/10 font-semibold transition-colors flex items-center gap-2">
                                <TrashIcon /> Delete
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="px-6 py-2 rounded-md bg-brand-teal text-white font-semibold hover:bg-opacity-90 transition-colors shadow-md">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const MasterCalendarPage: React.FC = () => {
    const { user, events, setEvents, contentEntries, setContentEntries } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 1)); // July 2024
    const [calendarView, setCalendarView] = useState<CalendarView>('master');
    
    // State for Master Calendar
    const [expandedDate, setExpandedDate] = useState<Date | null>(null);

    // State for Content Calendar
    const [expandedContentDate, setExpandedContentDate] = useState<Date | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<Partial<ContentCalendarEntry> | null>(null);
    const [modalDate, setModalDate] = useState<Date | null>(null);


    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: Date[] = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekDaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


    const changeMonth = (offset: number) => {
        setExpandedDate(null);
        setExpandedContentDate(null);
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const changeView = (view: CalendarView) => {
        setCalendarView(view);
        setExpandedDate(null);
        setExpandedContentDate(null);
    };

    // --- Master Calendar Handlers ---
    const handleDayClick = (day: Date) => {
        if (expandedDate && expandedDate.toDateString() === day.toDateString()) {
            setExpandedDate(null);
        } else {
            setExpandedDate(day);
            setExpandedContentDate(null); // Close content view if open
        }
    };

    const handleAddEvent = (newEventData: Omit<CalendarEvent, 'end' | 'ownerId' | 'id'>) => {
        if (!user) return;
        const newEvent: CalendarEvent = {
            id: `ev${Date.now()}`,
            ...newEventData,
            end: newEventData.start,
            ownerId: user.id,
        };
        setEvents(prev => [...prev, newEvent].sort((a,b) => a.start.getTime() - b.start.getTime()));
    };

    const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    };

    const handleDeleteEvent = (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
    };
    
    // --- Content Calendar Handlers ---
    const handleContentDayClick = (day: Date) => {
        if (expandedContentDate && expandedContentDate.toDateString() === day.toDateString()) {
            setExpandedContentDate(null);
        } else {
            setExpandedContentDate(day);
            setExpandedDate(null); // Close master view if open
        }
    };

    const handleOpenContentModal = (date: Date, entry: Partial<ContentCalendarEntry> | null = null) => {
        setModalDate(date);
        setSelectedEntry(entry);
    }
    
    const handleSaveContentEntry = (entry: ContentCalendarEntry) => {
        setContentEntries(prev => {
            const exists = prev.some(e => e.id === entry.id);
            if (exists) {
                return prev.map(e => e.id === entry.id ? entry : e);
            }
            return [...prev, entry].sort((a,b) => a.publishDate.getTime() - b.publishDate.getTime());
        });
        setModalDate(null);
        setSelectedEntry(null);
    }

    const handleDeleteContentEntry = (id: string) => {
        if (window.confirm("Are you sure you want to delete this content post?")) {
            setContentEntries(prev => prev.filter(e => e.id !== id));
            setModalDate(null);
            setSelectedEntry(null);
        }
    }

    // --- Data Filtering ---
    const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
    const isRestrictedView = user?.category ? restrictedCategories.includes(user.category) : false;
    const userEvents = isRestrictedView ? events.filter(e => e.ownerId === user?.id) : events;
    const userContentEntries = isRestrictedView ? contentEntries.filter(e => e.ownerId === user?.id) : contentEntries;

    const weeks: Date[][] = [];
    const daysCopy = [...days];
    while(daysCopy.length) {
        weeks.push(daysCopy.splice(0, 7));
    }


    return (
        <div>
             <style>{`
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
            `}</style>
            {modalDate && (
                <ContentEntryModal 
                    entry={selectedEntry}
                    date={modalDate}
                    onClose={() => setModalDate(null)}
                    onSave={handleSaveContentEntry}
                    onDelete={handleDeleteContentEntry}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-shrink-0 bg-gray-200 dark:bg-dark-primary p-1 rounded-lg">
                    {(['master', 'content'] as CalendarView[]).map(view => (
                        <button
                            key={view}
                            onClick={() => changeView(view)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors capitalize ${
                                calendarView === view
                                    ? 'bg-white dark:bg-dark-secondary text-brand-teal shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-300/50 dark:hover:bg-dark-secondary/50'
                            }`}
                        >
                            {view} Calendar
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-secondary">&lt;</button>
                    <span className="text-lg sm:text-xl font-semibold w-40 sm:w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-secondary">&gt;</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`md:col-span-${(expandedDate || expandedContentDate) ? '2' : '3'} transition-all duration-300 ease-in-out`}>
                    <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-lg p-2 sm:p-4">
                        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            {weekDaysShort.map((d, i) => (
                                <div key={d}>
                                    <span className="hidden sm:inline">{weekDaysFull[i]}</span>
                                    <span className="sm:hidden">{d}</span>
                                </div>
                            ))}
                        </div>
                        
                        {calendarView === 'master' && (
                            <div className="grid grid-cols-1 gap-1">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-cols-7 gap-1 auto-rows-fr">
                                        {week.map((d, i) => {
                                            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                                            const isToday = new Date().toDateString() === d.toDateString();
                                            const eventsOnDay = userEvents.filter(e => e.start.toDateString() === d.toDateString());
                                            const isExpanded = expandedDate?.toDateString() === d.toDateString();

                                            return (
                                                <div key={i} onClick={() => handleDayClick(d)} className={`relative h-24 sm:h-28 rounded-lg p-1.5 sm:p-2 border transition-colors duration-200 cursor-pointer ${isCurrentMonth ? 'bg-white dark:bg-dark-primary/20' : 'bg-transparent text-gray-400 dark:text-gray-600'} ${isExpanded ? 'border-brand-teal ring-2 ring-brand-teal/50' : isToday ? 'border-brand-teal/50' : 'border-transparent'} ${isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-dark-primary/40' : 'hover:bg-gray-200/50 dark:hover:bg-dark-primary/30'}`}>
                                                    <div className={`text-sm font-bold ${isToday ? 'text-brand-teal' : ''}`}>{d.getDate()}</div>
                                                    <div className="mt-1 space-y-1 overflow-hidden">
                                                        {eventsOnDay.sort((a,b) => a.start.getTime() - b.start.getTime()).slice(0, 2).map(event => (
                                                            <div key={event.id} className="flex items-center text-xs text-left">
                                                                <span className={`w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${eventColorMap[event.type]}`}></span>
                                                                <span className="truncate text-gray-700 dark:text-gray-300">{event.title}</span>
                                                            </div>
                                                        ))}
                                                        {eventsOnDay.length > 2 && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+ {eventsOnDay.length - 2} more</div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}

                        {calendarView === 'content' && (
                             <div className="grid grid-cols-1 gap-1">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-cols-7 gap-1 auto-rows-fr">
                                        {week.map((d, i) => {
                                            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                                            const isToday = new Date().toDateString() === d.toDateString();
                                            const entriesOnDay = userContentEntries.filter(e => e.publishDate.toDateString() === d.toDateString());
                                            const isExpanded = expandedContentDate?.toDateString() === d.toDateString();

                                            return (
                                                <div key={i} onClick={() => handleContentDayClick(d)} className={`relative h-24 sm:h-28 rounded-lg p-1.5 sm:p-2 border transition-colors duration-200 cursor-pointer flex flex-col ${isCurrentMonth ? 'bg-white dark:bg-dark-primary/20' : 'bg-transparent text-gray-400 dark:text-gray-600'} ${isExpanded ? 'border-brand-teal ring-2 ring-brand-teal/50' : isToday ? 'border-brand-teal/50' : 'border-transparent'} ${isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-dark-primary/40' : 'hover:bg-gray-200/50 dark:hover:bg-dark-primary/30'}`}>
                                                    <div className={`text-sm font-bold ${isToday ? 'text-brand-teal' : ''}`}>{d.getDate()}</div>
                                                    <div className="flex-grow mt-1 space-y-1 overflow-hidden">
                                                        {entriesOnDay.slice(0, 2).map(entry => (
                                                            <div key={entry.id} className={`flex items-start text-xs text-left p-1 rounded-md border-l-4 ${statusColorMap[entry.status]}`}>
                                                                <div className="flex items-center gap-1 flex-shrink-0 mr-1.5">
                                                                    {entry.platformInfo.slice(0, 2).map(pInfo => (
                                                                        <PlatformIcon key={pInfo.id} platform={pInfo.platform} className="w-3 h-3" />
                                                                    ))}
                                                                    {entry.platformInfo.length > 2 && <span className="text-xs font-bold">+1</span>}
                                                                </div>
                                                                <span className="truncate text-gray-700 dark:text-gray-300 self-center">{entry.title}</span>
                                                            </div>
                                                        ))}
                                                        {entriesOnDay.length > 2 && <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">+ {entriesOnDay.length - 2} more</div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {calendarView === 'master' && (
                        <div className="mt-4 flex flex-wrap justify-end gap-x-4 gap-y-2">
                            {Object.entries(eventColorMap).map(([type, colorClass]) => (
                                <div key={type} className="flex items-center">
                                    <span className={`w-3 h-3 rounded-full mr-2 ${colorClass}`}></span>
                                    <span className="text-sm capitalize">{type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {calendarView === 'content' && (
                        <div className="mt-4 flex flex-wrap justify-end gap-x-4 gap-y-2">
                            {Object.entries(statusColorMap).map(([status, colorClass]) => (
                                <div key={status} className="flex items-center">
                                    <span className={`w-3 h-3 rounded-full mr-2 ${colorClass.replace('border-', 'bg-')}`}></span>
                                    <span className="text-sm capitalize">{status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(expandedDate || expandedContentDate) && (
                    <div className="md:col-span-1 animate-slide-in-right">
                        <div className="sticky top-24">
                            {calendarView === 'master' && expandedDate && (
                                <ExpandedDayView
                                    date={expandedDate}
                                    events={userEvents.filter(e => e.start.toDateString() === expandedDate.toDateString())}
                                    onClose={() => setExpandedDate(null)}
                                    onAddEvent={handleAddEvent}
                                    onUpdateEvent={handleUpdateEvent}
                                    onDeleteEvent={handleDeleteEvent}
                                />
                            )}
                            {calendarView === 'content' && expandedContentDate && (
                                <ExpandedContentDayView
                                    date={expandedContentDate}
                                    entries={userContentEntries.filter(e => e.publishDate.toDateString() === expandedContentDate.toDateString())}
                                    onClose={() => setExpandedContentDate(null)}
                                    onAddEntry={(date) => handleOpenContentModal(date, null)}
                                    onEditEntry={(entry) => handleOpenContentModal(entry.publishDate, entry)}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasterCalendarPage;
