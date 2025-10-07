
import { GoogleGenAI, Type } from "@google/genai";
import type { VideoStyle, VideoLength, VoiceStyle, VoiceAccent, VoiceTone } from '../types';
import { MUSIC_OPTIONS } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const musicGenres = MUSIC_OPTIONS
    .filter(opt => opt.id !== 'ai-suggested' && opt.id !== 'none')
    .map(opt => opt.name);

interface ScriptGenerationResponse {
  script: string;
  musicGenre?: string;
}

export async function generateScript(
    topic: string, 
    style: VideoStyle,
    length: VideoLength,
    aiShouldSuggestMusic: boolean
): Promise<ScriptGenerationResponse> {
  try {
    let systemInstruction = style.scriptPrompt;
    systemInstruction += ` The script should be around ${length.wordCount} words.`;
    
    if (aiShouldSuggestMusic) {
        systemInstruction += `
            You must also suggest a background music genre from the following list that best fits the topic and tone: ${musicGenres.join(', ')}.
            Respond with a JSON object with two keys: "script" (string) and "musicGenre" (string).
        `;
    } else {
        systemInstruction += `
            Respond with a JSON object with one key: "script" (string).
        `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Topic: ${topic}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                script: { type: Type.STRING },
                ...(aiShouldSuggestMusic && { 
                    musicGenre: { 
                        type: Type.STRING,
                        enum: musicGenres
                    } 
                })
            },
            required: ['script']
        }
      }
    });

    const jsonString = response.text.trim();
    const cleanJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '');
    const parsed = JSON.parse(cleanJsonString);

    return {
        script: parsed.script,
        musicGenre: parsed.musicGenre
    };
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script. Please check the console for details.");
  }
}

export async function generateVideo(
  script: string, 
  style: VideoStyle, 
  length: VideoLength, 
  musicGenre?: string, 
  referenceImageBase64?: string,
  voice?: {
    style: VoiceStyle,
    accent: VoiceAccent,
    tone: VoiceTone
  }
): Promise<string> {
  try {
    let fullPrompt = `${script}. ${style.videoPromptModifier}`;
    fullPrompt += ` The video should be approximately ${length.duration} seconds long.`;

    if (musicGenre) {
        fullPrompt += ` The video should have a mood that matches ${musicGenre} background music.`
    }
    
    if (voice && voice.style.id !== 'none') {
        fullPrompt += ` The video's visual style should be suitable for a voiceover with a ${voice.style.name}, ${voice.accent.name} accent, and a ${voice.tone.name} tone.`;
    }

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: fullPrompt,
      ...(referenceImageBase64 && {
        image: {
          imageBytes: referenceImageBase64,
          mimeType: 'image/jpeg',
        },
      }),
      config: {
        numberOfVideos: 1
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed but no download link was found.");
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video file: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw new Error("Failed to generate video. Please check the console for details.");
  }
}
