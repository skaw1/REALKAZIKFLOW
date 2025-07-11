

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SocialLink, FooterSettings, NotificationPreferences, SentEmail } from '../types';
import { TrashIcon } from '../constants';

const ProfileSettings: React.FC = () => {
    const { user, setUser, users, setUsers } = useAppContext();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [avatarType, setAvatarType] = useState<'url' | 'file'>('url');
    const [isSaved, setIsSaved] = useState(false);
    
    // Sync with context if user changes
    React.useEffect(() => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setAvatarUrl(user?.avatarUrl || '');
    }, [user]);

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        if (!user) return;
        
        const updatedUser = { ...user, name, email, avatarUrl };

        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setUser(updatedUser);
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img src={avatarUrl} alt="Current Avatar" className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover bg-gray-200 dark:bg-gray-700"/>
                    <div className="flex-grow w-full">
                        <div className="flex items-center space-x-2 mb-2">
                             <button type="button" onClick={() => setAvatarType('url')} className={`px-3 py-1 text-xs rounded-md ${avatarType === 'url' ? 'bg-brand-teal text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>URL</button>
                             <button type="button" onClick={() => setAvatarType('file')} className={`px-3 py-1 text-xs rounded-md ${avatarType === 'file' ? 'bg-brand-teal text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Upload</button>
                        </div>
                        {avatarType === 'url' ? (
                             <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/photo.png" className="w-full px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"/>
                        ) : (
                            <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20 cursor-pointer"/>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-teal focus:ring-brand-teal"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-teal focus:ring-brand-teal"/>
            </div>
             <div className="flex items-center space-x-4">
                 <button onClick={handleSaveChanges} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors">Save Changes</button>
                 {isSaved && <span className="text-green-500 transition-opacity duration-300">Saved!</span>}
            </div>
        </div>
    )
}

const NotificationSettings: React.FC = () => {
    const { user, setUser } = useAppContext();
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(user?.notificationPreferences || null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setPrefs(user?.notificationPreferences || null);
    }, [user]);

    if (!prefs) return <p>Could not load notification preferences.</p>;

    const handleToggle = (key: keyof Pick<NotificationPreferences, 'loginAlerts' | 'deadlineReminders'>) => {
        setPrefs(p => p ? { ...p, [key]: !p[key] } : null);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPrefs(p => p ? { ...p, [name]: value } : null);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrefs(p => p ? { ...p, notificationEmail: e.target.value } : null);
    };
    
    const handleSaveChanges = () => {
        if (!user || !prefs) return;
        setUser({ ...user, notificationPreferences: prefs });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const Toggle: React.FC<{ label: string; isChecked: boolean; onToggle: () => void, disabled?: boolean }> = ({ label, isChecked, onToggle, disabled }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <span className={`font-medium ${disabled ? 'text-gray-400' : ''}`}>{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isChecked} onChange={onToggle} className="sr-only peer" disabled={disabled}/>
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-teal peer-disabled:opacity-50"></div>
            </label>
        </div>
    );

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Email Notifications</h3>
            <div className="space-y-4">
                <Toggle
                    label="Team Member Login Alerts"
                    isChecked={prefs.loginAlerts}
                    onToggle={() => handleToggle('loginAlerts')}
                    disabled={!user?.category.includes('Admin')}
                />
                <Toggle
                    label="Upcoming Deadline Reminders (24h)"
                    isChecked={prefs.deadlineReminders}
                    onToggle={() => handleToggle('deadlineReminders')}
                />

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium">Project Progress Updates</span>
                    <select
                        name="progressUpdates"
                        value={prefs.progressUpdates}
                        onChange={handleSelectChange}
                        className="px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"
                    >
                        <option value="none">None</option>
                        <option value="milestones">On Milestones (25%, 50%...)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Email</label>
                    <input type="email" value={prefs.notificationEmail} onChange={handleEmailChange} className="mt-1 block w-full rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-teal focus:ring-brand-teal"/>
                </div>
            </div>
             <div className="flex items-center space-x-4 pt-4">
                 <button onClick={handleSaveChanges} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors">Save Preferences</button>
                 {isSaved && <span className="text-green-500 transition-opacity duration-300">Saved!</span>}
            </div>
        </div>
    );
};

const EmailLog: React.FC = () => {
    const { sentEmails, setSentEmails } = useAppContext();
    const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

    const handleMarkAsRead = (email: SentEmail) => {
        setSentEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
        setSelectedEmail(e => e ? { ...e, read: true } : null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white dark:bg-dark-primary/50 rounded-xl shadow-md h-[600px] flex flex-col">
                <h3 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">Sent Emails ({sentEmails.length})</h3>
                <ul className="overflow-y-auto">
                    {sentEmails.map(email => (
                        <li key={email.id} onClick={() => setSelectedEmail(email)} className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-brand-teal/10 ${selectedEmail?.id === email.id ? 'bg-brand-teal/20' : ''}`}>
                            <div className="flex justify-between items-start">
                                <p className={`font-semibold truncate ${!email.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>{email.subject}</p>
                                {!email.read && <div className="w-2.5 h-2.5 bg-brand-teal rounded-full flex-shrink-0 ml-2 mt-1.5"></div>}
                            </div>
                            <p className={`text-sm truncate ${!email.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>To: {email.to}</p>
                            <p className="text-xs text-gray-400 mt-1">{email.timestamp.toLocaleString()}</p>
                        </li>
                    ))}
                    {sentEmails.length === 0 && <p className="p-4 text-center text-gray-500">No emails have been sent yet.</p>}
                </ul>
            </div>
            <div className="md:col-span-2 bg-white dark:bg-dark-primary/50 rounded-xl shadow-md h-[600px] flex flex-col">
                {selectedEmail ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold">{selectedEmail.subject}</h4>
                            <p className="text-sm text-gray-500">To: {selectedEmail.to}</p>
                            <p className="text-sm text-gray-500">From: Kazi Flow Assistant &lt;assistant@kaziflow.io&gt;</p>
                            {!selectedEmail.read && <button onClick={() => handleMarkAsRead(selectedEmail)} className="text-xs font-semibold text-brand-teal hover:underline mt-1">Mark as Read</button>}
                        </div>
                        <div className="p-4 flex-grow overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{selectedEmail.body}</pre>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select an email to view its content.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const BrandingSettings: React.FC = () => {
    const { systemLogoUrl, setSystemLogoUrl, primaryColor, setPrimaryColor } = useAppContext();
    const [localLogo, setLocalLogo] = useState(systemLogoUrl);
    const [localPrimaryColor, setLocalPrimaryColor] = useState(primaryColor);
    const [isSaved, setIsSaved] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveChanges = () => {
        setSystemLogoUrl(localLogo);
        setPrimaryColor(localPrimaryColor);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Logo</label>
                <p className="text-xs text-gray-400 mt-1 mb-2">This logo will appear in the expanded sidebar. Recommended: transparent background, wide format.</p>
                <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="w-48 h-16 bg-gray-100 dark:bg-dark-primary flex items-center justify-center rounded-md">
                        {localLogo ? (
                            <img src={localLogo} alt="Current system logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-gray-400 text-sm">No Logo</span>
                        )}
                    </div>
                    <div className="flex-grow">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary System Color</label>
                <p className="text-xs text-gray-400 mt-1 mb-2">This color will be used for primary buttons, active states, and highlights throughout the application.</p>
                <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="relative">
                        <input
                            type="color"
                            value={localPrimaryColor}
                            onChange={(e) => setLocalPrimaryColor(e.target.value)}
                            className="w-16 h-10 p-1 border-none cursor-pointer rounded-md bg-white dark:bg-dark-primary"
                        />
                    </div>
                    <input
                        type="text"
                        value={localPrimaryColor}
                        onChange={(e) => setLocalPrimaryColor(e.target.value)}
                        className="flex-grow font-mono px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                </div>
            </div>
            
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                 <button onClick={handleSaveChanges} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors">Save Branding</button>
                 {isSaved && <span className="text-green-500 transition-opacity duration-300">Saved!</span>}
            </div>
        </div>
    );
};

const FooterSettingsEditor: React.FC = () => {
    const { footerSettings, setFooterSettings } = useAppContext();
    const [localSettings, setLocalSettings] = useState<FooterSettings>(footerSettings);
    const [isSaved, setIsSaved] = useState(false);

    const handleCopyrightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSettings(prev => ({ ...prev, copyright: e.target.value }));
    };

    const handleLinkChange = (id: string, field: 'icon' | 'url', value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.map(link => 
                link.id === id ? { ...link, [field]: value } : link
            )
        }));
    };

    const handleAddLink = () => {
        const newLink: SocialLink = {
            id: `sl${Date.now()}`,
            icon: 'X',
            url: ''
        };
        setLocalSettings(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, newLink]
        }));
    };

    const handleRemoveLink = (id: string) => {
        setLocalSettings(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter(link => link.id !== id)
        }));
    };

    const handleSaveChanges = () => {
        setFooterSettings(localSettings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const iconOptions: SocialLink['icon'][] = ['X', 'Facebook', 'Instagram', 'WhatsApp', 'TikTok', 'LinkedIn', 'GitHub', 'Email', 'Phone'];

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Copyright Text</label>
                <input 
                    type="text" 
                    value={localSettings.copyright}
                    onChange={handleCopyrightChange}
                    placeholder="e.g., *c 2024 Kazi Flow"
                    className="mt-1 block w-full rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-teal focus:ring-brand-teal"
                />
                <p className="text-xs text-gray-400 mt-1">Use `*c` to represent the copyright symbol (©).</p>
            </div>

            <div>
                 <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-2">Contact & Social Links</h4>
                 <div className="space-y-3">
                    {localSettings.socialLinks.map(link => (
                        <div key={link.id} className="flex items-center gap-2 p-2 rounded-md bg-gray-100/50 dark:bg-dark-primary/50">
                            <select 
                                value={link.icon} 
                                onChange={(e) => handleLinkChange(link.id, 'icon', e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-dark-secondary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            >
                                {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                            </select>
                             <input 
                                type="text"
                                placeholder={link.icon === 'Email' ? 'contact@example.com' : link.icon === 'Phone' ? '555-123-4567' : 'https://...'}
                                value={link.url}
                                onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)}
                                className="flex-grow px-3 py-2 bg-white dark:bg-dark-secondary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            />
                            <button onClick={() => handleRemoveLink(link.id)} className="p-2 text-gray-400 hover:text-brand-coral">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                 </div>
                 <button onClick={handleAddLink} className="mt-3 text-sm font-semibold text-brand-teal hover:underline">
                    + Add Link
                </button>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                 <button onClick={handleSaveChanges} className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-colors">Save Footer Settings</button>
                 {isSaved && <span className="text-green-500 transition-opacity duration-300">Saved!</span>}
            </div>
        </div>
    );
};


type SettingsTab = 'profile' | 'notifications' | 'emailLog' | 'branding' | 'footer';

const SettingsPage: React.FC = () => {
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const tabs: {id: SettingsTab, label: string, adminOnly: boolean}[] = [
        { id: 'profile', label: 'Profile', adminOnly: false },
        { id: 'notifications', label: 'Notifications', adminOnly: false },
        { id: 'emailLog', label: 'Email Log', adminOnly: true },
        { id: 'branding', label: 'Branding', adminOnly: true },
        { id: 'footer', label: 'Footer', adminOnly: true },
    ];
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h2>
            <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
                {tabs.map(tab => {
                    if (tab.adminOnly && !user?.category.includes('Admin')) return null;
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-lg font-semibold transition-colors flex-shrink-0 mr-4 ${activeTab === tab.id ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="max-w-4xl lg:max-w-full">
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'notifications' && <NotificationSettings />}
                {activeTab === 'emailLog' && user?.category.includes('Admin') && <EmailLog />}
                {activeTab === 'branding' && user?.category.includes('Admin') && <BrandingSettings />}
                {activeTab === 'footer' && user?.category.includes('Admin') && <FooterSettingsEditor />}
            </div>
        </div>
    );
};

export default SettingsPage;