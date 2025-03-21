'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
// Import from our local module which handles the compatibility issues
import { OrbitControls } from '../lib/orbitControls';
import { BuildingParameters, CalculationResults } from '../lib/types';
import { OrbitControls as OrbitControlsType } from '../lib/orbitalTypes';
import { getMaterial } from '../lib/materials';

interface VisualizationProps {
  parameters: BuildingParameters;
  results: CalculationResults;
}

export const Visualization: React.FC<VisualizationProps> = ({ parameters, results }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const requestRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  
  const [showDeformed, setShowDeformed] = useState(false);
  const [deformationScale, setDeformationScale] = useState(500);
  
  // Original geometry storage for switching between deformed/undeformed
  const originalGeometryRef = useRef<{
    columns: THREE.Mesh[];
    beamsX: THREE.Mesh[];
    beamsZ: THREE.Mesh[];
    slabs: THREE.Mesh[];
  }>({
    columns: [],
    beamsX: [],
    beamsZ: [],
    slabs: []
  });

  // Handle resize to make the visualization responsive
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    // Update camera
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    // Update renderer
    rendererRef.current.setSize(width, height);
  }, []);

  // Initialize Three.js scene
  const initScene = () => {
    if (!mountRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0xf0f4f8);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    rendererRef.current = renderer;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    sceneRef.current.add(ambientLight);
    sceneRef.current.add(directionalLight);
    lightsRef.current = [ambientLight, directionalLight];

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20);
    sceneRef.current.add(gridHelper);
    gridRef.current = gridHelper;

    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);
    
    // Initial resize
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    return { camera, renderer, controls };
  };

  // Build geometry based on parameters
  const buildGeometry = () => {
    const scene = sceneRef.current;
    
    // Clear previous geometry but keep lights and grid
    scene.children.forEach(child => {
      if (
        child instanceof THREE.Light || 
        child instanceof THREE.GridHelper ||
        lightsRef.current.includes(child as THREE.Light) ||
        child === gridRef.current
      ) {
        return;
      }
      
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      scene.remove(child);
    });

    // Reset storage for original geometry
    originalGeometryRef.current = {
      columns: [],
      beamsX: [],
      beamsZ: [],
      slabs: []
    };

    const {
      buildingLength: L,
      buildingWidth: W,
      buildingHeight: H,
      numberOfStoreys: Ns,
      columnsAlongLength: M,
      columnsAlongWidth: N,
      beamsAlongLength: Bx,
      beamsAlongWidth: Bz,
      slabThickness,
      beamWidth: b,
      beamHeight: h,
      columnWidth: cw,
      columnDepth: cd,
      materialName = 'steel',
    } = parameters;

    // Get material colors
    const material = getMaterial(materialName);
    const materialColor = new THREE.Color(material.color);
    const slabColor = new THREE.Color(0xcccccc);
    
    // Columns
    const dx = L / (M - 1);
    const dz = W / (N - 1);
    const columnGeometry = new THREE.BoxGeometry(cw, H * Ns, cd);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: materialColor });
    
    // Create columns based on input parameters
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(i * dx, (H * Ns) / 2, j * dz);
        scene.add(column);
        originalGeometryRef.current.columns.push(column);
      }
    }

    // Beams along X-direction
    const beamXLength = L / Bx;
    const beamXGeometry = new THREE.BoxGeometry(beamXLength, h, b);
    const beamXMaterial = new THREE.MeshStandardMaterial({ color: materialColor.clone().multiplyScalar(0.8) });
    
    for (let k = 0; k < Ns; k++) {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < Bx; i++) {
          const beam = new THREE.Mesh(beamXGeometry, beamXMaterial);
          beam.position.set(
            i * beamXLength + beamXLength/2,
            k * H + H - h/2,
            j * dz
          );
          scene.add(beam);
          originalGeometryRef.current.beamsX.push(beam);
        }
      }
    }

    // Beams along Z-direction
    const beamZLength = W / Bz;
    const beamZGeometry = new THREE.BoxGeometry(b, h, beamZLength);
    const beamZMaterial = new THREE.MeshStandardMaterial({ color: materialColor.clone().multiplyScalar(0.8) });
    
    for (let k = 0; k < Ns; k++) {
      for (let i = 0; i < M; i++) {
        for (let j = 0; j < Bz; j++) {
          const beam = new THREE.Mesh(beamZGeometry, beamZMaterial);
          beam.position.set(
            i * dx,
            k * H + H - h/2,
            j * beamZLength + beamZLength/2
          );
          scene.add(beam);
          originalGeometryRef.current.beamsZ.push(beam);
        }
      }
    }

    // Slabs
    const slabGeometry = new THREE.BoxGeometry(L, slabThickness, W);
    const slabMaterial = new THREE.MeshStandardMaterial({ color: slabColor });
    
    for (let k = 0; k <= Ns; k++) {
      const slab = new THREE.Mesh(slabGeometry, slabMaterial);
      slab.position.set(L/2, k * H, W/2);
      scene.add(slab);
      originalGeometryRef.current.slabs.push(slab);
    }
  };

  // Create exaggerated deformed geometry based on analysis results
  const showDeformedGeometry = (scale: number) => {
    if (!originalGeometryRef.current.beamsX.length || !results) return;
    
    // Apply beam deformations
    const { beamsX, beamsZ } = originalGeometryRef.current;
    const { beamResults } = results;
    
    let beamIndex = 0;
    
    // Apply deformation to X beams
    beamsX.forEach((beam) => {
      if (beamIndex < beamResults.length) {
        const deformation = beamResults[beamIndex].maxDeflection * scale;
        const position = beam.position.clone();
        position.y -= deformation;
        beam.position.copy(position);
        beamIndex++;
      }
    });
    
    // Apply deformation to Z beams
    beamsZ.forEach((beam) => {
      if (beamIndex < beamResults.length) {
        const deformation = beamResults[beamIndex].maxDeflection * scale;
        const position = beam.position.clone();
        position.y -= deformation;
        beam.position.copy(position);
        beamIndex++;
      }
    });
    
    // Apply deformed shape to slabs based on average of connecting beams
    const { slabs } = originalGeometryRef.current;
    slabs.forEach((slab, index) => {
      if (index > 0) { // Ground slab doesn't deform
        // Apply a simplified deformation to slabs (average of beam deformations)
        const avgDeformation = Math.min(results.maxBeamDeflection * scale, 1);
        const position = slab.position.clone();
        position.y -= avgDeformation;
        slab.position.copy(position);
      }
    });
  };
  
  // Handle toggling between original and deformed shapes
  const toggleDeformation = () => {
    if (showDeformed) {
      buildGeometry(); // Rebuild to reset the geometry to original state
    } else {
      buildGeometry(); // Rebuild to ensure clean state
      showDeformedGeometry(deformationScale);
    }
    setShowDeformed(!showDeformed);
  };

  // Handle deformation scale change
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseInt(e.target.value);
    setDeformationScale(newScale);
    
    if (showDeformed) {
      buildGeometry(); // Reset to original state
      showDeformedGeometry(newScale);
    }
  };

  // Animation loop
  const animate = () => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // Initialize scene
    const { camera, renderer, controls } = initScene() || {};
    if (!camera || !renderer || !controls) return;
    
    // Build geometry after initialization
    buildGeometry();
    
    // Start animation loop
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [handleResize]);

  useEffect(() => {
    buildGeometry();
    if (showDeformed) {
      showDeformedGeometry(deformationScale);
    }
  }, [parameters, results]);

  return (
    <div className="flex flex-col">
      <div className="section-title">
        <h2>3D Model</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleDeformation}
            className={`btn-sm ${showDeformed ? 'btn-primary' : 'btn-secondary'}`}
            title="Toggle deformed shape visualization"
          >
            {showDeformed ? 'Show Original' : 'Show Deformed'}
          </button>
        </div>
      </div>
      
      {showDeformed && (
        <div className="mb-3 px-2">
          <label htmlFor="deformationScale" className="form-label mb-1">
            Deformation Scale: {deformationScale}x
          </label>
          <input
            id="deformationScale"
            type="range"
            min="10"
            max="1000"
            step="10"
            value={deformationScale}
            onChange={handleScaleChange}
            className="range-slider"
          />
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-gray-100 rounded-lg overflow-hidden"
      >
        {/* Canvas will be appended here */}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Tip: <span className="font-medium">Click and drag</span> to rotate, <span className="font-medium">scroll</span> to zoom, <span className="font-medium">right-click</span> to pan</p>
      </div>
    </div>
  );
};