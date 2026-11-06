'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

interface GoogleCredentialResponse {
    credential: string;
}

interface GoogleAuthButtonProps {
    mode: 'login' | 'signup';
    onCredential: (credential: string) => void;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (options: {
                        client_id: string;
                        callback: (response: GoogleCredentialResponse) => void;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            theme: 'outline';
                            size: 'large';
                            text: 'signin_with' | 'signup_with';
                            shape: 'rectangular';
                            width: number;
                        }
                    ) => void;
                };
            };
        };
    }
}

export default function GoogleAuthButton({ mode, onCredential }: GoogleAuthButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const onCredentialRef = useRef(onCredential);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        onCredentialRef.current = onCredential;
    }, [onCredential]);

    const renderGoogleButton = useCallback(() => {
        const googleIdentity = window.google?.accounts.id;
        const button = buttonRef.current;
        if (!clientId || !googleIdentity || !button) return;

        googleIdentity.initialize({
            client_id: clientId,
            callback: (response) => {
                if (response.credential) {
                    onCredentialRef.current(response.credential);
                }
            },
        });
        button.replaceChildren();
        googleIdentity.renderButton(button, {
            theme: 'outline',
            size: 'large',
            text: mode === 'login' ? 'signin_with' : 'signup_with',
            shape: 'rectangular',
            width: 280,
        });
    }, [clientId, mode]);

    return (
        <div className="space-y-3">
            {clientId ? (
                <>
                    <Script
                        src="https://accounts.google.com/gsi/client"
                        strategy="afterInteractive"
                        onReady={renderGoogleButton}
                    />
                    <div className="flex justify-center" ref={buttonRef} />
                </>
            ) : (
                <p className="text-center text-xs text-secondary">
                    Google sign-in is not configured for this app.
                </p>
            )}
        </div>
    );
}
