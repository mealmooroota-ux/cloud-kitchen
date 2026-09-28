"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { isLowPowerMotion } from "@/components/motion/gsap";

const MODEL = "/models/rice-cooker.glb";
// Separation per part (model units), compressed so the fully opened stack stays inside one fixed frame.
const SPREAD = 0.72;
const OFFSET: Record<string, number> = { base: 0, plate: 1.38, pot: 1.74, rice: 2.77, lid: 2.74, vent: 3.24 };
const ORDER = ["base", "plate", "pot", "rice", "lid", "vent"];

export interface CookerPose { explode: number; spin?: number; steam?: boolean; jiggle?: boolean }

function Cooker({ progress, active, pose, framing, low }: { progress?: MutableRefObject<number>; active?: MutableRefObject<string | null>; pose?: CookerPose; framing: "story" | "tight"; low: boolean }) {
  const { scene } = useGLTF(MODEL);
  const root = useRef<THREE.Group>(null);
  const parts = useMemo(() => {
    const map: Record<string, { obj: THREE.Object3D; baseY: number }> = {};
    // GLTFLoader sanitises names ("plate.001" -> "plate001"): match by prefix, take the top-most node per part.
    const re = /^(base|plate|pot|rice|lid|vent)/;
    const claimed = new Set<THREE.Object3D>();
    scene.traverse((o) => {
      const m = re.exec(o.name);
      if (!m || map[m[1]]) return;
      for (let a = o.parent; a; a = a.parent) if (claimed.has(a)) return;
      map[m[1]] = { obj: o, baseY: o.position.y };
      claimed.add(o);
    });
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = !low; mesh.receiveShadow = !low;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && "metalness" in mat && mat.metalness > 0.7) { mat.metalness = 0.7; mat.roughness = Math.max(mat.roughness, 0.28); mat.envMapIntensity = 1.2; }
    });
    return map;
  }, [scene, low]);
  const { camera } = useThree();
  const current = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const aim = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const target = progress ? progress.current : pose?.explode ?? 0;
    current.current = THREE.MathUtils.damp(current.current, target, 5, dt);
    const p = current.current;
    ORDER.forEach((k, i) => {
      const part = parts[k];
      if (!part) return;
      const local = THREE.MathUtils.clamp((p - (5 - i) * 0.04) / 0.8, 0, 1);
      const eased = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
      let y = part.baseY + OFFSET[k] * SPREAD * eased;
      if (pose?.jiggle && (k === "lid" || k === "vent")) y += Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 0.025;
      part.obj.position.y = y;
      // present the part being described: a gentle scale-up
      const on = active?.current === k && p > 0.5;
      const sc = THREE.MathUtils.damp(part.obj.scale.x, on ? 1.08 : 1, 6, dt);
      part.obj.scale.setScalar(sc);
    });
    if (root.current) {
      // turntable: always turning in front of the viewer
      root.current.rotation.y += dt * (pose?.spin ?? 0.32);
    }
    // Fixed camera distance: the cooker is never pushed back. Only the aim follows the stack's centre.
    const top = 1.9 + 3.24 * SPREAD * p;
    const dist = framing === "story" ? 10.6 : 6.6;
    look.current.lerp(aim.set(0, framing === "story" ? 2.15 : top * 0.5, 0), 1 - Math.exp(-5 * dt));
    camera.position.set(0, look.current.y + (framing === "story" ? 1.2 : 1.1), dist);
    camera.lookAt(look.current);
  });
  return <group ref={root} rotation-y={-0.4}><primitive object={scene} /></group>;
}

/**
 * The 3D cooker, tuned per device:
 *  - phones/tablets: no shadow maps, a one-off contact shadow, pixel ratio capped at 1.5
 *  - everyone: the pixel ratio drops automatically if the frame rate falls, and if the device
 *    still can't keep up (or the GPU context is lost) the still photo replaces the 3D in place.
 */
export default function CookerCanvas({ progress, active, pose, className = "", framing = "tight" }: { progress?: MutableRefObject<number>; active?: MutableRefObject<string | null>; pose?: CookerPose; className?: string; framing?: "story" | "tight" }) {
  const wrap = useRef<HTMLDivElement>(null);
  const low = useMemo(() => isLowPowerMotion(), []);
  const maxDpr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 1.75);
  const [dpr, setDpr] = useState(maxDpr);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(wrap.current);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  if (failed) {
    return (
      <div className={className} aria-hidden="true">
        <Image src="/images/cooker-exploded.webp" alt="" fill sizes="(min-width: 768px) 50vw, 90vw" className="object-contain p-6" />
      </div>
    );
  }
  return (
    <div ref={wrap} className={className} aria-hidden="true">
      <Canvas
        shadows={!low}
        dpr={dpr}
        frameloop={visible && pageVisible ? "always" : "never"}
        camera={{ fov: 30, position: [0, 3, 10] }}
        gl={{ antialias: true, powerPreference: low ? "default" : "high-performance", alpha: true, stencil: false }}
        // Don't re-measure the canvas on every scroll event (the default): it's decorative and never clicked.
        resize={{ scroll: false, debounce: { scroll: 0, resize: 150 } }}
        style={{ pointerEvents: "none", touchAction: "auto" }}
        onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); setFailed(true); }, { once: true })}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, Math.round((d - 0.25) * 100) / 100))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, Math.round((d + 0.25) * 100) / 100))}
          flipflops={3}
          onFallback={() => setFailed(true)}
        />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#fffaf2", "#d9cbb6", 0.9]} />
        <directionalLight position={[-4, 7, 5]} intensity={1.6} color="#fff1e0" castShadow={!low} shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[5, 4, -4]} intensity={0.6} color="#eef3ff" />
        <Suspense fallback={null}>
          <Cooker progress={progress} active={active} pose={pose} framing={framing} low={low} />
          <Environment resolution={low ? 128 : 256} frames={1}>
            <Lightformer form="rect" intensity={3} position={[-4, 5, 3]} scale={[6, 6, 1]} color="#fff4e6" />
            <Lightformer form="rect" intensity={1.5} position={[5, 3, -3]} scale={[4, 4, 1]} color="#f2f5ff" />
            <Lightformer form="ring" intensity={0.8} position={[0, 6, 0]} scale={4} rotation-x={Math.PI / 2} />
          </Environment>
          <ContactShadows position={[0, -0.04, 0]} opacity={0.35} scale={6} blur={2.6} far={3} color="#5b4a3a" resolution={low ? 256 : 512} frames={low ? 1 : Infinity} />
        </Suspense>
      </Canvas>
    </div>
  );
}
useGLTF.preload(MODEL);
