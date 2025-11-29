
import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, Type, Image as ImageIcon, Sparkles, Lock, Wand2, Key } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const Wallpaper = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'ai'>('studio');
  
  // Studio State
  const [text, setText] = useState('JAI NTR');
  const [bgIndex, setBgIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // AI Gen State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [hasPaidKey, setHasPaidKey] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');

  // Updated background seeds to be specifically about NTR/Action/Movies, removing generic nature
  const bgs = [
    'https://picsum.photos/seed/devara/1080/1920?grayscale&blur=2', // Devara Theme (Dark/Water)
    'https://picsum.photos/seed/rrrfire/1080/1920', // RRR Theme (Fire)
    'https://picsum.photos/seed/ntraction/1080/1920', // Action Theme
    'https://picsum.photos/seed/youngtiger/1080/1920?blur=1', // Tiger Theme
  ];

  const bgNames = ["Devara Sea", "RRR Fire", "Mass Action", "Tiger Spirit"];

  // Check for Paid Key availability
  useEffect(() => {
    checkKeyStatus();
  }, [activeTab]);

  const checkKeyStatus = async () => {
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setHasPaidKey(hasKey);
    }
  };

  const handleUnlockKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      await checkKeyStatus();
    } else {
      alert("AI Studio environment not detected. Cannot select key.");
    }
  };

  const handleDownload = () => {
    alert("In a real app, this would trigger html2canvas/dom-to-image download of the preview area.");
  };

  const handleDownloadAI = () => {
    if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `ntr-ai-gen-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const generateAIImage = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
        // Re-initialize to ensure we use the selected paid key from the environment
        const apiKey = process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey || '' });
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt + " The image should be highly detailed, photorealistic, cinematic lighting, 8k resolution." }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: "1K" // High quality
                }
            }
        });

        // Extract image
        let foundImage = false;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const base64String = part.inlineData.data;
                    setGeneratedImage(`data:image/png;base64,${base64String}`);
                    foundImage = true;
                    break;
                }
            }
        }
        if (!foundImage) {
            alert("No image generated. The model might have refused the prompt.");
        }

    } catch (e: any) {
        console.error(e);
        if (e.message?.includes("Requested entity was not found") || e.status === 404) {
            setHasPaidKey(false); // Force re-selection
            alert("Session expired or key invalid. Please select your API Key again.");
        } else {
            alert("Generation failed. Please try a different prompt.");
        }
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 flex flex-col items-center pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-black text-white mb-2">WALLPAPER STUDIO</h1>
        <div className="flex bg-white/10 p-1 rounded-full inline-flex">
            <button 
                onClick={() => setActiveTab('studio')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${activeTab === 'studio' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
                <ImageIcon size={16} /> Templates
            </button>
            <button 
                onClick={() => setActiveTab('ai')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${activeTab === 'ai' ? 'bg-ntr-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
                <Sparkles size={16} /> AI Gen (Pro)
            </button>
        </div>
      </div>
      
      {activeTab === 'studio' ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-4xl">
            {/* Editor Controls */}
            <div className="w-full lg:w-1/3 space-y-6 glass-panel p-6 rounded-xl order-2 lg:order-1">
            <div>
                <label className="text-xs text-gray-400 block mb-2">CUSTOM TEXT</label>
                <div className="flex gap-2">
                <input 
                    type="text" 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white"
                    maxLength={15}
                />
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-400 block mb-2">THEME SELECTION</label>
                <div className="grid grid-cols-2 gap-2">
                {bgs.map((bg, idx) => (
                    <button 
                    key={idx}
                    onClick={() => setBgIndex(idx)}
                    className={`relative h-20 rounded overflow-hidden border-2 transition ${bgIndex === idx ? 'border-ntr-orange opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                    <img src={bg} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-[10px] font-bold text-white uppercase">{bgNames[idx]}</span>
                    </div>
                    </button>
                ))}
                </div>
            </div>

            <button 
                onClick={handleDownload}
                className="w-full py-3 bg-ntr-gold text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-ntr-goldDark transition"
            >
                <Download size={18} /> Download HD
            </button>
            </div>

            {/* Preview Area */}
            <div className="w-full lg:w-2/3 flex justify-center order-1 lg:order-2">
            <div 
                ref={canvasRef}
                className="relative w-[300px] h-[533px] bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800"
            >
                {/* Background */}
                <img src={bgs[bgIndex]} className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

                {/* Content */}
                <div className="absolute top-10 left-0 right-0 text-center">
                    <span className="text-[10px] tracking-[0.5em] text-ntr-gold font-bold">NTR ARTS</span>
                </div>

                <div className="absolute bottom-20 left-0 right-0 text-center p-4">
                <h2 className="text-4xl font-display font-black text-white text-glow tracking-tighter uppercase drop-shadow-lg break-words leading-none">
                    {text}
                </h2>
                <div className="w-16 h-1 bg-ntr-orange mx-auto mt-4 rounded-full" />
                </div>

                {/* Watermark */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className="text-[8px] text-white/40 tracking-widest font-mono">NTR WORLD OFFICIAL</span>
                </div>
            </div>
            </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl glass-panel rounded-2xl border border-ntr-gold/20 overflow-hidden flex flex-col lg:flex-row">
            {/* AI Controls */}
            <div className="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20">
                <div className="mb-6">
                   <h3 className="font-bold text-white flex items-center gap-2">
                     <Wand2 size={18} className="text-ntr-gold" /> AI Prompt
                   </h3>
                   <p className="text-xs text-gray-400">Describe the NTR wallpaper you want.</p>
                </div>

                {!hasPaidKey ? (
                    <div className="text-center py-8 px-4 bg-yellow-900/10 border border-yellow-500/30 rounded-xl">
                        <Lock size={32} className="mx-auto text-yellow-400 mb-3" />
                        <h4 className="font-bold text-white mb-2">Pro Feature Locked</h4>
                        <p className="text-xs text-gray-400 mb-4">High-quality image generation requires a paid Google Cloud API Key.</p>
                        <button 
                          onClick={handleUnlockKey}
                          className="w-full py-2 bg-gradient-to-r from-ntr-gold to-yellow-600 text-black font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                        >
                            <Key size={14} /> Unlock AI Power
                        </button>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block mt-3 text-[10px] text-blue-400 hover:underline">
                            View Billing Docs
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g., Jr NTR wearing a sharp black tuxedo, walking on a red carpet, cinematic lighting..."
                            className="w-full h-32 bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-ntr-gold outline-none resize-none"
                        />
                        
                        {/* Quick Prompts */}
                        <div>
                            <span className="text-[10px] uppercase text-gray-500 font-bold mb-2 block">Quick Styles</span>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setPrompt("Jr NTR in a futuristic sci-fi armor suit, neon city background, cyberpunk style, 8k")} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-300">🤖 Cyberpunk</button>
                                <button onClick={() => setPrompt("Jr NTR wearing a classic black tuxedo, elegant ballroom background, photorealistic")} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-300">🕴️ Formal Suit</button>
                                <button onClick={() => setPrompt("Jr NTR as a fierce warrior with a spear, stormy ocean background like Devara, dramatic lighting")} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-300">🌊 Devara Warrior</button>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase text-gray-500 font-bold mb-2 block">Aspect Ratio</span>
                            <div className="grid grid-cols-3 gap-2">
                                {['9:16', '16:9', '1:1'].map((r) => (
                                    <button 
                                      key={r} 
                                      onClick={() => setAspectRatio(r as any)}
                                      className={`text-xs py-2 rounded border transition ${aspectRatio === r ? 'bg-ntr-gold text-black border-ntr-gold font-bold' : 'bg-transparent text-gray-400 border-gray-700'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={generateAIImage}
                            disabled={isGenerating || !prompt}
                            className="w-full py-3 bg-ntr-gold text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-ntr-goldDark transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            {isGenerating ? 'Generating...' : 'Generate Image'}
                        </button>
                    </div>
                )}
            </div>

            {/* AI Preview */}
            <div className="w-full lg:w-2/3 min-h-[400px] bg-black/50 flex items-center justify-center p-8 relative">
                {isGenerating && (
                    <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-ntr-gold border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-ntr-gold font-bold animate-pulse">Creating Masterpiece...</p>
                        <p className="text-gray-500 text-xs mt-2">This may take a few moments</p>
                    </div>
                )}
                
                {generatedImage ? (
                    <div className="relative group">
                        <img 
                          src={generatedImage} 
                          alt="AI Generated" 
                          className="max-h-[500px] w-auto max-w-full rounded shadow-2xl border border-white/10"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                             <button 
                               onClick={handleDownloadAI}
                               className="px-6 py-3 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:scale-105 transition"
                             >
                                <Download size={20} /> Download Image
                             </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-600">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Enter a prompt to generate <br/>a unique NTR wallpaper.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
