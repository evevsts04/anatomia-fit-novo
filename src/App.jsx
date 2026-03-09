import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  User, 
  Dumbbell, 
  Apple, 
  LayoutDashboard, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  LogOut,
  BrainCircuit,
  Scale,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// --- Configuração Firebase ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fit-ai-pro-v2';

// --- Componentes de UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, type = "button" }) => {
  const styles = {
    primary: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200",
    outline: "border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white"
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={`px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- App Principal ---
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('painel');

  // 1. Monitorar Autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // Mantendo para ambiente de preview, em produção usaria login real
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Erro na autenticação:", err); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Carregar Perfil do Firestore (Regra 1 e 3)
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsub = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setProfile('new');
      }
      setLoading(false);
    }, (err) => {
      console.error("Erro no Firestore:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
    </div>
  );

  if (!user) return <LoginView />;

  if (profile === 'new') return <OnboardingView user={user} onComplete={setProfile} />;

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      {/* Header Fixo */}
      <header className="p-6 flex justify-between items-center border-b border-slate-800 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <BrainCircuit className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">FitAI <span className="text-cyan-400">Pro</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Performance Máxima</p>
          </div>
        </div>
        <button onClick={() => signOut(auth)} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Conteúdo Dinâmico */}
      <main className="p-4 max-w-lg mx-auto space-y-6">
        {activeTab === 'painel' && <DashboardView profile={profile} user={user} />}
        {activeTab === 'treino' && <TrainingView profile={profile} user={user} />}
        {activeTab === 'nutricao' && <NutritionView profile={profile} user={user} />}
        {activeTab === 'perfil' && <ProfileView profile={profile} user={user} />}
      </main>

      {/* Menu Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4 flex justify-around items-center z-50">
        <NavButton icon={<LayoutDashboard size={26} />} active={activeTab === 'painel'} onClick={() => setActiveTab('painel')} label="Painel" />
        <NavButton icon={<Dumbbell size={26} />} active={activeTab === 'treino'} onClick={() => setActiveTab('treino')} label="Treino" />
        <NavButton icon={<Apple size={26} />} active={activeTab === 'nutricao'} onClick={() => setActiveTab('nutricao')} label="Dieta" />
        <NavButton icon={<User size={26} />} active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} label="Perfil" />
      </nav>
    </div>
  );
}

function NavButton({ icon, active, onClick, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center transition-all ${active ? 'text-cyan-400 scale-110' : 'text-slate-600'}`}>
      {icon}
      <span className="text-[9px] mt-1.5 uppercase font-black tracking-tighter">{label}</span>
    </button>
  );
}

// --- VISÕES (VIEWS) ---

function LoginView() {
  const handleLogin = async () => await signInAnonymously(auth);
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-2xl shadow-cyan-500/40">
        <BrainCircuit size={44} className="text-white" />
      </div>
      <h2 className="text-4xl font-black text-white text-center mb-2 tracking-tighter uppercase italic">FitAI <span className="text-cyan-500">Pro</span></h2>
      <p className="text-slate-400 text-center mb-10 max-w-xs">A inteligência artificial aplicada à sua evolução física definitiva.</p>
      <div className="w-full max-w-sm space-y-4">
        <input type="email" placeholder="E-mail" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:outline-none focus:border-cyan-500" />
        <input type="password" placeholder="Senha" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:outline-none focus:border-cyan-500" />
        <Button onClick={handleLogin} className="w-full py-5">Entrar no Ecossistema</Button>
      </div>
    </div>
  );
}

function OnboardingView({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    apelido: "",
    nascimento: "",
    genero: "Masculino",
    altura: "",
    pesoAtual: "",
    objetivo: "hipertrofia",
    nivelAtividade: "moderado",
    perimetria: { braco: "", cintura: "", coxa: "", peitoral: "" }
  });

  const save = async () => {
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const data = { ...formData, setupCompletedAt: new Date().toISOString() };
    await setDoc(profileRef, data);
    onComplete(data);
  };

  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-black uppercase italic italic">Configuração <span className="text-cyan-500">Inicial</span></h2>
          <span className="text-xs font-bold text-slate-500 uppercase">{step}/3</span>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <p className="text-slate-400">Conte-nos um pouco sobre você.</p>
            <input placeholder="Como quer ser chamado?" value={formData.apelido} onChange={e => setFormData({...formData, apelido: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4" />
            <input type="date" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Altura (cm)" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4" />
              <input type="number" placeholder="Peso (kg)" value={formData.pesoAtual} onChange={e => setFormData({...formData, pesoAtual: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <p className="text-slate-400">Qual seu objetivo principal?</p>
            {['Hipertrofia', 'Definição', 'Manutenção'].map(obj => (
              <button key={obj} onClick={() => setFormData({...formData, objetivo: obj.toLowerCase()})} className={`w-full p-5 rounded-2xl border text-left transition-all ${formData.objetivo === obj.toLowerCase() ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/5' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                <div className="font-bold text-lg">{obj}</div>
                <div className="text-[10px] uppercase font-bold opacity-60">Foco em {obj.toLowerCase()}</div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <p className="text-slate-400">Perimetria Atual (em cm)</p>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(formData.perimetria).map(part => (
                <div key={part}>
                  <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">{part}</label>
                  <input type="number" value={formData.perimetria[part]} onChange={e => setFormData({...formData, perimetria: {...formData.perimetria, [part]: e.target.value}})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6">
          {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">Voltar</Button>}
          <Button onClick={() => step < 3 ? setStep(step + 1) : save()} className="flex-1">
            {step === 3 ? "Finalizar" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ profile, user }) {
  const [view, setView] = useState('diario');

  return (
    <div className="space-y-6">
      {/* Selector de Período */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
        <button onClick={() => setView('diario')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'diario' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500'}`}>Diário</button>
        <button onClick={() => setView('mensal')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'mensal' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500'}`}>Desempenho</button>
      </div>

      {view === 'diario' ? (
        <>
          {/* Avatar de Fadiga */}
          <Card className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-black">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black italic uppercase">Mapa de <span className="text-cyan-500">Fadiga</span></h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Status Muscular Atual</p>
              </div>
              <Activity className="text-cyan-500 animate-pulse" />
            </div>
            <div className="flex justify-around items-center py-4">
              <div className="relative">
                {/* SVG Simplificado de Avatar Humano */}
                <svg viewBox="0 0 100 200" className="w-24 h-48 drop-shadow-2xl">
                  <path d="M50 10 C60 10 65 20 65 30 C65 40 60 50 50 50 C40 50 35 40 35 30 C35 20 40 10 50 10 Z" fill="#1e293b" /> {/* Cabeça */}
                  <path d="M35 55 Q50 50 65 55 L75 110 Q50 120 25 110 Z" fill="#1e293b" /> {/* Torso */}
                  <path d="M25 60 L10 110" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" /> {/* Braço E */}
                  <path d="M75 60 L90 110" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" /> {/* Braço D */}
                  <path d="M35 115 L30 190" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" /> {/* Perna E */}
                  <path d="M65 115 L70 190" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" /> {/* Perna D */}
                  
                  {/* Pontos de Fadiga Ativos */}
                  <circle cx="50" cy="75" r="8" fill="#ef4444" className="animate-pulse" /> {/* Peito - Alta Fadiga */}
                  <circle cx="30" cy="160" r="6" fill="#f59e0b" /> {/* Perna - Média */}
                  <circle cx="70" cy="160" r="6" fill="#f59e0b" /> {/* Perna - Média */}
                </svg>
              </div>
              <div className="space-y-3">
                <FadigaStatus label="Peitoral" level="Crítico" color="bg-red-500" />
                <FadigaStatus label="Quadríceps" level="Moderado" color="bg-amber-500" />
                <FadigaStatus label="Costas" level="Recuperado" color="bg-emerald-500" />
              </div>
            </div>
            <div className="mt-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-black">Último registro</span>
              <p className="text-sm font-bold text-white uppercase italic">Hoje eu fiz: <span className="text-cyan-500 font-black">Peito & Tríceps</span></p>
            </div>
          </Card>

          {/* Macros do Dia */}
          <Card>
            <h3 className="text-lg font-black uppercase italic mb-6">Nutrição <span className="text-cyan-500">Diária</span></h3>
            <div className="grid grid-cols-3 gap-4">
              <MacroWidget label="Proteína" current={145} target={180} color="text-orange-500" />
              <MacroWidget label="Carbo" current={220} target={250} color="text-cyan-500" />
              <MacroWidget label="Gordura" current={52} target={65} color="text-yellow-500" />
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Calendário de Rostinhos */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase italic">Calendário de <span className="text-cyan-500">Adesão</span></h3>
              <CalendarIcon size={20} className="text-slate-500" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, i) => {
                const isSuccess = i % 4 !== 0;
                return (
                  <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-xl shadow-inner ${isSuccess ? 'bg-cyan-500/10' : 'bg-red-500/5 opacity-40'}`}>
                    {isSuccess ? '😃' : '😔'}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-around text-[10px] font-black uppercase tracking-tighter">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> Meta Batida</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 opacity-40"></div> Falha no Plano</div>
            </div>
          </Card>

          {/* Análise Profunda IA */}
          <Card className="border-cyan-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <BrainCircuit className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase italic tracking-tighter">Consultoria <span className="text-cyan-400 font-black">IA</span></h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Análise de Desempenho Mensal</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Sua constância em treinos de força subiu 12%. Identificamos um platô nas medidas da cintura, sugere-se ajuste no cardio semanal."
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricSmall label="Treinos" value="22/28" sub="Performance 78%" />
                <MetricSmall label="Peso" value="-1.4kg" sub="Evolução de 30 dias" />
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 text-[10px] py-2 uppercase tracking-widest font-black">Gerar Relatório PDF</Button>
          </Card>

          {/* Lembrete Perimetria Semanal */}
          <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Scale className="text-white" size={20} />
              </div>
              <div>
                <h4 className="font-black uppercase italic text-orange-200 tracking-tighter">Hora da Medição</h4>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Lembrete Semanal</p>
              </div>
            </div>
            <Button variant="secondary" className="px-4 py-2 text-[10px]">Atualizar</Button>
          </div>
        </>
      )}
    </div>
  );
}

function FadigaStatus({ label, level, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-8 rounded-full ${color}`}></div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-white">{level}</p>
      </div>
    </div>
  );
}

function MacroWidget({ label, current, target, color }) {
  const pct = Math.min(100, (current / target) * 100);
  return (
    <div className="text-center space-y-2">
      <div className="relative w-16 h-16 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
            strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * pct) / 100}
            className={`${color} transition-all duration-1000`} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black">{Math.round(pct)}%</span>
        </div>
      </div>
      <p className="text-[9px] font-black uppercase text-slate-500 leading-tight">{label}<br/><span className="text-white">{current}g</span></p>
    </div>
  );
}

function MetricSmall({ label, value, sub }) {
  return (
    <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl">
      <p className="text-[9px] font-black uppercase text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-black text-white italic">{value}</p>
      <p className="text-[8px] font-bold text-cyan-500 uppercase">{sub}</p>
    </div>
  );
}

function TrainingView({ profile }) {
  const [activeEx, setActiveEx] = useState(null);
  const [tips, setTips] = useState("");
  const [loading, setLoading] = useState(false);

  const getTips = async (name) => {
    setActiveEx(name);
    setLoading(true);
    setTips("");
    try {
      const apiKey = "";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Dê dicas profissionais de execução anatômica para o exercício: ${name}. Fale sobre postura e músculo alvo. Seja direto em português do Brasil.` }] }]
        })
      });
      const data = await response.json();
      setTips(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) { setTips("Ocorreu um erro ao carregar as dicas da IA."); }
    finally { setLoading(false); }
  };

  const treinos = [
    { id: 1, nome: "Supino Inclinado", series: "4 x 10", musculo: "Peitoral Superior" },
    { id: 2, nome: "Desenvolvimento Halter", series: "3 x 12", musculo: "Deltoides" },
    { id: 3, nome: "Tríceps Pulley", series: "4 x 15", musculo: "Tríceps Branquial" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-black uppercase italic italic">Sessão <span className="text-cyan-500">Push</span></h2>
        <span className="text-xs font-bold text-slate-500 uppercase">Hoje</span>
      </div>
      <div className="space-y-4">
        {treinos.map(t => (
          <Card key={t.id} className={`transition-all ${activeEx === t.nome ? 'border-cyan-500' : ''}`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-black text-lg uppercase italic tracking-tighter">{t.nome}</h4>
                <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{t.series} • {t.musculo}</p>
              </div>
              <button onClick={() => getTips(t.nome)} className="bg-slate-800 p-3 rounded-2xl hover:bg-cyan-500 hover:text-white transition-all">
                <BrainCircuit size={20} />
              </button>
            </div>
            {activeEx === t.nome && (
              <div className="mt-4 p-4 bg-slate-950 rounded-2xl border-l-4 border-cyan-500 animate-in slide-in-from-top-2">
                {loading ? <div className="animate-pulse h-10 bg-slate-800 rounded"></div> : (
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{tips}</p>
                )}
                <button onClick={() => setActiveEx(null)} className="mt-3 text-[9px] font-black uppercase text-slate-500 hover:text-white">Fechar Instruções</button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Button variant="success" className="w-full py-5 text-lg uppercase italic font-black">Finalizar e Registrar Treino</Button>
    </div>
  );
}

function NutritionView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
        <Apple className="text-slate-700" size={40} />
      </div>
      <div>
        <h2 className="text-xl font-black uppercase italic">Módulo de Nutrição</h2>
        <p className="text-slate-500 text-sm">Registro de refeições e pesagem de alimentos.</p>
      </div>
      <Button variant="outline" className="text-xs">Próxima Atualização</Button>
    </div>
  );
}

function ProfileView({ profile }) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-24 h-24 bg-cyan-500 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-cyan-500/30 rotate-3">
        {profile.apelido?.charAt(0)}
      </div>
      <div>
        <h3 className="text-2xl font-black uppercase italic tracking-tighter">{profile.apelido}</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{profile.objetivo}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-left">
          <p className="text-[10px] font-black uppercase text-slate-500">Peso Atual</p>
          <p className="text-2xl font-black italic">{profile.pesoAtual}kg</p>
        </Card>
        <Card className="text-left">
          <p className="text-[10px] font-black uppercase text-slate-500">Altura</p>
          <p className="text-2xl font-black italic">{profile.altura}cm</p>
        </Card>
      </div>
      <Button variant="secondary" className="w-full">Editar Perfil</Button>
    </div>
  );
}