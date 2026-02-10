import { auth, db } from '@/lib/firebase';
import { AppUser } from '@/lib/types';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    appUser: AppUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    firebaseUser: null,
    appUser: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
    isAdmin: false,
});

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);

            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'Users', user.uid));
                    if (userDoc.exists()) {
                        setAppUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
                    } else {
                        // Auto-create user doc with default 'user' role
                        setAppUser({
                            id: user.uid,
                            name: user.displayName || user.email || 'User',
                            mobile_number: '',
                            photo_url: user.photoURL || '',
                            role: 'user',
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setAppUser(null);
                }
            } else {
                setAppUser(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setAppUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const isAdmin = appUser?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{ firebaseUser, appUser, loading, login, logout, isAdmin }}
        >
            {children}
        </AuthContext.Provider>
    );
}
