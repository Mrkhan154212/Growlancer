import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1️⃣ Check URL for OAuth errors first
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const urlParams = new URLSearchParams(
          hash.startsWith('#') ? hash.slice(1) : search.startsWith('?') ? search.slice(1) : ''
        );

        if (urlParams.get('error') || urlParams.get('error_description')) {
          const errorDesc = urlParams.get('error_description') || urlParams.get('error') || 'Authentication failed';
          if (mountedRef.current) {
            setStatus('error');
            setErrorMessage(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          }
          return;
        }

        // 2️⃣ Wait for session to be established
        // Supabase handles the OAuth code exchange in detectSessionInUrl,
        // but we need to wait for the session to be available.
        let session = null;
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            session = data.session;
            break;
          }
          // Wait 500ms between retries (max 5 seconds total)
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!session?.user) {
          if (mountedRef.current) {
            setStatus('error');
            setErrorMessage('Could not complete sign in. Please try again.');
          }
          return;
        }

        // 3️⃣ Fetch user role from profiles table (NOT from user_metadata)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        let redirectPath = '/dashboard'; // default for freelancers

        if (profileError) {
          console.warn('AuthCallback: Could not fetch profile role, defaulting to /dashboard');
        } else if (profile) {
          const role = profile.role;
          if (role === 'admin') redirectPath = '/admin';
          else if (role === 'client') redirectPath = '/client';
          else redirectPath = '/dashboard'; // freelancer or unknown
        }

        // 4️⃣ Clean URL and show success
        window.history.replaceState({}, document.title, window.location.pathname);

        if (mountedRef.current) {
          setStatus('success');
          setTimeout(() => {
            if (mountedRef.current) {
              navigate(redirectPath, { replace: true });
            }
          }, 1500);
        }

      } catch (err) {
        console.error('Auth callback error:', err);
        if (mountedRef.current) {
          setStatus('error');
          setErrorMessage('An unexpected error occurred. Please try again.');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-lg border border-slate-200 p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900 mb-2">
              Completing Sign In
            </h1>
            <p className="text-slate-500 text-sm">
              Please wait while we securely connect your account...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900 mb-2">
              Signed In Successfully!
            </h1>
            <p className="text-slate-500 text-sm">
              Redirecting you to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900 mb-2">
              Sign In Failed
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {errorMessage || 'We could not complete the sign in process.'}
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
