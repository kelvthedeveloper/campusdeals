'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleCredential = async (credential: string) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/google/', { credential });
            await login({ access: data.access, refresh: data.refresh }, data.username);
            const params = new URLSearchParams(window.location.search);
            router.push(params.get('redirect') || '/dashboard');
            router.refresh();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setError(error.response?.data?.detail || 'Google sign-up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            alert('Registration successful! Please login.');
            router.push('/auth/login');
        } catch (err: unknown) {
            const error = err as { response?: { data?: unknown } };
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Registration failed. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/">
                    <h2 className="text-center text-3xl font-extrabold text-primary mb-2">CampusDeals</h2>
                </Link>
                <h2 className="mt-6 text-center text-xl font-bold text-secondary">
                    Join the campus marketplace
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="px-8 py-10 shadow-xl border-white">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 overflow-hidden">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Pick a unique handle"
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="student@university.edu"
                        />

                        <Input
                            label="Password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Minimum 8 characters"
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Repeat password"
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full"
                                loading={loading}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </Button>
                        </div>
                    </form>

                    <div className="my-6 flex items-center gap-3 text-xs font-medium text-secondary">
                        <div className="h-px flex-1 bg-slate-200" />
                        OR
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <GoogleAuthButton mode="signup" onCredential={handleGoogleCredential} />

                    <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                        <p className="text-sm text-secondary">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="font-bold text-primary hover:underline">
                                Log in instead
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
