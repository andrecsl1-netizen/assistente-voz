import { VoiceOption, VoicePersona } from '../types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    label: 'Sofia (Kore)',
    description: 'Voz feminina suave, empática e acolhedora.',
    gender: 'female',
    accent: 'Português Claro',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    label: 'Lucas (Zephyr)',
    description: 'Voz masculina jovem, dinâmica e expressiva.',
    gender: 'male',
    accent: 'Conversacional',
  },
  {
    id: 'Puck',
    name: 'Puck',
    label: 'Gabriel (Puck)',
    description: 'Voz masculina enérgica, direta e amigável.',
    gender: 'male',
    accent: 'Descontraído',
  },
  {
    id: 'Charon',
    name: 'Charon',
    label: 'Artur (Charon)',
    description: 'Voz masculina grave, serena e reflexiva.',
    gender: 'male',
    accent: 'Sereno e Profundo',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    label: 'Mateus (Fenrir)',
    description: 'Voz masculina articulada, firme e técnica.',
    gender: 'male',
    accent: 'Firme e Objetivo',
  },
];

export interface PersonaOption {
  id: VoicePersona;
  title: string;
  tagline: string;
  description: string;
  avatarSeed: string;
}

export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'friendly',
    title: 'Amigável & Acolhedor',
    tagline: 'Conversas espontâneas do dia a dia',
    description: 'Respostas calorosas, gentis e naturais para bater papo e tirar dúvidas.',
    avatarSeed: 'friendly',
  },
  {
    id: 'professional',
    title: 'Consultor Executivo',
    tagline: 'Foco, clareza e produtividade',
    description: 'Comunicação executiva, direta, precisa e orientada a resultados rápidos.',
    avatarSeed: 'professional',
  },
  {
    id: 'mentor',
    title: 'Mentor & Conselheiro',
    tagline: 'Reflexões e desenvolvimento pessoal',
    description: 'Orientação com calma, empatia, escuta ativa e perguntas instigantes.',
    avatarSeed: 'mentor',
  },
  {
    id: 'storyteller',
    title: 'Criativo & Cativante',
    tagline: 'Ideias ricas e entusiasmo',
    description: 'Voz imaginativa, explicações com metáforas e grande fluidez criativa.',
    avatarSeed: 'storyteller',
  },
];
