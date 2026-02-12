import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Plus } from 'lucide-react';
import FaultyTerminal from './FaultyTerminal';


export default function ChatWindow({
    activeGroup,
    messages,
    currentUser,
    onSendMessage,
    onBack,
    onAddMember
}) {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = (behavior) => {
        messagesEndRef.current?.scrollIntoView({ behavior: behavior || "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        onSendMessage(inputText.trim());
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

    return (
        <main className="chat-area active-chat">
            <div className="chat-background-faulty">
                <FaultyTerminal
                    tint="#5227FF"
                    frameRate={10}
                    mouseReact={false}
                    scanlineIntensity={0.2}
                    brightness={0.8}
                />
            </div>
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
                    <button className="btn-icon-round" style={{ marginLeft: 'auto' }} title="Add Member" onClick={onAddMember}>
                        <Plus size={16} />
                    </button>
                )}
            </header>

            <div className="messages-container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'relative', zIndex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                            const isMe = msg.uid === currentUser.uid;
                            // Ensure unique keys. If msg.id missing, use timestamp + uid
                            const key = msg.id || `${msg.timestamp}-${msg.uid}`;

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
                                    {!isMe && <img src={msg.photoURL} className="msg-avatar" alt={msg.userName} />}
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

            <div className="message-input-area" style={{ position: 'relative', zIndex: 2 }}>
                <form onSubmit={handleSend}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
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
