

import { create } from 'zustand';
import { User, TabView, LeaderboardEntry, Post, Story, AuditLogEntry } from './types';
import { db, getFirebaseUserByName, createFirebaseUser, subscribeToLeaderboard, getDonorsFromFirebase, updateUserDoc, subscribeToBroadcasts, subscribeToPosts, subscribeToStories, getFirebaseUserByUid, logSystemAction, updateUserRole, subscribeToLogs, deleteAllUsersExcept } from './firebase';
import { compareFaces } from './utils/faceAuth';

const DB_KEY_USERS = 'ntr_world_users_v2'; 
const DB_KEY_COUNTER = 'ntr_world_id_counter_v2';
const SESSION_KEY = 'ntr_world_session_uid'; 

const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getLocalUsers = (): User[] => {
  const data = localStorage.getItem(DB_KEY_USERS);
  return data ? JSON.parse(data) : [];
};

const saveUserToLocal = (user: User) => {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.uid === user.uid);
  if (index >= 0) users[index] = user;
  else users.push(user);
  localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
};

const playWelcomeMessage = (name: string, role: string) => {
    if (!window.speechSynthesis) return;
    
    const speak = () => {
        const utterance = new SpeechSynthesisUtterance();
        
        if (role === 'super_admin') {
            utterance.text = `Welcome back, Super Admin ${name}. System access granted.`;
        } else {
            utterance.text = `Welcome, Admin ${name}. Panel active.`;
        }
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes("Microsoft David") || 
            v.name.includes("Google UK English Male") ||
            v.name.includes("Daniel")
        ) || voices.find(v => v.name.includes("Male") && v.lang.includes("en")) || voices.find(v => v.lang.includes("en"));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.pitch = 0.5; 
            utterance.rate = 0.9;
            utterance.volume = 1.0;
        }

        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
    } else {
        speak();
    }
};

interface AppState {
  currentUser: User | null;
  currentTab: TabView;
  isSidebarOpen: boolean;
  isLoading: boolean;
  authError: string | null;
  leaderboardCache: LeaderboardEntry[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  
  posts: Post[];
  stories: Story[];
  logs: AuditLogEntry[];
  isTigerBackgroundActive: boolean;
  latestAlert: { message: string, type: 'emergency' | 'info' } | null;

  loginUser: (username: string, password?: string) => Promise<void>;
  registerUser: (fullName: string, username: string, district: string, gender: 'male' | 'female', password: string) => Promise<void>;
  registerAdmin: (fullName: string, username: string, district: string, faceDataUrl: string) => Promise<void>;
  loginAdmin: (username: string, faceDataUrl: string) => Promise<void>;
  
  assignRole: (targetUsername: string, role: 'admin' | 'user') => Promise<boolean>;
  enrollFace: (username: string, faceDataUrl: string) => Promise<void>;
  purgeUsers: () => Promise<void>;
  
  restoreSession: () => Promise<void>;
  clearError: () => void;
  logout: () => void;
  
  setTab: (tab: TabView) => void;
  syncTab: (tab: TabView) => void;
  
  toggleSidebar: () => void;
  toggleTigerBackground: () => void;
  dismissAlert: () => void;
  
  updateDonorStatus: (status: boolean, bloodGroup: string, phone: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  fetchLeaderboard: () => void;
  searchDonors: (district: string, bloodGroup: string) => Promise<User[]>;
  initBroadcastListener: () => void;
  initFeedListener: () => void;
  initLogListener: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentTab: TabView.LANDING,
  isSidebarOpen: false,
  isLoading: true, 
  authError: null,
  leaderboardCache: [],
  isAdmin: false,
  isSuperAdmin: false,
  posts: [],
  stories: [],
  logs: [],
  isTigerBackgroundActive: true, 
  latestAlert: null,
  
  clearError: () => set({ authError: null }),
  toggleTigerBackground: () => set(state => ({ isTigerBackgroundActive: !state.isTigerBackgroundActive })),
  dismissAlert: () => set({ latestAlert: null }),

  restoreSession: async () => {
      const uid = localStorage.getItem(SESSION_KEY);
      if (!uid) { set({ isLoading: false }); return; }

      let user: User | null = null;
      if (db) { try { user = await getFirebaseUserByUid(uid); } catch(e) { console.error(e); } }
      else { user = getLocalUsers().find(u => u.uid === uid) || null; }

      if (user) {
          if (user.username.toLowerCase() === 'surya') {
              user.role = 'super_admin';
              user.fanId = 'NTR-0001';
              if (db) updateUserDoc(user.uid, { role: 'super_admin', fanId: 'NTR-0001' });
          }

          const isAdmin = user.role === 'admin' || user.role === 'super_admin';
          const isSuperAdmin = user.role === 'super_admin';
          set({ currentUser: user, currentTab: TabView.DASHBOARD, isAdmin, isSuperAdmin, isLoading: false });
          window.history.replaceState(null, '', `#${TabView.DASHBOARD}`);
      } else {
          localStorage.removeItem(SESSION_KEY);
          set({ isLoading: false });
      }
  },

  loginUser: async (username, password) => {
    set({ isLoading: true, authError: null });
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.toLowerCase() === 'surya' && password === 'Surya_1416') {
        let user: User | null = null;
        if (db) user = await getFirebaseUserByName('surya');
        
        if (!user) {
            const hashedPassword = await hashPassword(password || '');
            const newSuperAdmin: User = {
                uid: crypto.randomUUID(),
                username: 'surya',
                fullName: 'Suryachandra',
                displayName: 'Suryachandra',
                passwordHash: hashedPassword,
                fanId: 'NTR-0001',
                district: 'Hyderabad (TS)',
                gender: 'male',
                joinedAt: new Date().toISOString(),
                badges: ['Super Admin', 'Creator', 'The First Fan'],
                points: 999999,
                isDonor: false,
                role: 'super_admin',
                hasFaceAuth: false,
                avatarConfig: { style: 'transparent', top: ['shortHair'], facialHair: 'blank', accessories: 'sunglasses', hairColor: 'black' }
            };
            if(db) await createFirebaseUser(newSuperAdmin);
            user = newSuperAdmin;
        } else {
            const updates: any = {};
            if (user.fanId !== 'NTR-0001') updates.fanId = 'NTR-0001';
            if (user.role !== 'super_admin') updates.role = 'super_admin';
            
            if (Object.keys(updates).length > 0) {
                user = { ...user, ...updates };
                if(db) await updateUserDoc(user.uid, updates);
            }
        }

        localStorage.setItem(SESSION_KEY, user.uid);
        set({ currentUser: user, currentTab: TabView.DASHBOARD, isAdmin: true, isSuperAdmin: true, isLoading: false });
        playWelcomeMessage(user.displayName, 'super_admin');
        window.history.pushState(null, '', `#${TabView.DASHBOARD}`);
        return;
    }

    const hashPromise = hashPassword(password || '');
    let userPromise: Promise<User | null>;

    if (db) userPromise = getFirebaseUserByName(trimmedUsername).catch(() => null);
    else {
      const localUsers = getLocalUsers();
      const localUser = localUsers.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase()) || null;
      userPromise = Promise.resolve(localUser);
    }

    const [inputHash, user] = await Promise.all([hashPromise, userPromise]);

    if (!user) { set({ isLoading: false, authError: "User not found." }); return; }
    
    if (user.passwordHash && user.passwordHash !== inputHash) { 
        set({ isLoading: false, authError: "Incorrect Password" }); 
        return; 
    }

    localStorage.setItem(SESSION_KEY, user.uid);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isSuperAdmin = user.role === 'super_admin';
    
    set({ currentUser: user, currentTab: TabView.DASHBOARD, isLoading: false, isAdmin, isSuperAdmin });
    window.history.pushState(null, '', `#${TabView.DASHBOARD}`);
    
    if (isAdmin) {
        playWelcomeMessage(user.displayName, user.role || 'admin');
    }
  },

  registerUser: async (fullName, username, district, gender, password) => {
    set({ isLoading: true, authError: null });
    if (username.length < 4 || /\s/.test(username)) {
        set({ isLoading: false, authError: "Username: 4+ chars, no spaces." });
        return;
    }
    if (password.length < 6 || !/\d/.test(password)) {
        set({ isLoading: false, authError: "Password: 6+ chars, 1 number." });
        return;
    }
    if (fullName.length < 3) {
        set({ isLoading: false, authError: "Full Name too short." });
        return;
    }

    const hashedPassword = await hashPassword(password);
    const newUser: User = {
        uid: crypto.randomUUID(),
        username: username.trim(),
        fullName: fullName.trim(),
        displayName: username.trim(),
        passwordHash: hashedPassword,
        fanId: 'PENDING', 
        district,
        gender,
        joinedAt: new Date().toISOString(),
        badges: ['New Recruit'],
        points: 100,
        isDonor: false,
        role: 'user', 
        hasFaceAuth: false,
        avatarConfig: { style: 'transparent', top: gender === 'male' ? ['shortHair'] : ['longHair'], facialHair: 'blank', accessories: 'blank', hairColor: 'black' }
    };

    try {
        if (db) {
            const created = await createFirebaseUser(newUser);
            if (created) {
                localStorage.setItem(SESSION_KEY, created.uid);
                set({ currentUser: created, currentTab: TabView.DASHBOARD, isLoading: false });
                window.history.pushState(null, '', `#${TabView.DASHBOARD}`);
            } else {
                set({ isLoading: false, authError: "Registration Failed" });
            }
        } else {
            let counter = parseInt(localStorage.getItem(DB_KEY_COUNTER) || '0');
            counter++;
            localStorage.setItem(DB_KEY_COUNTER, counter.toString());
            newUser.fanId = `NTR-${counter.toString().padStart(4, '0')}`;
            saveUserToLocal(newUser);
            localStorage.setItem(SESSION_KEY, newUser.uid);
            set({ currentUser: newUser, currentTab: TabView.DASHBOARD, isLoading: false });
            window.history.pushState(null, '', `#${TabView.DASHBOARD}`);
        }
    } catch (e) {
        set({ isLoading: false, authError: "Registration Exception" });
    }
  },

  registerAdmin: async (fullName, username, district, faceDataUrl) => { set({ isLoading: false }); },
  enrollFace: async (username, faceDataUrl) => { set({ isLoading: false }); },
  loginAdmin: async (username, faceDataUrl) => { set({ isLoading: false }); },
  
  assignRole: async (targetUsername, role) => {
      const { currentUser } = get();
      if (!currentUser || currentUser.role !== 'super_admin') return false;
      const success = await updateUserRole(targetUsername, role);
      if (success && db) logSystemAction(currentUser.displayName, "Role Change", `Changed ${targetUsername} role to ${role}`, "system");
      return success;
  },

  purgeUsers: async () => {
      const { currentUser } = get();
      if (!currentUser || currentUser.role !== 'super_admin') return;
      if (confirm("DANGER: This will delete ALL other users. Are you sure?")) {
          const count = await deleteAllUsersExcept('surya');
          if (count !== false) {
              alert(`Success! Purged ${count} users. Only Surya remains.`);
              if (db) logSystemAction(currentUser.displayName, "DB Purge", `Deleted ${count} users.`, "security");
          }
      }
  },

  logout: () => {
      localStorage.removeItem(SESSION_KEY);
      set({ currentUser: null, currentTab: TabView.LANDING, isAdmin: false, isSuperAdmin: false });
      window.history.pushState(null, '', ' ');
  },
  
  setTab: (tab) => {
      const { currentTab } = get();
      if (currentTab !== tab) {
          window.history.pushState(null, '', `#${tab}`);
          set({ currentTab: tab, isSidebarOpen: false });
      }
  },
  syncTab: (tab) => set({ currentTab: tab, isSidebarOpen: false }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  updateDonorStatus: async (status, bloodGroup, phone) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updatedUser = { ...currentUser, isDonor: status, bloodGroup, phone, points: currentUser.points + 500 };
    set({ currentUser: updatedUser });
    if (db) await updateUserDoc(currentUser.uid, { isDonor: status, bloodGroup, phone, points: updatedUser.points });
    else saveUserToLocal(updatedUser);
  },

  updateUser: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    set({ currentUser: updated });
    if (db) await updateUserDoc(currentUser.uid, updates);
    else saveUserToLocal(updated);
  },

  fetchLeaderboard: () => {
      if (db) {
          subscribeToLeaderboard((users) => {
              const entries = users.sort((a, b) => b.points - a.points).map((u, idx) => ({
                    rank: idx + 1,
                    name: u.fullName || u.displayName,
                    fanId: u.fanId,
                    points: u.points,
                    district: u.district,
                    isDonor: u.isDonor
                }));
              set({ leaderboardCache: entries });
          });
      }
  },

  searchDonors: async (district, bloodGroup) => {
      if (db) return await getDonorsFromFirebase(district, bloodGroup);
      return [];
  },

  initBroadcastListener: () => { if (db) subscribeToBroadcasts((data) => set({ latestAlert: { message: `🚨 EMERGENCY: ${data.bloodGroup} needed in ${data.district}. ${data.message}`, type: 'emergency' } })); },
  initFeedListener: () => { if (db) { subscribeToPosts((posts) => set({ posts })); subscribeToStories((stories) => set({ stories })); } },
  initLogListener: () => { if (db) subscribeToLogs((logs) => set({ logs })); },
}));
