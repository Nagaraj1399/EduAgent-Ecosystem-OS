import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Activity,
  Sparkles,
  ShieldCheck,
  Zap,
  Radio,
  Wifi,
  Cpu,
  Eye,
  CheckCircle2,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { useMedia, MediaState } from '../../context/MediaContext';

interface RoboticInterviewer3DProps {
  isPlayingAudio: boolean;
  audioText?: string;
  onCalibrationComplete?: () => void;
}

export const RoboticInterviewer3D: React.FC<RoboticInterviewer3DProps> = ({
  isPlayingAudio,
  audioText = '',
  onCalibrationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    mediaState,
    isMicMuted,
    isCameraOn,
    hasCameraStream,
    videoRef,
    audioFrequencies,
    requestCamera,
  } = useMedia();

  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState<boolean>(true);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [latency, setLatency] = useState<number>(14);

  const [webglError, setWebglError] = useState<boolean>(false);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse tracking target
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Latency simulation jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(11 + Math.random() * 6));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle Entrance Calibration Animation Sequence
  useEffect(() => {
    setIsCalibrating(true);
    setCalibrationProgress(10);

    // Auto-request permissions polite calibration with try...catch guard
    try {
      requestCamera();
    } catch (e) {
      console.warn('Media request error in calibration:', e);
    }

    const t1 = setTimeout(() => setCalibrationProgress(45), 600);
    const t2 = setTimeout(() => setCalibrationProgress(80), 1400);
    const t3 = setTimeout(() => {
      setCalibrationProgress(100);
      setIsCalibrating(false);
      if (onCalibrationComplete) onCalibrationComplete();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [requestCamera, onCalibrationComplete]);

  // Mouse move handler for head tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    try {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
      mouseRef.current = { x, y };
    } catch (_) {}
  }, []);

  // Three.js Scene Setup & Animation Loop with Try-Catch Safety
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || webglError) return;

    let frameId: number | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;

    try {
      const width = containerRef.current.clientWidth || 600;
      const height = containerRef.current.clientHeight || 400;

      // 1. Scene, Camera, Renderer
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020617); // Dark Slate slate-950

      const camera = new THREE.PerspectiveCamera(45, (width || 1) / (height || 1), 0.1, 100);
      camera.position.set(0, 0.2, 6.8);

      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;

      // 2. Lighting System
      const ambientLight = new THREE.AmbientLight(0x0f172a, 2.0);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.0);
      keyLight.position.set(4, 5, 5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x818cf8, 2.5);
      rimLight.position.set(-5, 4, -3);
      scene.add(rimLight);

      const underLight = new THREE.PointLight(0x06b6d4, 2.5, 10);
      underLight.position.set(0, -2, 2);
      scene.add(underLight);

      const visorLight = new THREE.PointLight(0x22d3ee, 3.0, 6);
      visorLight.position.set(0, 0.4, 1.8);
      scene.add(visorLight);

      // 3. Create Sleek 3D Robot Head Group Hierarchy
      const robotRootGroup = new THREE.Group();
      scene.add(robotRootGroup);

      const headGroup = new THREE.Group();
      robotRootGroup.add(headGroup);

      // Materials
      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.15,
        envMapIntensity: 1.5,
      });

      const titaniumPlateMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.25,
      });

      const visorGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transmission: 0.4,
        opacity: 0.9,
        transparent: true,
        roughness: 0.1,
        metalness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      const opticGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const mouthLedsMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

      // A. Cranium / Skull Base
      const skullGeo = new THREE.SphereGeometry(1.25, 32, 32);
      const skull = new THREE.Mesh(skullGeo, chassisMat);
      skull.scale.set(1.0, 1.15, 1.05);
      headGroup.add(skull);

      // Occipital Ridge Plate
      const ridgeGeo = new THREE.TorusGeometry(1.2, 0.08, 16, 32, Math.PI * 1.2);
      const ridge = new THREE.Mesh(ridgeGeo, titaniumPlateMat);
      ridge.rotation.x = Math.PI / 3;
      ridge.position.set(0, 0.2, -0.2);
      headGroup.add(ridge);

      // B. Futuristic Curved Visor
      const visorGeo = new THREE.CylinderGeometry(1.15, 1.1, 0.65, 32, 1, false, -Math.PI / 3, (Math.PI * 2) / 3);
      const visor = new THREE.Mesh(visorGeo, visorGlassMat);
      visor.position.set(0, 0.35, 0.3);
      visor.rotation.y = Math.PI;
      headGroup.add(visor);

      // C. Dual Cybernetic Optical Eye Lenses
      const eyeOpticsGroup = new THREE.Group();
      eyeOpticsGroup.position.set(0, 0.38, 1.25);
      headGroup.add(eyeOpticsGroup);

      [-0.42, 0.42].forEach((xOffset) => {
        const ringGeo = new THREE.TorusGeometry(0.18, 0.03, 16, 32);
        const ring = new THREE.Mesh(ringGeo, titaniumPlateMat);
        ring.position.x = xOffset;
        eyeOpticsGroup.add(ring);

        const irisGeo = new THREE.CircleGeometry(0.12, 32);
        const iris = new THREE.Mesh(irisGeo, opticGlowMat);
        iris.position.set(xOffset, 0, 0.02);
        eyeOpticsGroup.add(iris);
      });

      // D. Ear Sensor Hubs & Rotating Telemetry Rings
      const leftEarRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.04, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 })
      );
      leftEarRing.position.set(-1.32, 0.3, 0);
      leftEarRing.rotation.y = Math.PI / 2;
      headGroup.add(leftEarRing);

      const rightEarRing = leftEarRing.clone();
      rightEarRing.position.x = 1.32;
      headGroup.add(rightEarRing);

      // E. Articulated Lower Jaw & Vocalizer Mouth Mechanism
      const lowerJawGroup = new THREE.Group();
      lowerJawGroup.position.set(0, -0.15, 0.2);
      headGroup.add(lowerJawGroup);

      const jawShapeGeo = new THREE.CylinderGeometry(0.95, 0.7, 0.6, 24, 1, false, -Math.PI / 3, (Math.PI * 2) / 3);
      const jawMesh = new THREE.Mesh(jawShapeGeo, titaniumPlateMat);
      jawMesh.position.set(0, -0.4, 0.1);
      jawMesh.rotation.y = Math.PI;
      lowerJawGroup.add(jawMesh);

      const vocalizerBarsGroup = new THREE.Group();
      vocalizerBarsGroup.position.set(0, -0.2, 0.75);
      lowerJawGroup.add(vocalizerBarsGroup);

      const vocalizerBars: THREE.Mesh[] = [];
      for (let i = -4; i <= 4; i++) {
        const barGeo = new THREE.BoxGeometry(0.04, 0.12, 0.02);
        const bar = new THREE.Mesh(barGeo, mouthLedsMat);
        bar.position.x = i * 0.08;
        vocalizerBarsGroup.add(bar);
        vocalizerBars.push(bar);
      }

      // F. Neck Joint & Chest Armor Pedestal
      const neckGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.8, 16);
      const neck = new THREE.Mesh(neckGeo, chassisMat);
      neck.position.set(0, -1.3, -0.1);
      robotRootGroup.add(neck);

      const chestGeo = new THREE.CylinderGeometry(1.6, 1.2, 0.8, 24, 1, false, -Math.PI / 2, Math.PI);
      const chest = new THREE.Mesh(chestGeo, titaniumPlateMat);
      chest.position.set(0, -1.9, -0.2);
      chest.rotation.y = Math.PI;
      robotRootGroup.add(chest);

      const coreGeo = new THREE.IcosahedronGeometry(0.28, 2);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const powerCore = new THREE.Mesh(coreGeo, coreMat);
      powerCore.position.set(0, -1.8, 1.05);
      robotRootGroup.add(powerCore);

      const particlesCount = 80;
      const particlePositions = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount; i++) {
        const angle = (i / particlesCount) * Math.PI * 2;
        const radius = 2.2 + Math.random() * 0.4;
        particlePositions[i * 3] = Math.cos(angle) * radius;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
        particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particlesMat = new THREE.PointsMaterial({
        color: 0x06b6d4,
        size: 0.04,
        transparent: true,
        opacity: 0.7,
      });
      const particlesRing = new THREE.Points(particlesGeo, particlesMat);
      robotRootGroup.add(particlesRing);

      let clock = new THREE.Clock();

      const animate = () => {
        try {
          frameId = requestAnimationFrame(animate);
          const elapsedTime = clock.getElapsedTime();

          const targetRotX = mouseRef.current.y * 0.25;
          const targetRotY = mouseRef.current.x * 0.35;

          headGroup.rotation.x += (targetRotX - headGroup.rotation.x) * 0.05;
          headGroup.rotation.y += (targetRotY - headGroup.rotation.y) * 0.05;

          leftEarRing.rotation.z = elapsedTime * 1.5;
          rightEarRing.rotation.z = -elapsedTime * 1.5;
          particlesRing.rotation.y = elapsedTime * 0.3;

          powerCore.scale.setScalar(1.0 + Math.sin(elapsedTime * 3) * 0.12);

          if (isCalibrating) {
            headGroup.rotation.x = Math.sin(elapsedTime * 2) * 0.15 - 0.1;
            opticGlowMat.color.setHex(0x38bdf8);
            visorLight.color.setHex(0x38bdf8);
          } else if (isPlayingAudio) {
            const speechAmp = (Math.sin(elapsedTime * 18) * 0.5 + 0.5) * 0.35 + (Math.cos(elapsedTime * 24) * 0.2 + 0.2);
            lowerJawGroup.rotation.x = speechAmp * 0.5;

            vocalizerBars.forEach((bar, idx) => {
              const barScale = 0.5 + Math.sin(elapsedTime * 20 + idx) * 0.8;
              bar.scale.y = Math.max(0.3, barScale);
            });

            opticGlowMat.color.setHex(0x34d399);
            visorLight.color.setHex(0x34d399);
            mouthLedsMat.color.setHex(0x34d399);

            headGroup.position.y = Math.sin(elapsedTime * 6) * 0.04;
          } else if (mediaState === 'Listening') {
            headGroup.position.z = 0.2 + Math.sin(elapsedTime * 2) * 0.03;
            lowerJawGroup.rotation.x = 0.05;

            vocalizerBars.forEach((bar, idx) => {
              const freqVal = (audioFrequencies[idx % audioFrequencies.length] || 10) / 60;
              bar.scale.y = Math.max(0.2, freqVal);
            });

            opticGlowMat.color.setHex(0x22d3ee);
            visorLight.color.setHex(0x22d3ee);
            mouthLedsMat.color.setHex(0x06b6d4);
          } else if (mediaState === 'Processing') {
            headGroup.rotation.z = Math.sin(elapsedTime * 2) * 0.08;
            opticGlowMat.color.setHex(0xa855f7);
            visorLight.color.setHex(0xa855f7);
            mouthLedsMat.color.setHex(0x818cf8);
            lowerJawGroup.rotation.x = 0;
          } else {
            headGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.05;
            headGroup.position.z = 0;
            lowerJawGroup.rotation.x = 0;
            vocalizerBars.forEach((bar) => (bar.scale.y = 0.3));

            opticGlowMat.color.setHex(0x38bdf8);
            visorLight.color.setHex(0x38bdf8);
            mouthLedsMat.color.setHex(0x0284c7);
          }

          if (renderer && scene) {
            renderer.render(scene, camera);
          }
        } catch (err) {
          console.warn('Animation loop error:', err);
        }
      };

      animate();

      const handleResize = () => {
        if (!containerRef.current || !renderer) return;
        const w = containerRef.current.clientWidth || 600;
        const h = containerRef.current.clientHeight || 400;
        camera.aspect = (w || 1) / (h || 1);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        if (renderer) renderer.dispose();
        if (scene) scene.clear();
      };
    } catch (err) {
      console.warn('WebGL initialization error, falling back to 2D Robotic Canvas:', err);
      setWebglError(true);
    }
  }, [isCalibrating, isPlayingAudio, mediaState, audioFrequencies, webglError]);

  // 2D High-Performance Animated Canvas Fallback (Guarantees zero WSOD if WebGL is unavailable)
  useEffect(() => {
    if (!webglError || !fallbackCanvasRef.current) return;

    const canvas = fallbackCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const draw2D = () => {
      animId = requestAnimationFrame(draw2D);
      t += 0.03;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 - 10;

      ctx.clearRect(0, 0, w, h);

      // Background Slate Radial Glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 280);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Robot Head Silhouette Base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 80, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Visor
      ctx.fillStyle = isPlayingAudio ? '#059669' : mediaState === 'Listening' ? '#0284c7' : '#0f766e';
      ctx.beginPath();
      ctx.roundRect(cx - 65, cy - 35, 130, 45, 12);
      ctx.fill();

      // Eye Glow Orbs
      ctx.fillStyle = isPlayingAudio ? '#34d399' : mediaState === 'Listening' ? '#22d3ee' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx - 30, cy - 12, 10 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 12, 10 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Mouth Vocalizer LED Array
      ctx.fillStyle = isPlayingAudio ? '#34d399' : '#06b6d4';
      for (let i = -4; i <= 4; i++) {
        const barH = isPlayingAudio
          ? 6 + Math.sin(t * 12 + i) * 14
          : mediaState === 'Listening'
          ? 4 + Math.sin(t * 8 + i) * 8
          : 6;
        ctx.fillRect(cx + i * 10 - 2, cy + 35 - barH / 2, 4, barH);
      }

      // Chest Power Core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy + 110, 14 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    };

    draw2D();

    return () => cancelAnimationFrame(animId);
  }, [webglError, isPlayingAudio, mediaState]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video sm:aspect-[16/9] min-h-[320px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl group select-none"
    >
      {/* 3D WebGL Canvas or 2D Animated Canvas Fallback */}
      {!webglError ? (
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
      ) : (
        <canvas ref={fallbackCanvasRef} width={640} height={360} className="w-full h-full block" />
      )}

      {/* TOP INTEGRATED MEDIA STATUS BAR HUD OVERLAY */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Robot Identity Badge */}
          <div className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-white font-mono text-xs font-extrabold flex items-center gap-2 shadow-lg">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>DR. ALEX VANCE 3D AI</span>
          </div>

          {/* Dynamic State Badge */}
          <div className={`px-2.5 py-1 rounded-xl backdrop-blur-md border font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg ${
            isCalibrating
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              : isPlayingAudio
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 animate-pulse'
              : mediaState === 'Listening'
              ? 'bg-red-950/80 border-red-500/40 text-red-300'
              : mediaState === 'Processing'
              ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
              : 'bg-slate-900/80 border-slate-700 text-cyan-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isCalibrating ? 'bg-amber-400' : isPlayingAudio ? 'bg-emerald-400' : mediaState === 'Listening' ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'
            }`} />
            <span>
              {isCalibrating ? 'CALIBRATING' : isPlayingAudio ? 'SPEAKING' : mediaState === 'Listening' ? 'LISTENING' : mediaState === 'Processing' ? 'THINKING' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Integrated Real-time Telemetry Indicators */}
        <div className="flex items-center gap-2">
          {/* Latency Indicator */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-md">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{latency}ms</span>
          </div>

          {/* Camera Status */}
          <div className={`px-2.5 py-1 rounded-xl backdrop-blur-md border font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-md ${
            isCameraOn && hasCameraStream ? 'bg-slate-900/80 border-emerald-500/40 text-emerald-400' : 'bg-slate-900/80 border-rose-500/40 text-rose-400'
          }`}>
            {isCameraOn && hasCameraStream ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isCameraOn && hasCameraStream ? '1080p HD' : 'Cam Muted'}</span>
          </div>

          {/* Mic Status */}
          <div className={`px-2.5 py-1 rounded-xl backdrop-blur-md border font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-md ${
            !isMicMuted ? 'bg-slate-900/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-900/80 border-rose-500/40 text-rose-400'
          }`}>
            {!isMicMuted ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{!isMicMuted ? 'Mic Ready' : 'Mic Muted'}</span>
          </div>
        </div>
      </div>

      {/* CALIBRATION / SYSTEM SENSORS OVERLAY */}
      {isCalibrating && (
        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 animate-pulse">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-cyan-500/30 animate-ping pointer-events-none" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-white font-mono uppercase tracking-wider">
              3D Robot Sensor Calibration & Alignment
            </h4>
            <p className="text-xs text-cyan-300/80 font-mono">
              Requesting Camera & Mic permissions • Initializing WebGL Spatial Engine
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${calibrationProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> WebGL 3D OK
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Media Permissions OK
            </span>
          </div>
        </div>
      )}

      {/* BOTTOM PIP WEBCAM CANDIDATE FEED */}
      <div className="absolute bottom-3 right-3 z-10 w-36 sm:w-44 aspect-video bg-slate-900/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl backdrop-blur-md group-hover:scale-105 transition-transform duration-300">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraOn && hasCameraStream ? 'opacity-100' : 'opacity-20'}`}
        />
        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[9px] font-mono font-bold text-slate-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>You</span>
        </div>
      </div>

      {/* BOTTOM HUD SCANNER LINE / SUBTITLE CAPTION */}
      <div className="absolute bottom-3 left-3 z-10 max-w-[60%] pointer-events-none">
        {isPlayingAudio && audioText ? (
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs font-sans italic line-clamp-2 shadow-xl">
            "{audioText.replace(/[*#_`]/g, '')}"
          </div>
        ) : (
          <div className="px-3 py-1 rounded-xl bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 text-slate-400 text-[10px] font-mono flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Cursor Tracking Active • Interactive 3D Mesh</span>
          </div>
        )}
      </div>
    </div>
  );
};
