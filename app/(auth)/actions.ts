'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export type LoginActionState = {
    status: 'idle' | 'success' | 'failed' | 'invalid_data';
    error?: string;
};

export async function login(
    prevState: LoginActionState,
    formData: FormData,
): Promise<LoginActionState> {
    const result = authSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            status: 'invalid_data',
            error: 'Invalid email or password',
        };
    }

    const { email, password } = result.data;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            status: 'failed',
            error: error.message,
        };
    }

    return {
        status: 'success',
    };
}

export async function signup(
    prevState: LoginActionState,
    formData: FormData,
): Promise<LoginActionState> {
    const result = authSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            status: 'invalid_data',
            error: 'Invalid email or password',
        };
    }

    const { email, password } = result.data;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return {
            status: 'failed',
            error: error.message,
        };
    }

    return {
        status: 'success',
    };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
