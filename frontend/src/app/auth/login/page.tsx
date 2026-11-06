'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const finishLogin = () => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/dashboard';
        router.push(redirect);
        router.refresh();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login/', formData);
            await login({ access: data.access, refresh: data.refresh }, formData.username);
            finishLogin();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credential: string) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/google/', { credential });
            await login({ access: data.access, refresh: data.refresh }, data.username);
            finishLogin();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setError(error.response?.data?.detail || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/">
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold text-primary mb-2">Welcome Back</h1>
                        <p className="text-secondary text-sm">Sign in to access your campus deals &amp; auctions.</p>
                    </div>
                </Link>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="px-8 py-10 shadow-xl border-white">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                                {error}
                            </div>
                        )}
                        <Input
                            label="Email or Username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Enter your email or username"
                        />

                        <Input
                            label="Password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-action focus:ring-action border-slate-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="#" className="font-medium text-action hover:text-blue-700 transition">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            loading={loading}
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign in
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-3 text-xs font-medium text-secondary">
                        <div className="h-px flex-1 bg-slate-200" />
                        OR
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <GoogleAuthButton mode="login" onCredential={handleGoogleCredential} />

                    <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                        <p className="text-sm text-secondary">
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/register" className="font-bold text-primary hover:underline">
                                Register as a student
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
