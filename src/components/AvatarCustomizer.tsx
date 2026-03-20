import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  Check, 
  RefreshCw, 
  Palette, 
  Scissors, 
  Shirt,
  X,
  Save,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Avataaars' },
  { id: 'bottts', label: 'Robots' },
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'big-ears', label: 'Big Ears' },
];

const HAIRSTYLES = [
  'longHair', 'shortHair', 'eyepatch', 'hat', 'hijab', 'turban', 'winterHat1', 
  'longHairBigHair', 'longHairBob', 'longHairBun', 'longHairCurly', 'longHairCurvy', 
  'longHairDreads', 'longHairFrida', 'longHairFro', 'longHairFroBand', 'longHairNotTooLong', 
  'longHairShavedSides', 'longHairMiaWallace', 'longHairStraight', 'longHairStraight2', 
  'longHairStraightStrand', 'shortHairDreads01', 'shortHairDreads02', 'shortHairFrizzle', 
  'shortHairShaggyMullet', 'shortHairShortCurly', 'shortHairShortFlat', 'shortHairShortRound', 
  'shortHairShortWaved', 'shortHairSides', 'shortHairTheCaesar', 'shortHairTheCaesarSidePart'
];

const HAIR_COLORS = [
  { id: '2c1b18', label: 'Black' },
  { id: '4a312c', label: 'Dark Brown' },
  { id: '724130', label: 'Brown' },
  { id: 'a55728', label: 'Auburn' },
  { id: 'b58143', label: 'Blonde' },
  { id: 'c93305', label: 'Red' },
  { id: 'e8e1e1', label: 'Silver' },
  { id: 'f59797', label: 'Pink' },
];

const CLOTHING = [
  'blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 
  'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'
];

const CLOTHING_COLORS = [
  { id: '262e33', label: 'Black' },
  { id: '65c9ff', label: 'Blue' },
  { id: '5199e4', label: 'Dark Blue' },
  { id: '25557c', label: 'Navy' },
  { id: 'e6e6e6', label: 'Gray' },
  { id: '929598', label: 'Dark Gray' },
  { id: '3c4f5e', label: 'Slate' },
  { id: 'ff5c5c', label: 'Red' },
  { id: 'ff488e', label: 'Pink' },
  { id: 'ffafb9', label: 'Light Pink' },
  { id: 'ffffb1', label: 'Yellow' },
  { id: 'ffda51', label: 'Gold' },
  { id: 'a7ffc4', label: 'Green' },
  { id: '6b86e1', label: 'Indigo' },
];

const SKIN_COLORS = [
  { id: '614335', label: 'Deep' },
  { id: 'ae5d29', label: 'Dark' },
  { id: 'd08b5b', label: 'Tan' },
  { id: 'edb98a', label: 'Medium' },
  { id: 'f8d25c', label: 'Yellow' },
  { id: 'fd9841', label: 'Orange' },
  { id: 'ffdbb4', label: 'Light' },
];

interface AvatarCustomizerProps {
  onClose: () => void;
}

export default function AvatarCustomizer({ onClose }: AvatarCustomizerProps) {
  const { user, refreshUser } = useAuth();
  const [style, setStyle] = useState('avataaars');
  const [seed, setSeed] = useState(user?.username || 'lucky');
  const [options, setOptions] = useState({
    top: 'shortHair',
    hairColor: '2c1b18',
    clothing: 'shirtCrewNeck',
    clothingColor: '65c9ff',
    skinColor: 'edb98a',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'style' | 'hair' | 'clothing' | 'skin'>('style');

  useEffect(() => {
    // Try to parse existing avatar URL if it's a DiceBear URL
    if (user?.avatar_url?.includes('api.dicebear.com')) {
      const url = new URL(user.avatar_url);
      const styleMatch = url.pathname.match(/\/7\.x\/([^/]+)/);
      if (styleMatch) setStyle(styleMatch[1]);
      
      const seedParam = url.searchParams.get('seed');
      if (seedParam) setSeed(seedParam);

      const newOptions = { ...options };
      url.searchParams.forEach((value, key) => {
        if (key in newOptions) {
          (newOptions as any)[key] = value;
        }
      });
      setOptions(newOptions);
    }
  }, [user?.avatar_url]);

  const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&top=${options.top}&hairColor=${options.hairColor}&clothing=${options.clothing}&clothingColor=${options.clothingColor}&skinColor=${options.skinColor}`;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/avatar/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });
      if (res.ok) {
        await refreshUser();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save avatar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const randomize = () => {
    setSeed(Math.random().toString(36).substring(7));
    setOptions({
      top: HAIRSTYLES[Math.floor(Math.random() * HAIRSTYLES.length)],
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].id,
      clothing: CLOTHING[Math.floor(Math.random() * CLOTHING.length)],
      clothingColor: CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)].id,
      skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)].id,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-900 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[800px]"
      >
        {/* Left Side: Preview */}
        <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col items-center justify-center bg-slate-950/50 border-b md:border-b-0 md:border-r border-white/5">
          <div className="relative group">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[40px] glass-surface border-4 border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center bg-slate-900/50">
              <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full" />
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={randomize}
              className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-xl text-white"
            >
              <RefreshCw className="w-6 h-6" />
            </motion.button>
          </div>
          
          <div className="mt-12 text-center space-y-2">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Personalize</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Express your unique style</p>
          </div>

          <div className="mt-auto w-full pt-8 flex gap-4">
            <Button variant="ghost" onClick={onClose} className="flex-1 h-14 font-black uppercase italic tracking-tighter">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 h-14 font-black uppercase italic tracking-tighter shadow-lg shadow-blue-600/20"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save</>}
            </Button>
          </div>
        </div>

        {/* Right Side: Customization Options */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex p-4 gap-2 border-b border-white/5 bg-slate-900/50">
            {[
              { id: 'style', icon: User, label: 'Style' },
              { id: 'hair', icon: Scissors, label: 'Hair' },
              { id: 'clothing', icon: Shirt, label: 'Clothing' },
              { id: 'skin', icon: Palette, label: 'Skin' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeCategory === cat.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <cat.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Options Grid */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeCategory === 'style' && (
                <motion.div
                  key="style"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {AVATAR_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group",
                        style === s.id 
                          ? "bg-blue-600/10 border-blue-600" 
                          : "bg-slate-950 border-white/5 hover:border-white/20"
                      )}
                    >
                      <img 
                        src={`https://api.dicebear.com/7.x/${s.id}/svg?seed=${seed}`} 
                        alt={s.label} 
                        className="w-16 h-16 rounded-xl"
                      />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        style === s.id ? "text-blue-400" : "text-slate-500"
                      )}>{s.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {activeCategory === 'hair' && (
                <motion.div
                  key="hair"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hairstyle</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {HAIRSTYLES.map((h) => (
                        <button
                          key={h}
                          onClick={() => setOptions({ ...options, top: h })}
                          className={cn(
                            "aspect-square rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden p-2",
                            options.top === h 
                              ? "bg-blue-600/10 border-blue-600" 
                              : "bg-slate-950 border-white/5 hover:border-white/20"
                          )}
                        >
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=preview&top=${h}&hairColor=${options.hairColor}`} 
                            alt={h} 
                            className="w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hair Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {HAIR_COLORS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setOptions({ ...options, hairColor: c.id })}
                          className={cn(
                            "w-10 h-10 rounded-full border-4 transition-all relative group",
                            options.hairColor === c.id ? "border-white scale-110" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: `#${c.id}` }}
                          title={c.label}
                        >
                          {options.hairColor === c.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeCategory === 'clothing' && (
                <motion.div
                  key="clothing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outfit</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {CLOTHING.map((c) => (
                        <button
                          key={c}
                          onClick={() => setOptions({ ...options, clothing: c })}
                          className={cn(
                            "aspect-square rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden p-2",
                            options.clothing === c 
                              ? "bg-blue-600/10 border-blue-600" 
                              : "bg-slate-950 border-white/5 hover:border-white/20"
                          )}
                        >
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=preview&clothing=${c}&clothingColor=${options.clothingColor}`} 
                            alt={c} 
                            className="w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clothing Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {CLOTHING_COLORS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setOptions({ ...options, clothingColor: c.id })}
                          className={cn(
                            "w-10 h-10 rounded-full border-4 transition-all relative group",
                            options.clothingColor === c.id ? "border-white scale-110" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: `#${c.id}` }}
                          title={c.label}
                        >
                          {options.clothingColor === c.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeCategory === 'skin' && (
                <motion.div
                  key="skin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Skin Tone</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {SKIN_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setOptions({ ...options, skinColor: c.id })}
                        className={cn(
                          "aspect-square rounded-3xl border-4 transition-all relative group flex flex-col items-center justify-center gap-2",
                          options.skinColor === c.id ? "border-blue-600 bg-blue-600/10" : "border-white/5 bg-slate-950 hover:border-white/20"
                        )}
                      >
                        <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: `#${c.id}` }} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{c.label}</span>
                        {options.skinColor === c.id && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-3 h-3 text-blue-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-950/50 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-950 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
