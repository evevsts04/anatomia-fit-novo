import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Dumbbell, Utensils, UserCircle, Send, 
  Loader2, Sparkles, Check, Play, Pause, Timer, AlertCircle, 
  Smile, Lock, ArrowRightCircle, LogOut, Key, Settings, RefreshCw, ArrowLeftRight, X, Save
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE CONFIG (CONFIGURAÇÃO PARA PUBLICAÇÃO) ---
const manualConfig = {
  apiKey: "COLE_AQUI_A_SUA_API_KEY",
  authDomain: "COLE_AQUI_O_SEU_AUTH_DOMAIN",
  projectId: "COLE_AQUI_O_SEU_PROJECT_ID",
  storageBucket: "COLE_AQUI_O_SEU_STORAGE_BUCKET",
  messagingSenderId: "COLE_AQUI_O_SEU_MESSAGING_SENDER_ID",
  appId: "COLE_AQUI_O_SEU_APP_ID"
};

let app, auth, db, appId = 'hypertrophy-app';
try {
  const configToUse = typeof __firebase_config !== 'undefined' && __firebase_config 
    ? JSON.parse(__firebase_config) 
    : manualConfig;
    
  app = initializeApp(configToUse);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'hypertrophy-app';
} catch (e) {
  console.error("Erro ao configurar Firebase:", e);
}

// --- BANCO DE DADOS DE EXERCÍCIOS ---
const EXERCISE_DB = [
  { id: 'e1', name: 'Supino Halteres', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e2', name: 'Crucifixo Halteres', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e3', name: 'Supino Reto', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e4', name: 'Crossover', target: 'Peitoral Maior', group: 'Peito' },
  { id: 'e5', name: 'Puxada Anterior', target: 'Grande Dorsal', group: 'Costas' },
  { id: 'e6', name: 'Remada Curvada', target: 'Dorsal e Romboides', group: 'Costas' },
  { id: 'e7', name: 'Remada Sentada', target: 'Costas (Média)', group: 'Costas' },
  { id: 'e8', name: 'Crucifixo Invertido', target: 'Deltoide Posterior', group: 'Costas' },
  { id: 'e9', name: 'Desenvolvimento', target: 'Deltoide Anterior', group: 'Ombros' },
  { id: 'e10', name: 'Elevação Lateral', target: 'Deltoide Lateral', group: 'Ombros' },
  { id: 'e11', name: 'Elevação Frontal', target: 'Deltoide Anterior', group: 'Ombros' },
  { id: 'e12', name: 'Rosca Direta', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e13', name: 'Rosca Concentrada', target: 'Braquial', group: 'Braços' },
  { id: 'e14', name: 'Puxador Tríceps', target: 'Tríceps', group: 'Braços' },
  { id: 'e15', name: 'Tríceps Testa', target: 'Tríceps', group: 'Braços' },
  { id: 'e16', name: 'Agachamento Livre', target: 'Quadríceps/Glúteos', group: 'Pernas' },
  { id: 'e17', name: 'Leg Press', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e18', name: 'Cadeira Extensora', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e19', name: 'Mesa Flexora', target: 'Isquiotibiais', group: 'Pernas' },
  { id: 'e20', name: 'Panturrilha em Pé', target: 'Gastrocnêmio', group: 'Pernas' },
  { id: 'e21', name: 'Levantamento Terra', target: 'Posterior/Costas', group: 'Pernas' },
  { id: 'e22', name: 'Elevação Pélvica', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e23', name: 'Cadeira Abdutora', target: 'Glúteo Médio', group: 'GAP' },
  { id: 'e24', name: 'Cadeira Adutora', target: 'Adutores', group: 'GAP' },
  { id: 'e25', name: 'Agachamento Sumô', target: 'Glúteo/Adutores', group: 'GAP' },
  { id: 'e26', name: 'Prancha', target: 'Core/Abdômen', group: 'GAP' },
  { id: 'e27', name: 'Abdominal Cruzado', target: 'Oblíquos', group: 'GAP' },
];

const INITIAL_MEALS = [
  { id: 'm1', name: 'Café da Manhã', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm2', name: 'Lanche Manhã', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm3', name: 'Almoço', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm4', name: 'Lanche Tarde', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm5', name: 'Pré-Treino', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm6', name: 'Jantar', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm7', name: 'Ceia', calories: 0, protein: 0, carbs: 0, fats: 0 },
];
const WORKOUT_DAYS = ['Pull', 'Legs 1', 'Push', 'Legs 2', 'Upper', 'Lower'];

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [appScreen, setAppScreen] = useState('loading'); 

  // Navegação
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashTab, setDashTab] = useState('daily'); 
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showBackAnatomy, setShowBackAnatomy] = useState(false);

  // Autenticação Real (E-mail e Senha)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // IA Funcionalidades
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Olá! Me diga o que você comeu e calcularei as macros.' }]);
  const [chatInput, setChatInput] = useState('');
  const [selectedMealId, setSelectedMealId] = useState('m3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [deepInsightText, setDeepInsightText] = useState('');
  const [isDeepInsightLoading, setIsDeepInsightLoading] = useState(false);
  const [anatomyTips, setAnatomyTips] = useState({});
  const [anatomyTipState, setAnatomyTipState] = useState({});

  // Dados
  const [workouts, setWorkouts] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]); 
  const [activeWorkoutDay, setActiveWorkoutDay] = useState('Pull');
  
  const [userProfile, setUserProfile] = useState({ name: '', height: '', weight: '', goal: 'hypertrophy', onboardingCompleted: false, geminiApiKey: '' });
  const [meals, setMeals] = useState(INITIAL_MEALS);
  
  // UI & Cronômetro
  const [expandedDesc, setExpandedDesc] = useState({});
  const [swapState, setSwapState] = useState({ active: false, exId: null, group: null });
  const [timerInterval, setTimerInterval] = useState(90);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const totals = meals.reduce((acc, m) => ({ calories: acc.calories + (Number(m.calories)||0), protein: acc.protein + (Number(m.protein)||0), carbs: acc.carbs + (Number(m.carbs)||0), fats: acc.fats + (Number(m.fats)||0) }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    if (!auth) {
      setFirebaseError("Falha ao inicializar o Firebase. Verifique as chaves.");
      setIsAuthLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (e) { 
        setFirebaseError(e.message); 
        setIsAuthLoading(false);
      }
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
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v15_dark'); 
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.workouts) setWorkouts(d.workouts);
        if (d.meals) setMeals(d.meals);
        if (d.workoutHistory) setWorkoutHistory(d.workoutHistory);
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        if (d.userProfile) {
          setUserProfile(d.userProfile);
          setAppScreen(c => c === 'loading' ? (d.userProfile.onboardingCompleted ? 'main' : 'onboarding') : c);
        }
      } else {
        generateAIPlan();
        setAppScreen('onboarding');
      }
    }, (error) => setFirebaseError(error.message));
    return () => unsub();
  }, [user, firebaseError]);

  useEffect(() => {
    let int = null;
    if (isTimerRunning && timeLeft > 0) int = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else if (timeLeft === 0 && isTimerRunning) setIsTimerRunning(false);
    return () => clearInterval(int);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (s) => `${Math.floor(s/60)}:${s%60 < 10 ? '0' : ''}${s%60}`;

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
      if (error.code === 'auth/invalid-credential') setAuthErrorMsg('E-mail ou senha incorretos.');
      else if (error.code === 'auth/email-already-in-use') setAuthErrorMsg('Este e-mail já está registado.');
      else if (error.code === 'auth/weak-password') setAuthErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      else setAuthErrorMsg('Erro de autenticação: ' + error.message);
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUser(null);
      setAppScreen('login');
    });
  };

  const saveToCloud = async (overrideData = null) => {
    if (!user || !db) return;
    setIsSyncing(true);
    const today = new Date().toLocaleDateString('pt-BR');
    let newLogs = [...(overrideData?.dailyLogs || dailyLogs)];
    const idx = newLogs.findIndex(l => l.date === today);
    if (idx >= 0) newLogs[idx] = { ...newLogs[idx], calories: totals.calories };
    else newLogs.push({ date: today, calories: totals.calories, workout: null });

    try {
      const dataToSave = overrideData || { workouts, meals, workoutHistory, userProfile, dailyLogs: newLogs };
      if (!overrideData) dataToSave.dailyLogs = newLogs; 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v15_dark'), dataToSave, { merge: true });
      if (!overrideData) setDailyLogs(newLogs);
    } catch (e) { console.error(e); } 
    finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  const getEx = (id) => EXERCISE_DB.find(e => e.id === id);
  const formatEx = (ex, sets, reps) => ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets, reps, weight: '', lastWeight: 0, lastReps: 0, isCompleted: false });
  
  const generateAIPlan = () => {
    const p = {
      'Pull': { name: 'Treino Pull', isGAP: false, exercises: [ formatEx(getEx('e5'), 4, 10), formatEx(getEx('e6'), 3, 10), formatEx(getEx('e7'), 3, 12), formatEx(getEx('e8'), 3, 15), formatEx(getEx('e12'), 4, 10) ]},
      'Legs 1': { name: 'Legs Quadríceps', isGAP: false, exercises: [ formatEx(getEx('e16'), 4, 8), formatEx(getEx('e17'), 3, 12), formatEx(getEx('e18'), 3, 15), formatEx(getEx('e19'), 4, 12), formatEx(getEx('e20'), 4, 20) ]},
      'Push': { name: 'Treino Push', isGAP: false, exercises: [ formatEx(getEx('e1'), 4, 10), formatEx(getEx('e3'), 3, 12), formatEx(getEx('e4'), 3, 15), formatEx(getEx('e9'), 4, 10), formatEx(getEx('e14'), 4, 12) ]},
      'Legs 2': { name: 'Legs Posterior', isGAP: false, exercises: [ formatEx(getEx('e21'), 4, 8), formatEx(getEx('e17'), 3, 12), formatEx(getEx('e19'), 4, 12), formatEx(getEx('e22'), 3, 15), formatEx(getEx('e20'), 4, 20) ]},
      'Upper': { name: 'Upper Body', isGAP: false, exercises: [ formatEx(getEx('e1'), 3, 10), formatEx(getEx('e5'), 3, 10), formatEx(getEx('e9'), 3, 12), formatEx(getEx('e12'), 3, 12), formatEx(getEx('e15'), 3, 12) ]},
      'Lower': { name: 'Lower Body', isGAP: false, exercises: [ formatEx(getEx('e16'), 3, 10), formatEx(getEx('e21'), 3, 10), formatEx(getEx('e18'), 3, 15), formatEx(getEx('e19'), 3, 15), formatEx(getEx('e20'), 4, 15) ]}
    };
    setWorkouts(p); if(userProfile.onboardingCompleted) saveToCloud({ workouts: p });
  };

  const handleCompleteWorkout = () => {
    if(!workouts[activeWorkoutDay]) return;
    const cur = workouts[activeWorkoutDay];
    let vol = 0; let updEx = [];
    if (cur.isGAP) vol = (Number(cur.gapDuration) || 45) * 100;
    else {
      updEx = cur.exercises.map(ex => {
        vol += (Number(ex.weight)||0) * (Number(ex.reps)||0) * (Number(ex.sets)||0);
        return { ...ex, lastWeight: Number(ex.weight)||0, lastReps: Number(ex.reps)||0, isCompleted: false };
      });
    }
    const updW = { ...workouts, [activeWorkoutDay]: { ...cur, exercises: updEx } };
    const today = new Date().toLocaleDateString('pt-BR');
    const shortToday = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    const newLog = { id: Date.now(), date: shortToday, day: activeWorkoutDay, volume: vol };
    const newHist = [...workoutHistory, newLog];
    
    let newDLogs = [...dailyLogs];
    const tIdx = newDLogs.findIndex(l => l.date === today);
    if (tIdx >= 0) newDLogs[tIdx].workout = activeWorkoutDay;
    else newDLogs.push({ date: today, workout: activeWorkoutDay, calories: totals.calories });

    setWorkouts(updW); setWorkoutHistory(newHist); setDailyLogs(newDLogs);
    saveToCloud({ workouts: updW, workoutHistory: newHist, dailyLogs: newDLogs });
  };

  const callGemini = async (prompt, schema = null) => {
    if (!userProfile.geminiApiKey) throw new Error("No API Key");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${userProfile.geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (schema) payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };
    const res = await fetchWithRetry(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    return schema ? JSON.parse(res.candidates[0].content.parts[0].text) : res.candidates[0].content.parts[0].text;
  };

  const handleGenerateDeepInsight = async () => {
    if (!userProfile.geminiApiKey) {
        setDeepInsightText("❌ Chave API não configurada. Por favor, adicione-a na aba Perfil.");
        return;
    }
    setIsDeepInsightLoading(true);
    setDeepInsightText('');
    try {
      const recentVolumes = workoutHistory.slice(-7).map(h => `${h.day}: ${h.volume}kg`).join(' | ');
      const calAdherence = dailyLogs.slice(-7).map(d => `${d.date}: ${d.calories}kcal`).join(', ');

      const res = await callGemini(`Atue como um treinador de elite avaliando o desempenho semanal do usuário ${userProfile.name}.
      Dados: Objetivo: ${userProfile.goal}
      Histórico de Treinos (Últimos 7): ${recentVolumes || 'Poucos treinos.'}
      Histórico de Calorias: ${calAdherence || 'Sem dados.'}
      Analise o cumprimento e gere 1 parágrafo motivacional e 2 sugestões estratégicas. Responda em português do Brasil.`);
      
      setDeepInsightText(res || "Erro na análise.");
    } catch (e) {
      setDeepInsightText("❌ Falha ao contatar a IA. Verifique se a sua chave API é válida.");
    } finally {
      setIsDeepInsightLoading(false);
    }
  };

  const handleGetAnatomyTip = async (exId, exName) => {
    setExpandedDesc(p => ({ ...p, [exId]: !p[exId] })); 
    if (anatomyTipState[exId] === 'done') return; 
    if (!userProfile.geminiApiKey) {
        setAnatomyTipState(p => ({ ...p, [exId]: 'error' }));
        setAnatomyTips(p => ({ ...p, [exId]: { group: "N/A", target: "Erro", auxiliary: "N/A", execution: "Chave API não configurada.", tips: "Vá à aba Perfil para adicionar a sua chave Gemini API." } }));
        return;
    }
    
    setAnatomyTipState(p => ({ ...p, [exId]: 'loading' }));
    try {
      const res = await callGemini(
        `Analise "${exName}". Retorne JSON: {"group": "Grupo", "target": "Alvo", "auxiliary": "Auxiliares", "execution": "Passos curtos", "tips": "1 dica de ouro"}. Em português do Brasil.`,
        { type: "OBJECT", properties: { group:{type:"STRING"}, target:{type:"STRING"}, auxiliary:{type:"STRING"}, execution:{type:"STRING"}, tips:{type:"STRING"} } }
      );
      setAnatomyTips(p => ({ ...p, [exId]: res })); setAnatomyTipState(p => ({ ...p, [exId]: 'done' }));
    } catch { setAnatomyTipState(p => ({ ...p, [exId]: 'error' })); }
  };

  const handleAnalyzeFood = async () => {
    if (!chatInput.trim() || !selectedMealId) return;
    if (!userProfile.geminiApiKey) {
        setChatMessages(prev => [...prev, { role: 'ai', text: "Chave API Gemini não configurada na aba de Perfil." }]);
        return;
    }

    const mealName = meals.find(m => m.id === selectedMealId)?.name || 'Refeição';
    const userText = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsAnalyzing(true);

    try {
      const macros = await callGemini(
        `Estime calorias e macros para: ${userText}. Retorne JSON simples.`,
        { type: "OBJECT", properties: { calories: { type: "INTEGER" }, protein: { type: "INTEGER" }, carbs: { type: "INTEGER" }, fats: { type: "INTEGER" } } }
      );
      
      const updatedMeals = meals.map(m => m.id === selectedMealId ? { ...m, calories: (Number(m.calories) || 0) + macros.calories, protein: (Number(m.protein) || 0) + macros.protein, carbs: (Number(m.carbs) || 0) + macros.carbs, fats: (Number(m.fats) || 0) + macros.fats } : m);
      setMeals(updatedMeals); saveToCloud({ meals: updatedMeals });
      setChatMessages(prev => [...prev, { role: 'ai', text: `Adicionado ao ${mealName}!\n🔥 ${macros.calories} kcal | 🥩 ${macros.protein}g P | 🍚 ${macros.carbs}g C | 🥑 ${macros.fats}g G` }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Erro ao analisar. Verifique a API Key ou tente novamente." }]);
    } finally { setIsAnalyzing(false); }
  };

  const handleExerciseChange = (id, field, value) => {
    const upd = {...workouts};
    const ex = upd[activeWorkoutDay].exercises.find(x => x.id === id);
    if(ex) ex[field] = value;
    setWorkouts(upd);
  };

  // --- SCREENS ---
  if (firebaseError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white font-sans">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold mb-2 text-center">Erro de Conexão</h1>
        <p className="text-zinc-400 text-center mb-6 max-w-md">Não conseguimos aceder à base de dados. Verifique a configuração do Firebase.</p>
        <p className="text-xs text-red-500 bg-red-950/50 p-3 rounded-2xl mt-4 max-w-md break-all border border-red-900">{firebaseError}</p>
      </div>
    );
  }

  if (isAuthLoading || appScreen === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
      </div>
    );
  }
  
  if (!user || appScreen === 'login') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white relative overflow-hidden">
      <div className="max-w-md w-full bg-zinc-900/80 p-8 rounded-3xl shadow-xl shadow-black/50 text-center border border-zinc-800 z-10">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} className="text-emerald-500" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">{isLoginMode ? 'Bem-vindo!' : 'Criar Conta'}</h1>
        <p className="text-zinc-400 text-sm mb-8">{isLoginMode ? 'Aceda à sua conta e treinos.' : 'Junte-se a nós para começar.'}</p>
        
        <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center text-lg mb-4 focus:border-emerald-500 outline-none text-white transition-colors" placeholder="E-mail" />
        <input type="password" id="password" name="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleAuthAction();}} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center tracking-widest text-lg mb-4 focus:border-emerald-500 outline-none text-white transition-colors" placeholder="••••••••" />
        
        {authErrorMsg && <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs p-3 rounded-xl mb-4 font-bold">{authErrorMsg}</div>}
        
        <button onClick={handleAuthAction} disabled={isProcessingAuth} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl mt-2 transition-transform active:scale-95 text-lg flex justify-center items-center h-16">
          {isProcessingAuth ? <Loader2 className="animate-spin" size={24} /> : (isLoginMode ? 'Entrar!' : 'Registar agora')}
        </button>

        <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthErrorMsg(''); }} className="mt-8 text-sm text-zinc-500 font-bold hover:text-emerald-400 transition-colors">
          {isLoginMode ? 'Ainda não tem conta? Registe-se' : 'Já tem uma conta? Entre'}
        </button>
      </div>
    </div>
  );

  if (appScreen === 'onboarding') return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
        {onboardingStep === 0 && (
          <div className="text-center w-full max-w-sm">
            <div className="w-48 h-48 bg-zinc-900 border border-zinc-800 rounded-full mx-auto mb-10 flex items-center justify-center">
              <Dumbbell size={80} className="text-emerald-500" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">AnatomiaFit<br/><span className="text-emerald-500">Dark Mode</span></h1>
            <p className="text-zinc-400 mb-12 text-lg">A sua jornada de hipertrofia suportada por IA.</p>
            <button onClick={()=>setOnboardingStep(1)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-xl flex justify-center items-center gap-2 transition-transform active:scale-95">
              Começar <ArrowRightCircle size={24} />
            </button>
          </div>
        )}

        {onboardingStep === 1 && (
          <div className="w-full max-w-sm bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl text-center">
            <h2 className="text-2xl font-bold mb-6">Qual é o seu nome?</h2>
            <input type="text" id="userName" name="userName" value={userProfile.name} onChange={e=>setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center text-lg mb-6 focus:border-emerald-500 outline-none text-white font-bold" placeholder="O seu nome..." />
            <button onClick={()=>setOnboardingStep(2)} disabled={!userProfile.name} className="w-full bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-2xl font-bold text-lg">Próximo</button>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="w-full max-w-sm bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl text-center">
             <h2 className="text-2xl font-bold mb-6">Suas Medidas</h2>
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Altura (cm)</span>
                  <input type="number" id="userHeight" name="userHeight" value={userProfile.height} onChange={e=>setUserProfile({...userProfile, height: e.target.value})} className="w-full bg-transparent text-center font-bold text-2xl outline-none mt-2 text-white" placeholder="175" />
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Peso (kg)</span>
                  <input type="number" id="userWeight" name="userWeight" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight: e.target.value})} className="w-full bg-transparent text-center font-bold text-2xl outline-none mt-2 text-white" placeholder="70" />
                </div>
             </div>
             <button onClick={()=>{setUserProfile({...userProfile, onboardingCompleted:true}); saveToCloud({...userProfile, onboardingCompleted:true}); setAppScreen('main');}} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg">Finalizar & Começar!</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      
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
        <div className="text-xs text-zinc-500 font-bold">{isSyncing ? 'Salvando...' : 'Nuvem OK'}</div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto w-full relative pb-28 md:pb-8">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40 sticky top-0 z-30">
           <span className="font-bold text-lg text-emerald-400">AnatomiaFit</span>
           <button onClick={()=>setActiveTab('perfil')} className="text-zinc-400"><Settings size={20}/></button>
        </div>
        <div className="max-w-4xl mx-auto p-5 md:p-8 w-full mt-4">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <header className="flex justify-between items-end">
                <h1 className="text-3xl font-bold">Painel</h1>
                <div className="flex bg-zinc-900 rounded-lg p-1">
                  <button onClick={()=>setDashTab('daily')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${dashTab==='daily'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Diário</button>
                  <button onClick={()=>setDashTab('weekly')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${dashTab==='weekly'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Semanal</button>
                </div>
              </header>
              
              {dashTab === 'daily' ? (
                <div className="grid grid-cols-1 gap-5">
                   <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden">
                     <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4 text-center">Fadiga Muscular</h3>
                     <button onClick={() => setShowBackAnatomy(!showBackAnatomy)} className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl transition-all">
                       <RefreshCw size={18} className={showBackAnatomy ? "rotate-180 transition-transform" : "transition-transform"} /> 
                     </button>
                     <div className="flex justify-center h-64 relative">
                       <svg viewBox="0 0 200 360" className="h-full">
                         <ellipse cx="100" cy="180" rx="40" ry="100" fill={showBackAnatomy ? "#3f3f46" : "#27272a"} />
                         <text x="100" y="180" fill="#fff" fontSize="12" textAnchor="middle">{showBackAnatomy ? "Visão Costas" : "Visão Frente"}</text>
                         <text x="100" y="200" fill="#10b981" fontSize="10" textAnchor="middle">IA Visual</text>
                       </svg>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                  <h3 className="text-base font-bold mb-4 text-white">Consistência</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({length:7}).map((_,i)=><div key={i} className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0"><Smile className="text-zinc-600" size={20}/></div>)}
                  </div>
                  <div className="mt-6 border-t border-zinc-800 pt-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4"><Sparkles className="text-emerald-400" size={20} /> Consultoria IA Semanal</h3>
                    <button onClick={handleGenerateDeepInsight} disabled={isDeepInsightLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95">
                      {isDeepInsightLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Gerar Parecer
                    </button>
                    <div className="mt-4 text-zinc-300 text-sm whitespace-pre-line bg-zinc-950 p-4 rounded-xl border border-zinc-800">{deepInsightText || "Clique para analisar os seus treinos e dieta da semana."}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'treino' && (
             <div className="space-y-6 animate-fadeIn">
               <header className="flex justify-between items-center"><h1 className="text-3xl font-bold">Treino</h1><button onClick={generateAIPlan} className="bg-zinc-800 px-3 py-2 rounded-lg text-xs"><RefreshCw size={14}/></button></header>
               
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                 {WORKOUT_DAYS.map(d=><button key={d} onClick={()=>setActiveWorkoutDay(d)} className={`px-5 py-2.5 shrink-0 rounded-full text-sm font-bold transition-colors ${activeWorkoutDay===d?'bg-emerald-500 text-black':'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>{d}</button>)}
               </div>

               {/* Cronómetro */}
               <div className="bg-zinc-900 p-5 rounded-2xl flex items-center gap-4 border border-zinc-800">
                 <div className={`p-3 rounded-full transition-colors ${isTimerRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}><Timer size={24} /></div>
                 <div className="font-mono text-3xl font-bold w-20 text-center">{formatTime(timeLeft)}</div>
                 <input type="range" min="30" max="180" step="15" value={timerInterval} onChange={e=>{setTimerInterval(e.target.value); setTimeLeft(e.target.value);}} className="flex-1 accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                 <button onClick={()=>setIsTimerRunning(!isTimerRunning)} className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors">{isTimerRunning ? <Pause size={20}/> : <Play size={20} className="ml-0.5"/>}</button>
               </div>

               <div className="space-y-4">
                 {(workouts[activeWorkoutDay]?.exercises || []).map(ex => (
                   <div key={ex.id} className={`bg-zinc-900 rounded-2xl border transition-all ${ex.isCompleted?'border-emerald-900 opacity-50':'border-zinc-800'}`}>
                     <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                       <div className="flex items-center gap-3">
                         <button onClick={()=>{
                           const upd = {...workouts}; 
                           const e = upd[activeWorkoutDay].exercises.find(x=>x.id===ex.id); 
                           if(e) e.isCompleted = !e.isCompleted; 
                           if(e?.isCompleted) {setTimeLeft(timerInterval); setIsTimerRunning(true);}
                           setWorkouts(upd); saveToCloud(upd);
                         }} className={`p-2 rounded-full transition-colors ${ex.isCompleted?'bg-emerald-500 text-black':'bg-zinc-800 text-zinc-400 hover:text-white'}`}><Check size={20}/></button>
                         <span className="font-bold text-lg">{ex.name}</span>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={()=>setSwapState({ active: true, exId: ex.id, group: EXERCISE_DB.find(d=>d.id===ex.originalId)?.group || 'Geral' })} className="text-zinc-500 p-2 rounded-full hover:bg-zinc-800 hover:text-white transition-colors"><ArrowLeftRight size={18}/></button>
                         <button onClick={()=>handleGetAnatomyTip(ex.id, ex.name)} className="text-emerald-500 p-2 rounded-full hover:bg-emerald-500/10 transition-colors"><Sparkles size={18}/></button>
                       </div>
                     </div>
                     
                     <div className="p-4 grid grid-cols-3 gap-3 text-center">
                        <div><label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Séries</label><input type="number" value={ex.sets} onChange={(e) => handleExerciseChange(ex.id, 'sets', e.target.value)} onBlur={()=>saveToCloud()} className="w-full bg-zinc-950 p-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                        <div><label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Reps</label><input type="number" value={ex.reps} onChange={(e) => handleExerciseChange(ex.id, 'reps', e.target.value)} onBlur={()=>saveToCloud()} className="w-full bg-zinc-950 p-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                        <div><label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Carga (kg)</label><input type="number" value={ex.weight} onChange={(e) => handleExerciseChange(ex.id, 'weight', e.target.value)} onBlur={()=>saveToCloud()} className="w-full bg-zinc-950 p-3 rounded-xl outline-none text-center text-emerald-400 font-black border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                     </div>

                     {/* IA Dicas Descrição */}
                     {expandedDesc[ex.id] && anatomyTips[ex.id] && (
                       <div className="p-4 text-sm text-zinc-300 bg-zinc-950 border-t border-zinc-800 rounded-b-2xl">
                         {anatomyTipState[exId] === 'loading' ? (
                            <div className="flex items-center gap-2 text-zinc-500"><Loader2 size={16} className="animate-spin"/> Analisando biomecânica...</div>
                         ) : (
                           <>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                               <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[10px] text-zinc-500 block uppercase font-bold">Grupo</span><span className="font-bold text-emerald-400">{anatomyTips[ex.id].group}</span></div>
                               <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[10px] text-zinc-500 block uppercase font-bold">Foco</span><span className="font-bold text-white">{anatomyTips[ex.id].target}</span></div>
                               <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 col-span-2 md:col-span-1"><span className="text-[10px] text-zinc-500 block uppercase font-bold">Auxiliar</span><span className="font-bold text-zinc-400">{anatomyTips[ex.id].auxiliary}</span></div>
                             </div>
                             <p className="mb-3 leading-relaxed"><strong className="text-zinc-500">Execução: </strong>{anatomyTips[ex.id].execution}</p>
                             <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400 font-medium flex gap-2">
                               <Sparkles size={18} className="shrink-0 mt-0.5" />
                               <p>"{anatomyTips[ex.id].tips}"</p>
                             </div>
                           </>
                         )}
                       </div>
                     )}
                   </div>
                 ))}
               </div>

               <button onClick={handleCompleteWorkout} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg mt-6 shadow-lg shadow-emerald-900/50 active:scale-95 transition-all flex items-center justify-center gap-2">
                 <Save size={20}/> Concluir e Salvar
               </button>
             </div>
          )}

          {activeTab === 'nutricao' && (
             <div className="space-y-6 animate-fadeIn">
               <h1 className="text-3xl font-bold">Nutrição</h1>
               
               <div className="grid grid-cols-4 gap-3">
                 <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800">
                   <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Kcal</p>
                   <p className="font-black text-xl text-white">{totals.calories}</p>
                 </div>
                 <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800">
                   <p className="text-xs text-emerald-500/70 font-bold uppercase mb-1">Prot</p>
                   <p className="font-black text-xl text-emerald-400">{totals.protein}g</p>
                 </div>
                 <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800">
                   <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Carb</p>
                   <p className="font-black text-xl text-white">{totals.carbs}g</p>
                 </div>
                 <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800">
                   <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Gord</p>
                   <p className="font-black text-xl text-white">{totals.fats}g</p>
                 </div>
               </div>

               <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                 <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-400"><Sparkles size={20}/> IA Nutrição</h3>
                 <div className="flex gap-2 mb-4">
                   <select value={selectedMealId} onChange={e=>setSelectedMealId(e.target.value)} className="bg-zinc-950 p-4 rounded-xl outline-none border border-zinc-800 text-white font-medium flex-1 focus:border-emerald-500 transition-colors">
                     {meals.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                 </div>
                 <div className="flex gap-2">
                   <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ex: 2 ovos e 1 pão..." className="bg-zinc-950 p-4 rounded-xl flex-1 border border-zinc-800 outline-none focus:border-emerald-500 transition-colors text-white" />
                   <button onClick={handleAnalyzeFood} disabled={isAnalyzing || !chatInput} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-4 rounded-xl transition-colors"><Send size={20}/></button>
                 </div>
                 {chatMessages.length > 1 && (
                   <div className="mt-6 p-5 bg-zinc-950 rounded-2xl text-sm whitespace-pre-line text-zinc-300 border border-zinc-800 font-medium">
                     {chatMessages[chatMessages.length - 1].text}
                   </div>
                 )}
               </div>
             </div>
          )}

          {activeTab === 'perfil' && (
             <div className="space-y-6 animate-fadeIn">
                <h1 className="text-3xl font-bold">Perfil</h1>
                
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <UserCircle size={40} className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{userProfile.name}</h2>
                    <p className="text-zinc-500 font-medium text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-6">
                  <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Peso Atual (kg)</label>
                    <input type="number" value={userProfile.weight} onChange={e=>{setUserProfile({...userProfile, weight:e.target.value}); saveToCloud();}} className="w-full bg-zinc-950 p-4 rounded-2xl mt-2 outline-none font-bold text-xl text-white border border-zinc-800 focus:border-emerald-500 transition-colors" />
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex gap-2 items-center"><Key size={14}/> Gemini API Key</label>
                    <input type="password" value={userProfile.geminiApiKey} onChange={e=>{setUserProfile({...userProfile, geminiApiKey:e.target.value}); saveToCloud();}} placeholder="Sua chave API aqui..." className="w-full bg-zinc-950 p-4 rounded-2xl mt-2 outline-none font-medium text-emerald-400 border border-zinc-800 focus:border-emerald-500 transition-colors" />
                    <p className="text-xs text-zinc-500 mt-2">Necessária para Consultoria e Nutrição IA.</p>
                  </div>
                </div>

                <button onClick={handleLogout} className="w-full py-4 bg-red-950/30 text-red-500 rounded-2xl font-bold mt-4 border border-red-900/50 flex items-center justify-center gap-2 hover:bg-red-900/50 transition-colors">
                  <LogOut size={20} /> Sair da Conta
                </button>
             </div>
          )}

          {/* MODAL SWAP EXERCÍCIO */}
          {swapState.active && (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-black">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Substituir Exercício</h3>
                  <button onClick={()=>setSwapState({active:false, exId:null, group:null})} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {EXERCISE_DB.filter(e => e.group === swapState.group).map(ex => (
                    <button key={ex.id} onClick={() => {
                      const upd = {...workouts};
                      const i = upd[activeWorkoutDay].exercises.findIndex(e=>e.id===swapState.exId);
                      if (i > -1) {
                         upd[activeWorkoutDay].exercises[i] = {id:Date.now(), originalId:ex.id, name:ex.name, target:ex.target, sets:3, reps:10, weight:'', lastWeight:0, lastReps:0, isCompleted:false};
                         setWorkouts(upd); saveToCloud(upd); 
                      }
                      setSwapState({active:false, exId:null, group:null});
                    }} className="w-full text-left bg-zinc-950 p-4 rounded-2xl hover:border-emerald-500 border border-zinc-800 flex justify-between items-center group transition-colors">
                      <div>
                        <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{ex.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{ex.target}</p>
                      </div>
                      <RefreshCw size={18} className="text-zinc-600 group-hover:text-emerald-500 transition-colors"/>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      
      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 flex justify-around p-2 z-50 pb-safe">
        <MobileNavButton a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={24}/>} l="Painel" />
        <MobileNavButton a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={24}/>} l="Treino" />
        <MobileNavButton a={activeTab==='nutricao'} o={()=>setActiveTab('nutricao')} i={<Utensils size={24}/>} l="Nutrição" />
        <MobileNavButton a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={24}/>} l="Perfil" />
      </nav>
    </div>
  );
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
    <button onClick={o} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${a ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
      {i}<span className="text-[10px] mt-1 font-bold">{l}</span>
    </button>
  ); 
}