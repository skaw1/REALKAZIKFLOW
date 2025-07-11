














import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MoodboardItem, Project, UserCategory } from '../types';
import { ArrowDownIcon, PlusCircleIcon, TrashIcon, ResetIcon, CloseIcon } from '../constants';
import { useAppContext } from '../context/AppContext';

const EditMoodboardItemModal: React.FC<{
    itemToEdit: MoodboardItem | null;
    onClose: () => void;
    onSave: (item: Partial<MoodboardItem>) => void;
}> = ({ itemToEdit, onClose, onSave }) => {
    const [item, setItem] = useState<Partial<MoodboardItem>>(
        itemToEdit || {
            type: 'note',
            content: '',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            backgroundImageUrl: '',
        }
    );

    useEffect(() => {
        if (itemToEdit) {
            setItem(itemToEdit);
        } else {
            setItem({
                type: 'note',
                content: '',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                backgroundImageUrl: '',
            });
        }
    }, [itemToEdit]);

    const handleSave = () => {
        if (!item.content) {
            alert('Please add some content or an image URL.');
            return;
        }
        onSave({
            type: item.type!,
            content: item.content!,
            backgroundColor: item.backgroundColor,
            textColor: item.textColor,
            backgroundImageUrl: item.backgroundImageUrl
        });
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as 'note' | 'image';
        setItem({
            // Reset to defaults for the new type
            type: newType,
            content: '',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            backgroundImageUrl: '',
        });
    };

    const notePreviewStyle: React.CSSProperties = {
        backgroundColor: item.backgroundColor,
        color: item.textColor,
        backgroundImage: item.backgroundImageUrl ? `url(${item.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col sm:flex-row gap-6" onClick={e => e.stopPropagation()}>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    <h3 className="text-2xl font-bold">{itemToEdit ? 'Edit' : 'Add'} Moodboard Item</h3>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Item Type</label>
                        <select value={item.type} onChange={handleTypeChange} className="w-full form-select">
                            <option value="note">Note</option>
                            <option value="image">Image</option>
                        </select>
                    </div>

                    {item.type === 'note' ? (
                        <>
                            <textarea value={item.content} onChange={e => setItem({...item, content: e.target.value})} placeholder="Your note here..." rows={4} className="w-full form-textarea" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Background Color</label>
                                    <input type="color" value={item.backgroundColor || '#ffffff'} onChange={e => setItem({...item, backgroundColor: e.target.value})} className="w-full h-10 p-1 border-none cursor-pointer rounded-md bg-white dark:bg-dark-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Text Color</label>
                                    <input type="color" value={item.textColor || '#000000'} onChange={e => setItem({...item, textColor: e.target.value})} className="w-full h-10 p-1 border-none cursor-pointer rounded-md bg-white dark:bg-dark-primary"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Background Image URL (Optional)</label>
                                <input type="text" value={item.backgroundImageUrl || ''} onChange={e => setItem({...item, backgroundImageUrl: e.target.value})} placeholder="https://..." className="w-full form-input"/>
                            </div>
                        </>
                    ) : (
                         <input type="text" value={item.content} onChange={e => setItem({...item, content: e.target.value})} placeholder="Image URL..." className="w-full form-input"/>
                    )}
                                        
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-brand-teal text-white font-semibold rounded-md">Save</button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-primary rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Live Preview</h4>
                    {item.type === 'note' ? (
                        <div style={notePreviewStyle} className="w-full h-48 rounded-lg p-4 flex items-center justify-center shadow-inner overflow-hidden">
                            <p className="text-center italic break-words">{item.content}</p>
                        </div>
                    ) : (
                        item.content ? (
                            <div className="w-full h-48 rounded-lg flex items-center justify-center shadow-inner overflow-hidden bg-gray-200 dark:bg-dark-secondary">
                                <img src={item.content} alt="Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-full h-48 rounded-lg flex items-center justify-center shadow-inner overflow-hidden bg-gray-200 dark:bg-dark-secondary">
                                <span className="text-gray-500">Image preview will appear here</span>
                            </div>
                        )
                    )}
                </div>
            </div>
             <style>{`
                .form-input, .form-textarea, .form-select {
                     width: 100%;
                     padding: 0.5rem 0.75rem;
                     background-color: white;
                     color: #1f2937;
                     border: 1px solid #d1d5db;
                     border-radius: 0.375rem;
                }
                .dark .form-input, .dark .form-textarea, .dark .form-select {
                    background-color: #2c2c2c;
                    color: #f3f4f6;
                    border-color: #4b5563;
                }
            `}</style>
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[110] flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 -mt-1"><CloseIcon className="w-5 h-5"/></button>
        </div>
        <div className="text-gray-600 dark:text-gray-400 mb-6">{children}</div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Confirm Delete</button>
        </div>
      </div>
    </div>
  );
};


const TrashModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    items: MoodboardItem[];
    onRestore: (id: string) => void;
    onPermanentlyDelete: (item: MoodboardItem) => void;
}> = ({ isOpen, onClose, items, onRestore, onPermanentlyDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold mb-4">Recycle Bin</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 -mt-4"><CloseIcon /></button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Items here can be restored or permanently deleted.</p>
                <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                     {items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {items.map(item => (
                                <div key={item.id} className="rounded-lg bg-white dark:bg-dark-primary flex flex-col group shadow-md">
                                    <div className="h-32 flex-shrink-0 rounded-t-lg overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 p-2">
                                        {item.type === 'image' ? (
                                            <img src={item.content} alt="thumbnail" className="max-w-full max-h-full object-contain"/>
                                        ) : (
                                            <div style={{ backgroundColor: item.backgroundColor, color: item.textColor, backgroundImage: `url(${item.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="w-full h-full flex items-center justify-center p-2">
                                                <p className="text-xs text-center break-words line-clamp-5">{item.content}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex-grow flex flex-col justify-between">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{item.type === 'note' ? item.content : 'Image'}</p>
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                            <button onClick={() => onRestore(item.id)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-brand-teal hover:bg-brand-teal/10 transition-colors">
                                                <ResetIcon className="w-4 h-4" /> Restore
                                            </button>
                                            <button onClick={() => onPermanentlyDelete(item)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-brand-coral hover:bg-brand-coral/10 transition-colors">
                                                <TrashIcon className="w-4 h-4"/> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10 h-full">
                            <TrashIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h4 className="font-bold text-lg">Trash is empty</h4>
                            <p className="text-sm">Deleted items will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const getEventCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const event = 'nativeEvent' in e ? e.nativeEvent : e;
    if (event instanceof MouseEvent) {
        return { clientX: event.clientX, clientY: event.clientY };
    }
    if (event instanceof TouchEvent) {
        const touch = event.touches[0] || event.changedTouches[0];
        if (touch) {
            return { clientX: touch.clientX, clientY: touch.clientY };
        }
    }
    return { clientX: 0, clientY: 0 };
};


const MoodboardItemComponent: React.FC<{
    item: MoodboardItem;
    onUpdate: (item: MoodboardItem) => void;
    onEdit: (item: MoodboardItem) => void;
    onTrash: (id: string) => void;
    onBringToFront: (item: MoodboardItem) => void;
    onDragStateChange: (isDragging: boolean, isOverTrash: boolean) => void;
    isEditable: boolean;
    boundsRef: React.RefObject<HTMLDivElement>;
    trashCanRef: React.RefObject<HTMLDivElement>;
}> = ({ item, onUpdate, onEdit, onTrash, onBringToFront, onDragStateChange, isEditable, boundsRef, trashCanRef }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, offsetX: 0, offsetY: 0 });

    const checkTrashOverlap = useCallback(() => {
        if (!itemRef.current || !trashCanRef.current) return false;
        const itemRect = itemRef.current.getBoundingClientRect();
        const trashRect = trashCanRef.current.getBoundingClientRect();
        return !(itemRect.right < trashRect.left || 
                 itemRect.left > trashRect.right || 
                 itemRect.bottom < trashRect.top || 
                 itemRect.top > trashRect.bottom);
    }, [trashCanRef]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (e instanceof TouchEvent && (dragInfo.current.isDragging || dragInfo.current.isResizing)) {
            e.preventDefault();
        }

        const bounds = boundsRef.current?.getBoundingClientRect();
        if (!bounds) return;

        const { clientX, clientY } = getEventCoords(e);

        const isOverTrash = checkTrashOverlap();
        onDragStateChange(true, isOverTrash);

        if (dragInfo.current.isDragging) {
            let newX = clientX - dragInfo.current.offsetX;
            let newY = clientY - dragInfo.current.offsetY;
            newX = Math.max(0, Math.min(newX, bounds.width - item.width));
            newY = Math.max(0, Math.min(newY, bounds.height - item.height));
            onUpdate({ ...item, x: newX, y: newY });
        } else if (dragInfo.current.isResizing) {
            const newWidth = Math.max(100, dragInfo.current.startWidth + (clientX - dragInfo.current.startX));
            const newHeight = Math.max(100, dragInfo.current.startHeight + (clientY - dragInfo.current.startY));
            
            const finalWidth = Math.min(newWidth, bounds.width - item.x);
            const finalHeight = Math.min(newHeight, bounds.height - item.y);
            
            onUpdate({ ...item, width: finalWidth, height: finalHeight });
        }
    }, [item, onUpdate, boundsRef, checkTrashOverlap, onDragStateChange]);

    const handleUp = useCallback(() => {
        if (dragInfo.current.isDragging && checkTrashOverlap()) {
            onTrash(item.id);
        }

        dragInfo.current.isDragging = false;
        dragInfo.current.isResizing = false;
        onDragStateChange(false, false);
        
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
    }, [handleMove, onDragStateChange, checkTrashOverlap, onTrash, item.id]);

    const handleStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!isEditable || !itemRef.current) return;
        onBringToFront(item);

        const { clientX, clientY } = getEventCoords(e);

        dragInfo.current.isDragging = true;
        dragInfo.current.isResizing = false;
        dragInfo.current.offsetX = clientX - itemRef.current.offsetLeft;
        dragInfo.current.offsetY = clientY - itemRef.current.offsetTop;
        onDragStateChange(true, false);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
    }, [isEditable, item, onBringToFront, onDragStateChange, handleMove, handleUp]);

    const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!isEditable) return;
        onBringToFront(item);

        const { clientX, clientY } = getEventCoords(e);

        dragInfo.current.isResizing = true;
        dragInfo.current.isDragging = false;
        dragInfo.current.startX = clientX;
        dragInfo.current.startY = clientY;
        dragInfo.current.startWidth = item.width;
        dragInfo.current.startHeight = item.height;
        onDragStateChange(true, false);
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
    }, [isEditable, item, onBringToFront, onDragStateChange, handleMove, handleUp]);

    const itemStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${item.y}px`,
        left: `${item.x}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: item.zIndex,
        backgroundColor: item.type === 'note' ? item.backgroundColor : undefined,
        color: item.type === 'note' ? item.textColor : undefined,
        backgroundImage: (item.type === 'note' && item.backgroundImageUrl) ? `url(${item.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div 
            ref={itemRef} 
            style={itemStyle} 
            onMouseDown={handleStart} 
            onTouchStart={handleStart} 
            className={`group rounded-xl shadow-lg overflow-hidden flex items-center justify-center transition-all duration-100 ease-linear ${isEditable ? 'cursor-move' : ''}`}
        >
            {item.type === 'image' ? (
                <img src={item.content} alt="Moodboard" className="w-full h-full object-cover pointer-events-none" />
            ) : (
                <p className="text-center text-lg italic break-words p-6 pointer-events-none">{item.content}</p>
            )}
            {isEditable && (
                <>
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onClick={() => onEdit(item)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/80">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                        </button>
                    </div>
                    <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-4 h-4 bg-brand-teal/50 rounded-tl-lg cursor-se-resize opacity-0 group-hover:opacity-100"/>
                </>
            )}
        </div>
    );
};


const TrashCan: React.FC<{
    isOver: boolean;
    onClick: () => void;
    count: number;
    trashCanRef: React.RefObject<HTMLDivElement>;
}> = ({ isOver, onClick, count, trashCanRef }) => (
    <div ref={trashCanRef} onClick={onClick} className={`fixed bottom-8 right-8 z-[60] flex flex-col items-center gap-2 transition-all duration-300 ${isOver ? 'scale-125' : 'scale-100'}`}>
        <div className={`relative p-4 rounded-full shadow-lg cursor-pointer transition-colors ${isOver ? 'bg-brand-coral' : 'bg-gray-700 text-white'}`}>
            <TrashIcon className="w-8 h-8" />
            {count > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-brand-teal text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-light-secondary dark:border-dark-secondary">{count}</span>}
        </div>
        <span className={`text-sm font-semibold transition-opacity ${isOver ? 'opacity-100 text-brand-coral' : 'opacity-0'}`}>Drop to Delete</span>
    </div>
);


export const MoodboardPage: React.FC<{
    title?: string;
    isEditable?: boolean;
    items: MoodboardItem[];
    trashedItems: MoodboardItem[];
    onUpdateMoodboard: (updates: { items?: MoodboardItem[], trashedItems?: MoodboardItem[] }) => void;
    projects?: Project[];
    onSelectProject?: (projectId: string) => void;
    activeProjectId?: string;
}> = ({ title = "Moodboard", isEditable = true, items, trashedItems = [], onUpdateMoodboard, projects, onSelectProject, activeProjectId }) => {
    const { user } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MoodboardItem | null>(null);
    const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<MoodboardItem | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const trashCanRef = useRef<HTMLDivElement>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        const restrictedCategories: UserCategory[] = ['Brand', 'Business', 'Client'];
        const isRestrictedView = user?.category ? restrictedCategories.includes(user.category) : false;
        
        const userProjects = isRestrictedView
            ? projects.filter(p => p.ownerId === user?.id || p.team.some(m => m.id === user?.id))
            : projects;
    
        if (!searchQuery) return userProjects;
    
        return userProjects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery, user]);

    useEffect(() => {
        // Cleanup function to reset body style on component unmount
        return () => {
            if (isEditable) {
                document.body.style.userSelect = '';
            }
        };
    }, [isEditable]);

    const handleAddItem = () => {
        if (!isEditable) return;
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEditItem = (item: MoodboardItem) => {
        if (!isEditable) return;
        setEditingItem(item);
        setIsModalOpen(true);
    };
    
    const handleTrashItem = (itemId: string) => {
        const itemToTrash = items.find(item => item.id === itemId);
        if (itemToTrash) {
            onUpdateMoodboard({
                items: items.filter(item => item.id !== itemId),
                trashedItems: [...trashedItems, itemToTrash]
            });
        }
    };
    
    const handleRestoreItem = (itemId: string) => {
        const itemToRestore = trashedItems.find(item => item.id === itemId);
        if (itemToRestore) {
            onUpdateMoodboard({
                items: [...items, { ...itemToRestore, x: 20, y: 20, zIndex: Math.max(0, ...items.map(i => i.zIndex)) + 1 }],
                trashedItems: trashedItems.filter(item => item.id !== itemId)
            });
        }
    };

    const handlePermanentlyDeleteItem = (item: MoodboardItem) => {
        setDeletingItem(item);
    };

    const handleConfirmPermanentDelete = () => {
        if (!deletingItem) return;
        onUpdateMoodboard({
            items: items, // Pass current items to ensure state consistency
            trashedItems: trashedItems.filter(item => item.id !== deletingItem.id)
        });
        setDeletingItem(null);
    };

    const handleSaveItem = (itemData: Partial<MoodboardItem>) => {
        let newItems: MoodboardItem[];
        if (editingItem) {
            newItems = items.map(item => (item.id === editingItem.id ? { ...item, ...itemData } : item)) as MoodboardItem[];
        } else {
            const maxZ = Math.max(0, ...items.map(i => i.zIndex || 0));
            const newItem: MoodboardItem = {
                id: `m${Date.now()}`,
                type: itemData.type || 'note',
                content: itemData.content || '',
                x: 20,
                y: 20,
                width: 250,
                height: 200,
                zIndex: maxZ + 1,
                backgroundColor: itemData.backgroundColor || '#ffffff',
                textColor: itemData.textColor || '#000000',
                backgroundImageUrl: itemData.backgroundImageUrl || '',
            };
            newItems = [...items, newItem];
        }
        onUpdateMoodboard({ items: newItems });
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleUpdateItem = useCallback((updatedItem: MoodboardItem) => {
        if (!isEditable) return;
        onUpdateMoodboard({ items: items.map(item => item.id === updatedItem.id ? updatedItem : item) });
    }, [isEditable, onUpdateMoodboard, items]);

    const handleBringToFront = useCallback((itemToFront: MoodboardItem) => {
        if (!isEditable) return;
        const maxZ = Math.max(0, ...items.map(i => i.zIndex));
        if (itemToFront.zIndex <= maxZ) {
            onUpdateMoodboard({
                items: items.map(item =>
                    item.id === itemToFront.id ? { ...item, zIndex: maxZ + 1 } : item
                )
            });
        }
    }, [isEditable, items, onUpdateMoodboard]);
    
    const handleDragStateChange = useCallback((dragging: boolean, overTrash: boolean) => {
        setIsDragging(dragging);
        setIsDraggingOverTrash(overTrash);
        if (isEditable) {
            // Prevent text selection on the page during drag/resize operations
            document.body.style.userSelect = dragging ? 'none' : '';
        }
    }, [isEditable]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => projects && setIsDropdownOpen(p => !p)} 
                        className={`flex items-center gap-2 ${projects ? 'cursor-pointer' : 'cursor-default'}`}
                        disabled={!projects}
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                    >
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                        {projects && <ArrowDownIcon className="w-6 h-6 text-gray-500" />}
                    </button>
                    {isDropdownOpen && projects && onSelectProject && activeProjectId && (
                        <div className="absolute top-full mt-2 w-72 bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-2xl z-50 p-2 border border-gray-200 dark:border-gray-700">
                            <input
                                type="text"
                                placeholder="Search moodboards..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 mb-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"
                            />
                            <ul className="max-h-60 overflow-y-auto">
                                {filteredProjects.map(p => (
                                    <li
                                        key={p.id}
                                        onClick={() => {
                                            onSelectProject(p.id);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`p-2 rounded-md cursor-pointer hover:bg-brand-teal/10 font-medium ${p.id === activeProjectId ? 'bg-brand-teal/20 text-brand-teal' : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        {p.name}
                                    </li>
                                ))}
                                {filteredProjects.length === 0 && <li className="p-2 text-center text-gray-500">No projects found.</li>}
                            </ul>
                        </div>
                    )}
                </div>
                 {isEditable && (
                    <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                        <PlusCircleIcon className="w-5 h-5"/>
                        Add Item
                    </button>
                 )}
            </div>
            
            <div ref={canvasRef} className="relative w-full h-[1200px] bg-gray-100 dark:bg-dark-primary/20 rounded-lg shadow-inner overflow-auto border border-gray-200 dark:border-gray-700">
                {items.map(item => (
                    <MoodboardItemComponent 
                        key={item.id} 
                        item={item} 
                        onUpdate={handleUpdateItem}
                        onEdit={handleEditItem}
                        onTrash={handleTrashItem}
                        onBringToFront={handleBringToFront}
                        onDragStateChange={handleDragStateChange}
                        isEditable={isEditable}
                        boundsRef={canvasRef}
                        trashCanRef={trashCanRef}
                    />
                ))}
                {isDragging && isEditable && <TrashCan isOver={isDraggingOverTrash} count={trashedItems.length} onClick={() => setIsTrashModalOpen(true)} trashCanRef={trashCanRef}/>}
            </div>

            {isEditable && !isDragging && <TrashCan isOver={false} count={trashedItems.length} onClick={() => setIsTrashModalOpen(true)} trashCanRef={trashCanRef}/>}

            {isModalOpen && <EditMoodboardItemModal itemToEdit={editingItem} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem}/>}
            
            <TrashModal 
                isOpen={isTrashModalOpen} 
                onClose={() => setIsTrashModalOpen(false)} 
                items={trashedItems} 
                onRestore={handleRestoreItem} 
                onPermanentlyDelete={handlePermanentlyDeleteItem}
            />

            <ConfirmModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleConfirmPermanentDelete}
                title="Confirm Permanent Deletion"
            >
                <p>Are you sure you want to permanently delete this moodboard item? This action cannot be undone.</p>
                {deletingItem && (
                    <div className="mt-4 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-dark-primary">
                        {deletingItem.type === 'image' ? 
                            <img src={deletingItem.content} alt="Item to delete" className="max-h-24 mx-auto rounded"/> :
                            <p className="text-sm italic truncate">"{deletingItem.content}"</p>
                        }
                    </div>
                )}
            </ConfirmModal>

        </div>
    );
};