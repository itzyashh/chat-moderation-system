import { View, ActivityIndicator } from 'react-native';
import React from 'react';
import { Redirect, Slot, Stack } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';

const ProtectedLayout = () => {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (!session) {
        return <Redirect href="/sign-in" />;
    }

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
};

export default ProtectedLayout; 