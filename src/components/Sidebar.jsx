import { motion } from 'framer-motion';
import { LogOut, Plus, Mail, Globe, Hash } from 'lucide-react';

export default function Sidebar({
    groups,
    activeGroupId,
    onSelectGroup,
    currentUser,
    onLogout,
    invitesCount,
    onOpenInvites,
    onOpenNewGroup
}) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="user-profile-preview" title="My Profile">
                    <img src={currentUser.photoURL} alt="Profile" className="user-avatar" />
                    <div className="user-info">
                        <span className="user-name">{currentUser.displayName}</span>
                        <span className="user-status">Online</span>
                    </div>
                </div>
            </div>

            <div className="sidebar-actions">
                <span className="section-title">Groups</span>
                <div className="action-buttons">
                    <button className="btn-icon-round" title="Invites" onClick={onOpenInvites}
                        style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                        <Mail size={16} />
                        {invitesCount > 0 && <span className="badge">{invitesCount}</span>}
                    </button>
                    <button className="btn-icon-round" title="New Group" onClick={onOpenNewGroup}>
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="groups-list">
                {groups.map(group => (
                    <motion.div
                        key={group.id}
                        className={`group-item ${activeGroupId === group.id ? 'active' : ''}`}
                        onClick={() => onSelectGroup(group.id, group.name)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                    >
                        <div className="group-icon">
                            {group.type === 'public' ? <Globe size={20} /> : (group.groupName || group.name).charAt(0).toUpperCase()}
                        </div>
                        <div className="group-details">
                            <span className="group-name">{group.groupName || group.name}</span>
                            <span className="group-subtitle">{group.type === 'public' ? 'Public Channel' : 'Private Group'}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="logout-container">
                <button className="btn-logout" onClick={onLogout}>
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </aside>
    );
}
