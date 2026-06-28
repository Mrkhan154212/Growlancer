import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { Lock, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReauthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function ReauthDialog({
  isOpen,
  onClose,
  onVerified,
  title = 'Verify your identity',
  description = 'For security, please re-enter your password to continue.',
}: ReauthDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sendMethod, setSendMethod] = useState<'password' | 'reauth_email'>('password');

  const handleReauthEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: reauthError } = await supabase.auth.reauthenticate();
      if (reauthError) {
        setError(reauthError.message);
      } else {
        setSuccess(true);
        // Wait for user to click the link in their email
        setSendMethod('reauth_email');
      }
    } catch {
      setError('Failed to send reauthentication email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify by attempting to sign in again (reauth)
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.email) {
        setError('Unable to verify identity. Try logging in again.');
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password,
      });

      if (signInError) {
        setError('Incorrect password. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    setSuccess(false);
    setSendMethod('password');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="relative animate-fade-in-content">
        {/* Shield Icon */}
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
        </div>

        <p className="text-sm text-slate-500 text-center mb-5">
          {description}
        </p>

        {/* Success State */}
        {success ? (
          <div className="text-center animate-fade-in">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            {sendMethod === 'reauth_email' ? (
              <>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  Verification email sent
                </p>
                <p className="text-xs text-slate-500">
                  Check your inbox and click the verification link to confirm your identity.
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-900">
                Identity verified successfully!
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Password Reauthentication */}
            {sendMethod === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reauth-password"
                    className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1"
                  >
                    Current Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      id="reauth-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your current password"
                      className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl outline-none transition-all text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span>Verifying...</span>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    'Verify Identity'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleReauthEmail}
                    className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                  >
                    Send verification email instead
                  </button>
                </div>
              </form>
            )}

            {/* Email Reauthentication */}
            {sendMethod === 'reauth_email' && (
              <div className="text-center">
                <button
                  onClick={handleReauthEmail}
                  disabled={loading}
                  className="w-full h-11 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span>Sending...</span>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Send Verification Email
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSendMethod('password')}
                  className="mt-3 text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Use password instead
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
