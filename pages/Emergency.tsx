
import React, { useState } from 'react';
import { useStore } from '../store';
import { ShieldAlert, Check, AlertTriangle, Phone, Search, X } from 'lucide-react';
import { BLOOD_GROUPS, DISTRICTS, DISCLAIMER_TEXT } from '../constants';
import { User } from '../types';
import { motion } from 'framer-motion';

export const Emergency = () => {
  const { currentUser, updateDonorStatus, searchDonors } = useStore();
  const [activeTab, setActiveTab] = useState<'find' | 'join'>('find');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlood, setSelectedBlood] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Search Results
  const [foundDonors, setFoundDonors] = useState<User[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Disclaimer Mock
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  // District Search Toggle State
  const [isSearchingDistrict, setIsSearchingDistrict] = useState(false);
  const [districtQuery, setDistrictQuery] = useState('');

  if (!currentUser) return <div className="p-8 text-center">Please login to access Emergency services.</div>;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && phoneInput.length >= 10 && selectedBlood) {
      updateDonorStatus(true, selectedBlood, phoneInput);
      setShowConfirm(false);
      alert("You have joined the Donor Squad. Thank you!");
    }
  };

  const handleSearch = async () => {
      if(!selectedDistrict || !selectedBlood) return;
      setHasSearched(false);
      const results = await searchDonors(selectedDistrict, selectedBlood);
      setFoundDonors(results);
      setHasSearched(true);
  };

  const filteredDistricts = DISTRICTS.filter(d => 
    d.toLowerCase().includes(districtQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 pb-20 max-w-5xl mx-auto">
      
      {/* Disclaimer Banner */}
      <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-8 flex gap-4 items-start">
        <AlertTriangle className="text-red-500 shrink-0 mt-1" />
        <div className="text-sm text-red-200">
          <span className="font-bold block text-red-400 mb-1">IMPORTANT DISCLAIMER</span>
          {DISCLAIMER_TEXT}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="glass-panel p-1 rounded-full flex">
          <button 
            onClick={() => setActiveTab('find')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${activeTab === 'find' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Find Donors
          </button>
          <button 
            onClick={() => setActiveTab('join')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${activeTab === 'join' ? 'bg-ntr-orange text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Join Squad
          </button>
        </div>
      </div>

      {activeTab === 'find' ? (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Find Blood Donors</h2>
            <p className="text-gray-400">Search for volunteers in your district. Use only for emergencies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Searchable District Dropdown */}
            <div className="relative">
                {!isSearchingDistrict ? (
                    <div 
                        onClick={() => setIsSearchingDistrict(true)}
                        className="bg-gray-800 border border-gray-700 text-white p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-red-500"
                    >
                        <span className={selectedDistrict ? 'text-white' : 'text-gray-400'}>
                            {selectedDistrict || "Select District"}
                        </span>
                        <Search size={16} className="text-gray-400" />
                    </div>
                ) : (
                    <div className="absolute top-0 left-0 w-full z-20 bg-gray-900 border border-red-500 rounded-lg shadow-xl">
                        <div className="p-2 border-b border-gray-700 flex items-center gap-2">
                            <Search size={16} className="text-red-500" />
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Type to search..." 
                                className="w-full bg-transparent text-white outline-none"
                                value={districtQuery}
                                onChange={(e) => setDistrictQuery(e.target.value)}
                            />
                            <button onClick={() => { setIsSearchingDistrict(false); setDistrictQuery(''); }}><X size={16} className="text-gray-400" /></button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                             {filteredDistricts.map(d => (
                                 <div 
                                    key={d} 
                                    className="p-3 hover:bg-white/10 cursor-pointer text-sm border-b border-white/5 last:border-0"
                                    onClick={() => {
                                        setSelectedDistrict(d);
                                        setIsSearchingDistrict(false);
                                        setDistrictQuery('');
                                    }}
                                 >
                                     {d}
                                 </div>
                             ))}
                             {filteredDistricts.length === 0 && <div className="p-3 text-gray-500 text-sm">No districts found</div>}
                        </div>
                    </div>
                )}
            </div>

            <select 
              className="bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-red-500 outline-none"
              onChange={(e) => setSelectedBlood(e.target.value)}
              value={selectedBlood}
            >
              <option value="">Select Blood Group</option>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex justify-center">
             <button 
                onClick={handleSearch}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition shadow-lg shadow-red-900/50"
             >
               <Search size={20} /> Search Donors
             </button>
          </div>

          {hasSearched && (
              <div className="max-w-2xl mx-auto mt-8">
                  {foundDonors.length === 0 ? (
                      <div className="text-center text-gray-400 p-8 glass-panel rounded-xl">
                          <p>No donors found in {selectedDistrict} for {selectedBlood}.</p>
                          <p className="text-sm mt-2">Try nearby districts.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <h3 className="text-xl font-bold text-white mb-4">Available Donors ({foundDonors.length})</h3>
                          {foundDonors.map(donor => (
                              <div key={donor.uid} className="glass-panel p-4 rounded-xl flex items-center justify-between border border-white/10">
                                  <div>
                                      <h4 className="font-bold text-white">{donor.displayName}</h4>
                                      <p className="text-xs text-gray-400">{donor.district} • {donor.bloodGroup}</p>
                                  </div>
                                  <a href={`tel:${donor.phone}`} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">
                                      <Phone size={18} />
                                  </a>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto glass-panel p-8 rounded-2xl border border-white/10">
          {currentUser.isDonor ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">You are a Hero!</h3>
              <p className="text-gray-400 mb-6">You have registered as a donor. Your commitment helps the community.</p>
              <div className="bg-white/5 p-4 rounded-lg inline-block text-left">
                  <p className="text-xs text-gray-500 uppercase">Registered Details</p>
                  <p className="font-bold text-lg text-white">{currentUser.bloodGroup} • {currentUser.phone}</p>
              </div>
              <div className="mt-8">
                  <button 
                    onClick={() => updateDonorStatus(false, '', '')}
                    className="text-red-400 text-sm hover:underline"
                  >
                    Opt-out of Donor Squad
                  </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-6">
               <div className="text-center mb-6">
                 <h3 className="text-2xl font-bold text-white">Join the Squad</h3>
                 <p className="text-gray-400 text-sm">Be ready to help fellow fans in emergencies.</p>
               </div>

               <div>
                 <label className="text-xs text-gray-400 block mb-2">Select Blood Group</label>
                 <select 
                   required
                   className="w-full bg-black/50 border border-gray-700 text-white p-3 rounded-lg focus:border-ntr-orange outline-none"
                   onChange={(e) => setSelectedBlood(e.target.value)}
                   value={selectedBlood}
                 >
                    <option value="">Select Group</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
               </div>

               <div>
                 <label className="text-xs text-gray-400 block mb-2">Phone Number</label>
                 <div className="flex bg-black/50 border border-gray-700 rounded-lg overflow-hidden focus-within:border-ntr-orange transition">
                    <div className="px-3 py-3 bg-white/5 text-gray-400 border-r border-gray-700">+91</div>
                    <input 
                      type="tel" 
                      required
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g,''))}
                      className="flex-1 bg-transparent p-3 text-white outline-none"
                      maxLength={10}
                    />
                 </div>
               </div>
               
               <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="disclaimer" 
                    checked={acceptedDisclaimer}
                    onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="disclaimer" className="text-xs text-gray-400 cursor-pointer select-none">
                    I agree to share my phone number with other registered members strictly for emergency blood donation purposes. I understand this is a community initiative.
                  </label>
               </div>

               <button 
                 type="submit"
                 disabled={!acceptedDisclaimer || !selectedBlood || phoneInput.length < 10}
                 className="w-full py-4 bg-ntr-orange text-black font-bold rounded-lg hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 REGISTER AS DONOR
               </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
