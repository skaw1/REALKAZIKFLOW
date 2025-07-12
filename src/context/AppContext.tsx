
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Page, User, Notification, Project, Client, CalendarEvent, MoodboardItem, FooterSettings, SocialLink, ContentCalendarEntry, CollaborationSpace, SentEmail } from '../types';
import { auth, db } from '../services/firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

type Theme = 'light' | 'dark';

const defaultFooterSettings: FooterSettings = {
    copyright: `*c ${new Date().getFullYear()} Kazi Flow. All rights reserved.`,
    socialLinks: [
        { id: 'sl1', icon: 'X', url: 'https://x.com' },
        { id: 'sl5', icon: 'Instagram', url: 'https://instagram.com' },
        { id: 'sl4', icon: 'Facebook', url: 'https://facebook.com' },
        { id: 'sl2', icon: 'LinkedIn', url: 'https://linkedin.com' },
        { id: 'sl3', icon: 'GitHub', url: 'https://github.com' },
    ],
};

interface AppContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    activePage: Page;
    setActivePage: (page: Page) => void;
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>; // Kept for auth management
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>; // Required for UsersPage
    credits: number;
    setCredits: React.Dispatch<React.SetStateAction<number>>;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    sentEmails: SentEmail[];
    setSentEmails: React.Dispatch<React.SetStateAction<SentEmail[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    events: CalendarEvent[];
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    contentEntries: ContentCalendarEntry[];
    setContentEntries: React.Dispatch<React.SetStateAction<ContentCalendarEntry[]>>;
    collaborationSpaces: CollaborationSpace[];
    setCollaborationSpaces: React.Dispatch<React.SetStateAction<CollaborationSpace[]>>;
    footerSettings: FooterSettings;
    setFooterSettings: React.Dispatch<React.SetStateAction<FooterSettings>>;
    systemLogoUrl: string;
    setSystemLogoUrl: React.Dispatch<React.SetStateAction<string>>;
    initialSelectedProjectId: string | null;
    setInitialSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
    initialSelectedClientId: string | null;
    setInitialSelectedClientId: React.Dispatch<React.SetStateAction<string | null>>;
    triggerProjectCreationForClientId: string | null;
    setTriggerProjectCreationForClientId: React.Dispatch<React.SetStateAction<string | null>>;
    activeMoodboardProjectId: string | null;
    setActiveMoodboardProjectId: React.Dispatch<React.SetStateAction<string | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, rawSetTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('kazi-theme');
        return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    });

    const [primaryColor, rawSetPrimaryColor] = useState<string>(() => {
        return localStorage.getItem('kazi-primary-color') || '#0a777b';
    });
    
    const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [credits, setCredits] = useState<number>(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [contentEntries, setContentEntries] = useState<ContentCalendarEntry[]>([]);
    const [collaborationSpaces, setCollaborationSpaces] = useState<CollaborationSpace[]>([]);
    const [footerSettings, setFooterSettings] = useState<FooterSettings>(defaultFooterSettings);
    const [systemLogoUrl, setSystemLogoUrl] = useState<string>('');
    
    const [initialSelectedProjectId, setInitialSelectedProjectId] = useState<string | null>(null);
    const [initialSelectedClientId, setInitialSelectedClientId] = useState<string | null>(null);
    const [triggerProjectCreationForClientId, setTriggerProjectCreationForClientId] = useState<string | null>(null);
    const [activeMoodboardProjectId, setActiveMoodboardProjectId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, now get their profile from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const userData = { ...doc.data(), id: doc.id } as User;
                        setUser(userData);
                        setCredits(userData.productivityScore || 0);
                    } else {
                        // This case should ideally not happen for a logged-in user.
                        // It means auth record exists without a user profile in Firestore.
                        console.error("User profile not found in Firestore for UID:", firebaseUser.uid);
                        auth.signOut();
                    }
                });
                return () => unsubProfile();
            } else {
                // User is signed out
                setUser(null);
                setCredits(0);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            // Clear all data if user logs out
            setProjects([]);
            setClients([]);
            setUsers([]);
            setEvents([]);
            setContentEntries([]);
            setCollaborationSpaces([]);
            setNotifications([]);
            setSentEmails([]);
            return;
        }

        // Set up Firestore listeners for all data collections
        const setupListeners = () => {
            const isAdmin = user.category.includes('Admin');
            let q;

            // Users listener (admins see all, others see themselves)
            q = isAdmin ? collection(db, 'users') : query(collection(db, 'users'), where('id', '==', user.id));
            const unsubUsers = onSnapshot(q, (snapshot) => setUsers(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as User))));

            // Projects listener (admins see all, others see their own/team projects)
            q = isAdmin ? collection(db, 'projects') : query(collection(db, 'projects'), where('ownerId', '==', user.id));
            const unsubProjects = onSnapshot(q, (snapshot) => setProjects(snapshot.docs.map(doc => {
                const data = doc.data();
                const deadline = data.deadline;
                return { ...data, id: doc.id, deadline: deadline?.toDate ? deadline.toDate() : deadline } as Project;
            })));
            
            // Clients listener (Admins see all)
            q = isAdmin ? collection(db, 'clients') : query(collection(db, 'clients'), where('ownerId', '==', user.id));
            const unsubClients = onSnapshot(q, (snapshot) => setClients(snapshot.docs.map(doc => {
                 const data = doc.data();
                 const createdAt = data.createdAt;
                 return { ...data, id: doc.id, createdAt: createdAt?.toDate ? createdAt.toDate() : createdAt } as Client;
            })));
            
            // Events listener
            q = isAdmin ? collection(db, 'events') : query(collection(db, 'events'), where('ownerId', '==', user.id));
            const unsubEvents = onSnapshot(q, (snapshot) => setEvents(snapshot.docs.map(doc => {
                const data = doc.data();
                const start = data.start;
                const end = data.end;
                return { ...data, id: doc.id, start: start?.toDate ? start.toDate() : start, end: end?.toDate ? end.toDate() : end } as CalendarEvent;
            })));
            
            // Content Entries listener
            q = isAdmin ? collection(db, 'contentEntries') : query(collection(db, 'contentEntries'), where('ownerId', '==', user.id));
            const unsubContent = onSnapshot(q, (snapshot) => setContentEntries(snapshot.docs.map(doc => {
                const data = doc.data();
                const publishDate = data.publishDate;
                return { ...data, id: doc.id, publishDate: publishDate?.toDate ? publishDate.toDate() : publishDate } as ContentCalendarEntry;
            })));
            
            // Notifications (Simplified for now, real app would be user-specific)
            const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => setNotifications(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Notification))));
            
            // Sent Emails (Admins see all)
            if(isAdmin) {
                const unsubSentEmails = onSnapshot(collection(db, 'sentEmails'), (snapshot) => setSentEmails(snapshot.docs.map(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp;
                    return { ...data, id: doc.id, timestamp: timestamp?.toDate ? timestamp.toDate() : timestamp } as SentEmail;
                })));
                return [unsubUsers, unsubProjects, unsubClients, unsubEvents, unsubContent, unsubNotifications, unsubSentEmails];
            }

            return [unsubUsers, unsubProjects, unsubClients, unsubEvents, unsubContent, unsubNotifications];
        };

        const unsubs = setupListeners();
        
        return () => unsubs.forEach(unsub => unsub && unsub());

    }, [user]);

    const setTheme = (newTheme: Theme) => {
        rawSetTheme(newTheme);
        localStorage.setItem('kazi-theme', newTheme);
    };
    
    const setPrimaryColor = (newColor: string) => {
        rawSetPrimaryColor(newColor);
        localStorage.setItem('kazi-primary-color', newColor);
    };

    const value = { 
        theme, setTheme, 
        primaryColor, setPrimaryColor,
        activePage, setActivePage, 
        user, setUser,
        users, setUsers,
        credits, setCredits, 
        notifications, setNotifications,
        sentEmails, setSentEmails,
        projects, setProjects,
        clients, setClients,
        events, setEvents,
        contentEntries, setContentEntries,
        collaborationSpaces, setCollaborationSpaces,
        footerSettings, setFooterSettings,
        systemLogoUrl, setSystemLogoUrl,
        initialSelectedProjectId, setInitialSelectedProjectId,
        initialSelectedClientId, setInitialSelectedClientId,
        triggerProjectCreationForClientId, setTriggerProjectCreationForClientId,
        activeMoodboardProjectId, setActiveMoodboardProjectId
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

export const useTheme = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within an AppProvider');
    }
    return { theme: context.theme, setTheme: context.setTheme };
};
