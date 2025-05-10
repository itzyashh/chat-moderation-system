import axios from "axios";
import { User, LoginCredentials, RegisterCredentials } from '../types';

const API_URL = 'http://localhost:5001/api';

interface AuthResponse {
    user: User;
    token: string;
}

export const signInRequest = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
    }
    
    const res = await axios.post<AuthResponse>(`${API_URL}/auth/login`, credentials);
    
    if (!res.data) {
        throw new Error('Failed to sign in');
    }
    
    return res.data;
};

export const signUpRequest = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    if (!credentials.username || !credentials.email || !credentials.password) {
        throw new Error('Username, email and password are required');
    }
    
    const res = await axios.post<AuthResponse>(`${API_URL}/auth/register`, credentials);
    if (!res.data) {
        throw new Error('Failed to sign up');
    }

    return res.data;
}; 