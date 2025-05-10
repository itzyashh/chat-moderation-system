import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useMutation } from '@tanstack/react-query';
import { signInRequest } from '../../services/authService';
import { router, Link } from 'expo-router';
import { LoginCredentials } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const SignIn = () => {
    const { signIn } = useAuth();
    const [email, setEmail] = useState<string>('itzyashh@gmail.com');
    const [password, setPassword] = useState<string>('123456');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { mutate, error, isPending } = useMutation({
        mutationFn: (credentials: LoginCredentials) => signInRequest(credentials),
        onSuccess: (data) => {
            if (data) {
                signIn(data.user);
                router.replace('/(protected)/(tabs)');
            }
        },
    });

    const handleSignIn = () => {
        if (validateForm()) {
            mutate({ email, password });
        }
    };

    if (isPending) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 justify-center px-6">
                    <View className="mb-8">
                        <Text className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</Text>
                        <Text className="text-gray-600">Sign in to continue to Chat Moderation</Text>
                    </View>

                    {error && (
                        <View className="bg-red-50 p-4 rounded-lg mb-4">
                            <Text className="text-red-600 text-center">
                                {error instanceof Error ? error.message : 'An error occurred'}
                            </Text>
                        </View>
                    )}

                    <View className="gap-4">
                        <View>
                            <Text className="text-gray-700 mb-2">Email</Text>
                            <TextInput
                                placeholder="Enter your email"
                                className={`border rounded-lg px-4 py-3 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) {
                                        setErrors({ ...errors, email: undefined });
                                    }
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                            {errors.email && (
                                <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                            )}
                        </View>

                        <View>
                            <Text className="text-gray-700 mb-2">Password</Text>
                            <View className="relative">
                                <TextInput
                                    placeholder="Enter your password"
                                    className={`border rounded-lg px-4 py-3 pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) {
                                            setErrors({ ...errors, password: undefined });
                                        }
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3"
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleSignIn}
                            disabled={isPending}
                            className={`bg-indigo-600 py-3 rounded-lg ${isPending ? 'opacity-70' : ''}`}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                {isPending ? 'Signing in...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center items-center mt-4">
                            <Text className="text-gray-600">Don't have an account? </Text>
                            <Link href="/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text className="text-indigo-600 font-semibold">Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default SignIn; 