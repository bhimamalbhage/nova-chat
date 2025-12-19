'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { signup, type LoginActionState } from '../actions';

export default function Page() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [isSuccessful, setIsSuccessful] = useState(false);

    const [state, formAction] = useActionState<LoginActionState, FormData>(
        signup,
        {
            status: 'idle',
        }
    );

    useEffect(() => {
        if (state.status === 'failed') {
            toast({
                type: 'error',
                description: state.error || 'Failed to create account!',
            });
            setIsSuccessful(false);
        } else if (state.status === 'invalid_data') {
            toast({
                type: 'error',
                description: 'Failed validating your submission!',
            });
            setIsSuccessful(false);
        } else if (state.status === 'success') {
            setIsSuccessful(true);
            toast({
                type: 'success',
                description: 'Account created! Please check your email to confirm.',
            });
            // Maybe redirect to login or show success message
            // router.push('/login'); 
        }
    }, [state, router]);

    const handleSubmit = (formData: FormData) => {
        setEmail(formData.get('email') as string);
        formAction(formData);
    };

    return (
        <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
            <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
                <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
                    <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Create an account to get started
                    </p>
                </div>
                <AuthForm action={handleSubmit} defaultEmail={email}>
                    <SubmitButton isSuccessful={isSuccessful}>Sign up</SubmitButton>
                    <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
                        {"Already have an account? "}
                        <Link
                            href="/login"
                            className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                        >
                            Sign in
                        </Link>
                    </p>
                </AuthForm>
            </div>
        </div>
    );
}
