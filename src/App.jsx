import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Dumbbell, UserCircle, Send, 
  Loader2, Sparkles, Check, Play, Pause, Timer, AlertCircle, 
  Smile, Frown, Lock, Flame, ArrowRight, LogOut, Settings, 
  RefreshCw, ArrowLeftRight, X, Save, Plus, Ruler, AlertTriangle, 
  CalendarDays, Eye, EyeOff, Trash, Cpu, CheckCircle, Pencil, MessageSquareQuote,
  Activity, Key, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info, GripHorizontal, Trophy, Medal, Database, Search, Menu, Target, FlameKindling, Zap, Youtube, Square
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyD25FBlMS6nnIyZRo3jhl85dIdnc8Cx63A",
  authDomain: "anatomiafit-96b5b.firebaseapp.com",
  projectId: "anatomiafit-96b5b",
  storageBucket: "anatomiafit-96b5b.firebasestorage.app",
  messagingSenderId: "786814321049",
  appId: "1:786814321049:web:3068c8bc6927d3b8b19308"
};

let app, auth, db, storage, appId = 'hypertrophy-app';
try {
  const configToUse = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : firebaseConfig;
  app = initializeApp(configToUse);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : 'hypertrophy-app';
} catch (e) {
  console.error("Erro ao configurar Firebase:", e);
}

// --- COMPONENTES AUXILIARES ---
const ToastContainer = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(t => (
      <div key={t.id} className={`p-4 rounded-xl shadow-lg text-white text-sm font-bold animate-fadeIn ${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
        {t.message}
      </div>
    ))}
  </div>
);

const SidebarBtn = ({ a, o, i, l }) => (
  <button onClick={o} className={`flex items-center gap-3 p-3 rounded-2xl transition-all font-bold text-sm ${a ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-white'}`}>
    {i}
    {l}
  </button>
);

// Componente de Cronómetro Embutido (Para Pranchas / Isometrias)
const InlineStopwatch = ({ onSaveTime }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let int;
    if (isRunning) int = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(int);
  }, [isRunning]);

  const formatSecs = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800 mt-3">
      <Timer size={16} className={isRunning ? 'text-emerald-500 animate-pulse' : 'text-zinc-500'} />
      <span className="font-mono font-bold w-12 text-center text-sm">{formatSecs(time)}</span>
      <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors">
        {isRunning ? <Pause size={14}/> : <Play size={14}/>}
      </button>
      <button onClick={() => { setIsRunning(false); setTime(0); }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
        <Square size={14}/>
      </button>
      <div className="flex-1"></div>
      <button onClick={() => onSaveTime(`${time}s`)} disabled={time === 0} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-500 disabled:opacity-30 text-xs font-bold rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
        Gravar {time}s
      </button>
    </div>
  );
};

// --- DB EXERCÍCIOS (CALISTENIA EXPANDIDA + LINKS YOUTUBE) ---
const baseExercises = [
  // BÁSICOS / INICIANTES
  { id: 'c_polichinelo', name: 'Polichinelo', target: 'Cardio/Full Body', group: 'Cardio', level: 'Iniciante' },
  { id: 'c_prancha', name: 'Prancha', target: 'Core', group: 'Core', level: 'Iniciante' },
  { id: 'c_flexao_joelhos', name: 'Flexão de Joelhos', target: 'Peitoral', group: 'Peito', level: 'Iniciante' },
  { id: 'c_barra_australiana', name: 'Barra Australiana', target: 'Dorsal', group: 'Costas', level: 'Iniciante' },
  { id: 'c_agachamento', name: 'Agachamento (Livres)', target: 'Pernas', group: 'Pernas', level: 'Iniciante' },
  { id: 'c_afundo', name: 'Afundo', target: 'Pernas/Glúteos', group: 'Pernas', level: 'Iniciante' },
  { id: 'c_pantu_unilateral', name: 'Panturrilha Unilateral', target: 'Panturrilha', group: 'Pernas', level: 'Iniciante' },
  { id: 'c_prancha_lateral', name: 'Prancha Lateral', target: 'Oblíquos', group: 'Core', level: 'Iniciante' },
  { id: 'c_crunches', name: 'Crunches (Abdominal Curto)', target: 'Abdômen', group: 'Core', level: 'Iniciante' },
  
  // INTERMÉDIOS
  { id: 'c_barra', name: 'Barra Fixa (Pronada)', target: 'Dorsal', group: 'Costas', level: 'Intermédio' },
  { id: 'c_barra_supinada', name: 'Barra Fixa (Supinada)', target: 'Costas/Bíceps', group: 'Costas', level: 'Intermédio' },
  { id: 'c_flexao_padrao', name: 'Flexão Padrão', target: 'Peitoral', group: 'Peito', level: 'Intermédio' },
  { id: 'c_flexao_diamante', name: 'Flexão Diamante', target: 'Tríceps/Peitoral Interno', group: 'Braços', level: 'Intermédio' },
  { id: 'c_dips', name: 'Dips (Paralelas Livres)', target: 'Tríceps/Peito', group: 'Braços', level: 'Intermédio' },
  { id: 'c_flexao_pike', name: 'Flexão Pike', target: 'Ombros', group: 'Ombros', level: 'Intermédio' },
  { id: 'c_agachamento_salto', name: 'Agachamento c/ Salto', target: 'Quadríceps/Potência', group: 'Pernas', level: 'Intermédio' },
  { id: 'c_canivete', name: 'Abdominal Canivete', target: 'Core Completo', group: 'Core', level: 'Intermédio' },
  { id: 'c_leg_raises', name: 'Leg Raises', target: 'Abdômen Inferior', group: 'Core', level: 'Intermédio' },
  { id: 'c_burpee', name: 'Burpee Completo', target: 'Cardio/Full Body', group: 'Cardio', level: 'Intermédio' },
  
  // AVANÇADOS / SKILLS
  { id: 'c_muscleup', name: 'Muscle-Up', target: 'Upper Body Explosivo', group: 'Costas', level: 'Avançado' },
  { id: 'c_frontlever', name: 'Front Lever', target: 'Core/Dorsal Isométrico', group: 'Core', level: 'Avançado' },
  { id: 'c_backlever', name: 'Back Lever', target: 'Peitoral/Ombros/Core', group: 'Core', level: 'Avançado' },
  { id: 'c_planche_lean', name: 'Planche Lean', target: 'Ombros/Core', group: 'Ombros', level: 'Avançado' },
  { id: 'c_hspu', name: 'Handstand Pushup (HSPU)', target: 'Ombros/Tríceps', group: 'Ombros', level: 'Avançado' },
  { id: 'c_pistol', name: 'Pistol Squat', target: 'Pernas Unilateral', group: 'Pernas', level: 'Avançado' },
  { id: 'c_dragon_flag', name: 'Dragon Flag', target: 'Core Absoluto', group: 'Core', level: 'Avançado' },
  { id: 'c_human_flag', name: 'Human Flag', target: 'Oblíquos/Costas/Ombros', group: 'Core', level: 'Avançado' },
  { id: 'c_archer_pushup', name: 'Archer Pushups', target: 'Peitoral Unilateral', group: 'Peito', level: 'Avançado' },
  { id: 'c_typewriter_pullup', name: 'Typewriter Pullups', target: 'Dorsal Avançado', group: 'Costas', level: 'Avançado' },
  { id: 'c_lsit', name: 'L-Sit (Solo ou Paralelas)', target: 'Core/Tríceps', group: 'Core', level: 'Avançado' }
];

// Injeta links de vídeo de pesquisa dinamicamente
const EXERCISE_DB = baseExercises.map(ex => ({
  ...ex,
  videoUrl: `https://www.youtube.com/results?search_query=calistenia+tutorial+${encodeURIComponent(ex.name.toLowerCase())}`
}));

const DEFAULT_WORKOUT_DAYS = ['Dia 1 (Upper)', 'Dia 2 (Lower)', 'Dia 3 (Core & Cardio)', 'Dia 4 (Full Body)', 'Dia 5 (Upper)', 'Dia 6 (Lower)', 'Descanso'];

const getStartOfWeekForDate = (dateObj) => {
  const dayOfWeek = dateObj.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [appScreen, setAppScreen] = useState('loading'); 

  // --- ESTRUTURA DATABASE NA NUVEM ---
  const [cloudExercises, setCloudExercises] = useState([]);
  const [isCloudDBLoaded, setIsCloudDBLoaded] = useState(false);
  const [needsToGeneratePlan, setNeedsToGeneratePlan] = useState(false);
  const activeDB = cloudExercises.length > 0 ? cloudExercises : EXERCISE_DB; 
  const getEx = (id) => activeDB.find(e => e.id === id) || EXERCISE_DB.find(e => e.id === id);

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const selectedDateStr = selectedDateObj.toLocaleDateString('pt-BR');

  const handleDateChange = (offset) => {
    const newDate = new Date(selectedDateObj);
    newDate.setDate(newDate.getDate() + offset);
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (newDate <= today) {
       setSelectedDateObj(newDate);
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showWorkoutSuccess, setShowWorkoutSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  
  const [workouts, setWorkouts] = useState({});
  const [workoutOrder, setWorkoutOrder] = useState(DEFAULT_WORKOUT_DAYS);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]); 
  const [activeWorkoutDay, setActiveWorkoutDay] = useState('Dia 1 (Upper)');
  
  const [isCardioMode, setIsCardioMode] = useState(false);
  const [cardioDuration, setCardioDuration] = useState(30);
  const [isRestMode, setIsRestMode] = useState(false);

  // Adicionado o campo "level" ao perfil
  const [userProfile, setUserProfile] = useState({ 
    name: '', age: '', gender: 'M', weight: '', targetWeight: '', goal: 'Hipertrofia', level: 'Iniciante',
    onboardingCompleted: false, lastLoginDate: todayStr
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const ACHIEVEMENTS = [
    { id: 'a1', title: 'Primeiro Passo', desc: '1º Treino concluído', icon: <Flame className="text-orange-500" size={24}/>, condition: (h) => h.length >= 1 },
    { id: 'a2', title: 'Consistência Diária', desc: '10 Treinos concluídos', icon: <Medal className="text-yellow-400" size={24}/>, condition: (h) => h.length >= 10 },
    { id: 'a3', title: 'Domínio do Corpo', desc: '10.000 reps acumuladas', icon: <Trophy className="text-emerald-500" size={24}/>, condition: (h) => h.reduce((a,b)=>a+(b.volume||0),0) >= 10000 },
    { id: 'a4', title: 'Calisténico Dedicado', desc: '5 Treinos Completos', icon: <Activity className="text-blue-500" size={24}/>, condition: (h) => h.length >= 5 }
  ];

  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(a => a.condition(workoutHistory));
  }, [workoutHistory]);

  const targetDayLog = dailyLogs.find(l => l.date === selectedDateStr) || { water: 0, workout: null };
  const waterTarget = Number(userProfile.weight) * 35 || 2500; 

  const completedWorkoutsThisWeek = useMemo(() => {
    const startOfWeek = getStartOfWeekForDate(selectedDateObj);
    const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000);
    return workoutHistory
      .filter(log => {
        const logTime = log.timestamp || (log.date ? new Date(log.date.split('/').reverse().join('-')).getTime() : 0);
        return logTime >= startOfWeek && logTime < endOfWeek;
      })
      .map(log => log.day);
  }, [workoutHistory, selectedDateObj]);

  useEffect(() => {
    if (completedWorkoutsThisWeek.includes(activeWorkoutDay) && completedWorkoutsThisWeek.length < workoutOrder.length) {
      const nextAvailable = workoutOrder.find(d => !completedWorkoutsThisWeek.includes(d));
      if (nextAvailable) setActiveWorkoutDay(nextAvailable);
    }
  }, [completedWorkoutsThisWeek, activeWorkoutDay, workoutOrder]);

  const generateAIPlan = () => {
    const formatEx = (ex, sets, reps) => ex ? ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets, reps, weight: '', isCompleted: false, videoUrl: ex.videoUrl }) : null;

    const p = {};
    
    // Gerar um plano fallback dependendo do nível se a IA não for usada
    const getLevelExercises = (group, limit) => {
        return EXERCISE_DB.filter(e => e.group === group && e.level === userProfile.level).slice(0, limit);
    };

    DEFAULT_WORKOUT_DAYS.forEach(day => {
       let planExercises = [];
       if (day.includes('Upper')) {
           planExercises = [...getLevelExercises('Peito', 2), ...getLevelExercises('Costas', 2), ...getLevelExercises('Ombros', 1), ...getLevelExercises('Braços', 1)];
       } else if (day.includes('Lower')) {
           planExercises = [...getLevelExercises('Pernas', 4), ...getLevelExercises('Core', 2)];
       } else if (day.includes('Core')) {
           planExercises = [...getLevelExercises('Core', 4), ...getLevelExercises('Cardio', 2)];
       } else if (day.includes('Full Body')) {
           planExercises = [...getLevelExercises('Peito', 1), ...getLevelExercises('Costas', 1), ...getLevelExercises('Pernas', 2), ...getLevelExercises('Core', 1), ...getLevelExercises('Cardio', 1)];
       }

       if (planExercises.length === 0) {
           planExercises = EXERCISE_DB.slice(0, 5); // Fallback absoluto
       }

       p[day] = {
           name: day,
           exercises: planExercises.map(pe => formatEx(getEx(pe.id), 3, pe.target.includes('Isométrico') || pe.name.includes('Prancha') ? '45s' : '10')).filter(e => e)
       };
    });

    setWorkouts(p);
    setWorkoutOrder(DEFAULT_WORKOUT_DAYS);
    saveToCloud({ workouts: p, workoutOrder: DEFAULT_WORKOUT_DAYS });
  };

  useEffect(() => {
    if (!auth) { setFirebaseError("Firebase falhou."); setIsAuthLoading(false); return; }
    
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      if (!u) setAppScreen('login');
      setIsAuthLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const exRef = collection(db, 'artifacts', appId, 'public', 'data', 'exercises_cali');
    const unsubEx = onSnapshot(exRef, (snap) => {
      const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setCloudExercises(data.length > 0 ? data : EXERCISE_DB);
      setIsCloudDBLoaded(true);
    }, (err) => {
      console.error("Erro ao escutar exercícios:", err);
      setCloudExercises(EXERCISE_DB); // Fallback local
      setIsCloudDBLoaded(true); 
    });
    return () => unsubEx();
  }, [user]);

  useEffect(() => {
    if (!user || !db || firebaseError) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'calistenia_v1'); 
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.workouts) setWorkouts(d.workouts);
        if (d.workoutOrder) setWorkoutOrder(d.workoutOrder);
        if (d.workoutHistory) setWorkoutHistory(d.workoutHistory);
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        
        if (d.userProfile) {
          let prof = { level: 'Iniciante', ...d.userProfile };
          if (prof.lastLoginDate !== todayStr && prof.onboardingCompleted) {
             let updWorkouts = { ...(d.workouts || workouts) };
             let modified = false;
             Object.keys(updWorkouts).forEach(day => {
               if (updWorkouts[day].exercises) {
                 updWorkouts[day].exercises.forEach(ex => {
                   if (ex.isCompleted) { ex.isCompleted = false; modified = true; }
                 });
               }
             });
             prof.lastLoginDate = todayStr;
             setUserProfile(prof);
             
             const updateData = { userProfile: prof };
             if (modified) {
               setWorkouts(updWorkouts);
               updateData.workouts = updWorkouts;
             }
             setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'calistenia_v1'), updateData, { merge: true });
          } else {
             setUserProfile(prof);
          }

          if (prof.onboardingCompleted) {
            setAppScreen('main');
          } else {
            setAppScreen('onboarding');
          }
        }
      } else {
        setNeedsToGeneratePlan(true);
      }
    }, (err) => setFirebaseError(err.message));
    return () => unsub();
  }, [user, firebaseError, todayStr]);

  useEffect(() => {
    if (needsToGeneratePlan && isCloudDBLoaded) {
       generateAIPlan();
       setAppScreen('onboarding');
       setNeedsToGeneratePlan(false);
    }
  }, [needsToGeneratePlan, isCloudDBLoaded, cloudExercises]);

  const saveToCloud = async (overrideData = null) => {
    if (!user || !db) return;
    setIsSyncing(true);
    try {
      const dataToSave = overrideData || { workouts, workoutOrder, workoutHistory, userProfile, dailyLogs };
      const cleanData = JSON.parse(JSON.stringify(dataToSave)); 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'calistenia_v1'), cleanData, { merge: true });
    } catch (e) { 
      console.error(e); 
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleAuthAction = async () => {
    setAuthErrorMsg(''); 
    setIsProcessingAuth(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setAppScreen('loading'); 
    } catch (error) {
       setAuthErrorMsg(`Erro: ${error.message}`);
    } finally { 
      setIsProcessingAuth(false); 
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAppScreen('login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleToggleMode = (mode) => {
    if (mode === 'cardio') { setIsCardioMode(!isCardioMode); setIsRestMode(false); }
    if (mode === 'rest') { setIsRestMode(!isRestMode); setIsCardioMode(false); }
  };

  const handleCompleteWorkout = () => {
    const cur = workouts[activeWorkoutDay];
    let vol = 0; let durationCardio = 0;
    let completedExercises = [];
    
    if (isCardioMode) {
      durationCardio = Number(cardioDuration) || 30;
    } else if (!isRestMode && cur && cur.exercises) {
      cur.exercises.forEach(ex => {
        // Na calistenia, usamos repetições puras ou tempo para calcular o "volume" gamificado
        const repsCalc = typeof ex.reps === 'string' && ex.reps.includes('s') ? parseInt(ex.reps)/2 : (Number(ex.reps)||10);
        vol += repsCalc * (Number(ex.sets)||1);
        completedExercises.push({ originalId: ex.originalId, name: ex.name, sets: ex.sets, reps: ex.reps });
        ex.isCompleted = false; 
      });
    }

    const timestamp = selectedDateObj.getTime();
    const newLog = { 
      id: Date.now(), date: selectedDateStr, timestamp, day: activeWorkoutDay, volume: vol, 
      isGap: false, gapDuration: 0, 
      isCardio: isCardioMode, cardioDuration: durationCardio,
      isRest: isRestMode,
      exercises: completedExercises 
    };
    const newHist = [...workoutHistory, newLog];
    
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === selectedDateStr);
    if (idx >= 0) newDLogs[idx].workout = activeWorkoutDay;
    else newDLogs.push({ date: selectedDateStr, workout: activeWorkoutDay, water: 0 });

    setWorkoutHistory(newHist); setDailyLogs(newDLogs);
    saveToCloud({ workouts: workouts, workoutOrder, workoutHistory: newHist, dailyLogs: newDLogs });
    
    setShowWorkoutSuccess(true);
    setIsCardioMode(false);
    setIsRestMode(false);
  };

  const addWater = () => {
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === selectedDateStr);
    if (idx >= 0) newDLogs[idx].water = (newDLogs[idx].water || 0) + 250;
    else newDLogs.push({ date: selectedDateStr, water: 250, workout: null });
    setDailyLogs(newDLogs); saveToCloud({ dailyLogs: newDLogs });
  };

  const callGemini = async (prompt, schema = null, retries = 3) => {
    const apiKey = (userProfile.geminiApiKey || "").trim(); 
    if (!apiKey) {
       showToast("Configure a sua Chave API do Gemini no separador Perfil para usar a IA.", "error");
       throw new Error("Chave API ausente.");
    }

    const model = apiKey ? "gemini-2.5-flash" : "gemini-2.5-flash-preview-09-2025";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(schema && {
        generationConfig: { responseMimeType: "application/json", responseSchema: schema }
      })
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Erro API");
        let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (schema) return JSON.parse(textOutput.replace(/```json/gi, '').replace(/```/g, '').trim());
        return textOutput;
      } catch (err) {
        if (attempt === retries - 1) throw new Error(err.message);
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); 
      }
    }
  };

  const handleGenerateAIWorkout = async () => {
    if (activeDB.length === 0) {
       showToast("Base de dados vazia.", "error");
       return;
    }
    setIsGeneratingWorkout(true);
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const dbContext = activeDB.map(e => `ID:'${e.id}' | Nome:'${e.name}' | Nível:'${e.level}' | Grupo:'${e.group}'`).join('\n');

      const prompt = `Atue como um treinador especialista em calistenia progressiva. 
      O meu nível de experiência atual é: **${userProfile.level}**.
      O objetivo geral é: ${userProfile.goal}.
      O treino selecionado para hoje é: "${dayInfo.name}".
      
      Aqui está a lista de exercícios disponíveis:
      ${dbContext}

      REGRAS:
      1. Escolha EXATAMENTE 6 exercícios baseados no foco do dia (${dayInfo.name}).
      2. Respeite OBRIGATORIAMENTE o meu nível (${userProfile.level}). 
         - Se sou Iniciante, não me dê Front Levers ou Muscle-ups. Escolha exercícios marcados como 'Iniciante'.
         - Se sou Avançado, desafie-me com exercícios marcados como 'Avançado' ou 'Intermédio'.
      3. Retorne APENAS um JSON no formato {"exercises": ["id1", "id2", ...]} contendo os 6 IDs apropriados.`;

      const schema = { type: "OBJECT", properties: { exercises: { type: "ARRAY", items: { type: "STRING" } } } };
      const resultData = await callGemini(prompt, schema);
      const resultIds = resultData.exercises || [];

      if (Array.isArray(resultIds) && resultIds.length > 0) {
         const formatExLoc = (ex) => ex ? ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets: 3, reps: (ex.target.includes('Isométrico') || ex.name.includes('Prancha') || ex.name.includes('L-Sit') ? '45s' : '10'), weight: '', isCompleted: false, videoUrl: ex.videoUrl }) : null;
         const newExercises = resultIds.map(id => formatExLoc(getEx(id))).filter(e => e !== null);

         if (newExercises.length > 0) {
           const upd = {...workouts};
           upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises: newExercises };
           setWorkouts(upd);
           saveToCloud({ workouts: upd });
           showToast("Treino atualizado com sucesso pela IA!", "success");
         }
      }
    } catch (error) {
      showToast(`Erro da IA: ${error.message}`, "error");
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  const getCalendarDays = () => {
    const days = []; 
    const targetDate = new Date(selectedDateObj);
    targetDate.setHours(0,0,0,0);
    let startDate = new Date(targetDate);
    startDate.setDate(targetDate.getDate() - 6);

    for(let i=0; i<7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dStr = d.toLocaleDateString('pt-BR');
      const log = dailyLogs.find(l => l.date === dStr);
      days.push({ 
        dateNum: d.getDate(), 
        dayStr: d.toLocaleDateString('pt-BR', {weekday:'short'}), 
        hasWorkout: !!log?.workout,
        isFuture: d > new Date()
      });
    }
    return days;
  };

  const monthlyChallenges = useMemo(() => {
    const targetDate = new Date(selectedDateObj);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const monthlyHistory = workoutHistory.filter(log => {
        const logDate = log.timestamp ? new Date(log.timestamp) : new Date(log.date.split('/').reverse().join('-'));
        return logDate.getMonth() === targetMonth && logDate.getFullYear() === targetYear;
    });

    let squats = 0, pushups = 0, pullups = 0, dips = 0, plankSecs = 0;

    monthlyHistory.forEach(log => {
      if (log.exercises) {
        log.exercises.forEach(ex => {
          const nameLower = ex.name.toLowerCase();
          const totalReps = (Number(ex.sets) || 0) * (Number(ex.reps) || 0);

          if (nameLower.includes('agachamento') || nameLower.includes('pistol')) squats += totalReps;
          if (nameLower.includes('flexão') && !nameLower.includes('joelho')) {
             if (isNaN(Number(ex.reps))) { pushups += (Number(ex.sets) || 0) * 15; } else pushups += totalReps;
          }
          if (nameLower.includes('barra') || nameLower.includes('pullup') || nameLower.includes('muscle')) {
             if (isNaN(Number(ex.reps))) { pullups += (Number(ex.sets) || 0) * 5; } else pullups += totalReps;
          }
          if (nameLower.includes('paralelas') || nameLower.includes('dips')) {
             if (isNaN(Number(ex.reps))) { dips += (Number(ex.sets) || 0) * 10; } else dips += totalReps;
          }
          if (nameLower.includes('prancha') || nameLower.includes('l-sit') || nameLower.includes('lever') || nameLower.includes('flag')) {
             let secsPerSet = typeof ex.reps === 'string' && ex.reps.includes('s') ? parseInt(ex.reps) : 30;
             plankSecs += (Number(ex.sets) || 0) * secsPerSet;
          }
        });
      }
    });

    return [
      { id: 'ch_squats', title: 'Pernas de Aço', desc: '1000 Agachamentos', icon: <Zap className="text-orange-500" size={24}/>, progress: squats, target: 1000, unit: 'reps', color: 'bg-orange-500' },
      { id: 'ch_pushups', title: 'Peitoral de Ferro', desc: '500 Flexões', icon: <Activity className="text-blue-500" size={24}/>, progress: pushups, target: 500, unit: 'reps', color: 'bg-blue-500' },
      { id: 'ch_pullups', title: 'Mestre da Gravidade', desc: '150 Barras/Pull-ups', icon: <FlameKindling className="text-emerald-500" size={24}/>, progress: pullups, target: 150, unit: 'reps', color: 'bg-emerald-500' },
      { id: 'ch_dips', title: 'Tríceps Blindado', desc: '200 Dips/Paralelas', icon: <Target className="text-purple-500" size={24}/>, progress: dips, target: 200, unit: 'reps', color: 'bg-purple-500' },
      { id: 'ch_plank', title: 'Core de Titânio', desc: '60 Min Isometria', icon: <Medal className="text-yellow-500" size={24}/>, progress: Math.round(plankSecs / 60), target: 60, unit: 'min', color: 'bg-yellow-500' }
    ];
  }, [workoutHistory, selectedDateObj]);

  if (isAuthLoading || appScreen === 'loading') {
    return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;
  }
  
  if (!user || appScreen === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white relative">
        <div className="max-w-md w-full bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 text-center shadow-2xl">
          <Dumbbell size={48} className="text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold mb-2">{isLoginMode ? 'CalisteniaFit' : 'Criar Conta'}</h1>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4" placeholder="E-mail" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4" placeholder="Senha" />
          <button onClick={handleAuthAction} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl">{isLoginMode ? 'Entrar' : 'Registar'}</button>
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-6 text-sm text-emerald-400 font-bold block w-full">{isLoginMode ? 'Registar' : 'Entrar'}</button>
        </div>
      </div>
    );
  }

  if (!isCloudDBLoaded) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  if (appScreen === 'onboarding') {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white relative">
          <div className="max-w-md w-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center shadow-2xl">
             <Activity size={48} className="text-emerald-500 mx-auto mb-6" />
             <h1 className="text-2xl font-extrabold mb-4">Configuração Inicial</h1>
             <p className="text-zinc-400 text-sm mb-6">Qual é o seu nível atual em calistenia?</p>
             
             <div className="space-y-3 mb-8">
               {['Iniciante', 'Intermédio', 'Avançado'].map(lvl => (
                 <button 
                   key={lvl}
                   onClick={() => setUserProfile({...userProfile, level: lvl})}
                   className={`w-full p-4 rounded-xl font-bold border transition-all ${userProfile.level === lvl ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                 >
                   {lvl}
                 </button>
               ))}
             </div>

             <button onClick={() => {
                 const newProf = {...userProfile, onboardingCompleted:true};
                 setUserProfile(newProf);
                 saveToCloud({ userProfile: newProf });
                 generateAIPlan(); // Gera o primeiro plano de acordo com o nível
                 setAppScreen('main');
             }} className="w-full bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-bold text-white transition-colors">Iniciar Jornada</button>
          </div>
       </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      <ToastContainer toasts={toasts} />
      
      <aside className="hidden md:flex flex-col w-72 bg-zinc-900/40 border-r border-zinc-800/80 p-6 z-40">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <Dumbbell className="text-emerald-500" size={28} />
          <span className="font-extrabold text-2xl tracking-tight text-white">CalisteniaFit</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <SidebarBtn a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={20}/>} l="Painel" />
          <SidebarBtn a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={20}/>} l="Treino" />
          <SidebarBtn a={activeTab==='desafios'} o={()=>setActiveTab('desafios')} i={<Target size={20}/>} l="Desafios" />
          <SidebarBtn a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={20}/>} l="Perfil" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto w-full relative pb-28 md:pb-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto p-5 md:p-8 w-full mt-2">

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <header className="flex justify-between items-end mb-8">
                <div>
                   <h1 className="text-3xl font-extrabold text-white">Painel</h1>
                   <p className="text-emerald-400 font-bold text-sm mt-1">Nível: {userProfile.level}</p>
                </div>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                   <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Consistência (7 Dias)</h3>
                   <div className="flex gap-2 overflow-x-auto justify-between">
                     {getCalendarDays().map((d, i) => (
                       <div key={i} className={`flex flex-col items-center p-3 rounded-2xl min-w-14 border ${d.hasWorkout ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                         <span className="text-[10px] text-zinc-500 font-bold uppercase">{d.dayStr}</span>
                         <span className="text-lg font-bold text-white mb-2">{d.dateNum}</span>
                         {d.hasWorkout ? <Smile size={20} className="text-emerald-500"/> : <Frown size={20} className="text-zinc-600"/>}
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-blue-950/20 border border-blue-900/30 p-6 rounded-3xl relative overflow-hidden flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-blue-400 uppercase mb-1">Hidratação</h3>
                    <p className="text-4xl font-black text-white mt-4">{targetDayLog.water} <span className="text-lg text-blue-200">/ {waterTarget}ml</span></p>
                    <button onClick={addWater} className="mt-6 bg-blue-600 px-5 py-3 rounded-xl font-bold flex gap-2"><Plus size={16}/> Copo</button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'treino' && (
             <div className="space-y-6 animate-fadeIn">
               <header className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-extrabold">Circuitos</h1>
                 <button onClick={generateAIPlan} className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Restaurar Rotina"><RefreshCw size={18}/></button>
               </header>
               
               <div className="flex gap-2 overflow-x-auto pb-4 px-1">
                 {workoutOrder.map((d) => (
                   <button 
                     key={d} 
                     onClick={()=>setActiveWorkoutDay(d)}
                     className={`px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeWorkoutDay === d ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}
                   >
                     {d}
                   </button>
                 ))}
               </div>

               <div className="space-y-3 mb-6">
                 <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3"><Activity className="text-blue-400"/><span className="font-bold">Apenas Cardio?</span></div>
                   <button onClick={() => handleToggleMode('cardio')} className={`w-12 h-6 rounded-full relative ${isCardioMode?'bg-blue-500':'bg-zinc-800'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isCardioMode?'left-7':'left-1'}`}></div>
                   </button>
                 </div>
                 <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3"><Smile className="text-zinc-400"/><span className="font-bold">Dia de Descanso?</span></div>
                   <button onClick={() => handleToggleMode('rest')} className={`w-12 h-6 rounded-full relative ${isRestMode?'bg-zinc-500':'bg-zinc-800'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isRestMode?'left-7':'left-1'}`}></div>
                   </button>
                 </div>
               </div>

               {!isCardioMode && !isRestMode && (
                 <>
                   <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-lg text-white">{workouts[activeWorkoutDay]?.name}</h2>
                      <button onClick={handleGenerateAIWorkout} disabled={isGeneratingWorkout} className="bg-emerald-600/20 text-emerald-400 px-3 py-2 rounded-xl font-bold text-sm flex gap-2 disabled:opacity-50 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors">
                        {isGeneratingWorkout ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16}/>} 
                        {isGeneratingWorkout ? 'Gerando...' : 'Gerar Novo (IA)'}
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                     {workouts[activeWorkoutDay]?.exercises?.map((ex) => (
                        <div key={ex.id} className={`bg-zinc-900 p-5 rounded-3xl border transition-all ${ex.isCompleted ? 'border-emerald-500/50 bg-emerald-950/20 opacity-80' : 'border-zinc-800'}`}>
                           
                           <div className="flex justify-between items-start">
                             <div>
                                <span className="font-extrabold text-lg block leading-tight mb-1">{ex.name}</span>
                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{ex.group}</span>
                             </div>
                             
                             <button onClick={()=>{
                                 const upd = {...workouts};
                                 upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.map(x => x.id === ex.id ? { ...x, isCompleted: !x.isCompleted } : x);
                                 setWorkouts(upd);
                              }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${ex.isCompleted?'bg-emerald-500 text-zinc-950':'bg-zinc-950 text-zinc-600 border border-zinc-800 hover:text-white'}`}>
                                <Check size={24} strokeWidth={3}/>
                              </button>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mt-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                              <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Séries</label>
                                <input type="number" value={ex.sets} onChange={(e) => {
                                   const upd = {...workouts};
                                   upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.map(x => x.id === ex.id ? { ...x, sets: e.target.value } : x);
                                   setWorkouts(upd);
                                }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold text-white border border-zinc-800 focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Reps / Tempo</label>
                                <input type="text" value={ex.reps} onChange={(e) => {
                                   const upd = {...workouts};
                                   upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.map(x => x.id === ex.id ? { ...x, reps: e.target.value } : x);
                                   setWorkouts(upd);
                                }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold text-white border border-zinc-800 focus:border-emerald-500" />
                              </div>
                           </div>

                           {/* Timer Inline para Isometrias */}
                           {(ex.name.toLowerCase().includes('prancha') || ex.name.toLowerCase().includes('l-sit') || ex.name.toLowerCase().includes('lever') || ex.name.toLowerCase().includes('flag') || ex.name.toLowerCase().includes('isometria')) && (
                             <InlineStopwatch onSaveTime={(timeStr) => {
                               const upd = {...workouts};
                               upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.map(x => x.id === ex.id ? { ...x, reps: timeStr } : x);
                               setWorkouts(upd);
                             }} />
                           )}

                           {/* Link para YouTube */}
                           {ex.videoUrl && (
                             <div className="mt-4 flex justify-end">
                               <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20">
                                 <Youtube size={16} /> Ver Tutorial
                               </a>
                             </div>
                           )}

                        </div>
                     ))}
                   </div>
                 </>
               )}

               <button onClick={handleCompleteWorkout} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg mt-8 flex justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                 <Save size={24}/> {isCardioMode ? 'Salvar Cardio' : isRestMode ? 'Confirmar Descanso' : 'Concluir Treino'}
               </button>
             </div>
          )}

          {activeTab === 'desafios' && (
             <div className="space-y-6 animate-fadeIn pb-12">
               <header className="mb-6">
                 <h1 className="text-3xl font-extrabold flex items-center gap-3"><Target className="text-emerald-500" size={32}/> Desafios</h1>
                 <p className="text-zinc-400 text-sm mt-2">Mês: {selectedDateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {monthlyChallenges.map(ch => {
                     const percent = Math.min(100, Math.round((ch.progress / ch.target) * 100));
                     return (
                        <div key={ch.id} className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                           <div className="flex gap-4 items-center mb-4">
                             <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center shrink-0">{percent >= 100 ? <Trophy className="text-emerald-500" size={28}/> : ch.icon}</div>
                             <div>
                               <h3 className="font-black text-lg text-white leading-tight">{ch.title}</h3>
                               <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{ch.desc}</p>
                             </div>
                           </div>
                           <div className="flex justify-between text-sm font-black mb-2">
                              <span className={percent >= 100 ? 'text-emerald-400' : 'text-white'}>{ch.progress} <span className="text-xs font-bold text-zinc-500">{ch.unit}</span></span>
                              <span className="text-zinc-500">{ch.target} <span className="text-xs">{ch.unit}</span></span>
                           </div>
                           <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                              <div className={`h-full transition-all ${percent >= 100 ? 'bg-emerald-500' : ch.color}`} style={{ width: `${percent}%` }}></div>
                           </div>
                        </div>
                     );
                  })}
               </div>
             </div>
          )}
          
          {activeTab === 'perfil' && (
            <div className="space-y-6 animate-fadeIn pb-10">
               <h1 className="text-3xl font-extrabold text-white mb-6">Perfil do Atleta</h1>
               
               <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
                  <h3 className="font-bold text-lg text-emerald-400">Nível de Calistenia</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     {['Iniciante', 'Intermédio', 'Avançado'].map(lvl => (
                       <button 
                         key={lvl}
                         onClick={() => {
                           const newProf = {...userProfile, level: lvl};
                           setUserProfile(newProf);
                           saveToCloud({ userProfile: newProf });
                           showToast(`Nível alterado para ${lvl}`, 'success');
                         }}
                         className={`p-4 rounded-2xl font-bold border transition-all ${userProfile.level === lvl ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                       >
                         {lvl}
                       </button>
                     ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">A IA utilizará este nível para escalar a dificuldade dos exercícios quando pedir para gerar novas fichas.</p>
               </div>

               <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mt-6">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Settings size={18}/> Integração IA (Gemini)</h3>
                 <input type="password" value={userProfile.geminiApiKey || ''} onChange={e => {
                    const newProf = {...userProfile, geminiApiKey: e.target.value};
                    setUserProfile(newProf);
                    saveToCloud({ userProfile: newProf });
                 }} placeholder="Cole a sua chave de API aqui..." className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-emerald-400 focus:border-emerald-500 outline-none font-mono text-sm" />
               </div>

               <button onClick={handleLogout} className="w-full py-5 bg-zinc-900 text-zinc-400 hover:text-red-400 hover:border-red-500/50 rounded-3xl font-bold border border-zinc-800 flex items-center justify-center gap-2 transition-colors mt-8">
                 <LogOut size={20} /> Terminar Sessão
               </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Navegação Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-4 rounded-full z-50 shadow-2xl flex gap-4 text-white">
         <button onClick={() => setActiveTab('dashboard')} className={activeTab==='dashboard'?'text-emerald-500':''}><LayoutDashboard/></button>
         <button onClick={() => setActiveTab('treino')} className={activeTab==='treino'?'text-emerald-500':''}><Dumbbell/></button>
         <button onClick={() => setActiveTab('desafios')} className={activeTab==='desafios'?'text-emerald-500':''}><Target/></button>
         <button onClick={() => setActiveTab('perfil')} className={activeTab==='perfil'?'text-emerald-500':''}><UserCircle/></button>
      </div>

    </div>
  );
}