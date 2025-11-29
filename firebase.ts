
import { initializeApp } from 'firebase/app';
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, runTransaction, collection, query, where, getDocs, onSnapshot, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { User, Post, Story, Comment, ReactionType, AuditLogEntry } from './types';

// ==========================================
// 🔴 PASTE YOUR KEYS INSIDE THIS BOX
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBX84zgs-Yw8VEFGiEgsIpP2JxvkNKx3a0",
  authDomain: "ntr-ultimate.firebaseapp.com",
  projectId: "ntr-ultimate",
  storageBucket: "ntr-ultimate.firebasestorage.app",
  messagingSenderId: "258938659324",
  appId: "1:258938659324:web:1eef966a7b744cb52f1279",
  measurementId: "G-YQW6SC1TW2"
};
// ==========================================

// Initialize Firebase
let db: any = null;

// Check if keys are replaced
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE") {
  try {
    const app = firebaseApp.initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ FIREBASE: Connected Successfully");
  } catch (e) {
    console.error("❌ FIREBASE: Connection Failed", e);
  }
} else {
  console.warn("⚠️ FIREBASE: API Keys missing. App is running in Local/Offline Mode.");
}

export { db };

// --- LOGGING SYSTEM ---

export const logSystemAction = async (adminName: string, action: string, details: string, type: 'content' | 'security' | 'system') => {
    if (!db) return;
    try {
        await addDoc(collection(db, "logs"), {
            adminName,
            action,
            details,
            type,
            timestamp: new Date().toISOString()
        });
    } catch(e) { console.error("Log failed", e); }
};

export const subscribeToLogs = (callback: (logs: AuditLogEntry[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot: any) => {
        const logs: AuditLogEntry[] = [];
        snapshot.forEach((doc: any) => logs.push({ id: doc.id, ...doc.data() }));
        callback(logs);
    });
};

// --- USER MANAGEMENT ---

export const getFirebaseUserByName = async (name: string): Promise<User | null> => {
  if (!db) return null;
  // OPTIMIZATION: Added limit(1) to stop scanning immediately after finding the user
  const q = query(collection(db, "users"), where("displayName", "==", name), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as User;
  }
  return null;
};

export const getFirebaseUserByUid = async (uid: string): Promise<User | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
  } catch (e) {
    console.error("Error fetching user by UID:", e);
  }
  return null;
};

export const updateUserRole = async (username: string, newRole: 'user' | 'admin') => {
    if (!db) return false;
    const user = await getFirebaseUserByName(username);
    if (!user) return false;
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { role: newRole });
    return true;
};

export const createFirebaseUser = async (user: User): Promise<User | null> => {
  if (!db) return null;
  try {
    const newUser = await runTransaction(db, async (transaction: any) => {
      const counterRef = doc(db, "system", "counters");
      const counterDoc = await transaction.get(counterRef);

      let nextId = 1;
      if (counterDoc.exists()) {
        nextId = counterDoc.data().currentFanId + 1;
      }

      const fanId = `NTR-${nextId.toString().padStart(4, '0')}`;
      const finalUser = { ...user, fanId };

      transaction.set(counterRef, { currentFanId: nextId });
      transaction.set(doc(db, "users", finalUser.uid), finalUser);
      return finalUser;
    });
    return newUser;
  } catch (e: any) {
    console.error("❌ Transaction failed: ", e);
    return null;
  }
};

export const updateUserDoc = async (uid: string, updates: Partial<User>) => {
  if (!db) return;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
};

export const subscribeToLeaderboard = (callback: (data: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, "users"));
    return onSnapshot(q, (snapshot: any) => {
        const users: any[] = [];
        snapshot.forEach((doc: any) => users.push(doc.data()));
        callback(users);
    });
};

export const getDonorsFromFirebase = async (district: string, bloodGroup: string): Promise<User[]> => {
  if (!db) return [];
  const q = query(collection(db, "users"), 
    where("isDonor", "==", true),
    where("district", "==", district),
    where("bloodGroup", "==", bloodGroup)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as User);
};

// --- EMERGENCY BROADCAST SYSTEM ---

export const broadcastEmergency = async (message: string, district: string, bloodGroup: string) => {
  if (!db) return;
  await addDoc(collection(db, "broadcasts"), {
    message,
    district,
    bloodGroup,
    timestamp: new Date().toISOString(),
    active: true
  });
};

export const subscribeToBroadcasts = (callback: (alert: any) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(1));
  return onSnapshot(q, (snapshot: any) => {
     snapshot.docChanges().forEach((change: any) => {
        if (change.type === "added") {
           const data = change.doc.data();
           const alertTime = new Date(data.timestamp).getTime();
           if (Date.now() - alertTime < 30000) {
               callback(data);
           }
        }
     });
  });
};

// --- CONTENT SYSTEM (POSTS & STORIES) ---

// Subscribe to Posts Feed
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(q, (snapshot: any) => {
    const posts: Post[] = [];
    snapshot.forEach((doc: any) => posts.push({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
};

// Subscribe to Stories (Only valid ones)
export const subscribeToStories = (callback: (stories: Story[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, "stories"), orderBy("createdAt", "desc")); 
  
  return onSnapshot(q, (snapshot: any) => {
    const stories: Story[] = [];
    snapshot.forEach((doc: any) => {
        const data = doc.data() as Story;
        if (new Date(data.expiresAt) > new Date()) {
             stories.push({ id: doc.id, ...data });
        }
    });
    callback(stories);
  });
};

// Subscribe to Comments for a Post
export const subscribeToComments = (postId: string, callback: (comments: Comment[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, `posts/${postId}/comments`), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot: any) => {
        const comments: Comment[] = [];
        snapshot.forEach((doc: any) => comments.push({ id: doc.id, ...doc.data() }));
        callback(comments);
    });
};

// ACTIONS

export const createPost = async (postData: Omit<Post, 'id' | 'reactions' | 'likes' | 'commentsCount'>) => {
    if (!db) return;
    await addDoc(collection(db, "posts"), {
        ...postData,
        reactions: {},
        likes: 0,
        commentsCount: 0
    });
};

export const createStory = async (storyData: Omit<Story, 'id' | 'viewers'>) => {
    if (!db) return;
    await addDoc(collection(db, "stories"), {
        ...storyData,
        viewers: []
    });
};

export const addComment = async (postId: string, commentData: Omit<Comment, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, `posts/${postId}/comments`), commentData);
    // Optimistic update count
    const postRef = doc(db, "posts", postId);
    await runTransaction(db, async (transaction: any) => {
        const pDoc = await transaction.get(postRef);
        if (!pDoc.exists()) return;
        const newCount = (pDoc.data().commentsCount || 0) + 1;
        transaction.update(postRef, { commentsCount: newCount });
    });
};

export const toggleReaction = async (postId: string, userId: string, type: ReactionType) => {
    if (!db) return;
    const postRef = doc(db, "posts", postId);
    
    await runTransaction(db, async (transaction: any) => {
        const pDoc = await transaction.get(postRef);
        if (!pDoc.exists()) return;

        const data = pDoc.data();
        const reactions = data.reactions || {};
        const currentReaction = reactions[userId];

        let newReactions = { ...reactions };
        let likesChange = 0;

        if (currentReaction === type) {
             // Remove reaction
             delete newReactions[userId];
             likesChange = -1;
        } else {
             // Add/Change reaction
             if (!currentReaction) likesChange = 1; 
             newReactions[userId] = type;
        }

        transaction.update(postRef, { 
            reactions: newReactions,
            likes: (data.likes || 0) + likesChange
        });
    });
};

export const deletePost = async (postId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "posts", postId));
}

export const deleteStory = async (storyId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "stories", storyId));
}

export const deleteAllUsersExcept = async (usernameToKeep: string) => {
    if (!db) return false;
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const snapshot = await getDocs(q);
        
        let count = 0;
        const deletePromises: Promise<void>[] = [];
        
        snapshot.forEach((docSnap) => {
             const data = docSnap.data();
             if (data.username !== usernameToKeep) {
                 deletePromises.push(deleteDoc(doc(db, "users", docSnap.id)));
                 count++;
             }
        });
        
        await Promise.all(deletePromises);
        return count;
    } catch (e) {
        console.error("Purge error", e);
        return false;
    }
};
