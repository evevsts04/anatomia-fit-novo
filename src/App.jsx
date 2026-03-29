import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Dumbbell, Utensils, UserCircle, Send, 
  Loader2, Sparkles, Check, Play, Pause, Timer, AlertCircle, 
  Smile, Frown, Lock, Flame, ArrowRight, LogOut, Settings, 
  RefreshCw, ArrowLeftRight, X, Save, Plus, Ruler, AlertTriangle, 
  CalendarDays, Eye, EyeOff, Trash, Cpu, CheckCircle, Pencil, MessageSquareQuote,
  Camera, Scan, Focus, BarChart, Fingerprint, View, Upload, Activity, Key,
  ChevronLeft, ChevronRight, Info, GripHorizontal, Trophy, Medal, Shield, Database
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
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

// --- DB EXERCÍCIOS BASE (FALLBACK PARA MIGRAÇÃO) ---
const FALLBACK_EXERCISE_DB = [
  { id: 'e1', name: 'Supino Reto (Barra)', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e2', name: 'Supino Reto (Halteres)', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e17', name: 'Barra Fixa (Pronada)', target: 'Grande Dorsal', group: 'Costas' },
  { id: 'e19', name: 'Puxada Anterior (Pronada)', target: 'Dorsal (Largura)', group: 'Costas' },
  { id: 'e22', name: 'Remada Curvada (Barra)', target: 'Dorsal e Romboides', group: 'Costas' },
  { id: 'e26', name: 'Remada Sentada (Triângulo)', target: 'Costas (Média/Miolo)', group: 'Costas' },
  { id: 'e32', name: 'Desenvolvimento (Barra)', target: 'Deltoide Anterior/Médio', group: 'Ombros' },
  { id: 'e36', name: 'Elevação Lateral (Halteres)', target: 'Deltoide Lateral', group: 'Ombros' },
  { id: 'e40', name: 'Crucifixo Invertido (Halteres)', target: 'Deltoide Posterior', group: 'Ombros' },
  { id: 'e47', name: 'Rosca Direta (Barra Reta)', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e49', name: 'Rosca Alternada (Halteres)', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e56', name: 'Flexão de Punho (Barra/Halter)', target: 'Antebraço', group: 'Braços' },
  { id: 'e57', name: 'Tríceps Pulley (Barra Reta)', target: 'Tríceps (Cabeça Lateral)', group: 'Braços' },
  { id: 'e59', name: 'Tríceps Testa (Barra W)', target: 'Tríceps Completo', group: 'Braços' },
  { id: 'e67', name: 'Agachamento Livre (Barra)', target: 'Quadríceps/Glúteos', group: 'Pernas' },
  { id: 'e69', name: 'Agachamento Hack', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e71', name: 'Leg Press 45°', target: 'Quadríceps/Posterior', group: 'Pernas' },
  { id: 'e72', name: 'Leg Press Horizontal', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e73', name: 'Cadeira Extensora', target: 'Quadríceps (Isolado)', group: 'Pernas' },
  { id: 'e74', name: 'Sissy Squat (Máquina)', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e77', name: 'Mesa Flexora', target: 'Isquiotibiais (Posterior)', group: 'Pernas' },
  { id: 'e78', name: 'Cadeira Flexora', target: 'Isquiotibiais', group: 'Pernas' },
  { id: 'e80', name: 'Stiff (Barra/Halteres)', target: 'Posterior/Glúteos', group: 'Pernas' },
  { id: 'e81', name: 'Levantamento Terra Romeno', target: 'Posterior da Coxa', group: 'Pernas' },
  { id: 'e83', name: 'Panturrilha em Pé (Máquina)', target: 'Gastrocnêmio', group: 'Pernas' },
  { id: 'e84', name: 'Panturrilha Sentado (Máquina)', target: 'Sóleo', group: 'Pernas' },
  { id: 'e85', name: 'Panturrilha no Leg Press', target: 'Gastrocnêmio', group: 'Pernas' },
  { id: 'e86', name: 'Panturrilha Livre', target: 'Gastrocnêmio', group: 'Pernas' },
  { id: 'e87', name: 'Elevação Pélvica (Barra)', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e94', name: 'Abdominal Supra (Solo)', target: 'Reto Abdominal', group: 'GAP' },
  { id: 'e98', name: 'Prancha Isométrica', target: 'Core/Estabilização', group: 'GAP' },
  { id: 'e99', name: 'Roda Abdominal (Rolinho)', target: 'Core Completo', group: 'GAP' },
  // Calistenia (Amostra p/ Fallback)
  { id: 'c_polichinelo', name: 'Polichinelo', target: 'Cardio/Full Body', group: 'Cardio' },
  { id: 'c_barra', name: 'Barra Fixa', target: 'Dorsal', group: 'Costas' },
  { id: 'c_prancha', name: 'Prancha', target: 'Core', group: 'GAP' },
  { id: 'c_flexao_joelhos', name: 'Flexão de Joelhos', target: 'Peitoral', group: 'Peito' },
  { id: 'c_agachamento_salto', name: 'Agachamento c/ Salto', target: 'Quadríceps', group: 'Pernas' },
  { id: 'c_pe_bunda', name: 'Pé na Bunda', target: 'Cardio', group: 'Cardio' },
  { id: 'c_barra_australiana', name: 'Barra Australiana', target: 'Dorsal', group: 'Costas' },
  { id: 'c_flexao_inclinada', name: 'Flexão Inclinada', target: 'Peitoral Inferior', group: 'Peito' },
  { id: 'c_burpee', name: 'Burpee Completo', target: 'Cardio/Full Body', group: 'Cardio' }
];

const INITIAL_MEALS = [
  { id: 'm1', name: 'Café da Manhã' },
  { id: 'm2', name: 'Lanche Manhã' },
  { id: 'm3', name: 'Almoço' },
  { id: 'm4', name: 'Lanche Tarde' },
  { id: 'm5', name: 'Pré-Treino' },
  { id: 'm6', name: 'Jantar' },
  { id: 'm7', name: 'Ceia' },
];
const DEFAULT_WORKOUT_DAYS = ['Pull', 'Legs 1', 'Push', 'Legs 2 ou Cardio', 'Upper', 'Lower', 'Cardio'];

const CALISTHENICS_PLANS = {
  'Treino 01': [ { id: 'c_polichinelo', reps: '30' }, { id: 'c_barra', reps: '6' }, { id: 'c_prancha', reps: '30s' }, { id: 'c_flexao_joelhos', reps: 'Máx' }, { id: 'c_agachamento_salto', reps: '15' }, { id: 'c_pe_bunda', reps: '30s' }, { id: 'c_barra_australiana', reps: '5' }, { id: 'c_flexao_inclinada', reps: 'Máx' } ]
};

// Funções utilitárias de Data
const getStartOfCurrentWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 é Domingo
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

const formatEx = (ex, sets, reps) => {
  if (!ex) return null;
  return { ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets, reps, weight: '', isCompleted: false };
};

const MEASUREMENTS_LABELS = {
  peito: 'Peito', 
  costas: 'Costas', 
  cintura: 'Cintura', 
  quadril: 'Quadril',
  bracoEsq: 'Braço Esq.', 
  bracoDir: 'Braço Dir.', 
  antebracoEsq: 'Antebraço Esq.', 
  antebracoDir: 'Antebraço Dir.', 
  pernaEsq: 'Perna Esq.', 
  pernaDir: 'Perna Dir.', 
  panturrilhaEsq: 'Panturrilha Esq.', 
  panturrilhaDir: 'Panturrilha Dir.'
};

// --- COMPONENTE: Avatar Paramétrico ---
function ParametricAvatar({ label, measures, isCurrent }) {
  const chestScale = measures?.peito ? Math.max(0.8, Math.min(1.3, measures.peito / 95)) : 1;
  const waistScale = measures?.cintura ? Math.max(0.8, Math.min(1.3, measures.cintura / 80)) : 1;
  const armScale = measures?.bracoEsq || measures?.bracos ? Math.max(0.8, Math.min(1.4, (measures.bracoEsq || measures.bracos) / 35)) : 1;
  const legScale = measures?.pernaEsq || measures?.pernas ? Math.max(0.8, Math.min(1.4, (measures.pernaEsq || measures.pernas) / 55)) : 1;

  return (
    <div className="relative z-10 flex flex-col items-center min-w-[120px]">
      <div className={`bg-zinc-950 p-4 rounded-2xl border mb-3 shadow-lg transition-all ${isCurrent ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-gradient-to-t from-emerald-950/20 to-zinc-950 scale-105' : 'border-zinc-800'}`}>
        <svg viewBox="0 0 200 400" className="w-20 h-40 drop-shadow-xl">
          <circle cx="100" cy="40" r="25" fill="#27272a" stroke={isCurrent ? "#10b981" : "#18181b"} strokeWidth={isCurrent ? "1" : "0"} />
          
          {/* Peitoral */}
          <g style={{ transform: `scaleX(${chestScale})`, transformOrigin: '100px 100px' }}>
            <path d="M 65 80 L 135 80 L 130 120 L 100 130 L 70 120 Z" fill="#3f3f46" stroke="#18181b" strokeWidth="2"/>
          </g>

          {/* Cintura / Core */}
          <g style={{ transform: `scaleX(${waistScale})`, transformOrigin: '100px 150px' }}>
            <path d="M 75 125 L 125 125 L 120 180 L 80 180 Z" fill="#27272a" stroke="#18181b" strokeWidth="2"/>
          </g>

          {/* Braços */}
          <g style={{ transform: `scaleX(${armScale})`, transformOrigin: '50px 115px' }}>
            <rect x="40" y="85" width="20" height="60" rx="10" fill="#3f3f46" stroke="#18181b" strokeWidth="2" transform="rotate(15 50 85)" />
            <rect x="25" y="150" width="16" height="50" rx="8" fill="#27272a" stroke="#18181b" strokeWidth="2" transform="rotate(10 33 150)" />
          </g>
          <g style={{ transform: `scaleX(${armScale})`, transformOrigin: '150px 115px' }}>
            <rect x="140" y="85" width="20" height="60" rx="10" fill="#3f3f46" stroke="#18181b" strokeWidth="2" transform="rotate(-15 150 85)" />
            <rect x="159" y="150" width="16" height="50" rx="8" fill="#27272a" stroke="#18181b" strokeWidth="2" transform="rotate(-10 167 150)" />
          </g>

          {/* Pernas */}
          <g style={{ transform: `scaleX(${legScale})`, transformOrigin: '100px 250px' }}>
            <rect x="70" y="185" width="28" height="90" rx="10" fill="#3f3f46" stroke="#18181b" strokeWidth="2" />
            <rect x="102" y="185" width="28" height="90" rx="10" fill="#3f3f46" stroke="#18181b" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md text-center w-full truncate ${isCurrent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-900 text-zinc-500'}`}>{label}</span>
    </div>
  );
}


export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [appScreen, setAppScreen] = useState('loading'); 

  // Estado do Banco de Exercícios em Nuvem
  const [exerciseDB, setExerciseDB] = useState(FALLBACK_EXERCISE_DB);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sistema de Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR');

  // Navegação
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashTab, setDashTab] = useState('daily'); 
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showBackAnatomy, setShowBackAnatomy] = useState(false);
  const [showMeasureAlert, setShowMeasureAlert] = useState(false);
  const [showWorkoutSuccess, setShowWorkoutSuccess] = useState(false);

  // ABA BIOMETRIA & FEED
  const [bioTab, setBioTab] = useState('capture');
  const [scanState, setScanState] = useState('idle'); // idle, scanning, done
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFeedback, setScanFeedback] = useState([]);
  const [estimatedMeasures, setEstimatedMeasures] = useState(null);
  const [uploadedPhotos, setUploadedPhotos] = useState({ frente: null, direita: null, esquerda: null, costas: null });
  const [scanAiReport, setScanAiReport] = useState('');
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [biometricHistory, setBiometricHistory] = useState([]);

  // Autenticação e Config
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [resetPassAttempt, setResetPassAttempt] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiPasswordAttempt, setApiPasswordAttempt] = useState('');
  const [isApiAuthPending, setIsApiAuthPending] = useState(false);
  const [isApiKeyUnlocked, setIsApiKeyUnlocked] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);

  // IA Geral
  const [chatInput, setChatInput] = useState('');
  const [selectedMealId, setSelectedMealId] = useState('m3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anatomyTips, setAnatomyTips] = useState({});
  const [anatomyTipState, setAnatomyTipState] = useState({});
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  
  // Storage de GIFs
  const [gifUrls, setGifUrls] = useState({});
  const [isUploadingGif, setIsUploadingGif] = useState({});

  // FEEDBACKS IA 
  const [deepInsightText, setDeepInsightText] = useState('');
  const [isDeepInsightLoading, setIsDeepInsightLoading] = useState(false);
  const [workoutFeedback, setWorkoutFeedback] = useState('');
  const [isWorkoutFeedbackLoading, setIsWorkoutFeedbackLoading] = useState(false);
  const [nutritionFeedback, setNutritionFeedback] = useState('');
  const [isNutritionFeedbackLoading, setIsNutritionFeedbackLoading] = useState(false);

  // Dados Essenciais
  const [workouts, setWorkouts] = useState({});
  const [workoutOrder, setWorkoutOrder] = useState(DEFAULT_WORKOUT_DAYS);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]); 
  const [nutritionLogs, setNutritionLogs] = useState([]); 
  const [activeWorkoutDay, setActiveWorkoutDay] = useState('Pull');
  const [isGapMode, setIsGapMode] = useState(false);
  const [gapDuration, setGapDuration] = useState(45);
  const [isCaliMode, setIsCaliMode] = useState(false);
  const [selectedCaliPlan, setSelectedCaliPlan] = useState('Treino 01');
  const [currentCaliExercises, setCurrentCaliExercises] = useState([]);
  
  const [userProfile, setUserProfile] = useState({ 
    name: '', age: '', gender: 'M', height: '', weight: '', targetWeight: '', goal: 'Hipertrofia', 
    onboardingCompleted: false, lastMeasureUpdate: null, lastLoginDate: todayStr
  });
  
  const initialMeasures = Object.keys(MEASUREMENTS_LABELS).reduce((acc, key) => ({...acc, [key]: ''}), {});
  const [measurements, setMeasurements] = useState(initialMeasures);
  const [weightHistory, setWeightHistory] = useState([]); 
  
  // UI & Cronômetro & Nutrição Feed
  const [expandedDesc, setExpandedDesc] = useState({});
  const [exerciseModal, setExerciseModal] = useState({ active: false, mode: 'swap', targetExId: null, filterGroup: null });
  const [timerInterval, setTimerInterval] = useState(90);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [editingNutritionId, setEditingNutritionId] = useState(null);
  const [editNutritionData, setEditNutritionData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); 

  // Gamificação - Conquistas
  const ACHIEVEMENTS = [
    { id: 'a1', title: 'Primeiro Passo', desc: '1º Treino concluído', icon: <Flame className="text-orange-500" size={24}/>, condition: (h) => h.length >= 1 },
    { id: 'a2', title: 'Consistência Diária', desc: '10 Treinos concluídos', icon: <Medal className="text-yellow-400" size={24}/>, condition: (h) => h.length >= 10 },
    { id: 'a3', title: 'Força Bruta', desc: '10.000kg movidos', icon: <Trophy className="text-emerald-500" size={24}/>, condition: (h) => h.reduce((a,b)=>a+(b.volume||0),0) >= 10000 },
    { id: 'a4', title: 'Mestre da Gravidade', desc: '5 Treinos Calistenia', icon: <Activity className="text-blue-500" size={24}/>, condition: (h) => h.filter(x => x.exercises?.some(e => String(e.originalId).startsWith('c_'))).length >= 5 },
    { id: 'a5', title: 'Foco no Core', desc: '5 Aulas GAP', icon: <Sparkles className="text-purple-500" size={24}/>, condition: (h) => h.filter(x => x.isGap).length >= 5 }
  ];

  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(a => a.condition(workoutHistory));
  }, [workoutHistory]);

  const todayLog = dailyLogs.find(l => l.date === todayStr) || { water: 0, workout: null };
  const waterTarget = Number(userProfile.weight) * 35 || 2500; 

  const completedWorkoutsThisWeek = useMemo(() => {
    const startOfWeek = getStartOfCurrentWeek();
    return workoutHistory
      .filter(log => {
        const logTime = log.timestamp || new Date(log.date.split('/').reverse().join('-')).getTime();
        return logTime >= startOfWeek;
      })
      .map(log => log.day);
  }, [workoutHistory]);

  useEffect(() => {
    if (completedWorkoutsThisWeek.includes(activeWorkoutDay) && completedWorkoutsThisWeek.length < workoutOrder.length) {
      const nextAvailable = workoutOrder.find(d => !completedWorkoutsThisWeek.includes(d));
      if (nextAvailable) {
        setActiveWorkoutDay(nextAvailable);
      }
    }
  }, [completedWorkoutsThisWeek, activeWorkoutDay, workoutOrder]);

  const todayNutrition = nutritionLogs.filter(log => log.date === todayStr);
  const totals = todayNutrition.reduce((acc, log) => ({ 
    calories: acc.calories + (Number(log.calories)||0), 
    protein: acc.protein + (Number(log.protein)||0), 
    carbs: acc.carbs + (Number(log.carbs)||0), 
    fats: acc.fats + (Number(log.fats)||0) 
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const aiGoals = useMemo(() => {
    const w = Number(userProfile.weight) || 70;
    const h = Number(userProfile.height) || 175;
    const a = Number(userProfile.age) || 25;
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = userProfile.gender === 'M' ? bmr + 5 : bmr - 161;
    let tdee = bmr * 1.55; 
    
    if (userProfile.goal === 'Hipertrofia') tdee += 400;
    if (userProfile.goal === 'Definição') tdee -= 400;
    
    const cal = Math.round(tdee);
    const prot = Math.round(w * 2.2);
    const fat = Math.round(w * 0.9);
    const carb = Math.round((cal - (prot*4) - (fat*9))/4);
    
    return { calories: cal, protein: prot, fats: fat, carbs: carb };
  }, [userProfile]);

  const bmi = useMemo(() => {
    const w = Number(userProfile.weight);
    const h = Number(userProfile.height) / 100;
    if(w>0 && h>0) return (w / (h*h)).toFixed(1);
    return '0';
  }, [userProfile.weight, userProfile.height]);

  const getEx = (id) => exerciseDB.find(e => e.id === id) || FALLBACK_EXERCISE_DB.find(e => e.id === id);

  const generateAIPlan = () => {
    const p = {
      'Pull': { name: 'Treino Pull', isLegs: false, exercises: [ 
          formatEx(getEx('e19'), 4, 10), formatEx(getEx('e22'), 3, 10), formatEx(getEx('e26'), 3, 12),
          formatEx(getEx('e40'), 3, 15), 
          formatEx(getEx('e47'), 4, 10), formatEx(getEx('e49'), 3, 12), 
          formatEx(getEx('e56'), 3, 15)
      ].filter(e=>e)},
      'Push': { name: 'Treino Push', isLegs: false, exercises: [ 
          formatEx(getEx('e1'), 4, 10), formatEx(getEx('e2'), 3, 12),
          formatEx(getEx('e32'), 4, 10), formatEx(getEx('e36'), 4, 12), 
          formatEx(getEx('e57'), 4, 12), formatEx(getEx('e59'), 3, 12) 
      ].filter(e=>e)},
      'Legs 1': { name: 'Legs Quadríceps', isLegs: true, exercises: [ 
          formatEx(getEx('e67'), 4, 8), formatEx(getEx('e71'), 3, 12), formatEx(getEx('e73'), 3, 15), 
          formatEx(getEx('e77'), 4, 12), formatEx(getEx('e80'), 3, 12), 
          formatEx(getEx('e83'), 4, 20), formatEx(getEx('e84'), 4, 15)
      ].filter(e=>e)}
    };
    setWorkouts(p);
    setWorkoutOrder(['Pull', 'Push', 'Legs 1']);
    saveToCloud({ workouts: p, workoutOrder: ['Pull', 'Push', 'Legs 1'] });
  };

  // Firebase Setup: Inicializa Auth
  useEffect(() => {
    if (!auth) { setFirebaseError("Firebase falhou."); setIsAuthLoading(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (e) { setFirebaseError(e.message); setIsAuthLoading(false); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      if (!u) setAppScreen('login');
      setIsAuthLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // Firebase Setup: Lê Coleção Pública de Exercícios (Para Nuvem Global)
  useEffect(() => {
    if (!db || !user) return;
    const fetchPublicExercises = async () => {
      try {
        const exRef = collection(db, 'artifacts', appId, 'public', 'data', 'exercises');
        const snap = await getDocs(exRef);
        if (!snap.empty) {
          const exList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setExerciseDB(exList);
        } else {
          // Se a nuvem estiver vazia, usa o fallback. O Admin pode popular depois.
          setExerciseDB(FALLBACK_EXERCISE_DB);
        }
      } catch (e) {
        console.error("Erro lendo exercícios da nuvem:", e);
        setExerciseDB(FALLBACK_EXERCISE_DB);
      }
    };
    fetchPublicExercises();
  }, [db, user]);

  // Firebase Setup: Lê Dados do Usuário
  useEffect(() => {
    if (!user || !db || firebaseError) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'); 
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.workouts) setWorkouts(d.workouts);
        if (d.workoutOrder) {
           setWorkoutOrder(d.workoutOrder);
        } else if (d.workouts) {
           setWorkoutOrder(Object.keys(d.workouts));
        }
        
        if (d.nutritionLogs) setNutritionLogs(d.nutritionLogs);
        if (d.workoutHistory) setWorkoutHistory(d.workoutHistory);
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        if (d.biometricHistory) setBiometricHistory(d.biometricHistory);
        
        if (d.measurements) {
          let loadedMeasures = { ...initialMeasures, ...d.measurements };
          setMeasurements(loadedMeasures);
        }
        if (d.weightHistory) setWeightHistory(d.weightHistory);
        if (d.userProfile) {
          let prof = { targetWeight: '', ...d.userProfile };
          
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
             if (modified) {
               setWorkouts(updWorkouts);
               setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'), { userProfile: prof, workouts: updWorkouts }, { merge: true });
             }
          } else {
             setUserProfile(prof);
          }

          if (prof.onboardingCompleted) {
            setAppScreen('main');
            if (prof.lastMeasureUpdate) {
               const daysSince = (Date.now() - prof.lastMeasureUpdate) / (1000 * 60 * 60 * 24);
               if (daysSince >= 7) setShowMeasureAlert(true);
            }
          } else {
            setAppScreen('onboarding');
          }
        }
      } else {
        generateAIPlan();
        setAppScreen('onboarding');
      }
    }, (err) => setFirebaseError(err.message));
    return () => unsub();
  }, [user, firebaseError, todayStr]);

  useEffect(() => {
    let int = null;
    if (isTimerRunning && timeLeft > 0) int = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else if (timeLeft === 0 && isTimerRunning) setIsTimerRunning(false);
    return () => clearInterval(int);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (s) => `${Math.floor(s/60)}:${s%60 < 10 ? '0' : ''}${s%60}`;

  useEffect(() => {
    setTempApiKey(userProfile.geminiApiKey || '');
    setIsApiKeyUnlocked(!userProfile.geminiApiKey);
  }, [userProfile.geminiApiKey]);

  const saveToCloud = async (overrideData = null) => {
    if (!user || !db) return;
    setIsSyncing(true);
    try {
      const dataToSave = overrideData || { workouts, workoutOrder, nutritionLogs, workoutHistory, userProfile, dailyLogs, measurements, weightHistory, biometricHistory };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'), dataToSave, { merge: true });
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
    } catch (error) {
       setAuthErrorMsg(`Erro: ${error.message}`);
    } finally { 
      setIsProcessingAuth(false); 
    }
  };

  const handleGuestLogin = async () => {
    setAuthErrorMsg('');
    setIsProcessingAuth(true);
    try {
      await signInAnonymously(auth);
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
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUnlockApiKey = async () => {
    if (user?.email) {
      try {
        setIsApiAuthPending(true);
        await signInWithEmailAndPassword(auth, user.email, apiPasswordAttempt);
        setIsApiKeyUnlocked(true);
        setShowUnlockPrompt(false);
        if (apiPasswordAttempt === 'admin123') setIsAdmin(true); // Atalho para testes
        setApiPasswordAttempt('');
      } catch (error) {
        showToast("Senha incorreta!", "error");
      } finally {
        setIsApiAuthPending(false);
      }
    } else {
      if (apiPasswordAttempt === 'admin123') {
        setIsApiKeyUnlocked(true);
        setIsAdmin(true); // Desbloqueia a aba Admin
        setShowUnlockPrompt(false);
        setApiPasswordAttempt('');
        showToast("Modo Administrador Desbloqueado!", "success");
      } else {
        showToast("Senha incorreta! No modo local, digite 'admin123'.", "error");
      }
    }
  };

  const handleSaveApiKey = () => {
     const upProf = {...userProfile, geminiApiKey: tempApiKey.trim()};
     setUserProfile(upProf);
     saveToCloud({ userProfile: upProf });
     setIsApiKeyUnlocked(false);
     showToast("Configuração salva e bloqueada com sucesso!", "success");
  };

  // --- FUNÇÕES ADMIN ---
  const handleMigrateExercises = async () => {
    if (!db) return;
    try {
      const batch = writeBatch(db);
      FALLBACK_EXERCISE_DB.forEach((ex) => {
        const exRef = doc(db, 'artifacts', appId, 'public', 'data', 'exercises', ex.id);
        batch.set(exRef, { ...ex, gifUrl: '', createdAt: Date.now() });
      });
      await batch.commit();
      showToast("Banco de exercícios sincronizado com sucesso!", "success");
      
      // Refresh local
      const exRef = collection(db, 'artifacts', appId, 'public', 'data', 'exercises');
      const snap = await getDocs(exRef);
      setExerciseDB(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      showToast(`Erro na sincronização: ${e.message}`, "error");
    }
  };

  const handleAdminUpdateGif = async (exId, url) => {
    try {
      const exRef = doc(db, 'artifacts', appId, 'public', 'data', 'exercises', exId);
      await updateDoc(exRef, { gifUrl: url });
      setExerciseDB(prev => prev.map(e => e.id === exId ? { ...e, gifUrl: url } : e));
      showToast("GIF atualizado!", "success");
    } catch (e) {
      showToast(`Erro ao atualizar: ${e.message}`, "error");
    }
  };


  const moveWorkoutDay = (index, direction) => {
    const newOrder = [...workoutOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    setWorkoutOrder(newOrder);
    saveToCloud({ workoutOrder: newOrder });
  };

  const handleCompleteWorkout = () => {
    const cur = workouts[activeWorkoutDay];
    let vol = 0; let durationGap = 0;
    let completedExercises = [];
    const bw = Number(userProfile.weight) || 0;
    
    if (isGapMode) {
      durationGap = Number(gapDuration) || 45;
    } else if (isCaliMode) {
      currentCaliExercises.forEach(ex => {
        const w = Number(ex.weight) || 0;
        const effW = w + bw; 
        vol += effW * (Number(ex.reps)||0) * (Number(ex.sets)||0);
        completedExercises.push({ originalId: ex.originalId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
        ex.isCompleted = false; 
      });
    } else if (cur && cur.exercises) {
      cur.exercises.forEach(ex => {
        const w = Number(ex.weight) || 0;
        const isBodyweight = ex.group === 'GAP' || ex.group === 'Cardio' || String(ex.originalId).startsWith('c_');
        const effW = isBodyweight ? (w + bw) : w;
        vol += effW * (Number(ex.reps)||0) * (Number(ex.sets)||0);
        completedExercises.push({ originalId: ex.originalId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
        ex.isCompleted = false; 
      });
    }

    const timestamp = Date.now();
    const newLog = { 
      id: timestamp, date: todayStr, timestamp, day: activeWorkoutDay, volume: vol, isGap: isGapMode, gapDuration: durationGap, exercises: completedExercises 
    };
    const newHist = [...workoutHistory, newLog];
    
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === todayStr);
    if (idx >= 0) newDLogs[idx].workout = activeWorkoutDay;
    else newDLogs.push({ date: todayStr, workout: activeWorkoutDay, water: 0, calories: totals.calories });

    setWorkoutHistory(newHist); setDailyLogs(newDLogs);
    saveToCloud({ workouts: workouts, workoutOrder, workoutHistory: newHist, dailyLogs: newDLogs });
    
    setShowWorkoutSuccess(true);
    setIsGapMode(false);
    setIsCaliMode(false);
  };

  const addWater = () => {
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === todayStr);
    if (idx >= 0) newDLogs[idx].water = (newDLogs[idx].water || 0) + 250;
    else newDLogs.push({ date: todayStr, water: 250, workout: null });
    setDailyLogs(newDLogs); saveToCloud({ dailyLogs: newDLogs });
  };

  const handleUpdateMeasures = () => {
    const wHist = [...weightHistory, { date: todayStr, weight: Number(userProfile.weight) }];
    const upProf = { ...userProfile, lastMeasureUpdate: Date.now() };
    setUserProfile(upProf); setWeightHistory(wHist); setShowMeasureAlert(false);
    saveToCloud({ userProfile: upProf, measurements, weightHistory: wHist });
  };

  const handlePhotoUpload = (view, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhotos(prev => ({ ...prev, [view]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const allPhotosUploaded = Object.values(uploadedPhotos).every(v => v !== null);

  const startBiometricScan = () => {
    setScanState('scanning');
    setScanProgress(0);
    setScanFeedback([]);
    setScanAiReport('');

    const steps = [
      { p: 20, text: "Verificando Câmera e Iluminação [OK]" },
      { p: 40, text: "Fotos validadas e Estáveis [OK]" },
      { p: 60, text: "Ângulos: Frontal, Perfil e Costas [OK]" },
      { p: 80, text: "Mapeando Pontos-chave do Corpo (Pose Estimation)..." },
      { p: 100, text: "Calculando Proporções e Estimando Medidas..." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const current = steps[currentStep];
        setScanProgress(current.p);
        setScanFeedback(prev => [...prev, current.text]);
        currentStep++;
      } else {
        clearInterval(interval);
        const h = Number(userProfile.height) || 175;
        const w = Number(userProfile.weight) || 70;
        setEstimatedMeasures({
          peito: Math.round(w * 1.35),
          cintura: Math.round(h * 0.45),
          quadril: Math.round(w * 1.3),
          bracos: Math.round(w * 0.48),
          pernas: Math.round(h * 0.33)
        });
        setScanState('done');
      }
    }, 1200);
  };

  const saveBiometricMeasures = () => {
    const newMeasures = {
      ...measurements,
      peito: estimatedMeasures.peito,
      cintura: estimatedMeasures.cintura,
      quadril: estimatedMeasures.quadril,
      bracoEsq: estimatedMeasures.bracos,
      bracoDir: estimatedMeasures.bracos,
      pernaEsq: estimatedMeasures.pernas,
      pernaDir: estimatedMeasures.pernas
    };
    setMeasurements(newMeasures);
    handleUpdateMeasures();

    // Salvar no Histórico Biométrico
    const newLog = {
      id: Date.now(),
      date: todayStr,
      measures: estimatedMeasures,
      report: scanAiReport || "Análise de proporção guardada via Check-up Fotográfico."
    };
    const updatedHistory = [newLog, ...biometricHistory];
    setBiometricHistory(updatedHistory);

    saveToCloud({ biometricHistory: updatedHistory, measurements: newMeasures });
    setBioTab('evolution');
    setScanState('idle');
    setUploadedPhotos({ frente: null, direita: null, esquerda: null, costas: null });
    setScanAiReport('');
  };

  const callGemini = async (prompt, schema = null, retries = 5) => {
    const apiKey = userProfile.geminiApiKey || ""; 
    const model = apiKey ? "gemini-2.5-flash" : "gemini-2.5-flash-preview-09-2025";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(schema && {
        generationConfig: {
          responseMimeType: "application/json", 
          responseSchema: schema
        }
      })
    };

    const delays = [1000, 2000, 4000, 8000, 16000];
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Falha na API da IA.");
        
        let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) throw new Error("Resposta da IA está vazia.");
        
        if (schema) {
          textOutput = textOutput.replace(new RegExp('```json\\n?', 'g'), '').replace(new RegExp('```', 'g'), '').trim();
          return JSON.parse(textOutput);
        }
        return textOutput;
      } catch (err) {
        if (attempt === retries - 1) {
          throw new Error("Falha na comunicação com a IA após várias tentativas. Detalhe: " + err.message);
        }
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  };

  const handleGenerateDeepInsight = async () => {
    setIsDeepInsightLoading(true); setDeepInsightText('');
    try {
      const recentWorkouts = workoutHistory.slice(-7);
      const workoutCount = recentWorkouts.length;
      const totalVolume = recentWorkouts.reduce((acc, w) => acc + (w.volume || 0), 0);
      
      let totalCal = 0, totalPro = 0, totalCar = 0, totalFat = 0, daysWithFood = 0;
      const uniqueDates = [...new Set(nutritionLogs.map(n => n.date))].slice(-7);

      uniqueDates.forEach(date => {
        const dayLogs = nutritionLogs.filter(n => n.date === date);
        if (dayLogs.length > 0) {
            daysWithFood++;
            dayLogs.forEach(l => {
                totalCal += (Number(l.calories) || 0);
                totalPro += (Number(l.protein) || 0);
                totalCar += (Number(l.carbs) || 0);
                totalFat += (Number(l.fats) || 0);
            });
        }
      });

      const avgCal = daysWithFood > 0 ? Math.round(totalCal / daysWithFood) : 0;
      const avgPro = daysWithFood > 0 ? Math.round(totalPro / daysWithFood) : 0;
      const avgCar = daysWithFood > 0 ? Math.round(totalCar / daysWithFood) : 0;
      const avgFat = daysWithFood > 0 ? Math.round(totalFat / daysWithFood) : 0;

      const prompt = `Atue como o meu Treinador e Nutricionista. O meu objetivo atual é ${userProfile.goal} (Peso atual: ${userProfile.weight}kg, Alvo: ${userProfile.targetWeight}kg).
      RESUMO DOS ÚLTIMOS 7 DIAS: Treino: ${workoutCount} sessões, movendo ${totalVolume} kg. Nutrição (média): ${avgCal} kcal. Metas IA: ${aiGoals.calories} kcal.
      TAREFA: 1. Verifique o volume de treino. 2. Avalie as macros. 3. Resumo com Pontos Fortes e a Melhorar. Responda em Português do Brasil.`;

      const res = await callGemini(prompt);
      setDeepInsightText(res);
    } catch (error) { setDeepInsightText(`Erro IA: ${error.message}`); } 
    finally { setIsDeepInsightLoading(false); }
  };

  const handleEvaluateWorkout = async () => {
    setIsWorkoutFeedbackLoading(true); setWorkoutFeedback('');
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const exerciseList = dayInfo.exercises.map(e => `${e.name} (${e.target})`).join(', ');
      const prompt = `Atue como Master Trainer. O meu objetivo é ${userProfile.goal}. Avalie este treino: ${exerciseList}. Seja muito direto (máx 2 parágrafos).`;
      const res = await callGemini(prompt);
      setWorkoutFeedback(res);
    } catch (error) { setWorkoutFeedback(`Erro ao avaliar: ${error.message}`); } 
    finally { setIsWorkoutFeedbackLoading(false); }
  };

  const handleEvaluateNutrition = async () => {
    setIsNutritionFeedbackLoading(true); setNutritionFeedback('');
    try {
      const prompt = `Atue como Nutricionista Desportivo. Objetivo: ${userProfile.goal}. Meta diária: ${aiGoals.calories} kcal. Até agora consumi: ${totals.calories} kcal. Avalie o meu dia (máx 2 parágrafos curtos em pt-BR).`;
      const res = await callGemini(prompt);
      setNutritionFeedback(res);
    } catch (error) { setNutritionFeedback(`Erro ao avaliar: ${error.message}`); } 
    finally { setIsNutritionFeedbackLoading(false); }
  };

  const handleGenerateBiometricReport = async () => {
    setIsScanningAi(true);
    setScanAiReport('');
    try {
      const prompt = `Atue como um Especialista em Avaliação Física. Objetivo: ${userProfile.goal} (Peso: ${userProfile.weight}kg).
      Medidas antigas: Peito: ${measurements.peito}, Cintura: ${measurements.cintura}.
      Medidas novas lidas agora: Peito: ${estimatedMeasures.peito}, Cintura: ${estimatedMeasures.cintura}.
      Destaque o que evoluiu de forma motivadora em pt-BR, apontando a simetria. Máx 3 parágrafos diretos.`;
      
      const res = await callGemini(prompt);
      setScanAiReport(res);
    } catch (error) { setScanAiReport(`Erro na análise biométrica: ${error.message}`); } 
    finally { setIsScanningAi(false); }
  };

  const handleUploadGif = async (e, originalId) => {
    const file = e.target.files[0];
    if (!file || !storage) return;
    
    setIsUploadingGif(p => ({ ...p, [originalId]: true }));
    try {
      const storageRef = ref(storage, `gifs/${originalId}.gif`);
      await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setGifUrls(p => ({ ...p, [originalId]: url }));
    } catch (error) { showToast("Erro ao enviar GIF: " + error.message, "error"); } 
    finally { setIsUploadingGif(p => ({ ...p, [originalId]: false })); }
  };

  const handleGetAnatomyTip = async (exId, exName, exOriginalId) => {
    setExpandedDesc(p => ({ ...p, [exId]: !p[exId] })); 
    
    // Busca GIF no DB ou no Firebase Storage Cache
    const exDbData = exerciseDB.find(e => e.id === exOriginalId);
    if (exDbData?.gifUrl) {
       setGifUrls(p => ({ ...p, [exOriginalId]: exDbData.gifUrl }));
    } else if (storage && gifUrls[exOriginalId] === undefined) {
      try {
        const url = await getDownloadURL(ref(storage, `gifs/${exOriginalId}.gif`));
        setGifUrls(p => ({ ...p, [exOriginalId]: url }));
      } catch (err) { setGifUrls(p => ({ ...p, [exOriginalId]: null })); }
    }

    if (anatomyTipState[exId] === 'done') return; 
    setAnatomyTipState(p => ({ ...p, [exId]: 'loading' }));
    try {
      const schema = { 
        type: "OBJECT", 
        properties: { 
          intro: { type: "STRING" }, musclesTarget: { type: "STRING" }, musclesAux: { type: "STRING" }, 
          musclesStability: { type: "STRING" }, executionSteps: { type: "ARRAY", items: { type: "STRING" } }, 
          safetyTips: { type: "ARRAY", items: { type: "STRING" } }, mistakes: { type: "ARRAY", items: { type: "STRING" } }, 
          geminiTip: { type: "STRING" } 
        } 
      };
      const res = await callGemini(`Crie um "Guia Rápido" premium para o exercício "${exName}". Retorne estritamente o JSON preenchido em Português do Brasil.`, schema);
      
      setAnatomyTips(p => ({ ...p, [exId]: res })); 
      setAnatomyTipState(p => ({ ...p, [exId]: 'done' }));
    } catch (error) { setAnatomyTipState(p => ({ ...p, [exId]: 'error' })); }
  };

  const handleAnalyzeFood = async () => {
    if (!chatInput.trim()) return;
    const mealName = INITIAL_MEALS.find(m => m.id === selectedMealId)?.name || 'Refeição';
    const userText = chatInput;
    setChatInput(''); setIsAnalyzing(true);
    try {
      const macros = await callGemini(`Estime macros exatos para: "${userText}". Retorne estritamente um JSON.`, { type: "OBJECT", properties: { calories: { type: "INTEGER" }, protein: { type: "INTEGER" }, carbs: { type: "INTEGER" }, fats: { type: "INTEGER" }, name: { type: "STRING" } } });
      const newLog = { id: Date.now(), date: todayStr, mealId: selectedMealId, text: macros.name || userText, calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fats: macros.fats };
      
      const updatedLogs = [...nutritionLogs, newLog];
      setNutritionLogs(updatedLogs); saveToCloud({ nutritionLogs: updatedLogs });
      showToast(`${mealName} adicionado! 🔥 ${macros.calories} kcal`, "success");
    } catch (error) { showToast(`Erro ao analisar dieta: ${error.message}`, "error"); } 
    finally { setIsAnalyzing(false); }
  };

  const handleGenerateAIWorkout = async () => {
    setIsGeneratingWorkout(true);
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const dbContext = exerciseDB.map(e => `ID:'${e.id}' | Nome:'${e.name}' | Grupo:'${e.group}'`).join('\n');

      const prompt = `Atue como personal trainer. Objetivo: ${userProfile.goal}. Treino: "${dayInfo.name}". Exercícios disponíveis:\n${dbContext}\n Retorne JSON com exatamente 7 IDs: {"exercises": ["id1", "id2", ...]}.`;

      const schema = { type: "OBJECT", properties: { exercises: { type: "ARRAY", items: { type: "STRING" } } } };
      const resultData = await callGemini(prompt, schema);
      const resultIds = resultData.exercises || [];

      if (Array.isArray(resultIds) && resultIds.length > 0) {
         const newExercises = resultIds.map(id => {
           const ex = getEx(id);
           return ex ? formatEx(ex, 3, 10) : null; 
         }).filter(e => e !== null);

         if (newExercises.length > 0) {
           const upd = {...workouts};
           upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises: newExercises };
           setWorkouts(upd); saveToCloud({ workouts: upd });
         } else { showToast("A IA não retornou exercícios compatíveis.", "error"); }
      }
    } catch (error) { showToast(`Erro da IA: ${error.message}`, "error"); } 
    finally { setIsGeneratingWorkout(false); }
  };

  const getFatigueColor = (groupMapArray) => {
    let lastWorkedDate = null;
    const now = Date.now();
    const dayToGroups = {
      'Pull': ['Costas', 'Bíceps', 'Braços'], 'Push': ['Peito', 'Ombros', 'Tríceps', 'Braços'],
      'Legs 1': ['Pernas', 'Glúteo', 'Quadríceps', 'GAP'], 'Legs 2 ou Cardio': ['Pernas', 'Glúteo', 'Posterior', 'Panturrilha', 'GAP', 'Cardio'],
      'Upper': ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Braços'], 'Lower': ['Pernas', 'Glúteo', 'GAP'], 'Cardio': ['Cardio', 'GAP', 'Core']
    };

    for (let i = workoutHistory.length - 1; i >= 0; i--) {
       const hist = workoutHistory[i];
       const wGroups = dayToGroups[hist.day] || [];
       const isMatch = groupMapArray.some(g => wGroups.includes(g));
       if (isMatch) {
         lastWorkedDate = hist.timestamp || new Date(hist.date.split('/').reverse().join('-')).getTime();
         break;
       }
    }
    if (!lastWorkedDate) return '#10b981'; 
    const diffHours = (now - lastWorkedDate) / (1000 * 60 * 60);
    if (diffHours < 24) return '#ef4444'; 
    if (diffHours < 72) return '#eab308'; 
    return '#10b981'; 
  };

  const getCalendarDays = () => {
    const days = []; const today = new Date(); today.setHours(0,0,0,0);
    let signup = new Date(today); signup.setDate(today.getDate() - 6);
    if (weightHistory.length > 0) {
      const parts = weightHistory[0].date.split('/');
      if (parts.length === 3) {
        signup = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`); signup.setHours(0,0,0,0);
      }
    }
    const diffTime = today.getTime() - signup.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let startDate = new Date();
    if (diffDays >= 0 && diffDays < 7) { startDate = new Date(signup); } 
    else { startDate = new Date(today); startDate.setDate(today.getDate() - 6); }

    for(let i=0; i<7; i++) {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i);
      const dStr = d.toLocaleDateString('pt-BR');
      const log = dailyLogs.find(l => l.date === dStr);
      const isFuture = d > today;
      const isBeforeSignup = d < signup;
      days.push({ dateNum: d.getDate(), dayStr: d.toLocaleDateString('pt-BR', {weekday:'short'}), hasWorkout: !!log?.workout, isFuture, isBeforeSignup });
    }
    return days;
  };

  const handleExerciseChange = (id, field, value) => {
    const upd = {...workouts};
    upd[activeWorkoutDay] = {
      ...upd[activeWorkoutDay],
      exercises: upd[activeWorkoutDay].exercises.map(x => x.id === id ? { ...x, [field]: value } : x)
    };
    setWorkouts(upd);
  };

  const handleRemoveExercise = (id) => {
    const upd = {...workouts};
    upd[activeWorkoutDay] = {
      ...upd[activeWorkoutDay], exercises: upd[activeWorkoutDay].exercises.filter(ex => ex.id !== id)
    };
    setWorkouts(upd); saveToCloud({ workouts: upd });
  };

  const recentNutritionDates = [...new Set(nutritionLogs.map(log => log.date))].slice(-7).reverse();

  // --- SCREENS ---
  if (isAuthLoading || appScreen === 'loading') return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;
  if (firebaseError) return <div className="p-8 bg-zinc-950 text-white"><AlertCircle className="text-red-500 mb-4" size={48}/>{firebaseError}</div>;

  if (!user || appScreen === 'login') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white relative overflow-hidden">
      <ToastContainer toasts={toasts} />
      <div className="max-w-md w-full bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 z-10 text-center shadow-2xl shadow-emerald-500/10">
        <Dumbbell size={48} className="text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold mb-2">{isLoginMode ? 'AnatomiaFit' : 'Criar Conta'}</h1>
        <p className="text-zinc-400 text-sm mb-8">O seu ecossistema de treino inteligente.</p>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center text-lg mb-4 focus:border-emerald-500 outline-none" placeholder="E-mail" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleAuthAction();}} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center tracking-widest text-lg mb-4 focus:border-emerald-500 outline-none" placeholder="Senha" />
        {authErrorMsg && <div className="text-red-400 text-xs mb-4 p-2 bg-red-500/10 rounded-xl">{authErrorMsg}</div>}
        <button onClick={handleAuthAction} disabled={isProcessingAuth} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all">
          {isProcessingAuth ? <Loader2 className="animate-spin mx-auto" /> : (isLoginMode ? 'Entrar' : 'Registar')}
        </button>
        <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthErrorMsg(''); }} className="mt-6 text-sm text-emerald-400 font-bold block w-full">
          {isLoginMode ? 'Não tem conta? Registe-se' : 'Já tem conta? Entre'}
        </button>
        <button onClick={handleGuestLogin} disabled={isProcessingAuth} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 font-medium block w-full transition-colors">
          Continuar sem conta (Modo Convidado)
        </button>
      </div>
    </div>
  );

  if (appScreen === 'onboarding') return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-6 justify-center">
      <ToastContainer toasts={toasts} />
      <div className="max-w-md w-full mx-auto bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
        <div className="flex mb-8 gap-2">
           <div className={`h-2 flex-1 rounded-full ${onboardingStep>=1 ? 'bg-emerald-500':'bg-zinc-800'}`}></div>
           <div className={`h-2 flex-1 rounded-full ${onboardingStep>=2 ? 'bg-emerald-500':'bg-zinc-800'}`}></div>
        </div>

        {onboardingStep === 0 && (
          <div className="text-center animate-fadeIn">
            <Activity size={64} className="text-emerald-500 mx-auto mb-6" />
            <h1 className="text-3xl font-extrabold mb-4">Configure o seu Perfil</h1>
            <p className="text-zinc-400 mb-8">A IA usará estes dados para calcular metas e nivelar treinos.</p>
            <button onClick={()=>setOnboardingStep(1)} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold">Avançar</button>
          </div>
        )}

        {onboardingStep === 1 && (
          <div className="animate-fadeIn space-y-4">
            <h2 className="text-xl font-bold mb-4">Dados Básicos</h2>
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Nome</label><input type="text" value={userProfile.name} onChange={e=>setUserProfile({...userProfile, name:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Idade</label><input type="number" value={userProfile.age} onChange={e=>setUserProfile({...userProfile, age:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Gênero</label><select value={userProfile.gender} onChange={e=>setUserProfile({...userProfile, gender:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none"><option value="M">Masc</option><option value="F">Fem</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Atual (kg)</label><input type="number" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Alvo (kg)</label><input type="number" value={userProfile.targetWeight} onChange={e=>setUserProfile({...userProfile, targetWeight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Altura (cm)</label><input type="number" value={userProfile.height} onChange={e=>setUserProfile({...userProfile, height:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Objetivo</label>
                <select value={userProfile.goal} onChange={e=>setUserProfile({...userProfile, goal:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none text-emerald-400 font-bold">
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Definição">Definição</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
              </div>
            </div>
            <button onClick={()=>setOnboardingStep(2)} disabled={!userProfile.name || !userProfile.weight || !userProfile.targetWeight || !userProfile.height} className="w-full bg-emerald-600 disabled:opacity-50 py-4 rounded-2xl font-bold mt-4">Próximo</button>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="animate-fadeIn space-y-4">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Ruler size={20} className="text-emerald-500"/> Medidas Iniciais (cm)</h2>
             <div className="grid grid-cols-2 gap-3">
               {Object.keys(MEASUREMENTS_LABELS).map(key => (
                 <div key={key}>
                   <label className="text-[10px] text-zinc-500 font-bold uppercase">{MEASUREMENTS_LABELS[key]}</label>
                   <input type="number" value={measurements[key]} onChange={e=>setMeasurements({...measurements, [key]:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none focus:border-emerald-500 text-sm font-bold" />
                 </div>
               ))}
             </div>
             <button onClick={()=>{
               const prof = {...userProfile, onboardingCompleted:true, lastMeasureUpdate: Date.now(), lastLoginDate: todayStr};
               setUserProfile(prof); setAppScreen('main');
               saveToCloud({ userProfile: prof, measurements, weightHistory: [{date: todayStr, weight: Number(userProfile.weight)}] });
               showToast("Perfil configurado com sucesso!", "success");
             }} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold mt-4">Concluir Setup</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      <ToastContainer toasts={toasts} />
      
      {showMeasureAlert && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center">
              <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Hora de Atualizar!</h2>
              <p className="text-zinc-400 mb-6 text-sm">Passaram-se 7 dias desde o último registro. Atualize o seu peso e medidas para a IA.</p>
              
              <div className="space-y-4 text-left mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-3 mb-2">
                   <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Atual (kg)</label><input type="number" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none text-emerald-400 font-bold mt-1" /></div>
                   <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Desejado</label><input type="number" value={userProfile.targetWeight} onChange={e=>setUserProfile({...userProfile, targetWeight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none text-emerald-400 font-bold mt-1" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   {Object.keys(MEASUREMENTS_LABELS).map(key => (
                     <div key={key}>
                       <label className="text-[10px] text-zinc-500 font-bold uppercase">{MEASUREMENTS_LABELS[key]} (cm)</label>
                       <input type="number" value={measurements[key]} onChange={e=>setMeasurements({...measurements, [key]:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none font-bold mt-1 text-sm" />
                     </div>
                   ))}
                 </div>
              </div>
              <button onClick={handleUpdateMeasures} className="w-full py-4 bg-emerald-600 rounded-2xl font-bold">Salvar Medidas</button>
           </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-zinc-900/40 border-r border-zinc-800/80 p-6 z-40">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <Dumbbell className="text-emerald-500" size={28} />
          <span className="font-extrabold text-2xl tracking-tight text-white">AnatomiaFit</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <SidebarBtn a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={20}/>} l="Painel" />
          <SidebarBtn a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={20}/>} l="Treino" />
          <SidebarBtn a={activeTab==='nutricao'} o={()=>setActiveTab('nutricao')} i={<Utensils size={20}/>} l="Nutrição" />
          <SidebarBtn a={activeTab==='biometria'} o={()=>setActiveTab('biometria')} i={<Scan size={20}/>} l="Check-up" />
          <SidebarBtn a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={20}/>} l="Perfil" />
          {isAdmin && <SidebarBtn a={activeTab==='admin'} o={()=>setActiveTab('admin')} i={<Shield size={20} className="text-yellow-500"/>} l="Admin Panel" />}
        </nav>
        <div className="text-xs text-zinc-500 font-bold">{isSyncing ? 'Salvando Nuvem...' : 'App OK'}</div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto w-full relative pb-28 md:pb-8">
        <div className="md:hidden flex items-center justify-between p-5 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
           <span className="font-extrabold text-xl text-emerald-500 flex items-center gap-2"><Dumbbell size={20}/> AnatomiaFit</span>
           <button onClick={()=>setActiveTab('perfil')} className="text-zinc-400 hover:text-white"><Settings size={22}/></button>
        </div>
        
        <div className="max-w-4xl mx-auto p-5 md:p-8 w-full mt-2">
          
          {/* TELA: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Painel</h1>
                  <p className="text-zinc-400 font-medium">Meta Diária: {aiGoals.calories} kcal</p>
                </div>
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  <button onClick={()=>setDashTab('daily')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${dashTab==='daily'?'bg-zinc-800 text-white shadow-sm':'text-zinc-500 hover:text-zinc-300'}`}>Diário</button>
                  <button onClick={()=>setDashTab('weekly')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${dashTab==='weekly'?'bg-zinc-800 text-white shadow-sm':'text-zinc-500 hover:text-zinc-300'}`}>Semanal</button>
                </div>
              </header>
              
              {dashTab === 'daily' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   
                   {/* Avatar de Fadiga Muscular (Paramétrico p/ Frente e Costas) */}
                   <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden flex flex-col">
                     <div className="flex justify-between items-center mb-6">
                       <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Fadiga Muscular</h3>
                       <button onClick={() => setShowBackAnatomy(!showBackAnatomy)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl transition-all shadow-md">
                         <RefreshCw size={18} className={showBackAnatomy ? "rotate-180 transition-transform" : "transition-transform"} /> 
                       </button>
                     </div>
                     
                     <div className="flex-1 flex justify-center items-center h-64 relative cursor-pointer" onClick={()=>setShowBackAnatomy(!showBackAnatomy)}>
                       <svg viewBox="0 0 200 400" className="h-full drop-shadow-xl">
                          <circle cx="100" cy="40" r="25" fill="#27272a" />
                          {showBackAnatomy ? (
                            <>
                              <path d="M 65 80 L 135 80 L 120 160 L 80 160 Z" fill={getFatigueColor(['Costas'])} stroke="#18181b" strokeWidth="2"/>
                              <rect x="40" y="85" width="20" height="60" rx="10" fill={getFatigueColor(['Tríceps'])} stroke="#18181b" strokeWidth="2" transform="rotate(15 50 85)" />
                              <rect x="140" y="85" width="20" height="60" rx="10" fill={getFatigueColor(['Tríceps'])} stroke="#18181b" strokeWidth="2" transform="rotate(-15 150 85)" />
                              
                              <path d="M 75 160 L 125 160 L 130 210 L 100 220 L 70 210 Z" fill={getFatigueColor(['Glúteo', 'GAP', 'Pernas'])} stroke="#18181b" strokeWidth="2"/>
                              <rect x="70" y="215" width="26" height="80" rx="8" fill={getFatigueColor(['Pernas'])} stroke="#18181b" strokeWidth="2" />
                              <rect x="104" y="215" width="26" height="80" rx="8" fill={getFatigueColor(['Pernas'])} stroke="#18181b" strokeWidth="2" />
                              <rect x="72" y="300" width="22" height="70" rx="8" fill={getFatigueColor(['Pernas'])} stroke="#18181b" strokeWidth="2" />
                              <rect x="106" y="300" width="22" height="70" rx="8" fill={getFatigueColor(['Pernas'])} stroke="#18181b" strokeWidth="2" />
                            </>
                          ) : (
                            <>
                              <path d="M 65 80 L 135 80 L 130 120 L 100 130 L 70 120 Z" fill={getFatigueColor(['Peito'])} stroke="#18181b" strokeWidth="2"/>
                              <path d="M 75 125 L 125 125 L 120 180 L 80 180 Z" fill={getFatigueColor(['GAP'])} stroke="#18181b" strokeWidth="2"/>
                              <rect x="40" y="85" width="20" height="60" rx="10" fill={getFatigueColor(['Bíceps'])} stroke="#18181b" strokeWidth="2" transform="rotate(15 50 85)" />
                              <rect x="140" y="85" width="20" height="60" rx="10" fill={getFatigueColor(['Bíceps'])} stroke="#18181b" strokeWidth="2" transform="rotate(-15 150 85)" />
                              
                              <rect x="25" y="150" width="16" height="50" rx="8" fill={getFatigueColor(['Braços'])} stroke="#18181b" strokeWidth="2" transform="rotate(10 33 150)" />
                              <rect x="159" y="150" width="16" height="50" rx="8" fill={getFatigueColor(['Braços'])} stroke="#18181b" strokeWidth="2" transform="rotate(-10 167 150)" />
                              <rect x="70" y="185" width="28" height="90" rx="10" fill={getFatigueColor(['Pernas', 'GAP'])} stroke="#18181b" strokeWidth="2" />
                              <rect x="102" y="185" width="28" height="90" rx="10" fill={getFatigueColor(['Pernas', 'GAP'])} stroke="#18181b" strokeWidth="2" />
                              <rect x="74" y="280" width="20" height="80" rx="8" fill="#3f3f46" stroke="#18181b" strokeWidth="2" />
                              <rect x="106" y="280" width="20" height="80" rx="8" fill="#3f3f46" stroke="#18181b" strokeWidth="2" />
                            </>
                          )}
                       </svg>
                     </div>
                     <div className="flex justify-center gap-3 mt-4 text-[10px] font-bold text-zinc-400 uppercase">
                       <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> &lt; 24h</span>
                       <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div> 48-72h</span>
                       <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Livre</span>
                     </div>
                   </div>

                   {/* Progresso Diário */}
                   <div className="space-y-4">
                     <div className="bg-blue-950/20 border border-blue-900/30 p-6 rounded-3xl relative overflow-hidden flex items-center justify-between">
                       <div className="z-10">
                         <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">Hidratação</h3>
                         <p className="text-3xl font-black text-white">{todayLog.water} <span className="text-sm font-medium text-blue-200">/ {waterTarget}ml</span></p>
                         <button onClick={addWater} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"><Plus size={14}/> Copo (250ml)</button>
                       </div>
                       <div className="w-16 h-24 border-4 border-blue-500/50 rounded-b-2xl rounded-t-lg relative z-10 bg-zinc-950 overflow-hidden">
                         <div className="absolute bottom-0 w-full bg-blue-500 transition-all duration-700" style={{height: `${Math.min(100, (todayLog.water / waterTarget) * 100)}%`}}></div>
                       </div>
                     </div>

                     <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Metas Diárias</h3>
                        <div className="space-y-4">
                          <MacroBar label="Calorias" current={totals.calories} target={aiGoals.calories} color="bg-orange-500" />
                          <MacroBar label="Proteína" current={totals.protein} target={aiGoals.protein} color="bg-emerald-500" />
                          <MacroBar label="Carbos" current={totals.carbs} target={aiGoals.carbs} color="bg-blue-500" />
                          <MacroBar label="Gordura" current={totals.fats} target={aiGoals.fats} color="bg-yellow-500" />
                        </div>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {/* Calendário */}
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><CalendarDays size={18}/> Consistência</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 justify-between">
                      {getCalendarDays().map((d, i) => (
                        <div key={i} className={`flex flex-col items-center p-3 rounded-2xl min-w-14 border ${d.hasWorkout ? 'bg-emerald-500/10 border-emerald-500/30' : (d.isFuture || d.isBeforeSignup) ? 'bg-zinc-950/30 border-zinc-900 opacity-40' : 'bg-zinc-950 border-zinc-800'}`}>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">{d.dayStr}</span>
                          <span className="text-lg font-bold text-white mb-2">{d.dateNum}</span>
                          {d.hasWorkout ? <Smile size={20} className="text-emerald-500"/> : (d.isFuture || d.isBeforeSignup) ? <div className="w-5 h-5 rounded-full border border-zinc-800 bg-zinc-900/50"></div> : <Frown size={20} className="text-zinc-600"/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-center items-center text-center">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Aulas GAP</p>
                      <p className="text-4xl font-black text-purple-400">{workoutHistory.filter(h => h.isGap).reduce((a,b)=>a+b.gapDuration, 0)} <span className="text-base text-zinc-500">min</span></p>
                    </div>
                    
                    <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Curva de Peso</p>
                      {weightHistory.length > 1 ? (
                        <svg viewBox="0 0 100 50" className="w-full h-16 overflow-visible">
                          <polyline 
                            fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            points={weightHistory.slice(-5).map((w, i, arr) => {
                              const x = (i / (arr.length - 1)) * 100;
                              const minW = Math.min(...arr.map(a=>a.weight));
                              const maxW = Math.max(...arr.map(a=>a.weight));
                              const y = maxW === minW ? 25 : 50 - (((w.weight - minW) / (maxW - minW)) * 40);
                              return `${x},${y}`;
                            }).join(' ')}
                          />
                        </svg>
                      ) : (
                        <div className="h-16 flex items-center justify-center text-xs text-zinc-600">Dados insuficientes</div>
                      )}
                    </div>
                  </div>

                  {/* Grid Gamificação & Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                     <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 h-full">
                       <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Trophy size={18} className="text-emerald-500"/> Minhas Conquistas</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                         {ACHIEVEMENTS.map(ach => {
                           const isUnlocked = unlockedAchievements.some(u => u.id === ach.id);
                           return (
                             <div key={ach.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all relative ${isUnlocked ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-950/30 border-zinc-900 opacity-50 grayscale'}`}>
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-zinc-900 shadow-inner shadow-black/50' : 'bg-zinc-900'}`}>
                                 {ach.icon}
                               </div>
                               <div>
                                 <p className={`font-extrabold text-sm leading-tight ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>{ach.title}</p>
                                 <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-wider">{ach.desc}</p>
                               </div>
                               {isUnlocked && <CheckCircle size={14} className="text-emerald-500/30 absolute top-3 right-3" />}
                             </div>
                           )
                         })}
                       </div>
                     </div>

                     <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 h-full">
                       <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquareQuote size={18} className="text-emerald-500"/> Análise Global</h3>
                       <p className="text-xs text-zinc-400 mb-4">IA cruza treino e dieta para um parecer técnico.</p>
                       <button onClick={handleGenerateDeepInsight} disabled={isDeepInsightLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                         {isDeepInsightLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Analisar Evolução
                       </button>
                       {deepInsightText && (
                         <div className="mt-4 text-emerald-100/90 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">
                           {deepInsightText}
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TELA: TREINO */}
          {activeTab === 'treino' && (
             <div className="space-y-6 animate-fadeIn">
               <header className="flex flex-col gap-4 mb-2">
                 <div className="flex justify-between items-center">
                   <h1 className="text-3xl font-extrabold">Workouts</h1>
                   <button onClick={generateAIPlan} className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Restaurar treino padrão"><RefreshCw size={18}/></button>
                 </div>
               </header>

               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-1 px-1 -mx-1">
                 {workoutOrder.map((d, index) => {
                   const isLocked = completedWorkoutsThisWeek.includes(d);
                   const isActive = activeWorkoutDay === d;
                   return (
                     <div key={d} className={`flex items-center shrink-0 transition-all duration-300 ${isActive ? 'bg-zinc-900 border border-zinc-700 rounded-2xl p-1 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.1)]' : ''}`}>
                       {isActive && index > 0 && (
                         <button onClick={() => moveWorkoutDay(index, -1)} className="p-2 text-zinc-500 hover:text-emerald-400"><ChevronLeft size={18}/></button>
                       )}
                       <button 
                         onClick={()=>{ if(!isLocked) { setActiveWorkoutDay(d); setIsGapMode(false); setWorkoutFeedback(''); } }} 
                         disabled={isLocked}
                         className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${isLocked ? 'bg-zinc-950 text-zinc-600 border border-zinc-800/50 opacity-50' : isActive ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}
                       >
                         {isActive && <GripHorizontal size={14} className="opacity-40" />}
                         {d} {isLocked && <Lock size={14} />}
                       </button>
                       {isActive && index < workoutOrder.length - 1 && (
                         <button onClick={() => moveWorkoutDay(index, 1)} className="p-2 text-zinc-500 hover:text-emerald-400"><ChevronRight size={18}/></button>
                       )}
                     </div>
                   );
                 })}
               </div>

               {completedWorkoutsThisWeek.includes(activeWorkoutDay) ? (
                 <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center animate-fadeIn mt-8">
                   <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                   <h3 className="text-2xl font-extrabold mb-2">Treino Concluído!</h3>
                   <p className="text-zinc-400 text-sm">Este treino já foi realizado esta semana.</p>
                 </div>
               ) : (
                 <>
                   {workouts[activeWorkoutDay]?.isLegs && (
                     <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-2xl flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Activity size={20}/></div>
                         <div><p className="font-bold text-white text-sm">Aula de GAP?</p></div>
                       </div>
                       <button onClick={()=>{setIsGapMode(!isGapMode); if(!isGapMode) setIsCaliMode(false);}} className={`w-12 h-6 rounded-full relative transition-colors ${isGapMode?'bg-purple-500':'bg-zinc-800'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isGapMode?'left-7':'left-1'}`}></div>
                       </button>
                     </div>
                   )}

                   <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                       <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Flame size={20}/></div>
                       <div><p className="font-bold text-white text-sm">Treino de Calistenia?</p></div>
                     </div>
                     <button onClick={()=>{
                         const newMode = !isCaliMode; setIsCaliMode(newMode);
                         if(newMode) {
                            setIsGapMode(false);
                            const plan = CALISTHENICS_PLANS[selectedCaliPlan].map(b => formatEx(getEx(b.id), 3, b.reps));
                            setCurrentCaliExercises(plan);
                         }
                     }} className={`w-12 h-6 rounded-full relative transition-colors ${isCaliMode?'bg-emerald-500':'bg-zinc-800'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isCaliMode?'left-7':'left-1'}`}></div>
                     </button>
                   </div>

                   {isCaliMode && (
                      <div className="mb-4 animate-fadeIn">
                         <select 
                            value={selectedCaliPlan}
                            onChange={(e) => {
                               setSelectedCaliPlan(e.target.value);
                               const plan = CALISTHENICS_PLANS[e.target.value].map(b => formatEx(getEx(b.id), 3, b.reps));
                               setCurrentCaliExercises(plan);
                            }}
                            className="w-full bg-zinc-950 p-4 rounded-2xl outline-none border border-zinc-800 text-white font-bold"
                         >
                            {Object.keys(CALISTHENICS_PLANS).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                   )}

                   {!isGapMode && !isCaliMode && (
                     <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 mb-4">
                        <h2 className="font-bold text-lg text-white">{workouts[activeWorkoutDay]?.name}</h2>
                        <button onClick={handleGenerateAIWorkout} disabled={isGeneratingWorkout} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 px-3 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600/30 border border-emerald-500/30">
                          {isGeneratingWorkout ? <Loader2 size={16} className="animate-spin"/> : <Cpu size={16} />} IA
                        </button>
                     </div>
                   )}

                   {!isGapMode && (
                     <div className="bg-zinc-900 p-5 rounded-3xl flex items-center gap-4 border border-zinc-800 shadow-sm mb-4">
                       <div className={`p-3 rounded-2xl transition-colors ${isTimerRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-950 text-zinc-500'}`}><Timer size={24} /></div>
                       <div className="font-mono text-3xl font-black w-24 text-center tracking-tighter">{formatTime(timeLeft)}</div>
                       <input type="range" min="30" max="180" step="15" value={timerInterval} onChange={e=>{setTimerInterval(e.target.value); setTimeLeft(e.target.value);}} className="flex-1 accent-emerald-500 h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer" />
                       <button onClick={()=>setIsTimerRunning(!isTimerRunning)} className="p-3 bg-zinc-950 text-white rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-colors shadow-sm">{isTimerRunning ? <Pause size={20}/> : <Play size={20} className="ml-0.5"/>}</button>
                     </div>
                   )}

                   {isGapMode ? (
                     <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center animate-fadeIn">
                        <Flame size={48} className="text-purple-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-extrabold mb-2">Aula GAP</h3>
                        <div className="flex justify-center items-center gap-4 mb-6 mt-4">
                          <button onClick={()=>setGapDuration(Math.max(15, gapDuration-15))} className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl font-bold">-</button>
                          <span className="text-5xl font-black text-purple-400 w-24">{gapDuration}</span>
                          <button onClick={()=>setGapDuration(gapDuration+15)} className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl font-bold">+</button>
                        </div>
                        <p className="text-zinc-500 font-bold uppercase mb-8">Minutos</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {(() => {
                         let lastGroup = null;
                         const exercisesToRender = isCaliMode ? currentCaliExercises : (workouts[activeWorkoutDay]?.exercises || []);
                         return exercisesToRender.map((ex, index) => {
                           const showHeader = ex.group !== lastGroup;
                           lastGroup = ex.group;
                           return (
                             <React.Fragment key={ex.id || index}>
                               {showHeader && (
                                 <div className="mt-8 mb-4 flex items-center gap-3 animate-fadeIn">
                                   <div className="h-px flex-1 bg-zinc-800"></div>
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 rounded-lg">{ex.group}</span>
                                   <div className="h-px flex-1 bg-zinc-800"></div>
                                 </div>
                               )}
                               <div className={`bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden ${ex.isCompleted?'border-emerald-900/50 bg-emerald-950/10 opacity-70':'border-zinc-800'}`}>
                                 <div className="p-5 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900">
                                   <div className="flex items-center gap-4">
                                     <button onClick={()=>{
                                       if(isCaliMode) {
                                         setCurrentCaliExercises(prev => prev.map(x => {
                                           if(x.id === ex.id) {
                                             const isComp = !x.isCompleted;
                                             if(isComp) { setTimeLeft(timerInterval); setIsTimerRunning(true); }
                                             return { ...x, isCompleted: isComp };
                                           }
                                           return x;
                                         }));
                                       } else {
                                         const upd = {...workouts};
                                         upd[activeWorkoutDay] = {
                                           ...upd[activeWorkoutDay],
                                           exercises: upd[activeWorkoutDay].exercises.map(x => {
                                             if(x.id === ex.id) {
                                               const isComp = !x.isCompleted;
                                               if(isComp) { setTimeLeft(timerInterval); setIsTimerRunning(true); }
                                               return { ...x, isCompleted: isComp };
                                             }
                                             return x;
                                           })
                                         };
                                         setWorkouts(upd);
                                       }
                                     }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${ex.isCompleted?'bg-emerald-500 text-zinc-950 scale-95':'bg-zinc-950 text-zinc-600 border border-zinc-800'}`}><Check size={24} strokeWidth={3}/></button>
                                     <div>
                                       <span className="font-extrabold text-lg block leading-tight">{ex.name}</span>
                                       <span className="text-xs text-zinc-500 font-medium">{ex.target}</span>
                                     </div>
                                   </div>
                                   <div className="flex gap-2">
                                     <button onClick={()=>{
                                        if(isCaliMode) setCurrentCaliExercises(prev => prev.filter(x => x.id !== ex.id));
                                        else handleRemoveExercise(ex.id);
                                     }} className="text-red-400 p-3 bg-red-500/10 rounded-xl"><Trash size={18}/></button>
                                     <button onClick={()=>setExerciseModal({ active: true, mode: 'swap', targetExId: ex.id, filterGroup: getEx(ex.originalId)?.group || 'Geral' })} className="text-zinc-500 p-3 bg-zinc-950 rounded-xl"><ArrowLeftRight size={18}/></button>
                                     <button onClick={()=>handleGetAnatomyTip(ex.id, ex.name, ex.originalId)} className="text-emerald-500 p-3 bg-emerald-500/10 rounded-xl"><Sparkles size={18}/></button>
                                   </div>
                                 </div>
                                 
                                 <div className="p-5 grid grid-cols-3 gap-4 bg-zinc-950/50">
                                    <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Séries</label><input type="number" value={ex.sets} onChange={(e) => {
                                       if(isCaliMode) setCurrentCaliExercises(prev => prev.map(x => x.id === ex.id ? { ...x, sets: e.target.value } : x));
                                       else handleExerciseChange(ex.id, 'sets', e.target.value);
                                    }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500" /></div>
                                    <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Reps</label><input type="text" value={ex.reps} onChange={(e) => {
                                       if(isCaliMode) setCurrentCaliExercises(prev => prev.map(x => x.id === ex.id ? { ...x, reps: e.target.value } : x));
                                       else handleExerciseChange(ex.id, 'reps', e.target.value);
                                    }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500" /></div>
                                    <div><label className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider block mb-2 text-center">Carga (kg)</label><input type="number" value={ex.weight} onChange={(e) => {
                                       if(isCaliMode) setCurrentCaliExercises(prev => prev.map(x => x.id === ex.id ? { ...x, weight: e.target.value } : x));
                                       else handleExerciseChange(ex.id, 'weight', e.target.value);
                                    }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center text-emerald-400 font-black border border-emerald-900/30" placeholder="+0" /></div>
                                 </div>

                                 {/* Dicas IA */}
                                 {expandedDesc[ex.id] && (
                                   <div className="p-5 text-sm text-zinc-300 bg-zinc-950 border-t border-zinc-800/50">
                                     {anatomyTipState[ex.id] === 'loading' ? (
                                        <div className="flex items-center gap-3 text-emerald-500 font-medium py-8 justify-center"><Loader2 size={24} className="animate-spin"/> Construindo Guia...</div>
                                     ) : anatomyTips[ex.id] ? (
                                       <div className="animate-fadeIn space-y-5">
                                         
                                         <div className="mb-4 bg-zinc-950 rounded-2xl flex flex-col justify-center items-center overflow-hidden p-4">
                                           {gifUrls[ex.originalId] ? (
                                             <img src={gifUrls[ex.originalId]} alt={ex.name} className="max-w-full max-h-64 object-contain rounded-xl" />
                                           ) : (
                                             <p className="text-xs text-zinc-500 italic">GIF não cadastrado para este exercício na nuvem.</p>
                                           )}
                                         </div>

                                         <p className="text-zinc-400 leading-relaxed italic">{anatomyTips[ex.id].intro}</p>
                                         <div>
                                           <h5 className="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-widest">Execução</h5>
                                           <ul className="space-y-3 mt-3">
                                             {anatomyTips[ex.id].executionSteps?.map((step, i) => (
                                                <li key={i} className="text-zinc-300 flex gap-3 items-start leading-snug"><CheckCircle size={18} className="text-emerald-500/50 shrink-0"/> <span>{step}</span></li>
                                             ))}
                                           </ul>
                                         </div>
                                         <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 flex items-start gap-3 mt-6">
                                           <Sparkles size={24} className="text-emerald-400 shrink-0 mt-0.5" />
                                           <div><p className="font-bold text-emerald-400 text-xs uppercase mb-1">Dica de Ouro</p><p className="font-medium text-emerald-100/90 text-sm">"{anatomyTips[ex.id].geminiTip}"</p></div>
                                         </div>
                                       </div>
                                     ) : ( <div className="text-center text-red-400 py-4">Erro ao carregar o guia.</div> )}
                                   </div>
                                 )}
                               </div>
                             </React.Fragment>
                           );
                         });
                       })()}

                       <button onClick={() => setExerciseModal({ active: true, mode: 'add', targetExId: null, filterGroup: null })} className="w-full py-5 bg-zinc-900/50 border-2 border-dashed border-zinc-800 text-zinc-400 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all mt-4">
                         <Plus size={20}/> Adicionar Exercício Manual
                       </button>
                       
                       <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl mt-4">
                         <button onClick={handleEvaluateWorkout} disabled={isWorkoutFeedbackLoading} className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                           {isWorkoutFeedbackLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Avaliar Ficha Atual
                         </button>
                         {workoutFeedback && <div className="mt-4 text-emerald-100/90 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium">{workoutFeedback}</div>}
                       </div>
                     </div>
                   )}

                   <button onClick={handleCompleteWorkout} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg mt-8 shadow-xl shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2">
                     <Save size={24}/> {isGapMode ? "Salvar Aula GAP" : "Concluir Treino"}
                   </button>
                 </>
               )}
             </div>
          )}

          {/* TELA: NUTRIÇÃO */}
          {activeTab === 'nutricao' && (
             <div className="space-y-6 animate-fadeIn pb-12">
               <h1 className="text-3xl font-extrabold">Nutrição</h1>
               <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Sparkles className="text-emerald-400" size={18}/> Registar (IA)</h3>
                 <div className="flex flex-col md:flex-row gap-3 mb-6">
                   <select value={selectedMealId} onChange={e=>setSelectedMealId(e.target.value)} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-white font-bold flex-1">
                     {INITIAL_MEALS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                   <div className="flex gap-2 flex-2">
                     <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ex: 2 ovos e pão..." className="bg-zinc-950 p-4 rounded-2xl flex-1 border border-zinc-800 text-white" />
                     <button onClick={handleAnalyzeFood} disabled={isAnalyzing || !chatInput} className="bg-emerald-600 text-white p-4 rounded-2xl"><Send size={24}/></button>
                   </div>
                 </div>
               </div>

               <h3 className="text-xl font-bold mt-8 mb-4">Metas de Hoje</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm"><p className="text-xs text-orange-500 font-bold uppercase mb-1">Kcal</p><p className="font-black text-2xl mb-1">{totals.calories}</p><p className="text-[10px] text-zinc-500">META: {aiGoals.calories}</p></div>
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm"><p className="text-xs text-emerald-500 font-bold uppercase mb-1">Prot</p><p className="font-black text-2xl mb-1">{totals.protein}g</p><p className="text-[10px] text-zinc-500">META: {aiGoals.protein}g</p></div>
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm"><p className="text-xs text-blue-500 font-bold uppercase mb-1">Carb</p><p className="font-black text-2xl mb-1">{totals.carbs}g</p><p className="text-[10px] text-zinc-500">META: {aiGoals.carbs}g</p></div>
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm"><p className="text-xs text-yellow-500 font-bold uppercase mb-1">Gord</p><p className="font-black text-2xl mb-1">{totals.fats}g</p><p className="text-[10px] text-zinc-500">META: {aiGoals.fats}g</p></div>
               </div>

               <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl mt-4">
                 <button onClick={handleEvaluateNutrition} disabled={isNutritionFeedbackLoading} className="w-full bg-emerald-600/20 text-emerald-400 py-3 rounded-xl font-bold flex justify-center gap-2"><Sparkles size={18} /> Avaliar Ingestão Diária</button>
                 {nutritionFeedback && <div className="mt-4 text-emerald-100/90 text-sm italic">{nutritionFeedback}</div>}
               </div>

               <div className="mt-8 space-y-4">
                 <h3 className="text-xl font-bold flex items-center gap-2"><Utensils size={20} className="text-emerald-500"/> Diário de Refeições</h3>
                 {todayNutrition.length === 0 ? ( <p className="text-sm text-zinc-500 italic text-center p-6 bg-zinc-900/30 rounded-2xl">Nenhuma refeição registrada hoje.</p> ) : (
                    todayNutrition.map(log => (
                       <div key={log.id} className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800">
                           <div className="flex justify-between items-start gap-4">
                             <div className="flex-1">
                               <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md uppercase">{INITIAL_MEALS.find(m=>m.id===log.mealId)?.name}</span>
                               <p className="font-extrabold text-white mt-3 text-base">{log.text}</p>
                               <p className="text-[11px] text-zinc-400 mt-2 font-bold tracking-widest bg-zinc-950 inline-block px-3 py-1.5 rounded-lg border border-zinc-800/50">🔥 {log.calories} kcal • 🥩 {log.protein}g • 🍚 {log.carbs}g • 🥑 {log.fats}g</p>
                             </div>
                             <button onClick={() => {
                                 const upd = nutritionLogs.filter(n => n.id !== log.id);
                                 setNutritionLogs(upd); saveToCloud({ nutritionLogs: upd });
                               }} className="text-zinc-500 hover:text-red-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800/50"><Trash size={16}/></button>
                           </div>
                       </div>
                    ))
                 )}
               </div>
             </div>
          )}

          {/* TELA: BIOMETRIA */}
          {activeTab === 'biometria' && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <header className="flex justify-between items-end mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Biometria AI</h1>
                  <p className="text-zinc-400 font-medium">Análise Corporal via Câmera</p>
                </div>
              </header>

              <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
                <button onClick={()=>setBioTab('capture')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${bioTab==='capture'?'bg-zinc-800 text-white':'text-zinc-500'}`}><Camera size={16}/> Captura</button>
                <button onClick={()=>setBioTab('evolution')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${bioTab==='evolution'?'bg-zinc-800 text-white':'text-zinc-500'}`}><View size={16}/> Evolução 3D</button>
              </div>

              {bioTab === 'capture' && (
                <div className="space-y-6">
                  {scanState === 'idle' && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                       <div className="text-center mb-6">
                          <Focus size={40} className="text-emerald-500 mx-auto mb-3" />
                          <h2 className="text-lg font-bold text-white mb-1">Check-up Fotográfico</h2>
                          <p className="text-zinc-400 text-sm">Carregue ou tire as fotos para análise.</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mb-6">
                          {['frente', 'direita', 'esquerda', 'costas'].map((view) => (
                             <label key={view} className={`relative h-32 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed cursor-pointer overflow-hidden ${uploadedPhotos[view] ? 'border-emerald-500/50 bg-zinc-900 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                               <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(view, e)} />
                               {uploadedPhotos[view] && <img src={uploadedPhotos[view]} alt={view} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                               {uploadedPhotos[view] ? <CheckCircle size={32} className="relative z-10" /> : <Upload size={28} className="relative z-10" />}
                               <span className="text-xs font-bold uppercase mt-2 relative z-10">{view}</span>
                             </label>
                          ))}
                       </div>
                       <button onClick={startBiometricScan} disabled={!allPhotosUploaded} className="w-full bg-emerald-600 disabled:bg-zinc-800 text-white py-4 rounded-xl font-bold flex justify-center gap-2"><Scan size={20} /> Processar</button>
                    </div>
                  )}

                  {scanState === 'scanning' && (
                    <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-3xl overflow-hidden relative">
                       <div className="h-96 bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite] z-20"></div>
                          <Focus size={100} className="text-emerald-500 opacity-20 animate-pulse"/>
                          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg border border-zinc-800 text-xs font-bold text-emerald-400">Live AI</div>
                       </div>
                       <div className="p-6 bg-zinc-900 border-t border-emerald-900/30">
                         <div className="mb-4">
                           <div className="flex justify-between text-xs font-bold mb-1.5"><span className="text-zinc-400">Progresso</span><span className="text-emerald-400">{scanProgress}%</span></div>
                           <div className="h-1.5 bg-zinc-950 rounded-full border border-zinc-800"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{width: `${scanProgress}%`}}></div></div>
                         </div>
                         <div className="space-y-2 h-24 overflow-y-auto">
                           {scanFeedback.map((fb, i) => <div key={i} className="flex gap-2 text-xs font-medium text-zinc-300"><Check size={14} className="text-emerald-500" /> {fb}</div>)}
                         </div>
                       </div>
                    </div>
                  )}

                  {scanState === 'done' && estimatedMeasures && (
                    <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-3xl overflow-hidden">
                       <div className="bg-emerald-950/30 p-6 border-b border-emerald-900/30 text-center">
                          <Fingerprint size={48} className="text-emerald-500 mx-auto mb-4" />
                          <h2 className="text-xl font-extrabold text-white mb-1">Mapeamento Concluído</h2>
                       </div>
                       <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center"><p className="text-[10px] text-zinc-500 uppercase mb-1">Peito</p><p className="text-xl font-black text-emerald-400">{estimatedMeasures.peito} cm</p></div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center"><p className="text-[10px] text-zinc-500 uppercase mb-1">Cintura</p><p className="text-xl font-black text-emerald-400">{estimatedMeasures.cintura} cm</p></div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center"><p className="text-[10px] text-zinc-500 uppercase mb-1">Quadril</p><p className="text-xl font-black text-emerald-400">{estimatedMeasures.quadril} cm</p></div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center"><p className="text-[10px] text-zinc-500 uppercase mb-1">Braços</p><p className="text-xl font-black text-emerald-400">{estimatedMeasures.bracos} cm</p></div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center"><p className="text-[10px] text-zinc-500 uppercase mb-1">Pernas</p><p className="text-xl font-black text-emerald-400">{estimatedMeasures.pernas} cm</p></div>
                       </div>
                       <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                         <button onClick={handleGenerateBiometricReport} disabled={isScanningAi} className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 py-3 rounded-xl font-bold flex justify-center gap-2">
                           {isScanningAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Avaliação Detalhada (IA)
                         </button>
                         {scanAiReport && <div className="mt-4 text-emerald-100/90 text-sm italic">{scanAiReport}</div>}
                       </div>
                       <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex flex-col md:flex-row gap-3">
                         <button onClick={() => {setScanState('idle'); setUploadedPhotos({ frente: null, direita: null, esquerda: null, costas: null }); setScanAiReport('');}} className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold">Refazer</button>
                         <button onClick={saveBiometricMeasures} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold flex justify-center gap-2"><Save size={18} /> Salvar & Ver Evolução</button>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {bioTab === 'evolution' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><UserCircle size={20} className="text-emerald-500"/> Avatares Paramétricos 3D</h3>
                    
                    <div className="flex items-center gap-4 mb-6 relative overflow-x-auto pb-6 pt-4 px-4 custom-scrollbar">
                       <div className="absolute top-1/2 left-10 right-10 h-px bg-zinc-800 border-t border-dashed border-zinc-700 z-0"></div>

                       {/* Atual */}
                       <ParametricAvatar label="Atual" measures={estimatedMeasures || measurements} isCurrent={true} />

                       {/* Histórico */}
                       {biometricHistory.map((log, index) => (
                         <React.Fragment key={log.id}>
                           <ArrowRight size={20} className="text-zinc-600 relative z-10 bg-zinc-900 rounded-full shrink-0" />
                           <ParametricAvatar label={`Em ${log.date.substring(0,5)}`} measures={log.measures} isCurrent={false} />
                         </React.Fragment>
                       ))}
                    </div>
                  </div>

                  {/* FEED DE RESULTADOS BIOMÉTRICOS */}
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Activity size={18} className="text-emerald-500"/> Histórico de Análises IA
                    </h3>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                      {biometricHistory.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic text-center py-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50">Nenhuma avaliação registada ainda. Faça uma captura fotográfica.</p>
                      ) : (
                        biometricHistory.map(log => (
                          <div key={log.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 hover:border-emerald-900/50 transition-colors">
                            <div className="flex justify-between border-b border-zinc-800/50 pb-3 mb-3">
                              <span className="font-bold text-emerald-400">{log.date}</span>
                              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Peito: {log.measures?.peito || '--'} | Cintura: {log.measures?.cintura || '--'}</span>
                            </div>
                            <p className="text-sm text-zinc-300 italic leading-relaxed whitespace-pre-line">{log.report}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TELA: PERFIL */}
          {activeTab === 'perfil' && (
             <div className="space-y-6 animate-fadeIn pb-10">
                <h1 className="text-3xl font-extrabold text-white">Perfil</h1>
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20"><UserCircle size={56} className="text-emerald-500" /></div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-black">{userProfile.name}</h2>
                    <p className="text-zinc-400 font-medium mb-4">{user?.email || "Modo Local"}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                       <span className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-300">{userProfile.age} Anos</span>
                       <span className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-300">{userProfile.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                       <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-bold">Objetivo: {userProfile.goal}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18}/> Integração IA (Gemini)</h3>
                  {!isApiKeyUnlocked ? (
                    <div className="space-y-4">
                      <label className="text-xs text-zinc-500 font-bold uppercase flex gap-2"><Key size={14}/> Chave API</label>
                      <div className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-500 text-center tracking-widest">{userProfile.geminiApiKey ? '••••••••••••••••••••••••••••••••' : 'Nenhuma chave configurada'}</div>
                      {!showUnlockPrompt ? (
                        <button onClick={() => setShowUnlockPrompt(true)} className="w-full bg-zinc-800 text-white py-3 rounded-xl font-bold">Desbloquear para Editar (Use "admin123")</button>
                      ) : (
                        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 animate-fadeIn mt-4">
                           <p className="text-xs text-zinc-400 mb-3 font-bold">Confirme a senha:</p>
                           <div className="flex flex-col sm:flex-row gap-2">
                             <input type="password" value={apiPasswordAttempt} onChange={e => setApiPasswordAttempt(e.target.value)} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex-1 outline-none focus:border-emerald-500 text-white"/>
                             <button onClick={handleUnlockApiKey} disabled={isApiAuthPending || !apiPasswordAttempt} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center">{isApiAuthPending ? <Loader2 size={18} className="animate-spin" /> : "Validar"}</button>
                           </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fadeIn">
                      <label className="text-xs text-zinc-500 font-bold uppercase flex gap-2"><Key size={14}/> Configurar Chave</label>
                      <div className="relative">
                        <input type={showApiKey ? "text" : "password"} value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} className="w-full bg-zinc-950 p-4 pr-12 rounded-2xl outline-none font-medium text-emerald-400 border border-emerald-900/50" />
                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300">{showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                      </div>
                      <button onClick={handleSaveApiKey} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex justify-center gap-2"><Save size={18}/> Salvar e Bloquear</button>
                    </div>
                  )}
                </div>

                <button onClick={handleLogout} className="w-full py-5 bg-zinc-900 text-zinc-400 hover:text-white rounded-3xl font-bold border border-zinc-800 flex justify-center gap-2">
                  <LogOut size={20} /> Terminar Sessão
                </button>
             </div>
          )}

          {/* TELA: ADMIN PANEL (Acesso Exclusivo) */}
          {activeTab === 'admin' && isAdmin && (
             <div className="space-y-6 animate-fadeIn pb-10">
                <header className="bg-gradient-to-r from-zinc-900 to-yellow-950/20 p-8 rounded-3xl border border-yellow-900/30 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3"><Shield className="text-yellow-500" size={32}/> Painel Admin</h1>
                    <p className="text-zinc-400 mt-2 font-medium">Gestão global do Banco de Exercícios no Firestore.</p>
                  </div>
                  <button onClick={handleMigrateExercises} className="bg-yellow-600/20 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                     <Database size={16}/> Sincronizar Base Local p/ Nuvem
                  </button>
                </header>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Exercícios na Nuvem ({exerciseDB.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exerciseDB.map(ex => (
                      <div key={ex.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                        <h4 className="font-extrabold text-emerald-400 text-lg mb-1">{ex.name}</h4>
                        <div className="flex gap-2 mb-4">
                          <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-1 rounded font-bold">{ex.group}</span>
                          <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-1 rounded font-bold">{ex.target}</span>
                        </div>
                        <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">URL do GIF</label>
                        <input 
                          type="text" 
                          placeholder="Cole a URL do GIF..."
                          defaultValue={ex.gifUrl || ''}
                          onBlur={(e) => {
                             if(e.target.value !== ex.gifUrl) handleAdminUpdateGif(ex.id, e.target.value);
                          }}
                          className="w-full bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-sm text-white focus:border-yellow-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          )}

          {/* MODAL EXERCÍCIO */}
          {exerciseModal.active && (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-zinc-900 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 shadow-2xl h-[85vh] md:max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="font-extrabold text-xl text-white">{exerciseModal.mode === 'swap' ? 'Substituir' : 'Adicionar'}</h3>
                  <button onClick={()=>setExerciseModal({active:false, mode:'swap', targetExId:null, filterGroup:null})} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                  {(() => {
                    const swapList = exerciseModal.mode === 'swap' ? exerciseDB.filter(e => e.group === exerciseModal.filterGroup) : exerciseDB;
                    const finalSwapList = swapList.length > 0 ? swapList : exerciseDB;
                    
                    return finalSwapList.map(ex => (
                      <button key={ex.id} onClick={() => {
                        const newEx = formatEx(ex, 3, 10);
                        if (isCaliMode) {
                           setCurrentCaliExercises(prev => {
                              const exercises = [...prev];
                              if (exerciseModal.mode === 'swap') {
                                const i = exercises.findIndex(e=>e.id===exerciseModal.targetExId);
                                if (i > -1) exercises[i] = newEx;
                              } else { exercises.push(newEx); }
                              return exercises;
                           });
                        } else {
                           const upd = {...workouts};
                           const exercises = [...(upd[activeWorkoutDay].exercises || [])];
                           if (exerciseModal.mode === 'swap') {
                             const i = exercises.findIndex(e=>e.id===exerciseModal.targetExId);
                             if (i > -1) exercises[i] = newEx;
                           } else { exercises.push(newEx); }
                           upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises };
                           setWorkouts(upd); saveToCloud({ workouts: upd }); 
                        }
                        setExerciseModal({active:false, mode:'swap', targetExId:null, filterGroup:null});
                      }} className="w-full text-left bg-zinc-950 p-5 rounded-2xl hover:border-emerald-500 border border-zinc-800 flex justify-between items-center group">
                        <div>
                          <p className="font-extrabold text-white group-hover:text-emerald-400 text-lg">{ex.name}</p>
                          <p className="text-xs text-zinc-500 font-medium mt-1">{ex.target} • {ex.group}</p>
                        </div>
                        {exerciseModal.mode === 'swap' ? <RefreshCw size={20} className="text-zinc-600 group-hover:text-emerald-500"/> : <Plus size={20} className="text-zinc-600 group-hover:text-emerald-500"/>}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* MODAL TREINO CONCLUÍDO */}
          {showWorkoutSuccess && (
            <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Flame size={40} className="text-emerald-500" /></div>
                <h2 className="text-3xl font-black text-white mb-2">Parabéns! 🎉</h2>
                <p className="text-zinc-400 mb-8 text-sm">Treino registrado com sucesso.</p>
                <button onClick={() => { setShowWorkoutSuccess(false); setActiveTab('dashboard'); setDashTab('weekly'); }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold">Ver Conquistas</button>
              </div>
            </div>
          )}

        </div>
      </main>
      
      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 flex justify-around p-2 z-50 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <MobileNavButton a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={24}/>} l="Painel" />
        <MobileNavButton a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={24}/>} l="Treino" />
        <MobileNavButton a={activeTab==='nutricao'} o={()=>setActiveTab('nutricao')} i={<Utensils size={24}/>} l="Nutrição" />
        <MobileNavButton a={activeTab==='biometria'} o={()=>setActiveTab('biometria')} i={<Scan size={24}/>} l="Check-up" />
        <MobileNavButton a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={24}/>} l="Perfil" />
      </nav>
    </div>
  );
}

function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 md:bottom-10 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-xl shadow-2xl border animate-fadeIn flex items-center gap-3 text-sm font-bold min-w-64 max-w-sm ${t.type === 'error' ? 'bg-red-950/90 border-red-900 text-red-100' : t.type === 'success' ? 'bg-emerald-950/90 border-emerald-900 text-emerald-100' : 'bg-zinc-900/90 border-zinc-800 text-white'}`}>
          {t.type === 'error' ? <AlertCircle size={18} className="text-red-500 shrink-0" /> : t.type === 'success' ? <CheckCircle size={18} className="text-emerald-500 shrink-0" /> : <Info size={18} className="text-blue-500 shrink-0" />}
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  )
}

function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5"><span className="text-zinc-400 uppercase tracking-wider">{label}</span><span className="text-white">{current} / {target}</span></div>
      <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800"><div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{width: `${pct}%`}}></div></div>
    </div>
  )
}

function SidebarBtn({ a, o, i, l }) { 
  return (
    <button onClick={o} className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${a ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
      {i}<span className="text-base">{l}</span>
    </button>
  ); 
}

function MobileNavButton({ a, o, i, l }) { 
  return (
    <button onClick={o} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ${a ? 'text-emerald-400 scale-110 -translate-y-1' : 'text-zinc-500 hover:text-zinc-300'}`}>
      {i}<span className="text-[9px] mt-1.5 font-bold uppercase tracking-widest">{l}</span>
    </button>
  ); 
}