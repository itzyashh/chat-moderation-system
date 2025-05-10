// User Types
export interface User {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    isAdmin: boolean;
    warningCount: number;
    isBanned: boolean;
    lastActivity: string;
    createdAt: string;
    updatedAt: string;
    accessToken?: string;
}

export interface Session {
    user: User;
    accessToken: string;
}

// Chat Room Types
export interface ChatRoom {
    _id: string;
    name: string;
    description?: string;
    members: User[];
    moderators: User[];
    isPrivate: boolean;
    moderationLevel: 'low' | 'medium' | 'high';
    blockedUsers: User[];
    createdAt: string;
    updatedAt: string;
}

// Message Types
export interface Message {
    _id: string;
    sender: User;
    content: string;
    roomId: string;
    isFlagged: boolean;
    moderationResults?: {
        isSafe: boolean;
        reasons: string[];
        toxicityScores: Record<string, any>;
        scamDetected: boolean;
    };
    isDeleted: boolean;
    attachments?: string[];
    createdAt: string;
    updatedAt: string;
}

// Auth Types
export interface AuthResponse {
    user: User;
    accessToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
}

// Socket Event Types
export interface SocketMessage {
    messageId: string;
    roomId: string;
    message: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
}

export interface FlaggedMessage {
    messageId: string;
    reasons: string[];
    timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: string;
    status: number;
} 