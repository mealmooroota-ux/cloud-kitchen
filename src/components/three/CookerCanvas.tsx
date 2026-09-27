"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL = "/models/rice-cooker.glb";
// Separation distance per part (model units), matching the exploded poster.
const OFFSET: Record<string, number> = { base: 0, plate: 1.38, pot: 1.74, rice: 2.77, lid: 2.74, vent: 3.24 };
const ORDER = ["base", "plate", "pot", "rice", "lid", "vent"];

export interface CookerPose { explode: number; spin?: number; steam?: boolean; jiggle?: boolean }

function Cooker({ progress, pose }: { progress?: MutableRefObject<number>; pose?: CookerPose }) {
  const { scene } = useGLTF(MODEL);
  const root = useRef<THREE.Group>(null);
  const parts = useMemo(() => {
    const map: Record<string, { obj: THREE.Object3D; baseY: number }> = {};
    // GLTFLoader sanitises names ("plate.001" -> "plate001"), so match by prefix and take the top-most node per part.
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
      mesh.castShadow = true; mesh.receiveShadow = true;
      // Keep steel readable even where environment reflections are weak (low-end GPUs, software rendering).
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && "metalness" in mat && mat.metalness > 0.7) { mat.metalness = 0.7; mat.roughness = Math.max(mat.roughness, 0.28); mat.envMapIntensity = 1.2; }
    });
    return map;
  }, [scene]);
  const { camera } = useThree();
  const current = useRef(0);

  useFrame((state, dt) => {
    const target = progress ? progress.current : pose?.explode ?? 0;
    current.current = THREE.MathUtils.damp(current.current, target, 6, dt);
    const p = current.current;
    ORDER.forEach((k, i) => {
      const part = parts[k];
      if (!part) return;
      // stagger: upper parts start separating first, all settle together
      const local = THREE.MathUtils.clamp((p - (5 - i) * 0.04) / (1 - 0.2), 0, 1);
      const eased = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
      let y = part.baseY + OFFSET[k] * eased;
      if (pose?.jiggle && (k === "lid" || k === "vent")) y += Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 0.025;
      part.obj.position.y = y;
    });
    if (root.current) {
      const spin = pose?.spin ?? 0;
      root.current.rotation.y = progress ? -0.5 + p * 0.9 + Math.sin(state.clock.elapsedTime * 0.3) * 0.03 : root.current.rotation.y + dt * spin;
    }
    // frame the object: tighter when closed, wider when separated
    const h = 1.8 + 3.2 * p;
    const dist = 6.4 + 11 * p;
    camera.position.lerp(new THREE.Vector3(0, h * 0.62 + 0.9, dist), 0.12);
    camera.lookAt(0, h * 0.5, 0);
  });
  return <group ref={root}><primitive object={scene} /></group>;
}

export default function CookerCanvas({ progress, pose, className = "" }: { progress?: MutableRefObject<number>; pose?: CookerPose; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className={className} aria-hidden="true">
      <Canvas shadows dpr={[1, 1.75]} frameloop={visible ? "always" : "never"} camera={{ fov: 30, position: [0, 2, 7] }} gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}>
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#fffaf2", "#d9cbb6", 0.9]} />
        <directionalLight position={[-4, 7, 5]} intensity={1.6} color="#fff1e0" castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[5, 4, -4]} intensity={0.6} color="#eef3ff" />
        <Suspense fallback={null}>
          <Cooker progress={progress} pose={pose} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={3} position={[-4, 5, 3]} scale={[6, 6, 1]} color="#fff4e6" />
            <Lightformer form="rect" intensity={1.5} position={[5, 3, -3]} scale={[4, 4, 1]} color="#f2f5ff" />
            <Lightformer form="ring" intensity={0.8} position={[0, 6, 0]} scale={4} rotation-x={Math.PI / 2} />
          </Environment>
          <ContactShadows position={[0, -0.04, 0]} opacity={0.35} scale={6} blur={2.6} far={3} color="#5b4a3a" />
        </Suspense>
      </Canvas>
    </div>
  );
}
useGLTF.preload(MODEL);
