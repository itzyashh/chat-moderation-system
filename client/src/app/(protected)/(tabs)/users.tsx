import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { User } from '../../../types';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

const UsersScreen = () => {

    const { session } = useAuth();
    const router = useRouter();

    const { data: users, isLoading, error } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            console.log('token', axios.defaults.headers.common['Authorization']);
            const response = await axios.get('http://localhost:5001/api/users');
            //filter out the current user
            const filteredUsers = response.data.filter((user: User) => user._id !== session?.user._id);
            return filteredUsers;
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
                    {error instanceof Error ? error.message : 'Failed to load users'}
                </Text>
            </View>
        );
    }

    const renderUser = ({ item }: { item: User }) => (
        <TouchableOpacity 
            className="bg-white p-4 border-b border-gray-200"
            onPress={() => {
                router.push(`/user/${item._id}`);
            }}
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center mr-3">
                    <Text className="text-gray-600 font-semibold">
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View>
                    <Text className="text-gray-900 font-semibold">{item.username}</Text>
                    <Text className="text-gray-500 text-sm">{item.email}</Text>
                </View>
                {item.isAdmin && (
                    <View className="ml-auto bg-indigo-100 px-2 py-1 rounded">
                        <Text className="text-indigo-600 text-xs font-medium">Admin</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center p-4">
                        <Text className="text-gray-500">No users found</Text>
                    </View>
                }
            />
        </View>
    );
};

export default UsersScreen; 