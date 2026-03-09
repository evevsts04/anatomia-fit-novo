import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Dumbbell, Utensils, UserCircle, Send, 
  Loader2, Sparkles, Activity, Check, Play, AlertCircle, 
  Smile, Frown, Meh, Lock, Droplets, HeartPulse, Moon, Flame, ArrowRightCircle, LogOut, Key
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE CONFIG (CONFIGURAÇÃO PARA PUBLICAÇÃO) ---
const manualConfig = {
  apiKey: "AIzaSyAgJaSl-KRp-ei0ZoMwbOx8G-RZ5BrMJCg",
  authDomain: "anatomiafit.firebaseapp.com",
  projectId: "anatomiafit",
  storageBucket: "anatomiafit.firebasestorage.app",
  messagingSenderId: "627620141777",
  appId: "1:627620141777:web:4490aec5ca990d700843f0"
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
  { id: 'e5', name: 'Puxada Anterior', target: 'Grande Dorsal', group: 'Costas' },
  { id: 'e6', name: 'Remada Curvada', target: 'Dorsal e Romboides', group: 'Costas' },
  { id: 'e9', name: 'Desenvolvimento', target: 'Deltoide Anterior', group: 'Ombros' },
  { id: 'e10', name: 'Elevação Lateral', target: 'Deltoide Lateral', group: 'Ombros' },
  { id: 'e12', name: 'Rosca Direta', target: 'Bíceps Braquial', group: 'Braços' },
  { id: 'e14', name: 'Puxador Tríceps', target: 'Tríceps', group: 'Braços' },
  { id: 'e16', name: 'Agachamento Livre', target: 'Quadríceps/Glúteos', group: 'Pernas' },
  { id: 'e17', name: 'Leg Press', target: 'Quadríceps', group: 'Pernas' },
  { id: 'e19', name: 'Mesa Flexora', target: 'Isquiotibiais', group: 'Pernas' },
  { id: 'e22', name: 'Elevação Pélvica', target: 'Glúteo Máximo', group: 'GAP' },
  { id: 'e26', name: 'Prancha', target: 'Core/Abdômen', group: 'GAP' },
];

const INITIAL_MEALS = [
  { id: 'm1', name: 'Café da Manhã', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm3', name: 'Almoço', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'm6', name: 'Jantar', calories: 0, protein: 0, carbs: 0, fats: 0 },
];
const WORKOUT_DAYS = ['Pull', 'Legs', 'Push', 'Upper', 'Lower', 'GAP'];

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
  const [appScreen, setAppScreen] = useState('loading'); 

  const [activeTab, setActiveTab] = useState('dashboard');
  const [onboardingStep, setOnboardingStep] = useState(0); 
  
  // Autenticação Real (E-mail e Senha)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Olá! Me diga o que você comeu e calcularei as macros.' }]);
  const [chatInput, setChatInput] = useState('');
  const [selectedMealId, setSelectedMealId] = useState('m3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [workouts, setWorkouts] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]); 
  const [activeWorkoutDay, setActiveWorkoutDay] = useState('Pull');
  
  const [userProfile, setUserProfile] = useState({ name: '', height: '', weight: '', goal: 'hypertrophy', onboardingCompleted: false, geminiApiKey: '' });
  const [meals, setMeals] = useState(INITIAL_MEALS);
  
  const [mood, setMood] = useState('good');
  const [waterGlasses, setWaterGlasses] = useState(0);

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
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v14_vibrant'); 
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
    const today = new Date().toLocaleDateString('pt-BR');
    let newLogs = [...(overrideData?.dailyLogs || dailyLogs)];
    const idx = newLogs.findIndex(l => l.date === today);
    if (idx >= 0) newLogs[idx] = { ...newLogs[idx], calories: totals.calories };
    else newLogs.push({ date: today, calories: totals.calories, workout: null });

    try {
      const dataToSave = overrideData || { workouts, meals, workoutHistory, userProfile, dailyLogs: newLogs };
      if (!overrideData) dataToSave.dailyLogs = newLogs; 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v14_vibrant'), dataToSave, { merge: true });
      if (!overrideData) setDailyLogs(newLogs);
    } catch (e) { console.error(e); } 
  };

  const getEx = (id) => EXERCISE_DB.find(e => e.id === id);
  const formatEx = (ex, sets, reps) => ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets, reps, weight: '', isCompleted: false, progress: 0 });
  
  const generateAIPlan = () => {
    const p = {
      'Pull': { name: 'Treino Pull', exercises: [ formatEx(getEx('e5'), 4, 10), formatEx(getEx('e6'), 3, 10), formatEx(getEx('e12'), 4, 10) ]},
      'Legs': { name: 'Legs Quadríceps', exercises: [ formatEx(getEx('e16'), 4, 8), formatEx(getEx('e17'), 3, 12), formatEx(getEx('e19'), 4, 12) ]},
      'Push': { name: 'Treino Push', exercises: [ formatEx(getEx('e1'), 4, 10), formatEx(getEx('e3'), 3, 12), formatEx(getEx('e9'), 4, 10) ]},
      'Upper': { name: 'Upper Body', exercises: [ formatEx(getEx('e1'), 3, 10), formatEx(getEx('e5'), 3, 10), formatEx(getEx('e14'), 3, 12) ]},
      'Lower': { name: 'Lower Body', exercises: [ formatEx(getEx('e16'), 3, 10), formatEx(getEx('e19'), 3, 15), formatEx(getEx('e22'), 4, 15) ]},
      'GAP': { name: 'Glúteo, Abd, Perna', exercises: [ formatEx(getEx('e22'), 4, 12), formatEx(getEx('e26'), 3, 60), formatEx(getEx('e17'), 3, 15) ]}
    };
    setWorkouts(p); if(userProfile.onboardingCompleted) saveToCloud({ workouts: p });
  };

  const handleCompleteWorkout = () => {
    if(!workouts[activeWorkoutDay]) return;
    const cur = workouts[activeWorkoutDay];
    let vol = 0; 
    const updEx = (cur.exercises || []).map(ex => {
      vol += (Number(ex.weight)||0) * (Number(ex.reps)||0) * (Number(ex.sets)||0);
      return { ...ex, isCompleted: false, progress: 0 };
    });
    const updW = { ...workouts, [activeWorkoutDay]: { ...cur, exercises: updEx } };
    
    const shortToday = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const newLog = { id: Date.now(), date: shortToday, day: activeWorkoutDay, volume: vol };
    const newHist = [...workoutHistory, newLog];
    
    setWorkouts(updW); setWorkoutHistory(newHist);
    saveToCloud({ workouts: updW, workoutHistory: newHist });
    alert("Treino concluído com sucesso! 🎉");
  };

  const callGemini = async (prompt, schema = null) => {
    if (!userProfile.geminiApiKey) throw new Error("No API Key");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${userProfile.geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (schema) payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };
    const res = await fetchWithRetry(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    return schema ? JSON.parse(res.candidates[0].content.parts[0].text) : res.candidates[0].content.parts[0].text;
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

  const generateWeekDays = () => {
    const days = []; const today = new Date();
    for(let i=-3; i<=3; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      days.push({ dayStr: d.toLocaleDateString('en-US', {weekday:'short'}), dateNum: d.getDate(), isToday: i===0 });
    }
    return days;
  };

  // --- SCREENS ---
  if (firebaseError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-900 font-sans">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold mb-2 text-center">Erro de Conexão</h1>
        <p className="text-gray-500 text-center mb-6 max-w-md">Não conseguimos aceder à base de dados. Verifique a configuração do Firebase.</p>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
           <p className="font-bold text-red-600 mb-2">Para resolver na Vercel:</p>
           <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2">
             <li>Aceda ao seu painel do Firebase &gt; <b>Authentication</b>.</li>
             <li>Clique na aba "Sign-in method" e ative o fornecedor <b>E-mail/Password</b>.</li>
             <li>Certifique-se que o seu banco de dados Firestore está criado e em modo teste.</li>
           </ul>
        </div>
        <p className="text-xs text-red-500 bg-red-50 p-3 rounded-2xl mt-4 max-w-md break-all">{firebaseError}</p>
      </div>
    );
  }

  if (isAuthLoading || appScreen === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
      </div>
    );
  }
  
  if (!user || appScreen === 'login') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-gray-900 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-lime-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-md w-full bg-white p-8 rounded-4xl shadow-xl shadow-gray-200/50 text-center z-10">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} className="text-orange-500" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">{isLoginMode ? 'Bem-vindo!' : 'Criar Conta'}</h1>
        <p className="text-gray-500 text-sm mb-8">{isLoginMode ? 'Aceda à sua conta e treinos.' : 'Junte-se a nós para começar.'}</p>
        
        <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-center text-lg mb-4 focus:ring-2 focus:ring-orange-500 outline-none font-medium" placeholder="E-mail" />
        <input type="password" id="password" name="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleAuthAction();}} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-center tracking-widest text-lg mb-4 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="••••••••" />
        
        {authErrorMsg && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 font-bold">{authErrorMsg}</div>}
        
        <button onClick={handleAuthAction} disabled={isProcessingAuth} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-2xl mt-2 transition-transform active:scale-95 text-lg flex justify-center items-center h-16">
          {isProcessingAuth ? <Loader2 className="animate-spin" size={24} /> : (isLoginMode ? 'Entrar!' : 'Registar agora')}
        </button>

        <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthErrorMsg(''); }} className="mt-8 text-sm text-gray-500 font-bold hover:text-orange-500 transition-colors">
          {isLoginMode ? 'Ainda não tem conta? Registe-se' : 'Já tem uma conta? Entre'}
        </button>
      </div>
    </div>
  );

  if (appScreen === 'onboarding') return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-lime-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
        {onboardingStep === 0 && (
          <div className="text-center w-full max-w-sm">
            <div className="w-48 h-48 bg-white shadow-2xl shadow-orange-500/20 rounded-[3rem] mx-auto mb-10 flex items-center justify-center transform rotate-3">
              <Activity size={80} className="text-orange-500" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">Welcome to<br/><span className="text-orange-500">Fitness app!</span></h1>
            <p className="text-gray-500 mb-12 text-lg">Acompanhe treinos, saúde e nutrição de forma simples e vibrante.</p>
            <button onClick={()=>setOnboardingStep(1)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 py-5 rounded-4xl font-black text-xl flex justify-center items-center gap-2 shadow-lg shadow-yellow-400/30 transition-transform active:scale-95">
              Start! <ArrowRightCircle size={24} />
            </button>
          </div>
        )}

        {onboardingStep === 1 && (
          <div className="w-full max-w-sm bg-white p-8 rounded-4xl shadow-xl shadow-gray-200/50">
            <h2 className="text-2xl font-bold mb-6 text-center">Qual é o seu nome?</h2>
            <input type="text" id="userName" name="userName" value={userProfile.name} onChange={e=>setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-center text-lg mb-6 focus:ring-2 focus:ring-orange-500 outline-none font-bold" placeholder="O seu nome..." />
            <button onClick={()=>setOnboardingStep(2)} disabled={!userProfile.name} className="w-full bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30">Próximo</button>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="w-full max-w-sm bg-white p-8 rounded-4xl shadow-xl shadow-gray-200/50">
             <h2 className="text-2xl font-bold mb-6 text-center">Suas Medidas</h2>
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <span className="text-xs text-gray-500 font-bold uppercase">Altura (cm)</span>
                  <input type="number" id="userHeight" name="userHeight" value={userProfile.height} onChange={e=>setUserProfile({...userProfile, height: e.target.value})} className="w-full bg-transparent text-center font-bold text-2xl outline-none mt-2" placeholder="175" />
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <span className="text-xs text-gray-500 font-bold uppercase">Peso (kg)</span>
                  <input type="number" id="userWeight" name="userWeight" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight: e.target.value})} className="w-full bg-transparent text-center font-bold text-2xl outline-none mt-2" placeholder="70" />
                </div>
             </div>
             <button onClick={()=>{setUserProfile({...userProfile, onboardingCompleted:true}); saveToCloud({...userProfile, onboardingCompleted:true}); setAppScreen('main');}} className="w-full bg-lime-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-lime-500/30">Finalizar & Começar!</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-500/30 overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 p-6 z-40 rounded-r-4xl shadow-2xl shadow-gray-200/40">
        <div className="flex items-center gap-3 mb-12 pl-2">
          <div className="bg-orange-500 p-2 rounded-xl text-white"><Activity size={24} /></div>
          <span className="font-extrabold text-2xl tracking-tight">AnatomiaFit</span>
        </div>
        <nav className="flex flex-col gap-3 flex-1">
          <SidebarBtn a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={22}/>} l="Painel" c="orange" />
          <SidebarBtn a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={22}/>} l="Workouts" c="lime" />
          <SidebarBtn a={activeTab==='nutricao'} o={()=>setActiveTab('nutricao')} i={<Utensils size={22}/>} l="Nutrição" c="blue" />
          <SidebarBtn a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={22}/>} l="Perfil" c="yellow" />
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto w-full relative pb-28 md:pb-8">
        <div className="max-w-3xl mx-auto p-5 md:p-8 w-full mt-4">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">Hello, {userProfile.name?.split(' ')[0]}</h1>
                  <p className="text-gray-500 font-medium">How do you feel today?</p>
                </div>
                <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                  <button onClick={()=>setMood('bad')} className={`p-2 rounded-xl transition-colors ${mood==='bad'?'bg-red-100 text-red-500':'text-gray-300'}`}><Frown size={20}/></button>
                  <button onClick={()=>setMood('neutral')} className={`p-2 rounded-xl transition-colors ${mood==='neutral'?'bg-yellow-100 text-yellow-500':'text-gray-300'}`}><Meh size={20}/></button>
                  <button onClick={()=>setMood('good')} className={`p-2 rounded-xl transition-colors ${mood==='good'?'bg-lime-100 text-lime-500':'text-gray-300'}`}><Smile size={20}/></button>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                {generateWeekDays().map((d, i) => (
                  <div key={i} className={`snap-center flex flex-col items-center justify-center min-w-18 py-4 rounded-3xl transition-all cursor-pointer ${d.isToday ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">{d.dayStr}</span>
                    <span className={`text-xl font-black ${d.isToday ? 'text-white' : 'text-gray-900'}`}>{d.dateNum}</span>
                  </div>
                ))}
              </div>

              <div className="bg-orange-500 rounded-4xl p-6 shadow-2xl shadow-orange-500/40 text-white relative overflow-hidden flex items-center justify-between">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="z-10">
                  <div className="flex items-center gap-2 mb-2 bg-orange-600/50 w-fit px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Flame size={16} /> <span className="text-sm font-bold">Hoje</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter">
                    {workoutHistory.length > 0 ? workoutHistory[workoutHistory.length-1].volume : 0} <span className="text-xl font-bold opacity-80">Vol</span>
                  </h2>
                  <p className="text-orange-100 font-medium mt-1">Ótimo trabalho até agora!</p>
                </div>
                <div className="relative w-28 h-28 z-10">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="44" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-orange-600/40" />
                    <circle cx="56" cy="56" r="44" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="276" strokeDashoffset={276 - (276 * 0.75)} strokeLinecap="round" className="text-white drop-shadow-md" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={28} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500 rounded-4xl p-5 shadow-xl shadow-blue-500/30 text-white flex flex-col justify-between cursor-pointer transition-transform active:scale-95" onClick={()=>setWaterGlasses(p=>p+1)}>
                  <div className="flex justify-between items-start mb-4">
                     <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md"><Droplets size={24} /></div>
                     <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">Toque</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">{waterGlasses * 0.25} <span className="text-sm opacity-80 font-bold">Liters</span></h3>
                    <p className="text-blue-100 text-sm font-medium mt-1">Hydration - {waterGlasses} copos</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-500 p-3 rounded-2xl"><Moon size={24}/></div>
                    <div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Sleep</p>
                      <p className="text-gray-900 font-black text-xl">8.0 <span className="text-sm font-bold text-gray-400">hour</span></p>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-red-50 text-red-500 p-3 rounded-2xl"><HeartPulse size={24}/></div>
                    <div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Heart Rate</p>
                      <p className="text-gray-900 font-black text-xl">90<span className="text-sm font-bold text-gray-400">bpm</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'treino' && (
             <div className="space-y-6 animate-fadeIn">
               <h1 className="text-3xl font-extrabold text-gray-900">Workouts</h1>
               
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
                 {WORKOUT_DAYS.map(d=><button key={d} onClick={()=>setActiveWorkoutDay(d)} className={`snap-center px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeWorkoutDay===d?'bg-gray-900 text-white shadow-xl shadow-gray-900/20':'bg-white text-gray-400 border border-gray-100'}`}>{d}</button>)}
               </div>

               <div className="space-y-4">
                 {(workouts[activeWorkoutDay]?.exercises || []).map(ex => {
                   const progressPercent = ex.isCompleted ? 100 : Math.min(100, Math.max(0, (ex.progress || 0) * 20)); 
                   return (
                   <div key={ex.id} className="bg-white rounded-4xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-4">
                       <div>
                         <h3 className="font-black text-lg text-gray-900">{ex.name}</h3>
                         <p className="text-gray-400 text-sm font-medium">{ex.sets} Sets x {ex.reps} Reps</p>
                       </div>
                       <button onClick={()=>{
                           const upd = {...workouts}; 
                           const e = upd[activeWorkoutDay].exercises.find(x=>x.id===ex.id); 
                           if(e) { e.isCompleted = !e.isCompleted; e.progress = e.isCompleted ? 5 : 0; }
                           setWorkouts(upd); saveToCloud(upd);
                         }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${ex.isCompleted?'bg-lime-500 text-white shadow-lg shadow-lime-500/40':'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/40 hover:scale-105'}`}>
                         {ex.isCompleted ? <Check size={28} strokeWidth={3}/> : <Play size={28} strokeWidth={3} className="ml-1"/>}
                       </button>
                     </div>
                     
                     <div className="flex items-center gap-3">
                       <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 rounded-full ${ex.isCompleted ? 'bg-lime-500' : 'bg-orange-500'}`} style={{width: `${progressPercent}%`}}></div>
                       </div>
                       <span className="text-xs font-bold text-gray-400">{progressPercent}%</span>
                     </div>

                     <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        <input type="number" value={ex.weight} onChange={(e) => {
                          const upd = {...workouts}; 
                          const i = upd[activeWorkoutDay].exercises.find(x=>x.id===ex.id);
                          if(i) i.weight = e.target.value;
                          setWorkouts(upd);
                        }} placeholder="Carga (kg)" className="bg-gray-50 text-gray-900 rounded-xl px-4 py-2 text-sm font-bold w-full outline-none focus:ring-2 focus:ring-orange-500" />
                     </div>
                   </div>
                 )})}
               </div>

               <button onClick={handleCompleteWorkout} className="w-full py-5 bg-gray-900 text-white rounded-4xl font-black text-lg mt-4 shadow-xl shadow-gray-900/20 active:scale-95 transition-transform">Complete Workout</button>
             </div>
          )}

          {activeTab === 'nutricao' && (
             <div className="space-y-6 animate-fadeIn">
               
               <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-end mb-6">
                   <div>
                     <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Calories</p>
                     <h2 className="text-4xl font-black text-gray-900">{totals.calories} <span className="text-lg text-gray-400">kcal</span></h2>
                   </div>
                   <div className="text-right">
                     <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Time</p>
                     <h2 className="text-2xl font-black text-gray-900">641 <span className="text-sm text-gray-400">min</span></h2>
                   </div>
                 </div>
                 <div className="h-24 w-full relative">
                    <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <path d="M 0 80 Q 40 20 80 50 T 160 40 T 240 70 T 300 30" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"/>
                      <circle cx="240" cy="70" r="5" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                      <circle cx="300" cy="30" r="5" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                    </svg>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                 <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 text-center">
                   <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Protein</p>
                   <p className="font-black text-xl text-orange-700">{totals.protein}g</p>
                 </div>
                 <div className="bg-lime-50 p-4 rounded-3xl border border-lime-100 text-center">
                   <p className="text-[10px] text-lime-600 font-bold uppercase tracking-wider mb-1">Carbs</p>
                   <p className="font-black text-xl text-lime-700">{totals.carbs}g</p>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 text-center">
                   <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Fat</p>
                   <p className="font-black text-xl text-blue-700">{totals.fats}g</p>
                 </div>
               </div>

               <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 mt-4">
                 <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2"><Sparkles className="text-yellow-500" size={20}/> Log Food</h3>
                 <div className="flex gap-2 mb-4">
                   <select value={selectedMealId} onChange={e=>setSelectedMealId(e.target.value)} className="bg-gray-50 p-3 rounded-2xl outline-none border border-gray-100 font-bold text-gray-700 flex-1">{meals.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
                 </div>
                 <div className="flex gap-2">
                   <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ex: 2 ovos e 1 pão..." className="bg-gray-50 p-4 rounded-2xl flex-1 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                   <button onClick={handleAnalyzeFood} disabled={isAnalyzing || !chatInput} className="bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-transform active:scale-95"><Send size={20}/></button>
                 </div>
                 {chatMessages.length > 1 && <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-sm whitespace-pre-line text-gray-600 font-medium border border-gray-100">{chatMessages[chatMessages.length - 1].text}</div>}
               </div>
             </div>
          )}

          {activeTab === 'perfil' && (
             <div className="space-y-6 animate-fadeIn">
                <h1 className="text-3xl font-extrabold text-gray-900">Profile</h1>
                
                <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 relative">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <UserCircle size={48} className="text-orange-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{userProfile.name}</h2>
                  <p className="text-gray-500 font-medium">Account: {user.email}</p>
                </div>

                <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Weight (kg)</label>
                  <input type="number" id="profileWeight" name="profileWeight" value={userProfile.weight} onChange={e=>{setUserProfile({...userProfile, weight:e.target.value}); saveToCloud();}} className="w-full bg-gray-50 p-4 rounded-2xl mt-2 outline-none font-black text-xl text-gray-900 focus:ring-2 focus:ring-orange-500" />
                </div>
                
                <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex gap-2 items-center"><Key size={14}/> Gemini API Key</label>
                  <input type="password" id="geminiKey" name="geminiKey" value={userProfile.geminiApiKey} onChange={e=>{setUserProfile({...userProfile, geminiApiKey:e.target.value}); saveToCloud();}} placeholder="Sua chave API aqui..." className="w-full bg-gray-50 p-4 rounded-2xl mt-2 outline-none font-medium text-gray-900 focus:ring-2 focus:ring-blue-500" />
                </div>

                <button onClick={handleLogout} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold mt-4 shadow-sm border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <LogOut size={20} /> Sair da Conta
                </button>
             </div>
          )}
        </div>
      </main>
      
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-3 z-50 rounded-t-4xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-safe">
        <MobileNavButton a={activeTab==='dashboard'} o={()=>setActiveTab('dashboard')} i={<LayoutDashboard size={24}/>} c="orange" />
        <MobileNavButton a={activeTab==='treino'} o={()=>setActiveTab('treino')} i={<Dumbbell size={24}/>} c="lime" />
        <MobileNavButton a={activeTab==='nutricao'} o={()=>setActiveTab('nutricao')} i={<Utensils size={24}/>} c="blue" />
        <MobileNavButton a={activeTab==='perfil'} o={()=>setActiveTab('perfil')} i={<UserCircle size={24}/>} c="yellow" />
      </nav>
    </div>
  );
}

function SidebarBtn({ a, o, i, l, c }) { 
  const colorMap = {
    'orange': a ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:bg-gray-50 hover:text-orange-500',
    'lime': a ? 'bg-lime-50 text-lime-600' : 'text-gray-400 hover:bg-gray-50 hover:text-lime-500',
    'blue': a ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50 hover:text-blue-500',
    'yellow': a ? 'bg-yellow-50 text-yellow-700' : 'text-gray-400 hover:bg-gray-50 hover:text-yellow-600',
  };
  return (
    <button onClick={o} className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${colorMap[c]}`}>
      {i}<span className="text-base">{l}</span>
    </button>
  ); 
}

function MobileNavButton({ a, o, i, c }) { 
  const colorMap = {
    'orange': 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 -translate-y-2',
    'lime': 'bg-lime-500 text-white shadow-lg shadow-lime-500/30 scale-110 -translate-y-2',
    'blue': 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110 -translate-y-2',
    'yellow': 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/30 scale-110 -translate-y-2',
  };
  return (
    <button onClick={o} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${a ? colorMap[c] : 'text-gray-300 hover:text-gray-500'}`}>
      {i}
    </button>
  ); 
}