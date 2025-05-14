import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { User } from '../../../types';
import io  from 'socket.io-client';

interface Message {
    _id?: string;
    content: string;
    sender: User;
    createdAt: string;
    tempId?: string;
}

const SOCKET_URL = 'http://localhost:5001';

const ChatScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { session } = useAuth();
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const flatListRef = useRef<FlatList>(null);

    // Fetch user details
    const { data: user, isLoading: userLoading } = useQuery<User>({
        queryKey: ['user', id],
        queryFn: async () => {
            const response = await axios.get(`http://localhost:5001/api/users/${id}`);
            return response.data;
        }
    });

    // Fetch chat messages (initial load only)
    useEffect(() => {
        let isMounted = true;
        axios.get(`http://localhost:5001/api/chat/messages/${id}`)
            .then(res => {
                if (isMounted) {
                    // Sort messages from oldest to newest
                    setMessages(res.data.sort((a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
                }
            });
        return () => { isMounted = false; };
    }, [id]);

    // Socket setup
    useEffect(() => {
        if (!session?.user?._id) return;
        const s = io(SOCKET_URL, { transports: ['websocket'] });
        setSocket(s);
        s.emit('register_user', session.user._id);
        s.on('receive_direct_message', (msg: any) => {
            if (
                session?.user &&
                ((msg.senderId === session.user._id && msg.recipientId === id) ||
                (msg.senderId === id && msg.recipientId === session.user._id))
            ) {
                setMessages(prev => {
                    // If we have an optimistic message with the same tempId, replace it
                    if (msg.tempId && prev.some(m => m.tempId === msg.tempId)) {
                        return prev.map(m =>
                            m.tempId === msg.tempId
                                ? {
                                    content: msg.message,
                                    sender: msg.senderId === session.user._id ? session.user : (user ?? { _id: '', username: '', email: '', isAdmin: false, warningCount: 0, isBanned: false, lastActivity: '', createdAt: '', updatedAt: '' }),
                                    createdAt: msg.timestamp,
                                    tempId: msg.tempId
                                }
                                : m
                        );
                    }
                    // Otherwise, add if not already present (by timestamp and sender)
                    if (prev.some(m => m.createdAt === msg.timestamp && m.sender._id === msg.senderId)) {
                        return prev;
                    }
                    return [
                        ...prev,
                        {
                            content: msg.message,
                            sender: msg.senderId === session.user._id ? session.user : (user ?? { _id: '', username: '', email: '', isAdmin: false, warningCount: 0, isBanned: false, lastActivity: '', createdAt: '', updatedAt: '' }),
                            createdAt: msg.timestamp,
                            tempId: msg.tempId
                        } as Message
                    ];
                });
            }
        });
        s.on('message_flagged', (data: any) => {
            Alert.alert('Message Flagged', data.reasons?.join(', ') || 'Your message was flagged.');
            // Optionally remove the optimistically added message
            setMessages(prev => prev.filter(m => m.tempId !== data.tempId));
        });
        return () => {
            s.disconnect();
        };
    }, [session?.user?._id, id, user]);

    const handleSendMessage = () => {
        if (!message.trim() || !socket || !session?.user) return;
        const tempId = `temp-${Date.now()}`;
        // Optimistically add message
        setMessages(prev => [
            ...prev,
            {
                content: message.trim(),
                sender: session.user,
                createdAt: new Date().toISOString(),
                tempId
            }
        ]);
        socket.emit('send_direct_message', {
            senderId: session.user._id,
            recipientId: id,
            message: message.trim(),
            tempId
        });
        setMessage('');
    };

    if (userLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Loading user...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>User not found</Text>
            </View>
        );
    }

    const renderMessage = ({ item }: { item: Message }) => (
        <View 
            className={`p-3 rounded-lg mb-2 max-w-[80%] ${
                item.sender._id === session?.user._id 
                    ? 'bg-indigo-500 self-end' 
                    : 'bg-gray-200 self-start'
            }`}
        >
            <Text 
                className={
                    item.sender._id === session?.user._id 
                        ? 'text-white' 
                        : 'text-gray-800'
                }
            >
                {item.content}
            </Text>
            <Text 
                className={`text-xs mt-1 ${
                    item.sender._id === session?.user._id 
                        ? 'text-indigo-200' 
                        : 'text-gray-500'
                }`}
            >
                {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <View className="flex-1">
                {/* Header */}
                <View className="p-4 border-b border-gray-200 flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="mr-4"
                    >
                        <Text className="text-indigo-600">Back</Text>
                    </TouchableOpacity>
                    <View>
                        <Text className="font-semibold text-lg">{user.username}</Text>
                        <Text className="text-gray-500 text-sm">
                            {user.isAdmin ? 'Admin' : 'User'}
                        </Text>
                    </View>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, idx) => item._id || item.tempId || idx.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center py-8">
                            <Text className="text-gray-500">No messages yet</Text>
                            <Text className="text-gray-500">Start the conversation!</Text>
                        </View>
                    }
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Message Input */}
                <View className="p-4 border-t border-gray-200 flex-row items-center">
                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                        placeholder="Type a message..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!message.trim()}
                        className={`rounded-full p-2 ${
                            !message.trim()
                                ? 'bg-gray-300'
                                : 'bg-indigo-500'
                        }`}
                    >
                        <Text className="text-white px-4">Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatScreen; 