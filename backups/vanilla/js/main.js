import { auth, database, provider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously, updateProfile, ref, set, push, onChildAdded, get, child, off, update, query, orderByChild, equalTo, onValue, onDisconnect } from './firebase.js';

// DOM Elements
const app = document.getElementById('app');
const loginScreen = document.getElementById('login-screen');
const chatInterface = document.getElementById('chat-interface');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const groupsList = document.getElementById('groups-list');
const addGroupBtn = document.getElementById('add-group-btn');
const addGroupModal = document.getElementById('add-group-modal');
const confirmGroupBtn = document.getElementById('confirm-group-btn');
const cancelGroupBtn = document.getElementById('cancel-group-btn');
const newGroupNameInput = document.getElementById('new-group-name');
const userListContainer = document.getElementById('user-list');
const activeChat = document.getElementById('active-chat');
const noChatSelected = document.getElementById('no-chat-selected');
const currentGroupName = document.getElementById('current-group-name');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const backBtn = document.getElementById('back-btn');

// Login form
const usernameLoginForm = document.getElementById('username-login-form');
const loginUsernameInput = document.getElementById('login-username');

// Invites DOM
const invitesBtn = document.getElementById('invites-btn');
const invitesModal = document.getElementById('invites-modal');
const invitesList = document.getElementById('invites-list');
const closeInvitesBtn = document.getElementById('close-invites-btn');
const inviteBadge = document.getElementById('invite-badge');

// Add Member Modal DOM
const addMemberBtn = document.getElementById('add-member-btn');
const addMemberModal = document.getElementById('add-member-modal');
const addMemberUserList = document.getElementById('add-member-user-list');
const cancelAddMemberBtn = document.getElementById('cancel-add-member-btn');
const confirmAddMemberBtn = document.getElementById('confirm-add-member-btn');
const addMemberGroupName = document.getElementById('add-member-group-name');

// Utility function for HTML escaping to prevent XSS
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon"></i>
        <span>${escapeHTML(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// Notifications
const toastContainer = document.getElementById('toast-container');

// State
let currentUser = null;
let currentGroupId = null;
let currentMessagesRef = null;
let currentMessagesListener = null;
let selectedUsers = new Set(); // For invites

// Subscribe to Firebase Auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`,
            email: user.email || null
        };
        initializeAppState();
    } else {
        currentUser = null;
        showLoginScreen();
    }
});

function initializeAppState() {
    showChatInterface();
    loadUserInfo();
    loadGroups();
    listenForInvites();
    ensurePublicGroup(true);
    setupPresence();
}

function setupPresence() {
    if (!currentUser) return;

    const userStatusRef = ref(database, 'users/' + currentUser.uid + '/online');
    const userLastOnlineRef = ref(database, 'users/' + currentUser.uid + '/lastOnline');
    const connectedRef = ref(database, '.info/connected');

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            onDisconnect(userStatusRef).set(false);
            onDisconnect(userLastOnlineRef).set(Date.now());
            set(userStatusRef, true);
            updateUserInDatabase(currentUser);
        }
    });
}

function updateUserInDatabase(user) {
    const userRef = ref(database, 'users/' + user.uid);
    update(userRef, {
        userName: user.displayName,
        photoURL: user.photoURL,
        online: true,
        lastOnline: Date.now()
    });
}

function ensurePublicGroup(autoSelect = false) {
    const publicGroupRef = ref(database, 'groups/public-main');
    get(publicGroupRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(publicGroupRef, {
                groupName: 'Public General',
                type: 'public',
                createdAt: Date.now()
            }).then(() => {
                if (autoSelect) {
                    selectGroup('public-main', 'Public General');
                }
            });
        } else {
            if (autoSelect) {
                const data = snapshot.val();
                selectGroup('public-main', data.groupName);
            }
        }
    });
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    chatInterface.classList.remove('active');
}

function showChatInterface() {
    loginScreen.classList.add('hidden');
    chatInterface.classList.add('active');
}

function loadUserInfo() {
    if (!currentUser) return;
    userAvatar.src = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName)}`;
    userName.textContent = currentUser.displayName;
}

// Login Handler (Custom Username via Anonymous Firebase Auth with secure fallback)
usernameLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputName = loginUsernameInput.value.trim();

    if (!inputName) return;
    if (inputName.length > 30) {
        showToast("Username must be 30 characters or less.", "error");
        return;
    }

    // UI Feedback
    const submitBtn = usernameLoginForm.querySelector('.btn-login');
    const originalContent = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    submitBtn.style.opacity = '0.8';

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(inputName)}&background=random`;

    try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: inputName,
            photoURL: avatarUrl
        });

        currentUser = {
            uid: user.uid,
            displayName: inputName,
            photoURL: avatarUrl,
            email: null
        };

        loginUsernameInput.value = '';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        submitBtn.style.opacity = '1';

        initializeAppState();
    } catch (error) {
        console.warn("Login Notice:", error.code || error.message);

        // Fallback if Anonymous Auth is disabled in Firebase Console
        if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
            try {
                const uid = inputName.toLowerCase().replace(/\s+/g, '_');
                currentUser = {
                    uid: uid,
                    displayName: inputName,
                    photoURL: avatarUrl,
                    email: null
                };

                loginUsernameInput.value = '';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                submitBtn.style.opacity = '1';

                initializeAppState();
            } catch (fallbackErr) {
                console.error("Fallback Login Error:", fallbackErr);
                showToast("Login failed.", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                submitBtn.style.opacity = '1';
            }
        } else {
            showToast("Authentication failed: " + (error.message || "Unknown error"), "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
            submitBtn.style.opacity = '1';
        }
    }
});

logoutBtn.addEventListener('click', async () => {
    // Set offline before signing out
    if (currentUser) {
        const userStatusRef = ref(database, 'users/' + currentUser.uid + '/online');
        set(userStatusRef, false);
    }

    await signOut(auth);
    currentUser = null;

    // Reset state
    currentGroupId = null;
    if (currentMessagesRef && currentMessagesListener) {
        off(currentMessagesRef, 'child_added', currentMessagesListener);
    }
    currentMessagesRef = null;
    currentMessagesListener = null;

    messagesContainer.innerHTML = '';
    activeChat.style.display = 'none';
    noChatSelected.style.display = 'flex';
    app.classList.remove('mobile-chat-active');
    selectedUsers.clear();

    showLoginScreen();
});

// Mobile Back Button
if (backBtn) {
    backBtn.addEventListener('click', () => {
        app.classList.remove('mobile-chat-active');
        const activeItem = document.querySelector('.group-item.active');
        if (activeItem) activeItem.classList.remove('active');
    });
}

// --- Groups Management ---

function loadGroups() {
    groupsList.innerHTML = '';
    const groupsRef = ref(database, 'groups');

    off(groupsRef);

    onChildAdded(groupsRef, (snapshot) => {
        const groupKey = snapshot.key;
        const groupData = snapshot.val();

        // Filter: Show Public groups OR Private groups where user is a member
        if (groupData.type === 'public' || (groupData.members && groupData.members[currentUser.uid])) {
            renderGroupItem(groupKey, groupData);
        }
    });
}

function renderGroupItem(key, data) {
    if (document.getElementById(`group-${key}`)) return;

    const div = document.createElement('div');
    div.id = `group-${key}`;
    div.className = 'group-item';

    const name = data.groupName || 'Unnamed Group';
    const letter = escapeHTML(name.charAt(0).toUpperCase());
    const isPublic = data.type === 'public';
    const iconContent = isPublic ? '<i class="fas fa-globe"></i>' : letter;

    div.innerHTML = `
        <div class="group-icon">${iconContent}</div>
        <div class="group-details">
            <span class="group-name">${escapeHTML(name)}</span>
            <span class="group-subtitle">${isPublic ? 'Public Channel' : 'Private Group'}</span>
        </div>
    `;

    div.addEventListener('click', () => selectGroup(key, name));
    groupsList.appendChild(div);
}

// --- Create Group & Invites ---

addGroupBtn.addEventListener('click', () => {
    addGroupModal.classList.add('active');
    newGroupNameInput.focus();
    loadUsersForInvite();
});

function closeGroupModal() {
    addGroupModal.classList.remove('active');
    newGroupNameInput.value = '';
    selectedUsers.clear();
}

function loadUsersForInvite() {
    userListContainer.innerHTML = '<p class="loading-text">Loading online users...</p>';
    const usersRef = ref(database, 'users');

    // Fetch all users and filter client-side for "online" property
    get(usersRef).then((snapshot) => {
        userListContainer.innerHTML = '';
        let count = 0;

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const uid = childSnapshot.key;
                const userData = childSnapshot.val();

                // Don't list yourself
                const isSelf = uid === currentUser.uid;

                // STRICT CHECK: user must be explicitly marked as online
                const isOnline = userData.online === true;

                if (!isSelf && isOnline) {
                    renderUserSelectRow(uid, userData);
                    count++;
                }
            });
        }

        if (count === 0) {
            userListContainer.innerHTML = '<p class="empty-text">No users are currently online.</p>';
        }
    });
}

function renderUserSelectRow(uid, userData) {
    const div = document.createElement('div');
    div.className = 'user-select-item';

    const safeName = escapeHTML(userData.userName || 'User');
    const avatar = (userData.photoURL && (userData.photoURL.startsWith('http://') || userData.photoURL.startsWith('https://'))) 
        ? userData.photoURL 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.userName || 'User')}`;

    div.innerHTML = `
        <img src="${escapeHTML(avatar)}" class="user-select-avatar">
        <span>${safeName}</span>
        <span style="margin-left:auto; font-size:0.7rem; color:#4ade80;">Online</span>
        <i class="fas fa-check" style="margin-left: 10px; display: none;"></i>
    `;

    div.addEventListener('click', () => {
        if (selectedUsers.has(uid)) {
            selectedUsers.delete(uid);
            div.classList.remove('selected');
            div.querySelector('.fa-check').style.display = 'none';
        } else {
            selectedUsers.add(uid);
            div.classList.add('selected');
            div.querySelector('.fa-check').style.display = 'block';
        }
    });

    userListContainer.appendChild(div);
}

cancelGroupBtn.addEventListener('click', closeGroupModal);

confirmGroupBtn.addEventListener('click', () => {
    const name = newGroupNameInput.value.trim();

    if (!name) {
        showToast("Please enter a group name.", "error");
        return;
    }

    // Visual feedback
    const originalText = confirmGroupBtn.textContent;
    confirmGroupBtn.textContent = "Creating...";
    confirmGroupBtn.disabled = true;

    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);
    const groupId = newGroupRef.key;

    // Create Private Group
    set(newGroupRef, {
        groupName: name,
        type: 'private',
        createdAt: Date.now(),
        createdBy: currentUser.uid,
        members: {
            [currentUser.uid]: true
        }
    }).then(() => {
        console.log("Group created successfully:", groupId);

        // Send Invites
        const invitePromises = [];
        selectedUsers.forEach(uid => {
            console.log("Sending invite to:", uid);
            const inviteRef = push(ref(database, `invites/${uid}`));
            const promise = set(inviteRef, {
                groupId: groupId,
                groupName: name,
                inviterName: currentUser.displayName,
                timestamp: Date.now()
            });
            invitePromises.push(promise);
        });

        return Promise.all(invitePromises);
    }).then(() => {
        console.log("All invites sent.");
        showToast("Group created and invites sent!", "success");
        closeGroupModal();
    }).catch((error) => {
        console.error("Error creating group:", error);
        showToast("Error creating group: " + error.message, "error");
    }).finally(() => {
        confirmGroupBtn.textContent = originalText;
        confirmGroupBtn.disabled = false;
    });
});

// --- Invites Handling ---

invitesBtn.addEventListener('click', () => {
    invitesModal.classList.add('active');
    loadInvites();
});

closeInvitesBtn.addEventListener('click', () => {
    invitesModal.classList.remove('active');
});

function listenForInvites() {
    const invitesRef = ref(database, `invites/${currentUser.uid}`);
    onValue(invitesRef, (snapshot) => {
        let count = 0;
        if (snapshot.exists()) {
            count = snapshot.size;
        }
        inviteBadge.textContent = count;
        inviteBadge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function loadInvites() {
    invitesList.innerHTML = '<p class="loading-text">Loading...</p>';
    const invitesRef = ref(database, `invites/${currentUser.uid}`);

    get(invitesRef).then((snapshot) => {
        invitesList.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const inviteKey = childSnapshot.key;
                const inviteData = childSnapshot.val();
                renderInviteItem(inviteKey, inviteData);
            });
        } else {
            invitesList.innerHTML = '<p class="empty-text">No pending invitations.</p>';
        }
    });
}

function renderInviteItem(key, data) {
    const div = document.createElement('div');
    div.className = 'invite-item';

    div.innerHTML = `
        <div class="invite-info">
            <span style="font-weight: 600;">${escapeHTML(data.groupName)}</span>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Invited by ${escapeHTML(data.inviterName)}</span>
        </div>
        <div class="invite-actions">
            <button class="btn btn-sm btn-primary accept-btn">Accept</button>
            <button class="btn btn-sm btn-secondary decline-btn">Decline</button>
        </div>
    `;

    const acceptBtn = div.querySelector('.accept-btn');
    const declineBtn = div.querySelector('.decline-btn');

    acceptBtn.addEventListener('click', () => {
        // Add to group members
        const memberRef = ref(database, `groups/${data.groupId}/members/${currentUser.uid}`);
        set(memberRef, true).then(() => {
            // Remove invite
            set(ref(database, `invites/${currentUser.uid}/${key}`), null);
            // Refresh groups list or add manually
            renderGroupItem(data.groupId, { groupName: data.groupName, type: 'private' });
            div.remove();
            if (invitesList.children.length === 0) {
                invitesList.innerHTML = '<p class="empty-text">No pending invitations.</p>';
            }
        });
    });

    declineBtn.addEventListener('click', () => {
        // Simply remove invite
        set(ref(database, `invites/${currentUser.uid}/${key}`), null).then(() => {
            div.remove();
            if (invitesList.children.length === 0) {
                invitesList.innerHTML = '<p class="empty-text">No pending invitations.</p>';
            }
        });
    });

    invitesList.appendChild(div);
}

// --- Add Member Logic ---

addMemberBtn.addEventListener('click', () => {
    if (!currentGroupId) return;

    // Get group name
    const groupRef = ref(database, `groups/${currentGroupId}/groupName`);
    get(groupRef).then((snapshot) => {
        addMemberGroupName.textContent = snapshot.val() || 'Group';
    });

    addMemberModal.classList.add('active');
    loadUsersForAddMember();
});

function closeAddMemberModal() {
    addMemberModal.classList.remove('active');
    selectedUsers.clear();
}

cancelAddMemberBtn.addEventListener('click', closeAddMemberModal);

function loadUsersForAddMember() {
    addMemberUserList.innerHTML = '<p class="loading-text">Loading online users...</p>';

    // First, get current group members
    const groupMembersRef = ref(database, `groups/${currentGroupId}/members`);

    get(groupMembersRef).then((membersSnap) => {
        const currentMembers = membersSnap.exists() ? membersSnap.val() : {};

        // Then get all users
        const usersRef = ref(database, 'users');
        get(usersRef).then((snapshot) => {
            addMemberUserList.innerHTML = '';
            let count = 0;

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const uid = childSnapshot.key;
                    const userData = childSnapshot.val();

                    // conditions:
                    // 1. Not self
                    // 2. Online
                    // 3. Not already in group

                    const isSelf = uid === currentUser.uid;
                    const isOnline = userData.online === true;
                    const isMember = currentMembers.hasOwnProperty(uid);

                    if (!isSelf && isOnline && !isMember) {
                        renderUserSelectRowForAdd(uid, userData);
                        count++;
                    }
                });
            }

            if (count === 0) {
                addMemberUserList.innerHTML = '<p class="empty-text">No eligible online users found.</p>';
            }
        });
    });
}

function renderUserSelectRowForAdd(uid, userData) {
    const div = document.createElement('div');
    div.className = 'user-select-item';

    const safeName = escapeHTML(userData.userName || 'User');
    const avatar = (userData.photoURL && (userData.photoURL.startsWith('http://') || userData.photoURL.startsWith('https://')))
        ? userData.photoURL
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.userName || 'User')}`;

    div.innerHTML = `
        <img src="${escapeHTML(avatar)}" class="user-select-avatar">
        <span>${safeName}</span>
        <span style="margin-left:auto; font-size:0.7rem; color:#4ade80;">Online</span>
        <i class="fas fa-check" style="margin-left: 10px; display: none;"></i>
    `;

    div.addEventListener('click', () => {
        if (selectedUsers.has(uid)) {
            selectedUsers.delete(uid);
            div.classList.remove('selected');
            div.querySelector('.fa-check').style.display = 'none';
        } else {
            selectedUsers.add(uid);
            div.classList.add('selected');
            div.querySelector('.fa-check').style.display = 'block';
        }
    });

    addMemberUserList.appendChild(div);
}

confirmAddMemberBtn.addEventListener('click', () => {
    if (selectedUsers.size === 0) {
        showToast("Please select at least one user to invite.", "error");
        return;
    }

    const originalText = confirmAddMemberBtn.textContent;
    confirmAddMemberBtn.textContent = "Sending...";
    confirmAddMemberBtn.disabled = true;

    // Get group name first for the invite
    get(ref(database, `groups/${currentGroupId}/groupName`)).then((nameSnap) => {
        const groupName = nameSnap.val();

        const invitePromises = [];
        selectedUsers.forEach(uid => {
            const inviteRef = push(ref(database, `invites/${uid}`));
            const promise = set(inviteRef, {
                groupId: currentGroupId,
                groupName: groupName,
                inviterName: currentUser.displayName,
                timestamp: Date.now()
            });
            invitePromises.push(promise);
        });

        return Promise.all(invitePromises);
    }).then(() => {
        showToast("Invites sent successfully!", "success");
        closeAddMemberModal();
    }).catch((error) => {
        console.error("Error sending invites:", error);
        showToast("Failed to send invites.", "error");
    }).finally(() => {
        confirmAddMemberBtn.textContent = originalText;
        confirmAddMemberBtn.disabled = false;
    });
});

// --- Chat Logic ---

function selectGroup(groupId, groupName) {
    if (currentGroupId === groupId && app.classList.contains('mobile-chat-active')) return;

    const oldGroup = document.getElementById(`group-${currentGroupId}`);
    if (oldGroup) oldGroup.classList.remove('active');

    currentGroupId = groupId;

    const newGroup = document.getElementById(`group-${currentGroupId}`);
    if (newGroup) newGroup.classList.add('active');

    noChatSelected.style.display = 'none';
    activeChat.style.display = 'flex';
    currentGroupName.textContent = groupName || 'Chat';

    app.classList.add('mobile-chat-active');

    // Show/Hide Add Member Button based on group type
    const groupRef = ref(database, `groups/${groupId}`);
    get(groupRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Only show for private groups
            if (data.type === 'private') {
                addMemberBtn.style.display = 'flex';
            } else {
                addMemberBtn.style.display = 'none';
            }
        }
    });

    loadMessages(groupId);
}

function loadMessages(groupId) {
    if (currentMessagesRef && currentMessagesListener) {
        off(currentMessagesRef, 'child_added', currentMessagesListener);
    }

    messagesContainer.innerHTML = '';

    const messagesRefPath = `groups/${groupId}/chats`;
    currentMessagesRef = ref(database, messagesRefPath);

    currentMessagesListener = onChildAdded(currentMessagesRef, (snapshot) => {
        const msg = snapshot.val();
        renderMessage(msg);
        scrollToBottom();
    });
}

function renderMessage(msg) {
    const isMe = msg.uid === currentUser.uid;
    const div = document.createElement('div');
    div.className = `message ${isMe ? 'sent' : 'received'}`;

    const date = new Date(msg.timestamp || Date.now());
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rawText = msg.text || msg.message || '(No text)';
    const textContent = escapeHTML(rawText);
    const userName = escapeHTML(msg.userName || 'Unknown User');
    const rawAvatar = msg.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
    const avatarUrl = (rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://')) ? rawAvatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;

    div.innerHTML = `
        <img src="${escapeHTML(avatarUrl)}" class="msg-avatar" alt="${userName}" onerror="this.src='https://via.placeholder.com/32'">
        <div class="msg-content">
            <div class="msg-username">${userName}</div>
            <div class="msg-bubble">
                ${textContent}
            </div>
            <div class="msg-meta">
                ${timeStr}
                ${isMe ? '<i class="fas fa-check-double" style="font-size: 0.6rem;"></i>' : ''}
            </div>
        </div>
    `;

    messagesContainer.appendChild(div);
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text && currentGroupId && currentUser) {
        const messagesRefPath = `groups/${currentGroupId}/chats`;
        const newMsgRef = push(ref(database, messagesRefPath));
        set(newMsgRef, {
            text: text,
            uid: currentUser.uid,
            userName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            timestamp: Date.now()
        });
        messageInput.value = '';
        messageInput.focus();
    }
});
