import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { User } from '../../../types';

interface ChatPreview {
    user: User;
    lastMessage: {
        content: string;
        createdAt: string;
    };
    unreadCount?: number;
}

const ChatScreen = () => {
    const router = useRouter();
    const { session } = useAuth();

    const { data: chats, isLoading, error } = useQuery<ChatPreview[]>({
        queryKey: ['chats'],
        queryFn: async () => {
            const response = await axios.get('http://localhost:5001/api/chat/conversations');
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center p-4">
                <Text className="text-red-500 text-center">
                    {error instanceof Error ? error.message : 'Failed to load chats'}
                </Text>
            </View>
        );
    }

    if (!chats?.length) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center p-4">
                <View className="bg-white p-6 rounded-lg shadow-sm items-center max-w-sm">
                    <View className="w-16 h-16 bg-indigo-100 rounded-full justify-center items-center mb-4">
                        <FontAwesome name="comments" size={32} color="#4F46E5" />
                    </View>
                    <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                        No Conversations Yet
                    </Text>
                    <Text className="text-gray-500 text-center mb-6">
                        Start chatting with other users to see your conversations here.
                    </Text>
                    <TouchableOpacity 
                        className="bg-indigo-600 px-6 py-3 rounded-lg"
                        onPress={() => router.push('/(protected)/(tabs)/users')}
                    >
                        <Text className="text-white font-semibold">Find Users</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderChatPreview = ({ item }: { item: ChatPreview }) => (
        <TouchableOpacity 
            className="bg-white p-4 border-b border-gray-200"
            onPress={() => router.push(`/chat/${item.user._id}`)}
        >
            <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-gray-200 justify-center items-center mr-4">
                    <Text className="text-gray-600 font-semibold">
                        {item.user.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-semibold text-gray-900">{item.user.username}</Text>
                        <Text className="text-xs text-gray-500">
                            {new Date(item.lastMessage.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500 text-sm" numberOfLines={1}>
                            {item.lastMessage.content}
                        </Text>
                        {item.unreadCount ? (
                            <View className="bg-indigo-500 rounded-full w-6 h-6 justify-center items-center">
                                <Text className="text-white text-xs font-medium">
                                    {item.unreadCount}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={chats}
                renderItem={renderChatPreview}
                keyExtractor={(item) => item.user._id}
            />
        </View>
    );
};

export default ChatScreen; 