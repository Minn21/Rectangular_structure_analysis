import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingParameters, AnalysisResults } from '../lib/types';

interface VisualizationProps {
  parameters: BuildingParameters;
  results: AnalysisResults | null;
}

export const Visualization = ({ parameters, results }: VisualizationProps) => {
  // Refs for Three.js objects
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number>(0);
  const originalStructureRef = useRef<THREE.Group | null>(null);
  const deformedStructureRef = useRef<THREE.Group | null>(null);
  const modalShapesRef = useRef<THREE.Group | null>(null);
  
  // State for visualization options
  const [viewMode, setViewMode] = useState<'default' | 'stress' | 'deflection'>('default');
  const [showDeformed, setShowDeformed] = useState(false);
  const [deformationScale, setDeformationScale] = useState(500);
  const [showGrid, setShowGrid] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [showModalShapes, setShowModalShapes] = useState(false);
  const [selectedMode, setSelectedMode] = useState(0);
  
  // Create original structure
  const createOriginalStructure = useCallback(() => {
    if (!sceneRef.current) return;
    
    // Remove existing structure
    if (originalStructureRef.current) {
      sceneRef.current.remove(originalStructureRef.current);
    }
    
    // Create new structure group
    const structureGroup = new THREE.Group();
    originalStructureRef.current = structureGroup;
    
    // Add structure to scene
    sceneRef.current.add(structureGroup);
    
    // Calculate dimensions
    const storyHeight = parameters.buildingHeight / parameters.numberOfStoreys;
    const spanLengthX = parameters.buildingLength / parameters.columnsAlongLength;
    const spanLengthZ = parameters.buildingWidth / parameters.columnsAlongWidth;
    
    // Create columns
    const columnGeometry = new THREE.BoxGeometry(
      parameters.columnWidth,
      storyHeight,
      parameters.columnDepth
    );
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6fa5 });
    
    // Create beams
    const beamGeometry = new THREE.BoxGeometry(
      spanLengthX,
      parameters.beamHeight,
      parameters.beamWidth
    );
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x6a8daf });
    
    // Create structure based on parameters
    for (let floor = 0; floor <= parameters.numberOfStoreys; floor++) {
      for (let row = 0; row <= parameters.columnsAlongWidth; row++) {
        for (let col = 0; col <= parameters.columnsAlongLength; col++) {
          // Add column
          if (floor < parameters.numberOfStoreys) {
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(
              col * spanLengthX,
              floor * storyHeight + storyHeight / 2,
              row * spanLengthZ
            );
            column.castShadow = true;
            column.receiveShadow = true;
            structureGroup.add(column);
          }
          
          // Add beams in X direction
          if (col < parameters.columnsAlongLength && floor > 0) {
            const beamX = new THREE.Mesh(beamGeometry, beamMaterial);
            beamX.position.set(
              col * spanLengthX + spanLengthX / 2,
              floor * storyHeight,
              row * spanLengthZ
            );
            beamX.castShadow = true;
            beamX.receiveShadow = true;
            structureGroup.add(beamX);
          }
          
          // Add beams in Z direction
          if (row < parameters.columnsAlongWidth && floor > 0) {
            const beamZ = new THREE.Mesh(beamGeometry, beamMaterial);
            beamZ.rotation.y = Math.PI / 2;
            beamZ.position.set(
              col * spanLengthX,
              floor * storyHeight,
              row * spanLengthZ + spanLengthZ / 2
            );
            beamZ.castShadow = true;
            beamZ.receiveShadow = true;
            structureGroup.add(beamZ);
          }
        }
      }
    }
    
    // Center structure
    structureGroup.position.set(
      -parameters.columnsAlongLength * spanLengthX / 2,
      0,
      -parameters.columnsAlongWidth * spanLengthZ / 2
    );
  }, [parameters]);
  
  // Handle component mount and unmount
  useEffect(() => {
    if (!mountRef.current) return;
    
    const mountElement = mountRef.current;
    
    // Create three.js objects
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.shadowMap.enabled = true;
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    mountElement.appendChild(renderer.domElement);
    
    const camera = new THREE.PerspectiveCamera(
      45,
      mountElement.clientWidth / mountElement.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.visible = showGrid;
    scene.add(gridHelper);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Animation loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!mountElement) return;
      
      camera.aspect = mountElement.clientWidth / mountElement.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create initial structure
    createOriginalStructure();
    
    // Clean up
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      
      if (renderer) {
        mountElement.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      controls.dispose();
    };
  }, [showGrid, createOriginalStructure]);
  
  // Create deformed structure
  const createDeformedStructure = useCallback(() => {
    if (!sceneRef.current || !results) return;
    
    // Remove existing deformed structure
    if (deformedStructureRef.current) {
      sceneRef.current.remove(deformedStructureRef.current);
    }
    
    // Create new deformed structure group
    const deformedGroup = new THREE.Group();
    deformedStructureRef.current = deformedGroup;
    
    // Add deformed structure to scene
    sceneRef.current.add(deformedGroup);
    
    // Calculate dimensions
    const spanLengthX = parameters.buildingLength / parameters.columnsAlongLength;
    const spanLengthZ = parameters.buildingWidth / parameters.columnsAlongWidth;
    
    // Create deformed structure based on results
    // This is a placeholder - actual implementation would use displacement results
    const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    for (let i = 0; i < results.displacements.length; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      const displacement = results.displacements[i];
      
      node.position.set(
        displacement.x * deformationScale,
        displacement.y * deformationScale,
        displacement.z * deformationScale
      );
      
      deformedGroup.add(node);
    }
    
    // Center deformed structure
    deformedGroup.position.set(
      -parameters.columnsAlongLength * spanLengthX / 2,
      0,
      -parameters.columnsAlongWidth * spanLengthZ / 2
    );
  }, [parameters, results, deformationScale]);
  
  // Reset deformed geometry
  const resetDeformedGeometry = useCallback(() => {
    if (!sceneRef.current || !deformedStructureRef.current) return;
    
    sceneRef.current.remove(deformedStructureRef.current);
    deformedStructureRef.current = null;
  }, []);
  
  // Create modal shapes visualization
  const createModalShapesVisualization = useCallback(() => {
    if (!sceneRef.current || !results || !results.modalShapes) return;
    
    // Remove existing modal shapes
    if (modalShapesRef.current) {
      sceneRef.current.remove(modalShapesRef.current);
    }
    
    // Create new modal shapes group
    const modalShapesGroup = new THREE.Group();
    modalShapesRef.current = modalShapesGroup;
    
    // Add modal shapes to scene
    sceneRef.current.add(modalShapesGroup);
    
    // Get selected mode
    const selectedModeShapes = results.modalShapes[selectedMode];
    if (!selectedModeShapes) return;
    
    // Create visualization for modal shape
    const nodeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    
    for (let i = 0; i < selectedModeShapes.displacements.length; i++) {
      const displacement = selectedModeShapes.displacements[i];
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      
      node.position.set(
        displacement.x * deformationScale,
        displacement.y * deformationScale,
        displacement.z * deformationScale
      );
      
      modalShapesGroup.add(node);
    }
  }, [results, selectedMode, deformationScale]);
  
  // Toggle modal shapes visualization
  const toggleModalShapes = useCallback(() => {
    setShowModalShapes(prev => !prev);
  }, []);
  
  // Animation loop
  const animate = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, []);
  
  // Create moment/shear diagrams
  const createMomentShearDiagrams = useCallback((type: 'moment' | 'shear') => {
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} diagram functionality not implemented yet`);
  }, []);
  
  // Update visualization based on parameters and options
  useEffect(() => {
    createOriginalStructure();
    
    if (showDeformed) {
      createDeformedStructure();
    } else {
      resetDeformedGeometry();
    }
    
    if (showModalShapes) {
      createModalShapesVisualization();
    }
    
    // Update grid visibility
    if (sceneRef.current) {
      const gridHelper = sceneRef.current.children.find(child => child instanceof THREE.GridHelper);
      if (gridHelper) {
        gridHelper.visible = showGrid;
      }
    }
    
    // Update shadows
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = showShadows;
      rendererRef.current.shadowMap.needsUpdate = true;
    }
  }, [
    parameters,
    showDeformed, 
    deformationScale, 
    showModalShapes,
    showGrid,
    showShadows,
    createOriginalStructure,
    createDeformedStructure,
    createModalShapesVisualization,
    resetDeformedGeometry
  ]);
  
  // Add mode selector UI
  const renderModeSelector = () => (
    <div className="absolute top-20 right-4 bg-white p-2 rounded-lg shadow-md">
      <label className="text-sm font-medium text-gray-700">Vibration Mode:</label>
      <select
        value={selectedMode}
        onChange={(e) => setSelectedMode(Number(e.target.value))}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        aria-label="Select vibration mode"
      >
        {[...Array(10)].map((_, i) => (
          <option key={i} value={i}>Mode {i + 1}</option>
        ))}
      </select>
    </div>
  );
  
  return (
    <div className="relative h-[500px] md:h-[600px] lg:h-[700px] rounded-xl overflow-hidden">
      {/* Visualization controls overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('default')}
              className={`btn btn-sm ${viewMode === 'default' ? 'btn-primary' : 'btn-secondary'}`}
              title="Default view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('stress')}
              className={`btn btn-sm ${viewMode === 'stress' ? 'btn-primary' : 'btn-secondary'}`}
              title="Stress visualization"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2H4a2 2 0 00-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('deflection')}
              className={`btn btn-sm ${viewMode === 'deflection' ? 'btn-primary' : 'btn-secondary'}`}
              title="Deflection visualization"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6v1a1 1 0 01-2 0V5a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM11 5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2z" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeformed(!showDeformed)}
              className={`btn btn-sm ${showDeformed ? 'btn-primary' : 'btn-secondary'}`}
              title={showDeformed ? "Show original shape" : "Show deformed shape"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`btn btn-sm ${showGrid ? 'btn-primary' : 'btn-secondary'}`}
              title={showGrid ? "Hide grid" : "Show grid"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2H4a2 2 0 00-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setShowShadows(!showShadows)}
              className={`btn btn-sm ${showShadows ? 'btn-primary' : 'btn-secondary'}`}
              title={showShadows ? "Hide shadows" : "Show shadows"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 2a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6v1a1 1 0 01-2 0V5a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 012-2h2a1 1 0 012 2v2a1 1 0 01-2 2h-2a1 1 0 01-2-2V5zM12 13a1 1 0 012-2h2a1 1 0 012 2v2a1 1 0 01-2 2h-2a1 1 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200 flex gap-2">
          <button
            onClick={toggleModalShapes}
            className={`btn btn-sm ${showModalShapes ? 'btn-primary' : 'btn-secondary'}`}
            title={showModalShapes ? "Hide modal shapes" : "Show modal shapes"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2H4a2 2 0 00-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => createMomentShearDiagrams('moment')}
            className="btn btn-sm btn-secondary"
            title="Show moment diagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </button>
          <button
            onClick={() => createMomentShearDiagrams('shear')}
            className="btn btn-sm btn-secondary"
            title="Show shear diagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend for stress/deflection visualization */}
      {viewMode !== 'default' && (
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-sm font-semibold mb-2">{viewMode === 'stress' ? 'Stress' : 'Deflection'} Legend</h4>
          <div className="flex items-center">
            <div className="w-full h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded"></div>
            <div className="flex justify-between w-full text-xs mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      )}

      {/* Deformation scale slider */}
      {showDeformed && (
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200">
          <label htmlFor="deformation-scale" className="block text-xs font-medium text-gray-700 mb-1">
            Deformation Scale: {deformationScale}x
          </label>
          <input
            id="deformation-scale"
            type="range"
            min="1"
            max="2000"
            step="50"
            value={deformationScale}
            onChange={(e) => setDeformationScale(parseInt(e.target.value))}
            className="range-slider w-full"
          />
        </div>
      )}
      
      {/* Mode selector */}
      {renderModeSelector()}
      
      {/* Visualization canvas */}
      <div ref={mountRef} className="w-full h-full bg-gradient-to-b from-blue-50 to-gray-50" />
    </div>
  );
};
