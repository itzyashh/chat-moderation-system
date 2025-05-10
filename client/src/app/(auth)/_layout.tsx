import { View, ActivityIndicator } from 'react-native';
import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';

const AuthLayout = () => {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (session) {
        return <Redirect href="/(protected)/(tabs)" />;
    }

    return <Slot />;
};

export default AuthLayout; 