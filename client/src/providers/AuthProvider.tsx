import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { User, AuthResponse, RegisterCredentials, Session } from '../types';


const AuthContext = createContext<{
    signIn: (user: User) => void;
    signUp: (credentials: RegisterCredentials) => Promise<void>;
    signOut: () => void;
    session?: Session | null;
    isLoading: boolean;
}>({
    signIn: () => null,
    signUp: async () => {},
    signOut: () => null,
    session: null,
    isLoading: false
})

export const AuthProvider = ({children}: PropsWithChildren) => {
    const [session, setSession] = useState<Session | null>();
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        loadSession();
    }, []);

    const signIn = (user: User) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.accessToken}`;
        const session: Session = {
            user,
            accessToken: user.accessToken || ''
        };
        setSession(session);
        saveSession(session);
    };

    const signUp = async (credentials: RegisterCredentials) => {
        try {
            const response = await axios.post<AuthResponse>('http://localhost:5000/api/auth/register', credentials);
            signIn(response.data.user);
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    };

    const signOut = () => {
        setSession(null);
        saveSession(null);
        queryClient.clear();
    };

    const saveSession = async (value: Session | null) => {
        if (value) {
            Platform.OS === 'web' 
                ? localStorage.setItem('session', JSON.stringify(value))
                : await SecureStore.setItemAsync('session', JSON.stringify(value));
        } else {
            Platform.OS === 'web'
                ? localStorage.removeItem('session')
                : await SecureStore.deleteItemAsync('session');
        }
    };

    const loadSession = async () => {
        const session = Platform.OS === 'web'
            ? localStorage.getItem('session')
            : await SecureStore.getItemAsync('session');

        if (session) {
            const parsedSession = JSON.parse(session);
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedSession.accessToken}`;
            setSession(parsedSession);
        } else {
            setSession(null);
        }
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ isLoading, signIn, signOut, session, signUp }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 