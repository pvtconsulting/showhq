/**
 * AuthPage — Login / Sign-up screen for ShowHQ.
 *
 * Supports email + password and magic link.
 * Shown when user is not authenticated.
 */
import { useState, useCallback } from "react";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { signIn, signUp, signInWithMagicLink, signInWithGoogle } from "../shared/supabase.js";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'magic'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // OAuth redirects away — loading stays true until redirect completes
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        if (mode === "magic") {
          const { error: err } = await signInWithMagicLink(email);
          if (err) throw err;
          setSuccess("Check your email for a sign-in link.");
        } else if (mode === "login") {
          const { error: err } = await signIn(email, password);
          if (err) throw err;
          // Auth state change will handle the redirect
        } else {
          const { error: err } = await signUp(email, password, fullName);
          if (err) throw err;
          setSuccess("Account created! Check your email to confirm.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, fullName],
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-shell-bg px-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">ShowHQ</h1>
          <p className="text-sm text-gray-500 mt-1">Production management platform</p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-medium text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          {mode !== "magic" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === "login" && "Sign in"}
                {mode === "register" && "Create account"}
                {mode === "magic" && "Send magic link"}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Mode switchers */}
        <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
          {mode === "login" && (
            <>
              <button onClick={() => { setMode("magic"); setError(""); setSuccess(""); }} className="hover:text-brand-600 transition-colors block w-full">
                Sign in with magic link instead
              </button>
              <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }} className="hover:text-brand-600 transition-colors block w-full">
                Don't have an account? <span className="font-medium text-brand-600">Sign up</span>
              </button>
            </>
          )}
          {mode === "register" && (
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="hover:text-brand-600 transition-colors">
              Already have an account? <span className="font-medium text-brand-600">Sign in</span>
            </button>
          )}
          {mode === "magic" && (
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="hover:text-brand-600 transition-colors">
              Back to password sign-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
