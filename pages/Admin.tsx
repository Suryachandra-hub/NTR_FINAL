
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Shield, Users, Siren, Activity, FileText, PenTool, Image as ImageIcon, Send, Video, Lock, Search, AlertTriangle, Terminal, Key, Trash2 } from 'lucide-react';
import { BLOOD_GROUPS, DISTRICTS } from '../constants';
import { PostCategory, User } from '../types';
import { createPost, createStory, broadcastEmergency, logSystemAction, subscribeToLeaderboard } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

type AdminTab = 'overview' | 'content' | 'team' | 'emergency' | 'system';

export const Admin = () => {
  const { leaderboardCache, posts, currentUser, isAdmin, isSuperAdmin, logs, assignRole, initLogListener, purgeUsers } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Content Creation State
  const [contentType, setContentType] = useState<'post' | 'story'>('post');
  const [pTitle, setPTitle] = useState('');
  const [pContent, setPContent] = useState('');
  const [pCategory, setPCategory] = useState<PostCategory>('News');
  const [sCaption, setSCaption] = useState('');
  const [storyType, setStoryType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  
  // Emergency State
  const [eDistrict, setEDistrict] = useState(DISTRICTS[0]);
  const [eBlood, setEBlood] = useState(BLOOD_GROUPS[0]);
  const [eMsg, setEMsg] = useState('');

  // Super Admin State
  const [searchUser, setSearchUser] = useState('');
  const [roleActionStatus, setRoleActionStatus] = useState('');
  
  // Admin List State
  const [adminList, setAdminList] = useState<any[]>([]);

  useEffect(() => {
      if (isSuperAdmin) initLogListener();
      
      // Fetch admins from leaderboard cache (which contains all users)
      const admins = leaderboardCache.filter((u: any) => {
          // We need to match based on fanId pattern or role if available in leaderboard cache
          // Note: Leaderboard cache usually has restricted data. 
          // For a real app we'd fetch a dedicated list, but here we can infer or use cache
          // Simulating admin fetch from cache since we don't have direct role in LeaderboardEntry
          return true; 
      });
      // In a real scenario we'd query db where role == admin
  }, [isSuperAdmin, leaderboardCache]);

  const handleCreateContent = async () => {
      if (contentType === 'post') {
          if(!pTitle || !pContent) return alert("Title and Content required");
          await createPost({
              title: pTitle,
              content: pContent,
              imageUrl: mediaUrl || "", 
              category: pCategory,
              timestamp: new Date().toISOString(),
              authorId: currentUser?.displayName || 'Admin'
          });
          logSystemAction(currentUser?.displayName || 'Admin', "Created Post", `Title: ${pTitle}`, "content");
          setPTitle(''); setPContent(''); setMediaUrl('');
          alert("Post published to live feed!");
      } else {
          if (!mediaUrl) return alert("Media URL required for story");
          await createStory({
              mediaUrl: mediaUrl,
              type: storyType, 
              caption: sCaption,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
          logSystemAction(currentUser?.displayName || 'Admin', "Created Story", `Type: ${storyType}`, "content");
          setMediaUrl(''); setSCaption('');
          alert("Story added to carousel!");
      }
  };

  const handleBroadcast = async () => {
    if (!eMsg) return alert("Please enter a message");
    const confirm = window.confirm("WARNING: This will send a notification to ALL registered donors via Cloud Database. Proceed?");
    if (confirm) {
       await broadcastEmergency(eMsg, eDistrict, eBlood);
       logSystemAction(currentUser?.displayName || 'Admin', "Emergency Broadcast", `Msg: ${eMsg}`, "system");
       alert("Real-time Broadcast sent successfully to all active clients.");
       setEMsg('');
    }
  };

  const handlePromote = async () => {
      if (!searchUser) return;
      const success = await assignRole(searchUser, 'admin');
      if (success) setRoleActionStatus(`✅ ${searchUser} promoted to ADMIN.`);
      else setRoleActionStatus(`❌ User '${searchUser}' not found.`);
  };

  const handleRevoke = async () => {
      if (!searchUser) return;
      const success = await assignRole(searchUser, 'user');
      if (success) setRoleActionStatus(`⚠️ ${searchUser} privileges REVOKED.`);
      else setRoleActionStatus(`❌ User '${searchUser}' not found.`);
  };

  // STRICT SECURITY CHECK
  if (!currentUser || !isAdmin) {
      return (
        <div className="flex items-center justify-center h-[60vh] text-center">
            <div className="glass-panel p-8 rounded-xl border border-red-500/50">
                <Shield size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white uppercase mb-2">Access Denied</h2>
                <p className="text-gray-400">You must log in via the <b>Admin Face Portal</b> to access this area.</p>
            </div>
        </div>
      );
  }

  const activeAlerts = 0; 
  
  // Define available tabs based on role
  const availableTabs: AdminTab[] = isSuperAdmin 
    ? ['overview', 'content', 'team', 'system', 'emergency'] 
    : ['overview', 'content', 'team', 'emergency'];

  return (
    <div className="p-4 lg:p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white flex items-center gap-2">
            <Shield className="text-ntr-gold" /> COMMAND CENTER
          </h1>
          <p className="text-gray-400 flex items-center gap-2">
              Welcome, {currentUser.fullName}. 
              {isSuperAdmin ? (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold">SUPER ADMIN</span>
              ) : (
                  <span className="px-2 py-0.5 bg-ntr-gold text-black text-[10px] rounded font-bold">ADMIN</span>
              )}
          </p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg flex-wrap gap-1">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition ${
                activeTab === tab ? 'bg-ntr-gold text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Fans", value: leaderboardCache.length.toLocaleString(), icon: Users, color: "text-blue-400" },
                { label: "Active Posts", value: posts.length, icon: FileText, color: "text-yellow-400" },
                { label: "Active Alerts", value: activeAlerts, icon: Siren, color: "text-red-500", animate: activeAlerts > 0 },
                { label: "Donor Pool", value: leaderboardCache.filter(u=>u.isDonor).length, icon: Activity, color: "text-green-400" },
              ].map((stat, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
                      <stat.icon size={24} className={stat.animate ? 'animate-pulse' : ''} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CREATOR FORM */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-xl border border-ntr-gold/30">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <PenTool size={20} className="text-ntr-gold" /> Content Creator
                            </h3>
                            <div className="flex bg-white/5 rounded p-1">
                                <button onClick={() => setContentType('post')} className={`px-4 py-1 text-xs font-bold rounded ${contentType === 'post' ? 'bg-ntr-gold text-black' : 'text-gray-400'}`}>POST</button>
                                <button onClick={() => setContentType('story')} className={`px-4 py-1 text-xs font-bold rounded ${contentType === 'story' ? 'bg-ntr-gold text-black' : 'text-gray-400'}`}>STORY</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {contentType === 'post' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Title</label>
                                            <input type="text" value={pTitle} onChange={e => setPTitle(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Category</label>
                                            <select value={pCategory} onChange={e => setPCategory(e.target.value as any)} className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white">
                                                {['Announcement', 'Alert', 'News', 'Event', 'General'].map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Body Content</label>
                                        <textarea value={pContent} onChange={e => setPContent(e.target.value)} className="w-full h-32 bg-black/50 border border-gray-700 rounded p-2 text-white resize-none" />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-3 rounded border cursor-pointer flex items-center justify-center gap-2 transition ${storyType === 'image' ? 'bg-ntr-gold/20 border-ntr-gold text-ntr-gold' : 'border-gray-700 text-gray-400'}`}>
                                            <input type="radio" name="storyType" checked={storyType === 'image'} onChange={() => setStoryType('image')} className="hidden" />
                                            <ImageIcon size={18} /> Image Story
                                        </label>
                                        <label className={`flex-1 p-3 rounded border cursor-pointer flex items-center justify-center gap-2 transition ${storyType === 'video' ? 'bg-ntr-gold/20 border-ntr-gold text-ntr-gold' : 'border-gray-700 text-gray-400'}`}>
                                            <input type="radio" name="storyType" checked={storyType === 'video'} onChange={() => setStoryType('video')} className="hidden" />
                                            <Video size={18} /> Video Story
                                        </label>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Story Caption (Optional)</label>
                                        <input type="text" value={sCaption} onChange={e => setSCaption(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Media URL</label>
                                <div className="flex gap-2">
                                    <input type="text" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder={storyType === 'video' ? "https://... (.mp4)" : "https://... (.jpg/png)"} className="flex-1 bg-black/50 border border-gray-700 rounded p-2 text-white" />
                                    {contentType === 'post' && (
                                        <button className="p-2 bg-white/5 rounded hover:bg-white/10" onClick={() => setMediaUrl('https://picsum.photos/800/600')} title="Random Mock"><ImageIcon size={18} /></button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1">Supports direct links.</p>
                            </div>

                            <button onClick={handleCreateContent} className="w-full py-3 bg-ntr-gold text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-ntr-goldDark transition">
                                <Send size={18} /> PUBLISH NOW
                            </button>
                        </div>
                    </div>
                </div>

                {/* PREVIEW */}
                <div className="lg:col-span-1">
                    <h4 className="text-xs text-gray-500 font-bold uppercase mb-4">Live Preview</h4>
                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 pointer-events-none opacity-80 scale-90 origin-top">
                        <div className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-ntr-gold" />
                            <div>
                                <div className="w-24 h-3 bg-gray-700 rounded mb-1" />
                                <div className="w-16 h-2 bg-gray-800 rounded" />
                            </div>
                        </div>
                        <div className="w-full aspect-video bg-gray-800 relative">
                            {mediaUrl && (storyType === 'video' && contentType === 'story' ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">Video Preview</div>
                            ) : (
                                <img src={mediaUrl} className="w-full h-full object-cover" />
                            ))}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white text-lg">{contentType === 'post' ? (pTitle || "Post Title") : "New Story"}</h3>
                            <p className="text-gray-400 text-sm mt-2">{contentType === 'post' ? (pContent || "Content preview...") : (sCaption || "Story caption...")}</p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'team' && (
              <div className="glass-panel p-6 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-6">
                      <Shield size={20} className="text-ntr-gold" />
                      <h3 className="font-bold text-white">ADMIN TEAM</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Self Card */}
                      <div className="p-4 bg-ntr-gold/10 border border-ntr-gold/50 rounded-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-ntr-gold text-black flex items-center justify-center font-bold">YOU</div>
                          <div>
                              <div className="font-bold text-white">{currentUser.displayName}</div>
                              <div className="text-[10px] text-ntr-gold font-bold uppercase">{currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
                          </div>
                      </div>
                      
                      {/* Note: In a real app we would map 'adminList' here. 
                          Since we are using cache, we only simulate seeing other admins. */}
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 opacity-50">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><Shield size={16} /></div>
                          <div>
                              <div className="font-bold text-gray-300">Restricted View</div>
                              <div className="text-[10px] text-gray-500">Only Super Admin can see full list</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'system' && isSuperAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* ROLE MANAGER */}
                  <div className="glass-panel p-6 rounded-xl border border-ntr-gold/30">
                      <div className="flex items-center gap-2 mb-6">
                          <Key size={20} className="text-ntr-gold" />
                          <h3 className="font-bold text-white">ROLE MANAGER</h3>
                      </div>
                      
                      <div className="space-y-4">
                          <p className="text-sm text-gray-400">Search for a user by their username to promote them to Admin status. They will need to enroll their face after promotion.</p>
                          <div className="flex gap-2">
                              <div className="flex-1 bg-black/50 border border-gray-700 rounded p-2 flex items-center gap-2">
                                  <Search size={16} className="text-gray-500" />
                                  <input 
                                    type="text" 
                                    placeholder="Enter username" 
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    className="bg-transparent w-full text-white outline-none"
                                  />
                              </div>
                          </div>
                          
                          <div className="flex gap-3">
                              <button onClick={handlePromote} className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                                  PROMOTE TO ADMIN
                              </button>
                              <button onClick={handleRevoke} className="flex-1 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                                  REVOKE ACCESS
                              </button>
                          </div>

                          {roleActionStatus && (
                              <div className="p-3 bg-white/5 rounded border border-white/10 text-sm font-bold text-center">
                                  {roleActionStatus}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* PURGE BUTTON */}
                  <div className="glass-panel p-6 rounded-xl border border-red-500/50 flex flex-col justify-center items-center text-center">
                      <AlertTriangle size={48} className="text-red-500 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">DANGER ZONE</h3>
                      <p className="text-gray-400 text-sm mb-6">Permanently delete ALL users except 'surya'. This action cannot be undone.</p>
                      <button 
                        onClick={purgeUsers}
                        className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-wider rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                      >
                          <Trash2 size={20} /> PURGE DATABASE
                      </button>
                  </div>

                  {/* AUDIT LOGS */}
                  <div className="glass-panel p-6 rounded-xl border border-white/10 flex flex-col h-[500px] lg:col-span-2">
                      <div className="flex items-center gap-2 mb-6">
                          <Terminal size={20} className="text-blue-400" />
                          <h3 className="font-bold text-white">SERVER LOGS</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {logs.length === 0 ? (
                              <div className="text-center text-gray-500 mt-10">No logs found.</div>
                          ) : (
                              logs.map(log => (
                                  <div key={log.id} className="p-3 bg-black/40 rounded border border-white/5 text-xs">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-ntr-gold font-bold">{log.adminName}</span>
                                          <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                              log.type === 'security' ? 'bg-red-900 text-red-200' :
                                              log.type === 'system' ? 'bg-blue-900 text-blue-200' : 
                                              'bg-gray-700 text-gray-300'
                                          }`}>{log.type}</span>
                                          <span className="text-gray-300"><span className="font-bold text-white">{log.action}:</span> {log.details}</span>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'emergency' && (
            <div className="max-w-2xl mx-auto space-y-6 glass-panel p-6 rounded-xl border border-red-500/30">
                 <div className="flex items-center gap-3 text-red-500 mb-4">
                     <Siren size={32} />
                     <h3 className="text-2xl font-bold text-white">Emergency Broadcast</h3>
                 </div>
                 <div className="space-y-4">
                     <select value={eDistrict} onChange={(e) => setEDistrict(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white">
                         {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                     </select>
                     <select value={eBlood} onChange={(e) => setEBlood(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white">
                         {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                     </select>
                     <textarea 
                        value={eMsg} 
                        onChange={(e) => setEMsg(e.target.value)} 
                        className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white h-24" 
                        placeholder="Urgent message..." 
                     />
                     <button onClick={handleBroadcast} className="w-full py-3 bg-red-600 font-bold text-white rounded hover:bg-red-700">SEND ALERT</button>
                 </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
