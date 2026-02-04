
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { 
  ConnectionStatus, 
  TranscriptionEntry 
} from './types';
import { 
  MODEL_NAME, 
  SYSTEM_INSTRUCTION, 
  SAMPLE_RATE_INPUT, 
  SAMPLE_RATE_OUTPUT, 
  FRAME_RATE, 
  JPEG_QUALITY 
} from './constants';
import ControlBar from './components/ControlBar';
import LiveView from './components/LiveView';
import TranscriptionPanel from './components/TranscriptionPanel';
import StatusIndicator from './components/StatusIndicator';

// Audio Utility Functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  
  // Real-time streaming transcription text
  const [streamingUserText, setStreamingUserText] = useState('');
  const [streamingAiText, setStreamingAiText] = useState('');

  // Refs for audio handling
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionRef = useRef<any>(null); 
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // Effect to attach screen stream whenever isScreenSharing becomes true
  useEffect(() => {
    if (isScreenSharing && screenStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = screenStreamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isScreenSharing]);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    sessionPromiseRef.current = null;
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    activeSourcesRef.current.forEach(s => s.stop());
    activeSourcesRef.current.clear();
    setStatus(ConnectionStatus.DISCONNECTED);
    setIsMicOn(false);
    setIsScreenSharing(false);
    setStreamingUserText('');
    setStreamingAiText('');
  }, []);

  const startSession = async () => {
    if (!process.env.API_KEY) {
      alert("API Key missing");
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_INPUT });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_OUTPUT });

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setStatus(ConnectionStatus.CONNECTED);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const newText = message.serverContent.inputTranscription.text;
              setStreamingUserText(prev => prev + newText);
            }
            if (message.serverContent?.outputTranscription) {
              const newText = message.serverContent.outputTranscription.text;
              setStreamingAiText(prev => prev + newText);
            }

            if (message.serverContent?.turnComplete) {
              setStreamingUserText(userText => {
                setStreamingAiText(aiText => {
                  if (userText || aiText) {
                    const newEntries: TranscriptionEntry[] = [];
                    if (userText) newEntries.push({ role: 'user', text: userText, timestamp: Date.now() });
                    if (aiText) newEntries.push({ role: 'ai', text: aiText, timestamp: Date.now() });
                    setTranscriptions(prev => [...prev, ...newEntries]);
                  }
                  return '';
                });
                return '';
              });
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current) {
              const ctx = outputAudioCtxRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, SAMPLE_RATE_OUTPUT, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => activeSourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setStatus(ConnectionStatus.ERROR);
          },
          onclose: () => {
            console.log("Session closed");
            stopSession();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to connect:", err);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const toggleMic = async () => {
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        
        if (inputAudioCtxRef.current && sessionPromiseRef.current) {
          const ctx = inputAudioCtxRef.current;
          const source = ctx.createMediaStreamSource(stream);
          const processor = ctx.createScriptProcessor(2048, 1, 1);

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000'
            };
            
            sessionPromiseRef.current?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(processor);
          processor.connect(ctx.destination);
          setIsMicOn(true);
        }
      } catch (err) {
        console.error("Mic access failed:", err);
      }
    } else {
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
      setIsMicOn(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { frameRate: 15 }
        });
        screenStreamRef.current = stream;
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
          }
        };

        // Note: The actual assignment to videoRef.current happens in the useEffect
        setIsScreenSharing(true);

        frameIntervalRef.current = window.setInterval(() => {
          if (videoRef.current && canvasRef.current && sessionPromiseRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx && video.videoWidth > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    sessionPromiseRef.current?.then((session) => {
                      session.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                      });
                    });
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/jpeg', JPEG_QUALITY);
            }
          }
        }, 1000 / FRAME_RATE);
      } catch (err) {
        console.error("Screen share failed:", err);
        alert("Failed to start screen share.");
      }
    } else {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#121212] font-sans">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center border-2 border-white/20">
              <span className="text-xl">⛏️</span>
            </div>
            <div>
              <h1 className="minecraft-font text-sm md:text-lg text-white">STEVE-AI COACH</h1>
              <StatusIndicator status={status} />
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs text-gray-400 max-w-xs italic">
              "Real-time coaching for Hypixel Bed Wars."
            </p>
          </div>
        </header>

        <main className="flex-1 relative bg-[#0a0a0a] group overflow-hidden">
          <LiveView 
            videoRef={videoRef} 
            isScreenSharing={isScreenSharing} 
            canvasRef={canvasRef}
          />
          
          {status === ConnectionStatus.CONNECTED && (
            <div className="absolute top-6 left-6 pointer-events-none z-30">
              <div className="bg-black/60 border border-green-500/50 p-2 text-[10px] text-green-400 font-mono rounded backdrop-blur-sm">
                REC :: LIVE_FEED_ACTIVE
                <div className="w-full h-1 bg-green-900 mt-1">
                  <div className="w-1/3 h-full bg-green-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </main>

        <ControlBar 
          status={status} 
          isMicOn={isMicOn}
          isScreenSharing={isScreenSharing}
          onStart={startSession}
          onStop={stopSession}
          onToggleMic={toggleMic}
          onToggleScreen={toggleScreenShare}
        />
      </div>

      <aside className="w-80 md:w-96 border-l border-white/10 bg-[#161616] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="minecraft-font text-[10px] tracking-wider text-gray-400">SESSION LOG</h2>
          <button 
            onClick={() => setTranscriptions([])}
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            CLEAR
          </button>
        </div>
        <TranscriptionPanel 
          transcriptions={transcriptions} 
          streamingUserText={streamingUserText}
          streamingAiText={streamingAiText}
        />
      </aside>
    </div>
  );
};

export default App;
