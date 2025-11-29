
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Post, Comment, PostCategory, ReactionType, Story } from '../types';
import { toggleReaction, addComment, subscribeToComments, createPost } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Flame, Hand, User, Send, Clock, X, ChevronRight, Play, Image as ImageIcon, Video, Shield, Crown, Siren, ThumbsUp } from 'lucide-react';

// --- HELPER COMPONENTS ---

const ReactionButton = ({ type, active, count, onClick, icon: Icon, color }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 relative group ${active ? 'bg-white/10 ring-1 ring-ntr-gold/50' : 'hover:bg-white/5'}`}
    >
        <Icon 
          size={18} 
          className={`transition-colors ${active ? color : 'text-gray-500 group-hover:text-white'}`} 
          fill={active ? "currentColor" : "none"}
        />
        <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{count > 0 ? count : ''}</span>
        {active && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-ntr-gold rounded-full animate-ping" />
        )}
    </button>
);

const StoryViewer = ({ story, onClose }: { story: Story, onClose: () => void }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Longer duration for videos (15s) vs images (5s)
        const duration = story.type === 'video' ? 150 : 50; 
        
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    onClose();
                    return 100;
                }
                return prev + 1;
            });
        }, duration); 
        return () => clearInterval(timer);
    }, [story.type]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gray-900 border border-white/10">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
                    <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all ease-linear" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Content */}
                {story.type === 'video' ? (
                     <div className="w-full h-full flex items-center justify-center bg-black">
                         <video 
                            src={story.mediaUrl} 
                            className="w-full h-full object-contain" 
                            autoPlay 
                            muted 
                            playsInline 
                         />
                     </div>
                ) : (
                    <img src={story.mediaUrl} className="w-full h-full object-cover" alt="Story" />
                )}

                {/* Overlay Info */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-ntr-gold border-2 border-black flex items-center justify-center">
                        <Shield size={14} className="text-black" />
                    </div>
                    <span className="text-white font-bold text-sm shadow-black drop-shadow-md">Admin Update</span>
                    <span className="text-gray-300 text-xs shadow-black drop-shadow-md">• {new Date(story.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                {/* Caption */}
                {story.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                        <p className="text-white text-lg font-medium text-center font-display tracking-wide">{story.caption}</p>
                    </div>
                )}

                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 z-30 text-white drop-shadow-lg p-2 hover:bg-white/10 rounded-full transition">
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

// --- POST CARD COMPONENT ---

const PostCard: React.FC<{ post: Post, currentUser: any }> = ({ post, currentUser }) => {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (showComments) {
            const unsub = subscribeToComments(post.id, (data) => setComments(data));
            return () => unsub();
        }
    }, [showComments, post.id]);

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        await addComment(post.id, {
            userId: currentUser.uid,
            username: currentUser.displayName,
            avatarUrl: currentUser.photoUrl || '',
            text: newComment,
            timestamp: new Date().toISOString(),
            status: 'approved' // Auto approve for demo
        });
        setNewComment('');
    };

    const myReaction = currentUser ? post.reactions[currentUser.uid] : null;

    // Calculate counts
    const counts = { like: 0, love: 0, fire: 0, clap: 0 };
    Object.values(post.reactions).forEach(r => { if(counts[r as ReactionType] !== undefined) counts[r as ReactionType]++; });

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl border border-white/5 overflow-hidden mb-6"
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ntr-gold border border-white/10 flex items-center justify-center">
                        <Crown size={20} className="text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="font-bold text-white font-display uppercase tracking-wider">ADMIN OFFICIAL</span>
                             {post.category === 'Alert' && (
                                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse flex items-center gap-1">
                                    <Siren size={10} /> ALERT
                                </span>
                             )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                             <span>@{post.authorId}</span>
                             <span>•</span>
                             <span className="flex items-center gap-1"><Clock size={10} /> {new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                {/* Category Chip */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    post.category === 'Alert' ? 'bg-red-500/20 border-red-500 text-red-500' : 
                    post.category === 'Announcement' ? 'bg-ntr-gold/20 border-ntr-gold text-ntr-gold' :
                    'bg-white/5 border-white/10 text-gray-400'
                }`}>
                    {post.category}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
                <h3 className="text-xl font-bold text-white mb-2 font-display">{post.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Media */}
            {post.imageUrl && (
                <div className="w-full aspect-video bg-black relative">
                    <img src={post.imageUrl} className="w-full h-full object-cover" loading="lazy" />
                </div>
            )}

            {/* Actions Bar */}
            <div className="p-3 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ReactionButton type="like" icon={ThumbsUp} color="text-blue-400" count={counts.like} active={myReaction === 'like'} onClick={() => currentUser && toggleReaction(post.id, currentUser.uid, 'like')} />
                    <ReactionButton type="love" icon={Heart} color="text-red-500" count={counts.love} active={myReaction === 'love'} onClick={() => currentUser && toggleReaction(post.id, currentUser.uid, 'love')} />
                    <ReactionButton type="fire" icon={Flame} color="text-orange-500" count={counts.fire} active={myReaction === 'fire'} onClick={() => currentUser && toggleReaction(post.id, currentUser.uid, 'fire')} />
                    <ReactionButton type="clap" icon={Hand} color="text-yellow-400" count={counts.clap} active={myReaction === 'clap'} onClick={() => currentUser && toggleReaction(post.id, currentUser.uid, 'clap')} />
                </div>
                
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition"
                >
                    <MessageCircle size={16} />
                    <span>{post.commentsCount || 0} Comments</span>
                </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/40 border-t border-white/5"
                    >
                        <div className="p-4 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                            {comments.length === 0 ? (
                                <p className="text-center text-xs text-gray-500 py-4">No comments yet. Be the first!</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                                            {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full rounded-full object-cover" /> : c.username[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white/5 rounded-lg rounded-tl-none p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-ntr-gold">{c.username}</span>
                                                    <span className="text-[10px] text-gray-600">{new Date(c.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-300">{c.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleComment} className="p-4 border-t border-white/5 flex gap-2">
                             <input 
                               type="text" 
                               value={newComment}
                               onChange={(e) => setNewComment(e.target.value)}
                               placeholder={currentUser ? "Add a comment..." : "Login to comment"}
                               disabled={!currentUser}
                               className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-ntr-gold outline-none"
                             />
                             <button 
                               type="submit" 
                               disabled={!newComment.trim() || !currentUser}
                               className="p-2 bg-ntr-gold text-black rounded-lg disabled:opacity-50"
                             >
                                <Send size={16} />
                             </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- MAIN PAGE ---

export const Updates = () => {
    const { posts, stories, currentUser, isAdmin } = useStore();
    const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'All'>('All');
    const [viewingStory, setViewingStory] = useState<Story | null>(null);

    // Admin Quick Post State
    const [qpText, setQpText] = useState('');
    const [qpTitle, setQpTitle] = useState('');
    const [qpCategory, setQpCategory] = useState<PostCategory>('News');

    const handleQuickPost = async () => {
        if (!qpTitle || !qpText) return;
        await createPost({
            title: qpTitle,
            content: qpText,
            imageUrl: '',
            category: qpCategory,
            timestamp: new Date().toISOString(),
            authorId: 'admin'
        });
        setQpText('');
        setQpTitle('');
        alert("Quick Update Posted!");
    };

    const filteredPosts = posts.filter(p => selectedCategory === 'All' || p.category === selectedCategory);

    return (
        <div className="p-4 lg:p-8 pb-20 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                 <Shield size={32} className="text-ntr-gold" />
                 <div>
                     <h1 className="text-2xl font-display font-black text-white">OFFICIAL FEED</h1>
                     <p className="text-xs text-gray-400">Direct from the NTR Fan Universe HQ</p>
                 </div>
            </div>

            {/* Stories Rail */}
            {stories.length > 0 && (
                <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
                    <div className="flex gap-4">
                        {stories.map(story => (
                            <button 
                              key={story.id} 
                              onClick={() => setViewingStory(story)}
                              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-ntr-gold via-yellow-500 to-transparent">
                                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
                                        {story.type === 'video' ? (
                                            <video src={story.mediaUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={story.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition" />
                                        )}
                                        {story.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Play size={12} className="text-white fill-white" /></div>}
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 group-hover:text-ntr-gold transition truncate w-full text-center">
                                    {new Date(story.createdAt).getHours()}:{new Date(story.createdAt).getMinutes()}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Quick Post (Only visible to Admin) */}
            {currentUser && isAdmin && (
                <div className="mb-8 glass-panel p-4 rounded-xl border border-ntr-gold/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Shield size={64} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-ntr-gold">
                            <Shield size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Admin Quick Update</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={qpTitle}
                                    onChange={(e) => setQpTitle(e.target.value)}
                                    placeholder="Title (e.g., Breaking News)"
                                    className="flex-1 bg-black/50 border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-ntr-gold"
                                />
                                <select 
                                    value={qpCategory}
                                    onChange={(e) => setQpCategory(e.target.value as any)}
                                    className="bg-black/50 border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-ntr-gold"
                                >
                                    {['Announcement', 'Alert', 'News', 'Event'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <textarea 
                                value={qpText}
                                onChange={(e) => setQpText(e.target.value)}
                                placeholder="What's the update, Admin?"
                                className="w-full h-20 bg-black/50 border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-ntr-gold resize-none"
                            />
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleQuickPost}
                                    disabled={!qpTitle || !qpText}
                                    className="px-4 py-2 bg-ntr-gold text-black text-xs font-bold rounded hover:bg-white transition disabled:opacity-50"
                                >
                                    POST NOW
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['All', 'Announcement', 'Alert', 'News', 'Event', 'General'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${
                            selectedCategory === cat 
                            ? 'bg-ntr-gold text-black border-ntr-gold' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Shield size={24} />
                        </div>
                        <p>No updates in this category yet.</p>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} currentUser={currentUser} />
                    ))
                )}
            </div>

            {/* Story Viewer Overlay */}
            {viewingStory && (
                <StoryViewer story={viewingStory} onClose={() => setViewingStory(null)} />
            )}
        </div>
    );
};
