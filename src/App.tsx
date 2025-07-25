import React, { useEffect, useCallback, useState } from 'react';
import { AppProvider, useAppContext, useTheme } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { SentEmail, User } from './types';
import SharedProjectPage from './pages/SharedProjectPage';
import WelcomePage from './pages/WelcomePage';
import { generateLoginAlertEmail } from './services/geminiService';
import { auth, db, setupAuth } from './services/firebase'; // <-- Import setupAuth
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const hexToHslString = (hex: string): string => {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = h * 360;
    s = s * 100;
    l = l * 100;
    
    return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
};

const AppContent: React.FC = () => {
    const { user, users, primaryColor, setSentEmails } = useAppContext();
    const { theme } = useTheme();
    const [path, setPath] = useState(window.location.pathname);
    const [isWelcomePhase, setIsWelcomePhase] = useState(true);
    const [isWelcomePageExiting, setIsWelcomePageExiting] = useState(false);

    // This useEffect will call setupAuth to initialize Firebase services
    useEffect(() => {
        // Call setupAuth to ensure Firebase auth and db instances are initialized
        setupAuth().then(() => {
            console.log("Firebase setupAuth completed.");
            // You might want to add onAuthStateChanged listener here if not already in AppContext
            // For now, assuming AppContext handles auth state changes after initial setup.
        }).catch(error => {
            console.error("Error during Firebase setupAuth:", error);
        });

        const exitTimer = setTimeout(() => setIsWelcomePageExiting(true), 2500);
        const phaseTimer = setTimeout(() => setIsWelcomePhase(false), 3000);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(phaseTimer);
        };
    }, []); // Empty dependency array ensures this runs once on mount

    useEffect(() => {
        const onLocationChange = () => setPath(window.location.pathname);
        window.addEventListener('popstate', onLocationChange);
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);

    useEffect(() => {
        if (primaryColor) {
            const hslColor = hexToHslString(primaryColor);
            document.documentElement.style.setProperty('--color-brand-teal', hslColor);
        }
    }, [primaryColor]);


    const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            // CORRECTED: Use modular signInWithEmailAndPassword
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user;

            if (loggedInUser) {
                 // The onAuthStateChanged listener in AppContext will handle setting the user state.
                 // We can still trigger login notifications here.
                 const userProfile = users.find(u => u.id === loggedInUser.uid);
                 if (!userProfile) return true; // Login successful, but profile not yet loaded.

                 const adminsToNotify = users.filter(u => 
                     u.category.includes('Admin') && 
                     u.notificationPreferences.loginAlerts &&
                     u.id !== loggedInUser.uid
                 );

                 for (const admin of adminsToNotify) {
                     generateLoginAlertEmail(userProfile.name, admin.name.split(' ')[0]).then(async emailContent => {
                         const newEmail: Omit<SentEmail, 'id'> = {
                             to: admin.notificationPreferences.notificationEmail,
                             ...emailContent,
                             timestamp: new Date(),
                             read: false,
                         };
                         // Add console log to check the 'db' object
                         console.log("Firestore 'db' object before collection call:", db);
                         if (db && typeof db.collection === 'function') {
                           await db.collection("sentEmails").add(newEmail);
                         } else {
                           console.error("Firestore 'db' object is not valid or collection method is missing. Cannot add email.");
                           // Optionally, handle this error more gracefully in UI
                         }
                     });
                 }
                 return true;
            }
            return false;
        } catch (error) {
            console.error("Firebase login error:", error);
            return false;
        }
    }, [users, setSentEmails]);

    useEffect(() => {
        document.documentElement.className = theme;
        if (theme === 'dark') {
            document.body.classList.add('bg-dark-primary', 'text-gray-200');
            document.body.classList.remove('bg-light-primary', 'text-gray-800');
        } else {
            document.body.classList.add('bg-light-primary', 'text-gray-800');
            document.body.classList.remove('bg-dark-primary', 'text-gray-200');
        }
    }, [theme]);

    if (isWelcomePhase) {
        return <WelcomePage isExiting={isWelcomePageExiting} />;
    }

    const mainContent = (() => {
        if (path.startsWith('/share/project/')) {
            const linkId = path.split('/share/project/')[1];
            if (linkId) {
                return <SharedProjectPage linkId={linkId} />;
            }
        }
    
        if (!user) {
            return <LoginPage onLogin={handleLogin} />;
        }
    
        return <Dashboard />;
    })();

    return (
        <>
            <style>{`
                @keyframes appFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-app-fade-in {
                    animation: appFadeIn 0.5s ease-in forwards;
                }
            `}</style>
            <div className="animate-app-fade-in">
                {mainContent}
            </div>
        </>
    );
};


const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
