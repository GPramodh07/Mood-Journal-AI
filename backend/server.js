// Load environment variables from .env file
require('dotenv').config();

// Import required packages
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const cors = require('cors');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Server configuration
const PORT = Number(process.env.PORT || 5000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash';
const GEMINI_FALLBACK_MODELS = [
    GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
];
const GEMINI_MAX_RETRIES_PER_MODEL = 2;

const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

// Prompt for making AI responses emotional and supportive
const EMOTION_PROMPT_TEMPLATE =
    "Act as an Advanced Emotional Intelligence Engine. Analyze the User Input: '{{USER_INPUT}}'. Write a warm, human response in exactly 3 short lines. Every line must gently help the user feel better, safer, and more hopeful. Use compassionate language, practical encouragement, and emotional reassurance. Do not use dramatic pity, panic words, or lines like 'Oh no'. Do not sound robotic or clinical. Keep each line concise, natural, and voice-friendly for speech synthesis.";

// Check if API keys are loaded
console.log('Key Check:', process.env.GEMINI_API_KEY ? '✅ GEMINI_API_KEY loaded' : '❌ GEMINI_API_KEY missing');
console.log('Key Check:', process.env.ELEVENLABS_API_KEY ? '✅ ELEVENLABS_API_KEY loaded' : '❌ ELEVENLABS_API_KEY missing');

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function for delays
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extract text from Gemini's response (it's nested weirdly)
function extractTextFromGeminiResponse(response) {
    if (!response) return '';

    if (typeof response.text === 'string' && response.text.trim()) {
        return response.text.trim();
    }

    if (typeof response.text === 'function') {
        const fnText = response.text();
        if (typeof fnText === 'string' && fnText.trim()) {
            return fnText.trim();
        }
    }

    const parts = response?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
        return parts
            .map((part) => part?.text || '')
            .join(' ')
            .trim();
    }

    return '';
}

// Make sure the AI response is exactly 3 lines and positive
function normalizeEmotionResponse(text) {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';

    const sentenceMatches = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];
    const lines = sentenceMatches
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(' ').slice(0, 16).join(' '));

    // Fallback responses if AI gives bad output
    const fallbackLines = [
        'I am with you, and your feelings make complete sense right now.',
        'You have already shown strength by naming what is heavy inside.',
        'Take one slow breath, and let your shoulders soften for a moment.',
        'You do not have to solve everything today, only the next small step.',
        'There is still room for calm, clarity, and hope to return.'
    ];

    const safeLines = lines
        .map((line) => {
            const softened = line
                .replace(/\boh no\b/gi, 'I hear you')
                .replace(/\bthis is terrible\b/gi, 'this feels heavy');
            return /[.!?]$/.test(softened) ? softened : `${softened}.`;
        })
        .slice(0, 3);

    while (safeLines.length < 3) {
        safeLines.push(fallbackLines[safeLines.length - 1]);
    }

    return safeLines.join('\n');
}

// Generate AI response with retries and fallbacks
async function generateEmotionAwareReply(userText) {
    let lastError;

    for (const model of GEMINI_FALLBACK_MODELS) {
        for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES_PER_MODEL; attempt += 1) {
            try {
                const prompt = EMOTION_PROMPT_TEMPLATE.replace('{{USER_INPUT}}', userText);

                const response = await ai.models.generateContent({
                    model,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });

                const aiText = normalizeEmotionResponse(extractTextFromGeminiResponse(response));
                if (!aiText) {
                    throw new Error(`Empty text from model: ${model}`);
                }

                return { aiText, usedModel: model };
            } catch (error) {
                lastError = error;
                const rawMessage = error?.message || '';
                const message = String(rawMessage).toUpperCase();

                const isNotFound = message.includes('IS NOT FOUND') || message.includes('NOT_FOUND');
                const isTransient =
                    message.includes('UNAVAILABLE') ||
                    message.includes('503') ||
                    message.includes('HIGH DEMAND') ||
                    message.includes('RESOURCE_EXHAUSTED') ||
                    message.includes('DEADLINE_EXCEEDED') ||
                    message.includes('TIMED OUT');

                if (isTransient && attempt < GEMINI_MAX_RETRIES_PER_MODEL) {
                    const delayMs = 600 * (attempt + 1);
                    console.warn(
                        `Gemini transient error on ${model} (attempt ${attempt + 1}/${GEMINI_MAX_RETRIES_PER_MODEL + 1}). Retrying in ${delayMs}ms...`
                    );
                    await sleep(delayMs);
                    continue;
                }

                // Try next model for not-found or exhausted model capacity.
                if (isNotFound || isTransient) {
                    console.warn(`Switching Gemini model from ${model} due to availability issue.`);
                    break;
                }

                throw error;
            }
        }
    }

    throw lastError || new Error('No supported Gemini model is available for this API key.');
}

// Convert text to speech using ElevenLabs
async function synthesizeVoice(text) {
    return axios({
        method: 'post',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            accept: 'audio/mpeg'
        },
        data: {
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.45,
                style: 0.5,
                similarity_boost: 0.75,
                use_speaker_boost: true
            }
        },
        responseType: 'arraybuffer',
        timeout: 30000
    });
}

// Main API endpoint for journal entries
app.post('/api/journal', async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message : req.body?.thoughts;
    const userText = String(message || '').trim();

    if (!userText) {
        return res.status(400).json({ error: 'message is required' });
    }

    if (!process.env.GEMINI_API_KEY || !process.env.ELEVENLABS_API_KEY) {
        return res.status(500).json({ error: 'Missing AI API keys in environment' });
    }

    try {
        const { aiText, usedModel } = await generateEmotionAwareReply(userText);
        console.log('Gemini Model:', usedModel);
        console.log('AI Response:', aiText);

        const audioResponse = await synthesizeVoice(aiText);

        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioResponse.data));
    } catch (error) {
        const apiError = error?.response?.data || error?.message || error;
        console.error('Server Error:', apiError);
        res.status(500).send('AI Offline');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server Glowing on ${PORT}`);
});