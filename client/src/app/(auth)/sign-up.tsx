import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useMutation } from '@tanstack/react-query';
import { signUpRequest } from '../../services/authService';
import { router, Link } from 'expo-router';
import { RegisterCredentials } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const SignUp = () => {
    const { signIn } = useAuth();
    const [username, setUsername] = useState<string>('itzyashh');
    const [email, setEmail] = useState<string>('itzyashh@gmail.com');
    const [password, setPassword] = useState<string>('123456');
    const [confirmPassword, setConfirmPassword] = useState<string>('123456');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = () => {
        const newErrors: {
            username?: string;
            email?: string;
            password?: string;
            confirmPassword?: string;
        } = {};

        if (!username) {
            newErrors.username = 'Username is required';
        } else if (username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

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

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { mutate, error, isPending } = useMutation({
        mutationFn: (credentials: RegisterCredentials) => signUpRequest(credentials),
        onSuccess: (data) => {
            if (data) {
                signIn(data.user);
                router.replace('/(protected)/(tabs)');
            }
        },
    });

    const handleSignUp = () => {
        if (validateForm()) {
            mutate({ username, email, password });
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
                        <Text className="text-4xl font-bold text-gray-900 mb-2">Create Account</Text>
                        <Text className="text-gray-600">Sign up to get started with Chat Moderation</Text>
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
                            <Text className="text-gray-700 mb-2">Username</Text>
                            <TextInput
                                placeholder="Choose a username"
                                className={`border rounded-lg px-4 py-3 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                                value={username}
                                onChangeText={(text) => {
                                    setUsername(text);
                                    if (errors.username) {
                                        setErrors({ ...errors, username: undefined });
                                    }
                                }}
                                autoCapitalize="none"
                                autoComplete="username"
                            />
                            {errors.username && (
                                <Text className="text-red-500 text-sm mt-1">{errors.username}</Text>
                            )}
                        </View>

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
                                    placeholder="Create a password"
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

                        <View>
                            <Text className="text-gray-700 mb-2">Confirm Password</Text>
                            <View className="relative">
                                <TextInput
                                    placeholder="Confirm your password"
                                    className={`border rounded-lg px-4 py-3 pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) {
                                            setErrors({ ...errors, confirmPassword: undefined });
                                        }
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-3"
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleSignUp}
                            disabled={isPending}
                            className={`bg-indigo-600 py-3 rounded-lg ${isPending ? 'opacity-70' : ''}`}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                {isPending ? 'Creating Account...' : 'Create Account'}
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center items-center mt-4">
                            <Text className="text-gray-600">Already have an account? </Text>
                            <Link href="/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text className="text-indigo-600 font-semibold">Sign In</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default SignUp; 