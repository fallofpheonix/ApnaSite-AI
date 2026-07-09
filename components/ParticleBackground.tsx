"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const count = 20000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mock control values to satisfy the prompt's request for addControl
    const controls = {
      scale: 50,
      chaos: 1,
    };

    const addControl = (id: string, label: string, min: number, max: number, initialValue: number) => {
      if (controls[id as keyof typeof controls] === undefined) {
        // @ts-ignore
        controls[id] = initialValue;
      }
      return controls[id as keyof typeof controls];
    };

    const setInfo = (title: string, desc: string) => {
      // Stub
    };

    const target = new THREE.Vector3();
    const color = new THREE.Color();

    let animationId: number;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;
      
      const posAttr = particles.geometry.attributes.position;
      const colAttr = particles.geometry.attributes.color;

      for (let i = 0; i < count; i++) {
        // --- START USER FUNCTION BODY ---
        const scale = addControl("scale", "Expansion", 10, 100, 50);
        const chaos = addControl("chaos", "Chaos", 0, 2, 1);
        
        // 4D Tesseract projection math simplified for 3D
        const theta = (i / count) * Math.PI * 2 * 100;
        const phi = Math.acos(-1 + (2 * i) / count);
        
        // "Breathing" scale effect
        const breath = Math.sin(time * 2) * 0.2 + 1;
        const s = scale * breath;
        
        // Hyper-dimensional rotation approximations
        const x = s * Math.cos(theta) * Math.sin(phi);
        const y = s * Math.sin(theta) * Math.sin(phi);
        const z = s * Math.cos(phi);
        
        // Adding a 4D twist/folding over time
        const twist = time + i * 0.001 * chaos;
        const x4 = x * Math.cos(twist) - z * Math.sin(twist);
        const z4 = x * Math.sin(twist) + z * Math.cos(twist);
        
        target.set(x4, y, z4);
        
        // Color shifts smoothly over time and space
        color.setHSL((i / count + time * 0.1) % 1.0, 1.0, 0.6);
        
        if (i === 0) setInfo("4D Tesseract", "A hyper-dimensional tesseract breathing in 4D space.");
        // --- END USER FUNCTION BODY ---

        posAttr.setXYZ(i, target.x, target.y, target.z);
        colAttr.setXYZ(i, color.r, color.g, color.b);
      }
      
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Slow overall rotation
      particles.rotation.y += 0.005;
      particles.rotation.x += 0.002;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" 
      style={{ overflow: 'hidden' }}
    />
  );
}
