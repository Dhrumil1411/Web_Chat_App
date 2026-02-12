import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { database, ref, get, push, set } from '../firebase';

const Overlay = ({ children, onClose }) => (
    <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ display: 'flex' }}
    >
        <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </motion.div>
    </motion.div>
);

export function CreateGroupModal({ isOpen, onClose, currentUser, showToast }) {
    const [groupName, setGroupName] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            get(ref(database, 'users')).then((snapshot) => {
                const onlineUsers = [];
                if (snapshot.exists()) {
                    snapshot.forEach((childSnap) => {
                        const uid = childSnap.key;
                        const data = childSnap.val();
                        if (uid !== currentUser.uid && data.online) {
                            onlineUsers.push({ uid, ...data });
                        }
                    });
                }
                setUsers(onlineUsers);
                setLoading(false);
            });
        } else {
            setGroupName('');
            setSelectedUsers(new Set());
        }
    }, [isOpen, currentUser]);

    const toggleUser = (uid) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(uid)) newSet.delete(uid);
        else newSet.add(uid);
        setSelectedUsers(newSet);
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            showToast('Group name is required', 'error');
            return;
        }

        setCreating(true);
        try {
            const groupsRef = ref(database, 'groups');
            const newGroupRef = push(groupsRef);
            const groupId = newGroupRef.key;

            await set(newGroupRef, {
                groupName: groupName.trim(),
                type: 'private',
                createdAt: Date.now(),
                createdBy: currentUser.uid,
                members: { [currentUser.uid]: true }
            });

            const invitePromises = Array.from(selectedUsers).map(uid => {
                const inviteRef = push(ref(database, `invites/${uid}`));
                return set(inviteRef, {
                    groupId,
                    groupName: groupName.trim(),
                    inviterName: currentUser.displayName,
                    timestamp: Date.now()
                });
            });

            await Promise.all(invitePromises);
            showToast('Group created and invites sent!', 'success');
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to create group', 'error');
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Overlay onClose={onClose}>
            <h3>Create Private Group</h3>
            <input
                className="modal-input"
                placeholder="Enter group name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
            />

            <div className="user-selection">
                <h4>Select Members to Invite</h4>
                <div className="user-list">
                    {loading ? (
                        <p className="loading-text">Loading online users...</p>
                    ) : users.length === 0 ? (
                        <p className="empty-text">No users are currently online.</p>
                    ) : (
                        users.map(user => (
                            <div
                                key={user.uid}
                                className={`user-select-item ${selectedUsers.has(user.uid) ? 'selected' : ''}`}
                                onClick={() => toggleUser(user.uid)}
                            >
                                <img src={user.photoURL} className="user-select-avatar" alt={user.userName} />
                                <span>{user.userName}</span>
                                {selectedUsers.has(user.uid) && <Check size={16} className="text-green-500 ml-auto" />}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose} disabled={creating}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                    {creating ? 'Creating...' : 'Create & Invite'}
                </button>
            </div>
        </Overlay>
    );
}

export function AddMemberModal({ isOpen, onClose, currentUser, currentGroup, showToast }) {
    // Similar to CreateGroupModal but adds to existing group
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && currentGroup) {
            setLoading(true);
            // loads users logic...
            // Need to fetch current members first
            get(ref(database, `groups/${currentGroup.id}/members`)).then(membersSnap => {
                const members = membersSnap.val() || {};

                get(ref(database, 'users')).then((snapshot) => {
                    const eligibleUsers = [];
                    if (snapshot.exists()) {
                        snapshot.forEach((childSnap) => {
                            const uid = childSnap.key;
                            const data = childSnap.val();
                            // Not self, online, not member
                            if (uid !== currentUser.uid && data.online && !members[uid]) {
                                eligibleUsers.push({ uid, ...data });
                            }
                        });
                    }
                    setUsers(eligibleUsers);
                    setLoading(false);
                });
            });
        } else {
            setSelectedUsers(new Set());
        }
    }, [isOpen, currentUser, currentGroup]);

    const toggleUser = (uid) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(uid)) newSet.delete(uid);
        else newSet.add(uid);
        setSelectedUsers(newSet);
    };

    const handleInvite = async () => {
        if (selectedUsers.size === 0) {
            showToast("Select at least one user", "error");
            return;
        }

        setSending(true);
        try {
            const invitePromises = Array.from(selectedUsers).map(uid => {
                const inviteRef = push(ref(database, `invites/${uid}`));
                return set(inviteRef, {
                    groupId: currentGroup.id,
                    groupName: currentGroup.name, // or activeGroup.groupName
                    inviterName: currentUser.displayName,
                    timestamp: Date.now()
                });
            });

            await Promise.all(invitePromises);
            showToast('Invites sent successfully!', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to send invites', 'error');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Overlay onClose={onClose}>
            <h3>Add Members</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Invite users to <strong>{currentGroup?.name}</strong>
            </p>

            <div className="user-selection">
                <div className="user-list">
                    {loading ? (
                        <p className="loading-text">Loading...</p>
                    ) : users.length === 0 ? (
                        <p className="empty-text">No eligible users found.</p>
                    ) : (
                        users.map(user => (
                            <div
                                key={user.uid}
                                className={`user-select-item ${selectedUsers.has(user.uid) ? 'selected' : ''}`}
                                onClick={() => toggleUser(user.uid)}
                            >
                                <img src={user.photoURL} className="user-select-avatar" alt={user.userName} />
                                <span>{user.userName}</span>
                                {selectedUsers.has(user.uid) && <Check size={16} className="text-green-500 ml-auto" />}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
                <button className="btn btn-primary" onClick={handleInvite} disabled={sending}>
                    {sending ? 'Sending...' : 'Send Invites'}
                </button>
            </div>
        </Overlay>
    );
}

export function InvitesModal({ isOpen, onClose, invites, currentUser, showToast }) {
    const handleAccept = async (invite) => {
        try {
            await set(ref(database, `groups/${invite.groupId}/members/${currentUser.uid}`), true);
            await set(ref(database, `invites/${currentUser.uid}/${invite.id}`), null);
            showToast(`Joined ${invite.groupName}`, 'success');
        } catch (e) {
            showToast("Error accepting invite", 'error');
        }
    };

    const handleDecline = async (invite) => {
        try {
            await set(ref(database, `invites/${currentUser.uid}/${invite.id}`), null);
            showToast("Invite declined", 'info');
        } catch (e) {
            showToast("Error declining", 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <Overlay onClose={onClose}>
            <h3>Group Invitations</h3>
            <div className="invites-list">
                {invites.length === 0 ? (
                    <p className="empty-text">No pending invitations.</p>
                ) : (
                    invites.map(invite => (
                        <div key={invite.id} className="invite-item">
                            <div className="invite-info">
                                <span style={{ fontWeight: 600 }}>{invite.groupName}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Invited by {invite.inviterName}
                                </span>
                            </div>
                            <div className="invite-actions">
                                <button className="btn btn-sm btn-primary" onClick={() => handleAccept(invite)}>Accept</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleDecline(invite)}>Decline</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        </Overlay>
    );
}
