
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppStep, VideoStyle, MusicOption, VideoLength, VoiceStyle, VoiceAccent, VoiceTone } from './types';
import { VIDEO_STYLES, MUSIC_OPTIONS, VIDEO_LENGTHS, VOICE_STYLES, VOICE_ACCENTS, VOICE_TONES } from './constants';
import { generateScript, generateVideo } from './services/geminiService';
import { YouTubeIcon, WandIcon, RefreshIcon, FilmIcon, MusicIcon, EditIcon, UploadIcon, XCircleIcon, SpeakerIcon } from './components/Icons';
import StepIndicator from './components/StepIndicator';
import Loader from './components/Loader';
import { extractFrameFromVideo } from './utils';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [topic, setTopic] = useState<string>('');
  const [style, setStyle] = useState<VideoStyle>(VIDEO_STYLES[0]);
  const [length, setLength] = useState<VideoLength>(VIDEO_LENGTHS[0]);
  const [musicOptionId, setMusicOptionId] = useState<string>(MUSIC_OPTIONS[0].id);
  const [script, setScript] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [uploadedMusicFile, setUploadedMusicFile] = useState<File | null>(null);
  const [referenceVideoFile, setReferenceVideoFile] = useState<File | null>(null);
  
  const [voiceStyleId, setVoiceStyleId] = useState<string>(VOICE_STYLES[0].id);
  const [voiceAccentId, setVoiceAccentId] = useState<string>(VOICE_ACCENTS[0].id);
  const [voiceToneId, setVoiceToneId] = useState<string>(VOICE_TONES[0].id);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (uploadedMusicFile) {
        objectUrl = URL.createObjectURL(uploadedMusicFile);
        setMusicUrl(objectUrl);
        setMusicOptionId('uploaded'); // Set a special ID
    } else {
        const selectedOption = MUSIC_OPTIONS.find(opt => opt.id === musicOptionId);
        setMusicUrl(selectedOption?.url || '');
    }

    return () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [uploadedMusicFile, musicOptionId]);

  // Load available browser voices
  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            setVoices(availableVoices);
        }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    }
  }, []);

  // Handle voiceover playback
  useEffect(() => {
      const videoElement = videoRef.current;
      if (step !== AppStep.RESULT || voiceStyleId === 'none' || !script || voices.length === 0 || !videoElement) {
          return;
      }

      const selectedAccent = VOICE_ACCENTS.find(a => a.id === voiceAccentId);
      const selectedStyle = VOICE_STYLES.find(s => s.id === voiceStyleId);
      const selectedTone = VOICE_TONES.find(t => t.id === voiceToneId);

      let potentialVoices = voices.filter(v => v.lang === selectedAccent?.lang);
      if (potentialVoices.length === 0) {
          potentialVoices = voices.filter(v => v.lang.startsWith(selectedAccent?.lang.split('-')[0] || 'en'));
      }
      
      let finalVoice = potentialVoices[0]; // fallback to first available voice for the language
      if (selectedStyle && selectedStyle.id !== 'none' && potentialVoices.length > 0) {
          const genderFiltered = potentialVoices.filter(v => v.name.toLowerCase().includes(selectedStyle.id));
          if (genderFiltered.length > 0) {
              finalVoice = genderFiltered[0];
          }
      }

      const utterance = new SpeechSynthesisUtterance(script);
      if (finalVoice) utterance.voice = finalVoice;
      if (selectedTone) {
          utterance.pitch = selectedTone.pitch;
          utterance.rate = selectedTone.rate;
      }

      const handlePlay = () => {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
      };
      const handlePauseOrEnd = () => {
          window.speechSynthesis.cancel();
      };

      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePauseOrEnd);
      videoElement.addEventListener('ended', handlePauseOrEnd);

      return () => {
          window.speechSynthesis.cancel();
          videoElement.removeEventListener('play', handlePlay);
          videoElement.removeEventListener('pause', handlePauseOrEnd);
          videoElement.removeEventListener('ended', handlePauseOrEnd);
      };

  }, [step, videoUrl, script, voices, voiceStyleId, voiceAccentId, voiceToneId]);

  const handleStartOver = useCallback(() => {
    setStep(AppStep.INPUT);
    setTopic('');
    setScript('');
    setVideoUrl('');
    setMusicUrl('');
    setStyle(VIDEO_STYLES[0]);
    setLength(VIDEO_LENGTHS[0]);
    setMusicOptionId(MUSIC_OPTIONS[0].id);
    setUploadedMusicFile(null);
    setReferenceVideoFile(null);
    setVoiceStyleId(VOICE_STYLES[0].id);
    setVoiceAccentId(VOICE_ACCENTS[0].id);
    setVoiceToneId(VOICE_TONES[0].id);
    setError('');
    setIsLoading(false);
  }, []);
  
  const handleEditAndRegenerate = useCallback(() => {
    setVideoUrl('');
    setMusicUrl('');
    setStep(AppStep.SCRIPT_REVIEW);
  }, []);

  const handleGenerateScript = useCallback(async () => {
    if (!topic || !style || !length) return;
    setIsLoading(true);
    setError('');
    
    if (!uploadedMusicFile) {
      setMusicUrl('');
    }

    try {
      const aiShouldSuggestMusic = musicOptionId === 'ai-suggested';
      const { script: generatedScript, musicGenre } = await generateScript(topic, style, length, aiShouldSuggestMusic);
      setScript(generatedScript);

      if (aiShouldSuggestMusic && musicGenre) {
          const suggestedOption = MUSIC_OPTIONS.find(opt => opt.name === musicGenre);
          if (suggestedOption) {
              setMusicUrl(suggestedOption.url);
              setMusicOptionId(suggestedOption.id);
          }
      } else if (!uploadedMusicFile) {
          const selectedOption = MUSIC_OPTIONS.find(opt => opt.id === musicOptionId);
          if (selectedOption) {
              setMusicUrl(selectedOption.url);
          }
      }

      setStep(AppStep.SCRIPT_REVIEW);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [topic, style, length, musicOptionId, uploadedMusicFile]);

  const handleGenerateVideo = useCallback(async () => {
    if (!script || !style || !length) return;
    setStep(AppStep.GENERATING);
    setError('');
    try {
      let referenceImageBase64: string | undefined = undefined;
      if (referenceVideoFile) {
        referenceImageBase64 = await extractFrameFromVideo(referenceVideoFile);
      }
      
      const selectedMusicOption = !uploadedMusicFile ? MUSIC_OPTIONS.find(opt => opt.id === musicOptionId) : undefined;
      const musicGenre = selectedMusicOption?.id !== 'none' && selectedMusicOption?.id !== 'ai-suggested' ? selectedMusicOption?.name : undefined;

      const voice = {
          style: VOICE_STYLES.find(s => s.id === voiceStyleId)!,
          accent: VOICE_ACCENTS.find(a => a.id === voiceAccentId)!,
          tone: VOICE_TONES.find(t => t.id === voiceToneId)!,
      }

      const generatedVideoUrl = await generateVideo(script, style, length, musicGenre, referenceImageBase64, voice);
      setVideoUrl(generatedVideoUrl);
      setStep(AppStep.RESULT);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setStep(AppStep.SCRIPT_REVIEW);
    }
  }, [script, style, length, musicOptionId, uploadedMusicFile, referenceVideoFile, voiceStyleId, voiceAccentId, voiceToneId]);
  
  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script]);
  
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedMusicFile(file);
    }
  };

  const handleReferenceVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceVideoFile(file);
    }
  };


  const renderContent = () => {
    switch (step) {
      case AppStep.INPUT:
        return (
          <div className="w-full max-w-2xl space-y-6">
            <h2 className="text-3xl font-bold text-center">Describe Your Video</h2>
            <p className="text-center text-slate-400">
              Start by providing a topic and customizing the video options.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">
                  Topic
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The history of coffee"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  aria-required="true"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="style" className="block text-sm font-medium text-slate-300 mb-1">
                    Style
                    </label>
                    <select
                    id="style"
                    value={style.id}
                    onChange={(e) => setStyle(VIDEO_STYLES.find(s => s.id === e.target.value) || VIDEO_STYLES[0])}
                    className="w-full h-[42px] px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                    {VIDEO_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="length" className="block text-sm font-medium text-slate-300 mb-1">
                    Length
                    </label>
                    <select
                    id="length"
                    value={length.id}
                    onChange={(e) => setLength(VIDEO_LENGTHS.find(l => l.id === e.target.value) || VIDEO_LENGTHS[0])}
                    className="w-full h-[42px] px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                    {VIDEO_LENGTHS.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="music" className="block text-sm font-medium text-slate-300 mb-1">
                    Music
                    </label>
                    <select
                    id="music"
                    value={musicOptionId}
                    onChange={(e) => setMusicOptionId(e.target.value)}
                    disabled={!!uploadedMusicFile}
                    className="w-full h-[42px] px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none disabled:bg-slate-700 disabled:cursor-not-allowed"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                    {MUSIC_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Upload Music (Optional)
                      </label>
                      <input type="file" id="music-upload" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
                       {!uploadedMusicFile ? (
                          <button onClick={() => document.getElementById('music-upload')?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-md hover:bg-slate-700 transition">
                            <UploadIcon className="w-4 h-4" />
                            Choose Audio File
                          </button>
                       ) : (
                         <div className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-md">
                           <p className="truncate text-slate-300">{uploadedMusicFile.name}</p>
                           <button onClick={() => {setUploadedMusicFile(null); (document.getElementById('music-upload') as HTMLInputElement).value = '';}} className="text-slate-400 hover:text-white transition">
                             <XCircleIcon className="w-5 h-5"/>
                           </button>
                         </div>
                       )}
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Reference Video (Optional)
                      </label>
                      <input type="file" id="video-upload" accept="video/*" onChange={handleReferenceVideoUpload} className="hidden" />
                      {!referenceVideoFile ? (
                          <button onClick={() => document.getElementById('video-upload')?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-md hover:bg-slate-700 transition">
                            <UploadIcon className="w-4 h-4" />
                            Choose Video File
                          </button>
                       ) : (
                         <div className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-md">
                           <p className="truncate text-slate-300">{referenceVideoFile.name}</p>
                           <button onClick={() => {setReferenceVideoFile(null); (document.getElementById('video-upload') as HTMLInputElement).value = '';}} className="text-slate-400 hover:text-white transition">
                             <XCircleIcon className="w-5 h-5"/>
                           </button>
                         </div>
                       )}
                  </div>
              </div>
               <div className="space-y-4 pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                         <SpeakerIcon className="w-5 h-5 text-slate-400" />
                         <h3 className="text-lg font-semibold text-slate-200">Voiceover (Preview Only)</h3>
                    </div>
                     <p className="text-xs text-slate-400 -mt-2">Voice quality depends on your browser. Not included in download.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div>
                            <label htmlFor="voiceStyle" className="block text-sm font-medium text-slate-300 mb-1">Style / Gender</label>
                            <select id="voiceStyle" value={voiceStyleId} onChange={e => setVoiceStyleId(e.target.value)} className="w-full h-[42px] px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                                {VOICE_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                         </div>
                         <div>
                             <label htmlFor="voiceAccent" className="block text-sm font-medium text-slate-300 mb-1">Accent</label>
                             <select id="voiceAccent" value={voiceAccentId} onChange={e => setVoiceAccentId(e.target.value)} className="w-full h-[42px] px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                                {VOICE_ACCENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                         </div>
                         <div>
                             <label htmlFor="voiceTone" className="block text-sm font-medium text-slate-300 mb-1">Tone</label>
                             <select id="voiceTone" value={voiceToneId} onChange={e => setVoiceToneId(e.target.value)} className="w-full h-[42px] px-4 py-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                                {VOICE_TONES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                         </div>
                    </div>
               </div>
            </div>
            <button
              onClick={handleGenerateScript}
              disabled={isLoading || !topic}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300"
            >
              {isLoading ? 'Generating...' : <><WandIcon className="w-5 h-5" /> Generate Script</>}
            </button>
          </div>
        );
      case AppStep.SCRIPT_REVIEW:
        return (
           <div className="w-full max-w-2xl space-y-4">
            <h2 className="text-3xl font-bold text-center">Review Your Script</h2>
             <p className="text-center text-slate-400">
              Feel free to edit the script below before generating the video.
            </p>
            <div>
              <div className="w-full text-right text-sm text-slate-400 mb-2 px-1">
                {wordCount} / ~{length.wordCount} words
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-80 p-4 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                aria-label="Script editor"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
               <button
                onClick={() => setStep(AppStep.INPUT)}
                className="w-full px-6 py-3 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors"
              >
                Back to Topic
              </button>
              <button
                onClick={handleGenerateScript}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 disabled:bg-slate-500 transition-colors"
              >
                <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /> Regenerate Script
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-slate-500 transition-colors"
              >
                <FilmIcon className="w-5 h-5" /> Generate Video
              </button>
            </div>
          </div>
        );
        case AppStep.GENERATING:
            return <Loader message="Creating Your Masterpiece..." />;
        case AppStep.RESULT:
            const musicFilename = musicUrl ? musicUrl.split('?filename=')[1] || `ai_music_${Date.now()}.mp3` : '';
            return (
                <div className="w-full max-w-3xl space-y-6 text-center">
                    <h2 className="text-3xl font-bold">Your Video is Ready!</h2>
                    <div className="relative aspect-video w-full bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700">
                        {videoUrl && (
                            <video ref={videoRef} src={videoUrl} controls autoPlay loop muted className="w-full h-full object-contain" aria-label="Generated video player"></video>
                        )}
                        {musicUrl && (
                            <audio src={musicUrl} autoPlay loop controls={false} aria-label="Background music player"></audio>
                        )}
                    </div>
                     <p className="text-xs text-slate-400">
                        Note: Music and voiceover are for preview only. The downloaded video will be silent. You can download the music track separately.
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <a 
                            href={videoUrl} 
                            download={`ai_video_${Date.now()}.mp4`}
                            className="col-span-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors text-center"
                        >
                            <FilmIcon className="w-5 h-5" /> Download
                        </a>
                        {musicUrl && (
                             <a 
                                href={musicUrl} 
                                download={uploadedMusicFile ? uploadedMusicFile.name : musicFilename}
                                className="col-span-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors text-center"
                            >
                                <MusicIcon className="w-5 h-5" /> Music
                            </a>
                        )}
                        <button 
                            onClick={handleEditAndRegenerate}
                            className="col-span-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors"
                        >
                            <EditIcon className="w-5 h-5" /> Edit
                        </button>
                        <button 
                            onClick={handleStartOver}
                            className="col-span-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors"
                        >
                            <RefreshIcon className="w-5 h-5" /> Start Over
                        </button>
                    </div>
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
                <YouTubeIcon className="w-12 h-auto text-red-500" />
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                    Video Generator AI
                </h1>
            </div>
        </header>

        <div className="mb-12 flex justify-center pt-4">
          <StepIndicator currentStep={step} />
        </div>

        <main className="flex flex-col items-center justify-center bg-slate-800/50 p-8 rounded-xl border border-slate-700 shadow-2xl shadow-indigo-900/20 min-h-[400px]">
          {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-6 w-full max-w-2xl text-center">{error}</div>}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
