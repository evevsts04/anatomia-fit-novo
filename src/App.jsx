import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Dumbbell, UserCircle, Loader2, Check, Play, Pause, Timer,
  Smile, Frown, Flame, LogOut, Settings, RefreshCw, X, Save, Plus, Trash,
  Activity, Youtube, Square, Search, Trophy, ArrowLeftRight, ChevronDown,
  ChevronUp, Info, RotateCcw, History
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, orderBy, limit
} from 'firebase/firestore';

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
  const configToUse = typeof __firebase_config !== 'undefined' && __firebase_config
    ? JSON.parse(__firebase_config)
    : firebaseConfig;
  app = initializeApp(configToUse);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : 'hypertrophy-app';
} catch (e) {
  console.error("Erro ao configurar Firebase:", e);
}

// --- ERROR BOUNDARY (IMPEDE TELA EM BRANCO) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Erro inesperado na renderização.' };
  }
  componentDidCatch(error, info) {
    console.error("Erro capturado pelo ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/40 p-6 rounded-3xl text-center">
            <h2 className="text-xl font-extrabold text-red-400 mb-2">Algo deu errado</h2>
            <p className="text-xs text-zinc-400 mb-6 break-words">{this.state.errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CATÁLOGO UNIFICADO (CALISTENIA + 50 EXERCÍCIOS DE MUSCULAÇÃO) ---
// Todas as dicas ficam salvas localmente/banco de dados, sem consumo de IA.
const EXERCISE_CATALOG = {
  // === CALISTENIA ===
  c_polichinelo: { id: 'c_polichinelo', name: 'Polichinelo', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=PzcfeU7z-so', tips: 'Aterrisse suavemente na ponta dos pés mantendo o abdômen contraído e ritmo constante.' },
  c_barra: { id: 'c_barra', name: 'Barra', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=ajQVjMaLlqc', tips: 'Inicie o movimento deprimindo as escápulas. Puxe o peito em direção à barra sem balançar as pernas.' },
  c_prancha: { id: 'c_prancha', name: 'Prancha', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=jYot_qHqe74', tips: 'Mantenha o corpo em linha reta dos ombros aos tornozelos. Contraia glúteos e abdômen evitando queda da lombar.' },
  c_flexao_joelhos: { id: 'c_flexao_joelhos', name: 'Flexão de joelhos', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=OlxjeX0sBps', tips: 'Mantenha o quadril alinhado com o tronco, cotovelos a cerca de 45° do corpo e desça até o peito quase tocar o solo.' },
  c_agachamento_salto: { id: 'c_agachamento_salto', name: 'Agachamento c/ salto', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=-fxfaZyPekA', tips: 'Desça com controle, exploda para cima estendendo tornozelos e quadris e absorva o impacto já iniciando o próximo agachamento.' },
  c_pe_bunda: { id: 'c_pe_bunda', name: 'Pé na bunda', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=mBlwreuTnpo', tips: 'Mantenha o tronco levemente inclinado à frente, elevando os calcanhares rapidamente em direção aos glúteos.' },
  c_barra_aust_amf: { id: 'c_barra_aust_amf', name: 'Barra australiana (A, M, F)', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=Wjl-s8e2BAI', tips: 'Alterne entre pegada Aberta, Média e Fechada mantendo o corpo reto como uma prancha e puxando o peito até a barra.' },
  c_flexao_inclinada: { id: 'c_flexao_inclinada', name: 'Flexão inclinada', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=cVQEwAnIrg8', tips: 'Apoie as mãos em uma superfície elevada e firme. Controle a descida e empurre contraindo o peitoral inferior.' },
  c_step_up: { id: 'c_step_up', name: 'Step-up', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=EwGSkVbolog&t=7s', tips: 'Apoie o pé inteiro na superfície elevada e empurre pelo calcanhar da perna de cima sem dar impulso com a perna de baixo.' },
  c_agachamento: { id: 'c_agachamento', name: 'Agachamento', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=yf0iaWo3Vok&t=3s', tips: 'Pés na largura dos ombros, joelhos alinhados com a ponta dos pés. Desça até quebrar a paralela mantendo o peito aberto.' },
  c_afundo: { id: 'c_afundo', name: 'Afundo', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=583NYYpfZUc', tips: 'Dê um passo firme mantendo o tronco ereto. Desça o joelho de trás em direção ao chão formando ângulos de 90°.' },
  c_afundo_elev: { id: 'c_afundo_elev', name: 'Afundo c/ elevação', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=aoHd1uwwYfA', tips: 'Execute o afundo e ao subir eleve o joelho de trás à frente com controle de equilíbrio e core ativado.' },
  c_sumo: { id: 'c_sumo', name: 'Sumo', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=Ra_HbE3e14E', tips: 'Afaste bem os pés com pontas voltadas para fora. Empurre os joelhos para fora na descida para ativar adutores e glúteos.' },
  c_isometria: { id: 'c_isometria', name: 'Isometria', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=MvbwxP1b1Ik', tips: 'Mantenha o ângulo de 90° nos joelhos com peso distribuído no meio do pé e respiração controlada.' },
  c_pantu_unilateral: { id: 'c_pantu_unilateral', name: 'Pantu unilateral', modality: 'Calistenia', group: 'Panturrilha', videoUrl: 'https://www.youtube.com/watch?v=Z2LKbJs01h4', tips: 'Use um degrau para amplitude máxima: alongue bem o calcanhar na descida e faça uma pausa de 1s no topo.' },
  c_skipping: { id: 'c_skipping', name: 'Skipping', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=U9Dta1MTjvA', tips: 'Eleve os joelhos até a linha do quadril coordenando com o movimento ativo dos braços.' },
  c_dips: { id: 'c_dips', name: 'Dips', modality: 'Calistenia', group: 'Tríceps', videoUrl: 'https://www.youtube.com/watch?v=1PgT3N7utEM', tips: 'Mantenha os ombros longe das orelhas. Desça até os cotovelos atingirem 90° e suba estendendo completamente.' },
  c_prancha_lateral: { id: 'c_prancha_lateral', name: 'Prancha lateral', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=T9Fuqym8pYA', tips: 'Alinhe o cotovelo diretamente abaixo do ombro e empurre o quadril para cima mantendo o corpo reto.' },
  c_triceps_trave: { id: 'c_triceps_trave', name: 'Tríceps na trave', modality: 'Calistenia', group: 'Tríceps', videoUrl: 'https://www.youtube.com/watch?v=gDvXtve8ezk', tips: 'Mantenha os cotovelos apontados para a frente e fechados; flexione apenas os cotovelos levando a testa à barra.' },
  c_alternado: { id: 'c_alternado', name: 'Alternado', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=xXloZWAG2O0', tips: 'Mantenha a lombar pressionada contra o solo e controle o movimento das pernas sem usar impulso.' },
  c_flexao: { id: 'c_flexao', name: 'Flexão', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=kIQnL_cgJls', extraVideos: [{ label: 'Flexão', url: 'https://www.youtube.com/watch?v=kIQnL_cgJls' }, { label: 'Flexão de joelhos', url: 'https://www.youtube.com/watch?v=OlxjeX0sBps' }], tips: 'Corpo rígido em prancha, mãos levemente mais abertas que os ombros, cotovelos a 45° e amplitude total.' },
  c_crunches: { id: 'c_crunches', name: 'Crunches', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=xTl1hDKWXoU', tips: 'Enrole a coluna retirando as escápulas do chão sem puxar o pescoço com as mãos. Expire ao subir.' },
  c_false_rope: { id: 'c_false_rope', name: 'False rope', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=QY6pmUW9Bis', tips: 'Simule o pulo de corda com saltos baixos e rápidos na ponta dos pés, girando os punhos.' },
  c_barra_amf: { id: 'c_barra_amf', name: 'Barra (A, M, F)', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=0B-5g7H0Oac', extraVideos: [{ label: 'Aberta', url: 'https://www.youtube.com/watch?v=0B-5g7H0Oac' }, { label: 'Média', url: 'https://www.youtube.com/watch?v=oJCb2Wa0qa8' }, { label: 'Fechada', url: 'https://www.youtube.com/watch?v=s9zVI4wljZc' }], tips: 'Execute as repetições em sequência na pegada Aberta, Média e Fechada controlando a descida em cada fase.' },
  c_toe_touches: { id: 'c_toe_touches', name: 'Toe touches', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=-OvM3KPmNxU', tips: 'Pernas estendidas para o alto; eleve o tronco tentando alcançar a ponta dos pés usando o reto abdominal.' },
  c_barra_sup_media: { id: 'c_barra_sup_media', name: 'Barra supinada média', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=Q-_iswhI64s', tips: 'Palmas voltadas para você na largura dos ombros. Puxe o queixo acima da barra focando em dorsais e bíceps.' },
  c_leg_flutters: { id: 'c_leg_flutters', name: 'Leg flutters', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=InosskqnsL8', tips: 'Pressione a lombar no chão; faça movimentos curtos e rápidos de tesoura com as pernas estendidas.' },
  c_biceps_barra: { id: 'c_biceps_barra', name: 'Bíceps na barra', modality: 'Calistenia', group: 'Bíceps', videoUrl: 'https://www.youtube.com/watch?v=g86hIMVUiFw', tips: 'Na barra baixa em pegada supinada, mantenha os cotovelos altos e puxe a testa em direção às mãos isolando o bíceps.' },
  c_half_burpee: { id: 'c_half_burpee', name: 'Half burpee', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=jsm_68d6KwA', tips: 'Salte os pés para trás caindo em prancha firme (sem deixar o quadril afundar) e retorne rápido para ficar em pé.' },
  c_flexao_pike: { id: 'c_flexao_pike', name: 'Flexão pike', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=ZL9s2p86pOQ', tips: 'Forme um V invertido com o quadril alto. Leve a cabeça à frente da linha das mãos na descida para focar nos deltoides.' },
  c_bike: { id: 'c_bike', name: 'Bike', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=lLdH7a_FejU', tips: 'Gire o tronco levando o ombro (não apenas o cotovelo) em direção ao joelho oposto enquanto estende a outra perna.' },
  c_flexao_militar: { id: 'c_flexao_militar', name: 'Flexão militar', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=01uSiP_xc_0', tips: 'Mãos na linha dos ombros e cotovelos rentes ao tronco durante toda a descida e subida.' },
  c_side_crunches: { id: 'c_side_crunches', name: 'Side crunches', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=b2V9Cb172ys&t=1s', tips: 'Deitado de lado, contraia os oblíquos aproximando as costelas do quadril de forma controlada.' },
  c_pike_caminhada: { id: 'c_pike_caminhada', name: 'Pike caminhada', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=iA5gpIDXin8', tips: 'Mantenha o quadril elevado e braços firmes enquanto desloca mãos e pés coordenadamente.' },
  c_prancha_alta_trave: { id: 'c_prancha_alta_trave', name: 'Prancha alta p/ trave', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=X2M05IDryPg', tips: 'Evite balançar excessivamente o quadril ao alternar o apoio das mãos para os antebraços/trave.' },
  c_caminhada_chao: { id: 'c_caminhada_chao', name: 'Caminhada chão', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=aPhOXSEsGh8', tips: 'Mantenha pernas estendidas, caminhe com as mãos até a posição de prancha e retorne controlando o core.' },
  c_ombro_ombro: { id: 'c_ombro_ombro', name: 'Ombro p/ ombro', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=Q17-H9HeGYU', tips: 'Estabilize o tronco e transfira o peso lateralmente de um braço para o outro com controle.' },
  c_afundo_saltando: { id: 'c_afundo_saltando', name: 'Afundo saltando', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=TzY19i9ciG4', tips: 'Troque as pernas no ar com explosão, aterrissando suavemente com o joelho alinhado.' },
  c_afundo_explosivo: { id: 'c_afundo_explosivo', name: 'Afundo explosivo', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=bNEQDPvXxEg', tips: 'Impulsione verticalmente mantendo o tronco estável e focando na potência da perna da frente.' },
  c_passada_lateral: { id: 'c_passada_lateral', name: 'Passada lateral', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=xSbjQpYRjT8', tips: 'Empurre o quadril para trás na perna que flexiona mantendo a outra perna completamente estendida.' },
  c_iso_afundo: { id: 'c_iso_afundo', name: 'Iso afundo', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=FTQxzcCcHws', tips: 'Segure a posição mais baixa do afundo com o joelho de trás a poucos centímetros do chão.' },
  c_heel_taps: { id: 'c_heel_taps', name: 'Heel taps', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=3NsHglKdh7o', tips: 'Escápulas fora do chão; flexione o tronco lateralmente tocando cada calcanhar alternadamente.' },
  c_extensao_triceps: { id: 'c_extensao_triceps', name: 'Extensão de tríceps', modality: 'Calistenia', group: 'Tríceps', videoUrl: 'https://www.youtube.com/watch?v=KWYYzga5EwA', tips: 'Mantenha o corpo alinhado em prancha; desça os antebraços até o apoio e estenda os cotovelos usando o tríceps.' },
  c_knee_raises: { id: 'c_knee_raises', name: 'Knee raises', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=GNkS8lQsApM', tips: 'Pendurado na barra, enrole a pelve elevando os joelhos acima da linha do quadril sem balançar.' },
  c_flexao_exp: { id: 'c_flexao_exp', name: 'Flexão exp', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=gH3Aeaftx08', tips: 'Desça controlado e empurre com força máxima para tirar as mãos do chão. Aterrisse amortecendo com os cotovelos.' },
  c_in_outs: { id: 'c_in_outs', name: 'In&outs A/F', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=B58NXD_BIJY', tips: 'Equilibrado sobre os glúteos, estenda e recolha as pernas alternando entre abrir e fechar com o abdômen travado.' },
  c_prancha_alcance: { id: 'c_prancha_alcance', name: 'Prancha alcance', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=8cr_owp4cIc', tips: 'Em prancha, estenda um braço à frente de cada vez mantendo os quadris paralelos ao chão.' },
  c_mountain_climbers: { id: 'c_mountain_climbers', name: 'Mountain climbers', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=8Y_APtKIYF4', tips: 'Mãos abaixo dos ombros; traga os joelhos alternadamente em direção ao peito sem elevar o quadril.' },
  c_barra_aust_sup: { id: 'c_barra_aust_sup', name: 'Barra aust sup', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=7KTqtzmFtmg', tips: 'Pegada supinada na barra baixa, corpo reto; puxe o peito à barra apertando as escápulas.' },
  c_prancha_af: { id: 'c_prancha_af', name: 'Prancha A/F', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=S-uXYgO_tYA', tips: 'Em prancha, salte abrindo e fechando os pés mantendo o tronco imóvel e abdômen contraído.' },
  c_caminhada: { id: 'c_caminhada', name: 'Caminhada', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=g_Ire9C3FGQ', tips: 'Mantenha o core firme e cotovelos estendidos durante todo o deslocamento com as mãos.' },
  c_leg_raises: { id: 'c_leg_raises', name: 'Leg raises', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=E27kTQEqpkw', tips: 'Eleve as pernas estendidas sem usar impulso, focando na retroversão pélvica no topo.' },
  c_pike_shoulder_tap: { id: 'c_pike_shoulder_tap', name: 'Pike shoulder tap', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=ikCyqfDZm6o', tips: 'Em posição pike, toque o ombro oposto com uma mão mantendo o braço de apoio travado e firme.' },
  c_flexao_pike_elev: { id: 'c_flexao_pike_elev', name: 'Flexão pike c/ elev', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=dhPHI7o1jOc', tips: 'Pés apoiados em superfície elevada para maior carga nos ombros. Desça a cabeça formando um triângulo com as mãos.' },
  c_flexao_declinada: { id: 'c_flexao_declinada', name: 'Flexão declinada', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=GgF9kebF-cE', tips: 'Pés elevados; mantenha o core travado para não arquear a lombar e foque no peitoral superior.' },
  c_prancha_parede: { id: 'c_prancha_parede', name: 'Prancha na parede', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=fl7o8aNneQA', tips: 'Pés apoiados na parede na altura do quadril formando corpo horizontal. Empurre o chão com os ombros.' },
  c_prancha_alternate: { id: 'c_prancha_alternate', name: 'Prancha alternate', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=ZSCuKSQwjzc', tips: 'Alterne braços/pernas ou prancha alta/baixa minimizando a rotação do quadril.' },
  c_diamante: { id: 'c_diamante', name: 'Diamante', modality: 'Calistenia', group: 'Tríceps', videoUrl: 'https://www.youtube.com/watch?v=qbDhgIyxHaw', tips: 'Una polegares e indicadores sob o peito; desça controlando os cotovelos próximos ao corpo.' },
  c_canivete: { id: 'c_canivete', name: 'Canivete', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=YN9kn9zi4DE', tips: 'Eleve tronco e pernas simultaneamente encontrando mãos e pés no ponto mais alto.' },
  c_barra_sup_amf: { id: 'c_barra_sup_amf', name: 'Barra sup (A, M, F)', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=Q-_iswhI64s', extraVideos: [{ label: 'Sup. Aberta', url: 'https://www.youtube.com/watch?v=9E_ZSydSfy0' }, { label: 'Sup. Média', url: 'https://www.youtube.com/watch?v=Q-_iswhI64s' }, { label: 'Sup. Fechada', url: 'https://www.youtube.com/watch?v=EqsEXIpJDd0' }], tips: 'Execute as puxadas supinadas variando a abertura das mãos para atingir diferentes ângulos de dorsal e bíceps.' },
  c_barra_aust_arqueiro: { id: 'c_barra_aust_arqueiro', name: 'Barra aust arqueiro', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=DBsyesqWOfs', tips: 'Puxe o peito em direção a uma mão enquanto o outro braço permanece estendido lateralmente.' },
  c_pistol_suport: { id: 'c_pistol_suport', name: 'Pistol c/ suport', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=KzrDBooOo98', tips: 'Use o suporte apenas para equilíbrio; concentre a força na perna de apoio descendo com o calcanhar firme no chão.' },
  c_salto_frontal: { id: 'c_salto_frontal', name: 'Salto frontal', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=192SeT5XYlA', tips: 'Use o balanço dos braços para impulsionar para frente e aterrisse suavemente em meio agachamento.' },
  c_agacha_afundo: { id: 'c_agacha_afundo', name: 'Agacha + afundo', modality: 'Calistenia', group: 'Quadríceps', videoUrl: 'https://www.youtube.com/watch?v=oDhzwVfeRx8', tips: 'Combine um agachamento completo seguido de afundo para cada lado mantendo postura ereta.' },
  c_ponte: { id: 'c_ponte', name: 'Ponte', modality: 'Calistenia', group: 'Glúteos/Posterior', videoUrl: 'https://www.youtube.com/watch?v=HeZHY3v9KBY', tips: 'Empurre o chão pelos calcanhares elevando o quadril até alinhar joelhos e ombros; contraia forte os glúteos no topo.' },
  c_panturrilha: { id: 'c_panturrilha', name: 'Panturrilha', modality: 'Calistenia', group: 'Panturrilha', videoUrl: '', tips: 'Suba o máximo possível na ponta dos pés, segure 1 segundo no topo e desça lentamente.' },
  c_iso_ponta_pe: { id: 'c_iso_ponta_pe', name: 'Iso ponta do pé', modality: 'Calistenia', group: 'Panturrilha', videoUrl: 'https://www.youtube.com/watch?v=nVH2ND7Yz2k', tips: 'Sustente a contração máxima da panturrilha no ponto mais alto sem deixar o calcanhar ceder.' },
  c_burpee: { id: 'c_burpee', name: 'Burpee', modality: 'Calistenia', group: 'Cardio', videoUrl: 'https://www.youtube.com/watch?v=uF_nyWStVg0', tips: 'Desça até o peito tocar o chão, suba rápido, recolha os pés e finalize com um salto vertical.' },
  c_prancha_jc: { id: 'c_prancha_jc', name: 'Prancha J/C', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=3yni054Np7I', tips: 'Em prancha firme, leve o joelho em direção ao cotovelo contraindo o abdômen lateralmente.' },
  c_pa_b_fm: { id: 'c_pa_b_fm', name: 'P.A p/ B + F.M', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=NCsOjCPQJn8', tips: 'Alterne da prancha alta para a baixa com controle e execute a flexão militar mantendo os cotovelos fechados.' },
  c_tuck_lsit: { id: 'c_tuck_lsit', name: 'Tuck L-sit', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=2NC4I-5N4h0', tips: 'Empurre os ombros para baixo (depressão escapular) e puxe os joelhos bem próximos ao peito.' },
  c_diamante_regular: { id: 'c_diamante_regular', name: 'Diamante p/ regular', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=CXg6vqSuOKg', tips: 'Alterne entre a pegada diamante e a regular mantendo o alinhamento do tronco sem pausar no chão.' },
  c_flexao_inclinada_exp: { id: 'c_flexao_inclinada_exp', name: 'Flexão inclinada exp', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=7WL4yufMadM', tips: 'Desça até o peito encostar no apoio e empurre de forma explosiva para decolar as mãos.' },
  c_flexao_hold: { id: 'c_flexao_hold', name: 'Flexão hold', modality: 'Calistenia', group: 'Peito', videoUrl: 'https://www.youtube.com/watch?v=cMljnKTRfK0', tips: 'Segure a posição baixa da flexão a poucos centímetros do chão mantendo peitoral, tríceps e core tensos.' },
  c_escapula: { id: 'c_escapula', name: 'Escápula', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=hE86ab2ucNs', tips: 'Pendurado com braços totalmente estendidos, puxe apenas as escápulas para baixo elevando levemente o corpo.' },
  c_corner_raises: { id: 'c_corner_raises', name: 'Corner raises', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=bgkC-P1B7Cc', tips: 'Eleve as pernas alternadamente para os lados direito e esquerdo na barra trabalhando oblíquos e core.' },
  c_barra_trad: { id: 'c_barra_trad', name: 'Barra trad', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=TOKp299-uNU', tips: 'Pegada pronada tradicional; suba de forma limpa até o queixo passar a barra e desça estendendo os braços.' },
  c_barra_aust_sup_aberta: { id: 'c_barra_aust_sup_aberta', name: 'Barra aust sup aberta', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=YkwsNFgy4ak', tips: 'Pegada supinada mais aberta que os ombros na barra baixa, focando na porção externa das costas.' },
  c_barra_aust_sup_media: { id: 'c_barra_aust_sup_media', name: 'Barra aust sup média', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=7KTqtzmFtmg', tips: 'Pegada supinada na largura dos ombros, puxando o esterno em direção à barra.' },
  c_barra_aust_sup_fechada: { id: 'c_barra_aust_sup_fechada', name: 'Barra aust sup Fechada', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=F5hlhOXLNLc', tips: 'Mãos próximas em pegada supinada; excelente transferência para bíceps e miolo das costas.' },
  c_barra_aust_sup_arq: { id: 'c_barra_aust_sup_arq', name: 'Barra aust sup arq', modality: 'Calistenia', group: 'Costas', videoUrl: 'https://www.youtube.com/watch?v=jB8-lLr_DYc', tips: 'Puxe o corpo em direção a uma das mãos em pegada supinada mantendo o outro braço estendido.' },
  c_leg_x: { id: 'c_leg_x', name: 'Leg x', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=BkmIVHnATR0', tips: 'Cruze as pernas estendidas alternadamente (por cima e por baixo) mantendo a lombar colada ao chão.' },
  c_sit_ups: { id: 'c_sit_ups', name: 'Sit-ups', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=XbaD3Py1XIM', tips: 'Suba o tronco completamente até sentar sem arrancar o pescoço e controle a descida vértebra por vértebra.' },
  c_pike_hold: { id: 'c_pike_hold', name: 'Pike hold', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=gfOAevKLGQM', tips: 'Empurre o chão ativamente com os ombros mantendo o quadril alto e o peso projetado sobre as mãos.' },
  c_remador: { id: 'c_remador', name: 'Remador', modality: 'Calistenia', group: 'Core', videoUrl: 'https://www.youtube.com/watch?v=fAuNu8mKRck', tips: 'Estenda corpo e braços totalmente atrás e recolha abraçando os joelhos de forma fluida.' },
  c_hs_hold: { id: 'c_hs_hold', name: 'HS hold', modality: 'Calistenia', group: 'Ombros', videoUrl: 'https://www.youtube.com/watch?v=O5Lzg3wNk7Y', tips: 'Empurre o chão com os ombros elevados, abdômen travado (hollow body) e olhar focado entre as mãos.' },

  // === MUSCULAÇÃO (50 EXERCÍCIOS) ===
  // Peito
  m_1: { id: 'm_1', name: 'Supino Reto com Barra', modality: 'Musculação', group: 'Peito', videoUrl: '', tips: 'O construtor fundamental de força e volume para o peitoral inteiro. Mantenha escápulas retraídas e pés firmes no chão.' },
  m_2: { id: 'm_2', name: 'Supino Reto com Halteres', modality: 'Musculação', group: 'Peito', videoUrl: '', tips: 'Permite maior amplitude de movimento e corrige assimetrias de força. Desça os halteres na linha do peito com cotovelos a 45°.' },
  m_3: { id: 'm_3', name: 'Supino Inclinado com Barra', modality: 'Musculação', group: 'Peito', videoUrl: '', tips: 'Foca na porção clavicular (superior) do peitoral. Banco entre 30° e 45°, descendo a barra na parte alta do peito.' },
  m_4: { id: 'm_4', name: 'Supino Inclinado com Halteres', modality: 'Musculação', group: 'Peito', videoUrl: '', tips: 'Excelente para contração máxima da porção superior sem sobrecarregar os ombros. Controle bem a fase excêntrica.' },
  m_5: { id: 'm_5', name: 'Crucifixo Reto com Halteres', modality: 'Musculação', group: 'Peito', videoUrl: '', tips: 'Movimento de isolamento focado no alongamento extremo das fibras do peitoral. Mantenha leve flexão fixa nos cotovelos.' },
  // Costas
  m_6: { id: 'm_6', name: 'Remada Curvada com Barra', modality: 'Musculação', group: 'Costas', videoUrl: '', tips: 'Essencial para espessura das costas, trabalhando latíssimos, romboides e trapézio. Coluna neutra e puxe a barra em direção ao umbigo.' },
  m_7: { id: 'm_7', name: 'Remada Unilateral com Halter (Serrote)', modality: 'Musculação', group: 'Costas', videoUrl: '', tips: 'Apoiar-se no banco permite carga alta com foco unilateral no grande dorsal. Puxe o halter em arco na direção do quadril.' },
  m_8: { id: 'm_8', name: 'Remada Cavalinho (T-Bar Row adaptada)', modality: 'Musculação', group: 'Costas', videoUrl: '', tips: 'Feita ancorando uma ponta da barra no canto da parede, foca no miolo das costas. Mantenha o peito aberto e aperte as escápulas.' },
  m_9: { id: 'm_9', name: 'Remada Curvada com Pegada Supinada (Barra)', modality: 'Musculação', group: 'Costas', videoUrl: '', tips: 'Maior ativação de bíceps e da parte inferior do latíssimo do dorso. Cotovelos rentes ao tronco na puxada.' },
  m_10: { id: 'm_10', name: 'Pullover com Halter', modality: 'Musculação', group: 'Costas', videoUrl: '', tips: 'Deitado no banco, excelente para expansão da caixa torácica e ativação do serrátil/dorsal. Alongue atrás da cabeça sem perder tensão.' },
  // Ombros
  m_11: { id: 'm_11', name: 'Desenvolvimento Militar com Barra (Em pé)', modality: 'Musculação', group: 'Ombros', videoUrl: '', tips: 'Exercício de força bruta para toda a cintura escapular e deltoide anterior. Trave glúteos e abdômen para não hiperestender a lombar.' },
  m_12: { id: 'm_12', name: 'Desenvolvimento Sentado com Halteres', modality: 'Musculação', group: 'Ombros', videoUrl: '', tips: 'Retira o uso do core e foca totalmente no deltoide, permitindo movimento natural. Desça os halteres até a linha das orelhas.' },
  m_13: { id: 'm_13', name: 'Desenvolvimento Arnold', modality: 'Musculação', group: 'Ombros', videoUrl: '', tips: 'Rotação de punhos que ativa as porções anterior e lateral do deltoide de forma dinâmica. Movimento fluido sem trancos.' },
  m_14: { id: 'm_14', name: 'Remada Alta com Barra', modality: 'Musculação', group: 'Ombros', videoUrl: '', tips: 'Foca no trapézio superior e no deltoide lateral. Puxe liderando com os cotovelos até a linha do peito.' },
  m_15: { id: 'm_15', name: 'Elevação Lateral com Halteres', modality: 'Musculação', group: 'Ombros', videoUrl: '', tips: 'O melhor movimento de isolamento para a largura dos ombros (deltoide medial). Eleve até a linha dos ombros sem balançar o tronco.' },
  m_16: { id: 'm_16', name: 'Crucifixo Invertido com Halteres', modality: 'Musculação', group: 'Ombros', videoUrl: '', tips: 'Feito curvado, atinge diretamente o deltoide posterior, crucial para a postura. Abra os braços controlando a volta.' },
  // Bíceps
  m_17: { id: 'm_17', name: 'Rosca Direta com Barra', modality: 'Musculação', group: 'Bíceps', videoUrl: '', tips: 'O clássico construtor de massa global para o bíceps. Cotovelos fixos ao lado do tronco sem jogar as costas para trás.' },
  m_18: { id: 'm_18', name: 'Rosca Alternada com Halteres', modality: 'Musculação', group: 'Bíceps', videoUrl: '', tips: 'Permite supinação completa do punho durante o movimento para máximo pico de contração.' },
  m_19: { id: 'm_19', name: 'Rosca Martelo com Halteres', modality: 'Musculação', group: 'Bíceps', videoUrl: '', tips: 'Foca no braquial e braquiorradial, dando espessura ao braço. Mantenha pegada neutra (polegares para cima).' },
  m_20: { id: 'm_20', name: 'Rosca Concentrada com Halter', modality: 'Musculação', group: 'Bíceps', videoUrl: '', tips: 'Feita sentado com apoio na perna, excelente para o pico do bíceps no final do treino. Estenda quase totalmente na descida.' },
  // Tríceps
  m_21: { id: 'm_21', name: 'Supino Fechado com Barra', modality: 'Musculação', group: 'Tríceps', videoUrl: '', tips: 'Movimento composto pesado que transfere a carga do peito para os tríceps. Pegada na largura dos ombros e cotovelos próximos ao corpo.' },
  m_22: { id: 'm_22', name: 'Tríceps Testa com Barra', modality: 'Musculação', group: 'Tríceps', videoUrl: '', tips: 'Feito deitado no banco, isola o tríceps mantendo tensão constante. Mantenha os cotovelos apontados para o teto.' },
  m_23: { id: 'm_23', name: 'Tríceps Francês com Halter', modality: 'Musculação', group: 'Tríceps', videoUrl: '', tips: 'Foca na porção longa do tríceps, essencial para preencher o braço. Alongue bem atrás da cabeça antes de estender.' },
  m_24: { id: 'm_24', name: 'Tríceps Coice com Halter', modality: 'Musculação', group: 'Tríceps', videoUrl: '', tips: 'Ótimo para a contração máxima no final da extensão do braço. Mantenha o úmero paralelo ao chão sem deixar o cotovelo cair.' },
  m_25: { id: 'm_25', name: 'Tate Press com Halteres', modality: 'Musculação', group: 'Tríceps', videoUrl: '', tips: 'Variação deitada no banco onde os halteres descem em direção ao centro do peito mantendo os cotovelos abertos e fixos.' },
  // Quadríceps e Dominantes de Joelho
  m_26: { id: 'm_26', name: 'Agachamento Livre com Barra (Back Squat)', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'O rei dos exercícios de perna, constrói força sistêmica e massa. Inspire fundo travando o core (bracing) antes de descer.' },
  m_27: { id: 'm_27', name: 'Agachamento Frontal com Barra', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Desloca o centro de gravidade, isolando massivamente os quadríceps e exigindo força no core. Mantenha os cotovelos altos.' },
  m_28: { id: 'm_28', name: 'Agachamento Cálice (Goblet Squat) com Halter', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Excelente para dominar a profundidade do agachamento mantendo o tronco ereto. Segure o halter rente ao peito.' },
  m_29: { id: 'm_29', name: 'Agachamento Búlgaro com Halteres', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Exercício unilateral brutal no banco que corrige assimetrias e hipertrofia quadríceps e glúteos. Desça verticalmente.' },
  m_30: { id: 'm_30', name: 'Afundo com Halteres', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Movimento clássico de passada estática no lugar. Controle a descida até o joelho de trás quase tocar o solo.' },
  m_31: { id: 'm_31', name: 'Afundo Reverso com Barra', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'A passada para trás reduz o impacto patelar e foca um pouco mais nos glúteos. Empurre pelo calcanhar da perna fixa.' },
  m_32: { id: 'm_32', name: 'Passada (Walking Lunges) com Halteres', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Movimento dinâmico excelente para condicionamento e hipertrofia. Mantenha passos constantes e tronco firme.' },
  m_33: { id: 'm_33', name: 'Step-up (Subida no Banco) com Halteres', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Trabalho funcional que exige equilíbrio e força extrema de uma perna só. Evite impulsionar com o pé de baixo.' },
  m_34: { id: 'm_34', name: 'Agachamento Sumô com Halter', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Foco intensificado na parte interna da coxa (adutores). Base ampla e joelhos acompanhando a linha dos pés.' },
  m_35: { id: 'm_35', name: 'Agachamento Cossaco com Halter', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Movimento lateral profundo que trabalha mobilidade, adutores e quadríceps. Mantenha o calcanhar da perna ativa no chão.' },
  m_36: { id: 'm_36', name: 'Agachamento Zercher com Barra', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Barra apoiada na dobra dos cotovelos, exige força monumental do core e eretores da espinha. Mantenha o tronco bem vertical.' },
  // Posteriores e Glúteos
  m_37: { id: 'm_37', name: 'Levantamento Terra Convencional com Barra', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'Construtor de cadeia posterior inteira (glúteos, isquiotibiais, lombar). Barra rente às canelas e coluna neutra o tempo todo.' },
  m_38: { id: 'm_38', name: 'Levantamento Terra Sumô com Barra', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'Base aberta que diminui a tensão lombar e recruta mais quadríceps e adutores. Abra bem os joelhos ao iniciar a puxada.' },
  m_39: { id: 'm_39', name: 'Stiff com Barra', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'Foco direto no alongamento e contração dos isquiotibiais com as pernas quase esticadas. Empurre o quadril para trás.' },
  m_40: { id: 'm_40', name: 'RDL (Romanian Deadlift) com Halteres', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'Variação do Stiff onde os joelhos flexionam levemente, focando nos glúteos e lombares. Halteres sempre rentes às coxas.' },
  m_41: { id: 'm_41', name: 'Elevação Pélvica (Hip Thrust) com Barra', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'O exercício mais efetivo para ativação e hipertrofia direta do glúteo máximo. Faça retroversão pélvica e segure 1s no topo.' },
  m_42: { id: 'm_42', name: 'Ponte de Glúteos com Halter', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'Variação feita diretamente no chão, com amplitude menor, mas forte contração de glúteos no pico do movimento.' },
  m_43: { id: 'm_43', name: 'Bom Dia (Good Morning) com Barra', modality: 'Musculação', group: 'Glúteos/Posterior', videoUrl: '', tips: 'Com a barra nas costas, realiza-se a flexão do quadril, focando na cadeia posterior. Use carga moderada e coluna travada.' },
  m_44: { id: 'm_44', name: 'Flexão Nórdica Reversa (com Halter no peito)', modality: 'Musculação', group: 'Quadríceps', videoUrl: '', tips: 'Feita ajoelhado, inclinando o tronco para trás em linha reta para isolar o quadríceps excentricamente.' },
  // Panturrilhas
  m_45: { id: 'm_45', name: 'Elevação de Panturrilhas em Pé com Barra', modality: 'Musculação', group: 'Panturrilha', videoUrl: '', tips: 'O peso nas costas aplica carga direta no gastrocnêmio. Controle a descida e faça pico de contração em cima.' },
  m_46: { id: 'm_46', name: 'Elevação de Panturrilhas Unilateral com Halter', modality: 'Musculação', group: 'Panturrilha', videoUrl: '', tips: 'Feita segurando o halter do lado da perna que trabalha, otimizando o peso disponível e corrigindo assimetrias.' },
  m_47: { id: 'm_47', name: 'Elevação de Panturrilhas Sentado no Banco', modality: 'Musculação', group: 'Panturrilha', videoUrl: '', tips: 'Colocando os halteres pesados sobre os joelhos para focar no músculo sóleo. Use um apoio sob a ponta dos pés.' },
  // Core e Híbridos
  m_48: { id: 'm_48', name: 'Thruster (Agachamento com Desenvolvimento) com Barra', modality: 'Musculação', group: 'Core', videoUrl: '', tips: 'Exercício composto que liga o agachamento frontal diretamente ao desenvolvimento militar usando o impulso das pernas.' },
  m_49: { id: 'm_49', name: 'Abdominal Rollout com Barra', modality: 'Musculação', group: 'Core', videoUrl: '', tips: 'Usando a barra e as anilhas como roda no chão, é um dos melhores movimentos anti-extensão para o core. Não deixe a lombar ceder.' },
  m_50: { id: 'm_50', name: 'Russian Twist com Halter', modality: 'Musculação', group: 'Core', videoUrl: '', tips: 'Rotação de tronco sentado no chão para fortalecimento dos oblíquos. Gire os ombros acompanhando o halter.' }
};

const CATALOG_LIST = Object.values(EXERCISE_CATALOG);

// --- CICLO DE 15 TREINOS DE CALISTENIA (3 SÉRIES CADA) ---
const CALISTHENICS_CYCLE = [
  {
    id: 'cal_1', name: 'Treino 1',
    items: [
      { exId: 'c_polichinelo', sets: 3, reps: '30x' },
      { exId: 'c_barra', sets: 3, reps: '6x' },
      { exId: 'c_prancha', sets: 3, reps: '30s' },
      { exId: 'c_flexao_joelhos', sets: 3, reps: 'Máx' },
      { exId: 'c_agachamento_salto', sets: 3, reps: '15x' },
      { exId: 'c_pe_bunda', sets: 3, reps: '30s' },
      { exId: 'c_barra_aust_amf', sets: 3, reps: '5x' },
      { exId: 'c_flexao_inclinada', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_2', name: 'Treino 2',
    items: [
      { exId: 'c_step_up', sets: 3, reps: '30s' },
      { exId: 'c_agachamento', sets: 3, reps: '10x' },
      { exId: 'c_afundo', sets: 3, reps: '10x' },
      { exId: 'c_agachamento_salto', sets: 3, reps: '10x' },
      { exId: 'c_afundo_elev', sets: 3, reps: '10x' },
      { exId: 'c_sumo', sets: 3, reps: '15x' },
      { exId: 'c_isometria', sets: 3, reps: '30s' },
      { exId: 'c_pantu_unilateral', sets: 3, reps: '15x' }
    ]
  },
  {
    id: 'cal_3', name: 'Treino 3',
    items: [
      { exId: 'c_skipping', sets: 3, reps: '30s' },
      { exId: 'c_dips', sets: 3, reps: '8x' },
      { exId: 'c_prancha_lateral', sets: 3, reps: '20s' },
      { exId: 'c_triceps_trave', sets: 3, reps: 'Máx' },
      { exId: 'c_alternado', sets: 3, reps: '10x' },
      { exId: 'c_flexao', sets: 3, reps: 'Máx' },
      { exId: 'c_flexao_inclinada', sets: 3, reps: 'Máx' },
      { exId: 'c_crunches', sets: 3, reps: '20x' }
    ]
  },
  {
    id: 'cal_4', name: 'Treino 4',
    items: [
      { exId: 'c_false_rope', sets: 3, reps: '30s' },
      { exId: 'c_barra_amf', sets: 3, reps: '2x' },
      { exId: 'c_toe_touches', sets: 3, reps: '10x' },
      { exId: 'c_barra_sup_media', sets: 3, reps: '6x' },
      { exId: 'c_prancha', sets: 3, reps: '40s' },
      { exId: 'c_barra_aust_amf', sets: 3, reps: '5x' },
      { exId: 'c_leg_flutters', sets: 3, reps: '30s' },
      { exId: 'c_biceps_barra', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_5', name: 'Treino 5',
    items: [
      { exId: 'c_half_burpee', sets: 3, reps: '8x' },
      { exId: 'c_flexao_pike', sets: 3, reps: 'Máx' },
      { exId: 'c_bike', sets: 3, reps: '30s' },
      { exId: 'c_flexao_militar', sets: 3, reps: '10x' },
      { exId: 'c_side_crunches', sets: 3, reps: '15x' },
      { exId: 'c_pike_caminhada', sets: 3, reps: '10x' },
      { exId: 'c_prancha_alta_trave', sets: 3, reps: '8x' },
      { exId: 'c_caminhada_chao', sets: 3, reps: '8x' }
    ]
  },
  {
    id: 'cal_6', name: 'Treino 6',
    items: [
      { exId: 'c_polichinelo', sets: 3, reps: '40s' },
      { exId: 'c_barra', sets: 3, reps: '8x' },
      { exId: 'c_prancha', sets: 3, reps: '45s' },
      { exId: 'c_flexao', sets: 3, reps: 'Máx' },
      { exId: 'c_agachamento_salto', sets: 3, reps: '30s' },
      { exId: 'c_barra_sup_media', sets: 3, reps: '8x' },
      { exId: 'c_ombro_ombro', sets: 3, reps: '5x' },
      { exId: 'c_dips', sets: 3, reps: '8x' },
      { exId: 'c_toe_touches', sets: 3, reps: '25x' }
    ]
  },
  {
    id: 'cal_7', name: 'Treino 7',
    items: [
      { exId: 'c_skipping', sets: 3, reps: '40s' },
      { exId: 'c_agachamento_salto', sets: 3, reps: '30s' },
      { exId: 'c_afundo_saltando', sets: 3, reps: '10x' },
      { exId: 'c_step_up', sets: 3, reps: '45s' },
      { exId: 'c_afundo_explosivo', sets: 3, reps: '10x' },
      { exId: 'c_sumo', sets: 3, reps: '25x' },
      { exId: 'c_passada_lateral', sets: 3, reps: '15x' },
      { exId: 'c_iso_afundo', sets: 3, reps: '20s' }
    ]
  },
  {
    id: 'cal_8', name: 'Treino 8',
    items: [
      { exId: 'c_heel_taps', sets: 3, reps: '45s' },
      { exId: 'c_dips', sets: 3, reps: '10x' },
      { exId: 'c_prancha_lateral', sets: 3, reps: '30s' },
      { exId: 'c_extensao_triceps', sets: 3, reps: '8x' },
      { exId: 'c_knee_raises', sets: 3, reps: '15x' },
      { exId: 'c_flexao_exp', sets: 3, reps: 'Máx' },
      { exId: 'c_triceps_trave', sets: 3, reps: '20x' },
      { exId: 'c_in_outs', sets: 3, reps: '30s' },
      { exId: 'c_prancha_alcance', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_9', name: 'Treino 9',
    items: [
      { exId: 'c_false_rope', sets: 3, reps: '45s' },
      { exId: 'c_barra_amf', sets: 3, reps: '3x' },
      { exId: 'c_alternado', sets: 3, reps: '15x' },
      { exId: 'c_barra_sup_media', sets: 3, reps: '8x' },
      { exId: 'c_prancha', sets: 3, reps: '1min' },
      { exId: 'c_barra_aust_amf', sets: 3, reps: '8x' },
      { exId: 'c_mountain_climbers', sets: 3, reps: '40s' },
      { exId: 'c_barra_aust_sup', sets: 3, reps: 'Máx' },
      { exId: 'c_prancha_af', sets: 3, reps: '45s' }
    ]
  },
  {
    id: 'cal_10', name: 'Treino 10',
    items: [
      { exId: 'c_half_burpee', sets: 3, reps: '10x' },
      { exId: 'c_caminhada', sets: 3, reps: 'Máx' },
      { exId: 'c_leg_raises', sets: 3, reps: '20x' },
      { exId: 'c_pike_shoulder_tap', sets: 3, reps: '10x' },
      { exId: 'c_flexao_pike_elev', sets: 3, reps: '8x' },
      { exId: 'c_crunches', sets: 3, reps: '45s' },
      { exId: 'c_flexao_declinada', sets: 3, reps: 'Máx' },
      { exId: 'c_prancha_parede', sets: 3, reps: 'Máx' },
      { exId: 'c_dips', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_11', name: 'Treino 11',
    items: [
      { exId: 'c_polichinelo', sets: 3, reps: '50x' },
      { exId: 'c_barra', sets: 3, reps: '10x' },
      { exId: 'c_prancha_alternate', sets: 3, reps: '45s' },
      { exId: 'c_diamante', sets: 3, reps: 'Máx' },
      { exId: 'c_canivete', sets: 3, reps: '10x' },
      { exId: 'c_barra_sup_amf', sets: 3, reps: '5x' },
      { exId: 'c_caminhada', sets: 3, reps: '3x' },
      { exId: 'c_dips', sets: 3, reps: '10x' },
      { exId: 'c_crunches', sets: 3, reps: '50x' },
      { exId: 'c_barra_aust_arqueiro', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_12', name: 'Treino 12',
    items: [
      { exId: 'c_half_burpee', sets: 3, reps: '10x' },
      { exId: 'c_afundo_saltando', sets: 3, reps: '30s' },
      { exId: 'c_afundo_elev', sets: 3, reps: '15x' },
      { exId: 'c_pistol_suport', sets: 3, reps: '8x' },
      { exId: 'c_salto_frontal', sets: 3, reps: '10x' },
      { exId: 'c_agacha_afundo', sets: 3, reps: '8x' },
      { exId: 'c_ponte', sets: 3, reps: '15x' },
      { exId: 'c_panturrilha', sets: 3, reps: '20x' },
      { exId: 'c_iso_ponta_pe', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_13', name: 'Treino 13',
    items: [
      { exId: 'c_burpee', sets: 3, reps: '8x' },
      { exId: 'c_dips', sets: 3, reps: '12x' },
      { exId: 'c_prancha_jc', sets: 3, reps: '10x' },
      { exId: 'c_pa_b_fm', sets: 3, reps: '10x' },
      { exId: 'c_tuck_lsit', sets: 3, reps: 'Máx' },
      { exId: 'c_diamante_regular', sets: 3, reps: 'Máx' },
      { exId: 'c_mountain_climbers', sets: 3, reps: '40s' },
      { exId: 'c_flexao_inclinada_exp', sets: 3, reps: 'Máx' },
      { exId: 'c_bike', sets: 3, reps: '40s' },
      { exId: 'c_flexao_hold', sets: 3, reps: 'Máx' }
    ]
  },
  {
    id: 'cal_14', name: 'Treino 14',
    items: [
      { exId: 'c_escapula', sets: 3, reps: '10x' },
      { exId: 'c_barra', sets: 3, reps: '10x' },
      { exId: 'c_corner_raises', sets: 3, reps: '10x' },
      { exId: 'c_barra_trad', sets: 3, reps: '10x' },
      { exId: 'c_knee_raises', sets: 3, reps: '15x' },
      { exId: 'c_barra_aust_sup_aberta', sets: 3, reps: '10x' },
      { exId: 'c_barra_aust_sup_media', sets: 3, reps: '10x' },
      { exId: 'c_barra_aust_sup_fechada', sets: 3, reps: '10x' },
      { exId: 'c_leg_raises', sets: 3, reps: '15x' },
      { exId: 'c_barra_aust_sup_arq', sets: 3, reps: 'Máx' },
      { exId: 'c_leg_x', sets: 3, reps: '40s' },
      { exId: 'c_biceps_barra', sets: 3, reps: '20x' }
    ]
  },
  {
    id: 'cal_15', name: 'Treino 15',
    items: [
      { exId: 'c_half_burpee', sets: 3, reps: '12x' },
      { exId: 'c_flexao_pike_elev', sets: 3, reps: '10x' },
      { exId: 'c_ombro_ombro', sets: 3, reps: '8x' },
      { exId: 'c_sit_ups', sets: 3, reps: '15x' },
      { exId: 'c_pike_hold', sets: 3, reps: 'Máx' },
      { exId: 'c_pike_caminhada', sets: 3, reps: '20x' },
      { exId: 'c_remador', sets: 3, reps: '20x' },
      { exId: 'c_hs_hold', sets: 3, reps: 'Máx' },
      { exId: 'c_flexao_militar', sets: 3, reps: '15x' },
      { exId: 'c_caminhada', sets: 3, reps: 'Máx' }
    ]
  }
];

// --- MODELO INICIAL HÍBRIDO / MUSCULAÇÃO (4 DIAS EDITÁVEIS) ---
const buildDefaultHybridWorkouts = () => {
  const mk = (exId, sets = 3, reps = '10') => {
    const base = EXERCISE_CATALOG[exId];
    if (!base) return null;
    return {
      uid: `${exId}_${Math.random().toString(36).slice(2, 8)}`,
      exId: base.id,
      name: base.name,
      group: base.group,
      modality: base.modality,
      sets,
      reps,
      weight: '',
      isCompleted: false
    };
  };

  return {
    'Upper Push (Híbrido)': [
      mk('m_1', 4, '8-10'),
      mk('m_4', 3, '10-12'),
      mk('m_11', 4, '8-10'),
      mk('m_15', 3, '12-15'),
      mk('c_dips', 3, '10'),
      mk('m_22', 3, '10-12')
    ].filter(Boolean),
    'Lower Body (Híbrido)': [
      mk('m_26', 4, '8-10'),
      mk('m_37', 4, '6-8'),
      mk('m_29', 3, '10'),
      mk('m_41', 3, '12'),
      mk('m_45', 4, '15'),
      mk('m_49', 3, '12')
    ].filter(Boolean),
    'Upper Pull (Híbrido)': [
      mk('c_barra', 4, '8'),
      mk('m_6', 4, '8-10'),
      mk('m_7', 3, '10-12'),
      mk('m_16', 3, '12-15'),
      mk('m_17', 3, '10-12'),
      mk('m_19', 3, '12')
    ].filter(Boolean),
    'Full Body & Core': [
      mk('m_48', 3, '10'),
      mk('m_2', 3, '10'),
      mk('c_barra_sup_media', 3, '8'),
      mk('m_40', 3, '10-12'),
      mk('c_prancha', 3, '45s'),
      mk('m_50', 3, '20')
    ].filter(Boolean)
  };
};

// --- COMPONENTES AUXILIARES ---
const ToastContainer = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
    {(toasts || []).map(t => (
      <div
        key={t.id}
        className={`p-4 rounded-xl shadow-lg text-white text-sm font-bold ${
          t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'
        }`}
      >
        {t.message}
      </div>
    ))}
  </div>
);

const SidebarBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-2xl transition-all font-bold text-sm ${
      active
        ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

const InlineStopwatch = ({ onSaveTime, onClose }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let int;
    if (isRunning) int = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(int);
  }, [isRunning]);

  const formatSecs = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800 mt-3">
      <Timer size={16} className={isRunning ? 'text-emerald-500 animate-pulse' : 'text-zinc-500'} />
      <span className="font-mono font-bold w-12 text-center text-sm">{formatSecs(time)}</span>
      <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white">
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button onClick={() => { setIsRunning(false); setTime(0); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg">
        <Square size={14} />
      </button>
      <div className="flex-1" />
      <button
        onClick={() => onSaveTime(`${time}s`)}
        disabled={time === 0}
        className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 disabled:opacity-30 text-xs font-bold rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30"
      >
        Gravar {time}s
      </button>
      <button onClick={onClose} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
        <X size={14} />
      </button>
    </div>
  );
};

// --- APLICAÇÃO PRINCIPAL ---
function MainApp() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [appScreen, setAppScreen] = useState('loading');

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authErrorMsg, setAuthErrorMsg] = useState('');

  // Navegação e UI
  const [activeTab, setActiveTab] = useState('treino');
  const [workoutMode, setWorkoutMode] = useState('calistenia'); // 'calistenia' | 'hibrido'
  const [toasts, setToasts] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState({ open: false, cycleReset: false, cycleCount: 1 });

  // Dados do Usuário
  const todayStr = new Date().toLocaleDateString('pt-BR');
  const [userProfile, setUserProfile] = useState({
    name: '',
    weight: 65,
    targetWeight: 75,
    onboardingCompleted: false
  });
  const [dailyLogs, setDailyLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]); // Coleção workout_logs

  // Ciclo de Calistenia (1 a 15)
  const [cycleState, setCycleState] = useState({
    currentIndex: 0,
    completedIds: [],
    cycleCount: 1
  });
  const [activeCalIndex, setActiveCalIndex] = useState(0);
  const [activeCalExercises, setActiveCalExercises] = useState([]);

  // Treinos Híbridos / Musculação
  const [hybridWorkouts, setHybridWorkouts] = useState(() => buildDefaultHybridWorkouts());
  const [activeHybridDay, setActiveHybridDay] = useState('Upper Push (Híbrido)');
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [newDayName, setNewDayName] = useState('');

  // Banco local/nuvem de dicas customizadas (complementa o catálogo estático)
  const [customTips, setCustomTips] = useState({});
  const [expandedTips, setExpandedTips] = useState({});
  const [editingTipId, setEditingTipId] = useState(null);
  const [tempTipText, setTempTipText] = useState('');

  // Cronômetro e Modais de Troca/Adição
  const [activeStopwatch, setActiveStopwatch] = useState(null);
  const [catalogModal, setCatalogModal] = useState({
    open: false,
    action: 'add', // 'add' | 'swap'
    targetUid: null,
    filterGroup: null
  });
  const [modalSearch, setModalSearch] = useState('');
  const [modalModalityFilter, setModalModalityFilter] = useState('Todos'); // 'Todos' | 'Calistenia' | 'Musculação'

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Monta a lista de exercícios do treino de Calistenia selecionado
  const buildCalSession = (index) => {
    const plan = CALISTHENICS_CYCLE[index] || CALISTHENICS_CYCLE[0];
    return plan.items.map((item, idx) => {
      const base = EXERCISE_CATALOG[item.exId];
      return {
        uid: `${plan.id}_${idx}_${item.exId}`,
        exId: item.exId,
        name: base ? base.name : item.exId,
        group: base ? base.group : 'Geral',
        modality: base ? base.modality : 'Calistenia',
        sets: item.sets,
        reps: item.reps,
        weight: '', // Para calistenia = carga extra opcional (peso corporal é automático)
        isCompleted: false
      };
    });
  };

  useEffect(() => {
    setActiveCalExercises(buildCalSession(activeCalIndex));
  }, [activeCalIndex]);

  // --- FIREBASE AUTH ---
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setAppScreen('login');
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // --- FIREBASE DADOS DO USUÁRIO (NOVO DOC LIMPO v5) ---
  useEffect(() => {
    if (!user || !db) return;

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'fit_hybrid_v5');
    const unsubDoc = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.userProfile) setUserProfile({ name: '', weight: 65, targetWeight: 75, ...d.userProfile });
        if (d.cycleState) {
          setCycleState(d.cycleState);
          setActiveCalIndex(d.cycleState.currentIndex || 0);
        }
        if (d.hybridWorkouts && Object.keys(d.hybridWorkouts).length > 0) {
          setHybridWorkouts(d.hybridWorkouts);
          const keys = Object.keys(d.hybridWorkouts);
          setActiveHybridDay(prev => (keys.includes(prev) ? prev : keys[0]));
        }
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        if (d.customTips) setCustomTips(d.customTips);
        setAppScreen(d.userProfile?.onboardingCompleted ? 'main' : 'onboarding');
      } else {
        setAppScreen('onboarding');
      }
    });

    // Escuta a coleção dedicada de registros de treinos e cargas
    const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'workout_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWorkoutLogs(list);
    });

    return () => {
      unsubDoc();
      unsubLogs();
    };
  }, [user]);

  const saveAppState = async (partialData) => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'fit_hybrid_v5');
      await setDoc(userDocRef, JSON.parse(JSON.stringify(partialData)), { merge: true });
    } catch (e) {
      console.error("Erro ao salvar na nuvem:", e);
    }
  };

  // --- AUTENTICAÇÃO ---
  const handleAuthAction = async () => {
    setAuthErrorMsg('');
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      setAppScreen('loading');
    } catch (err) {
      setAuthErrorMsg(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAppScreen('login');
  };

  // --- FUNÇÕES DE EXERCÍCIOS ATUAIS ---
  const currentExercises = workoutMode === 'calistenia'
    ? activeCalExercises
    : (hybridWorkouts[activeHybridDay] || []);

  const updateCurrentExercises = (updaterFn, persistHybrid = false) => {
    if (workoutMode === 'calistenia') {
      setActiveCalExercises(prev => updaterFn(prev));
    } else {
      setHybridWorkouts(prev => {
        const updatedList = updaterFn(prev[activeHybridDay] || []);
        const next = { ...prev, [activeHybridDay]: updatedList };
        if (persistHybrid) saveAppState({ hybridWorkouts: next });
        return next;
      });
    }
  };

  // Trocar exercício por equivalente ou adicionar novo
  const handleSelectCatalogExercise = (catalogEx) => {
    const newEntry = {
      uid: `${catalogEx.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      exId: catalogEx.id,
      name: catalogEx.name,
      group: catalogEx.group,
      modality: catalogEx.modality,
      sets: 3,
      reps: catalogEx.modality === 'Calistenia' ? '12x' : '10',
      weight: '',
      isCompleted: false
    };

    if (catalogModal.action === 'swap') {
      updateCurrentExercises(
        list => list.map(item => item.uid === catalogModal.targetUid ? { ...newEntry, sets: item.sets } : item),
        true
      );
      showToast(`Substituído por ${catalogEx.name} (${catalogEx.modality})`, 'success');
    } else {
      updateCurrentExercises(list => [...list, newEntry], true);
      showToast(`${catalogEx.name} adicionado ao treino!`, 'success');
    }

    setCatalogModal({ open: false, action: 'add', targetUid: null, filterGroup: null });
    setModalSearch('');
    setModalModalityFilter('Todos');
  };

  // Salvar dica personalizada no banco de dados (zero IA)
  const handleSaveCustomTip = (exId) => {
    const updated = { ...customTips, [exId]: tempTipText.trim() };
    setCustomTips(updated);
    saveAppState({ customTips: updated });
    setEditingTipId(null);
    showToast('Dica de execução salva no banco de dados!', 'success');
  };

  // --- FINALIZAR E REGISTRAR TREINO DO DIA ---
  const handleFinishWorkout = async () => {
    if (!user || !db) return;
    if (currentExercises.length === 0) {
      showToast('Adicione pelo menos um exercício antes de finalizar.', 'error');
      return;
    }

    const bodyWeight = Number(userProfile.weight) || 65;
    let totalVolume = 0;

    const recordedExercises = currentExercises.map(ex => {
      const extraOrLoad = Number(ex.weight) || 0;
      const effectiveLoad = ex.modality === 'Calistenia' ? (bodyWeight + extraOrLoad) : extraOrLoad;
      const numericReps = parseInt(String(ex.reps).replace(/[^0-9]/g, ''), 10) || 10;
      const setsNum = Number(ex.sets) || 3;
      totalVolume += Math.round(effectiveLoad * numericReps * setsNum);

      return {
        exId: ex.exId,
        name: ex.name,
        group: ex.group,
        modality: ex.modality,
        sets: setsNum,
        reps: String(ex.reps),
        loadKg: effectiveLoad,
        isBodyweightAuto: ex.modality === 'Calistenia',
        extraWeightKg: ex.modality === 'Calistenia' ? extraOrLoad : 0,
        completed: !!ex.isCompleted
      };
    });

    const workoutTitle = workoutMode === 'calistenia'
      ? `${CALISTHENICS_CYCLE[activeCalIndex].name} (Ciclo ${cycleState.cycleCount})`
      : activeHybridDay;

    // 1. Grava na coleção dedicada de treinos e cargas (workout_logs)
    try {
      const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'workout_logs');
      await addDoc(logsRef, {
        date: todayStr,
        timestamp: Date.now(),
        mode: workoutMode,
        workoutName: workoutTitle,
        bodyWeightAtTime: bodyWeight,
        totalVolumeKg: totalVolume,
        exercises: recordedExercises
      });
    } catch (e) {
      console.error('Erro ao salvar workout_logs:', e);
      showToast('Erro ao registrar treino no banco de dados.', 'error');
      return;
    }

    // 2. Atualiza registro diário (consistência)
    const nextDailyLogs = [...dailyLogs];
    const existingIdx = nextDailyLogs.findIndex(l => l.date === todayStr);
    if (existingIdx >= 0) {
      const prevList = nextDailyLogs[existingIdx].workouts || [];
      nextDailyLogs[existingIdx] = {
        ...nextDailyLogs[existingIdx],
        workout: workoutTitle,
        workouts: [...prevList, workoutTitle]
      };
    } else {
      nextDailyLogs.push({ date: todayStr, water: 0, workout: workoutTitle, workouts: [workoutTitle] });
    }
    setDailyLogs(nextDailyLogs);

    // 3. Atualiza ou reinicia o ciclo de Calistenia
    let nextCycleState = { ...cycleState };
    let didResetCycle = false;

    if (workoutMode === 'calistenia') {
      const currentPlan = CALISTHENICS_CYCLE[activeCalIndex];
      const isLastWorkout = activeCalIndex === CALISTHENICS_CYCLE.length - 1;

      if (isLastWorkout) {
        // Reinicia o ciclo após finalizar o Treino 15
        nextCycleState = {
          currentIndex: 0,
          completedIds: [],
          cycleCount: (cycleState.cycleCount || 1) + 1
        };
        didResetCycle = true;
        setActiveCalIndex(0);
      } else {
        const updatedCompleted = Array.from(new Set([...(cycleState.completedIds || []), currentPlan.id]));
        const nextIndex = activeCalIndex + 1;
        nextCycleState = {
          ...cycleState,
          currentIndex: nextIndex,
          completedIds: updatedCompleted
        };
        setActiveCalIndex(nextIndex);
      }
      setCycleState(nextCycleState);
    } else {
      // Limpa os checkmarks do treino híbrido concluído
      updateCurrentExercises(list => list.map(ex => ({ ...ex, isCompleted: false })), true);
    }

    await saveAppState({
      dailyLogs: nextDailyLogs,
      cycleState: nextCycleState
    });

    setShowSuccessModal({
      open: true,
      cycleReset: didResetCycle,
      cycleCount: nextCycleState.cycleCount
    });
  };

  // --- GESTÃO DE DIAS HÍBRIDOS ---
  const handleAddHybridDay = () => {
    const name = newDayName.trim();
    if (!name) return;
    if (hybridWorkouts[name]) {
      showToast('Já existe um treino com esse nome.', 'error');
      return;
    }
    const next = { ...hybridWorkouts, [name]: [] };
    setHybridWorkouts(next);
    setActiveHybridDay(name);
    saveAppState({ hybridWorkouts: next });
    setNewDayName('');
  };

  const handleRemoveHybridDay = (dayName) => {
    const next = { ...hybridWorkouts };
    delete next[dayName];
    const keys = Object.keys(next);
    setHybridWorkouts(next);
    setActiveHybridDay(keys[0] || '');
    saveAppState({ hybridWorkouts: next });
  };

  // --- HIDRATAÇÃO E CALENDÁRIO ---
  const targetDayLog = dailyLogs.find(l => l.date === todayStr) || { water: 0, workout: null };
  const waterTarget = Math.round((Number(userProfile.weight) || 65) * 35);

  const addWater = () => {
    const next = [...dailyLogs];
    const idx = next.findIndex(l => l.date === todayStr);
    if (idx >= 0) next[idx].water = (next[idx].water || 0) + 250;
    else next.push({ date: todayStr, water: 250, workout: null, workouts: [] });
    setDailyLogs(next);
    saveAppState({ dailyLogs: next });
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toLocaleDateString('pt-BR');
      const log = dailyLogs.find(l => l.date === dStr);
      days.push({
        dateNum: d.getDate(),
        dayStr: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        hasWorkout: !!log?.workout
      });
    }
    return days;
  }, [dailyLogs]);

  // --- TELAS DE LOADING / LOGIN / ONBOARDING ---
  if (isAuthLoading || appScreen === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!user || appScreen === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white">
        <ToastContainer toasts={toasts} />
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
          <Dumbbell size={48} className="text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold mb-2">HíbridoFit</h1>
          <p className="text-xs text-zinc-400 mb-6">Calistenia Progressiva & Musculação</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-3 outline-none focus:border-emerald-500"
            placeholder="E-mail"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuthAction()}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4 outline-none focus:border-emerald-500"
            placeholder="Senha"
          />
          {authErrorMsg && <div className="text-red-400 text-xs mb-4 bg-red-500/10 p-3 rounded-xl">{authErrorMsg}</div>}
          <button onClick={handleAuthAction} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl">
            {isLoginMode ? 'Entrar' : 'Criar Conta'}
          </button>
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-5 text-sm text-emerald-400 font-bold block w-full">
            {isLoginMode ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    );
  }

  if (appScreen === 'onboarding') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950 text-white">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4">
          <Activity size={44} className="text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-extrabold text-center">Configurar Perfil</h1>
          <p className="text-xs text-zinc-400 text-center">
            Seu peso corporal será usado automaticamente como carga nos treinos de Calistenia.
          </p>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Nome</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={e => setUserProfile({ ...userProfile, name: e.target.value })}
              placeholder="Seu nome"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Peso Atual (kg)</label>
              <input
                type="number"
                value={userProfile.weight}
                onChange={e => setUserProfile({ ...userProfile, weight: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-emerald-500 font-bold text-emerald-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Meta (kg)</label>
              <input
                type="number"
                value={userProfile.targetWeight}
                onChange={e => setUserProfile({ ...userProfile, targetWeight: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const prof = {
                ...userProfile,
                weight: Number(userProfile.weight) || 65,
                targetWeight: Number(userProfile.targetWeight) || 75,
                onboardingCompleted: true
              };
              setUserProfile(prof);
              saveAppState({
                userProfile: prof,
                cycleState,
                hybridWorkouts
              });
              setAppScreen('main');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold mt-2"
          >
            Iniciar Treinos
          </button>
        </div>
      </div>
    );
  }

  // --- INTERFACE PRINCIPAL ---
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden relative">
      <ToastContainer toasts={toasts} />

      {/* MODAL DE CATÁLOGO / TROCA POR EQUIVALENTE */}
      {catalogModal.open && (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-xl text-white">
                  {catalogModal.action === 'swap' ? 'Trocar por Equivalente' : 'Adicionar Exercício'}
                </h3>
                {catalogModal.filterGroup && (
                  <p className="text-xs text-emerald-400 font-bold">
                    Grupo muscular: {catalogModal.filterGroup}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setCatalogModal({ open: false, action: 'add', targetUid: null, filterGroup: null });
                  setModalSearch('');
                  setModalModalityFilter('Todos');
                }}
                className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filtros de Modalidade */}
            <div className="flex gap-2 mb-3 shrink-0">
              {['Todos', 'Calistenia', 'Musculação'].map(mod => (
                <button
                  key={mod}
                  onClick={() => setModalModalityFilter(mod)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    modalModalityFilter === mod
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {mod}
                </button>
              ))}
              {catalogModal.filterGroup && (
                <button
                  onClick={() => setCatalogModal(prev => ({ ...prev, filterGroup: null }))}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 hover:text-white"
                  title="Mostrar todos os grupos"
                >
                  Ver Todos Grupos
                </button>
              )}
            </div>

            {/* Busca */}
            <div className="relative mb-4 shrink-0">
              <Search size={16} className="absolute left-4 top-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Pesquisar exercício ou grupo..."
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                className="w-full bg-zinc-950 py-3 pl-11 pr-4 rounded-xl border border-zinc-800 outline-none text-white text-sm focus:border-emerald-500"
              />
            </div>

            {/* Lista Filtrada */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {CATALOG_LIST.filter(ex => {
                if (catalogModal.filterGroup && ex.group !== catalogModal.filterGroup) return false;
                if (modalModalityFilter !== 'Todos' && ex.modality !== modalModalityFilter) return false;
                const q = modalSearch.toLowerCase();
                return ex.name.toLowerCase().includes(q) || ex.group.toLowerCase().includes(q);
              }).map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleSelectCatalogExercise(ex)}
                  className="w-full text-left bg-zinc-950 p-4 rounded-2xl hover:border-emerald-500 border border-zinc-800 flex justify-between items-center group transition-all"
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white group-hover:text-emerald-400">{ex.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        ex.modality === 'Calistenia'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {ex.modality}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{ex.group}</p>
                  </div>
                  {catalogModal.action === 'swap'
                    ? <ArrowLeftRight size={18} className="text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                    : <Plus size={18} className="text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TREINO FINALIZADO */}
      {showSuccessModal.open && (
        <div className="fixed inset-0 bg-black/90 z-[85] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              {showSuccessModal.cycleReset ? <Trophy size={34} className="text-yellow-400" /> : <Flame size={34} className="text-emerald-500" />}
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {showSuccessModal.cycleReset ? 'Ciclo Completo! 🏆' : 'Treino Finalizado!'}
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              {showSuccessModal.cycleReset
                ? `Você concluiu todos os 15 treinos de Calistenia! O ciclo foi reiniciado automaticamente para o Treino 1 (Ciclo ${showSuccessModal.cycleCount}).`
                : 'Treino e cargas registrados com sucesso no histórico.'}
            </p>
            <button
              onClick={() => setShowSuccessModal({ open: false, cycleReset: false, cycleCount: 1 })}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-bold"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900/40 border-r border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-10 pl-1">
          <Dumbbell className="text-emerald-500" size={28} />
          <span className="font-extrabold text-xl tracking-tight text-white">HíbridoFit</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <SidebarBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Painel" />
          <SidebarBtn active={activeTab === 'treino'} onClick={() => setActiveTab('treino')} icon={<Dumbbell size={20} />} label="Treinos" />
          <SidebarBtn active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} icon={<History size={20} />} label="Histórico & Cargas" />
          <SidebarBtn active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} icon={<UserCircle size={20} />} label="Perfil" />
        </nav>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-400">
          <p className="font-bold text-white">Ciclo Calistenia #{cycleState.cycleCount}</p>
          <p className="text-emerald-400 mt-0.5">{cycleState.completedIds?.length || 0} / 15 concluídos</p>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-10">
        <div className="max-w-4xl mx-auto p-5 md:p-8">

          {/* === TAB: DASHBOARD === */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Painel</h1>
                  <p className="text-sm text-emerald-400 font-bold mt-1">
                    Peso Atual: {userProfile.weight}kg • Meta: {userProfile.targetWeight}kg
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progresso do Ciclo */}
                <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ciclo Calistenia #{cycleState.cycleCount}</h3>
                    <span className="text-xs font-black text-emerald-400">
                      {cycleState.completedIds?.length || 0} / 15
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 mb-4">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.round(((cycleState.completedIds?.length || 0) / 15) * 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-zinc-300">
                    Próximo treino do ciclo: <strong className="text-white">{CALISTHENICS_CYCLE[cycleState.currentIndex || 0]?.name}</strong>
                  </p>
                </div>

                {/* Hidratação */}
                <div className="bg-blue-950/20 border border-blue-900/30 p-6 rounded-3xl">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Hidratação Hoje</h3>
                  <p className="text-3xl font-black text-white mt-3">
                    {targetDayLog.water} <span className="text-base text-blue-300 font-medium">/ {waterTarget}ml</span>
                  </p>
                  <button onClick={addWater} className="mt-4 bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                    <Plus size={16} /> +250ml
                  </button>
                </div>
              </div>

              {/* Consistência 7 dias */}
              <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Consistência (Últimos 7 Dias)</h3>
                <div className="flex gap-2 overflow-x-auto justify-between">
                  {calendarDays.map((d, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center p-3 rounded-2xl min-w-14 border ${
                        d.hasWorkout ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{d.dayStr}</span>
                      <span className="text-lg font-bold text-white mb-1">{d.dateNum}</span>
                      {d.hasWorkout ? <Smile size={18} className="text-emerald-500" /> : <Frown size={18} className="text-zinc-600" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === TAB: TREINOS === */}
          {activeTab === 'treino' && (
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Treinos</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Carga automática na Calistenia: <span className="text-emerald-400 font-bold">{userProfile.weight} kg (Peso Corporal)</span>
                  </p>
                </div>

                {/* Alternador de Modo */}
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl">
                  <button
                    onClick={() => setWorkoutMode('calistenia')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      workoutMode === 'calistenia' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Ciclo Calistenia (1–15)
                  </button>
                  <button
                    onClick={() => setWorkoutMode('hibrido')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      workoutMode === 'hibrido' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Híbrido / Musculação
                  </button>
                </div>
              </header>

              {/* SELETOR DE TREINO (CALISTENIA 1-15 OU HÍBRIDO) */}
              {workoutMode === 'calistenia' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Ciclo #{cycleState.cycleCount} • Ao finalizar o Treino 15 o ciclo reinicia</span>
                    <button
                      onClick={() => {
                        const reset = { currentIndex: 0, completedIds: [], cycleCount: cycleState.cycleCount };
                        setCycleState(reset);
                        setActiveCalIndex(0);
                        saveAppState({ cycleState: reset });
                        showToast('Ciclo reiniciado para o Treino 1.', 'info');
                      }}
                      className="flex items-center gap-1 text-zinc-400 hover:text-white"
                    >
                      <RotateCcw size={14} /> Reiniciar
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {CALISTHENICS_CYCLE.map((plan, idx) => {
                      const isDone = (cycleState.completedIds || []).includes(plan.id);
                      const isCurrent = activeCalIndex === idx;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setActiveCalIndex(idx)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                            isCurrent
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-500 shadow-lg'
                              : isDone
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          {plan.name}
                          {isDone && <Check size={14} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-bold uppercase">Divisão Híbrida / Musculação</span>
                    <button
                      onClick={() => setIsEditingDays(!isEditingDays)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                    >
                      {isEditingDays ? 'Concluir Edição' : 'Editar Dias'}
                    </button>
                  </div>

                  {isEditingDays ? (
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
                      {Object.keys(hybridWorkouts).map(day => (
                        <div key={day} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <span className="font-bold text-sm">{day}</span>
                          <button onClick={() => handleRemoveHybridDay(day)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg">
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDayName}
                          onChange={e => setNewDayName(e.target.value)}
                          placeholder="Novo treino (ex: Treino E - Braços)"
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                        <button onClick={handleAddHybridDay} className="bg-emerald-600 px-4 rounded-xl text-sm font-bold">
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {Object.keys(hybridWorkouts).map(day => (
                        <button
                          key={day}
                          onClick={() => setActiveHybridDay(day)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                            activeHybridDay === day
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE EXERCÍCIOS DO TREINO ATIVO */}
              <div className="space-y-4">
                {currentExercises.map(ex => {
                  const catalogItem = EXERCISE_CATALOG[ex.exId] || {};
                  const tipText = customTips[ex.exId] || catalogItem.tips || 'Mantenha postura alinhada, respiração controlada e amplitude completa.';
                  const isTipOpen = !!expandedTips[ex.uid];

                  return (
                    <div
                      key={ex.uid}
                      className={`bg-zinc-900 p-5 rounded-3xl border transition-all ${
                        ex.isCompleted ? 'border-emerald-500/50 bg-emerald-950/15 opacity-80' : 'border-zinc-800'
                      }`}
                    >
                      {/* Cabeçalho do Exercício */}
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-lg text-white leading-tight">{ex.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              ex.modality === 'Calistenia'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-blue-500/15 text-blue-400'
                            }`}>
                              {ex.modality}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{ex.group}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Trocar por equivalente */}
                          <button
                            onClick={() => setCatalogModal({ open: true, action: 'swap', targetUid: ex.uid, filterGroup: ex.group })}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/40"
                            title="Trocar por exercício equivalente (Híbrido)"
                          >
                            <ArrowLeftRight size={16} />
                          </button>

                          {/* Cronômetro */}
                          <button
                            onClick={() => setActiveStopwatch(activeStopwatch === ex.uid ? null : ex.uid)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              activeStopwatch === ex.uid
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                            title="Cronômetro (Isometria / Descanso)"
                          >
                            <Timer size={16} />
                          </button>

                          {/* Dicas de execução */}
                          <button
                            onClick={() => setExpandedTips(p => ({ ...p, [ex.uid]: !p[ex.uid] }))}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              isTipOpen
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                            title="Dicas de Execução"
                          >
                            {isTipOpen ? <ChevronUp size={16} /> : <Info size={16} />}
                          </button>

                          {/* Remover */}
                          <button
                            onClick={() => updateCurrentExercises(list => list.filter(x => x.uid !== ex.uid), true)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                            title="Remover exercício"
                          >
                            <Trash size={16} />
                          </button>

                          {/* Check concluir exercício */}
                          <button
                            onClick={() => updateCurrentExercises(
                              list => list.map(x => x.uid === ex.uid ? { ...x, isCompleted: !x.isCompleted } : x),
                              false
                            )}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                              ex.isCompleted
                                ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-white'
                            }`}
                            title="Concluir exercício"
                          >
                            <Check size={18} strokeWidth={3} />
                          </button>
                        </div>
                      </div>

                      {/* Séries, Reps e Carga */}
                      <div className="grid grid-cols-3 gap-3 mt-4 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/60">
                        <div>
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5 text-center">Séries</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={e => updateCurrentExercises(
                              list => list.map(x => x.uid === ex.uid ? { ...x, sets: e.target.value } : x),
                              false
                            )}
                            className="w-full bg-zinc-900 py-2.5 rounded-xl outline-none text-center font-bold text-white border border-zinc-800 focus:border-emerald-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5 text-center">Reps / Tempo</label>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={e => updateCurrentExercises(
                              list => list.map(x => x.uid === ex.uid ? { ...x, reps: e.target.value } : x),
                              false
                            )}
                            className="w-full bg-zinc-900 py-2.5 rounded-xl outline-none text-center font-bold text-white border border-zinc-800 focus:border-emerald-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-emerald-500 font-bold uppercase block mb-1.5 text-center">
                            {ex.modality === 'Calistenia' ? `Auto: ${userProfile.weight}kg + Extra` : 'Carga (kg)'}
                          </label>
                          <input
                            type="number"
                            value={ex.weight}
                            onChange={e => updateCurrentExercises(
                              list => list.map(x => x.uid === ex.uid ? { ...x, weight: e.target.value } : x),
                              false
                            )}
                            placeholder={ex.modality === 'Calistenia' ? '+0 kg' : '0 kg'}
                            className="w-full bg-zinc-900 py-2.5 rounded-xl outline-none text-center font-black text-emerald-400 border border-emerald-900/40 focus:border-emerald-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Cronômetro Inline */}
                      {activeStopwatch === ex.uid && (
                        <InlineStopwatch
                          onClose={() => setActiveStopwatch(null)}
                          onSaveTime={(timeStr) => {
                            updateCurrentExercises(
                              list => list.map(x => x.uid === ex.uid ? { ...x, reps: timeStr } : x),
                              false
                            );
                            setActiveStopwatch(null);
                          }}
                        />
                      )}

                      {/* Dicas de Execução (Salvas no Banco, Zero IA) */}
                      {isTipOpen && (
                        <div className="mt-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <Info size={14} /> Dicas e Sugestões de Execução
                            </span>
                            {editingTipId !== ex.exId && (
                              <button
                                onClick={() => { setEditingTipId(ex.exId); setTempTipText(tipText); }}
                                className="text-[11px] text-zinc-400 hover:text-emerald-400 font-bold"
                              >
                                Editar dica
                              </button>
                            )}
                          </div>

                          {editingTipId === ex.exId ? (
                            <div className="space-y-2">
                              <textarea
                                value={tempTipText}
                                onChange={e => setTempTipText(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 h-20 resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingTipId(null)} className="px-3 py-1.5 text-xs bg-zinc-800 rounded-lg">
                                  Cancelar
                                </button>
                                <button onClick={() => handleSaveCustomTip(ex.exId)} className="px-3 py-1.5 text-xs bg-emerald-600 font-bold rounded-lg">
                                  Salvar no Banco
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-300 leading-relaxed">{tipText}</p>
                          )}
                        </div>
                      )}

                      {/* Links de Tutorial no YouTube */}
                      {(catalogItem.videoUrl || (catalogItem.extraVideos && catalogItem.extraVideos.length > 0)) && (
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          {catalogItem.extraVideos ? (
                            catalogItem.extraVideos.map((v, idx) => (
                              <a
                                key={idx}
                                href={v.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 border border-red-500/20"
                              >
                                <Youtube size={14} /> {v.label}
                              </a>
                            ))
                          ) : (
                            <a
                              href={catalogItem.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 border border-red-500/20"
                            >
                              <Youtube size={14} /> Ver Tutorial
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Adicionar exercício do catálogo */}
              <button
                onClick={() => setCatalogModal({ open: true, action: 'add', targetUid: null, filterGroup: null })}
                className="w-full py-4 bg-zinc-900/50 border-2 border-dashed border-zinc-800 text-zinc-400 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all"
              >
                <Plus size={18} /> Adicionar Exercício (Calistenia ou Musculação)
              </button>

              {/* Finalizar Treino do Dia */}
              <button
                onClick={handleFinishWorkout}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30 active:scale-[0.99] transition-all"
              >
                <Save size={22} /> Finalizar e Registrar Treino do Dia
              </button>
            </div>
          )}

          {/* === TAB: HISTÓRICO & CARGAS (BANCO workout_logs) === */}
          {activeTab === 'historico' && (
            <div className="space-y-6">
              <header>
                <h1 className="text-3xl font-extrabold text-white">Histórico & Cargas</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Banco de dados completo dos treinos finalizados e cargas utilizadas.
                </p>
              </header>

              {workoutLogs.length === 0 ? (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 text-sm">
                  Nenhum treino finalizado ainda. Conclua seu primeiro treino para iniciar o registro!
                </div>
              ) : (
                <div className="space-y-4">
                  {workoutLogs.map(log => (
                    <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                        <div>
                          <h3 className="font-extrabold text-white text-lg">{log.workoutName}</h3>
                          <span className="text-xs text-zinc-500 font-bold">{log.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Volume Total</span>
                          <span className="text-emerald-400 font-black text-sm">{log.totalVolumeKg || 0} kg</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(log.exercises || []).map((ex, i) => (
                          <div key={i} className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-xl text-xs">
                            <div>
                              <span className="font-bold text-zinc-200">{ex.name}</span>
                              <span className="text-[10px] text-zinc-500 ml-2">({ex.modality})</span>
                            </div>
                            <div className="font-bold text-zinc-400">
                              {ex.sets}x{ex.reps} •{' '}
                              <span className="text-emerald-400">
                                {ex.loadKg} kg {ex.isBodyweightAuto ? '(Peso Corp.)' : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === TAB: PERFIL === */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-extrabold text-white">Perfil</h1>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Nome</label>
                  <input
                    type="text"
                    value={userProfile.name || ''}
                    onChange={e => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-emerald-400 font-bold uppercase">Peso Corporal (kg)</label>
                    <input
                      type="number"
                      value={userProfile.weight || ''}
                      onChange={e => setUserProfile({ ...userProfile, weight: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-emerald-500 font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Meta de Peso (kg)</label>
                    <input
                      type="number"
                      value={userProfile.targetWeight || ''}
                      onChange={e => setUserProfile({ ...userProfile, targetWeight: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const updated = {
                      ...userProfile,
                      weight: Number(userProfile.weight) || 65,
                      targetWeight: Number(userProfile.targetWeight) || 75
                    };
                    setUserProfile(updated);
                    saveAppState({ userProfile: updated });
                    showToast('Perfil e peso corporal atualizados!', 'success');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar Perfil
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-4 bg-zinc-900 text-zinc-400 hover:text-red-400 rounded-3xl font-bold border border-zinc-800 flex items-center justify-center gap-2"
              >
                <LogOut size={18} /> Terminar Sessão
              </button>
            </div>
          )}
        </div>
      </main>

      {/* NAVEGAÇÃO MOBILE */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 px-6 py-3.5 rounded-full z-50 shadow-2xl flex gap-7 text-zinc-400">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-emerald-400' : ''}>
          <LayoutDashboard size={22} />
        </button>
        <button onClick={() => setActiveTab('treino')} className={activeTab === 'treino' ? 'text-emerald-400' : ''}>
          <Dumbbell size={22} />
        </button>
        <button onClick={() => setActiveTab('historico')} className={activeTab === 'historico' ? 'text-emerald-400' : ''}>
          <History size={22} />
        </button>
        <button onClick={() => setActiveTab('perfil')} className={activeTab === 'perfil' ? 'text-emerald-400' : ''}>
          <UserCircle size={22} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}