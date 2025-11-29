
import React, { useState } from 'react';
import { useStore } from '../store';
import { FanCard } from '../components/FanCard';
import { DISTRICTS, BLOOD_GROUPS } from '../constants';
import { Edit2, Save, User, Sparkles, Glasses, UserCheck, RefreshCw, Search, X, Droplet, Phone, Smartphone } from 'lucide-react';

export const FanZone = () => {
  const { currentUser, updateUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing to prevent constant re-renders on global store
  const [editName, setEditName] = useState(currentUser?.displayName || '');
  const [editDistrict, setEditDistrict] = useState(currentUser?.district || '');
  const [editBlood, setEditBlood] = useState(currentUser?.bloodGroup || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  
  // Searchable District State
  const [isSearchingDistrict, setIsSearchingDistrict] = useState(false);
  const [districtQuery, setDistrictQuery] = useState('');
  
  // Avatar traits
  const [hairType, setHairType] = useState(currentUser?.avatarConfig?.top[0] || 'shortHair');
  const [hasBeard, setHasBeard] = useState(currentUser?.avatarConfig?.facialHair !== 'blank');
  const [hasGlasses, setHasGlasses] = useState(currentUser?.avatarConfig?.accessories === 'sunglasses');

  if (!currentUser) return null;

  const handleSave = () => {
    updateUser({
      displayName: editName,
      district: editDistrict,
      bloodGroup: editBlood,
      phone: editPhone,
      avatarConfig: {
        style: 'transparent',
        top: [hairType],
        facialHair: hasBeard ? 'beardLight' : 'blank',
        accessories: hasGlasses ? 'sunglasses' : 'blank',
        hairColor: 'black'
      }
    });
    setIsEditing(false);
  };
  
  const filteredDistricts = DISTRICTS.filter(d => 
    d.toLowerCase().includes(districtQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 flex flex-col items-center pb-20 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-black text-white">MY FAN IDENTITY</h1>
        <p className="text-gray-400">Manage your profile and avatar</p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left: Card Preview */}
        <div className="space-y-6">
           <FanCard user={{
               ...currentUser, 
               displayName: isEditing ? editName : currentUser.displayName,
               district: isEditing ? editDistrict : currentUser.district,
               bloodGroup: isEditing ? editBlood : currentUser.bloodGroup,
               avatarConfig: isEditing ? {
                   style: 'transparent',
                   top: [hairType],
                   facialHair: hasBeard ? 'beardLight' : 'blank',
                   accessories: hasGlasses ? 'sunglasses' : 'blank',
                   hairColor: 'black'
               } : currentUser.avatarConfig
           }} />
           
           {!isEditing && (
             <div className="flex justify-center">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-ntr-gold text-black font-bold rounded-full hover:bg-ntr-goldDark transition"
                >
                  <Edit2 size={16} /> Edit Profile
                </button>
             </div>
           )}
        </div>

        {/* Right: Editor */}
        {isEditing && (
          <div className="glass-panel p-6 rounded-xl border border-ntr-orange/30 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-2 mb-6 text-ntr-gold">
               <UserCheck size={20} />
               <h3 className="font-bold text-lg">EDIT DETAILS</h3>
             </div>

             <div className="space-y-6">
               {/* PERSONAL INFO SECTION */}
               <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Display Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-ntr-orange outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">District</label>
                    <div className="relative">
                        {!isSearchingDistrict ? (
                            <div 
                                onClick={() => setIsSearchingDistrict(true)}
                                className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white flex justify-between items-center cursor-pointer hover:border-ntr-orange"
                            >
                                <span className="truncate">{editDistrict || "Select District"}</span>
                                <Search size={14} className="text-gray-400" />
                            </div>
                        ) : (
                            <div className="absolute top-0 left-0 w-full z-20 bg-black border border-ntr-orange rounded shadow-xl">
                                <div className="p-2 border-b border-white/10 flex items-center gap-2">
                                    <Search size={14} className="text-ntr-orange" />
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="Search..." 
                                        className="w-full bg-transparent text-white text-xs outline-none"
                                        value={districtQuery}
                                        onChange={(e) => setDistrictQuery(e.target.value)}
                                    />
                                    <button onClick={() => { setIsSearchingDistrict(false); setDistrictQuery(''); }}><X size={14} className="text-gray-400" /></button>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                    {filteredDistricts.map(d => (
                                        <div 
                                            key={d} 
                                            className="px-3 py-2 hover:bg-white/10 cursor-pointer text-xs border-b border-white/5 last:border-0"
                                            onClick={() => {
                                                setEditDistrict(d);
                                                setIsSearchingDistrict(false);
                                                setDistrictQuery('');
                                            }}
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* CONTACT & BLOOD GROUP */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                            <Droplet size={12} className="text-red-500" /> Blood Group
                        </label>
                        <select 
                            value={editBlood}
                            onChange={(e) => setEditBlood(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white text-sm focus:border-ntr-orange outline-none"
                        >
                            <option value="">Select</option>
                            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                            <Smartphone size={12} className="text-blue-400" /> Phone
                        </label>
                        <input 
                          type="tel" 
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value.replace(/\D/g,''))}
                          placeholder="9876543210"
                          maxLength={10}
                          className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white text-sm focus:border-ntr-orange outline-none"
                        />
                    </div>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/10">
                 <label className="text-xs text-gray-400 block mb-3 uppercase tracking-wider font-bold">Avatar Customization</label>
                 
                 <div className="grid grid-cols-2 gap-3">
                   {/* Hair Selector */}
                   <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 block mb-1">Hair Style</label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {['shortHair', 'caesar', 'longHair', 'bob', 'curly'].map(style => (
                          <button
                            key={style}
                            onClick={() => setHairType(style)}
                            className={`px-3 py-1 rounded text-xs border ${hairType === style ? 'bg-ntr-orange text-black border-ntr-orange' : 'border-gray-700 text-gray-400'}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                   </div>

                   <button 
                     onClick={() => setHasBeard(!hasBeard)}
                     className={`p-3 rounded border flex flex-col items-center gap-2 transition ${hasBeard ? 'bg-ntr-gold/20 border-ntr-gold text-ntr-gold' : 'border-gray-700 text-gray-500'}`}
                   >
                     <User size={20} />
                     <span className="text-xs font-bold">Beard</span>
                   </button>

                   <button 
                     onClick={() => setHasGlasses(!hasGlasses)}
                     className={`p-3 rounded border flex flex-col items-center gap-2 transition ${hasGlasses ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 text-gray-500'}`}
                   >
                     <Glasses size={20} />
                     <span className="text-xs font-bold">Glasses</span>
                   </button>
                 </div>
               </div>

               <div className="flex gap-3 pt-4">
                 <button 
                   onClick={() => setIsEditing(false)}
                   className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 font-bold"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleSave}
                   className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold flex items-center justify-center gap-2"
                 >
                   <Save size={16} /> Save Changes
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
