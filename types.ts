
export interface Movie {
  id: string;
  title: string;
  year: number;
  role: string;
  type: 'Mass' | 'Class' | 'Pan-India';
  verdict: 'Blockbuster' | 'Super Hit' | 'Hit' | 'Average' | 'Cult Classic';
  image: string;
  // Detailed Data
  releaseDate?: string;
  budget?: string;
  boxOffice?: string;
  director?: string;
  musicDirector?: string;
  songs?: string[];
  description?: string;
}

export interface AvatarConfig {
  style: 'circle' | 'transparent';
  top: string[];
  facialHair: string;
  accessories: string;
  hairColor: string;
}

export interface User {
  uid: string;
  username: string; // Unique Login ID
  fullName: string; // Real Name for Display
  displayName: string; // Keeping for backward compat, mapped to username usually
  passwordHash?: string; // SECURE STORAGE
  faceDataUrl?: string; // For Face Auth
  photoUrl?: string; // Real Profile Photo
  hasFaceAuth?: boolean;
  fanId: string;
  district: string;
  gender: 'male' | 'female';
  avatarConfig?: AvatarConfig; // New field for custom avatar
  joinedAt: string;
  badges: string[];
  points: number;
  // Privacy Protected Fields
  bloodGroup?: string; 
  isDonor?: boolean;
  phone?: string;
  role?: 'user' | 'admin' | 'super_admin';
}

export interface EmergencyAlert {
  id: string;
  location: string;
  bloodGroupNeeded: string;
  status: 'Active' | 'Resolved';
  timestamp: string;
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  fanId: string;
  points: number;
  district: string;
  isDonor?: boolean;
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  action: string; // e.g., "Created Post", "Promoted User"
  details: string;
  timestamp: string;
  type: 'content' | 'security' | 'system';
}

export interface PendingUpload {
  id: string;
  userId: string;
  userName: string;
  type: 'Wallpaper' | 'FanEdit';
  imageUrl: string;
  submittedAt: string;
}

export enum TabView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  UPDATES = 'UPDATES', // New Feed Tab
  MOVIES = 'MOVIES',
  FANZONE = 'FANZONE',
  EMERGENCY = 'EMERGENCY',
  LEADERBOARD = 'LEADERBOARD',
  ADMIN = 'ADMIN',
  CHAT = 'CHAT'
}

// --- NEW CONTENT MODELS ---

export type PostCategory = 'Announcement' | 'Alert' | 'News' | 'Event' | 'General';

export type ReactionType = 'like' | 'love' | 'fire' | 'clap';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  status: 'pending' | 'approved';
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: PostCategory;
  timestamp: string; // ISO String
  authorId: string;
  likes: number; // Aggregate count
  reactions: Record<string, ReactionType>; // Map of userId -> Reaction
  commentsCount: number;
}

export interface Story {
  id: string;
  mediaUrl: string; // Image or Video
  type: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string; // 24 hours later
  viewers: string[];
}
