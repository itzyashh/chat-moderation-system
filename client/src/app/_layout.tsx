import { View, Text, AppStateStatus, Platform, AppState } from 'react-native';
import React, { useEffect } from 'react';
import "../../global.css"
import { Slot, Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AuthProvider } from '../providers/AuthProvider';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReactQueryDevTools } from '@dev-plugins/react-query';

const queryClient = new QueryClient();

const CustomTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: '#fff',
        primary: '#0A0A0A'
    }
};

onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
    });
});

const RootLayout = () => {
    useReactQueryDevTools(queryClient);

    function onAppStateChange(status: AppStateStatus) {
        if (Platform.OS !== 'web') {
            focusManager.setFocused(status === 'active');
        }
    }

    useEffect(() => {
        const subscription = AppState.addEventListener('change', onAppStateChange);
        return () => subscription.remove();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider value={CustomTheme}>
                    <Slot />
                </ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default RootLayout; 