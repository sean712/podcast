import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signIn, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        onClose();
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex max-h-[90vh]">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-cyan-600 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(15,23,42,0.3),transparent_50%)]" />

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/20">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              {isSignUp ? 'Start creating beautiful episode pages' : 'Welcome back to Augmented Pods'}
            </h2>
            <p className="text-cyan-50 text-lg leading-relaxed">
              {isSignUp
                ? 'Join podcast creators who are giving their listeners more than just audio.'
                : 'Access your dashboard and manage your interactive podcast pages.'}
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Automatic Episode Pages</h3>
                <p className="text-cyan-50/80 text-sm">Every episode gets its own interactive page</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Smart Features</h3>
                <p className="text-cyan-50/80 text-sm">Maps, timelines, transcripts, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Zero Maintenance</h3>
                <p className="text-cyan-50/80 text-sm">Set it and forget it - we handle everything</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="text-slate-600">
              {isSignUp ? 'Start building beautiful episode pages today' : 'Access your podcast dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Your email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your password"
              />
              {isSignUp && (
                <p className="mt-2 text-xs text-slate-500">Must be at least 6 characters</p>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3.5 rounded-lg font-semibold hover:bg-slate-900 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>{isSignUp ? 'Create Account' : 'Sign In'}</>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white text-slate-700 py-3.5 rounded-lg font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 border border-slate-300 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-slate-600"
              >
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <span className="font-semibold text-cyan-600 hover:text-cyan-700">
                  {isSignUp ? 'Sign in' : 'Register'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
