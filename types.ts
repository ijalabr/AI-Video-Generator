
export enum AppStep {
  INPUT,
  SCRIPT_REVIEW,
  GENERATING,
  RESULT,
}

export interface VideoStyle {
  id: string;
  name: string;
  scriptPrompt: string;
  videoPromptModifier: string;
}

export interface MusicOption {
  id: string;
  name: string;
  url: string;
}

export interface VideoLength {
  id: string;
  name: string;
  wordCount: number;
  duration: number; // in seconds
}

export interface VoiceStyle {
  id: string;
  name: string;
}

export interface VoiceAccent {
  id: string;
  name: string;
  lang: string;
}

export interface VoiceTone {
  id: string;
  name: string;
  pitch: number;
  rate: number;
}
