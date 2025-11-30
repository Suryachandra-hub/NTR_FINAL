import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { DISTRICTS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Loader2, ScanFace, Search, Shield, User, Camera, Check, Lock, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
// IMPORT FACE AUTH UTILS
import { loadModels, getFaceDescriptor, isEyeClosed, drawFaceMesh } from '../utils/faceAuth';

// Use global faceapi
declare var faceapi: any;

export const Landing = () => {
  const { loginUser, registerUser, enrollFace, loginAdmin, isLoading, authError, clearError } = useStore();
  
  // --- CINEMATIC INTRO STATE ---
  // If there is an authError (login failed), skip animation and go straight to stage 4
  const [stage, setStage] = useState(authError ? 4 : 0); 
  
  // --- UI STATE ---
  const [viewMode, setViewMode] = useState<'user' | 'admin-select' | 'admin-action'>('user');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [adminActionType, setAdminActionType] = useState<'login' | 'enroll'>('login');

  // Form Inputs
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // District Search
  const [showDistrictSearch, setShowDistrictSearch] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');

  // --- LIVENESS & SCANNING STATE ---
  const [cameraActive, setCameraActive] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<string | null>(null);
  
  // Scanning Logic
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [instruction, setInstruction] = useState("Initializing Neural Core...");
  const [scanStatus, setScanStatus] = useState<'init' | 'scanning' | 'blink-1' | 'open-1' | 'blink-2' | 'processing' | 'success'>('init');
  const [blinkCount, setBlinkCount] = useState(0);
  const requestRef = useRef<number | null>(null);

  // --- ANIMATION TIMELINE ---
  useEffect(() => {
    // Only run animation if we start at 0
    if (stage === 0) {
        const t1 = setTimeout(() => setStage(1), 500);    
        const t2 = setTimeout(() => setStage(2), 2500);   
        const t3 = setTimeout(() => setStage(3), 5500);   
        const t4 = setTimeout(() => setStage(4), 8500);   
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, []);

  // --- LOAD MODELS ---
  useEffect(() => {
    loadModels();
  }, []);

  // --- CAMERA MANAGEMENT ---
  useEffect(() => {
     if (cameraActive && viewMode === 'admin-action') {
         startCamera();
     } else {
         stopCamera();
     }
     return () => stopCamera();
  }, [cameraActive, viewMode]);

  const startCamera = async () => {
    try {
        // Request HD Resolution for better accuracy
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 }, 
                facingMode: 'user' 
            } 
        });
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                startScanningLoop();
            };
        }
    } catch (err) {
        console.error("Camera access failed", err);
        setCameraActive(false);
        setInstruction("Camera Error: Permission Denied");
    }
  };

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }
  };

  // --- REAL-TIME OPTIMIZED LOOP ---
  const scanLoop = async () => {
      if (!videoRef.current || !canvasRef.current || typeof faceapi === 'undefined') return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Ensure video is playing and ready
      if (video.paused || video.ended || video.readyState !== 4) {
          requestRef.current = requestAnimationFrame(scanLoop);
          return;
      }

      // Match canvas to video dimensions exactly
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      // Detect (SSD MobileNet is slower but accurate, we run per frame but can throttle if needed)
      // Using a slightly lower confidence for tracking to keep it smooth, but we will be strict on capture
      const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                                     .withFaceLandmarks();
      
      if (detection) {
          // Draw Augmented Reality Mesh
          drawFaceMesh(canvas, detection, displaySize);
          
          const box = detection.detection.box;
          
          // Strict Positioning Checks
          const centerX = box.x + (box.width / 2);
          const centerY = box.y + (box.height / 2);
          const vidCenterW = displaySize.width / 2;
          const vidCenterH = displaySize.height / 2;

          // Check if face is centered (within 20% margin)
          const isCentered = Math.abs(centerX - vidCenterW) < (displaySize.width * 0.2) &&
                             Math.abs(centerY - vidCenterH) < (displaySize.height * 0.2);
          
          // Check if face is close enough
          const isCloseEnough = box.width > (displaySize.width * 0.25);

          if (!isCloseEnough) {
              setInstruction("Move Closer");
          } else if (!isCentered) {
              setInstruction("Center Your Face");
          } else {
               // Face is good, run Logic logic
               handleLivenessLogic(detection.landmarks);
          }

      } else {
          // Clear canvas if no face
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, displaySize.width, displaySize.height);
          setInstruction("Position Face in Frame");
      }

      requestRef.current = requestAnimationFrame(scanLoop);
  };

  const startScanningLoop = () => {
      setScanStatus('init');
      setBlinkCount(0);
      setInstruction("Calibrating Scanner...");
      requestRef.current = requestAnimationFrame(scanLoop);
  };

  // --- LIVENESS STATE LOGIC ---
  // Using Refs to access latest state inside the animation loop without stale closures
  const statusRef = useRef('init');
  useEffect(() => { statusRef.current = scanStatus; }, [scanStatus]);

  const handleLivenessLogic = async (landmarks: any) => {
      const currentStatus = statusRef.current;
      const isClosed = isEyeClosed(landmarks);

      if (currentStatus === 'init') {
          setScanStatus('scanning');
          setInstruction("Face Locked. Blink 2 times.");
          setScanStatus('blink-1');
      } 
      else if (currentStatus === 'blink-1') {
          if (isClosed) {
              setScanStatus('open-1');
              setInstruction("Eyes Closed. Open now.");
          }
      }
      else if (currentStatus === 'open-1') {
          if (!isClosed) {
              setBlinkCount(1);
              setScanStatus('blink-2');
              setInstruction("Good. One more blink.");
          }
      }
      else if (currentStatus === 'blink-2') {
          if (isClosed) {
              setScanStatus('processing');
              setInstruction("Processing Biometrics...");
              setBlinkCount(2);
              await finalizeCapture();
          }
      }
  };

  const finalizeCapture = async () => {
      if (!videoRef.current) return;
      if (requestRef.current) cancelAnimationFrame(requestRef.current); // Stop loop

      const video = videoRef.current;

      // 1. Get High Quality Visual
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Flip horziontally if needed to match mirror effect, but normally we want raw image for storage
      // For user display we mirror, for storage we usually keep original or mirror depending on preference.
      // Let's keep original for robust storage.
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // High quality JPEG

      // 2. Get Secure Descriptor with High Confidence
      const descriptor = await getFaceDescriptor(video);

      if (descriptor) {
          setFaceImage(dataUrl);
          setFaceDescriptor(descriptor);
          setScanStatus('success');
          setInstruction("Identity Verified");
          setCameraActive(false);
      } else {
          setScanStatus('init');
          setInstruction("Capture blurry. Retrying...");
          startScanningLoop(); // Restart
      }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'login') loginUser(username, password);
    else registerUser(fullName, username, district, gender, password);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!faceDescriptor) return alert("Verification Required");
      
      if (adminActionType === 'enroll') {
          await enrollFace(username, faceDescriptor);
      } else {
          await loginAdmin(username, faceDescriptor);
      }
  };

  const resetForms = () => {
      setUsername(''); setPassword(''); setFullName(''); setFaceImage(null); setFaceDescriptor(null); setCameraActive(false); 
      setScanStatus('init'); setBlinkCount(0); clearError();
  };

  const filteredDistricts = DISTRICTS.filter(d => d.toLowerCase().includes(districtSearchQuery.toLowerCase()));

  const renderBackdrop = () => (
    <div className="absolute inset-0 z-0 bg-black">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111] via-black to-black" />
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden font-sans selection:bg-ntr-gold selection:text-black flex flex-col items-center justify-center">
      
      {renderBackdrop()}

      <AnimatePresence mode="wait">
        {stage < 4 && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" exit={{ opacity: 0, transition: { duration: 1 } }}>
             <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center">
                {stage === 1 && (<motion.h2 key="stage1" initial={{ opacity: 0, scale: 1.5, letterSpacing: '0.2em' }} animate={{ opacity: 1, scale: 1, letterSpacing: '0.8em' }} exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }} transition={{ duration: 1.5, ease: "easeOut" }} className="text-3xl md:text-5xl font-royal font-bold text-white uppercase">WELCOME</motion.h2>)}
                {stage === 2 && (<motion.div key="stage2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 1.5, ease: "easeOut" }} className="flex flex-col items-center"><h2 className="text-sm md:text-xl font-royal text-ntr-gold uppercase tracking-[0.6em] mb-2 md:mb-4 animate-pulse">TO THE</h2><h1 className="text-4xl md:text-7xl font-display font-black text-white uppercase leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] tracking-wide">WORLD OF PRIDE</h1></motion.div>)}
                {stage === 3 && (<div className="flex flex-col items-center justify-center w-full z-20"><motion.div key="stage3-text" initial={{ opacity: 0, scale: 2, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -50 }} transition={{ duration: 0.8, ease: "circOut" }} className="text-[35vw] md:text-[25vw] font-royal font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] relative z-30">NTR</motion.div><motion.div key="stage3-bar" initial={{ width: "0%", opacity: 0 }} animate={{ width: "50%", opacity: 1 }} exit={{ width: "0%", opacity: 0 }} transition={{ delay: 0.4, duration: 1.2, ease: "anticipate" }} className="h-1.5 md:h-3 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent shadow-[0_0_30px_rgba(255,215,0,0.9)] rounded-full mt-4 md:mt-10 relative z-20" /></div>)}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stage >= 4 && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-20 w-full max-w-[380px] px-4">
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                     <Crown size={20} className="text-ntr-gold animate-pulse" />
                     <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase">Official Fan Universe</span>
                </div>
                <h1 className="text-4xl font-royal font-black text-white drop-shadow-lg tracking-wide">NTR <span className="text-ntr-gold">WORLD</span></h1>
            </div>

            {viewMode === 'user' && (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#050505] border border-white/10 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-black to-black pointer-events-none -z-10" />
                    <div className="p-5 text-center border-b border-white/5">
                        <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest drop-shadow-md">Fan Access</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Secure Gateway</p>
                    </div>
                    <div className="grid grid-cols-2 p-4 gap-3">
                        <button onClick={() => { setActiveTab('login'); resetForms(); }} className={`py-3 text-xs font-black uppercase tracking-widest transition-all rounded-sm border relative overflow-hidden group ${activeTab === 'login' ? 'text-black border-ntr-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300'}`}>
                            {activeTab === 'login' && <div className="absolute inset-0 bg-gradient-to-r from-ntr-gold to-yellow-600" />}<span className="relative z-10">LOGIN</span>
                        </button>
                        <button onClick={() => { setActiveTab('signup'); resetForms(); }} className={`py-3 text-xs font-black uppercase tracking-widest transition-all rounded-sm border relative overflow-hidden ${activeTab === 'signup' ? 'text-black border-ntr-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300'}`}>
                            {activeTab === 'signup' && <div className="absolute inset-0 bg-gradient-to-r from-ntr-gold to-yellow-600" />}<span className="relative z-10">SIGN UP</span>
                        </button>
                    </div>
                    <div className="px-6 pb-6">
                        {authError && (<div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded flex items-center gap-2"><AlertTriangle size={14} className="text-red-500 shrink-0" /><span className="text-[10px] text-red-200 uppercase font-bold">{authError}</span></div>)}
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            {activeTab === 'signup' && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                    <div className="space-y-1"><label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Full Name</label><input type="text" placeholder="Enter full name" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-white text-xs focus:border-ntr-gold outline-none rounded-sm transition-colors" /></div>
                                    <div className="space-y-1"><label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">District</label><div className="relative"><div onClick={() => setShowDistrictSearch(!showDistrictSearch)} className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-white text-xs cursor-pointer flex justify-between items-center rounded-sm hover:border-gray-500 transition-colors"><span className="truncate">{district}</span> <Search size={12} className="text-gray-500" /></div>{showDistrictSearch && (<div className="absolute top-full left-0 w-full z-20 bg-black border border-white/20 max-h-40 overflow-y-auto shadow-2xl"><input autoFocus type="text" placeholder="Search..." className="w-full bg-transparent p-2 text-xs text-white border-b border-white/10 outline-none" value={districtSearchQuery} onChange={e => setDistrictSearchQuery(e.target.value)} />{filteredDistricts.map(d => (<div key={d} onClick={() => { setDistrict(d); setShowDistrictSearch(false); }} className="p-2 text-xs text-gray-300 hover:bg-white/10 cursor-pointer">{d}</div>))}</div>)}</div></div>
                                    <div className="flex gap-2"><button type="button" onClick={() => setGender('male')} className={`flex-1 py-2 text-[10px] font-bold uppercase border rounded-sm transition-colors ${gender === 'male' ? 'bg-ntr-gold text-black border-ntr-gold' : 'border-[#333] text-gray-500 hover:border-gray-600'}`}>Male</button><button type="button" onClick={() => setGender('female')} className={`flex-1 py-2 text-[10px] font-bold uppercase border rounded-sm transition-colors ${gender === 'female' ? 'bg-ntr-gold text-black border-ntr-gold' : 'border-[#333] text-gray-500 hover:border-gray-600'}`}>Female</button></div>
                                </motion.div>
                            )}
                            <div className="space-y-1"><label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Username</label><input type="text" placeholder="Enter username" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-white text-xs focus:border-ntr-gold outline-none rounded-sm transition-colors placeholder:text-gray-700" /></div>
                            <div className="space-y-1"><label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Password</label><input type="password" placeholder="Enter password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-white text-xs focus:border-ntr-gold outline-none rounded-sm transition-colors placeholder:text-gray-700" /></div>
                            <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-ntr-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-700 text-black font-black uppercase tracking-[0.2em] mt-6 rounded-sm transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,215,0,0.2)]">
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : (activeTab === 'login' ? 'SECURE LOGIN' : 'JOIN THE PRIDE')}
                            </button>
                        </form>
                    </div>
                    <div className="bg-[#080808] border-t border-white/5 p-4 flex justify-center"><button onClick={() => { setViewMode('admin-select'); resetForms(); }} className="flex items-center gap-2 text-[9px] text-gray-600 hover:text-ntr-gold font-bold uppercase tracking-widest transition-colors"><Shield size={10} /> Admin Access</button></div>
                </motion.div>
            )}

            {viewMode === 'admin-select' && (
                 <motion.div initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} className="bg-[#050505] border border-ntr-gold/30 rounded-lg shadow-[0_0_50px_rgba(255,215,0,0.1)] overflow-hidden">
                     <div className="p-6 text-center border-b border-white/5 bg-gradient-to-b from-ntr-gold/10 to-transparent">
                        <Shield className="w-10 h-10 text-ntr-gold mx-auto mb-3 drop-shadow-lg" />
                        <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest">Admin Portal</h2>
                        <p className="text-[10px] text-ntr-gold uppercase tracking-[0.3em] mt-1">Liveness Check Required</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <button onClick={() => { setAdminActionType('login'); setViewMode('admin-action'); setCameraActive(true); }} className="w-full py-4 bg-[#111] hover:bg-white/10 border border-white/10 hover:border-ntr-gold transition group px-4 flex items-center gap-4 rounded-lg"><div className="p-3 bg-white/5 rounded-full group-hover:bg-ntr-gold group-hover:text-black transition"><ScanFace size={20} /></div><div className="text-left"><span className="block text-white font-bold uppercase tracking-wider text-sm">Face Login</span><span className="text-[10px] text-gray-500">Scan & Blink to Verify</span></div><ChevronRight className="ml-auto text-gray-600 group-hover:text-ntr-gold" /></button>
                        <button onClick={() => { setAdminActionType('enroll'); setViewMode('admin-action'); setCameraActive(true); }} className="w-full py-4 bg-[#111] hover:bg-white/10 border border-white/10 hover:border-ntr-gold transition group px-4 flex items-center gap-4 rounded-lg"><div className="p-3 bg-white/5 rounded-full group-hover:bg-ntr-gold group-hover:text-black transition"><User size={20} /></div><div className="text-left"><span className="block text-white font-bold uppercase tracking-wider text-sm">Enroll Face</span><span className="text-[10px] text-gray-500">For Promoted Admins Only</span></div><ChevronRight className="ml-auto text-gray-600 group-hover:text-ntr-gold" /></button>
                        <button onClick={() => setViewMode('user')} className="w-full text-[10px] text-gray-500 hover:text-white uppercase font-bold py-2 mt-4">Cancel & Return</button>
                    </div>
                </motion.div>
            )}

            {viewMode === 'admin-action' && (
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#050505] border border-ntr-gold/30 rounded-lg overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/50">
                        <span className="text-xs font-bold text-ntr-gold uppercase tracking-widest flex items-center gap-2">{adminActionType === 'enroll' ? 'FACE ENROLLMENT' : 'SECURE LOGIN'}</span>
                        <Lock size={14} className="text-ntr-gold" />
                    </div>

                    <div className="p-6">
                        {/* CAMERA PREVIEW CIRCLE */}
                        <div className="relative w-56 h-56 mx-auto mb-8 rounded-full overflow-hidden border-2 border-ntr-gold shadow-[0_0_30px_rgba(255,215,0,0.2)] bg-gray-900 group">
                             {faceImage ? (
                                 <img src={faceImage} className="w-full h-full object-cover" />
                             ) : (
                                 cameraActive ? (
                                    <>
                                        {/* Video is flipped via CSS to act as mirror */}
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform scale-x-[-1]" />
                                    </>
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                                        <Camera className="text-gray-600" />
                                        <span className="text-[9px] text-gray-600 uppercase">Camera Off</span>
                                    </div>
                                 )
                             )}

                             {/* SCANNING OVERLAY */}
                             {cameraActive && !faceImage && (
                                 <div className="absolute inset-0 pointer-events-none">
                                     {/* Radar Scan Effect */}
                                    <div className="absolute inset-0 border-[4px] border-ntr-gold/50 rounded-full animate-pulse" />
                                    <div className="absolute top-0 left-0 w-full h-1 bg-ntr-gold opacity-50 animate-[float_2s_infinite]" />
                                    
                                    {/* Blink Counter */}
                                    <div className="absolute top-4 right-4 flex gap-1 z-20">
                                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${blinkCount >= 1 ? 'bg-green-500 shadow-[0_0_10px_#00ff00]' : 'bg-gray-700'}`} />
                                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${blinkCount >= 2 ? 'bg-green-500 shadow-[0_0_10px_#00ff00]' : 'bg-gray-700'}`} />
                                    </div>
                                 </div>
                             )}
                             
                             {faceImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="bg-green-500 rounded-full p-2"><Check className="text-white" size={20} /></div>
                                </div>
                             )}
                        </div>

                        {/* STATUS TEXT - MOVED OUTSIDE */}
                        {cameraActive && !faceImage && (
                             <div className="text-center mb-6 min-h-[3rem]">
                                 <div className="inline-block px-4 py-2 bg-white/5 border border-ntr-gold/30 rounded-full">
                                    <p className="text-xs text-ntr-gold font-bold uppercase tracking-widest animate-pulse">
                                        {instruction}
                                    </p>
                                 </div>
                             </div>
                        )}

                        {/* CONTROLS */}
                        <div className="flex justify-center gap-3 mb-6">
                             {!cameraActive && !faceImage && <button type="button" onClick={() => setCameraActive(true)} className="px-4 py-2 bg-white/10 text-[10px] font-bold uppercase rounded hover:bg-white/20">Start Scanner</button>}
                             {faceImage && <button type="button" onClick={() => { setFaceImage(null); setFaceDescriptor(null); setBlinkCount(0); setScanStatus('init'); setCameraActive(true); }} className="px-4 py-2 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase rounded hover:bg-white/5 flex items-center gap-2"><RefreshCw size={12} /> Retake</button>}
                        </div>

                        <form onSubmit={handleAdminSubmit} className="space-y-4">
                            {adminActionType === 'enroll' && (
                                <div className="text-center mb-4">
                                    <p className="text-xs text-gray-400">Scan your face to link it with your promoted Admin account.</p>
                                </div>
                            )}
                            
                            <input type="text" placeholder="Admin Username" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#111] border border-[#333] p-3 text-white text-xs focus:border-ntr-gold outline-none rounded-sm" />

                            <button type="submit" disabled={isLoading || !faceDescriptor} className="w-full py-4 bg-gradient-to-r from-ntr-gold to-yellow-600 text-black font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm shadow-lg">
                                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (adminActionType === 'enroll' ? 'LINK FACE & ACTIVATE' : 'VERIFY & LOGIN')}
                            </button>
                        </form>

                        <button onClick={() => setViewMode('admin-select')} className="w-full text-[10px] text-gray-500 hover:text-white uppercase font-bold mt-4 flex items-center justify-center gap-1">Back</button>
                    </div>
                </motion.div>
            )}

        </motion.div>
      )}
    </div>
  );
};
