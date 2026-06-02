import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Trophy, 
  Timer, 
  MapPin, 
  Beer, 
  Play, 
  Square, 
  RotateCcw,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Coffee,
  ExternalLink,
  Settings2,
  GlassWater,
  Keyboard
} from 'lucide-react';

// --- CONFIGURATION & FIREBASE INIT ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Updated full 8-waypoint walking directions URL
const MAP_URL = "https://www.google.com/maps/dir/King+Street+Bar+%26+Oven,+170+S+King+St,+Seattle,+WA+98104/Flatstick+Pub+-+Pioneer+Square,+240+2nd+Ave+S,+Seattle,+WA+98104/Central+Saloon,+207+1st+Ave+S,+Seattle,+WA+98104/McCoy's+Firehouse+Bar+%26+Grill,+173+S+Washington+St,+Seattle,+WA+98104/Owl+N'+Thistle,+808+Post+Ave,+Seattle,+WA+98104/Blarney+Stone+Pub,+1416+1st+Ave,+Seattle,+WA+98101/Jupiter+Bar,+2126+2nd+Ave+Suite+A,+Seattle,+WA+98121/Buckley's+in+Belltown,+2331+2nd+Ave,+Seattle,+WA+98121/data=!3m1!4b1!4m2!4m1!3e2";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pub-run-april-10-2026';

// --- UPDATED ROUTE VECTOR (8 BARS) ---
const STOPS = [
  { id: 0, name: "King Street Bar & Oven" },
  { id: 1, name: "Flatstick Pub" },
  { id: 2, name: "Central Saloon" },
  { id: 3, name: "McCoy's Firehouse" },
  { id: 4, name: "Owl N' Thistle" },
  { id: 5, name: "Blarney Stone Pub" },
  { id: 6, name: "Jupiter Bar" },
  { id: 7, name: "Buckley's in Belltown" }
];

const CATEGORIES = {
  CASUAL: 'casual',
  TRYHARD: 'tryhard',
  FOUR_DRINK: 'four_drink'
};

// --- HELPERS ---
const formatTime = (ms) => {
  if (!ms || ms === 0) return "--:--";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  const p = (n) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${p(minutes)}:${p(seconds)}` : `${p(minutes)}:${p(seconds)}`;
};

const parseTimeToMs = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) { // H:M:S
    return (parts * 3600 + parts * 60 + parts) * 1000;
  } else if (parts.length === 2) { // M:S
    return (parts * 60 + parts) * 1000;
  }
  return Number(timeStr) * 1000;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [view, setView] = useState('auth'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth failed", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setView('auth');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        if (view === 'auth') setView('map');
      } else {
        setUserData(null);
        setView('auth');
      }
      setLoading(false);
    }, (err) => console.error(err));

    const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'participants');
    const unsubAll = onSnapshot(participantsRef, (querySnapshot) => {
      const p = [];
      querySnapshot.forEach(doc => p.push(doc.data()));
      setAllParticipants(p);
    }, (err) => console.error(err));

    return () => { unsubUser(); unsubAll(); };
  }, [user, view]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 bg-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-radial pointer-events-none" />
      <Beer className="animate-bounce w-12 h-12 relative z-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 w-full overflow-x-hidden bg-grid relative">
      <div className="fixed inset-0 bg-radial pointer-events-none z-0" />
      
      <main className="relative z-10 w-full max-w-lg mx-auto pb-40 px-6 pt-8 min-h-screen">
        <div className="animate-in fade-in duration-1000">
          {view === 'auth' && <AuthScreen user={user} allParticipants={allParticipants} />}
          {view === 'map' && userData && <RouteScreen userData={userData} setView={setView} />}
          {view === 'race' && userData && <RaceScreen user={user} userData={userData} setView={setView} />}
          {view === 'leaderboard' && userData && <Leaderboard participants={allParticipants} currentUserId={user?.uid} userData={userData} />}
          {view === 'rules' && userData && <RulesView user={user} userData={userData} setView={setView} />}
        </div>
      </main>

      {userData && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
          <nav className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto ring-1 ring-white/5">
            <NavButton active={view === 'map'} icon={<MapPin size={20}/>} label="Checklist" onClick={() => setView('map')} />
            <NavButton active={view === 'race'} icon={<Timer size={20}/>} label="Race" onClick={() => setView('race')} />
            
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center flex-1 text-slate-500 hover:text-amber-500 transition-all duration-300 group">
              <div className="p-2 rounded-xl bg-slate-800/50 mb-1 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
                <ExternalLink size={20}/>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100">Maps</span>
            </a>

            <NavButton active={view === 'leaderboard'} icon={<Trophy size={20}/>} label="Stats" onClick={() => setView('leaderboard')} />
            <NavButton active={view === 'rules'} icon={<ShieldCheck size={20}/>} label="Rules" onClick={() => setView('rules')} />
          </nav>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center transition-all flex-1 ${active ? 'text-amber-500' : 'text-slate-500'}`}>
      <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-amber-500/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] mt-1 font-black uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}

function AuthScreen({ user, allParticipants }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState(CATEGORIES.CASUAL);
  const [saving, setSaving] = useState(false);
  const [resetTimer, setResetTimer] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !username || !user) return;
    setSaving(true);

    const cleanUsername = username.toLowerCase().replace(/\s/g, '');
    const existing = allParticipants.find(p => p.username === cleanUsername);

    let profile;
    if (existing) {
      profile = {
        ...existing,
        uid: user.uid,
        name: name,
        category: existing.category || CATEGORIES.CASUAL 
      };
      if (existing.uid !== user.uid) {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', existing.uid));
        } catch (e) {}
      }
    } else {
      profile = {
        uid: user.uid,
        name,
        username: cleanUsername,
        category,
        splits: {}, 
        totalTime: 0,
        currentStop: 0,
        joinedAt: Date.now()
      };
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), profile);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), profile);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const startResetTimer = () => {
    const timer = setTimeout(async () => {
      if (!user) return;
      setSaving(true);
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'));
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid));
        window.location.reload(); 
      } catch (err) { console.error(err); }
    }, 3000);
    setResetTimer(timer);
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div 
        className="text-center select-none"
        onMouseDown={startResetTimer}
        onMouseUp={() => clearTimeout(resetTimer)}
        onTouchStart={startResetTimer}
        onTouchEnd={() => clearTimeout(resetTimer)}
      >
        <div className="bg-amber-500 p-4 rounded-3xl inline-block mb-4 shadow-xl shadow-amber-500/20 active:scale-90 transition-transform cursor-pointer">
          <Beer size={48} className="text-slate-950" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Seattle Pub Run</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">April 10, 2026</p>
      </div>

      <form onSubmit={handleRegister} className="w-full space-y-5">
        <div className="space-y-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Real Name</label>
            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/50 transition-all outline-none" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Race Handle (unique)</label>
            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/50 transition-all outline-none" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="" required />
            <p className="text-[10px] text-slate-600 mt-1 ml-1 uppercase font-bold italic">Using an existing handle resumes progress.</p>
          </div>
          
          <div className="space-y-3 pt-2">
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Choose Challenge Tier</label>
             <CategorySelect current={category} onSelect={setCategory} />
          </div>
        </div>

        <button disabled={saving} type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50">
          {saving ? 'SYNCING DATA...' : 'ENTER THE GAUNTLET'}
        </button>
      </form>
    </div>
  );
}

function CategorySelect({ current, onSelect }) {
  return (
    <div className="space-y-2">
      <CategoryOption 
        active={current === CATEGORIES.TRYHARD} 
        onClick={() => onSelect(CATEGORIES.TRYHARD)}
        icon={<Zap size={16} fill="currentColor" />}
        title="Full Tryhard (8 Drinks)"
        desc="1 full drink at EVERY bar (8 total)."
      />
      <CategoryOption 
        active={current === CATEGORIES.FOUR_DRINK} 
        onClick={() => onSelect(CATEGORIES.FOUR_DRINK)}
        icon={<Beer size={16} fill="currentColor" />}
        title="4-Drink Sprint"
        desc="4 drinks consumed before reaching the final bar."
      />
      <CategoryOption 
        active={current === CATEGORIES.CASUAL} 
        onClick={() => onSelect(CATEGORIES.CASUAL)}
        icon={<Coffee size={16} />}
        title="Casual Pacer"
        desc="No drinking requirements. Just vibes and miles."
      />
    </div>
  );
}

function CategoryOption({ active, onClick, icon, title, desc }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${active ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-950 border-slate-800'}`}
    >
      <div className={`mt-1 w-6 h-6 shrink-0 rounded flex items-center justify-center transition-all ${active ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-amber-500' : 'text-slate-400'}`}>{title}</h4>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function RouteScreen({ userData, setView }) {
  const catLabel = userData.category === CATEGORIES.TRYHARD ? 'Tryhard (8)' : 
                   userData.category === CATEGORIES.FOUR_DRINK ? '4-Drink Sprint' : 'Casual';
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      <header className="flex flex-col gap-1">
        <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
          {userData.category === CATEGORIES.TRYHARD ? <Zap size={14} fill="currentColor" /> : 
           userData.category === CATEGORIES.FOUR_DRINK ? <Beer size={14} fill="currentColor" /> : <Coffee size={14} />} 
          {catLabel}
        </h2>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">The Route</h1>
      </header>

      <div className="space-y-3">
        {STOPS.map((stop, idx) => {
          const isCompleted = userData.currentStop > idx;
          const isCurrent = userData.currentStop === idx;
          return (
            <div key={stop.id} className={`p-4 rounded-2xl border transition-all w-full ${isCurrent ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10' : isCompleted ? 'bg-slate-900/40 border-slate-800/50' : 'bg-slate-900/20 border-slate-800/30'}`}>
              <div className="flex items-center gap-4 w-full">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isCurrent ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-black uppercase italic text-sm truncate ${isCurrent ? 'text-white' : 'text-slate-500'} ${isCompleted ? 'line-through decoration-emerald-500/50 decoration-2' : ''}`}>
                    {stop.name}
                  </h3>
                </div>
                {isCurrent && idx < STOPS.length - 1 && (
                  <button onClick={() => setView('race')} className="shrink-0 bg-amber-500 p-2.5 rounded-xl text-slate-950 active:scale-90 shadow-lg shadow-amber-500/20">
                    <Timer size={20} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RaceScreen({ user, userData, setView }) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualTime, setManualTime] = useState("");

  useEffect(() => {
    let interval;
    if (isRunning) { interval = setInterval(() => setElapsed(Date.now() - startTime), 100); }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleFinishLeg = async (timeToUse = elapsed) => {
    const newSplits = { ...userData.splits, [userData.currentStop + 1]: timeToUse };
    const totalTime = Object.values(newSplits).reduce((a, b) => a + b, 0);
    try {
      const updates = { splits: newSplits, totalTime: totalTime, currentStop: userData.currentStop + 1 };
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), updates);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), updates);
      setIsRunning(false); setElapsed(0); setManualMode(false); setManualTime("");
    } catch (err) { console.error(err); }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const ms = parseTimeToMs(manualTime);
    if (ms > 0) handleFinishLeg(ms);
  };

  const handleRedoLeg = async () => {
    if (userData.currentStop === 0) return;
    const newSplits = { ...userData.splits };
    delete newSplits[userData.currentStop];
    const totalTime = Object.values(newSplits).reduce((a, b) => a + b, 0);
    const updates = { 
      splits: newSplits, 
      totalTime, 
      currentStop: userData.currentStop - 1,
      hardcoreCompleted: false,
      failedHardcore: false
    };
    
    // If they were demoted to 4-drink for failing, restore Tryhard status on redo
    if (userData.failedHardcore) {
      updates.category = CATEGORIES.TRYHARD;
    }

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), updates);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), updates);
    } catch (err) { console.error(err); }
  };

  const handleHardcoreSuccess = async () => {
    try {
      const updates = { hardcoreCompleted: true };
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), updates);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), updates);
    } catch (err) { console.error(err); }
  };

  const handleHardcoreFail = async () => {
    try {
      const updates = { category: CATEGORIES.FOUR_DRINK, failedHardcore: true };
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), updates);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), updates);
    } catch (err) { console.error(err); }
  };

  if (userData.currentStop >= STOPS.length - 1) {
    const isTryhard = userData.category === CATEGORIES.TRYHARD;
    const hasDecided = userData.hardcoreCompleted || userData.failedHardcore;

    if (isTryhard && !hasDecided) {
      return (
        <div className="text-center py-12 space-y-8 animate-in fade-in duration-700">
          <div className="bg-amber-500/10 border-2 border-amber-500 p-8 rounded-[3rem] space-y-6 shadow-2xl shadow-amber-500/20">
            <Zap size={64} className="mx-auto text-amber-500 animate-pulse" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">The Final Ascension</h2>
            <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
              "Your 8th and final drink must be a shot or immediately chugged full drink. Should you accept this challenge, ascend into greatness. Otherwise, you will descend into the mediocrity of the 4 drink category. The choice is yours."
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <button onClick={handleHardcoreSuccess} className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg uppercase italic">
                I took the drink.
              </button>
              <button onClick={handleHardcoreFail} className="w-full bg-slate-800 text-slate-400 font-black py-4 rounded-2xl active:scale-95 transition-all text-sm uppercase italic">
                I give up.
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12 space-y-6">
        <div className="relative inline-block">
          <Trophy size={96} className="mx-auto text-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]" />
          {userData.hardcoreCompleted && <span className="absolute -top-4 -right-4 text-5xl">🌿</span>}
          {userData.failedHardcore && <span className="absolute -top-4 -right-4 text-5xl">😞</span>}
          {!hasDecided && <Zap className="absolute -top-4 -right-4 text-amber-300 animate-pulse" size={40} />}
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Gauntlet Complete</h1>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl inline-block w-full">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Final Official Time</p>
            <p className="text-white font-mono text-4xl font-black tabular-nums">{formatTime(userData.totalTime)}</p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
           <button onClick={() => setView('leaderboard')} className="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all">VIEW STANDINGS</button>
           <button onClick={handleRedoLeg} className="text-slate-500 font-black text-[10px] uppercase underline tracking-widest hover:text-slate-300">Redo Last Leg</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 w-full overflow-hidden">
      <header className="space-y-1">
        <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Timer size={14} /> LEG {userData.currentStop + 1} SPRINT
            </h2>
            <button 
                onClick={() => {setManualMode(!manualMode); setIsRunning(false); setElapsed(0);}}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${manualMode ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-800 text-slate-500'}`}
            >
                {manualMode ? 'USE LIVE TIMER' : 'MANUAL ENTRY'}
            </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xl font-black text-white italic uppercase tracking-tight">
          <span className="truncate">{STOPS[userData.currentStop].name}</span>
          <span className="text-slate-700">→</span>
          <span className="truncate">{STOPS[userData.currentStop + 1].name}</span>
        </div>
      </header>

      <div className="bg-slate-900 rounded-[3rem] py-14 px-6 border border-slate-800 text-center space-y-10 shadow-2xl relative overflow-hidden">
        {manualMode ? (
            <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Manual Leg Time</span>
                    <input 
                        type="text" 
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        placeholder="MM:SS"
                        className="w-full bg-transparent text-5xl font-mono font-black text-white text-center outline-none border-b-2 border-slate-800 focus:border-amber-500 pb-2"
                        autoFocus
                    />
                    <p className="text-[9px] text-slate-600 font-bold uppercase italic mt-2">Example: 4:30 or 12:45</p>
                </div>
                <button type="submit" className="w-full bg-amber-500 text-slate-950 py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg shadow-lg active:scale-95">
                    <Keyboard size={20} /> RECORD MANUALLY
                </button>
            </form>
        ) : (
            <>
                <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Elapsed Time</span>
                <div className="text-7xl font-mono font-black text-white tabular-nums tracking-tighter leading-none">
                    {formatTime(elapsed)}
                </div>
                </div>
                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                {!isRunning ? (
                    <button onClick={() => {setStartTime(Date.now()); setIsRunning(true);}} className="w-full bg-emerald-500 text-slate-950 py-6 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all">
                    <Play size={24} fill="currentColor" /> START CLOCK
                    </button>
                ) : (
                    <button onClick={() => handleFinishLeg()} className="w-full bg-red-500 text-white py-6 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-[0_10px_20px_rgba(239,68,68,0.3)] active:scale-95 transition-all">
                    <Square size={24} fill="currentColor" /> ARRIVED AT BAR
                    </button>
                )}
                </div>
            </>
        )}
        {isRunning && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />}
      </div>

      <div className="flex flex-col items-center gap-4">
        {userData.currentStop > 0 && !isRunning && (
            <button onClick={handleRedoLeg} className="flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-slate-400 transition-colors">
            <RotateCcw size={12} /> Redo Previous leg
            </button>
        )}
      </div>
    </div>
  );
}

function RulesView({ user, userData, setView }) {
  const [showCategorySettings, setShowCategorySettings] = useState(false);

  const updateCategory = async (newCat) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { category: newCat });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', user.uid), { category: newCat });
      setShowCategorySettings(false);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full">
      <header className="flex flex-col gap-1">
          <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest italic">The Code of Conduct</h2>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Rules of Day</h1>
      </header>

      <div className="space-y-4">
        <button 
          onClick={() => setShowCategorySettings(!showCategorySettings)}
          className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all group ${showCategorySettings ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-xl' : 'bg-slate-900 border-amber-500/40 text-white hover:border-amber-500 shadow-lg'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${showCategorySettings ? 'bg-slate-950 text-amber-500' : 'bg-amber-500/20 text-amber-500'}`}>
                <Settings2 size={24} />
            </div>
            <div className="text-left">
                <span className="text-[10px] font-black uppercase block opacity-60">Account Settings</span>
                <span className="text-lg font-black uppercase italic leading-none block">Change Category</span>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${showCategorySettings ? 'rotate-90' : 'group-hover:translate-x-1'}`}>
            →
          </div>
        </button>

        {showCategorySettings && (
            <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-amber-500/30 animate-in slide-in-from-top-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 italic">Select New Tier</h3>
                <CategorySelect current={userData.category} onSelect={updateCategory} />
                <p className="text-[9px] text-slate-500 uppercase font-black mt-4 italic text-center">Changes reflect instantly across the race</p>
            </div>
        )}

        {!showCategorySettings && (
            <>
                <RuleCard 
                    icon={<Zap className="text-amber-500" />} 
                    title="The Tryhard Challenge"
                    body="For the elite: you must have a full drink at every single bar (8 total). Timing is active for the sprints between bars, including the final leg from Bar 7 to Bar 8. Once you reach the end, you'll have a final button to mark that you've finished your 8th drink."
                />
                <RuleCard 
                    icon={<Beer className="text-amber-400" />} 
                    title="Mid-Tier (4-Drink Sprint)"
                    body="The sweet spot: you just need to have 4 drinks total in your system before you get to Buckley's. Pace yourself however you want, but ensure the quota is met before arrival."
                />
                <RuleCard 
                    icon={<Timer className="text-emerald-400" />} 
                    title="Timing Rules"
                    body="Time does NOT accrue while you are in a bar; it only counts when you are racing between them. STOP the timer the moment you touch the door of the next bar. The timer continues to increment even when your screen is off, but we recommend you remember your times just in case you need to manually input anything."
                />
                <RuleCard 
                    icon={<Keyboard className="text-blue-400" />} 
                    title="Fixes & Manual Entry"
                    body="If you mess anything up, don't panic. There is a 'Reset Last Leg' button and a 'Manual Entry' button. Use them to keep the data honest if you miss a button or the app glitches."
                />
                <RuleCard 
                    icon={<Zap size={16} className="text-amber-500" />} 
                    title="Locomotion & Spirit"
                    body="Foot-based locomotion is strictly required—running, skipping, walking, sprinting, or tip-toeing. No Lime scooters, Ubers, or rides. That breaks the spirit of the game—unless you need them for health, time, or safety reasons, in which case you can simply choose not to 'finish' on the app."
                />
            </>
        )}
      </div>

      <button onClick={() => setView('map')} className="w-full bg-slate-800 text-white font-black py-4 rounded-xl uppercase mt-4 shadow-lg active:scale-95 transition-all tracking-[0.1em]">
        CLOSE RULES
      </button>
    </div>
  );
}

function RuleCard({ icon, title, body }) {
  return (
    <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-3xl flex gap-4 w-full">
      <div className="shrink-0 pt-1">{icon}</div>
      <div className="space-y-1">
        <h4 className="text-[11px] font-black uppercase text-white tracking-widest leading-none">{title}</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1">{body}</p>
      </div>
    </div>
  );
}

function Leaderboard({ participants, currentUserId, userData }) {
  const [tab, setTab] = useState('overall');
  const [filterMode, setFilterMode] = useState(0);

  const filteredParticipants = useMemo(() => {
    let list = [...participants];
    if (filterMode === 1) list = list.filter(p => p.category === CATEGORIES.TRYHARD);
    if (filterMode === 2) list = list.filter(p => p.category === CATEGORIES.FOUR_DRINK);
    if (filterMode === 3) list = list.filter(p => p.category === CATEGORIES.CASUAL);
    
    return list.sort((a, b) => {
      if (b.currentStop !== a.currentStop) return b.currentStop - a.currentStop;
      return (a.totalTime || 0) - (b.totalTime || 0);
    });
  }, [participants, filterMode]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in w-full">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest italic leading-none mb-1">Live Standings</h2>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">The Hall</h1>
        </div>
        <div className="flex bg-slate-900 rounded-2xl p-1.5 border border-slate-800/80 shadow-lg shrink-0">
           <button onClick={() => setTab('overall')} className={`p-2.5 rounded-xl transition-all ${tab === 'overall' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Trophy size={20} /></button>
           <button onClick={() => setTab('analytics')} className={`p-2.5 rounded-xl transition-all ${tab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><BarChart3 size={20} /></button>
        </div>
      </header>

      {tab === 'overall' ? (
        <div className="space-y-4">
          <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
            {[ "All", "8-Drink", "4-Drink", "Casual" ].map((label, idx) => (
              <button 
                key={label}
                onClick={() => setFilterMode(idx)}
                className={`flex-1 min-w-[70px] py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${filterMode === idx ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredParticipants.map((p, idx) => (
              <div key={p.uid} className={`relative overflow-hidden border rounded-2xl p-4 flex items-center justify-between transition-all w-full ${p.uid === currentUserId ? 'bg-amber-500/10 border-amber-500 shadow-lg' : 'bg-slate-900 border-slate-800/80'}`}>
                <div className="flex items-center gap-4 relative z-10 min-w-0">
                  <span className={`text-xl font-black italic w-6 shrink-0 ${idx < 3 ? 'text-amber-500' : 'text-slate-700'}`}>#{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-white uppercase italic text-sm truncate pr-1">
                        {p.username}
                        {p.hardcoreCompleted && <span className="ml-1 not-italic">🌿</span>}
                        {p.failedHardcore && <span className="ml-1 not-italic">😞</span>}
                      </h4>
                      {p.category === CATEGORIES.TRYHARD ? <Zap size={11} className="text-amber-500 fill-amber-500 shrink-0" /> : 
                       p.category === CATEGORIES.FOUR_DRINK ? <Beer size={11} className="text-amber-400 fill-amber-400 shrink-0" /> : <Coffee size={11} className="text-slate-600 shrink-0" />}
                    </div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Stop {p.currentStop + 1} / {STOPS.length}</p>
                  </div>
                </div>
                <div className="text-right relative z-10 shrink-0 ml-4">
                   <div className="font-mono font-black text-amber-500 tabular-nums">{formatTime(p.totalTime)}</div>
                   <span className="text-[8px] font-black text-slate-500 uppercase block">
                    {p.category === CATEGORIES.TRYHARD ? 'Tryhard (8)' : p.category === CATEGORIES.FOUR_DRINK ? '4-Drink' : 'Casual'}
                   </span>
                </div>
              </div>
            ))}
            {filteredParticipants.length === 0 && (
              <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Empty Rankings</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800/60 space-y-6 shadow-2xl w-full">
           <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-[0.2em]"><BarChart3 size={14} /> My Leg Statistics</h3>
           <div className="space-y-2">
             {STOPS.slice(0, -1).map((stop, i) => {
               const leg = i + 1;
               const myTime = userData.splits?.[leg] || 0;
               return (
                 <div key={leg} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800/40 w-full">
                   <div className="min-w-0 flex-1">
                     <span className="text-[8px] font-black text-slate-600 uppercase block leading-none mb-1">Leg {leg}</span>
                     <span className="text-[10px] font-black text-white uppercase truncate block italic">{STOPS[i].name} → {STOPS[i+1].name}</span>
                   </div>
                   <span className="font-mono text-amber-500 text-sm font-black tabular-nums ml-4 shrink-0">{formatTime(myTime)}</span>
                 </div>
               )
             })}
           </div>
        </div>
      )}
    </div>
  );
}