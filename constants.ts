
import type { VideoStyle, MusicOption, VideoLength, VoiceStyle, VoiceAccent, VoiceTone } from './types';

export const VIDEO_STYLES: VideoStyle[] = [
  {
    id: 'explainer',
    name: 'Short Explainer',
    scriptPrompt: `
      You are an expert scriptwriter for short, engaging YouTube explainer videos (like shorts). 
      Write a concise, clear, and punchy script for a video about the following topic. 
      Format the output as a single block of text, without any titles or scene markers.
      The tone should be informative but exciting.
    `,
    videoPromptModifier: 'A high-tech, engaging explainer video with animated graphics and fast cuts. a cinematic, professional look.',
  },
  {
    id: 'travel',
    name: 'Travel Vlog Clip',
    scriptPrompt: `
      You are a travel vlogger scriptwriter. 
      Write a short, inspiring voice-over script for a travel vlog about the following destination.
      The script should evoke a sense of wonder and adventure.
      Format the output as a single block of text.
    `,
    videoPromptModifier: 'A cinematic travel vlog clip, beautiful drone shots, vibrant colors, inspiring and adventurous feel.',
  },
  {
    id: 'product',
    name: 'Product Teaser',
    scriptPrompt: `
      You are a marketing copywriter specializing in product launch videos.
      Write a short, punchy, and exciting teaser script for the following product.
      The script should highlight key features and create hype.
      Format the output as a single block of text.
    `,
    videoPromptModifier: 'A modern, sleek product teaser video, dynamic motion graphics, dramatic lighting, and a high-end feel.',
  },
  {
    id: 'documentary',
    name: 'Mini-Documentary',
    scriptPrompt: `
      You are a writer for short-form documentary films. 
      Write a compelling and informative script about the topic. The tone should be serious and educational. 
      Format the output as a single block of text.
    `,
    videoPromptModifier: 'A cinematic mini-documentary style video, with slow-panning shots, archival footage style, and a professional voice-over feel.'
  },
  {
    id: 'diy',
    name: 'DIY / Crafting',
    scriptPrompt: `
      You create scripts for DIY and crafting YouTube Shorts. 
      Write a friendly, step-by-step script for the provided topic. 
      The tone should be encouraging and easy to follow. Format the output as a single block of text.
    `,
    videoPromptModifier: 'A top-down view, DIY crafting video, bright and clean lighting, satisfying close-up shots of hands working, upbeat and cheerful mood.'
  }
];

export const VIDEO_LENGTHS: VideoLength[] = [
    { id: 'short', name: 'Short (~15s)', wordCount: 50, duration: 15 },
    { id: 'medium', name: 'Medium (~30s)', wordCount: 100, duration: 30 },
    { id: 'long', name: 'Long (~60s)', wordCount: 200, duration: 60 },
];

export const MUSIC_OPTIONS: MusicOption[] = [
  { id: 'ai-suggested', name: '✨ AI Suggested', url: '' },
  { id: 'none', name: 'None', url: '' },
  { id: 'cinematic', name: 'Cinematic', url: 'https://cdn.pixabay.com/download/audio/2024/07/15/audio_255b722b2b.mp3?filename=epic-logo-short-version-193910.mp3' },
  { id: 'upbeat-pop', name: 'Upbeat Pop', url: 'https://cdn.pixabay.com/download/audio/2024/07/04/audio_34579a25b1.mp3?filename=upbeat-corporate-pop-music-for-videos-193132.mp3' },
  { id: 'chill-lofi', name: 'Chill Lo-fi', url: 'https://cdn.pixabay.com/download/audio/2023/11/02/audio_181a9d06b1.mp3?filename=lofi-chill-medium-169330.mp3' },
];

export const VOICE_STYLES: VoiceStyle[] = [
    { id: 'none', name: 'None' },
    { id: 'female', name: 'Female' },
    { id: 'male', name: 'Male' },
];

export const VOICE_ACCENTS: VoiceAccent[] = [
    { id: 'american', name: 'American', lang: 'en-US' },
    { id: 'british', name: 'British', lang: 'en-GB' },
    { id: 'australian', name: 'Australian', lang: 'en-AU' },
];

export const VOICE_TONES: VoiceTone[] = [
    { id: 'neutral', name: 'Neutral', pitch: 1, rate: 1 },
    { id: 'energetic', name: 'Energetic', pitch: 1.1, rate: 1.15 },
    { id: 'calm', name: 'Calm', pitch: 0.9, rate: 0.85 },
    { id: 'authoritative', name: 'Authoritative', pitch: 0.8, rate: 1 },
];


export const LOADING_MESSAGES: string[] = [
  "Warming up the AI director...",
  "Scouting for digital locations...",
  "Casting the voiceover artist...",
  "Selecting the perfect soundtrack...",
  "Casting virtual actors...",
  "Adjusting the lighting rigs...",
  "Rendering the first few frames...",
  "Applying special effects...",
  "Syncing the audio and visuals...",
  "The final cut is being assembled...",
  "Polishing the final product...",
  "Your video is almost ready for its premiere!",
];
