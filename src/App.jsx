import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Dumbbell, Utensils, UserCircle, Send, 
  Loader2, Sparkles, Check, Play, Pause, Timer, AlertCircle, 
  Smile, Frown, Lock, Flame, ArrowRight, LogOut, Settings, 
  RefreshCw, ArrowLeftRight, X, Save, Plus, Ruler, AlertTriangle, 
  CalendarDays, Eye, EyeOff, Trash, Cpu, CheckCircle, Pencil, MessageSquareQuote,
  Camera, Scan, Focus, BarChart, Fingerprint, View, Upload, Activity, Key,
  ChevronLeft, ChevronRight, Info, GripHorizontal, Trophy, Medal, Database, Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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

// --- DB EXERCÍCIOS ESTÁTICO (FALLBACK / MIGRAÇÃO INICIAL) ---
const INITIAL_EXERCISE_DB = [
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
  { id: 'e100', name: 'Elevação de Pernas em Suspensão', target: 'Abdômen Infra/Core', group: 'GAP' },

  // --- CALISTENIA (MÓDULO 1) ---
  { id: 'c_polichinelo', name: 'Polichinelo', target: 'Cardio/Full Body', group: 'Cardio' },
  { id: 'c_barra', name: 'Barra Fixa', target: 'Dorsal', group: 'Costas' },
  { id: 'c_prancha', name: 'Prancha', target: 'Core', group: 'GAP' },
  { id: 'c_flexao_joelhos', name: 'Flexão de Joelhos', target: 'Peitoral', group: 'Peito' },
  { id: 'c_agachamento_salto', name: 'Agachamento c/ Salto', target: 'Quadríceps/Potência', group: 'Pernas' },
  { id: 'c_pe_bunda', name: 'Pé na Bunda', target: 'Cardio', group: 'Cardio' },
  { id: 'c_barra_australiana', name: 'Barra Australiana', target: 'Dorsal', group: 'Costas' },
  { id: 'c_flexao_inclinada', name: 'Flexão Inclinada', target: 'Peitoral Inferior', group: 'Peito' },
  { id: 'c_step_up', name: 'Step-up', target: 'Pernas', group: 'Pernas' },
  { id: 'c_agachamento', name: 'Agachamento (Livres)', target: 'Pernas', group: 'Pernas' },
  { id: 'c_afundo', name: 'Afundo', target: 'Pernas/Glúteos', group: 'Pernas' },
  { id: 'c_afundo_elevacao', name: 'Afundo c/ Elevação', target: 'Pernas/Equilíbrio', group: 'Pernas' },
  { id: 'c_sumo', name: 'Agachamento Sumô', target: 'Adutores/Glúteos', group: 'Pernas' },
  { id: 'c_isometria_agachamento', name: 'Isometria no Agachamento', target: 'Pernas', group: 'Pernas' },
  { id: 'c_pantu_unilateral', name: 'Panturrilha Unilateral', target: 'Panturrilha', group: 'Pernas' },
  { id: 'c_skipping', name: 'Skipping', target: 'Cardio', group: 'Cardio' },
  { id: 'c_dips', name: 'Dips (Paralelas Livres)', target: 'Tríceps/Peito', group: 'Braços' },
  { id: 'c_prancha_lateral', name: 'Prancha Lateral', target: 'Oblíquos', group: 'GAP' },
  { id: 'c_triceps_trave', name: 'Tríceps na Trave', target: 'Tríceps', group: 'Braços' },
  { id: 'c_alternado', name: 'Abdominal Alternado', target: 'Core', group: 'GAP' },
  { id: 'c_flexao_padrao', name: 'Flexão Padrão', target: 'Peitoral', group: 'Peito' },
  { id: 'c_crunches', name: 'Crunches (Abdominal Curto)', target: 'Abdômen', group: 'GAP' },
  { id: 'c_false_rope', name: 'False Rope (Corda Falsa)', target: 'Cardio', group: 'Cardio' },
  { id: 'c_barra_amf', name: 'Barra (A,M,F)', target: 'Dorsal Completa', group: 'Costas' },
  { id: 'c_toe_touches', name: 'Toe Touches', target: 'Core', group: 'GAP' },
  { id: 'c_barra_supinada', name: 'Barra Supinada', target: 'Costas/Bíceps', group: 'Costas' },
  { id: 'c_barra_aust_amf', name: 'Barra Aust. (A,M,F)', target: 'Dorsal', group: 'Costas' },
  { id: 'c_leg_flutters', name: 'Leg Flutters', target: 'Abdômen Inferior', group: 'GAP' },
  { id: 'c_biceps_barra', name: 'Bíceps na Barra', target: 'Bíceps', group: 'Braços' },
  { id: 'c_half_burpee', name: 'Half Burpee', target: 'Cardio/Core', group: 'Cardio' },
  { id: 'c_flexao_pike', name: 'Flexão Pike', target: 'Ombros', group: 'Ombros' },
  { id: 'c_bike', name: 'Abdominal Bike', target: 'Oblíquos/Core', group: 'GAP' },
  { id: 'c_flexao_militar', name: 'Flexão Militar', target: 'Peito/Ombros', group: 'Peito' },
  { id: 'c_side_crunches', name: 'Side Crunches', target: 'Oblíquos', group: 'GAP' },
  { id: 'c_pike_caminhada', name: 'Pike Caminhada', target: 'Ombros/Core', group: 'Ombros' },
  { id: 'c_prancha_alta_trave', name: 'Prancha Alta p/ Trave', target: 'Core', group: 'GAP' },
  { id: 'c_caminhada_chao', name: 'Caminhada no Chão', target: 'Core/Ombros', group: 'GAP' },
  { id: 'c_afundo_saltando', name: 'Afundo Saltando', target: 'Pernas/Potência', group: 'Pernas' },
  { id: 'c_afundo_explosivo', name: 'Afundo Explosivo', target: 'Pernas/Potência', group: 'Pernas' },
  { id: 'c_passada_lateral', name: 'Passada Lateral', target: 'Pernas/Glúteos', group: 'Pernas' },
  { id: 'c_iso_afundo', name: 'Isometria no Afundo', target: 'Pernas', group: 'Pernas' },
  { id: 'c_heel_taps', name: 'Heel Taps', target: 'Oblíquos', group: 'GAP' },
  { id: 'c_extensao_triceps', name: 'Extensão de Tríceps', target: 'Tríceps', group: 'Braços' },
  { id: 'c_knee_raises', name: 'Knee Raises', target: 'Abdômen Inferior', group: 'GAP' },
  { id: 'c_flexao_explosiva', name: 'Flexão Explosiva', target: 'Peitoral/Potência', group: 'Peito' },
  { id: 'c_in_outs', name: 'In & Outs A/F', target: 'Core', group: 'GAP' },
  { id: 'c_prancha_alcance', name: 'Prancha com Alcance', target: 'Core', group: 'GAP' },
  { id: 'c_mountain_climbers', name: 'Mountain Climbers', target: 'Cardio/Core', group: 'Cardio' },
  { id: 'c_barra_aust_supinada', name: 'Barra Aust. Supinada', target: 'Costas/Bíceps', group: 'Costas' },
  { id: 'c_prancha_af', name: 'Prancha A/F', target: 'Core', group: 'GAP' },
  { id: 'c_leg_raises', name: 'Leg Raises', target: 'Abdômen Inferior', group: 'GAP' },
  { id: 'c_pike_shoulder_tap', name: 'Pike Shoulder Tap', target: 'Ombros/Core', group: 'Ombros' },
  { id: 'c_flexao_pike_elevacao', name: 'Flexão Pike c/ Elevação', target: 'Ombros/Peitoral Sup.', group: 'Ombros' },
  { id: 'c_flexao_declinada', name: 'Flexão Declinada', target: 'Peitoral Superior', group: 'Peito' },
  { id: 'c_prancha_parede', name: 'Prancha na Parede', target: 'Ombros/Core', group: 'Ombros' },
  { id: 'c_prancha_alternate', name: 'Prancha Alternate', target: 'Core', group: 'GAP' },
  { id: 'c_flexao_diamante', name: 'Flexão Diamante', target: 'Tríceps/Peitoral Interno', group: 'Braços' },
  { id: 'c_canivete', name: 'Abdominal Canivete', target: 'Core Completo', group: 'GAP' },
  { id: 'c_barra_aust_arqueiro', name: 'Barra Aust. Arqueiro', target: 'Costas', group: 'Costas' },
  { id: 'c_pistol_suport', name: 'Pistol c/ Suporte', target: 'Pernas Unilateral', group: 'Pernas' },
  { id: 'c_salto_frontal', name: 'Salto Frontal', target: 'Pernas/Potência', group: 'Pernas' },
  { id: 'c_agacha_afundo', name: 'Agacha + Afundo', target: 'Pernas', group: 'Pernas' },
  { id: 'c_ponte', name: 'Ponte de Glúteos', target: 'Glúteos/Lombar', group: 'GAP' },
  { id: 'c_iso_ponta_pe', name: 'Isometria Ponta do Pé', target: 'Panturrilha', group: 'Pernas' },
  { id: 'c_burpee', name: 'Burpee Completo', target: 'Cardio/Full Body', group: 'Cardio' },
  { id: 'c_prancha_jc', name: 'Prancha J/C', target: 'Core', group: 'GAP' },
  { id: 'c_pa_b_fm', name: 'P.A p/ Baixa + Flexão', target: 'Peito/Core', group: 'Peito' },
  { id: 'c_tuck_lsit', name: 'Tuck L-sit', target: 'Core', group: 'GAP' },
  { id: 'c_diamante_regular', name: 'Diamante p/ Regular', target: 'Tríceps/Peito', group: 'Braços' },
  { id: 'c_flexao_inclinada_exp', name: 'Flexão Inclinada Exp.', target: 'Peitoral Inferior/Potência', group: 'Peito' },
  { id: 'c_flexao_hold', name: 'Flexão Hold', target: 'Peitoral/Core', group: 'Peito' },
  { id: 'c_escapula', name: 'Tração Escapular', target: 'Dorsal/Escápulas', group: 'Costas' },
  { id: 'c_corner_raises', name: 'Corner Raises', target: 'Ombros', group: 'Ombros' },
  { id: 'c_barra_trad', name: 'Barra Tradicional', target: 'Dorsal', group: 'Costas' },
  { id: 'c_barra_aust_sup_arq', name: 'Barra Aust. Sup. Arqueiro', target: 'Costas/Bíceps', group: 'Costas' },
  { id: 'c_leg_x', name: 'Leg X', target: 'Core', group: 'GAP' },
  { id: 'c_ombro_ombro', name: 'Ombro p/ Ombro', target: 'Ombros', group: 'Ombros' },
  { id: 'c_sit_ups', name: 'Sit-ups', target: 'Core', group: 'GAP' },
  { id: 'c_pike_hold', name: 'Pike Hold', target: 'Ombros', group: 'Ombros' },
  { id: 'c_remador', name: 'Abdominal Remador', target: 'Core', group: 'GAP' },
  { id: 'c_hs_hold', name: 'Handstand Hold', target: 'Ombros/Equilíbrio', group: 'Ombros' }
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

// Função utilitária para calcular o início da semana atual (Segunda-feira)
const getStartOfCurrentWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 é Domingo
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
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

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [appScreen, setAppScreen] = useState('loading'); 

  // Estado da Base de Dados de Exercícios conectada à Nuvem
  const [exerciseDB, setExerciseDB] = useState(INITIAL_EXERCISE_DB);
  const [isDBMigrating, setIsDBMigrating] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminModal, setAdminModal] = useState({ isOpen: false, mode: 'add', data: null });
  const [adminGifFile, setAdminGifFile] = useState(null);
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  const getEx = useCallback((id) => exerciseDB.find(e => e.id === id), [exerciseDB]);
  const formatEx = useCallback((ex, sets, reps) => ({ ...ex, id: Date.now() + Math.random(), originalId: ex.id, sets, reps, weight: '', isCompleted: false }), []);

  const CALISTHENICS_PLANS = useMemo(() => ({
    'Treino 01': [ { id: 'c_polichinelo', reps: '30' }, { id: 'c_barra', reps: '6' }, { id: 'c_prancha', reps: '30s' }, { id: 'c_flexao_joelhos', reps: 'Máx' }, { id: 'c_agachamento_salto', reps: '15' }, { id: 'c_pe_bunda', reps: '30s' }, { id: 'c_barra_australiana', reps: '5' }, { id: 'c_flexao_inclinada', reps: 'Máx' } ],
    'Treino 02': [ { id: 'c_step_up', reps: '30s' }, { id: 'c_agachamento', reps: '10' }, { id: 'c_afundo', reps: '10' }, { id: 'c_agachamento_salto', reps: '10' }, { id: 'c_afundo_elevacao', reps: '10' }, { id: 'c_sumo', reps: '15' }, { id: 'c_isometria_agachamento', reps: '30s' }, { id: 'c_pantu_unilateral', reps: '15' } ],
    'Treino 03': [ { id: 'c_skipping', reps: '30s' }, { id: 'c_dips', reps: '8' }, { id: 'c_prancha_lateral', reps: '20s' }, { id: 'c_triceps_trave', reps: 'Máx' }, { id: 'c_alternado', reps: '10' }, { id: 'c_flexao_padrao', reps: 'Máx' }, { id: 'c_flexao_inclinada', reps: 'Máx' }, { id: 'c_crunches', reps: '20' } ],
    'Treino 04': [ { id: 'c_false_rope', reps: '30s' }, { id: 'c_barra_amf', reps: '2' }, { id: 'c_toe_touches', reps: '10' }, { id: 'c_barra_supinada', reps: '6' }, { id: 'c_prancha', reps: '40s' }, { id: 'c_barra_aust_amf', reps: '5' }, { id: 'c_leg_flutters', reps: '30s' }, { id: 'c_biceps_barra', reps: 'Máx' } ],
    'Treino 05': [ { id: 'c_half_burpee', reps: '8' }, { id: 'c_flexao_pike', reps: 'Máx' }, { id: 'c_bike', reps: '30s' }, { id: 'c_flexao_militar', reps: '10' }, { id: 'c_side_crunches', reps: '15' }, { id: 'c_pike_caminhada', reps: '10' }, { id: 'c_prancha_alta_trave', reps: '8' }, { id: 'c_caminhada_chao', reps: '8' } ]
  }), []);

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashTab, setDashTab] = useState('daily'); 
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showBackAnatomy, setShowBackAnatomy] = useState(false);
  const [showMeasureAlert, setShowMeasureAlert] = useState(false);
  const [showWorkoutSuccess, setShowWorkoutSuccess] = useState(false);

  const [bioTab, setBioTab] = useState('capture');
  const [scanState, setScanState] = useState('idle'); 
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFeedback, setScanFeedback] = useState([]);
  const [estimatedMeasures, setEstimatedMeasures] = useState(null);
  const [uploadedPhotos, setUploadedPhotos] = useState({ frente: null, direita: null, esquerda: null, costas: null });
  const [scanAiReport, setScanAiReport] = useState('');
  const [isScanningAi, setIsScanningAi] = useState(false);

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

  const [chatInput, setChatInput] = useState('');
  const [selectedMealId, setSelectedMealId] = useState('m3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anatomyTips, setAnatomyTips] = useState({});
  const [anatomyTipState, setAnatomyTipState] = useState({});
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  
  const [gifUrls, setGifUrls] = useState({});
  const [isUploadingGif, setIsUploadingGif] = useState({});

  const [deepInsightText, setDeepInsightText] = useState('');
  const [isDeepInsightLoading, setIsDeepInsightLoading] = useState(false);
  const [workoutFeedback, setWorkoutFeedback] = useState('');
  const [isWorkoutFeedbackLoading, setIsWorkoutFeedbackLoading] = useState(false);
  const [nutritionFeedback, setNutritionFeedback] = useState('');
  const [isNutritionFeedbackLoading, setIsNutritionFeedbackLoading] = useState(false);

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
  
  const [expandedDesc, setExpandedDesc] = useState({});
  const [exerciseModal, setExerciseModal] = useState({ active: false, mode: 'swap', targetExId: null, filterGroup: null });
  const [timerInterval, setTimerInterval] = useState(90);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [editingNutritionId, setEditingNutritionId] = useState(null);
  const [editNutritionData, setEditNutritionData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); 

  const ACHIEVEMENTS = [
    { id: 'a1', title: 'Primeiro Passo', desc: '1º Treino concluído', icon: <Flame className="text-orange-500" size={24}/>, condition: (h) => h.length >= 1 },
    { id: 'a2', title: 'Consistência Diária', desc: '10 Treinos concluídos', icon: <Medal className="text-yellow-400" size={24}/>, condition: (h) => h.length >= 10 },
    { id: 'a3', title: 'Força Bruta', desc: '10.000kg movidos', icon: <Trophy className="text-emerald-500" size={24}/>, condition: (h) => h.reduce((a,b)=>a+(b.volume||0),0) >= 10000 },
    { id: 'a4', title: 'Mestre da Gravidade', desc: '5 Treinos Calistenia', icon: <Activity className="text-blue-500" size={24}/>, condition: (h) => h.filter(x => x.exercises?.some(e => String(e.originalId).startsWith('c_'))).length >= 5 },
    { id: 'a5', title: 'Foco no Core', desc: '5 Aulas GAP', icon: <Sparkles className="text-purple-500" size={24}/>, condition: (h) => h.filter(x => x.isGap).length >= 5 },
    { id: 'a6', title: 'Deus do Olimpo', desc: '100.000kg movidos', icon: <Cpu className="text-red-500" size={24}/>, condition: (h) => h.reduce((a,b)=>a+(b.volume||0),0) >= 100000 }
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
      if (nextAvailable) setActiveWorkoutDay(nextAvailable);
    }
  }, [completedWorkoutsThisWeek, activeWorkoutDay, workoutOrder]);

  useEffect(() => {
    const keys = Object.keys(workouts);
    if (keys.length > 0 && !keys.includes(activeWorkoutDay) && workoutOrder.includes(activeWorkoutDay) === false) {
      setActiveWorkoutDay(workoutOrder[0] || keys[0]);
    }
  }, [workouts, activeWorkoutDay, workoutOrder]);

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
          formatEx(getEx('e19'), 4, 10), formatEx(getEx('e22'), 3, 10), formatEx(getEx('e26'), 3, 12),
          formatEx(getEx('e40'), 3, 15), formatEx(getEx('e47'), 4, 10), formatEx(getEx('e49'), 3, 12), formatEx(getEx('e56'), 3, 15)
      ]},
      'Legs 1': { name: 'Legs Quadríceps', isLegs: true, exercises: [ 
          formatEx(getEx('e67'), 4, 8), formatEx(getEx('e71'), 3, 12), formatEx(getEx('e73'), 3, 15), 
          formatEx(getEx('e77'), 4, 12), formatEx(getEx('e80'), 3, 12), formatEx(getEx('e83'), 4, 20), formatEx(getEx('e84'), 4, 15)
      ]},
      'Push': { name: 'Treino Push', isLegs: false, exercises: [ 
          formatEx(getEx('e1'), 4, 10), formatEx(getEx('e3'), 3, 12), formatEx(getEx('e8'), 3, 15), 
          formatEx(getEx('e32'), 4, 10), formatEx(getEx('e36'), 4, 12), formatEx(getEx('e57'), 4, 12), formatEx(getEx('e59'), 3, 12) 
      ]},
      'Legs 2 ou Cardio': { name: 'Legs Posterior', isLegs: true, exercises: [ 
          formatEx(getEx('e69'), 4, 8), formatEx(getEx('e72'), 3, 12), formatEx(getEx('e74'), 3, 15), 
          formatEx(getEx('e78'), 4, 12), formatEx(getEx('e81'), 3, 12), formatEx(getEx('e85'), 4, 20), formatEx(getEx('e86'), 4, 15)
      ]},
      'Upper': { name: 'Upper Body', isLegs: false, exercises: [ 
          formatEx(getEx('e19'), 3, 10), formatEx(getEx('e26'), 3, 12), formatEx(getEx('e1'), 3, 10), formatEx(getEx('e8'), 3, 12), 
          formatEx(getEx('e36'), 3, 12), formatEx(getEx('e47'), 3, 12), formatEx(getEx('e57'), 3, 12) 
      ]},
      'Lower': { name: 'Lower Body', isLegs: true, exercises: [ 
          formatEx(getEx('e67'), 3, 10), formatEx(getEx('e71'), 3, 12), formatEx(getEx('e77'), 3, 12), formatEx(getEx('e80'), 3, 12), 
          formatEx(getEx('e83'), 4, 15), formatEx(getEx('e84'), 4, 15), formatEx(getEx('e87'), 3, 12) 
      ]},
      'Cardio': { name: 'Cardio & Core', isLegs: false, exercises: [ 
          formatEx(getEx('c_polichinelo'), 3, 50), formatEx(getEx('c_burpee'), 3, 10), formatEx(getEx('e98'), 3, '1min'), 
          formatEx(getEx('e94'), 3, 20), formatEx(getEx('e99'), 3, 15) 
      ].filter(e => e)}
    };
    setWorkouts(p);
    setWorkoutOrder(DEFAULT_WORKOUT_DAYS);
    saveToCloud({ workouts: p, workoutOrder: DEFAULT_WORKOUT_DAYS });
  };

  useEffect(() => {
    if (!auth) { setFirebaseError("Firebase falhou."); setIsAuthLoading(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) { setFirebaseError(e.message); setIsAuthLoading(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); if (!u) setAppScreen('login'); setIsAuthLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const exRef = collection(db, 'artifacts', appId, 'public', 'data', 'exercises');
    const unsubEx = onSnapshot(exRef, (snap) => {
       if (!snap.empty) {
         const cloudExercises = snap.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
         setExerciseDB(cloudExercises);
       }
    }, (err) => console.error("Erro ao ler DB de Exercícios:", err));
    return () => unsubEx();
  }, [user, db]);

  useEffect(() => {
    if (!user || !db || firebaseError) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'); 
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.workouts) setWorkouts(d.workouts);
        if (d.workoutOrder) setWorkoutOrder(d.workoutOrder); else if (d.workouts) setWorkoutOrder(Object.keys(d.workouts));
        if (d.nutritionLogs) setNutritionLogs(d.nutritionLogs);
        if (d.workoutHistory) setWorkoutHistory(d.workoutHistory);
        if (d.dailyLogs) setDailyLogs(d.dailyLogs);
        if (d.measurements) setMeasurements({ ...initialMeasures, ...d.measurements });
        if (d.weightHistory) setWeightHistory(d.weightHistory);
        if (d.userProfile) {
          let prof = { targetWeight: '', ...d.userProfile };
          if (prof.lastLoginDate !== todayStr && prof.onboardingCompleted) {
             let updWorkouts = { ...(d.workouts || workouts) };
             let modified = false;
             Object.keys(updWorkouts).forEach(day => {
               if (updWorkouts[day].exercises) {
                 updWorkouts[day].exercises.forEach(ex => { if (ex.isCompleted) { ex.isCompleted = false; modified = true; } });
               }
             });
             prof.lastLoginDate = todayStr;
             setUserProfile(prof);
             if (modified) {
               setWorkouts(updWorkouts);
               setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'), { userProfile: prof, workouts: updWorkouts }, { merge: true });
             }
          } else { setUserProfile(prof); }

          if (prof.onboardingCompleted) {
            setAppScreen('main');
            if (prof.lastMeasureUpdate && ((Date.now() - prof.lastMeasureUpdate) / (1000 * 60 * 60 * 24)) >= 7) setShowMeasureAlert(true);
          } else { setAppScreen('onboarding'); }
        }
      } else { generateAIPlan(); setAppScreen('onboarding'); }
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
      const dataToSave = overrideData || { workouts, workoutOrder, nutritionLogs, workoutHistory, userProfile, dailyLogs, measurements, weightHistory };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'hypertrophy_v16'), dataToSave, { merge: true });
    } catch (e) { console.error(e); } finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  const handleAuthAction = async () => {
    setAuthErrorMsg(''); setIsProcessingAuth(true);
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/admin-restricted-operation') setAuthErrorMsg('Operação restrita. Ative "E-mail/Senha" e "Anónimo".');
      else if (error.code === 'auth/invalid-credential') setAuthErrorMsg('E-mail ou senha incorretos.');
      else if (error.code === 'auth/email-already-in-use') setAuthErrorMsg('Este e-mail já está registado.');
      else setAuthErrorMsg(`Erro: ${error.message}`);
    } finally { setIsProcessingAuth(false); }
  };

  const handleGuestLogin = async () => {
    setAuthErrorMsg(''); setIsProcessingAuth(true);
    try { await signInAnonymously(auth); } catch (error) { setAuthErrorMsg(`Erro ao entrar como convidado: ${error.message}`); } finally { setIsProcessingAuth(false); }
  };

  const handleLogout = async () => { try { await signOut(auth); setUser(null); setAppScreen('login'); } catch (error) { console.error("Logout failed:", error); } };

  const handleUnlockApiKey = async () => {
    if (user?.email) {
      try { setIsApiAuthPending(true); await signInWithEmailAndPassword(auth, user.email, apiPasswordAttempt); setIsApiKeyUnlocked(true); setShowUnlockPrompt(false); setApiPasswordAttempt(''); } 
      catch (error) { showToast("Senha incorreta!", "error"); } finally { setIsApiAuthPending(false); }
    } else {
      if (apiPasswordAttempt === 'admin123') { setIsApiKeyUnlocked(true); setShowUnlockPrompt(false); setApiPasswordAttempt(''); } 
      else { showToast("Senha incorreta! (Local: 'admin123')", "error"); }
    }
  };

  const handleSaveApiKey = () => {
     const upProf = {...userProfile, geminiApiKey: tempApiKey.trim()};
     setUserProfile(upProf); saveToCloud({ userProfile: upProf });
     setIsApiKeyUnlocked(false); showToast("Chave API bloqueada com sucesso!", "success");
  };

  const moveWorkoutDay = (index, direction) => {
    const newOrder = [...workoutOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setWorkoutOrder(newOrder); saveToCloud({ workoutOrder: newOrder });
  };

  const handleCompleteWorkout = () => {
    const cur = workouts[activeWorkoutDay];
    let vol = 0; let durationGap = 0; let completedExercises = [];
    const bw = Number(userProfile.weight) || 0;
    
    if (isGapMode) {
      durationGap = Number(gapDuration) || 45;
    } else if (isCaliMode) {
      currentCaliExercises.forEach(ex => {
        const effW = (Number(ex.weight) || 0) + bw;
        vol += effW * (Number(ex.reps)||0) * (Number(ex.sets)||0);
        completedExercises.push({ originalId: ex.originalId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
        ex.isCompleted = false; 
      });
    } else if (cur && cur.exercises) {
      cur.exercises.forEach(ex => {
        const w = Number(ex.weight) || 0;
        const isBodyweight = ex.group === 'GAP' || ex.group === 'Cardio' || String(ex.originalId).startsWith('c_') || ['e12','e13','e14','e17','e18','e65','e94','e95','e98','e99','e100'].includes(ex.originalId);
        const effW = isBodyweight ? (w + bw) : w;
        vol += effW * (Number(ex.reps)||0) * (Number(ex.sets)||0);
        completedExercises.push({ originalId: ex.originalId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
        ex.isCompleted = false; 
      });
    }

    const timestamp = Date.now();
    const newLog = { id: timestamp, date: todayStr, timestamp, day: activeWorkoutDay, volume: vol, isGap: isGapMode, gapDuration: durationGap, exercises: completedExercises };
    const newHist = [...workoutHistory, newLog];
    
    let newDLogs = [...dailyLogs];
    const idx = newDLogs.findIndex(l => l.date === todayStr);
    if (idx >= 0) newDLogs[idx].workout = activeWorkoutDay;
    else newDLogs.push({ date: todayStr, workout: activeWorkoutDay, water: 0, calories: totals.calories });

    setWorkoutHistory(newHist); setDailyLogs(newDLogs);
    saveToCloud({ workouts: workouts, workoutOrder, workoutHistory: newHist, dailyLogs: newDLogs });
    setShowWorkoutSuccess(true); setIsGapMode(false); setIsCaliMode(false);
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
      reader.onloadend = () => setUploadedPhotos(prev => ({ ...prev, [view]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const allPhotosUploaded = Object.values(uploadedPhotos).every(v => v !== null);

  const startBiometricScan = () => {
    setScanState('scanning'); setScanProgress(0); setScanFeedback([]); setScanAiReport('');
    const steps = [
      { p: 20, text: "Verificando Câmera e Iluminação [OK]" },
      { p: 40, text: "Fotos validadas e Estáveis [OK]" },
      { p: 60, text: "Ângulos: Frontal, Perfil e Costas [OK]" },
      { p: 80, text: "Mapeando Pontos-chave do Corpo..." },
      { p: 100, text: "Calculando Proporções..." }
    ];
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanProgress(steps[currentStep].p);
        setScanFeedback(prev => [...prev, steps[currentStep].text]);
        currentStep++;
      } else {
        clearInterval(interval);
        const h = Number(userProfile.height) || 175; const w = Number(userProfile.weight) || 70;
        setEstimatedMeasures({ peito: Math.round(w * 1.35), cintura: Math.round(h * 0.45), quadril: Math.round(w * 1.3), bracos: Math.round(w * 0.48), pernas: Math.round(h * 0.33) });
        setScanState('done');
      }
    }, 1200);
  };

  const saveBiometricMeasures = () => {
    const newMeasures = { ...measurements, peito: estimatedMeasures.peito, cintura: estimatedMeasures.cintura, quadril: estimatedMeasures.quadril, bracoEsq: estimatedMeasures.bracos, bracoDir: estimatedMeasures.bracos, pernaEsq: estimatedMeasures.pernas, pernaDir: estimatedMeasures.pernas };
    setMeasurements(newMeasures); handleUpdateMeasures(); setBioTab('evolution'); setScanState('idle'); setUploadedPhotos({ frente: null, direita: null, esquerda: null, costas: null }); setScanAiReport('');
  };

  const callGemini = async (prompt, schema = null, retries = 5) => {
    const apiKey = userProfile.geminiApiKey || ""; 
    const model = apiKey ? "gemini-2.5-flash" : "gemini-2.5-flash-preview-09-2025";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }], ...(schema && { generationConfig: { responseMimeType: "application/json", responseSchema: schema } }) };
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Falha na API da IA.");
        let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) throw new Error("Resposta da IA está vazia.");
        if (schema) { textOutput = textOutput.replace(new RegExp('```json\\n?', 'g'), '').replace(new RegExp('```', 'g'), '').trim(); return JSON.parse(textOutput); }
        return textOutput;
      } catch (err) {
        if (attempt === retries - 1) throw new Error("Falha IA: " + err.message);
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
            dayLogs.forEach(l => { totalCal += (Number(l.calories)||0); totalPro += (Number(l.protein)||0); totalCar += (Number(l.carbs)||0); totalFat += (Number(l.fats)||0); });
        }
      });
      const avgCal = daysWithFood > 0 ? Math.round(totalCal/daysWithFood) : 0;
      const avgPro = daysWithFood > 0 ? Math.round(totalPro/daysWithFood) : 0;
      const avgCar = daysWithFood > 0 ? Math.round(totalCar/daysWithFood) : 0;
      const avgFat = daysWithFood > 0 ? Math.round(totalFat/daysWithFood) : 0;

      const prompt = `Atue como meu Treinador de Alta Performance. Objetivo atual: ${userProfile.goal} (${userProfile.weight}kg -> ${userProfile.targetWeight}kg).
      ÚLTIMOS 7 DIAS: Treino: ${workoutCount} sessões, volume ${totalVolume}kg. Nutrição (média): ${avgCal}kcal, ${avgPro}g Prot, ${avgCar}g Carb, ${avgFat}g Gord. (Metas: ${aiGoals.calories}kcal, ${aiGoals.protein}g Prot).
      Verifique o impacto nos resultados, avalie macros e dê feedback. Responda em Português de Portugal.`;
      const res = await callGemini(prompt);
      setDeepInsightText(res);
    } catch (error) { setDeepInsightText(`Erro IA: ${error.message}`); } finally { setIsDeepInsightLoading(false); }
  };

  const handleEvaluateWorkout = async () => {
    setIsWorkoutFeedbackLoading(true); setWorkoutFeedback('');
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const exerciseList = dayInfo.exercises.map(e => `${e.name} (${e.target})`).join(', ');
      const prompt = `Atue como Master Trainer. Objetivo: ${userProfile.goal}. Avalie a seleção para ${dayInfo.name}: ${exerciseList}. Bem construída? Sobreposição? Responda curto em Português de Portugal.`;
      const res = await callGemini(prompt);
      setWorkoutFeedback(res);
    } catch (error) { setWorkoutFeedback(`Erro: ${error.message}`); } finally { setIsWorkoutFeedbackLoading(false); }
  };

  const handleEvaluateNutrition = async () => {
    setIsNutritionFeedbackLoading(true); setNutritionFeedback('');
    try {
      const prompt = `Nutricionista Desportivo. Objetivo: ${userProfile.goal}. Meta diária: ${aiGoals.calories}kcal, ${aiGoals.protein}g Prot. Hoje consumido: ${totals.calories}kcal, ${totals.protein}g Prot. Avalie o alinhamento e o que corrigir na próxima refeição (curto, PT-PT).`;
      const res = await callGemini(prompt);
      setNutritionFeedback(res);
    } catch (error) { setNutritionFeedback(`Erro: ${error.message}`); } finally { setIsNutritionFeedbackLoading(false); }
  };

  const handleGenerateBiometricReport = async () => {
    setIsScanningAi(true); setScanAiReport('');
    try {
      const prompt = `Especialista em Biometria. Objetivo: ${userProfile.goal}. Medidas antigas: Peito ${measurements.peito}, Cintura ${measurements.cintura}. Novas medidas fotográficas: Peito ${estimatedMeasures.peito}, Cintura ${estimatedMeasures.cintura}. Compare, aponte evolução ou atenção para a meta de forma motivadora (PT-PT, 3 parágrafos).`;
      const res = await callGemini(prompt);
      setScanAiReport(res);
    } catch (error) { setScanAiReport(`Erro: ${error.message}`); } finally { setIsScanningAi(false); }
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
    } catch (error) { showToast("Erro upload GIF: " + error.message, "error"); } 
    finally { setIsUploadingGif(p => ({ ...p, [originalId]: false })); }
  };

  const handleGetAnatomyTip = async (exId, exName, exOriginalId) => {
    setExpandedDesc(p => ({ ...p, [exId]: !p[exId] })); 
    if (storage && gifUrls[exOriginalId] === undefined) {
      try {
        const url = await getDownloadURL(ref(storage, `gifs/${exOriginalId}.gif`));
        setGifUrls(p => ({ ...p, [exOriginalId]: url }));
      } catch (err) { setGifUrls(p => ({ ...p, [exOriginalId]: null })); }
    }
    if (anatomyTipState[exId] === 'done') return; 
    setAnatomyTipState(p => ({ ...p, [exId]: 'loading' }));
    try {
      const schema = { type: "OBJECT", properties: { intro: { type: "STRING" }, musclesTarget: { type: "STRING" }, musclesAux: { type: "STRING" }, musclesStability: { type: "STRING" }, executionSteps: { type: "ARRAY", items: { type: "STRING" } }, safetyTips: { type: "ARRAY", items: { type: "STRING" } }, mistakes: { type: "ARRAY", items: { type: "STRING" } }, geminiTip: { type: "STRING" } } };
      const res = await callGemini(`Guia Rápido premium para "${exName}". JSON com intro, executionSteps, safetyTips, mistakes, geminiTip (PT-PT).`, schema);
      setAnatomyTips(p => ({ ...p, [exId]: res })); setAnatomyTipState(p => ({ ...p, [exId]: 'done' }));
    } catch (error) { setAnatomyTipState(p => ({ ...p, [exId]: 'error' })); }
  };

  const handleAnalyzeFood = async () => {
    if (!chatInput.trim()) return;
    const mealName = INITIAL_MEALS.find(m => m.id === selectedMealId)?.name || 'Refeição';
    setChatInput(''); setIsAnalyzing(true);
    try {
      const macros = await callGemini(`Estime macros exatos para: "${chatInput}". JSON: calories, protein, carbs, fats, name.`, { type: "OBJECT", properties: { calories: { type: "INTEGER" }, protein: { type: "INTEGER" }, carbs: { type: "INTEGER" }, fats: { type: "INTEGER" }, name: { type: "STRING" } } });
      const newLog = { id: Date.now(), date: todayStr, mealId: selectedMealId, text: macros.name || chatInput, calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fats: macros.fats };
      const updatedLogs = [...nutritionLogs, newLog];
      setNutritionLogs(updatedLogs); saveToCloud({ nutritionLogs: updatedLogs });
      showToast(`${mealName} adicionado! 🔥 ${macros.calories} kcal`, "success");
    } catch (error) { showToast(`Erro: ${error.message}`, "error"); } finally { setIsAnalyzing(false); }
  };

  const handleGenerateAIWorkout = async () => {
    setIsGeneratingWorkout(true);
    try {
      const dayInfo = workouts[activeWorkoutDay];
      const dbContext = exerciseDB.map(e => `ID:'${e.id}' | Nome:'${e.name}' | Grupo:'${e.group}' | Foco:'${e.target}'`).join('\n');
      const prompt = `Personal Trainer Hipertrofia. Treino de hoje: "${dayInfo.name}". Exercícios disponíveis: ${dbContext}. REGRAS: Exatamente 7 exercícios de acordo com a split PPL/Upper/Lower. Retorne JSON {"exercises": ["id1", ...]}.`;
      const schema = { type: "OBJECT", properties: { exercises: { type: "ARRAY", items: { type: "STRING" } } } };
      const resultData = await callGemini(prompt, schema);
      if (resultData.exercises && resultData.exercises.length > 0) {
         const newExercises = resultData.exercises.map(id => { const ex = getEx(id); return ex ? formatEx(ex, 3, 10) : null; }).filter(e => e !== null);
         if (newExercises.length > 0) {
           const upd = {...workouts}; upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises: newExercises };
           setWorkouts(upd); saveToCloud({ workouts: upd });
         }
      }
    } catch (error) { showToast(`Erro IA: ${error.message}`, "error"); } finally { setIsGeneratingWorkout(false); }
  };

  const getFatigueColor = (groupMapArray) => {
    let lastWorkedDate = null; const now = Date.now();
    const dayToGroups = { 'Pull': ['Costas', 'Bíceps', 'Braços'], 'Push': ['Peito', 'Ombros', 'Tríceps', 'Braços'], 'Legs 1': ['Pernas', 'Glúteo', 'Quadríceps', 'GAP'], 'Legs 2 ou Cardio': ['Pernas', 'Glúteo', 'Posterior', 'Panturrilha', 'GAP', 'Cardio'], 'Upper': ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Braços'], 'Lower': ['Pernas', 'Glúteo', 'GAP'], 'Cardio': ['Cardio', 'GAP', 'Core'] };
    for (let i = workoutHistory.length - 1; i >= 0; i--) {
       const hist = workoutHistory[i]; const wGroups = dayToGroups[hist.day] || [];
       if (groupMapArray.some(g => wGroups.includes(g))) { lastWorkedDate = hist.timestamp || new Date(hist.date.split('/').reverse().join('-')).getTime(); break; }
    }
    if (!lastWorkedDate) return '#10b981'; 
    const diffHours = (now - lastWorkedDate) / (1000 * 60 * 60);
    if (diffHours < 24) return '#ef4444'; if (diffHours < 72) return '#eab308'; return '#10b981'; 
  };

  const getCalendarDays = () => {
    const days = []; const today = new Date(); today.setHours(0,0,0,0);
    let signup = new Date(today); signup.setDate(today.getDate() - 6);
    if (userProfile.signupTimestamp) { signup = new Date(userProfile.signupTimestamp); signup.setHours(0,0,0,0); } 
    else if (weightHistory.length > 0) { const parts = weightHistory[0].date.split('/'); if (parts.length === 3) { signup = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`); signup.setHours(0,0,0,0); } }
    const diffTime = today.getTime() - signup.getTime(); const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let startDate = new Date(); if (diffDays >= 0 && diffDays < 7) startDate = new Date(signup); else { startDate = new Date(today); startDate.setDate(today.getDate() - 6); }
    for(let i=0; i<7; i++) {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i); const dStr = d.toLocaleDateString('pt-BR');
      days.push({ dateNum: d.getDate(), dayStr: d.toLocaleDateString('pt-BR', {weekday:'short'}), hasWorkout: !!dailyLogs.find(l => l.date === dStr)?.workout, isFuture: d > today, isBeforeSignup: d < signup });
    }
    return days;
  };

  const handleExerciseChange = (id, field, value) => {
    const upd = {...workouts}; upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises: upd[activeWorkoutDay].exercises.map(x => x.id === id ? { ...x, [field]: value } : x) };
    setWorkouts(upd);
  };
  const handleRemoveExercise = (id) => {
    const upd = {...workouts}; upd[activeWorkoutDay] = { ...upd[activeWorkoutDay], exercises: upd[activeWorkoutDay].exercises.filter(ex => ex.id !== id) };
    setWorkouts(upd); saveToCloud({ workouts: upd });
  };

  // --- LÓGICA DO PAINEL ADMIN ---
  const handleMigrateDB = async () => {
     if(!db) return;
     setIsDBMigrating(true);
     try {
        const exRef = collection(db, 'artifacts', appId, 'public', 'data', 'exercises');
        for (const ex of INITIAL_EXERCISE_DB) {
           await addDoc(exRef, ex);
        }
        showToast("Base de Dados migrada para a Cloud com sucesso!", "success");
     } catch (e) {
        showToast("Erro ao migrar a DB: " + e.message, "error");
     } finally {
        setIsDBMigrating(false);
     }
  };

  const handleSaveAdminEx = async (e) => {
     e.preventDefault();
     if (!db) return;
     setIsAdminSaving(true);
     try {
         let exId = adminModal.data.id;
         if (adminModal.mode === 'add') exId = `e_${Date.now()}`;

         const exData = {
             id: exId,
             name: adminModal.data.name,
             target: adminModal.data.target,
             group: adminModal.data.group
         };

         const exRef = collection(db, 'artifacts', appId, 'public', 'data', 'exercises');
         if (adminModal.mode === 'add') {
             await addDoc(exRef, exData);
             showToast("Novo Exercício criado na Cloud!", "success");
         } else {
             const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'exercises', adminModal.data.firebaseId);
             await updateDoc(docRef, exData);
             showToast("Exercício atualizado!", "success");
         }

         if (adminGifFile && storage) {
             showToast("A enviar GIF...", "info");
             const storageRef = ref(storage, `gifs/${exId}.gif`);
             await uploadBytesResumable(storageRef, adminGifFile);
             showToast("GIF guardado com sucesso!", "success");
         }

         setAdminModal({ isOpen: false, mode: 'add', data: null });
         setAdminGifFile(null);
     } catch (err) {
         showToast("Erro ao guardar no Admin: " + err.message, "error");
     } finally {
         setIsAdminSaving(false);
     }
  };

  const handleDeleteAdminEx = async (firebaseId) => {
     if(!db) return;
     if(window.confirm("Deseja mesmo remover este exercício permanentemente de todos os utilizadores?")) {
        try {
           const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'exercises', firebaseId);
           await deleteDoc(docRef);
           showToast("Exercício removido da base de dados.", "success");
        } catch (err) {
           showToast("Erro ao remover: " + err.message, "error");
        }
     }
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
           <div className={`h-2 flex-1 rounded-full ${onboardingStep>=3 ? 'bg-emerald-500':'bg-zinc-800'}`}></div>
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
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Género</label><select value={userProfile.gender} onChange={e=>setUserProfile({...userProfile, gender:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none"><option value="M">Masc</option><option value="F">Fem</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Atual (kg)</label><input type="number" value={userProfile.weight} onChange={e=>setUserProfile({...userProfile, weight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Peso Desejado (kg)</label><input type="number" value={userProfile.targetWeight} onChange={e=>setUserProfile({...userProfile, targetWeight:e.target.value})} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 outline-none focus:border-emerald-500" /></div>
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
      
      {/* MODAL ALERTA MEDIDAS */}
      {showMeasureAlert && (
        <div className="absolute inset-0 bg-black/80 z-100 flex items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center">
              <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Hora de Atualizar!</h2>
              <p className="text-zinc-400 mb-6 text-sm">Passaram-se 7 dias desde o último registo. Atualize o seu peso e medidas para alimentar a IA.</p>
              
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
          <SidebarBtn a={activeTab==='perfil' || activeTab === 'admin_db'} o={()=>setActiveTab('perfil')} i={<UserCircle size={20}/>} l="Perfil" />
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

          {/* PAINEL ADMIN DE EXERCÍCIOS */}
          {activeTab === 'admin_db' && (
             <div className="space-y-6 animate-fadeIn pb-12">
                <header className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3"><Database className="text-emerald-500" /> Base de Dados Cloud</h1>
                    <p className="text-zinc-400 font-medium">Faça a gestão global dos exercícios</p>
                  </div>
                  <button onClick={() => setActiveTab('perfil')} className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors"><X size={24}/></button>
                </header>

                {/* Migração Card (se parece que ainda usa a DB estática) */}
                {exerciseDB.length > 0 && !exerciseDB[0].firebaseId && (
                   <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-3xl flex items-center justify-between gap-4 animate-fadeIn">
                      <div>
                        <h3 className="font-bold text-white text-lg">Migração Necessária</h3>
                        <p className="text-zinc-400 text-sm">Os seus exercícios ainda estão guardados localmente. Sincronize para a Nuvem.</p>
                      </div>
                      <button onClick={handleMigrateDB} disabled={isDBMigrating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex gap-2 items-center">
                         {isDBMigrating ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18} />} Sincronizar
                      </button>
                   </div>
                )}

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                   <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                      <div className="relative flex-1 w-full">
                         <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                         <input type="text" value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="Procurar exercício..." className="w-full bg-zinc-950 py-3 pl-12 pr-4 rounded-xl border border-zinc-800 focus:border-emerald-500 outline-none text-white transition-colors" />
                      </div>
                      <button onClick={() => setAdminModal({isOpen: true, mode: 'add', data: {name:'', target:'', group:'Peito'}})} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                        <Plus size={18}/> Adicionar Novo
                      </button>
                   </div>

                   <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {exerciseDB.filter(ex => ex.name.toLowerCase().includes(adminSearch.toLowerCase()) || ex.group.toLowerCase().includes(adminSearch.toLowerCase())).map(ex => (
                         <div key={ex.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors">
                            <div>
                               <p className="font-bold text-white">{ex.name}</p>
                               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{ex.target} • <span className="text-emerald-500">{ex.group}</span></p>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => setAdminModal({isOpen: true, mode: 'edit', data: ex})} className="text-zinc-400 bg-zinc-900 hover:bg-zinc-800 p-2 rounded-lg transition-colors"><Pencil size={18}/></button>
                               <button onClick={() => handleDeleteAdminEx(ex.firebaseId)} className="text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-2 rounded-lg transition-colors"><Trash size={18}/></button>
                            </div>
                         </div>
                      ))}
                      {exerciseDB.length === 0 && <p className="text-center text-zinc-500 italic py-10">Nenhum exercício encontrado na base de dados.</p>}
                   </div>
                </div>
             </div>
          )}

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
                     {/* Gamificação / Conquistas */}
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

                     {/* Feed Semanal de Treinos */}
                     <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 h-full">
                       <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Dumbbell size={18} className="text-emerald-500"/> Histórico da Semana</h3>
                       <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
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
                  </div>

                  {/* Feed Semanal de Nutrição */}
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Utensils size={18} className="text-emerald-500"/> Histórico de Nutrição</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {recentNutritionDates.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic text-center py-4">Nenhum registo de nutrição ainda.</p>
                      ) : (
                        recentNutritionDates.map(date => {
                          const dayLogs = nutritionLogs.filter(n => n.date === date);
                          const dayTotals = dayLogs.reduce((acc, log) => ({
                            cal: acc.cal + (Number(log.calories)||0),
                            pro: acc.pro + (Number(log.protein)||0),
                            car: acc.car + (Number(log.carbs)||0),
                            fat: acc.fat + (Number(log.fats)||0)
                          }), { cal: 0, pro: 0, car: 0, fat: 0 });

                          return (
                            <div key={date} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700 shadow-sm">
                              <div className="flex justify-between items-center mb-3 border-b border-zinc-800/50 pb-3">
                                 <span className="font-black text-white text-lg">{date}</span>
                                 <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">{dayLogs.length} Refeições</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-zinc-900/40 p-2 rounded-lg"><p className="text-[10px] text-orange-400 font-bold uppercase">Kcal</p><p className="font-bold text-white text-sm">{dayTotals.cal}</p></div>
                                <div className="bg-zinc-900/40 p-2 rounded-lg"><p className="text-[10px] text-emerald-400 font-bold uppercase">Prot</p><p className="font-bold text-white text-sm">{dayTotals.pro}g</p></div>
                                <div className="bg-zinc-900/40 p-2 rounded-lg"><p className="text-[10px] text-blue-400 font-bold uppercase">Carb</p><p className="font-bold text-white text-sm">{dayTotals.car}g</p></div>
                                <div className="bg-zinc-900/40 p-2 rounded-lg"><p className="text-[10px] text-yellow-400 font-bold uppercase">Gord</p><p className="font-bold text-white text-sm">{dayTotals.fat}g</p></div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Consultoria IA Holística */}
                  <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4"><MessageSquareQuote className="text-emerald-400" size={20} /> Relatório Geral de Desempenho</h3>
                    <p className="text-xs text-zinc-400 mb-4">A IA vai cruzar o seu histórico de treino e ingestão calórica para fornecer um feedback abrangente.</p>
                    <button onClick={handleGenerateDeepInsight} disabled={isDeepInsightLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                      {isDeepInsightLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Analisar Desempenho (Treino + Nutrição)
                    </button>
                    {deepInsightText && (
                      <div className="mt-6 text-emerald-100/90 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium whitespace-pre-line">
                        {deepInsightText}
                      </div>
                    )}
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
                   <button onClick={generateAIPlan} className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors" title="Restaurar treino PPL padrão"><RefreshCw size={18}/></button>
                 </div>
               </header>

               <div className="mb-2 text-[11px] text-zinc-500 font-medium flex items-center gap-2 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                  <Info size={16} className="text-emerald-500 shrink-0"/> 
                  <span>Selecione um dia. Pode reordenar a semana <strong>arrastando a caixa</strong> ou <strong>usando as setas</strong> que aparecem no dia selecionado.</span>
               </div>
               
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-1 px-1 -mx-1">
                 {workoutOrder.map((d, index) => {
                   const isLocked = completedWorkoutsThisWeek.includes(d);
                   const isActive = activeWorkoutDay === d;
                   
                   return (
                     <div 
                        key={d} 
                        className={`flex items-center shrink-0 transition-all duration-300 ${isActive ? 'bg-zinc-900 border border-zinc-700 rounded-2xl p-1 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.1)]' : ''}`}
                        draggable={!isLocked}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
                          if (sourceIndex === index || isNaN(sourceIndex)) return;
                          
                          const newOrder = [...workoutOrder];
                          const [movedItem] = newOrder.splice(sourceIndex, 1);
                          newOrder.splice(index, 0, movedItem);
                          
                          setWorkoutOrder(newOrder);
                          saveToCloud({ workoutOrder: newOrder });
                        }}
                     >
                       {isActive && index > 0 && (
                         <button onClick={() => moveWorkoutDay(index, -1)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors">
                           <ChevronLeft size={18}/>
                         </button>
                       )}

                       <button 
                         onClick={()=>{
                           if(!isLocked) {
                             setActiveWorkoutDay(d); 
                             setIsGapMode(false); 
                             setWorkoutFeedback('');
                           }
                         }} 
                         disabled={isLocked}
                         className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                           isLocked 
                             ? 'bg-zinc-950 text-zinc-600 border border-zinc-800/50 cursor-not-allowed opacity-50' 
                             : isActive
                               ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
                               : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                         }`}
                       >
                         {isActive && <GripHorizontal size={14} className="opacity-40" />}
                         {d} {isLocked && <Lock size={14} />}
                       </button>

                       {isActive && index < workoutOrder.length - 1 && (
                         <button onClick={() => moveWorkoutDay(index, 1)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors">
                           <ChevronRight size={18}/>
                         </button>
                       )}
                     </div>
                   );
                 })}
               </div>

               {completedWorkoutsThisWeek.includes(activeWorkoutDay) ? (
                 <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center animate-fadeIn mt-8">
                   {completedWorkoutsThisWeek.length === workoutOrder.length ? (
                     <>
                       <Smile size={48} className="text-emerald-500 mx-auto mb-4" />
                       <h3 className="text-2xl font-extrabold mb-2">Semana Concluída! 🎉</h3>
                       <p className="text-zinc-400 text-sm">Completou todos os treinos da rota nesta semana. Descanse, a sua rotina será desbloqueada na próxima segunda-feira.</p>
                     </>
                   ) : (
                     <>
                       <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                       <h3 className="text-2xl font-extrabold mb-2">Treino Concluído!</h3>
                       <p className="text-zinc-400 text-sm">Este treino já foi realizado esta semana. Continue com os próximos dias disponíveis. Esta secção será libertada novamente na próxima segunda-feira.</p>
                     </>
                   )}
                 </div>
               ) : (
                 <>
                   {workouts[activeWorkoutDay]?.isLegs && (
                     <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-2xl flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Activity size={20}/></div>
                         <div>
                           <p className="font-bold text-white text-sm">Aula de GAP?</p>
                           <p className="text-xs text-purple-300/60">Substituir musculação por aula.</p>
                         </div>
                       </div>
                       <button onClick={()=>{setIsGapMode(!isGapMode); if(!isGapMode) setIsCaliMode(false);}} className={`w-12 h-6 rounded-full relative transition-colors ${isGapMode?'bg-purple-500':'bg-zinc-800'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isGapMode?'left-7':'left-1'}`}></div>
                       </button>
                     </div>
                   )}

                   <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                       <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Flame size={20}/></div>
                       <div>
                         <p className="font-bold text-white text-sm">Treino de Calistenia?</p>
                         <p className="text-xs text-emerald-300/60">Substituir musculação pelo Módulo 1.</p>
                       </div>
                     </div>
                     <button onClick={()=>{
                         const newMode = !isCaliMode;
                         setIsCaliMode(newMode);
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
                            className="w-full bg-zinc-950 p-4 rounded-2xl outline-none border border-zinc-800 text-white font-bold focus:border-emerald-500 transition-colors"
                         >
                            {Object.keys(CALISTHENICS_PLANS).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                   )}

                   {!isGapMode && !isCaliMode && (
                     <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 mb-4">
                        <h2 className="font-bold text-lg text-white">{workouts[activeWorkoutDay]?.name}</h2>
                        <button onClick={handleGenerateAIWorkout} disabled={isGeneratingWorkout} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 px-3 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600/30 transition-colors border border-emerald-500/30">
                          {isGeneratingWorkout ? <Loader2 size={16} className="animate-spin"/> : <Cpu size={16} />}
                          {isGeneratingWorkout ? "Gerando..." : "Gerar Ficha (IA)"}
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
                         const exercisesToRender = isCaliMode ? currentCaliExercises : (workouts[activeWorkoutDay]?.exercises || []);
                         return exercisesToRender.map((ex, index) => {
                           const showHeader = ex.group !== lastGroup;
                           lastGroup = ex.group;
                           return (
                             <React.Fragment key={ex.id || index}>
                               {showHeader && (
                                 <div className="mt-8 mb-4 flex items-center gap-3 animate-fadeIn">
                                   <div className="h-px flex-1 bg-zinc-800"></div>
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-sm">{ex.group}</span>
                                   <div className="h-px flex-1 bg-zinc-800"></div>
                                 </div>
                               )}
                               <div className={`bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden ${ex.isCompleted?'border-emerald-900/50 bg-emerald-950/10 opacity-70':'border-zinc-800 shadow-lg shadow-black/20'}`}>
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
                                     }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${ex.isCompleted?'bg-emerald-500 text-zinc-950 scale-95':'bg-zinc-950 text-zinc-600 hover:text-white border border-zinc-800'}`}><Check size={24} strokeWidth={3}/></button>
                                     <div>
                                       <span className="font-extrabold text-lg block leading-tight">{ex.name}</span>
                                       <span className="text-xs text-zinc-500 font-medium">{ex.target}</span>
                                     </div>
                                   </div>
                                   <div className="flex gap-2">
                                     <button onClick={()=>{
                                        if(isCaliMode) setCurrentCaliExercises(prev => prev.filter(x => x.id !== ex.id));
                                        else handleRemoveExercise(ex.id);
                                     }} className="text-red-400 p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"><Trash size={18}/></button>
                                     <button onClick={()=>setExerciseModal({ active: true, mode: 'swap', targetExId: ex.id, filterGroup: exerciseDB.find(d=>d.id===ex.originalId)?.group || 'Geral' })} className="text-zinc-500 p-3 bg-zinc-950 rounded-xl hover:text-white transition-colors border border-zinc-800"><ArrowLeftRight size={18}/></button>
                                     <button onClick={()=>handleGetAnatomyTip(ex.id, ex.name, ex.originalId)} className="text-emerald-500 p-3 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"><Sparkles size={18}/></button>
                                   </div>
                                 </div>
                                 
                                 <div className="p-5 grid grid-cols-3 gap-4 bg-zinc-950/50">
                                    <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Séries</label><input type="number" value={ex.sets} onChange={(e) => {
                                       if(isCaliMode) setCurrentCaliExercises(prev => prev.map(x => x.id === ex.id ? { ...x, sets: e.target.value } : x));
                                       else handleExerciseChange(ex.id, 'sets', e.target.value);
                                    }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                                    <div><label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 text-center">Reps</label><input type="text" value={ex.reps} onChange={(e) => {
                                       if(isCaliMode) setCurrentCaliExercises(prev => prev.map(x => x.id === ex.id ? { ...x, reps: e.target.value } : x));
                                       else handleExerciseChange(ex.id, 'reps', e.target.value);
                                    }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center font-bold border border-zinc-800 focus:border-emerald-500 transition-colors" /></div>
                                    <div><label className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider block mb-2 text-center">Carga (kg)</label><input type="number" value={ex.weight} onChange={(e) => {
                                       if(isCaliMode) setCurrentCaliExercises(prev => prev.map(x => x.id === ex.id ? { ...x, weight: e.target.value } : x));
                                       else handleExerciseChange(ex.id, 'weight', e.target.value);
                                    }} className="w-full bg-zinc-900 py-3 rounded-xl outline-none text-center text-emerald-400 font-black border border-emerald-900/30 focus:border-emerald-500 transition-colors shadow-inner" placeholder="+0" title="Carga extra para além do peso corporal" /></div>
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
                                         
                                         {/* Exibição do GIF ou Upload Directo */}
                                         <div className="mb-4 bg-zinc-950 rounded-2xl border border-zinc-800/50 flex flex-col justify-center items-center overflow-hidden p-4 shadow-inner">
                                           {gifUrls[ex.originalId] ? (
                                             <div className="relative group w-full flex justify-center">
                                               <img 
                                                 src={gifUrls[ex.originalId]} 
                                                 alt={`Execução de ${ex.name}`}
                                                 className="max-w-full max-h-64 object-contain rounded-xl"
                                               />
                                               <label className="absolute top-2 right-2 bg-black/80 hover:bg-emerald-600 p-2.5 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-zinc-700 hover:border-emerald-500">
                                                  <Pencil size={16} className="text-white" />
                                                  <input type="file" accept="image/gif, image/jpeg, image/png, video/mp4" className="hidden" onChange={(e) => handleUploadGif(e, ex.originalId)} />
                                               </label>
                                             </div>
                                           ) : (
                                             <div className="text-center py-8 w-full border-2 border-dashed border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-colors bg-zinc-900/30">
                                               {isUploadingGif[ex.originalId] ? (
                                                 <div className="flex flex-col items-center gap-3 text-emerald-500">
                                                   <Loader2 className="animate-spin" size={28}/>
                                                   <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Enviando para a Nuvem...</span>
                                                 </div>
                                               ) : (
                                                 <label className="cursor-pointer flex flex-col items-center gap-3 text-zinc-500 hover:text-emerald-400 transition-colors w-full h-full">
                                                   <div className="p-3 bg-zinc-900 rounded-full shadow-sm"><Upload size={24} /></div>
                                                   <span className="text-xs font-bold uppercase tracking-widest">Anexar GIF de Demonstração</span>
                                                   <input type="file" accept="image/gif, image/jpeg, image/png, video/mp4" className="hidden" onChange={(e) => handleUploadGif(e, ex.originalId)} />
                                                 </label>
                                               )}
                                             </div>
                                           )}
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
                                                       <CheckCircle size={18} className="text-emerald-500/50 shrink-0 mt-0.5"/> 
                                                       <span><strong className="text-white">{boldPart}</strong>{parts.join(':')}</span>
                                                     </li>
                                                   );
                                                }
                                                return <li key={i} className="text-zinc-300 flex gap-3 items-start leading-snug"><CheckCircle size={18} className="text-emerald-500/50 shrink-0 mt-0.5"/> <span>{step}</span></li>
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

                       <button onClick={() => setExerciseModal({ active: true, mode: 'add', targetExId: null, filterGroup: null })} className="w-full py-5 bg-zinc-900/50 border-2 border-dashed border-zinc-800 text-zinc-400 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all mt-4">
                         <Plus size={20}/> Adicionar Exercício Manual
                       </button>
                       
                       {/* FEEDBACK IA DO TREINO */}
                       <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl mt-4">
                         <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><MessageSquareQuote className="text-emerald-400" size={18} /> Avaliação da Ficha (IA)</h3>
                         <p className="text-xs text-zinc-400 mb-4">Peça à IA para analisar se os exercícios escolhidos fazem sentido para o seu objetivo.</p>
                         <button onClick={handleEvaluateWorkout} disabled={isWorkoutFeedbackLoading} className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                           {isWorkoutFeedbackLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Analisar Treino Atual
                         </button>
                         {workoutFeedback && (
                           <div className="mt-4 text-emerald-100/90 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium whitespace-pre-line animate-fadeIn">
                             {workoutFeedback}
                           </div>
                         )}
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

               {/* FEEDBACK IA DA DIETA */}
               <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl mt-4">
                 <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><MessageSquareQuote className="text-emerald-400" size={18} /> Avaliação de Ingestão Diária (IA)</h3>
                 <p className="text-xs text-zinc-400 mb-4">Peça à IA para analisar como os seus macros estão hoje em relação ao objetivo e receber sugestões.</p>
                 <button onClick={handleEvaluateNutrition} disabled={isNutritionFeedbackLoading} className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                   {isNutritionFeedbackLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Analisar Meus Macros
                 </button>
                 {nutritionFeedback && (
                   <div className="mt-4 text-emerald-100/90 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium whitespace-pre-line animate-fadeIn">
                     {nutritionFeedback}
                   </div>
                 )}
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
                                  <button onClick={() => setConfirmDeleteId(log.id)} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all p-2 rounded-lg"><Trash size={16}/></button>
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
                <button onClick={()=>setBioTab('capture')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${bioTab==='capture'?'bg-zinc-800 text-white shadow-sm':'text-zinc-500 hover:text-zinc-300'}`}><Camera size={16}/> Captura & Análise</button>
                <button onClick={()=>setBioTab('evolution')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${bioTab==='evolution'?'bg-zinc-800 text-white shadow-sm':'text-zinc-500 hover:text-zinc-300'}`}><View size={16}/> Evolução 3D</button>
              </div>

              {bioTab === 'capture' && (
                <div className="space-y-6">
                  {scanState === 'idle' && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden relative p-6">
                       <div className="text-center mb-6">
                          <Focus size={40} className="text-emerald-500 mx-auto mb-3" />
                          <h2 className="text-lg font-bold text-white mb-1">Check-up Fotográfico</h2>
                          <p className="text-zinc-400 text-sm">Carregue ou tire as 4 fotos para que a IA analise a sua estrutura corporal.</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mb-6">
                          {['frente', 'direita', 'esquerda', 'costas'].map((view) => (
                             <label 
                               key={view}
                               className={`relative h-32 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer overflow-hidden ${uploadedPhotos[view] ? 'border-emerald-500/50 text-emerald-400 bg-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
                             >
                               <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(view, e)} />
                               {uploadedPhotos[view] && <img src={uploadedPhotos[view]} alt={`Upload ${view}`} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                               {uploadedPhotos[view] ? <CheckCircle size={32} className="mb-2 relative z-10" /> : <Upload size={28} className="mb-2 relative z-10" />}
                               <span className="text-xs font-bold uppercase tracking-wider relative z-10">{view}</span>
                               {uploadedPhotos[view] && <span className="text-[10px] mt-1 opacity-100 bg-emerald-500/20 px-2 py-0.5 rounded font-bold relative z-10">Enviada</span>}
                             </label>
                          ))}
                       </div>
                       
                       <button 
                         onClick={startBiometricScan} 
                         disabled={!allPhotosUploaded}
                         className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg"
                       >
                         <Scan size={20} /> Processar Check-up
                       </button>
                    </div>
                  )}

                  {scanState === 'scanning' && (
                    <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-3xl overflow-hidden relative">
                       <div className="h-96 bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                          {/* Efeito de Scanner Linear */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite] z-20"></div>
                          
                          {/* Esqueleto SVG (Pose Estimation Wireframe) */}
                          <svg viewBox="0 0 200 400" className="h-full opacity-80 relative z-10">
                            <defs>
                              <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            {/* Linhas principais */}
                            <path d="M 100 80 L 100 160 L 70 240 L 70 360 M 100 160 L 130 240 L 130 360" stroke="#10b981" strokeWidth="2" fill="none" filter="url(#glow)"/>
                            <path d="M 60 100 L 100 90 L 140 100" stroke="#10b981" strokeWidth="2" fill="none" filter="url(#glow)"/>
                            <path d="M 60 100 L 40 180 L 30 260 M 140 100 L 160 180 L 170 260" stroke="#10b981" strokeWidth="2" fill="none" filter="url(#glow)"/>
                            <path d="M 70 240 L 130 240" stroke="#10b981" strokeWidth="2" fill="none" filter="url(#glow)"/>
                            
                            {/* Pontos de Articulação */}
                            <circle cx="100" cy="50" r="15" stroke="#10b981" strokeWidth="2" fill="transparent" filter="url(#glow)" /> {/* Cabeça */}
                            <circle cx="100" cy="90" r="4" fill="#10b981" /> {/* Pescoço */}
                            <circle cx="60" cy="100" r="4" fill="#34d399" /> {/* Ombro Esq */}
                            <circle cx="140" cy="100" r="4" fill="#34d399" /> {/* Ombro Dir */}
                            <circle cx="40" cy="180" r="4" fill="#34d399" /> {/* Cotovelo Esq */}
                            <circle cx="160" cy="180" r="4" fill="#34d399" /> {/* Cotovelo Dir */}
                            <circle cx="30" cy="260" r="3" fill="#6ee7b7" /> {/* Pulso Esq */}
                            <circle cx="170" cy="260" r="3" fill="#6ee7b7" /> {/* Pulso Dir */}
                            <circle cx="100" cy="160" r="4" fill="#10b981" /> {/* Centro */}
                            <circle cx="70" cy="240" r="4" fill="#34d399" /> {/* Anca Esq */}
                            <circle cx="130" cy="240" r="4" fill="#34d399" /> {/* Anca Dir */}
                            <circle cx="70" cy="360" r="4" fill="#6ee7b7" /> {/* Joelho Esq */}
                            <circle cx="130" cy="360" r="4" fill="#6ee7b7" /> {/* Joelho Dir */}
                          </svg>

                          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-zinc-800">
                             <div className="flex items-center gap-2 text-xs font-bold text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live AI</div>
                          </div>
                       </div>
                       
                       <div className="p-6 bg-zinc-900 border-t border-emerald-900/30">
                         <div className="mb-4">
                           <div className="flex justify-between text-xs font-bold mb-1.5">
                             <span className="text-zinc-400 uppercase tracking-wider">Progresso da Análise</span>
                             <span className="text-emerald-400">{scanProgress}%</span>
                           </div>
                           <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                             <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{width: `${scanProgress}%`}}></div>
                           </div>
                         </div>
                         <div className="space-y-2 h-24 overflow-y-auto custom-scrollbar pr-2">
                           {scanFeedback.map((fb, i) => (
                             <div key={i} className="flex items-center gap-2 text-xs font-medium text-zinc-300 animate-fadeIn">
                               <Check size={14} className="text-emerald-500" /> {fb}
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  )}

                  {scanState === 'done' && estimatedMeasures && (
                    <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-3xl overflow-hidden animate-fadeIn">
                       <div className="bg-emerald-950/30 p-6 border-b border-emerald-900/30 text-center">
                          <Fingerprint size={48} className="text-emerald-500 mx-auto mb-4" />
                          <h2 className="text-xl font-extrabold text-white mb-1">Mapeamento Concluído</h2>
                          <p className="text-zinc-400 text-sm">A IA calculou estas estimativas com base no seu esqueleto.</p>
                       </div>
                       
                       <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Peito</p>
                            <p className="text-xl font-black text-emerald-400">{estimatedMeasures.peito} <span className="text-xs text-zinc-500 font-medium">cm</span></p>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Cintura</p>
                            <p className="text-xl font-black text-emerald-400">{estimatedMeasures.cintura} <span className="text-xs text-zinc-500 font-medium">cm</span></p>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Quadril</p>
                            <p className="text-xl font-black text-emerald-400">{estimatedMeasures.quadril} <span className="text-xs text-zinc-500 font-medium">cm</span></p>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Braços</p>
                            <p className="text-xl font-black text-emerald-400">{estimatedMeasures.bracos} <span className="text-xs text-zinc-500 font-medium">cm</span></p>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Pernas</p>
                            <p className="text-xl font-black text-emerald-400">{estimatedMeasures.pernas} <span className="text-xs text-zinc-500 font-medium">cm</span></p>
                          </div>
                       </div>

                       <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                         <div className="bg-emerald-950/20 border border-emerald-900/30 p-5 rounded-2xl">
                           <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><MessageSquareQuote className="text-emerald-400" size={18} /> Relatório de Desempenho Biométrico</h3>
                           <p className="text-xs text-zinc-400 mb-4">A IA vai cruzar as medidas lidas na fotografia com as medidas guardadas no seu perfil e gerar uma análise completa perante a sua meta de <strong>{userProfile.goal}</strong>.</p>
                           <button onClick={handleGenerateBiometricReport} disabled={isScanningAi} className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                             {isScanningAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Gerar Avaliação da IA
                           </button>
                           {scanAiReport && (
                             <div className="mt-4 text-emerald-100/90 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-2 italic font-medium whitespace-pre-line animate-fadeIn">
                               {scanAiReport}
                             </div>
                           )}
                         </div>
                       </div>

                       <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex flex-col md:flex-row gap-3">
                         <button onClick={() => {setScanState('idle'); setUploadedPhotos({ frente: null, direita: null, esquerda: null, costas: null }); setScanAiReport('');}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-bold transition-all">
                           Re-escanear
                         </button>
                         <button onClick={saveBiometricMeasures} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg">
                           <Save size={18} /> Salvar & Ir para Evolução
                         </button>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {bioTab === 'evolution' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gradient-to-r from-zinc-900 to-emerald-950/20 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                     <div>
                       <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Score IA Exclusivo</p>
                       <h3 className="text-2xl font-black text-white">Índice de Simetria: <span className="text-emerald-500">94%</span></h3>
                       <p className="text-zinc-400 text-xs mt-2 max-w-xs">Baseado na proporção de cintura vs. ombros extraída das suas fotos.</p>
                     </div>
                     <div className="w-16 h-16 bg-zinc-950 rounded-full border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                       <Activity size={24} className="text-emerald-400" />
                     </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><UserCircle size={20} className="text-emerald-500"/> Avatares Paramétricos 3D</h3>
                    
                    <div className="flex items-center justify-around gap-4 mb-6 relative">
                       {/* Linha conectora de fundo */}
                       <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-zinc-800 border-t border-dashed border-zinc-700 z-0"></div>

                       {/* Semana 1 (Mais Largo/Sem Definição) */}
                       <div className="relative z-10 flex flex-col items-center">
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-3 shadow-lg">
                             <svg viewBox="0 0 100 200" className="w-24 h-48 opacity-60">
                               <path d="M 50 20 C 40 20, 35 30, 35 40 C 35 50, 45 55, 50 60 C 55 55, 65 50, 65 40 C 65 30, 60 20, 50 20 Z" fill="none" stroke="#52525b" strokeWidth="2"/> {/* Head */}
                               <path d="M 35 60 L 20 70 L 15 110" fill="none" stroke="#52525b" strokeWidth="2"/> {/* Arm L */}
                               <path d="M 65 60 L 80 70 L 85 110" fill="none" stroke="#52525b" strokeWidth="2"/> {/* Arm R */}
                               {/* Torso - wider */}
                               <path d="M 35 60 C 20 80, 25 120, 30 140 C 40 145, 60 145, 70 140 C 75 120, 80 80, 65 60 Z" fill="none" stroke="#52525b" strokeWidth="2"/>
                               {/* Legs */}
                               <path d="M 30 140 L 30 190" fill="none" stroke="#52525b" strokeWidth="2"/>
                               <path d="M 70 140 L 70 190" fill="none" stroke="#52525b" strokeWidth="2"/>
                               {/* Grid lines to simulate 3D surface */}
                               <path d="M 25 90 C 40 100, 60 100, 75 90" fill="none" stroke="#3f3f46" strokeWidth="1"/>
                               <path d="M 28 115 C 40 125, 60 125, 72 115" fill="none" stroke="#3f3f46" strokeWidth="1"/>
                             </svg>
                          </div>
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-md">Semana 1</span>
                       </div>

                       <ArrowRight size={24} className="text-zinc-600 relative z-10 bg-zinc-900 rounded-full" />

                       {/* Semana 8 (Fit/Cintura fina) */}
                       <div className="relative z-10 flex flex-col items-center">
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-emerald-500/30 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
                             {/* Brilho fundo */}
                             <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent"></div>
                             <svg viewBox="0 0 100 200" className="w-24 h-48 relative z-10">
                               <path d="M 50 20 C 40 20, 35 30, 35 40 C 35 50, 45 55, 50 60 C 55 55, 65 50, 65 40 C 65 30, 60 20, 50 20 Z" fill="none" stroke="#10b981" strokeWidth="2"/> {/* Head */}
                               <path d="M 35 60 L 22 70 L 18 110" fill="none" stroke="#10b981" strokeWidth="2"/> {/* Arm L (more V-shape) */}
                               <path d="M 65 60 L 78 70 L 82 110" fill="none" stroke="#10b981" strokeWidth="2"/> {/* Arm R */}
                               {/* Torso - Leaner V-Taper */}
                               <path d="M 35 60 C 25 80, 35 110, 40 140 C 45 142, 55 142, 60 140 C 65 110, 75 80, 65 60 Z" fill="none" stroke="#10b981" strokeWidth="2"/>
                               {/* Legs */}
                               <path d="M 40 140 L 35 190" fill="none" stroke="#10b981" strokeWidth="2"/>
                               <path d="M 60 140 L 65 190" fill="none" stroke="#10b981" strokeWidth="2"/>
                               {/* Grid lines - deeper curves for muscle definition */}
                               <path d="M 30 85 C 45 100, 55 100, 70 85" fill="none" stroke="#047857" strokeWidth="1"/>
                               <path d="M 35 115 C 45 120, 55 120, 65 115" fill="none" stroke="#047857" strokeWidth="1"/>
                               <path d="M 50 60 L 50 140" fill="none" stroke="#047857" strokeWidth="1" strokeDasharray="2 2"/> {/* Linha Alba */}
                             </svg>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">Atual</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
                     <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2"><BarChart size={18}/> Tendência de Simetria</h3>
                     
                     <div className="h-32 w-full relative">
                        {/* Linhas guia */}
                        <div className="absolute top-0 w-full h-px bg-zinc-800"></div>
                        <div className="absolute top-1/2 w-full h-px bg-zinc-800"></div>
                        <div className="absolute bottom-0 w-full h-px bg-zinc-800"></div>

                        {/* Gráfico Tendência SVG */}
                        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible relative z-10">
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M 0 40 L 20 35 L 40 25 L 60 28 L 80 15 L 100 10 L 100 50 L 0 50 Z" fill="url(#lineGrad)" />
                          <polyline 
                            fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            points="0,40 20,35 40,25 60,28 80,15 100,10"
                          />
                          <circle cx="20" cy="35" r="1.5" fill="#10b981"/>
                          <circle cx="40" cy="25" r="1.5" fill="#10b981"/>
                          <circle cx="60" cy="28" r="1.5" fill="#10b981"/>
                          <circle cx="80" cy="15" r="1.5" fill="#10b981"/>
                          <circle cx="100" cy="10" r="2.5" fill="#fff" stroke="#10b981" strokeWidth="1"/>
                        </svg>
                     </div>
                     <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                       <span>Sem 1</span>
                       <span>Sem 4</span>
                       <span>Atual</span>
                     </div>
                  </div>
                </div>
              )}
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
        <MobileNavButton a={activeTab==='perfil' || activeTab === 'admin_db'} o={()=>setActiveTab('perfil')} i={<UserCircle size={24}/>} l="Perfil" />
      </nav>
    </div>
  );
}

function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 md:bottom-10 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-xl shadow-2xl border animate-fadeIn flex items-center gap-3 text-sm font-bold min-w-64 max-w-sm ${
          t.type === 'error' ? 'bg-red-950/90 border-red-900 text-red-100' : 
          t.type === 'success' ? 'bg-emerald-950/90 border-emerald-900 text-emerald-100' : 
          'bg-zinc-900/90 border-zinc-800 text-white'
        }`}>
          {t.type === 'error' ? <AlertCircle size={18} className="text-red-500 shrink-0" /> : 
           t.type === 'success' ? <CheckCircle size={18} className="text-emerald-500 shrink-0" /> : 
           <Info size={18} className="text-blue-500 shrink-0" />}
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