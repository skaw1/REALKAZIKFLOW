import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserCategory } from '../types';
import { TrashIcon } from '../constants';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const allCategoryOptions: UserCategory[] = ['Primary Admin', 'Temporary Admin', 'Team Member', 'Brand', 'Business', 'Client'];

const categoryStyles: Record<UserCategory, string> = {
    'Primary Admin': 'bg-red-500/20 text-red-400',
    'Temporary Admin': 'bg-brand-teal/20 text-brand-teal',
    'Team Member': 'bg-blue-500/20 text-blue-400',
    Brand: 'bg-purple-500/20 text-purple-400',
    Business: 'bg-green-500/20 text-green-400',
    Client: 'bg-yellow-500/20 text-yellow-400',
};

type UserSortKey = 'name' | 'email' | 'category' | 'productivityScore';
type SortDirection = 'asc' | 'desc';

const AddUserModal: React.FC<{
    onClose: () => void;
    onSave: (data: Partial<User>, isNew: boolean) => Promise<void>;
    userToEdit: User | null;
    primaryAdminCount: number;
    isCurrentUserPrimaryAdmin: boolean;
}> = ({ onClose, onSave, userToEdit, primaryAdminCount, isCurrentUserPrimaryAdmin }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    
    const categoryOptions = useMemo(() => {
        const baseOptions: UserCategory[] = ['Temporary Admin', 'Team Member', 'Brand', 'Business', 'Client'];
        const isEditingThisUserToPrimary = userToEdit?.category !== 'Primary Admin' && primaryAdminCount >= 3;

        if (isCurrentUserPrimaryAdmin && !isEditingThisUserToPrimary) {
             return ['Primary Admin', ...baseOptions];
        }
        if (userToEdit?.category === 'Primary Admin') {
            return ['Primary Admin', ...baseOptions];
        }
        return baseOptions;
    }, [userToEdit, primaryAdminCount, isCurrentUserPrimaryAdmin]);


    useEffect(() => {
        setFormData(userToEdit || {
            name: '', email: '', password: '', avatarUrl: '', category: 'Client', productivityScore: 100
        });
    }, [userToEdit]);
    
    const handleChange = (field: keyof User, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || (!userToEdit && !formData.password)) return;
        
        const dataToSave = {...formData};
        if (!dataToSave.avatarUrl) {
            dataToSave.avatarUrl = `https://i.pravatar.cc/100?u=${dataToSave.email}`;
        }
        
        await onSave(dataToSave, !userToEdit);
        onClose();
    };

    const isEditingPrimaryAdmin = userToEdit?.category === 'Primary Admin';
    const canChangeRole = isCurrentUserPrimaryAdmin || !isEditingPrimaryAdmin;
    const isDemotingLastAdmin = isEditingPrimaryAdmin && primaryAdminCount <= 1 && formData.category !== 'Primary Admin';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6">{userToEdit ? 'Edit User' : 'Add New User'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="Full Name" required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <input type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="Email" required className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>
                    <input type="password" value={formData.password || ''} onChange={e => handleChange('password', e.target.value)} placeholder={userToEdit ? "New Password (optional)" : "Set Password"} required={!userToEdit} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"/>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select value={formData.category} onChange={e => handleChange('category', e.target.value as UserCategory)} disabled={!canChangeRole} className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md disabled:bg-gray-200 dark:disabled:bg-gray-700">
                           {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {!canChangeRole && <p className="text-xs text-yellow-500 mt-1">Only a Primary Admin can change another admin's role.</p>}
                        {isDemotingLastAdmin && <p className="text-xs text-red-500 mt-1">Cannot demote the last Primary Admin.</p>}
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-brand-teal text-white font-semibold" disabled={isDemotingLastAdmin}>
                            {userToEdit ? 'Save Changes' : 'Add User'}
                        </button>
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

const UsersPage: React.FC = () => {
    const { user: currentUser, users } = useAppContext();
    const [filterQuery, setFilterQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | UserCategory>('All');
    const [sortConfig, setSortConfig] = useState<{ key: UserSortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });
    const [isModalOpen, setModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const primaryAdminCount = useMemo(() => users.filter(u => u.category === 'Primary Admin').length, [users]);
    const isCurrentUserPrimaryAdmin = currentUser?.category === 'Primary Admin';

    const handleSaveUser = async (data: Partial<User>, isNew: boolean) => {
        if (!currentUser) return;

        if (data.category === 'Primary Admin') {
            const isChangingToPrimary = data.id && users.find(u => u.id === data.id)?.category !== 'Primary Admin';
            if ((isNew || isChangingToPrimary) && primaryAdminCount >= 3) {
                alert('Error: The maximum of 3 Primary Admins has been reached.');
                return;
            }
        }
        
        if(isNew) {
             try {
                const userCredential = await createUserWithEmailAndPassword(auth, data.email!, data.password!);
                const newUserFromAuth = userCredential.user;
                const newUserProfile: User = {
                    id: newUserFromAuth.uid,
                    name: data.name!,
                    email: data.email!,
                    avatarUrl: data.avatarUrl!,
                    category: data.category!,
                    productivityScore: data.productivityScore || 100,
                    notificationPreferences: {
                        loginAlerts: false,
                        progressUpdates: 'none',
                        deadlineReminders: true,
                        notificationEmail: data.email!,
                    },
                };
                await setDoc(doc(db, "users", newUserFromAuth.uid), newUserProfile);
            } catch (error: any) {
                console.error("Error creating user:", error);
                alert(`Error: ${error.message}`);
            }
        } else { // Editing
            const originalUser = users.find(u => u.id === data.id);
            if (originalUser?.category === 'Primary Admin' && data.category !== 'Primary Admin' && primaryAdminCount <= 1) {
                alert('Error: Cannot demote the last Primary Admin.');
                return;
            }
            const userDocRef = doc(db, "users", data.id!);
            const { id, ...updateData } = data;
            if(!updateData.password) {
                delete updateData.password;
            }
            await updateDoc(userDocRef, updateData);
            // NOTE: Password changes would require re-authentication or a backend function.
        }
    };

    const handleEdit = (user: User) => {
        setUserToEdit(user);
        setModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (deletingUser) {
            try {
                // Deleting user profile from Firestore
                await deleteDoc(doc(db, "users", deletingUser.id));
                // IMPORTANT: Deleting a user from Firebase Auth requires admin privileges
                // and should be handled by a secure backend function (e.g., Cloud Function).
                // This frontend-only action only removes them from the app's user list.
                alert(`User ${deletingUser.name} removed from database. Auth record must be removed via backend.`);
            } catch (error) {
                console.error("Error removing user:", error);
            }
            setDeletingUser(null);
        }
    };
    
    const handleOpenModal = (user: User | null = null) => {
        setUserToEdit(user);
        setModalOpen(true);
    };

    const displayedUsers = useMemo(() => {
        let filteredUsers = [...users];

        if (categoryFilter !== 'All') {
            filteredUsers = filteredUsers.filter(u => u.category === categoryFilter);
        }

        if (filterQuery) {
            filteredUsers = filteredUsers.filter(u =>
                u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(filterQuery.toLowerCase())
            );
        }

        return filteredUsers.sort((a, b) => {
            const key = sortConfig.key;
            const valA = a[key] || '';
            const valB = b[key] || '';

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users, filterQuery, categoryFilter, sortConfig]);
    
    const canRemoveUser = (userToRemove: User) => {
        if (!currentUser) return false;
        // Cannot remove a Primary Admin
        if (userToRemove.category === 'Primary Admin') return false;
        // Cannot remove yourself
        if (userToRemove.id === currentUser.id) return false;

        return true;
    };

    return (
        <div>
            {isModalOpen && <AddUserModal onClose={() => setModalOpen(false)} onSave={handleSaveUser} userToEdit={userToEdit} primaryAdminCount={primaryAdminCount} isCurrentUserPrimaryAdmin={isCurrentUserPrimaryAdmin} />}
            <ConfirmModal
              isOpen={!!deletingUser}
              onClose={() => setDeletingUser(null)}
              onConfirm={handleConfirmRemove}
              title="Confirm User Deletion"
            >
              Are you sure you want to remove <span className="font-bold">{deletingUser?.name}</span>? This action is permanent and will remove their profile from the database.
            </ConfirmModal>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">User Management</h2>
                <button onClick={() => handleOpenModal()} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                    Add New User
                </button>
            </div>

            <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-xl shadow-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        className="md:col-span-1 w-full px-4 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                    <div className="md:col-span-2 flex items-center gap-x-2 overflow-x-auto pb-2">
                        <span className="text-sm font-semibold flex-shrink-0 text-gray-500 dark:text-gray-400">Filter:</span>
                        {(['All', ...allCategoryOptions] as ('All' | UserCategory)[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${categoryFilter === cat ? 'bg-brand-teal text-white' : 'bg-gray-200 dark:bg-dark-primary text-gray-500 hover:bg-gray-300/50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <select
                        value={`${sortConfig.key}-${sortConfig.direction}`}
                        onChange={(e) => {
                            const [key, direction] = e.target.value.split('-') as [UserSortKey, SortDirection];
                            setSortConfig({ key, direction });
                        }}
                        className="px-3 py-2 text-sm bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
                    >
                        <option value="name-asc">Sort by Name (A-Z)</option>
                        <option value="name-desc">Sort by Name (Z-A)</option>
                        <option value="category-asc">Sort by Category (A-Z)</option>
                        <option value="category-desc">Sort by Category (Z-A)</option>
                        <option value="productivityScore-desc">Sort by Score (High-Low)</option>
                        <option value="productivityScore-asc">Sort by Score (Low-High)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {displayedUsers.length > 0 ? (
                    displayedUsers.map(user => (
                        <div key={user.id} className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-4 flex-grow w-full">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${categoryStyles[user.category]}`}>{user.category}</span>
                                <div className="text-sm text-center">
                                    <span className="font-bold text-brand-gold">{user.productivityScore}</span>
                                    <span className="text-gray-500 dark:text-gray-400"> pts</span>
                                </div>
                                <div className="flex-shrink-0 space-x-2">
                                    <button onClick={() => handleEdit(user)} className="font-medium text-brand-teal hover:underline text-sm">Edit</button>
                                    <button onClick={() => setDeletingUser(user)} disabled={!canRemoveUser(user)} className="font-medium text-brand-coral hover:underline text-sm disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed">
                                        <TrashIcon className="w-4 h-4 inline-block -mt-1"/> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <p className="font-bold text-lg">No Users Found</p>
                        <p>Try adjusting your search or filter settings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersPage;
