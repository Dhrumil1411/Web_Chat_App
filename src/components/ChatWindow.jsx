import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';


export default function ChatWindow({
    activeGroup,
    messages,
    currentUser,
    onSendMessage,
    onBack,
    onAddMember,
    onEditGroup,
    onDeleteGroup
}) {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);
    const lastSendRef = useRef(0);

    const scrollToBottom = (behavior) => {
        messagesEndRef.current?.scrollIntoView({ behavior: behavior || "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getSafeAvatar = (url, name) => {
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/'))) {
            return url;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`;
    };

    const handleSend = (e) => {
        e.preventDefault();
        const trimmed = inputText.trim();
        if (!trimmed) return;

        const now = Date.now();
        if (now - lastSendRef.current < 400) {
            return; // Rate limit: ignore rapid submissions < 400ms
        }
        lastSendRef.current = now;

        onSendMessage(trimmed);
        setInputText('');
    };

    if (!activeGroup) {
        return (
            <main className="chat-area empty-state">
                <div className="empty-illustration">
                    <Send size={64} style={{ transform: 'rotate(-45deg)', marginLeft: '-10px' }} />
                </div>
                <h2>Start a Conversation</h2>
                <p>Select a group from the sidebar to begin chatting.</p>
            </main>
        );
    }

    const isCreator = activeGroup.createdBy === currentUser.uid;

    return (
        <main className="chat-area active-chat">
            <header className="chat-header">
                <div className="chat-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn-back mobile-only" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="chat-header-info">
                        <h2>{activeGroup.groupName || activeGroup.name}</h2>
                        <p>Active Now</p>
                    </div>
                </div>
                {activeGroup.type === 'private' && (
                    <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                        {isCreator && (
                            <>
                                <button className="btn-icon-round btn-icon-subtle" title="Edit Group Name" onClick={onEditGroup}>
                                    <Pencil size={14} />
                                </button>
                                <button className="btn-icon-round btn-icon-danger" title="Delete Group" onClick={onDeleteGroup}>
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                        <button className="btn-icon-round" title="Add Member" onClick={onAddMember}>
                            <Plus size={16} />
                        </button>
                    </div>
                )}
            </header>

            <div className="messages-container">
                <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                            const isMe = msg.uid === currentUser.uid;
                            const key = msg.id || `${msg.timestamp}-${msg.uid}`;
                            const avatar = getSafeAvatar(msg.photoURL, msg.userName);

                            return (
                                <motion.div
                                    key={key}
                                    className={`message ${isMe ? 'sent' : 'received'}`}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-20px" }}
                                    transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                                    layout
                                >
                                    {!isMe && <img src={avatar} className="msg-avatar" alt={msg.userName || 'User'} />}
                                    <div className="msg-content">
                                        {!isMe && <div className="msg-username">{msg.userName}</div>}
                                        <div className="msg-bubble">
                                            {msg.text || msg.message}
                                        </div>
                                        <div className="msg-meta">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="message-input-area">
                <form onSubmit={handleSend}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Type a message (max 1000 chars)..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        maxLength={1000}
                    />
                    <motion.button
                        type="submit"
                        className="btn-send"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Send size={20} />
                    </motion.button>
                </form>
            </div>
        </main>
    );
}
