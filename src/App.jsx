import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Dumbbell, Utensils, UserCircle, Send, 
  Loader2, Sparkles, Check, Play, Pause, Timer, AlertCircle, 
  Smile, Frown, Lock, Flame, ArrowRightCircle, LogOut, Key, Settings, 
  RefreshCw, ArrowLeftRight, X, Save, Plus, Ruler, ActivitySquare, AlertTriangle, 
  CalendarDays, Eye, EyeOff, Trash2, Cpu, CheckCircle2, Pencil
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

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

// --- DB EXERCÍCIOS (EXPANDIDO - 100 EXERCÍCIOS) ---
const EXERCISE_DB = [
  // --- PEITO ---
  { id: 'e1', name: 'Supino Reto (Barra)', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e2', name: 'Supino Reto (Halteres)', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e3', name: 'Supino Inclinado (Barra)', target: 'Peitoral Superior', group: 'Peito' },
  { id: 'e4', name: 'Supino Inclinado (Halteres)', target: 'Peitoral Superior', group: 'Peito' },
  { id: 'e5', name: 'Supino Declinado (Barra)', target: 'Peitoral Inferior', group: 'Peito' },
  { id: 'e6', name: 'Crucifixo Reto (Halteres)', target: 'Peitoral (Isolado)', group: 'Peito' },
  { id: 'e7', name: 'Crucifixo Inclinado (Halteres)', target: 'Peitoral Superior (Isolado)', group: 'Peito' },
  { id: 'e8', name: 'Crossover (Polia Alta)', target: 'Peitoral Inferior/Médio', group: 'Peito' },
  { id: 'e9', name: 'Crossover (Polia Média)', target: 'Peitoral Maior/Miolo', group: 'Peito' },
  { id: 'e10', name: 'Crossover (Polia Baixa)', target: 'Peitoral Superior', group: 'Peito' },
  { id: 'e11', name: 'Voador (Peck Deck)', target: 'Peitoral (Isolado)', group: 'Peito' },
  { id: 'e12', name: 'Flexão de Braços (Padrão)', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e13', name: 'Flexão Declinada (Pés Elevados)', target: 'Peitoral Superior', group: 'Peito' },
  { id: 'e14', name: 'Mergulho nas Paralelas', target: 'Peitoral Inferior/Tríceps', group: 'Peito' },
  { id: 'e15', name: 'Supino Articulado (Máquina)', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e16', name: 'Pullover (Halter)', target: 'Peitoral/Dorsal', group: 'Peito' },

  // --- COSTAS ---
  { id: 'e17', name: 'Barra Fixa (Pronada)', target: 'Grande Dorsal', group: 'Costas' },
  { id: 'e18', name: 'Barra Fixa (Supinada)', target: 'Dorsal/Bíceps', group: 'Costas' },
  { id: 'e19', name: 'Puxada Anterior (Pronada)', target: 'Dorsal (Largura)', group: 'Costas' },
  { id: 'e20', name: 'Puxada Anterior (Supinada)', target: 'Dorsal Inferior', group: 'Costas' },
  { id: 'e21', name: 'Puxada com Triângulo', target: 'Dorsal (Miolo)', group: 'Costas' },
  { id: 'e22', name: 'Remada Curvada (Barra)', target: 'Dorsal e Romboides', group: 'Costas' },
  { id: 'e23', name: 'Remada Curvada (Supinada)', target: 'Dorsal Inferior', group: 'Costas' },
  { id: 'e24', name: 'Remada Unilateral (Serrote)', target: 'Dorsal Unilateral', group: 'Costas' },
  { id: 'e25', name: 'Remada Cavalinho (Barra T)', target: 'Espessura das Costas', group: 'Costas' },
  { id: 'e26', name: 'Remada Sentada (Triângulo)', target: 'Costas (Média/Miolo)', group: 'Costas' },
  { id: 'e27', name: 'Remada Sentada (Barra Aberta)', target: 'Dorsal Posterior', group: 'Costas' },
  { id: 'e28', name: 'Pulldown (Polia Alta/Corda)', target: 'Grande Dorsal (Isolado)', group: 'Costas' },
  { id: 'e29', name: 'Levantamento Terra', target: 'Costas Completas/Lombar', group: 'Costas' },
  { id: 'e30', name: 'Extensão Lombar (Banco)', target: 'Lombar', group: 'Costas' },
  { id: 'e31', name: 'Remada Articulada (Máquina)', target: 'Dorsal Maior', group: 'Costas' },

  // --- OMBROS ---
  { id: 'e32', name: 'Desenvolvimento (Barra)', target: 'Deltoide Anterior/Médio', group: 'Ombros' },
  { id: 'e33', name: 'Desenvolvimento (Halteres)', target: 'Deltoide Anterior/Médio', group: 'Ombros' },
  { id: 'e34', name: 'Desenvolvimento Arnold', target: 'Deltoide Completo', group: 'Ombros' },
  { id: 'e35', name: 'Desenvolvimento (Máquina)', target: 'Deltoide Anterior', group: 'Ombros' },
  { id: 'e36', name: 'Elevação Lateral (Halteres)', target: 'Deltoide Lateral', group: 'Ombros' },
  { id: 'e37', name: 'Elevação Lateral (Polia)', target: 'Deltoide Lateral (Tensão Contínua)', group: 'Ombros' },
  { id: 'e38', name: 'Elevação Frontal (Halteres)', target: 'Deltoide Anterior', group: 'Ombros' },
  { id: 'e39', name: 'Elevação Frontal (Barra/Polia)', target: 'Deltoide Anterior', group: 'Ombros' },
  { id: 'e40', name: 'Crucifixo Invertido (Halteres)', target: 'Deltoide Posterior', group: 'Ombros' },
  { id: 'e41', name: 'Crucifixo Invertido (Polia)', target: 'Deltoide Posterior', group: 'Ombros' },
  { id: 'e42', name: 'Crucifixo Invertido (Máquina)', target: 'Deltoide Posterior', group: 'Ombros' },
  { id: 'e43', name: 'Remada Alta (Barra)', target: 'Deltoide Lateral/Trapézio', group: 'Ombros' },
  { id: 'e44', name: 'Remada Alta (Polia)', target: 'Deltoide Lateral', group: 'Ombros' },
  { id: 'e45', name: 'Encolhimento (Barra)', target: 'Trapézio', group: 'Ombros' },
  { id: 'e46', name: 'Encolhimento (Halteres)', target: 'Trapézio', group: 'Ombros' },

  // --- BRAÇOS (BÍCEPS, TRÍCEPS E ANTEBRAÇO) ---
  { id: 'e47', name: 'Rosca Direta (Barra Reta)', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e48', name: 'Rosca Direta (Barra W)', target: 'Bíceps (Cabeça Longa)', group: 'Braços' },
  { id: 'e49', name: 'Rosca Alternada (Halteres)', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e50', name: 'Rosca Martelo (Halteres)', target: 'Braquial/Antebraço', group: 'Braços' },
  { id: 'e51', name: 'Rosca Martelo (Corda/Polia)', target: 'Braquial', group: 'Braços' },
  { id: 'e52', name: 'Rosca Scott (Máquina/Barra)', target: 'Bíceps Braquial (Isolado)', group: 'Braços' },
  { id: 'e53', name: 'Rosca Concentrada (Halter)', target: 'Pico do Bíceps', group: 'Braços' },
  { id: 'e54', name: 'Rosca na Polia Baixa', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e55', name: 'Rosca Inversa (Barra/Polia)', target: 'Antebraço/Braquiorradial', group: 'Braços' },
  { id: 'e56', name: 'Flexão de Punho (Barra/Halter)', target: 'Antebraço', group: 'Braços' },
  { id: 'e57', name: 'Tríceps Pulley (Barra Reta)', target: 'Tríceps (Cabeça Lateral)', group: 'Braços' },
  { id: 'e58', name: 'Tríceps Pulley (Corda)', target: 'Tríceps (Cabeça Longa)', group: 'Braços' },
  { id: 'e59', name: 'Tríceps Testa (Barra W)', target: 'Tríceps Completo', group: 'Braços' },
  { id: 'e60', name: 'Tríceps Testa (Halteres)', target: 'Tríceps Completo', group: 'Braços' },
  { id: 'e61', name: 'Tríceps Francês (Halter Unilateral)', target: 'Tríceps (Porção Longa)', group: 'Braços' },
  { id: 'e62', name: 'Tríceps Francês (Corda/Polia)', target: 'Tríceps (Porção Longa)', group: 'Braços' },
  { id: 'e63', name: 'Tríceps Coice (Halter/Polia)', target: 'Tríceps (Isolado)', group: 'Braços' },
  { id: 'e64', name: 'Mergulho em Máquina', target: 'Tríceps/Peito', group: 'Braços' },
  { id: 'e65', name: 'Repulsão entre Bancos', target: 'Tríceps', group: 'Braços' },
  { id: 'e66', name: 'Supino Fechado', target: 'Tríceps/Peitoral Miolo', group: 'Braços' },

  // --- PERNAS (QUADRÍCEPS, POSTERIOR E PANTURRILHA) ---
  { id: 'e67', name: 'Agachamento Livre (Barra)', target: 'Quadríceps/Glúteos', group: 'Pernas' },
  { id: 'e68', name: 'Agachamento Frontal', target: 'Quadríceps (Foco Alto)', group: 'Pernas' },
  { id: 'e69', name: 'Agachamento Hack', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e70', name: 'Agachamento Búlgaro', target: 'Quadríceps/Glúteos Unilateral', group: 'Pernas' },
  { id: 'e71', name: 'Leg Press 45°', target: 'Quadríceps/Posterior', group: 'Pernas' },
  { id: 'e72', name: 'Leg Press Horizontal', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e73', name: 'Cadeira Extensora', target: 'Quadríceps (Isolado)', group: 'Pernas' },
  { id: 'e74', name: 'Sissy Squat (Máquina)', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e75', name: 'Passada/Avanço (Halteres)', target: 'Quadríceps/Glúteos', group: 'Pernas' },
  { id: 'e76', name: 'Afundo (No Lugar)', target: 'Quadríceps/Glúteos', group: 'Pernas' },
  { id: 'e77', name: 'Mesa Flexora', target: 'Isquiotibiais (Posterior)', group: 'Pernas' },
  { id: 'e78', name: 'Cadeira Flexora', target: 'Isquiotibiais', group: 'Pernas' },
  { id: 'e79', name: 'Flexora em Pé (Unilateral)', target: 'Isquiotibiais Unilateral', group: 'Pernas' },
  { id: 'e80', name: 'Stiff (Barra/Halteres)', target: 'Posterior/Glúteos', group: 'Pernas' },
  { id: 'e81', name: 'Levantamento Terra Romeno', target: 'Posterior da Coxa', group: 'Pernas' },
  { id: 'e82', name: 'Bom Dia (Good Morning)', target: 'Posterior/Lombar', group: 'Pernas' },
  { id: 'e83', name: 'Panturrilha em Pé (Máquina)', target: 'Gastrocnêmio', group: 'Pernas' },
  { id: 'e84', name: 'Panturrilha Sentado (Máquina)', target: 'Sóleo', group: 'Pernas' },
  { id: 'e85', name: 'Panturrilha no Leg Press', target: 'Gastrocnêmio', group: 'Pernas' },
  { id: 'e86', name: 'Panturrilha Livre (Degrau/Unilateral)', target: 'Gastrocnêmio', group: 'Pernas' },

  // --- GAP (GLÚTEOS E ABDÔMEN/CORE) ---
  { id: 'e87', name: 'Elevação Pélvica (Barra)', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e88', name: 'Elevação Pélvica (Máquina)', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e89', name: 'Cadeira Abdutora', target: 'Glúteo Médio', group: 'GAP' },
  { id: 'e90', name: 'Cadeira Adutora', target: 'Adutores da Coxa', group: 'GAP' },
  { id: 'e91', name: 'Glúteo na Polia (Cabo)', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e92', name: 'Glúteo 4 Apoios (Caneleira)', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e93', name: 'Agachamento Sumô (Halter)', target: 'Glúteo/Adutores', group: 'GAP' },
  { id: 'e94', name: 'Abdominal Supra (Solo)', target: 'Reto Abdominal', group: 'GAP' },
  { id: 'e95', name: 'Abdominal Infra (Elevação Pernas)', target: 'Abdômen Inferior', group: 'GAP' },
  { id: 'e96', name: 'Abdominal Supra (Polia)', target: 'Reto Abdominal (Com Carga)', group: 'GAP' },
  { id: 'e97', name: 'Abdominal Oblíquo (Polia/Halter)', target: 'Oblíquos', group: 'GAP' },
  { id: 'e98', name: 'Prancha Isométrica', target: 'Core/Estabilização', group: 'GAP' },
  { id: 'e99', name: 'Roda Abdominal (Rolinho)', target: 'Core Completo', group: 'GAP' },
  { id: 'e100', name: 'Elevação de Pernas em Suspensão', target: 'Abdômen Infra/Core', group: 'GAP' }
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
const WORKOUT_DAYS = ['Pull', 'Legs 1', 'Push', 'Legs 2', 'Upper', 'Lower'];

// Funções utilitárias
const getEx = (id) => EXERCISE_DB.find(e => e.id === id);
const formatEx = (ex, sets, reps) => ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets, reps, weight: '', isCompleted: false });

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [appScreen, setAppScreen] = useState('loading'); 

  // Variável temporal para Reset 24h
  const todayStr = new Date().toLocaleDateString('pt-BR');

  // Navegação
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashTab, setDashTab] = useState('daily'); 
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showBackAnatomy, setShowBackAnatomy] = useState(false);
  const [showMeasureAlert, setShowMeasureAlert] = useState(false);
  const [showWorkoutSuccess, setShowWorkoutSuccess] = useState(false);

  // Autenticação e Config
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiPasswordAttempt, setApiPasswordAttempt] = useState('');
  const [isApiAuthPending, setIsApiAuthPending] = useState(false);
  const [isApiKeyUnlocked, setIsApiKeyUnlocked] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);

  // IA Geral
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Olá! Registe as suas refeições aqui.' }]);
  const [chatInput, setChatInput] = useState('');
  const [selectedMealId, setSelectedMealId] = useState('m3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepInsightText, setDeepInsightText] = useState('');
  const [isDeepInsightLoading, setIsDeepInsightLoading] = useState(false);
  const [anatomyTips, setAnatomyTips] = useState({});
  const [anatomyTipState, setAnatomyTipState] = useState({});
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  // Dados Essenciais
  const [workouts, setWorkouts] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]); 
  const [nutritionLogs, setNutritionLogs] = useState([]); // NOVO ESTADO: Histórico de Nutrição
  const [activeWorkoutDay, setActiveWorkoutDay] = useState('Pull');
  const [isGapMode, setIsGapMode] = useState(false);
  const [gapDuration, setGapDuration] = useState(45);
  
  const [userProfile, setUserProfile] = useState({ 
    name: '', age: '', gender: 'M', height: '', weight: '', goal: 'Hipertrofia', 
    onboardingCompleted: false, geminiApiKey: '', lastMeasureUpdate: null, lastLoginDate: todayStr
  });
  
  const [measurements, setMeasurements] = useState({ peito: '', bracos: '', antebraco: '', quadril: '', costas: '', pernas: '', cintura: '', panturrilha: '' });
  const [weightHistory, setWeightHistory] = useState([]); 
  
  // UI & Cronômetro & Nutrição Feed
  const [expandedDesc, setExpandedDesc] = useState({});
  const [exerciseModal, setExerciseModal] = useState({ active: false, mode: 'swap', targetExId: null, filterGroup: null });
  const [timerInterval, setTimerInterval] = useState(90);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [resetPassAttempt, setResetPassAttempt] = useState('');
  
  // Controle Feed Nutrição
  const [editingNutritionId, setEditingNutritionId] = useState(null);
  const [editNutritionData, setEditNutritionData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Cálculos Derivados (Reset a cada 24h automaticamente baseado no todayStr)
  const todayLog = dailyLogs.find(l => l.date === todayStr) || { water: 0, workout: null };
  const waterTarget = Number(userProfile.weight) * 35 || 2500; 

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

  const generateAIPlan = () => {
    const p = {
      'Pull': { name: 'Treino Pull', isLegs: false, exercises: [ 
          formatEx(getEx('e19'), 4, 10), formatEx(getEx('e22'), 3, 10), formatEx(getEx('e26'), 3, 12), // Costas
          formatEx(getEx('e40'), 3, 15), // Posterior de Ombro
          formatEx(getEx('e47'), 4, 10), formatEx(getEx('e49'), 3, 12) // Bíceps
      ]},
      'Legs 1': { name: 'Legs Quadríceps', isLegs: true, exercises: [ 
          formatEx(getEx('e67'), 4, 8), formatEx(getEx('e71'), 3, 12), formatEx(getEx('e73'), 3, 15), // Quad
          formatEx(getEx('e77'), 4, 12), formatEx(getEx('e80'), 3, 12), // Posterior
          formatEx(getEx('e83'), 4, 20), formatEx(getEx('e84'), 4, 15) // Panturrilha
      ]},
      'Push': { name: 'Treino Push', isLegs: false, exercises: [ 
          formatEx(getEx('e1'), 4, 10), formatEx(getEx('e3'), 3, 12), formatEx(getEx('e8'), 3, 15), // Peito
          formatEx(getEx('e32'), 4, 10), formatEx(getEx('e36'), 4, 12), // Ombros
          formatEx(getEx('e57'), 4, 12), formatEx(getEx('e59'), 3, 12) // Tríceps
      ]},
      'Legs 2': { name: 'Legs Posterior', isLegs: true, exercises: [ 
          formatEx(getEx('e69'), 4, 8), formatEx(getEx('e72'), 3, 12), formatEx(getEx('e74'), 3, 15), // Quad
          formatEx(getEx('e78'), 4, 12), formatEx(getEx('e81'), 3, 12), // Posterior
          formatEx(getEx('e85'), 4, 20), formatEx(getEx('e86'), 4, 15) // Panturrilha
      ]},
      'Upper': { name: 'Upper Body', isLegs: false, exercises: [ 
          formatEx(getEx('e19'), 3, 10), formatEx(getEx('e26'), 3, 12), // Costas
          formatEx(getEx('e1'), 3, 10), formatEx(getEx('e8'), 3, 12), // Peito
          formatEx(getEx('e36'), 3, 12), // Ombro
          formatEx(getEx('e47'), 3, 12), // Bíceps
          formatEx(getEx('e57'), 3, 12)  // Tríceps
      ]},
      'Lower': { name: 'Lower Body', isLegs: true, exercises: [ 
          formatEx(getEx('e67'), 3, 10), formatEx(getEx('e71'), 3, 12), formatEx(getEx('e73'), 3, 15), // Quad
          formatEx(getEx('e77'), 3, 12), formatEx(getEx('e80'), 3, 12), // Posterior
          formatEx(getEx('e83'), 4, 15), formatEx(getEx('e84'), 4, 15) // Panturrilha
      ]}
    };
    setWorkouts(p);
  };

  // Firebase Setup
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

  useEffect(() => {
    if (!user || !db || firebaseError) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'); 
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.workouts) setWorkouts(d.workouts);
        if (d.nutritionLogs) setNutritionLogs(d.nutritionLogs);
        if (d.workoutHistory) setWorkoutHistory(d.workoutHistory);
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        if (d.measurements) setMeasurements({ cintura: '', ...d.measurements }); // Garante a chave cintura
        if (d.weightHistory) setWeightHistory(d.weightHistory);
        if (d.userProfile) {
          let prof = d.userProfile;
          
          // Reset Diário dos Treinos (Se virou a meia-noite)
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
               // Dispara save em background para atualizar a data no servidor
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
      const dataToSave = overrideData || { workouts, nutritionLogs, workoutHistory, userProfile, dailyLogs, measurements, weightHistory };
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
      console.error("Auth Error Full:", error);
      if (error.code === 'auth/admin-restricted-operation') {
        setAuthErrorMsg('Operação restrita. Verifique se a sua API Key do Firebase está correta e se a ativação E-mail/Senha está correta.');
      } else if (error.code === 'auth/invalid-credential') {
         setAuthErrorMsg('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/email-already-in-use') {
         setAuthErrorMsg('Este e-mail já está registado.');
      } else if (error.code === 'auth/weak-password') {
         setAuthErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      } else {
         setAuthErrorMsg(`Erro: ${error.message}`);
      }
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

  const handleUnlockApiKey = async () => {
    if (user?.email) {
      try {
        setIsApiAuthPending(true);
        await signInWithEmailAndPassword(auth, user.email, apiPasswordAttempt);
        setIsApiKeyUnlocked(true);
        setShowUnlockPrompt(false);
        setApiPasswordAttempt('');
      } catch (error) {
        alert("Senha incorreta!");
      } finally {
        setIsApiAuthPending(false);
      }
    } else {
      if (apiPasswordAttempt === 'admin' || apiPasswordAttempt === '123456') {
        setIsApiKeyUnlocked(true);
        setShowUnlockPrompt(false);
        setApiPasswordAttempt('');
      } else {
        alert("Modo Local: Use a senha 'admin' ou '123456'");
      }
    }
  };

  const handleSaveApiKey = () => {
     const upProf = {...userProfile, geminiApiKey: tempApiKey.trim()};
     setUserProfile(upProf);
     saveToCloud({ userProfile: upProf });
     setIsApiKeyUnlocked(false);
     alert("Chave API salva e bloqueada com sucesso!");
  };

  const handleCompleteWorkout = () => {
    const cur = workouts[activeWorkoutDay];
    let vol = 0; let durationGap = 0;
    let completedExercises = [];
    
    if (isGapMode) {
      durationGap = Number(gapDuration) || 45;
    } else {
      (cur.exercises || []).forEach(ex => {
        vol += (Number(ex.weight)||0) * (Number(ex.reps)||0) * (Number(ex.sets)||0);
        completedExercises.push({
           name: ex.name,
           sets: ex.sets,
           reps: ex.reps,
           weight: ex.weight
        });
        ex.isCompleted = false; // Reset for next time
      });
    }

    const timestamp = Date.now();
    const newLog = { 
      id: timestamp, 
      date: todayStr, 
      timestamp, 
      day: activeWorkoutDay, 
      volume: vol, 
      isGap: isGapMode, 
      gapDuration: durationGap,
      exercises: completedExercises 
    };
    const newHist = [...workoutHistory, newLog];
    
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === todayStr);
    if (idx >= 0) newDLogs[idx].workout = activeWorkoutDay;
    else newDLogs.push({ date: todayStr, workout: activeWorkoutDay, water: 0, calories: totals.calories });

    setWorkoutHistory(newHist); setDailyLogs(newDLogs);
    saveToCloud({ workouts: workouts, workoutHistory: newHist, dailyLogs: newDLogs });
    
    setShowWorkoutSuccess(true);
    setIsGapMode(false);
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

  // --- IA Functions ---
  const callGemini = async (prompt, schema = null) => {
    if (!userProfile.geminiApiKey) throw new Error("Sem API Key configurada.");
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userProfile.geminiApiKey.trim()}`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], ...(schema && {generationConfig: {responseMimeType: "application/json", responseSchema: schema}}) })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data.error?.message || "Falha na chamada da API.");
    }
    
    let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) throw new Error("Resposta vazia da IA.");
    
    if (schema) {
      textOutput = textOutput.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(textOutput);
    }
    return textOutput;
  };

  const handleGenerateDeepInsight = async () => {
    if (!userProfile.geminiApiKey) return setDeepInsightText("❌ Adicione a Chave API no Perfil.");
    setIsDeepInsightLoading(true); setDeepInsightText('');
    try {
      const hist = workoutHistory.slice(-7).map(h => `${h.day}${h.isGap? '(GAP) ':''} ${h.volume}kg`).join(', ');
      const res = await callGemini(`Atue como treinador. Analise o aluno: Objetivo: ${userProfile.goal}. Treinos recentes: ${hist || 'Nenhum'}. Gere 1 parágrafo curto e motivacional de feedback. PT-BR.`);
      setDeepInsightText(res);
    } catch (error) { 
      setDeepInsightText(`Erro IA: ${error.message}`); 
    } finally { 
      setIsDeepInsightLoading(false); 
    }
  };

  const handleGetAnatomyTip = async (exId, exName) => {
    setExpandedDesc(p => ({ ...p, [exId]: !p[exId] })); 
    if (anatomyTipState[exId] === 'done') return; 
    if (!userProfile.geminiApiKey) return setAnatomyTipState(p => ({ ...p, [exId]: 'error' }));
    setAnatomyTipState(p => ({ ...p, [exId]: 'loading' }));
    try {
      const schema = { 
        type: "OBJECT", 
        properties: { 
          intro: { type: "STRING" }, 
          musclesTarget: { type: "STRING" }, 
          musclesAux: { type: "STRING" }, 
          musclesStability: { type: "STRING" }, 
          executionSteps: { type: "ARRAY", items: { type: "STRING" } }, 
          safetyTips: { type: "ARRAY", items: { type: "STRING" } }, 
          mistakes: { type: "ARRAY", items: { type: "STRING" } }, 
          geminiTip: { type: "STRING" } 
        } 
      };
      const res = await callGemini(`Crie um "Guia Rápido" premium para o exercício "${exName}". O foco é o aluno ter resultados sem se lesionar. 
      Retorne estritamente o JSON preenchido: 
      - intro: 1 frase explicativa/motivacional. 
      - executionSteps: 3 a 4 passos práticos formatados como 'Tópico: Explicação' (ex: "Base: Pés firmes..."). 
      - safetyTips: 2 a 3 dicas de proteção articular ou respiração. 
      - mistakes: 2 a 4 erros muito comuns e perigosos. 
      - geminiTip: A dica final de ouro. Em português do Brasil.`, schema);
      
      setAnatomyTips(p => ({ ...p, [exId]: res })); 
      setAnatomyTipState(p => ({ ...p, [exId]: 'done' }));
    } catch (error) { 
      console.error(error);
      setAnatomyTipState(p => ({ ...p, [exId]: 'error' })); 
    }
  };

  const handleAnalyzeFood = async () => {
    if (!chatInput.trim() || !userProfile.geminiApiKey) return;
    const mealName = INITIAL_MEALS.find(m => m.id === selectedMealId)?.name || 'Refeição';
    const userText = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput(''); setIsAnalyzing(true);
    try {
      const macros = await callGemini(`Estime macros exatos para: "${userText}". Retorne estritamente um JSON.`, { type: "OBJECT", properties: { calories: { type: "INTEGER" }, protein: { type: "INTEGER" }, carbs: { type: "INTEGER" }, fats: { type: "INTEGER" } } });
      
      const newLog = {
        id: Date.now(),
        date: todayStr,
        mealId: selectedMealId,
        text: userText,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fats: macros.fats
      };
      
      const updatedLogs = [...nutritionLogs, newLog];
      setNutritionLogs(updatedLogs); 
      saveToCloud({ nutritionLogs: updatedLogs });
      
      setChatMessages(prev => [...prev, { role: 'ai', text: `Adicionado ao feed de ${mealName}!\n🔥 ${macros.calories} kcal | 🥩 ${macros.protein}g P | 🍚 ${macros.carbs}g C | 🥑 ${macros.fats}g G` }]);
    } catch (error) { 
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erro ao analisar dieta: ${error.message}` }]); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  // --- NOVO: GERAR TREINO COM IA ---
  const handleGenerateAIWorkout = async () => {
    if (!userProfile.geminiApiKey) {
      alert("Configure a chave da API Gemini na aba Perfil para gerar treinos personalizados.");
      return;
    }
    setIsGeneratingWorkout(true);
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const dbContext = EXERCISE_DB.map(e => `ID:'${e.id}', Nome:'${e.name}', Grupo:'${e.group}'`).join(' | ');

      const prompt = `Atue como um personal trainer especialista em hipertrofia. O objetivo do usuário é ${userProfile.goal}.
      O treino selecionado para hoje é: "${dayInfo.name}".
      Aqui está a lista de TODOS os exercícios disponíveis no banco de dados:
      ${dbContext}

      REGRAS DE DIVISÃO OBRIGATÓRIAS (Siga rigorosamente a quantidade e os grupos musculares de acordo com o nome do treino):
      - Se for "Treino Pull": selecione EXATAMENTE 3 exercícios de Costas, 1 de Posterior de Ombro e 2 de Bíceps.
      - Se for "Treino Push": selecione EXATAMENTE 3 exercícios de Peito, 2 de Ombros e 2 de Tríceps.
      - Se for "Legs" (Quadríceps, Posterior ou Lower): selecione EXATAMENTE 3 exercícios para Quadríceps, 2 para Posterior da Coxa e 2 para Panturrilhas.
      - Se for "Upper Body": selecione EXATAMENTE 2 exercícios para Costas, 2 para Peito, 1 para Ombro, 1 para Bíceps e 1 para Tríceps.

      IMPORTANTE: Retorne APENAS um JSON contendo a propriedade "exercises" com a lista de IDs selecionados na ordem correta dos grupos. Exemplo: {"exercises": ["e1", "e3", "e9", "e14"]}`;

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
           upd[activeWorkoutDay].exercises = newExercises;
           setWorkouts(upd);
           saveToCloud(upd);
         } else {
           alert("A IA não retornou exercícios compatíveis com o nosso banco de dados. Tente novamente.");
         }
      }
    } catch (error) {
      console.error(error);
      alert(`Erro da IA: ${error.message}`);
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  // --- Lógica Fadiga Muscular ---
  const getFatigueColor = (groupMapArray) => {
    let lastWorkedDate = null;
    const now = Date.now();
    const dayToGroups = {
      'Pull': ['Costas', 'Bíceps', 'Braços'],
      'Push': ['Peito', 'Ombros', 'Tríceps', 'Braços'],
      'Legs 1': ['Pernas', 'Glúteo', 'Quadríceps', 'GAP'],
      'Legs 2': ['Pernas', 'Glúteo', 'Posterior', 'Panturrilha', 'GAP'],
      'Upper': ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Braços'],
      'Lower': ['Pernas', 'Glúteo', 'GAP']
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
    if (!lastWorkedDate) return '#10b981'; // Verde
    const diffHours = (now - lastWorkedDate) / (1000 * 60 * 60);
    if (diffHours < 24) return '#ef4444'; // Vermelho
    if (diffHours < 72) return '#eab308'; // Amarelo
    return '#10b981'; // Verde
  };

  const getCalendarDays = () => {
    const days = []; const today = new Date();
    for(let i=6; i>=0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const dStr = d.toLocaleDateString('pt-BR');
      const log = dailyLogs.find(l => l.date === dStr);
      days.push({ dateNum: d.getDate(), dayStr: d.toLocaleDateString('pt-BR', {weekday:'short'}), hasWorkout: !!log?.workout });
    }
    return days;
  };

  const handleExerciseChange = (id, field, value) => {
    const upd = {...workouts};
    const ex = upd[activeWorkoutDay].exercises.find(x => x.id === id);
    if(ex) ex[field] = value;
    setWorkouts(upd);
  };

  const handleRemoveExercise = (id) => {
    const upd = {...workouts};
    upd[activeWorkoutDay].exercises = upd[activeWorkoutDay].exercises.filter(ex => ex.id !== id);
    setWorkouts(upd);
    saveToCloud(upd);
  };

  // --- SCREENS ---
  if (isAuthLoading || appScreen === 'loading') return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;
  if (firebaseError) return <div className="p-8 bg-zinc-950 text-white"><AlertCircle className="text-red-500 mb-4" size={48}/>{firebaseError}</div>;

  if (!user || appScreen === 'login') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white relative overflow-hidden">
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
        <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthErrorMsg(''); }} className="mt-6 text-sm text-emerald-400 font-bold">
          {isLoginMode ? 'Não tem conta? Registe-se' : 'Já tem conta? Entre'}
        </button>
      </div>
    </div>
  );

  if (appScreen === 'onboarding') return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-6 justify-center">
      <div className="max-w-md w-full mx-auto bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
        <div className="flex mb-8 gap-2">
           <div className={`h-2 flex-1 rounded-full ${onboardingStep>=1 ? 'bg-emerald-500':'bg-zinc-800'}`}></div>
           <div className={`h-2 flex-1 rounded-full ${onboardingStep>=2 ? 'bg-emerald-500':'bg-zinc-800'}`}></div>
           <div className={`h-2 flex-1 rounded-full ${onboardingStep>=3 ? 'bg-emerald-500':'bg-zinc-800'}`}></div>
        </div>

        {onboardingStep === 0 && (
          <div className="text-center animate-fadeIn">
            <ActivitySquare size={64} className="text-emerald-500 mx-auto mb-6" />
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
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Género</label><select value={userProfile.gender} onChange={e=>setUserProfile({...userProfile, gender:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none"><option value="M">Masc</option><option value="F">Fem</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso (kg)</label><input type="number" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Altura (cm)</label><input type="number" value={userProfile.height} onChange={e=>setUserProfile({...userProfile, height:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Objetivo</label>
              <select value={userProfile.goal} onChange={e=>setUserProfile({...userProfile, goal:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none text-emerald-400 font-bold">
                <option>Hipertrofia</option><option>Definição</option><option>Manutenção</option>
              </select>
            </div>
            <button onClick={()=>setOnboardingStep(2)} disabled={!userProfile.name || !userProfile.weight} className="w-full bg-emerald-600 disabled:opacity-50 py-4 rounded-2xl font-bold mt-4">Próximo</button>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="animate-fadeIn space-y-4">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Ruler size={20} className="text-emerald-500"/> Medidas Iniciais (cm)</h2>
             <div className="grid grid-cols-2 gap-3">
               {Object.keys(measurements).map(key => (
                 <div key={key}>
                   <label className="text-[10px] text-zinc-500 font-bold uppercase">{key}</label>
                   <input type="number" value={measurements[key]} onChange={e=>setMeasurements({...measurements, [key]:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none focus:border-emerald-500 text-sm font-bold" />
                 </div>
               ))}
             </div>
             <button onClick={()=>{
               const prof = {...userProfile, onboardingCompleted:true, lastMeasureUpdate: Date.now(), lastLoginDate: todayStr};
               setUserProfile(prof); setAppScreen('main');
               saveToCloud({ userProfile: prof, measurements, weightHistory: [{date: todayStr, weight: Number(userProfile.weight)}] });
             }} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold mt-4">Concluir Setup</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      
      {/* MODAL ALERTA MEDIDAS */}
      {showMeasureAlert && (
        <div className="absolute inset-0 bg-black/80 z-100 flex items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center">
              <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Hora de Atualizar!</h2>
              <p className="text-zinc-400 mb-6 text-sm">Passaram-se 7 dias desde o último registo. Atualize o seu peso e medidas para alimentar a IA.</p>
              
              <div className="space-y-4 text-left mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Atual (kg)</label><input type="number" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none text-emerald-400 font-bold mt-1" /></div>
                 {Object.keys(measurements).map(key => (
                   <div key={key}>
                     <label className="text-[10px] text-zinc-500 font-bold uppercase">{key} (cm)</label>
                     <input type="number" value={measurements[key]} onChange={e=>setMeasurements({...measurements, [key]:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 outline-none font-bold mt-1 text-sm" />
                   </div>
                 ))}
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
          <SidebarBtn a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={20}/>} l="Perfil" />
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
                   
                   {/* Avatar de Fadiga Muscular */}
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
                              {/* Triceps (Costas) */}
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
                              {/* Bíceps (Frente) */}
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

                   {/* Progresso Diário (Macros e Água) */}
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
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Metas de IA Diárias</h3>
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
                  {/* Calendário de Consistência */}
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><CalendarDays size={18}/> Consistência (7 Dias)</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 justify-between">
                      {getCalendarDays().map((d, i) => (
                        <div key={i} className={`flex flex-col items-center p-3 rounded-2xl min-w-14 border ${d.hasWorkout ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">{d.dayStr}</span>
                          <span className="text-lg font-bold text-white mb-2">{d.dateNum}</span>
                          {d.hasWorkout ? <Smile size={20} className="text-emerald-500"/> : <Frown size={20} className="text-zinc-600"/>}
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

                  {/* Feed Semanal de Treinos */}
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Dumbbell size={18} className="text-emerald-500"/> Histórico da Semana</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {workoutHistory.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic text-center py-4">Nenhum treino registado ainda.</p>
                      ) : (
                        workoutHistory.slice(-7).reverse().map(log => (
                          <div key={log.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700 shadow-sm">
                            <div className="flex justify-between items-center mb-3 border-b border-zinc-800/50 pb-3">
                               <div className="flex items-center gap-2">
                                 <span className="font-black text-white text-lg">{log.day}</span>
                                 {log.isGap && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">GAP</span>}
                               </div>
                               <span className="text-xs text-zinc-500 font-bold">{log.date}</span>
                            </div>
                            {log.isGap ? (
                               <p className="text-sm text-zinc-400 font-medium flex items-center gap-2">🔥 Aula GAP • {log.gapDuration} minutos</p>
                            ) : (
                               <div>
                                 <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">Volume Movimentado: <span className="text-emerald-400">{log.volume} kg</span></p>
                                 {log.exercises && log.exercises.length > 0 ? (
                                   <ul className="space-y-2">
                                     {log.exercises.map((ex, i) => (
                                       <li key={i} className="text-xs flex justify-between items-center bg-zinc-900/40 p-2 rounded-lg">
                                         <span className="text-zinc-300 font-medium">{ex.name}</span>
                                         <span className="text-zinc-500 font-bold">{ex.sets}x{ex.reps} {ex.weight ? <span className="text-emerald-500">@{ex.weight}kg</span> : ''}</span>
                                       </li>
                                     ))}
                                   </ul>
                                 ) : (
                                   <p className="text-xs text-zinc-600 italic">Detalhes dos exercícios não foram registados neste dia.</p>
                                 )}
                               </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Consultoria IA */}
                  <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4"><Sparkles className="text-emerald-400" size={20} /> Feedback IA do Treinador</h3>
                    <button onClick={handleGenerateDeepInsight} disabled={isDeepInsightLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                      {isDeepInsightLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Analisar Meu Desempenho
                    </button>
                    {deepInsightText && (
                      <div className="mt-6 text-emerald-100/80 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium">
                        "{deepInsightText}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'treino' && (
             <div className="space-y-6 animate-fadeIn">
               <header className="flex justify-between items-center">
                 <h1 className="text-3xl font-extrabold">Workouts</h1>
                 <button onClick={generateAIPlan} className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Restaurar treino padrão"><RefreshCw size={18}/></button>
               </header>
               
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                 {WORKOUT_DAYS.map(d=><button key={d} onClick={()=>{setActiveWorkoutDay(d); setIsGapMode(false);}} className={`px-6 py-3 shrink-0 rounded-2xl text-sm font-bold transition-all ${activeWorkoutDay===d?'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20':'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}>{d}</button>)}
               </div>

               {/* Controle Especial: Modo GAP para dias de Perna */}
               {workouts[activeWorkoutDay]?.isLegs && (
                 <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><ActivitySquare size={20}/></div>
                     <div>
                       <p className="font-bold text-white text-sm">Aula de GAP?</p>
                       <p className="text-xs text-purple-300/60">Substituir musculação por aula.</p>
                     </div>
                   </div>
                   <button onClick={()=>setIsGapMode(!isGapMode)} className={`w-12 h-6 rounded-full relative transition-colors ${isGapMode?'bg-purple-500':'bg-zinc-800'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isGapMode?'left-7':'left-1'}`}></div>
                   </button>
                 </div>
               )}

               {/* Cabecalho do Treino e Geração IA */}
               {!isGapMode && (
                 <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <h2 className="font-bold text-lg text-white">{workouts[activeWorkoutDay]?.name}</h2>
                    <button onClick={handleGenerateAIWorkout} disabled={isGeneratingWorkout} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 px-3 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600/30 transition-colors border border-emerald-500/30">
                      {isGeneratingWorkout ? <Loader2 size={16} className="animate-spin"/> : <Cpu size={16} />}
                      {isGeneratingWorkout ? "Gerando..." : "Gerar com IA"}
                    </button>
                 </div>
               )}

               {/* Cronómetro Global (se não for GAP) */}
               {!isGapMode && (
                 <div className="bg-zinc-900 p-5 rounded-3xl flex items-center gap-4 border border-zinc-800 shadow-sm">
                   <div className={`p-3 rounded-2xl transition-colors ${isTimerRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-950 text-zinc-500'}`}><Timer size={24} /></div>
                   <div className="font-mono text-3xl font-black w-24 text-center tracking-tighter">{formatTime(timeLeft)}</div>
                   <input type="range" min="30" max="180" step="15" value={timerInterval} onChange={e=>{setTimerInterval(e.target.value); setTimeLeft(e.target.value);}} className="flex-1 accent-emerald-500 h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer" />
                   <button onClick={()=>setIsTimerRunning(!isTimerRunning)} className="p-3 bg-zinc-950 text-white rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-colors shadow-sm">{isTimerRunning ? <Pause size={20}/> : <Play size={20} className="ml-0.5"/>}</button>
                 </div>
               )}

               {isGapMode ? (
                 <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center animate-fadeIn">
                    <Flame size={48} className="text-purple-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-extrabold mb-2">Registo de Aula GAP</h3>
                    <p className="text-zinc-400 text-sm mb-8">Glúteos, Abdómen e Pernas. Indique o tempo da aula.</p>
                    <div className="flex justify-center items-center gap-4 mb-6">
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
                     return (workouts[activeWorkoutDay]?.exercises || []).map((ex, index) => {
                       const showHeader = ex.group !== lastGroup;
                       lastGroup = ex.group;
                       return (
                         <React.Fragment key={ex.id || index}>
                           {showHeader && (
                             <div className="mt-8 mb-2 flex items-center gap-3 animate-fadeIn">
                               <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-800"></div>
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-sm">{ex.group}</span>
                               <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-800"></div>
                             </div>
                           )}
                           <div className={`bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden ${ex.isCompleted?'border-emerald-900/50 bg-emerald-950/10 opacity-70':'border-zinc-800 shadow-lg shadow-black/20'}`}>
                             <div className="p-5 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900">
                               <div className="flex items-center gap-4">
                                 <button onClick={()=>{
                                   const upd = {...workouts}; 
                                   const e = upd[activeWorkoutDay].exercises.find(x=>x.id===ex.id); 
                                   if(e) e.isCompleted = !e.isCompleted; 
                                   if(e?.isCompleted) {setTimeLeft(timerInterval); setIsTimerRunning(true);}
                                   setWorkouts(upd);
                                 }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${ex.isCompleted?'bg-emerald-500 text-zinc-950 scale-95':'bg-zinc-950 text-zinc-600 hover:text-white border border-zinc-800'}`}><Check size={24} strokeWidth={3}/></button>
                                 <div>
                                   <span className="font-extrabold text-lg block leading-tight">{ex.name}</span>
                                   <span className="text-xs text-zinc-500 font-medium">{ex.target}</span>
                                 </div>
                               </div>
                               <div className="flex gap-2">
                                 <button onClick={()=>handleRemoveExercise(ex.id)} className="text-red-400 p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"><Trash2 size={18}/></button>
                                 <button onClick={()=>setExerciseModal({ active: true, mode: 'swap', targetExId: ex.id, filterGroup: EXERCISE_DB.find(d=>d.id===ex.originalId)?.group || 'Geral' })} className="text-zinc-500 p-3 bg-zinc-950 rounded-xl hover:text-white transition-colors border border-zinc-800"><ArrowLeftRight size={18}/></button>
                                 <button onClick={()=>handleGetAnatomyTip(ex.id, ex.name)} className="text-emerald-500 p-3 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"><Sparkles size={18}/></button>
                               </div>
                             </div>
                             
                             <div className="p-5 grid grid-cols-3 gap-4 bg-zinc-950/50">
                                <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Séries</label><input type="number" value={ex.sets} onChange={(e) => handleExerciseChange(ex.id, 'sets', e.target.value)} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                                <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Reps</label><input type="number" value={ex.reps} onChange={(e) => handleExerciseChange(ex.id, 'reps', e.target.value)} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                                <div><label className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider block mb-2 text-center">Carga (kg)</label><input type="number" value={ex.weight} onChange={(e) => handleExerciseChange(ex.id, 'weight', e.target.value)} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center text-emerald-400 font-black border border-emerald-900/30 focus:border-emerald-500 transition-colors shadow-inner" /></div>
                             </div>

                             {/* Dicas IA - GUIA RÁPIDO PREMIUM */}
                             {expandedDesc[ex.id] && (
                               <div className="p-5 text-sm text-zinc-300 bg-zinc-950 border-t border-zinc-800/50">
                                 {anatomyTipState[ex.id] === 'loading' ? (
                                    <div className="flex items-center gap-3 text-emerald-500 font-medium py-8 justify-center"><Loader2 size={24} className="animate-spin"/> Construindo Guia Rápido IA...</div>
                                 ) : anatomyTips[ex.id] ? (
                                   <div className="animate-fadeIn space-y-5">
                                     <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-3">
                                       <Dumbbell size={18} className="text-emerald-500"/>
                                       <h4 className="font-extrabold text-white text-base">Guia Rápido: {ex.name}</h4>
                                     </div>
                                     
                                     <p className="text-zinc-400 leading-relaxed italic">{anatomyTips[ex.id].intro}</p>

                                     <div>
                                       <h5 className="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-widest">1. Musculatura Envolvida</h5>
                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                         <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-1">Alvo Principal</span><span className="font-bold text-white text-xs">{anatomyTips[ex.id].musclesTarget}</span></div>
                                         <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-1">Auxiliares</span><span className="font-bold text-zinc-300 text-xs">{anatomyTips[ex.id].musclesAux}</span></div>
                                         <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-1">Estabilidade</span><span className="font-bold text-zinc-400 text-xs">{anatomyTips[ex.id].musclesStability}</span></div>
                                       </div>
                                     </div>

                                     <div>
                                       <h5 className="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-widest">2. Execução Ideal</h5>
                                       <ul className="space-y-3 mt-3">
                                         {anatomyTips[ex.id].executionSteps?.map((step, i) => {
                                            const parts = step.split(':');
                                            if(parts.length > 1) {
                                               const boldPart = parts.shift() + ':';
                                               return (
                                                 <li key={i} className="text-zinc-300 flex gap-3 items-start leading-snug">
                                                   <CheckCircle2 size={18} className="text-emerald-500/50 shrink-0 mt-0.5"/> 
                                                   <span><strong className="text-white">{boldPart}</strong>{parts.join(':')}</span>
                                                 </li>
                                               );
                                            }
                                            return <li key={i} className="text-zinc-300 flex gap-3 items-start leading-snug"><CheckCircle2 size={18} className="text-emerald-500/50 shrink-0 mt-0.5"/> <span>{step}</span></li>
                                         })}
                                       </ul>
                                     </div>

                                     <div>
                                       <h5 className="font-bold text-blue-400 mb-2 text-xs uppercase tracking-widest">3. Dicas e Segurança</h5>
                                       <ul className="space-y-2 text-zinc-400">
                                         {anatomyTips[ex.id].safetyTips?.map((tip, i) => (
                                           <li key={i} className="flex gap-3 items-start leading-snug"><span className="text-blue-400 mt-0.5 font-bold">•</span> <span>{tip}</span></li>
                                         ))}
                                       </ul>
                                     </div>

                                     <div>
                                       <h5 className="font-bold text-red-400 mb-2 text-xs uppercase tracking-widest">4. Erros para Deletar</h5>
                                       <ul className="space-y-2 text-zinc-400">
                                         {anatomyTips[ex.id].mistakes?.map((mistake, i) => (
                                            <li key={i} className="flex gap-3 items-start leading-snug"><X size={18} className="text-red-500 shrink-0 mt-0.5"/> <span>{mistake}</span></li>
                                         ))}
                                       </ul>
                                     </div>

                                     <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 flex items-start gap-3 mt-6">
                                       <Sparkles size={24} className="text-emerald-400 shrink-0 mt-0.5" />
                                       <div>
                                          <p className="font-bold text-emerald-400 text-xs uppercase tracking-widest mb-1">Dica de Ouro da IA</p>
                                          <p className="font-medium text-emerald-100/90 text-sm leading-snug">"{anatomyTips[ex.id].geminiTip}"</p>
                                       </div>
                                     </div>
                                   </div>
                                 ) : (
                                    <div className="text-center text-red-400 py-4">Erro ao carregar o guia. Tente novamente.</div>
                                 )}
                               </div>
                             )}
                           </div>
                         </React.Fragment>
                       );
                     });
                   })()}

                   {/* Botão Adicionar Novo Exercício */}
                   {workouts[activeWorkoutDay]?.exercises?.length < 7 && (
                     <button onClick={() => setExerciseModal({ active: true, mode: 'add', targetExId: null, filterGroup: null })} className="w-full py-5 bg-zinc-900/50 border-2 border-dashed border-zinc-800 text-zinc-400 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all">
                       <Plus size={20}/> Adicionar Exercício ({workouts[activeWorkoutDay].exercises.length}/7)
                     </button>
                   )}
                 </div>
               )}

               <button onClick={handleCompleteWorkout} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg mt-8 shadow-xl shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2">
                 <Save size={24}/> {isGapMode ? "Salvar Aula GAP" : "Concluir Treino"}
               </button>
             </div>
          )}

          {activeTab === 'nutricao' && (
             <div className="space-y-6 animate-fadeIn pb-12">
               <h1 className="text-3xl font-extrabold">Nutrição</h1>
               
               <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Sparkles className="text-emerald-400" size={18}/> Registar Refeição (IA)</h3>
                 <div className="flex flex-col md:flex-row gap-3 mb-6">
                   <select value={selectedMealId} onChange={e=>setSelectedMealId(e.target.value)} className="bg-zinc-950 p-4 rounded-2xl outline-none border border-zinc-800 text-white font-bold flex-1 focus:border-emerald-500">
                     {INITIAL_MEALS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                   <div className="flex gap-2 flex-2">
                     <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ex: 2 ovos e 1 pão francês..." className="bg-zinc-950 p-4 rounded-2xl flex-1 border border-zinc-800 outline-none focus:border-emerald-500 text-white placeholder:text-zinc-600" />
                     <button onClick={handleAnalyzeFood} disabled={isAnalyzing || !chatInput} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-4 rounded-2xl transition-colors"><Send size={24}/></button>
                   </div>
                 </div>
                 {chatMessages.length > 1 && (
                   <div className="p-5 bg-emerald-950/20 rounded-2xl text-sm whitespace-pre-line text-emerald-100 border border-emerald-900/30 font-medium">
                     {chatMessages[chatMessages.length - 1].text}
                   </div>
                 )}
               </div>

               <h3 className="text-xl font-bold mt-8 mb-4">Metas de Hoje</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm">
                   <p className="text-xs text-orange-500/80 font-bold uppercase mb-1">Kcal</p>
                   <p className="font-black text-2xl text-white mb-1">{totals.calories}</p>
                   <p className="text-[10px] text-zinc-500 font-bold">META: {aiGoals.calories}</p>
                 </div>
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 w-full bg-emerald-500/10 z-0" style={{height: `${Math.min(100, (totals.protein/aiGoals.protein)*100)}%`}}></div>
                   <div className="relative z-10">
                     <p className="text-xs text-emerald-500 font-bold uppercase mb-1">Prot</p>
                     <p className="font-black text-2xl text-white mb-1">{totals.protein}g</p>
                     <p className="text-[10px] text-zinc-500 font-bold">META: {aiGoals.protein}g</p>
                   </div>
                 </div>
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 w-full bg-blue-500/10 z-0" style={{height: `${Math.min(100, (totals.carbs/aiGoals.carbs)*100)}%`}}></div>
                   <div className="relative z-10">
                     <p className="text-xs text-blue-500 font-bold uppercase mb-1">Carb</p>
                     <p className="font-black text-2xl text-white mb-1">{totals.carbs}g</p>
                     <p className="text-[10px] text-zinc-500 font-bold">META: {aiGoals.carbs}g</p>
                   </div>
                 </div>
                 <div className="bg-zinc-900 p-5 rounded-3xl text-center border border-zinc-800 shadow-sm relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 w-full bg-yellow-500/10 z-0" style={{height: `${Math.min(100, (totals.fats/aiGoals.fats)*100)}%`}}></div>
                   <div className="relative z-10">
                     <p className="text-xs text-yellow-500 font-bold uppercase mb-1">Gord</p>
                     <p className="font-black text-2xl text-white mb-1">{totals.fats}g</p>
                     <p className="text-[10px] text-zinc-500 font-bold">META: {aiGoals.fats}g</p>
                   </div>
                 </div>
               </div>

               {/* FEED DE REFEIÇÕES */}
               <div className="mt-8 space-y-4">
                 <h3 className="text-xl font-bold flex items-center gap-2"><Utensils size={20} className="text-emerald-500"/> Diário de Refeições</h3>
                 {todayNutrition.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic bg-zinc-900/30 p-6 rounded-2xl text-center border border-zinc-800/50">Nenhuma refeição registada hoje. Que tal adicionar a sua primeira refeição com a IA?</p>
                 ) : (
                    todayNutrition.map(log => (
                       <div key={log.id} className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800 transition-all hover:border-zinc-700">
                          {editingNutritionId === log.id ? (
                            <div className="space-y-4 animate-fadeIn">
                              <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Descrição</label><input type="text" value={editNutritionData.text} onChange={e=>setEditNutritionData({...editNutritionData, text: e.target.value})} className="w-full bg-zinc-950 p-3 mt-1 rounded-xl text-sm border border-zinc-800 focus:border-emerald-500 outline-none" /></div>
                              <div className="grid grid-cols-4 gap-3">
                                <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Kcal</label><input type="number" value={editNutritionData.calories} onChange={e=>setEditNutritionData({...editNutritionData, calories: e.target.value})} className="w-full bg-zinc-950 p-3 mt-1 rounded-xl text-sm border border-zinc-800 focus:border-emerald-500 outline-none text-center font-bold" /></div>
                                <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Prot (g)</label><input type="number" value={editNutritionData.protein} onChange={e=>setEditNutritionData({...editNutritionData, protein: e.target.value})} className="w-full bg-zinc-950 p-3 mt-1 rounded-xl text-sm border border-zinc-800 focus:border-emerald-500 outline-none text-center font-bold" /></div>
                                <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Carb (g)</label><input type="number" value={editNutritionData.carbs} onChange={e=>setEditNutritionData({...editNutritionData, carbs: e.target.value})} className="w-full bg-zinc-950 p-3 mt-1 rounded-xl text-sm border border-zinc-800 focus:border-emerald-500 outline-none text-center font-bold" /></div>
                                <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gord (g)</label><input type="number" value={editNutritionData.fats} onChange={e=>setEditNutritionData({...editNutritionData, fats: e.target.value})} className="w-full bg-zinc-950 p-3 mt-1 rounded-xl text-sm border border-zinc-800 focus:border-emerald-500 outline-none text-center font-bold" /></div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button onClick={()=>{
                                   const upd = nutritionLogs.map(n => n.id === log.id ? { ...n, ...editNutritionData } : n);
                                   setNutritionLogs(upd); saveToCloud({ nutritionLogs: upd }); setEditingNutritionId(null);
                                }} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded-xl text-sm font-bold text-white flex-1 transition-colors">Salvar</button>
                                <button onClick={()=>setEditingNutritionId(null)} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl text-sm font-bold text-white flex-1 transition-colors">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">{INITIAL_MEALS.find(m=>m.id===log.mealId)?.name || 'Refeição'}</span>
                                <p className="font-extrabold text-white mt-3 text-base leading-snug">{log.text}</p>
                                <p className="text-[11px] text-zinc-400 mt-2 font-bold tracking-widest bg-zinc-950 inline-block px-3 py-1.5 rounded-lg border border-zinc-800/50">🔥 {log.calories} kcal • 🥩 {log.protein}g • 🍚 {log.carbs}g • 🥑 {log.fats}g</p>
                              </div>
                              <div className="flex gap-1 shrink-0 bg-zinc-950 p-1 rounded-xl border border-zinc-800/50">
                                <button onClick={()=>{setEditingNutritionId(log.id); setEditNutritionData(log);}} className="text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all p-2 rounded-lg"><Pencil size={16}/></button>
                                {confirmDeleteId === log.id ? (
                                  <div className="flex items-center gap-1 bg-red-500/10 rounded-lg p-1 animate-fadeIn">
                                    <button onClick={() => {
                                      const upd = nutritionLogs.filter(n => n.id !== log.id);
                                      setNutritionLogs(upd); saveToCloud({ nutritionLogs: upd });
                                      setConfirmDeleteId(null);
                                    }} className="text-red-400 font-bold text-[10px] px-2 py-1 hover:bg-red-500/20 rounded transition-colors">SIM</button>
                                    <button onClick={() => setConfirmDeleteId(null)} className="text-zinc-400 font-bold text-[10px] px-2 py-1 hover:bg-zinc-800 rounded transition-colors">NÃO</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(log.id)} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all p-2 rounded-lg"><Trash2 size={16}/></button>
                                )}
                              </div>
                            </div>
                          )}
                       </div>
                    ))
                 )}
               </div>
             </div>
          )}

          {activeTab === 'perfil' && (
             <div className="space-y-6 animate-fadeIn pb-10">
                <h1 className="text-3xl font-extrabold text-white">Perfil do Atleta</h1>
                
                <div className="bg-linear-to-br from-zinc-900 to-zinc-950 p-8 rounded-3xl border border-zinc-800 flex flex-col md:flex-row items-center gap-8 shadow-xl">
                  <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20 shadow-inner">
                    <UserCircle size={56} className="text-emerald-500" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">{userProfile.name}</h2>
                    <p className="text-zinc-400 font-medium mb-4">{user?.email || "Modo Local"}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                       <span className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-300">{userProfile.age} Anos</span>
                       <span className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-300">{userProfile.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                       <span className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-bold text-emerald-400">Objetivo: {userProfile.goal}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Peso Atual</p>
                    <p className="text-3xl font-black text-white">{userProfile.weight} <span className="text-lg text-zinc-500">kg</span></p>
                  </div>
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">IMC IA</p>
                    <p className={`text-3xl font-black ${bmi > 25 ? 'text-yellow-500' : 'text-emerald-500'}`}>{bmi}</p>
                  </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Ruler size={18}/> Medidas Corporais</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(measurements).map(([k, v]) => (
                      <div key={k} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{k}</span>
                        <p className="font-bold text-lg text-zinc-200">{v || '--'} cm</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setShowMeasureAlert(true)} className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-bold transition-colors">Atualizar Medidas Agora</button>
                </div>

                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Settings size={18}/> Integração IA (Gemini)</h3>
                  
                  {!isApiKeyUnlocked ? (
                    <div className="space-y-4">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex gap-2 items-center"><Key size={14}/> Chave API Atual</label>
                      <div className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-500 text-center tracking-widest">
                        ••••••••••••••••••••••••••••••••
                      </div>
                      
                      {!showUnlockPrompt ? (
                        <button 
                          onClick={() => setShowUnlockPrompt(true)}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors"
                        >
                          Desbloquear para Editar
                        </button>
                      ) : (
                        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 animate-fadeIn mt-4">
                           <p className="text-xs text-zinc-400 mb-3 font-bold">Confirme a sua senha para desbloquear:</p>
                           <div className="flex flex-col sm:flex-row gap-2">
                             <input 
                               type="password" 
                               value={apiPasswordAttempt} 
                               onChange={e => setApiPasswordAttempt(e.target.value)} 
                               placeholder="Sua senha..." 
                               className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex-1 outline-none text-white focus:border-emerald-500"
                             />
                             <button 
                               onClick={handleUnlockApiKey}
                               disabled={isApiAuthPending || !apiPasswordAttempt}
                               className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center"
                             >
                               {isApiAuthPending ? <Loader2 size={18} className="animate-spin" /> : "Validar"}
                             </button>
                           </div>
                           <button onClick={() => {setShowUnlockPrompt(false); setApiPasswordAttempt('');}} className="w-full mt-3 text-xs text-zinc-500 hover:text-zinc-300">Cancelar</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fadeIn">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex gap-2 items-center"><Key size={14}/> Configurar Chave</label>
                      <div className="relative">
                        <input 
                          type={showApiKey ? "text" : "password"} 
                          value={tempApiKey} 
                          onChange={e => setTempApiKey(e.target.value)} 
                          placeholder="Cole a sua chave aqui..." 
                          className="w-full bg-zinc-950 p-4 pr-12 rounded-2xl outline-none font-medium text-emerald-400 border border-emerald-900/50 focus:border-emerald-500 transition-colors" 
                        />
                        <button 
                          onClick={() => setShowApiKey(!showApiKey)} 
                          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold mb-4">Ao salvar, a chave será ocultada e bloqueada para edições acidentais.</p>

                      <button 
                        onClick={handleSaveApiKey}
                        disabled={!tempApiKey}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={18}/> Salvar e Bloquear
                      </button>
                      {userProfile.geminiApiKey && (
                         <button onClick={() => {setIsApiKeyUnlocked(false); setTempApiKey(userProfile.geminiApiKey); setShowUnlockPrompt(false);}} className="w-full text-xs text-zinc-500 hover:text-zinc-300 mt-2">Cancelar Edição</button>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-red-950/20 p-6 rounded-3xl border border-red-900/30">
                   <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2"><AlertCircle size={18}/> Zona de Perigo</h3>
                   <p className="text-xs text-zinc-400 mb-4">Para apagar todos os dados locais, digite a sua senha e confirme.</p>
                   <div className="flex gap-2">
                     <input type="password" value={resetPassAttempt} onChange={e=>setResetPassAttempt(e.target.value)} placeholder="Senha..." className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex-1 outline-none text-white focus:border-red-500"/>
                     <button onClick={()=>{
                       if(resetPassAttempt === userProfile.password || resetPassAttempt === 'resetar') {
                         localStorage.clear(); window.location.reload();
                       } else alert("Senha incorreta!");
                     }} className="bg-red-600 text-white px-4 rounded-xl font-bold">Reset</button>
                   </div>
                </div>

                <button onClick={handleLogout} className="w-full py-5 bg-zinc-900 text-zinc-400 hover:text-white rounded-3xl font-bold border border-zinc-800 flex items-center justify-center gap-2 transition-colors">
                  <LogOut size={20} /> Terminar Sessão
                </button>
             </div>
          )}

          {/* MODAL EXERCÍCIO (SWAP / ADD) */}
          {exerciseModal.active && (
            <div className="fixed inset-0 bg-black/90 z-60 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-zinc-900 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 shadow-2xl h-[85vh] md:max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="font-extrabold text-xl text-white">{exerciseModal.mode === 'swap' ? 'Substituir Exercício' : 'Adicionar Exercício'}</h3>
                  <button onClick={()=>setExerciseModal({active:false, mode:'swap', targetExId:null, filterGroup:null})} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  {(exerciseModal.mode === 'swap' ? EXERCISE_DB.filter(e => e.group === exerciseModal.filterGroup) : EXERCISE_DB).map(ex => (
                    <button key={ex.id} onClick={() => {
                      const upd = {...workouts};
                      const newEx = {id:Date.now(), originalId:ex.id, name:ex.name, target:ex.target, group:ex.group, sets:3, reps:10, weight:'', isCompleted:false};
                      
                      if (exerciseModal.mode === 'swap') {
                        const i = upd[activeWorkoutDay].exercises.findIndex(e=>e.id===exerciseModal.targetExId);
                        if (i > -1) upd[activeWorkoutDay].exercises[i] = newEx;
                      } else {
                        if (!upd[activeWorkoutDay].exercises) upd[activeWorkoutDay].exercises = [];
                        upd[activeWorkoutDay].exercises.push(newEx);
                      }
                      
                      setWorkouts(upd); saveToCloud(upd); 
                      setExerciseModal({active:false, mode:'swap', targetExId:null, filterGroup:null});
                    }} className="w-full text-left bg-zinc-950 p-5 rounded-2xl hover:border-emerald-500 border border-zinc-800 flex justify-between items-center group transition-all">
                      <div>
                        <p className="font-extrabold text-white group-hover:text-emerald-400 transition-colors text-lg">{ex.name}</p>
                        <p className="text-xs text-zinc-500 font-medium mt-1">{ex.target} • {ex.group}</p>
                      </div>
                      {exerciseModal.mode === 'swap' ? <RefreshCw size={20} className="text-zinc-600 group-hover:text-emerald-500 transition-colors"/> : <Plus size={20} className="text-zinc-600 group-hover:text-emerald-500 transition-colors"/>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODAL TREINO CONCLUÍDO */}
          {showWorkoutSuccess && (
            <div className="fixed inset-0 bg-black/90 z-70 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Flame size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Parabéns! 🎉</h2>
                <p className="text-zinc-400 mb-8 text-sm">Treino registado com sucesso. Excelente trabalho em manter a consistência!</p>
                <button 
                  onClick={() => {
                    setShowWorkoutSuccess(false);
                    setActiveTab('dashboard');
                    setDashTab('daily');
                  }} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95"
                >
                  Ver Meu Desempenho
                </button>
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
        <MobileNavButton a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={24}/>} l="Perfil" />
      </nav>
    </div>
  );
}

function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className="text-white">{current} / {target}</span>
      </div>
      <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{width: `${pct}%`}}></div>
      </div>
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