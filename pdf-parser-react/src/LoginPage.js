import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. GOOGLE SIGN-IN HANDLER ---
  const handleGoogleSignIn = async () => {
    setError('');
    try {
        await signInWithPopup(auth, googleProvider);
        // No need to redirect manually; App.js detects the auth change automatically.
    } catch (err) {
        setError(err.message);
    }
  };

  // --- 2. EMAIL/PASSWORD HANDLER ---
  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // Simplify Firebase error messages for the user
      if (err.code === 'auth/invalid-credential') {
        setError("Incorrect email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="login-page-bg">
      <div className="login-card">
        <h1 className="login-title">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="login-subtitle">Policy Analyzer Dashboard</p>

        {/* GOOGLE BUTTON */}
        <button className="google-btn" onClick={handleGoogleSignIn}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
          />
          <span>Sign in with Google</span>
        </button>

        <div className="auth-divider">
            <span>or continue with email</span>
        </div>

        {/* EMAIL FORM */}
        <form onSubmit={handleAuthAction} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@company.com" 
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="primary-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* TOGGLE LINK */}
        <p className="auth-toggle">
            {isSignUp ? "Already have an account?" : "Don't have an account yet?"}
            {' '}
            <button 
                className="toggle-link" 
                onClick={() => setIsSignUp(!isSignUp)}
            >
                {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
        </p>
      </div>
    </div>
  );
}