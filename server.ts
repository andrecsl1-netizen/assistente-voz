import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialization of Gemini client
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Voice chat API
app.post('/api/voice-chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      voiceName = 'Kore',
      persona = 'friendly',
      audioData = null,
      audioMimeType = 'audio/webm',
    } = req.body;

    const ai = getGenAIClient();
    let userPrompt = message || '';

    // If audio is provided without text, transcribe it first
    if (!userPrompt && audioData) {
      try {
        const transcribeResponse = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: audioMimeType,
                  data: audioData,
                },
              },
              {
                text: 'Transcreva o áudio com precisão no idioma falado (geralmente português). Retorne apenas a transcrição do que foi dito pelo usuário, sem comentários adicionais.',
              },
            ],
          },
        });
        userPrompt = transcribeResponse.text?.trim() || '';
      } catch (err: any) {
        console.warn('Audio transcription failed or model busy, attempting fallback:', err?.message);
      }
    }

    if (!userPrompt) {
      return res.status(400).json({ error: 'Nenhuma mensagem de voz ou texto fornecida.' });
    }

    // Prepare system instructions based on persona
    let personaInstruction = 'Você é um assistente atencioso, caloroso e inteligente em português.';
    if (persona === 'professional') {
      personaInstruction = 'Você é um consultor executivo profissional, claro, objetivo e cortês.';
    } else if (persona === 'storyteller') {
      personaInstruction = 'Você é um comunicador expressivo, criativo e cativante.';
    } else if (persona === 'mentor') {
      personaInstruction = 'Você é um mentor calmo, encorajador e sábio, que ouve com atenção.';
    }

    const systemInstruction = `${personaInstruction}
Você está em uma chamada telefônica de voz em tempo real com o usuário.
Regras cruciais para chamada de voz:
1. Suas falas serão lidas em voz alta. Fale de forma totalmente natural, como em uma conversa telefônica real.
2. Mantenha respostas curtas e dinâmicas (1 a 3 frases normalmente). Não faça monólogos longos, para permitir um diálogo fluido de ida e volta.
3. NUNCA use marcadores, asteriscos, negritos, emojis, numerações ou markdown. Símbolos soam defeituosos e artificiais quando sintetizados por voz.
4. Use pontuação expressiva comum (vírgulas, pontos de exclamação e interrogação suaves) para orientar a entonação correta do sintetizador.
5. Responda no mesmo idioma do usuário (primariamente Português Brasileiro, ou no idioma falado).`;

    // Format chat history
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (item.sender === 'user' && item.text) {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'ai' && item.text) {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    // Add current user prompt
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });

    // Generate conversational response
    const chatResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = chatResponse.text?.trim() || 'Compreendi perfeitamente. Como posso te ajudar agora?';

    // Generate Speech (TTS)
    let replyAudioBase64: string | null = null;
    let replyMimeType = 'audio/pcm;rate=24000';

    try {
      // Clean text for TTS
      const cleanTtsText = replyText
        .replace(/[*#_~`>[\]()]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      const validVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName)
        ? voiceName
        : 'Kore';

      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: cleanTtsText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: validVoice },
            },
          },
        },
      });

      const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0];
      if (audioPart?.inlineData?.data) {
        replyAudioBase64 = audioPart.inlineData.data;
        if (audioPart.inlineData.mimeType) {
          replyMimeType = audioPart.inlineData.mimeType;
        }
      }
    } catch (ttsError: any) {
      console.warn('Gemini TTS preview not available or timed out, will rely on client Web Speech synthesis:', ttsError?.message);
    }

    res.json({
      userText: userPrompt,
      replyText,
      audioBase64: replyAudioBase64,
      audioMimeType: replyMimeType,
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error('Error in /api/voice-chat:', error);
    res.status(500).json({
      error: error?.message || 'Erro ao processar chamada de voz.',
    });
  }
});

// Dedicated TTS endpoint if user wants to replay or change voice
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto obrigatório.' });
    }

    const ai = getGenAIClient();
    const cleanText = text.replace(/[*#_~`>[\]()]/g, '').replace(/\n+/g, ' ').trim();

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    res.json({
      audioBase64,
      mimeType: 'audio/pcm;rate=24000',
      sampleRate: 24000,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha na geração de áudio.' });
  }
});

// Call summary generator
app.post('/api/call-summary', async (req, res) => {
  try {
    const { callLog = [] } = req.body;
    if (!callLog.length) {
      return res.json({ summary: 'Nenhuma conversa registrada nesta chamada.' });
    }

    const ai = getGenAIClient();
    const transcriptText = callLog
      .map((item: any) => `${item.sender === 'user' ? 'Usuário' : 'IA'}: ${item.text}`)
      .join('\n');

    const prompt = `Analise a transcrição desta chamada de voz e gere um resumo conciso em português do Brasil contendo:
1. Resumo em 1-2 frases dos principais temas discutidos.
2. Principais pontos ou conclusões (em até 3 itens simples).

Transcrição da chamada:
${transcriptText}`;

    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ summary: summaryResponse.text || 'Resumo concluído.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao resumir chamada.' });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Voice Call Chat Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
