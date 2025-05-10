import { View, Text, Button } from 'react-native';
import React from 'react';
import { useAuth } from '../../../providers/AuthProvider';

const HomeScreen = () => {
    const { signOut, session } = useAuth();

    return (
        <View className="flex-1 justify-center items-center gap-4">
            <Text className="text-2xl">Welcome, {session?.user.username}!</Text>
            <Button title="Sign Out" onPress={signOut} />
        </View>
    );
};

export default HomeScreen; 