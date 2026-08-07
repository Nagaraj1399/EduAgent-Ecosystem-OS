import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

export type MediaState = 'Ready' | 'Listening' | 'Processing' | 'Complete';

interface MediaContextType {
  mediaState: MediaState;
  setMediaState: (state: MediaState) => void;
  isMicMuted: boolean;
  isCameraOn: boolean;
  hasCameraStream: boolean;
  cameraError: string | null;
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  toggleMic: () => void;
  toggleCamera: () => void;
  startListening: (languageCode?: string) => void;
  stopListening: () => string;
  resetMediaState: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioFrequencies: number[];
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mediaState, setMediaState] = useState<MediaState>('Ready');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(Array(18).fill(10));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio frequency simulation for audio visualizer
  useEffect(() => {
    let interval: any;
    if (mediaState === 'Listening') {
      interval = setInterval(() => {
        setAudioFrequencies(
          Array(18).fill(0).map(() => Math.floor(Math.random() * 55) + 35)
        );
      }, 100);
    } else if (mediaState === 'Processing') {
      interval = setInterval(() => {
        setAudioFrequencies(
          Array(18).fill(0).map(() => Math.floor(Math.random() * 30) + 20)
        );
      }, 150);
    } else {
      setAudioFrequencies(Array(18).fill(10));
    }
    return () => clearInterval(interval);
  }, [mediaState]);

  // Virtual Camera Canvas Fallback for WebRTC stream
  const startVirtualCameraStream = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frame = 0;
      const drawFrame = () => {
        if (!canvas) return;
        frame++;
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(640, 300, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(640, 560, 180, 120, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3 + Math.sin(frame * 0.08) * 0.2;
        ctx.beginPath();
        ctx.arc(640, 300, 105 + Math.sin(frame * 0.08) * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2 + Math.sin(frame * 0.05) * 0.1;
        ctx.strokeRect(40, 40, 1200, 640);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('LIVE CANDIDATE WEBRTC STREAM (HD SIMULATED)', 80, 90);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px monospace';
        ctx.fillText('Candidate Feed Active • 1080p HD • 30 FPS', 80, 120);

        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();
      const virtualStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (virtualStream) {
        mediaStreamRef.current = virtualStream;
        setHasCameraStream(true);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = virtualStream;
          videoRef.current.play().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Virtual camera creation failed:', e);
    }
  }, []);

  // Request hardware camera or fallback to virtual
  const requestCamera = useCallback(async () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setHasCameraStream(true);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        return;
      } catch (_err) {
        // Fallback to virtual camera
      }
    }

    startVirtualCameraStream();
  }, [startVirtualCameraStream]);

  // Handle camera toggling
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setHasCameraStream(false);
    setIsCameraOn(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (isCameraOn) {
      stopCamera();
    } else {
      setIsCameraOn(true);
      requestCamera();
    }
  }, [isCameraOn, stopCamera, requestCamera]);

  useEffect(() => {
    if (isCameraOn) {
      requestCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOn, requestCamera, stopCamera]);

  const toggleMic = useCallback(() => {
    setIsMicMuted((prev) => !prev);
  }, []);

  // Speech-to-Text SpeechRecognition lifecycle
  const startListening = useCallback((languageCode: string = 'en-US') => {
    setMediaState('Listening');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (_) {}
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageCode;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current.trim()) {
            setTranscript(current);
          }
        };

        recognition.onend = () => {
          // If state is still listening, auto-restart or set to ready
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition start failed:', err);
      }
    }
  }, []);

  const stopListening = useCallback((): string => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setMediaState('Processing');
    return transcript;
  }, [transcript]);

  const resetMediaState = useCallback(() => {
    setMediaState('Ready');
    setTranscript('');
  }, []);

  return (
    <MediaContext.Provider
      value={{
        mediaState,
        setMediaState,
        isMicMuted,
        isCameraOn,
        hasCameraStream,
        cameraError,
        transcript,
        setTranscript,
        toggleMic,
        toggleCamera,
        startListening,
        stopListening,
        resetMediaState,
        videoRef,
        audioFrequencies,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};
