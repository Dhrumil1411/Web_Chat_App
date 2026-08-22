import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2 } from 'lucide-react';
import { auth, database, ref, get, provider, signInWithPopup, signInAnonymously, updateProfile } from '../firebase';

export default function Login({ onLogin, showToast }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const getDeviceToken = () => {
        let token = localStorage.getItem('chat_device_token');
        if (!token) {
            token = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('chat_device_token', token);
        }
        return token;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) {
            showToast("Username cannot be empty", "error");
            return;
        }
        if (trimmed.length > 30) {
            showToast("Username must be 30 characters or less", "error");
            return;
        }

        setLoading(true);
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmed)}&background=random`;

        try {
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: trimmed,
                photoURL: avatarUrl
            });

            const currentUser = {
                uid: user.uid,
                displayName: trimmed,
                photoURL: avatarUrl,
                email: user.email || null
            };

            onLogin(currentUser);
        } catch (error) {
            console.warn("Firebase Auth Notice:", error.code || error.message);

            // Handle case where Anonymous Sign-In is disabled in Firebase Console
            if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
                try {
                    const uid = trimmed.toLowerCase().replace(/\s+/g, '_');
                    const userRef = ref(database, 'users/' + uid);
                    const snapshot = await get(userRef);
                    const deviceToken = getDeviceToken();

                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        if (userData.online === true && userData.deviceToken && userData.deviceToken !== deviceToken) {
                            showToast("This username is active on another device.", "error");
                            setLoading(false);
                            return;
                        }
                    }

                    const currentUser = {
                        uid: uid,
                        displayName: trimmed,
                        photoURL: avatarUrl,
                        email: null,
                        deviceToken: deviceToken
                    };

                    onLogin(currentUser);
                } catch (fallbackErr) {
                    console.error("Fallback login failed:", fallbackErr);
                    showToast("Login failed. Check connection.", "error");
                    setLoading(false);
                }
            } else {
                showToast("Authentication error: " + (error.message || "Unknown error"), "error");
                setLoading(false);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const currentUser = {
                uid: user.uid,
                displayName: user.displayName || 'Google User',
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`,
                email: user.email || null
            };
            onLogin(currentUser);
        } catch (error) {
            console.error("Google Auth Error:", error);
            if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
                showToast("Google Auth disabled in Firebase Console.", "error");
            } else {
                showToast("Google sign-in failed.", "error");
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <motion.div
                className="login-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="login-logo">
                    <MessageCircle size={40} />
                </div>
                <h1>Welcome</h1>
                <p>Enter your username to join safely</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="login-input"
                        placeholder="Username (max 30 chars)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={30}
                        required
                        autoComplete="off"
                        disabled={loading}
                    />
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? <><Loader2 className="animate-spin" /> Authenticating...</> : 'Get Started'}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>or</span>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Sign in with Google
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

