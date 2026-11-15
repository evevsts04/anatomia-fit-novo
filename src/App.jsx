import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Dumbbell, UserCircle, 
  Loader2, Sparkles, Check, Play, Pause, Timer, AlertCircle, 
  Smile, Frown, Lock, Flame, LogOut, Settings, 
  RefreshCw, X, Save, Plus, Ruler, 
  CalendarDays, Eye, EyeOff, Trash, Cpu, CheckCircle,
  Activity, Key, ChevronLeft, ChevronRight, Target, FlameKindling, Zap, Youtube, Square, Edit3, Settings2, Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyD25FBlMS6nnIyZRo3jhl85dIdnc8Cx63A",
  authDomain: "anatomiafit-96b5b.firebaseapp.com",
  projectId: "anatomiafit-96b5b",
  storageBucket: "anatomiafit-96b5b.firebasestorage.app",
  messagingSenderId: "786814321049",
  appId: "1:786814321049:web:3068c8bc6927d3b8b19308"
};

let app, auth, db, appId = 'hypertrophy-app';
try {
  const configToUse = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : firebaseConfig;
  app = initializeApp(configToUse);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : 'hypertrophy-app';
} catch (e) {
  console.error("Erro ao configurar Firebase:", e);
}

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

// --- DB EXERCÍCIOS: IMPORTADOS DIRETAMENTE DA PLANILHA ROTINA_CALISTENIA.xlsx ---
const EXERCISE_DB = [
  {
    "id": "c_flexao_militar",
    "name": "Flexão militar",
    "group": "Peito",
    "videoUrl": "https://youtube.com/shorts/57wPU6raKGY?si=8ULjVmLe2iLZHFxa",
    "target": "Peito",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_declinada",
    "name": "Flexão declinada",
    "group": "Peito",
    "videoUrl": "https://youtube.com/shorts/75Z2axVU9TQ?si=0bC5u7KHnXmT4j3T",
    "target": "Peito",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_diamante",
    "name": "Flexão diamante",
    "group": "Peito",
    "videoUrl": "https://youtube.com/shorts/5o3XHHeDvok?si=hzG5Ux_4AdkaCC_w",
    "target": "Peito",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_unilateral",
    "name": "Flexão unilateral",
    "group": "Peito",
    "videoUrl": "https://youtube.com/shorts/VFUa_5Fu0AI?si=NZhqKho4A2owuG9k",
    "target": "Peito",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_arqueira",
    "name": "Flexão arqueira",
    "group": "Peito",
    "videoUrl": "https://youtube.com/shorts/Y9ef9PLuNmY?si=Nt_UV0HOPGN1u3_s",
    "target": "Peito",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_hindu",
    "name": "Flexão hindu",
    "group": "Peito",
    "videoUrl": "https://youtube.com/shorts/dB9Am11opAY?si=sTq5BgWhogD2n6ee",
    "target": "Peito",
    "level": "Calistenia"
  },
  {
    "id": "c_desenvolvimento_aberto",
    "name": "Desenvolvimento aberto",
    "group": "Ombros",
    "videoUrl": "https://youtube.com/shorts/LyxdEor9AlM?si=4VdFdH_DllKBOwij",
    "target": "Ombros",
    "level": "Calistenia"
  },
  {
    "id": "c_desenvolvimento_fechado",
    "name": "Desenvolvimento fechado",
    "group": "Ombros",
    "videoUrl": "https://youtube.com/shorts/Z4p9Vy0tErg?si=uUZEzGuHfPKsNeWQ",
    "target": "Ombros",
    "level": "Calistenia"
  },
  {
    "id": "c_desenvolvimento_a_frente",
    "name": "Desenvolvimento a frente",
    "group": "Ombros",
    "videoUrl": "https://youtube.com/shorts/fxKLuV39J1A?si=iHjvdQ4JRyR4gHtL",
    "target": "Ombros",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_falsa",
    "name": "Flexão falsa",
    "group": "Ombros",
    "videoUrl": "https://youtube.com/shorts/SxtkFRwjNgQ?si=OWcABG7WXnJ8gar2",
    "target": "Ombros",
    "level": "Calistenia"
  },
  {
    "id": "c_handstand_costas_na_parede",
    "name": "Handstand costas na parede",
    "group": "Ombros",
    "videoUrl": "https://youtube.com/shorts/jwebzlt7Zco?si=FbHiI5ooCxu_jT2T",
    "target": "Ombros",
    "level": "Calistenia"
  },
  {
    "id": "c_handstand_barrida_na_parede",
    "name": "Handstand barrida na parede",
    "group": "Ombros",
    "videoUrl": "https://youtube.com/shorts/uV9nrwDsB-Q?si=3is4WVniedfhFpZj",
    "target": "Ombros",
    "level": "Calistenia"
  },
  {
    "id": "c_rosca_direta",
    "name": "Rosca direta",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/iUsgNIGT8l0?si=MAFJaIHgWPDoEmVA",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_rosca_direta_barra",
    "name": "Rosca direta barra",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/LjUwbn2PvXk?si=hotCIIBB-NGhxBQk",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_rosca_martelo",
    "name": "Rosca martelo",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/BQxR3Hb1Vsg?si=LmKLiOksCBmUMpnk",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_pegada_invertida",
    "name": "Pegada invertida",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/C1zVYZdNdus?si=UmlagrsTUQqz_ulk",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_rosca_unilateral",
    "name": "Rosca unilateral",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/FZVxBb9L8Xo?si=A6aRZLHuTwcie_gi",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_barra_pegada_invertida",
    "name": "Barra pegada invertida",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/ZGKn__k263U?si=0s9hBC6O5K40zuD7",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_extensao_no_chao",
    "name": "Extensão no chão",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/NGnurY2NojU?si=BoWOBxMR8wiPl6h3",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_extensao_punho_fechado",
    "name": "Extensão punho fechado",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/StAdyq2ZXR0?si=OkFqzliXhcfDIERz",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_triceps_frances_no_chao",
    "name": "Triceps francês no chão",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/TskE7otE83c?si=mZ-TUbX6yHZKc-8t",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_triceps_na_cadeira",
    "name": "Triceps na cadeira",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/-Sgi8wo3ezo?si=zSYm2W6ehTb5VPe-",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_triceps_no_chao",
    "name": "Triceps no chão",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/4Kj2-3GHDTA?si=szj1fbC7HTm7yomr",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_mergulho",
    "name": "Mergulho",
    "group": "Braços",
    "videoUrl": "https://youtube.com/shorts/P0QhAU0IJnY?si=dn_Wg1sa53O4T7To",
    "target": "Braços",
    "level": "Calistenia"
  },
  {
    "id": "c_agachamento_com_salto",
    "name": "Agachamento com salto",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/wEPdzlzfkEM?si=RHGf5uMAbxhhTVn1",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_sumô",
    "name": "Sumô",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/CG-kFCJk-Wg?si=Kd9muxMrPhYx5QPC",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_agachamento_pes_abduzidos",
    "name": "Agachamento pés abduzidos",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/N9rhjTyOI3o?si=4o5fupQroX4iVokh",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_agachamento_bulgaro",
    "name": "Agachamento bulgaro",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/NNlSiVjWPfQ?si=DO3W0LHpL87HKFPO",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_afundo",
    "name": "Afundo",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/cw6-VSwkg9g?si=IkAJg0lr4PNTB5NB",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_sissy_squat",
    "name": "Sissy squat",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/H3C3JbdwDEg?si=jkhRx0LWyZmCILTa",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_stiff",
    "name": "Stiff",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/N9rhjTyOI3o?si=4o5fupQroX4iVokh",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_stiff_unilateral",
    "name": "Stiff unilateral",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/CG-kFCJk-Wg?si=Kd9muxMrPhYx5QPC",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_posterior",
    "name": "Flexão posterior",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/4rwqyJ4OmOw?si=kgGuspjwHCUH1YnK",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_flexao_posterior_unilateral",
    "name": "Flexão posterior unilateral",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/Nlqj1yrMEBk?si=Y3w_jqkAgL9uOWJM",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_barra_fixa_aberta",
    "name": "Barra fixa aberta",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/F1GQAgamNQo?si=2ei_QpIWCmOmAgat",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_barra_fixa",
    "name": "Barra fixa",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/5etgsKXtPpA?si=WDsy4KenIfN7mGsi",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_barra_maos_juntas",
    "name": "Barra mãos juntas",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/cSU0oGy1o8U?si=47qKp4gVuZQgakMR",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_remada",
    "name": "Remada",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/kVIa74Gnh5o?si=-lYwJCxtyt3FBor3",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_remada_pegada_invertida",
    "name": "Remada pegada invertida",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/oS-NxkxqBok?si=8OCBeswP6-Q9J8U3",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_remada_alta",
    "name": "Remada alta",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/NkJUUvcnX_E?si=Co7HFdaYbN-ONr_G",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_superman_superior",
    "name": "Superman superior",
    "group": "Costas",
    "videoUrl": "https://youtube.com/shorts/_Lu48nmsI0c?si=zari0xMPvXclnPGg",
    "target": "Costas",
    "level": "Calistenia"
  },
  {
    "id": "c_elevacao",
    "name": "Elevação",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/kQBO-hlyWB0?si=qm7yzQpE3dsfTeVt",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_elevacao_pes_abduzidos",
    "name": "Elevação pés abduzidos",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/_IpncSQq7G0?si=YTj_mVrtdwl7Mxue",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_elevacao_calcanhares_abduzidos",
    "name": "Elevação calcanhares abduzidos",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/HcBdZlHo2G4?si=ca5nHpi0VVeMB98o",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_elevacao_unilateral",
    "name": "Elevação unilateral",
    "group": "Pernas",
    "videoUrl": "https://youtube.com/shorts/XyZ4UUm-Mig?si=4AxJTnuH-hqLA2mL",
    "target": "Pernas",
    "level": "Calistenia"
  },
  {
    "id": "c_burpee",
    "name": "Burpee",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/go2sTleEdMY?si=Dudo4OT4qeWOGO58",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_polichinelos",
    "name": "Polichinelos",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/BvJunlmBwTQ?si=5ero6tzSxLi1dFSc",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_joelhos_elevados",
    "name": "Joelhos elevados",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/QLAJUNoxu_Q?si=3Ezaqbrk6a_6-Wv4",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_dupla_puxada",
    "name": "Dupla puxada",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/IYwEt9bZGNY?si=hbPp-VR66kVG9tZA",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_abdominal_padrao",
    "name": "Abdominal padrão",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/eEh6ubyH91U?si=HTBmKwsu9co-9S7R",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_abdominal_supra",
    "name": "Abdominal supra",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/UIYvP02UEFQ?si=E5riBD1wNzMPTQ61",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_abdominal_infra",
    "name": "Abdominal infra",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/JamlY4VTTv0?si=ZD3YKvL72ct3LSrh",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_abdominal_infra_flexionado",
    "name": "Abdominal infra flexionado",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/ytcLgZA9GlI?si=YaJCcPL9R9cy6V-h",
    "target": "Core/Cardio",
    "level": "Calistenia"
  },
  {
    "id": "c_elevacao_esticada",
    "name": "Elevação esticada",
    "group": "Core/Cardio",
    "videoUrl": "https://youtube.com/shorts/At2SlGJGm8k?si=UW0z7zaq1BJPZm4D",
    "target": "Core/Cardio",
    "level": "Calistenia"
  }
];

const DEFAULT_WORKOUT_DAYS = ['Treino A (Push)', 'Treino B (Pull)', 'Treino C (Legs)', 'Treino D (Full/Core)'];

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
  const [appScreen, setAppScreen] = useState('loading'); 

  const activeDB = EXERCISE_DB; 
  const getEx = (id) => activeDB.find(e => e.id === id);

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const selectedDateStr = selectedDateObj.toLocaleDateString('pt-BR');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWorkoutSuccess, setShowWorkoutSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');

  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  
  // GESTÃO DA SEMANA DE TREINO
  const [workouts, setWorkouts] = useState({});
  const [workoutOrder, setWorkoutOrder] = useState(DEFAULT_WORKOUT_DAYS);
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [newDayName, setNewDayName] = useState('');

  // CATÁLOGO MANUAL DE EXERCÍCIOS
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]); 
  const [activeWorkoutDay, setActiveWorkoutDay] = useState(DEFAULT_WORKOUT_DAYS[0]);
  
  const [isCardioMode, setIsCardioMode] = useState(false);
  const [cardioDuration, setCardioDuration] = useState(30);
  const [isRestMode, setIsRestMode] = useState(false);

  const [userProfile, setUserProfile] = useState({ 
    name: '', level: 'Intermédio', weight: '65', targetWeight: '75', goal: 'Ganho de Massa',
    onboardingCompleted: false, lastLoginDate: todayStr
  });

  const ACHIEVEMENTS = [
    { id: 'a1', title: 'Primeiro Passo', desc: '1º Treino concluído', icon: <Flame className="text-orange-500" size={24}/>, condition: (h) => h.length >= 1 },
    { id: 'a3', title: 'Força Calisténica', desc: '10.000 reps movidas', icon: <Trophy className="text-emerald-500" size={24}/>, condition: (h) => h.reduce((a,b)=>a+(b.volume||0),0) >= 10000 },
  ];
  const unlockedAchievements = useMemo(() => ACHIEVEMENTS.filter(a => a.condition(workoutHistory)), [workoutHistory]);

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

  const generateAIPlan = () => {
    const formatEx = (ex) => ex ? ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets: 3, reps: '10', weight: '', isCompleted: false, videoUrl: ex.videoUrl }) : null;
    const p = {};
    
    DEFAULT_WORKOUT_DAYS.forEach(day => {
       let planExercises = [];
       if (day.includes('Push')) {
           planExercises = activeDB.filter(e => e.group === 'Peito' || e.group === 'Ombros').slice(0, 5);
       } else if (day.includes('Pull')) {
           planExercises = activeDB.filter(e => e.group === 'Costas' || e.group === 'Braços').slice(0, 5);
       } else if (day.includes('Legs')) {
           planExercises = activeDB.filter(e => e.group === 'Pernas').slice(0, 5);
       } else {
           planExercises = activeDB.filter(e => e.group === 'Core/Cardio').slice(0, 5);
       }

       p[day] = { name: day, exercises: planExercises.map(pe => formatEx(pe)).filter(e => e) };
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
    if (!user || !db || firebaseError) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'calistenia_planilha_v1'); 
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.workouts) setWorkouts(d.workouts);
        if (d.workoutOrder) setWorkoutOrder(d.workoutOrder);
        if (d.workoutHistory) setWorkoutHistory(d.workoutHistory);
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        if (d.userProfile) {
          let prof = { level: 'Intermédio', targetWeight: '75', ...d.userProfile };
          if (prof.lastLoginDate !== todayStr && prof.onboardingCompleted) {
             let updWorkouts = { ...(d.workouts || workouts) };
             Object.keys(updWorkouts).forEach(day => {
               if (updWorkouts[day].exercises) updWorkouts[day].exercises.forEach(ex => ex.isCompleted = false);
             });
             prof.lastLoginDate = todayStr;
             setUserProfile(prof);
             setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'calistenia_planilha_v1'), { userProfile: prof, workouts: updWorkouts }, { merge: true });
          } else { setUserProfile(prof); }
          setAppScreen(prof.onboardingCompleted ? 'main' : 'onboarding');
        }
      } else {
        generateAIPlan();
        setAppScreen('onboarding');
      }
    }, (err) => setFirebaseError(err.message));
    return () => unsub();
  }, [user, firebaseError, todayStr]);

  const saveToCloud = async (overrideData = null) => {
    if (!user || !db) return;
    try {
      const dataToSave = overrideData || { workouts, workoutOrder, workoutHistory, userProfile, dailyLogs };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'calistenia_planilha_v1'), JSON.parse(JSON.stringify(dataToSave)), { merge: true });
    } catch (e) { console.error(e); }
  };

  const handleAuthAction = async () => {
    setAuthErrorMsg(''); 
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      setAppScreen('loading'); 
    } catch (error) { setAuthErrorMsg(`Erro: ${error.message}`); }
  };

  const handleLogout = async () => { await signOut(auth); setUser(null); setAppScreen('login'); };

  const handleToggleMode = (mode) => {
    if (mode === 'cardio') { setIsCardioMode(!isCardioMode); setIsRestMode(false); }
    if (mode === 'rest') { setIsRestMode(!isRestMode); setIsCardioMode(false); }
  };

  // --- GESTÃO DE DIAS DA SEMANA ---
  const handleAddDay = () => {
    if(!newDayName.trim()) return;
    const name = newDayName.trim();
    if(workoutOrder.includes(name)) { showToast("Este dia já existe.", "error"); return; }
    
    const newOrder = [...workoutOrder, name];
    const newWorkouts = { ...workouts, [name]: { name, exercises: [] } };
    
    setWorkoutOrder(newOrder);
    setWorkouts(newWorkouts);
    saveToCloud({ workoutOrder: newOrder, workouts: newWorkouts });
    setNewDayName('');
  };

  const handleRemoveDay = (dayToRemove) => {
    const newOrder = workoutOrder.filter(d => d !== dayToRemove);
    const newWorkouts = { ...workouts };
    delete newWorkouts[dayToRemove];
    
    if(activeWorkoutDay === dayToRemove) setActiveWorkoutDay(newOrder[0] || '');
    
    setWorkoutOrder(newOrder);
    setWorkouts(newWorkouts);
    saveToCloud({ workoutOrder: newOrder, workouts: newWorkouts });
  };

  // --- ADIÇÃO MANUAL E REMOÇÃO DE EXERCÍCIO ---
  const handleAddManualExercise = (ex) => {
    const newEx = {
      id: Date.now() + Math.random(),
      originalId: ex.id,
      name: ex.name,
      target: ex.target,
      group: ex.group,
      sets: 3,
      reps: '10',
      weight: '',
      isCompleted: false,
      videoUrl: ex.videoUrl
    };

    const upd = { ...workouts };
    if (!upd[activeWorkoutDay].exercises) {
      upd[activeWorkoutDay].exercises = [];
    }
    upd[activeWorkoutDay].exercises.push(newEx);
    setWorkouts(upd);
    saveToCloud({ workouts: upd });
    setShowAddExerciseModal(false);
    setExerciseSearch('');
    showToast(`${ex.name} adicionado ao treino!`, 'success');
  };

  const handleRemoveExercise = (exId) => {
    const upd = { ...workouts };
    upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.filter(x => x.id !== exId);
    setWorkouts(upd);
    saveToCloud({ workouts: upd });
  };

  const handleCompleteWorkout = () => {
    const cur = workouts[activeWorkoutDay];
    let vol = 0; let durationCardio = isCardioMode ? (Number(cardioDuration) || 30) : 0;
    let completedExercises = [];
    
    if (!isRestMode && !isCardioMode && cur && cur.exercises) {
      cur.exercises.forEach(ex => {
        const repsCalc = typeof ex.reps === 'string' && ex.reps.includes('s') ? parseInt(ex.reps)/2 : (Number(ex.reps)||10);
        vol += repsCalc * (Number(ex.sets)||1);
        completedExercises.push({ originalId: ex.originalId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
        ex.isCompleted = false; 
      });
    }

    const newLog = { 
      id: Date.now(), date: selectedDateStr, timestamp: selectedDateObj.getTime(), day: activeWorkoutDay, volume: vol, 
      isCardio: isCardioMode, cardioDuration: durationCardio, isRest: isRestMode, exercises: completedExercises 
    };
    
    const newHist = [...workoutHistory, newLog];
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === selectedDateStr);
    if (idx >= 0) newDLogs[idx].workout = activeWorkoutDay;
    else newDLogs.push({ date: selectedDateStr, workout: activeWorkoutDay, water: 0 });

    setWorkoutHistory(newHist); setDailyLogs(newDLogs);
    saveToCloud({ workouts, workoutOrder, workoutHistory: newHist, dailyLogs: newDLogs });
    
    setShowWorkoutSuccess(true); setIsCardioMode(false); setIsRestMode(false);
  };

  const addWater = () => {
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === selectedDateStr);
    if (idx >= 0) newDLogs[idx].water = (newDLogs[idx].water || 0) + 250;
    else newDLogs.push({ date: selectedDateStr, water: 250, workout: null });
    setDailyLogs(newDLogs); saveToCloud({ dailyLogs: newDLogs });
  };

  const callGemini = async (prompt, schema = null) => {
    const apiKey = (userProfile.geminiApiKey || "").trim(); 
    if (!apiKey) {
       showToast("Configure a sua Chave API do Gemini no separador Perfil para usar a IA.", "error");
       throw new Error("Chave API ausente.");
    }
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const res = await fetch(url, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(schema && { generationConfig: { responseMimeType: "application/json", responseSchema: schema } })
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Erro API");
    return JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim());
  };

  const handleGenerateAIWorkout = async () => {
    setIsGeneratingWorkout(true);
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const dbContext = activeDB.map(e => `ID:'${e.id}' | Nome:'${e.name}' | Grupo:'${e.group}'`).join('\n');

      const prompt = `Atue como um treinador especialista em calistenia. 
      O meu objetivo: ${userProfile.goal} (Atual: ${userProfile.weight}kg -> Alvo: ${userProfile.targetWeight}kg).
      O treino de hoje chama-se: "${dayInfo.name}".
      
      Aqui estão os exercícios válidos na base de dados (providenciada via planilha):
      ${dbContext}

      REGRAS:
      1. Escolha EXATAMENTE 6 exercícios coerentes com o foco do dia (${dayInfo.name}).
      2. Retorne APENAS um JSON: {"exercises": ["id1", "id2", ...]} contendo os 6 IDs apropriados.`;

      const schema = { type: "OBJECT", properties: { exercises: { type: "ARRAY", items: { type: "STRING" } } } };
      const resultData = await callGemini(prompt, schema);
      const resultIds = resultData.exercises || [];

      if (resultIds.length > 0) {
         const formatExLoc = (ex) => ex ? ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets: 3, reps: '10', weight: '', isCompleted: false, videoUrl: ex.videoUrl }) : null;
         const newExercises = resultIds.map(id => formatExLoc(getEx(id))).filter(e => e !== null);

         if (newExercises.length > 0) {
           const upd = {...workouts};
           upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises: newExercises };
           setWorkouts(upd); saveToCloud({ workouts: upd });
           showToast("Treino atualizado com sucesso pela IA!", "success");
         }
      }
    } catch (error) { showToast(`Erro da IA: ${error.message}`, "error"); } 
    finally { setIsGeneratingWorkout(false); }
  };

  const getCalendarDays = () => {
    const days = []; const targetDate = new Date(selectedDateObj); targetDate.setHours(0,0,0,0);
    let startDate = new Date(targetDate); startDate.setDate(targetDate.getDate() - 6);
    for(let i=0; i<7; i++) {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i);
      const log = dailyLogs.find(l => l.date === d.toLocaleDateString('pt-BR'));
      days.push({ dateNum: d.getDate(), dayStr: d.toLocaleDateString('pt-BR', {weekday:'short'}), hasWorkout: !!log?.workout });
    }
    return days;
  };

  if (isAuthLoading || appScreen === 'loading') return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;
  
  if (!user || appScreen === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
          <Dumbbell size={48} className="text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold mb-2">Rotina Calistenia</h1>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4" placeholder="E-mail" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4" placeholder="Senha" />
          <button onClick={handleAuthAction} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl">{isLoginMode ? 'Entrar' : 'Registar'}</button>
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-6 text-sm text-emerald-400 font-bold block w-full">{isLoginMode ? 'Registar' : 'Entrar'}</button>
        </div>
      </div>
    );
  }

  if (appScreen === 'onboarding') {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white">
          <div className="max-w-md w-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
             <Activity size={48} className="text-emerald-500 mx-auto mb-6" />
             <h1 className="text-2xl font-extrabold mb-4">Bem-vindo à nova Rotina</h1>
             <p className="text-zinc-400 text-sm mb-6">A base de dados foi atualizada exclusivamente com os 60 exercícios da sua planilha original.</p>
             <button onClick={() => {
                 const newProf = {...userProfile, onboardingCompleted:true};
                 setUserProfile(newProf); saveToCloud({ userProfile: newProf });
                 setAppScreen('main');
             }} className="w-full bg-emerald-600 p-4 rounded-xl font-bold">Iniciar Jornada aos 75kg</button>
          </div>
       </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      <ToastContainer toasts={toasts} />
      
      {/* MODAL DE ADICIONAR EXERCÍCIO MANUAL */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-extrabold text-xl text-white">Catálogo da Planilha</h3>
              <button onClick={()=>{setShowAddExerciseModal(false); setExerciseSearch('');}} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search size={16} className="absolute left-4 top-3.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Pesquisar (ex: Flexão hindu...)" 
                value={exerciseSearch} 
                onChange={e => setExerciseSearch(e.target.value)}
                className="w-full bg-zinc-950 py-3 pl-11 pr-4 rounded-xl border border-zinc-800 outline-none text-white text-sm focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {(() => {
                const filtered = activeDB.filter(ex => 
                  ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) || 
                  ex.group.toLowerCase().includes(exerciseSearch.toLowerCase()) || 
                  ex.target.toLowerCase().includes(exerciseSearch.toLowerCase())
                );
                
                if (filtered.length === 0) return <div className="text-center text-zinc-500 py-4 text-sm font-bold">Nenhum exercício encontrado.</div>;
                
                return filtered.map(ex => (
                  <button key={ex.id} onClick={() => handleAddManualExercise(ex)} className="w-full text-left bg-zinc-950 p-4 rounded-2xl hover:border-emerald-500 border border-zinc-800 flex justify-between items-center group transition-all">
                    <div>
                      <p className="font-extrabold text-white group-hover:text-emerald-400 transition-colors">{ex.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{ex.group} • {ex.target}</p>
                    </div>
                    <Plus size={20} className="text-zinc-600 group-hover:text-emerald-500 transition-colors"/>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-72 bg-zinc-900/40 border-r border-zinc-800/80 p-6 z-40">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <Dumbbell className="text-emerald-500" size={28} />
          <span className="font-extrabold text-2xl tracking-tight text-white">Rotina Calistenia</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <SidebarBtn a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={20}/>} l="Painel" />
          <SidebarBtn a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={20}/>} l="Treino" />
          <SidebarBtn a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={20}/>} l="Perfil" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto w-full relative pb-28 md:pb-8 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="max-w-4xl mx-auto p-5 md:p-8 w-full mt-2">

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <header className="flex justify-between items-end mb-8">
                <div>
                   <h1 className="text-3xl font-extrabold text-white">Painel</h1>
                   <p className="text-emerald-400 font-bold text-sm mt-1">Alvo: {userProfile.targetWeight}kg Massa Bruta</p>
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
                <div className="bg-blue-950/20 border border-blue-900/30 p-6 rounded-3xl relative overflow-hidden">
                  <h3 className="text-sm font-bold text-blue-400 uppercase mb-1">Hidratação</h3>
                  <p className="text-4xl font-black text-white mt-4">{targetDayLog.water} <span className="text-lg text-blue-200">/ {waterTarget}ml</span></p>
                  <button onClick={addWater} className="mt-6 bg-blue-600 px-5 py-3 rounded-xl font-bold flex gap-2"><Plus size={16}/> Copo</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'treino' && (
             <div className="space-y-6 animate-fadeIn">
               <header className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-extrabold">Estrutura de Treino</h1>
                 <button onClick={() => setIsEditingDays(!isEditingDays)} className={`p-2 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${isEditingDays ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}>
                   {isEditingDays ? <Check size={18}/> : <Settings2 size={18}/>} 
                   {isEditingDays ? 'Concluir' : 'Editar Dias'}
                 </button>
               </header>
               
               {isEditingDays ? (
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-6">
                    <h3 className="font-bold text-lg mb-4 text-emerald-400">Gerir Dias da Semana</h3>
                    <div className="space-y-3 mb-6">
                      {workoutOrder.map(d => (
                        <div key={d} className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                          <span className="font-bold text-white">{d}</span>
                          <button onClick={()=>handleRemoveDay(d)} className="text-red-400 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash size={18}/></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                       <input type="text" value={newDayName} onChange={e=>setNewDayName(e.target.value)} placeholder="Ex: Treino C - Pernas" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 outline-none text-white focus:border-emerald-500"/>
                       <button onClick={handleAddDay} className="bg-emerald-600 text-white px-4 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> Adicionar</button>
                    </div>
                 </div>
               ) : (
                 <div className="flex gap-2 overflow-x-auto pb-4 px-1">
                   {workoutOrder.length === 0 ? (
                     <div className="text-zinc-500 italic p-4">Sem dias configurados. Clique em "Editar Dias".</div>
                   ) : (
                     workoutOrder.map((d) => (
                       <button 
                         key={d} 
                         onClick={()=>setActiveWorkoutDay(d)}
                         className={`px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeWorkoutDay === d ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}
                       >
                         {d}
                       </button>
                     ))
                   )}
                 </div>
               )}

               {(!isEditingDays && workoutOrder.length > 0) && (
                 <>
                   <div className="flex justify-between items-center mb-4 mt-6">
                      <h2 className="font-bold text-lg text-white">{workouts[activeWorkoutDay]?.name}</h2>
                      <button onClick={handleGenerateAIWorkout} disabled={isGeneratingWorkout} className="bg-emerald-600/20 text-emerald-400 px-3 py-2 rounded-xl font-bold text-sm flex gap-2 disabled:opacity-50 border border-emerald-500/30">
                        {isGeneratingWorkout ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16}/>} Gerar Treino IA
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
                             
                             <div className="flex gap-2">
                                <button onClick={() => handleRemoveExercise(ex.id)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all" title="Remover exercício">
                                   <Trash size={18}/>
                                </button>
                                <button onClick={()=>{
                                    const upd = {...workouts};
                                    upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.map(x => x.id === ex.id ? { ...x, isCompleted: !x.isCompleted } : x);
                                    setWorkouts(upd);
                                 }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ex.isCompleted?'bg-emerald-500 text-zinc-950':'bg-zinc-950 text-zinc-600 border border-zinc-800 hover:text-white'}`} title="Marcar como concluído">
                                   <Check size={20} strokeWidth={3}/>
                                 </button>
                             </div>
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
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Reps</label>
                                <input type="text" value={ex.reps} onChange={(e) => {
                                   const upd = {...workouts};
                                   upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.map(x => x.id === ex.id ? { ...x, reps: e.target.value } : x);
                                   setWorkouts(upd);
                                }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold text-white border border-zinc-800 focus:border-emerald-500" />
                              </div>
                           </div>

                           {/* Link para YouTube (agora vindo da planilha) */}
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
                   
                   <button onClick={() => setShowAddExerciseModal(true)} className="w-full py-4 mt-4 bg-zinc-900/50 border-2 border-dashed border-zinc-800 text-zinc-400 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all">
                     <Plus size={20}/> Adicionar Exercício Manualmente
                   </button>
                   
                   <button onClick={handleCompleteWorkout} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg mt-8 flex justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                     <Save size={24}/> Concluir Treino
                   </button>
                 </>
               )}
             </div>
          )}
          
          {activeTab === 'perfil' && (
            <div className="space-y-6 animate-fadeIn pb-10">
               <h1 className="text-3xl font-extrabold text-white mb-6">Perfil & Sistema</h1>
               <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mt-6">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Settings size={18}/> Integração IA (Gemini)</h3>
                 <input type="password" value={userProfile.geminiApiKey || ''} onChange={e => {
                    const newProf = {...userProfile, geminiApiKey: e.target.value};
                    setUserProfile(newProf); saveToCloud({ userProfile: newProf });
                 }} placeholder="Cole a sua chave API do AI Studio aqui..." className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-emerald-400 focus:border-emerald-500 outline-none font-mono text-sm" />
               </div>
               <button onClick={handleLogout} className="w-full py-5 bg-zinc-900 text-zinc-400 hover:text-red-400 rounded-3xl font-bold border border-zinc-800 flex items-center justify-center gap-2">
                 <LogOut size={20} /> Terminar Sessão
               </button>
            </div>
          )}
        </div>
      </main>
      
      {showWorkoutSuccess && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
            <Flame size={48} className="text-emerald-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-2">Treino Salvo! 🎉</h2>
            <p className="text-zinc-400 mb-8 text-sm">Mais um passo rumo aos 75kg de massa bruta.</p>
            <button onClick={() => { setShowWorkoutSuccess(false); setActiveTab('dashboard'); }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform">
              Ver Consistência
            </button>
          </div>
        </div>
      )}

      {/* Navegação Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-4 rounded-full z-50 shadow-2xl flex gap-4 text-white">
         <button onClick={() => setActiveTab('dashboard')} className={activeTab==='dashboard'?'text-emerald-500':''}><LayoutDashboard/></button>
         <button onClick={() => setActiveTab('treino')} className={activeTab==='treino'?'text-emerald-500':''}><Dumbbell/></button>
         <button onClick={() => setActiveTab('perfil')} className={activeTab==='perfil'?'text-emerald-500':''}><UserCircle/></button>
      </div>
    </div>
  );
}