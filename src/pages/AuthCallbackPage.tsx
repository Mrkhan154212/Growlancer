import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchUserProfile } from '../lib/services/authService';
import { CheckCircle2, Loader2, XCircle, Mail, KeyRound, ShieldCheck } from 'lucide-react';

type CallbackStatus = 'processing' | 'success' | 'error';
type AuthAction = 'signup' | 'recovery' | 'magiclink' | 'email_change' | 'invite' | 'reauthentication' | 'unknown';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [action, setAction] = useState<AuthAction>('unknown');

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // ── 1. Detect auth action type ──
        const typeParam = searchParams.get('type') as AuthAction | null;
        const detectedAction = typeParam || 'unknown';
        setAction(detectedAction);

        // ── 2. Check for OAuth error ──
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(
            errorDescription?.replace(/\+/g, ' ') ||
              'Authentication failed. Please try again.'
          );
          return;
        }

        // ── 3. Handle magiclink type specially (has token_hash) ──
        if (detectedAction === 'magiclink') {
          const tokenHash = searchParams.get('token_hash');
          if (tokenHash) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              type: 'magiclink',
              token_hash: tokenHash,
            });

            if (verifyError) {
              setStatus('error');
              setErrorMessage(verifyError.message);
              return;
            }
          }
        }

        // ── 4. Handle signup/email_change verification via token_hash ──
        if (detectedAction === 'signup' || detectedAction === 'email_change') {
          const tokenHash = searchParams.get('token_hash');
          if (tokenHash) {
            await supabase.auth.verifyOtp({
              type: detectedAction === 'email_change' ? 'email_change' : 'signup',
              token_hash: tokenHash,
            });
          }
        }

        // ── 5. Get the current session ──
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (!data.session?.user) {
          // No session yet — wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: retryData } = await supabase.auth.getSession();

          if (!retryData.session?.user) {
            // For signup/verification, still show success (email verified)
            if (detectedAction === 'signup' || detectedAction === 'email_change') {
              setStatus('success');
              await new Promise(resolve => setTimeout(resolve, 1500));
              if (cancelled) return;
              navigate(detectedAction === 'email_change' ? '/login' : '/login', { replace: true });
              return;
            }

            setStatus('error');
            setErrorMessage('No session found. Please try logging in again.');
            return;
          }
        }

        if (cancelled) return;

        const authUser = data.session?.user;

        // ── 6. Handle specific actions ──
        if (detectedAction === 'recovery') {
          // Password reset — stay on page, show success, redirect to reset page
          setStatus('success');
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (cancelled) return;
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        if (detectedAction === 'email_change') {
          setStatus('success');
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (cancelled) return;
          navigate('/login', { replace: true });
          return;
        }

        if (detectedAction === 'invite') {
          // User was invited — redirect to onboarding
          setStatus('success');
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (cancelled) return;
          navigate('/onboarding', { replace: true });
          return;
        }

        // ── 7. Default: redirect based on onboarding status (for OAuth signup) ──
        setStatus('success');

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (cancelled) return;

        // Retry fetching profile (AuthContext may still be syncing)
        let profile = null;
        for (let i = 0; i < 5; i++) {
          profile = authUser?.id ? await fetchUserProfile(authUser.id) : null;
          if (profile) break;
          await new Promise(r => setTimeout(r, 600));
        }

        if (profile && !profile.onboardingCompleted) {
          navigate('/onboarding?mode=oauth', { replace: true });
        } else if (profile) {
          const dashboardRoute =
            profile.role === 'client'
              ? '/client'
              : profile.role === 'admin'
                ? '/admin'
                : '/dashboard';
          navigate(dashboardRoute, { replace: true });
        } else {
          navigate('/onboarding?mode=oauth', { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred. Please try again.'
          );
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  const actionIcons: Record<AuthAction, React.ReactNode> = {
    signup: <Mail className="w-8 h-8 text-emerald-600" />,
    recovery: <KeyRound className="w-8 h-8 text-emerald-600" />,
    magiclink: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
    email_change: <Mail className="w-8 h-8 text-emerald-600" />,
    invite: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
    reauthentication: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
    unknown: <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />,
  };

  const actionTitles: Record<AuthAction, string> = {
    signup: 'Email verified successfully!',
    recovery: 'Password reset link verified!',
    magiclink: 'Signing you in...',
    email_change: 'Email updated successfully!',
    invite: 'Welcome to Growlancer!',
    reauthentication: 'Identity verified!',
    unknown: 'Processing...',
  };

  const actionDescriptions: Record<AuthAction, string> = {
    signup: 'Your email has been confirmed. Redirecting to login...',
    recovery: 'Redirecting you to set a new password...',
    magiclink: 'You will be signed in automatically...',
    email_change: 'Your email has been changed. Redirecting to login...',
    invite: 'Setting up your account. Redirecting to onboarding...',
    reauthentication: 'Your identity has been verified.',
    unknown: 'Please wait while we process your request...',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/Growlancer Logo (2).png"
              alt="Growlancer"
              className="h-12 w-12 rounded-xl"
            />
          </div>

          {status === 'processing' && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                {actionTitles[action]}
              </h2>
              <p className="text-sm text-slate-500">
                {actionDescriptions[action]}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                {actionTitles[action]}
              </h2>
              <p className="text-sm text-slate-500">
                {actionDescriptions[action]}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                Authentication failed
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>
              <button
                onClick={() => navigate('/?modal=login', { replace: true })}
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
