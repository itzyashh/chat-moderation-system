import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { User } from '../../../types';

const UserDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const { data: user, isLoading, error } = useQuery<User>({
        queryKey: ['user', id],
        queryFn: async () => {
            const response = await axios.get(`http://localhost:5001/api/users/${id}`);
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

    if (error || !user) {
        return (
            <View className="flex-1 justify-center items-center p-4">
                <Text className="text-red-500 text-center">
                    {error instanceof Error ? error.message : 'Failed to load user details'}
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="bg-white rounded-lg p-6 shadow-sm">
                <View className="items-center mb-6">
                    <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center mb-3">
                        <Text className="text-gray-600 text-2xl font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-xl font-bold text-gray-900">{user.username}</Text>
                    <Text className="text-gray-500">{user.email}</Text>
                    {user.isAdmin && (
                        <View className="mt-2 bg-indigo-100 px-3 py-1 rounded">
                            <Text className="text-indigo-600 font-medium">Admin</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    className="bg-indigo-600 py-3 px-4 rounded-lg"
                    onPress={() => {
                        // TODO: Navigate to chat screen with this user
                        router.push(`/chat/${id}`);
                    }}
                >
                    <Text className="text-white text-center font-semibold">Start Chat</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default UserDetailsScreen; 