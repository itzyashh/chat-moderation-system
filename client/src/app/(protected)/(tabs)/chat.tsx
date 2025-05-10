import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { FontAwesome } from '@expo/vector-icons';

const ChatScreen = () => {
    return (
        <View className="flex-1 bg-gray-50 justify-center items-center p-4">
            <View className="bg-white p-6 rounded-lg shadow-sm items-center max-w-sm">
                <View className="w-16 h-16 bg-indigo-100 rounded-full justify-center items-center mb-4">
                    <FontAwesome name="comments" size={32} color="#4F46E5" />
                </View>
                <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                    No Chat Rooms Yet
                </Text>
                <Text className="text-gray-500 text-center mb-6">
                    You haven't joined any chat rooms yet. Create a new room or join an existing one to start chatting.
                </Text>
                <TouchableOpacity 
                    className="bg-indigo-600 px-6 py-3 rounded-lg"
                    onPress={() => {
                        // TODO: Navigate to create room or room list
                    }}
                >
                    <Text className="text-white font-semibold">Create Room</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ChatScreen; 