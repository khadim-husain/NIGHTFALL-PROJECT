'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Kiosk } from '@/lib/types';
import { useApp } from '@/lib/AppContext';

// Procedural Kiosk Component
function KioskMesh({
  kiosk,
  isSelected,
  onClick,
}: {
  kiosk: Kiosk;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);

  // Status color logic
  const statusColor = useMemo(() => {
    switch (kiosk.status) {
      case 'Error':
        return '#EF4444';
      case 'Busy':
        return '#3B82F6';
      case 'Offline':
        return '#64748B';
      default:
        // If K03 (thermal warning) show amber, else green
        if (kiosk.id === 'K03') return '#F59E0B';
        return '#10B981';
    }
  }, [kiosk.status, kiosk.id]);

  // Subtle breathing animation when printing
  useFrame((state) => {
    if (meshRef.current && (kiosk.currentJobId || isSelected)) {
      const t = state.clock.getElapsedTime();
      if (isSelected) {
        meshRef.current.position.y = kiosk.coordinates.y + Math.sin(t * 3) * 0.05 + 0.05;
      } else {
        meshRef.current.position.y = kiosk.coordinates.y;
      }
    }
  });

  return (
    <group
      ref={meshRef}
      position={[kiosk.coordinates.x, kiosk.coordinates.y, kiosk.coordinates.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Selection Glow Cylinder Ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial color="#2563EB" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover Ring */}
      {hovered && !isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 32]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Kiosk Pedestal Base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.44, 0.2, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#E0ECFF' : '#F1F5F9'}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Kiosk Main Upright Body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.36, 1.1, 0.26]} />
        <meshStandardMaterial
          color={isSelected ? '#FFFFFF' : '#F8FAFC'}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Sleek Dark Bezel on Front */}
      <mesh position={[0, 0.82, 0.132]}>
        <planeGeometry args={[0.28, 0.7]} />
        <meshBasicMaterial color="#0F172A" />
      </mesh>

      {/* Angled Touch Screen */}
      <mesh position={[0, 0.95, 0.136]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[0.24, 0.36]} />
        <meshBasicMaterial
          color={kiosk.currentJobId ? '#1E3A8A' : '#0369A1'}
        />
      </mesh>

      {/* Screen Interface Light Glow */}
      <mesh position={[0, 0.95, 0.138]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[0.2, 0.04]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Output Dispenser Slot */}
      <mesh position={[0, 0.4, 0.135]}>
        <boxGeometry args={[0.22, 0.05, 0.03]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      {/* Top Status Halo LED indicator */}
      <mesh position={[0, 1.34, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.05, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Point Light for Status Halo */}
      <pointLight position={[0, 1.4, 0]} color={statusColor} intensity={0.8} distance={1.5} />

      {/* Kiosk Identifier Tag on Base */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
        <group position={[0, 1.6, 0]}>
          {/* Label Background Pill */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.48, 0.2]} />
            <meshBasicMaterial
              color={isSelected ? '#2563EB' : '#0F172A'}
              transparent
              opacity={0.9}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.11}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {kiosk.id}
          </Text>
        </group>
      </Float>
    </group>
  );
}

// Zone Platform Mesh with Neon Perimeter
function ZonePlatform({
  name,
  label,
  color,
  position,
  size,
}: {
  name: string;
  label: string;
  color: string;
  position: [number, number, number];
  size: [number, number];
}) {
  return (
    <group position={position}>
      {/* Floor Platform */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.04, size[1]]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.1}
          metalness={0.05}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Neon Perimeter Outline */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
      </mesh>

      {/* Soft Glow perimeter plane */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] + 0.1, size[1] + 0.1]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>

      {/* Floating 3D Zone Label Banner */}
      <group position={[0, 2.3, -size[1] / 2 + 0.4]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[2.2, 0.36]} />
          <meshBasicMaterial color={color} transparent opacity={0.88} />
        </mesh>
        <Text
          position={[0, 0.06, 0.01]}
          fontSize={0.13}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {name}
        </Text>
        <Text
          position={[0, -0.07, 0.01]}
          fontSize={0.09}
          color="#F8FAFC"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </group>
    </group>
  );
}

// Futuristic Command Facility Environment (Center Operations Mezzanine, Glass Walls, Plants)
function OperationsCenterFacility() {
  return (
    <group>
      {/* Main Ground Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[18, 0.1, 14]} />
        <meshStandardMaterial
          color="#F8FAFC"
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle Grid Floor Overlay */}
      <gridHelper args={[18, 24, '#CBD5E1', '#E2E8F0']} position={[0, 0.005, 0]} />

      {/* Back Wall with Mezzanine & Command Monitors */}
      <group position={[0, 0, -4.5]}>
        {/* Rear Wall structure */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[16, 4, 0.3]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* Back Operations Command Desk */}
        <mesh position={[0, 0.5, 0.8]}>
          <boxGeometry args={[4.5, 0.8, 1.2]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.4} />
        </mesh>

        {/* Big Operations Central Screen */}
        <mesh position={[0, 2.2, 0.2]}>
          <boxGeometry args={[4.2, 1.8, 0.05]} />
          <meshStandardMaterial
            color="#1E3A8A"
            emissive="#1E40AF"
            emissiveIntensity={0.3}
            roughness={0.1}
          />
        </mesh>

        {/* Nightfall Nexus Glowing Logo on Screen */}
        <Text
          position={[0, 2.4, 0.26]}
          fontSize={0.26}
          color="#60A5FA"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          NIGHTFALL NEXUS
        </Text>
        <Text
          position={[0, 2.05, 0.26]}
          fontSize={0.12}
          color="#93C5FD"
          anchorX="center"
          anchorY="middle"
        >
          CENTRAL COMMAND • ACTIVE
        </Text>

        {/* Side Monitor 1 */}
        <mesh position={[-3.2, 1.8, 0.2]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[1.8, 1.2, 0.04]} />
          <meshBasicMaterial color="#0C4A6E" />
        </mesh>

        {/* Side Monitor 2 */}
        <mesh position={[3.2, 1.8, 0.2]} rotation={[0, -0.25, 0]}>
          <boxGeometry args={[1.8, 1.2, 0.04]} />
          <meshBasicMaterial color="#064E3B" />
        </mesh>
      </group>

      {/* Architectural Glass Railings & Planters */}
      <group position={[-2.8, 0.3, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.6, 1.8]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
        {/* Planter foliage */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#15803D" roughness={0.8} />
        </mesh>
      </group>

      <group position={[2.8, 0.3, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.6, 1.8]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#15803D" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// Camera Zoom and Frame Controller that keeps 3D camera synchronized with zoom buttons & gestures
function CameraZoomController({
  zoomLevel,
  controlsRef,
  onZoomChange,
}: {
  zoomLevel: number;
  controlsRef: React.RefObject<any>;
  onZoomChange: (z: number) => void;
}) {
  const { camera } = useThree();
  const baseDistance = 17.03; // sqrt(11^2 + 13^2)

  // Smooth camera zoom lerp toward target zoom distance when zoomLevel is changed via buttons
  useFrame(() => {
    if (!controlsRef.current) return;
    const target = controlsRef.current.target;
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    const currentDist = offset.length();
    const targetDist = Math.max(4.5, Math.min(28, baseDistance / zoomLevel));

    if (Math.abs(currentDist - targetDist) > 0.05) {
      offset.normalize().multiplyScalar(
        THREE.MathUtils.lerp(currentDist, targetDist, 0.15)
      );
      camera.position.copy(target).add(offset);
      controlsRef.current.update();
    }
  });

  // Track OrbitControls zoom (mouse wheel / trackpad / pinch) and update zoomLevel state
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    let timeoutId: any = null;
    const handleChange = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!controlsRef.current) return;
        const target = controlsRef.current.target;
        const dist = camera.position.distanceTo(target);
        if (dist > 0) {
          const rawZoom = baseDistance / dist;
          const quantized = Math.round(rawZoom * 20) / 20;
          if (Math.abs(quantized - zoomLevel) >= 0.08) {
            onZoomChange(Math.max(0.5, Math.min(2.5, quantized)));
          }
        }
      }, 100);
    };

    controls.addEventListener('change', handleChange);
    return () => {
      controls.removeEventListener('change', handleChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [camera, controlsRef, zoomLevel, onZoomChange]);

  return null;
}

export function Kiosk3DScene() {
  const {
    kiosks,
    selectedKiosk,
    setSelectedKiosk,
    selectedZone,
    selectedStatus,
    zoomLevel,
    setZoomLevel,
  } = useApp();

  // Filter kiosks according to dropdown selections
  const filteredKiosks = useMemo(() => {
    return kiosks.filter((k) => {
      const matchZone =
        selectedZone === 'All Zones' || k.zone === selectedZone;
      const matchStatus =
        selectedStatus === 'All Statuses' ||
        (selectedStatus === 'Online' && k.status !== 'Offline' && k.status !== 'Error') ||
        k.status === selectedStatus;
      return matchZone && matchStatus;
    });
  }, [kiosks, selectedZone, selectedStatus]);

  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleFit = () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.object.position.set(0, 11, 13);
        controlsRef.current.update();
      }
    };

    const handlePan = (e: any) => {
      if (controlsRef.current && e.detail) {
        const { dx, dz } = e.detail;
        controlsRef.current.target.x += dx;
        controlsRef.current.target.z += dz;
        controlsRef.current.update();
      }
    };

    window.addEventListener('nightfall:fit-view', handleFit);
    window.addEventListener('nightfall:pan-view', handlePan);
    return () => {
      window.removeEventListener('nightfall:fit-view', handleFit);
      window.removeEventListener('nightfall:pan-view', handlePan);
    };
  }, []);

  return (
    <div className="w-full h-full relative three-canvas-container select-none">
      <Canvas
        shadows
        camera={{ position: [0, 11, 13], fov: 38 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[8, 16, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-8, 12, -6]} intensity={0.5} />
        <pointLight position={[0, 4, 0]} intensity={0.6} color="#DBEAFE" />

        {/* Orbit Controls with interactive smooth zoom enabled */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          zoomSpeed={0.8}
          minDistance={4.5}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
        />

        {/* Active Camera Zoom Controller */}
        <CameraZoomController
          zoomLevel={zoomLevel}
          controlsRef={controlsRef}
          onZoomChange={setZoomLevel}
        />

        {/* Facility Architectural Structure */}
        <OperationsCenterFacility />

        {/* Zone Platforms */}
        <ZonePlatform
          name="Zone A"
          label="Front Lobby"
          color="#2563EB"
          position={[-4.2, 0, 0.4]}
          size={[3.8, 5.2]}
        />
        <ZonePlatform
          name="Zone B"
          label="Main Floor"
          color="#8B5CF6"
          position={[0.2, 0, 0.4]}
          size={[3.8, 5.2]}
        />
        <ZonePlatform
          name="Zone C"
          label="Production"
          color="#0D9488"
          position={[4.6, 0, 0.4]}
          size={[3.8, 5.2]}
        />

        {/* Interactive 3D Kiosks */}
        {filteredKiosks.map((kiosk) => (
          <KioskMesh
            key={kiosk.id}
            kiosk={kiosk}
            isSelected={selectedKiosk?.id === kiosk.id}
            onClick={() => setSelectedKiosk(kiosk)}
          />
        ))}
      </Canvas>
    </div>
  );
}

