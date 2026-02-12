import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2 } from 'lucide-react';
import { database, ref, get } from '../firebase';

export default function Login({ onLogin, showToast }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        const inputName = username.trim();
        const uid = inputName.toLowerCase().replace(/\s+/g, '_');
        const userRef = ref(database, 'users/' + uid);

        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.online === true) {
                    showToast("This username is taken by an active user.", "error");
                    setLoading(false);
                    return;
                }
            }

            const currentUser = {
                uid: uid,
                displayName: inputName,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(inputName)}&background=random`,
                email: null
            };

            onLogin(currentUser);
        } catch (error) {
            console.error(error);
            showToast("Network error.", "error");
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
                <p>Enter your username to join</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="login-input"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="off"
                        disabled={loading}
                    />
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? <><Loader2 className="animate-spin" /> Checking...</> : 'Get Started'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
