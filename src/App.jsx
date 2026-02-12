import { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { CreateGroupModal, AddMemberModal, InvitesModal } from './components/Modals';
import { database, ref, onValue, set, get, onDisconnect, update, off, push, query, orderByChild, onChildAdded } from './firebase';
import { AnimatePresence } from 'framer-motion';

export default function App() {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('chat_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [activeGroupId, setActiveGroupId] = useState(null);
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [invites, setInvites] = useState([]);
    const [isMobileChatActive, setIsMobileChatActive] = useState(false);

    // Modals
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isInvitesOpen, setIsInvitesOpen] = useState(false);

    // Toast
    const [toasts, setToasts] = useState([]);
    const hasAutoSelected = useRef(false);

    // Reset auto-select on user change
    useEffect(() => {
        hasAutoSelected.current = false;
    }, [currentUser]);

    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // Ensure Public Group Exists
    useEffect(() => {
        const publicRef = ref(database, 'groups/public-main');
        get(publicRef).then((snap) => {
            if (!snap.exists()) {
                set(publicRef, {
                    groupName: 'Public General',
                    type: 'public',
                    createdAt: Date.now()
                });
            }
        });
    }, []);

    // Auth & Presence
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('chat_user', JSON.stringify(currentUser));
            // Setup presence
            const userStatusRef = ref(database, 'users/' + currentUser.uid + '/online');
            const userLastOnlineRef = ref(database, 'users/' + currentUser.uid + '/lastOnline');
            const connectedRef = ref(database, '.info/connected');

            const connectedUnsub = onValue(connectedRef, (snap) => {
                if (snap.val() === true) {
                    onDisconnect(userStatusRef).set(false);
                    onDisconnect(userLastOnlineRef).set(Date.now());
                    set(userStatusRef, true);
                    update(ref(database, 'users/' + currentUser.uid), {
                        userName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                        online: true,
                        lastOnline: Date.now()
                    });
                }
            });

            return () => {
                off(connectedRef);
            }
        } else {
            localStorage.removeItem('chat_user');
        }
    }, [currentUser]);

    // Load Groups
    useEffect(() => {
        if (!currentUser) return;
        const groupsRef = ref(database, 'groups');

        const unsub = onValue(groupsRef, (snapshot) => {
            const g = [];
            snapshot.forEach(child => {
                const val = child.val();
                if (val.type === 'public' || (val.members && val.members[currentUser.uid])) {
                    g.push({ id: child.key, ...val, name: val.groupName });
                }
            });
            setGroups(g);

            // Auto select public group if no chat is active
            const publicGroup = g.find(group => group.type === 'public');
            if (publicGroup && !activeGroupId && !hasAutoSelected.current) {
                setActiveGroupId(publicGroup.id);
                hasAutoSelected.current = true;
            }
        });

        return () => off(groupsRef);
    }, [currentUser]);

    // Load Invites
    useEffect(() => {
        if (!currentUser) return;
        const invitesRef = ref(database, `invites/${currentUser.uid}`);
        const unsub = onValue(invitesRef, (snapshot) => {
            const i = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => i.push({ id: child.key, ...child.val() }));
            }
            setInvites(i);
        });
        return () => off(invitesRef);
    }, [currentUser]);

    // Load Messages
    // Load Messages using onChildAdded for better content stability
    useEffect(() => {
        if (!activeGroupId) {
            setMessages([]);
            return;
        }

        setMessages([]); // Clear on group change
        const messagesRef = ref(database, `messages/${activeGroupId}`);
        const q = query(messagesRef, orderByChild('timestamp'));

        const unsub = onChildAdded(q, (snapshot) => {
            const msg = { id: snapshot.key, ...snapshot.val() };
            setMessages(prev => {
                // Avoid duplicates just in case
                if (prev.some(m => m.id === msg.id)) return prev;
                // Append and sort
                const newMessages = [...prev, msg];
                return newMessages.sort((a, b) => a.timestamp - b.timestamp);
            });
        });

        return () => off(messagesRef);
    }, [activeGroupId]);

    const handleLogin = (user) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        if (currentUser) {
            set(ref(database, 'users/' + currentUser.uid + '/online'), false);
        }
        setCurrentUser(null);
        setActiveGroupId(null);
        setIsMobileChatActive(false);
    };

    const handleSendMessage = async (text) => {
        if (!text.trim() || !activeGroupId || !currentUser) return;

        const messagesRef = ref(database, `messages/${activeGroupId}`);
        await push(messagesRef, {
            text: text,
            uid: currentUser.uid,
            userName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            timestamp: Date.now()
        });
    };

    const handleSelectGroup = (id) => {
        setActiveGroupId(id);
        setIsMobileChatActive(true);
    };

    const activeGroup = groups.find(g => g.id === activeGroupId);

    const ToastContainer = () => (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type} showing`}>
                    <span className={`toast-icon ${t.type}`} style={{ marginRight: '8px' }}>
                        {t.type === 'success' && '✓'}
                        {t.type === 'error' && '!'}
                        {t.type === 'info' && 'i'}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    );

    if (!currentUser) {
        return (
            <div id="root">
                <Login onLogin={handleLogin} showToast={showToast} />
                <ToastContainer />
            </div>
        );
    }

    return (
        <div id="root" style={{ flexDirection: 'row' }}>
            <Sidebar
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectGroup={handleSelectGroup}
                currentUser={currentUser}
                onLogout={handleLogout}
                invitesCount={invites.length}
                onOpenInvites={() => setIsInvitesOpen(true)}
                onOpenNewGroup={() => setIsCreateGroupOpen(true)}
            />

            <div className={`chat-area ${isMobileChatActive ? 'mobile-active' : ''}`}>
                <ChatWindow
                    activeGroup={activeGroup}
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                    onBack={() => setIsMobileChatActive(false)}
                    onAddMember={() => setIsAddMemberOpen(true)}
                />
            </div>

            <AnimatePresence>
                {isCreateGroupOpen && (
                    <CreateGroupModal
                        key="create-group"
                        isOpen={isCreateGroupOpen}
                        onClose={() => setIsCreateGroupOpen(false)}
                        currentUser={currentUser}
                        showToast={showToast}
                    />
                )}
                {isAddMemberOpen && (
                    <AddMemberModal
                        key="add-member"
                        isOpen={isAddMemberOpen}
                        onClose={() => setIsAddMemberOpen(false)}
                        currentUser={currentUser}
                        currentGroup={activeGroup}
                        showToast={showToast}
                    />
                )}
                {isInvitesOpen && (
                    <InvitesModal
                        key="invites"
                        isOpen={isInvitesOpen}
                        onClose={() => setIsInvitesOpen(false)}
                        invites={invites}
                        currentUser={currentUser}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>

            <ToastContainer />
        </div>
    );
}
