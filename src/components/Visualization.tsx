'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingParameters, CalculationResults } from '../lib/types';

interface VisualizationProps {
  parameters: BuildingParameters;
  results: CalculationResults | null;
}

const Visualization: React.FC<VisualizationProps> = ({ parameters, results }) => {
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
  
  // Calculate derived values using useMemo to avoid recalculation on each render
  const dimensions = useMemo(() => {
    const storyHeight = parameters.buildingHeight / parameters.numberOfStoreys;
    const spanLengthX = parameters.buildingLength / parameters.columnsAlongLength;
    const spanLengthZ = parameters.buildingWidth / parameters.columnsAlongWidth;
    return { storyHeight, spanLengthX, spanLengthZ };
  }, [parameters]);
  
  const { storyHeight, spanLengthX, spanLengthZ } = dimensions;
  
  // Animation function
  const animate = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  // Resize handler
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const mountElement = mountRef.current;
    cameraRef.current.aspect = mountElement.clientWidth / mountElement.clientHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(mountElement.clientWidth, mountElement.clientHeight);
  }, []);
  
  // Add lights to the scene
  const addLightsToScene = useCallback(() => {
    if (!sceneRef.current) return;
    
    // Clear existing lights
    sceneRef.current.children = sceneRef.current.children.filter(
      child => !(child instanceof THREE.Light)
    );
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 75, 50);
    directionalLight.castShadow = true;
    
    // Optimize shadow settings
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    sceneRef.current.add(directionalLight);
  }, []);
  
  // Add grid to the scene
  const addGridToScene = useCallback(() => {
    if (!sceneRef.current) return;
    
    // Remove existing grid
    sceneRef.current.children = sceneRef.current.children.filter(
      child => !(child instanceof THREE.GridHelper)
    );
    
    if (showGrid) {
      // Add grid
      const gridHelper = new THREE.GridHelper(100, 100);
      gridHelper.position.y = -0.01; // Slightly below the scene to avoid z-fighting
      sceneRef.current.add(gridHelper);
    }
  }, [showGrid]);
  
  // Initialize the 3D scene, camera, renderer, and controls
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return;
    
    // Create scene if it doesn't exist
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      sceneRef.current.background = new THREE.Color(0xf0f0f0);
    }
    
    // Create camera if it doesn't exist
    if (!cameraRef.current) {
      const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      cameraRef.current.position.set(20, 15, 20);
    }
    
    // Create renderer if it doesn't exist
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      rendererRef.current.shadowMap.enabled = true;
      rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(rendererRef.current.domElement);
    }
    
    // Create orbit controls if they don't exist
    if (!controlsRef.current) {
      controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.25;
    }
    
    // Add lights to the scene
    addLightsToScene();
    
    // Add grid to the scene
    addGridToScene();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Properly dispose of Three.js objects
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      // Remove renderer from DOM safely
      if (rendererRef.current) {
        try {
          // Only try to remove if mountRef exists and contains the renderer's domElement
          if (mountRef.current && rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
        } catch (error) {
          console.error('Error removing renderer from DOM:', error);
        }
        // Always dispose of the renderer
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clear scene
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0) { 
          const object = sceneRef.current.children[0];
          sceneRef.current.remove(object);
        }
        sceneRef.current = null;
      }
      
      // Clear camera
      cameraRef.current = null;
    };
  }, [animate, handleResize, addLightsToScene, addGridToScene]);
  
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
    sceneRef.current.add(structureGroup);
    
    // Create geometries and materials - reuse for better performance
    const columnGeometry = new THREE.BoxGeometry(
      parameters.columnWidth,
      storyHeight,
      parameters.columnDepth
    );
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a6fa5,
      metalness: 0.2,
      roughness: 0.8
    });
    
    const beamGeometry = new THREE.BoxGeometry(
      spanLengthX,
      parameters.beamHeight,
      parameters.beamWidth
    );
    const beamMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6a8daf,
      metalness: 0.2,
      roughness: 0.7
    });
    
    // Build structure - loops through floors, rows, and columns
    for (let floor = 0; floor <= parameters.numberOfStoreys; floor++) {
      const floorY = floor * storyHeight;
      
      for (let row = 0; row <= parameters.columnsAlongWidth; row++) {
        const rowZ = row * spanLengthZ;
        
        for (let col = 0; col <= parameters.columnsAlongLength; col++) {
          const colX = col * spanLengthX;
          
          // Add columns (vertical elements)
          if (floor < parameters.numberOfStoreys) {
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(
              colX,
              floorY + storyHeight / 2, // Center column vertically within story
              rowZ
            );
            column.castShadow = true;
            column.receiveShadow = true;
            structureGroup.add(column);
          }
          
          // Add beams in X direction (horizontal elements along X)
          if (col < parameters.columnsAlongLength && floor > 0) {
            const beamX = new THREE.Mesh(beamGeometry, beamMaterial);
            beamX.position.set(
              colX + spanLengthX / 2, // Center beam horizontally
              floorY,
              rowZ
            );
            beamX.castShadow = true;
            beamX.receiveShadow = true;
            structureGroup.add(beamX);
          }
          
          // Add beams in Z direction (horizontal elements along Z)
          if (row < parameters.columnsAlongWidth && floor > 0) {
            const beamZ = new THREE.Mesh(beamGeometry, beamMaterial);
            beamZ.rotation.y = Math.PI / 2; // Rotate beam to align with Z axis
            beamZ.position.set(
              colX,
              floorY,
              rowZ + spanLengthZ / 2 // Center beam horizontally
            );
            beamZ.castShadow = true;
            beamZ.receiveShadow = true;
            structureGroup.add(beamZ);
          }
        }
      }
    }
    
    // Center structure in scene
    structureGroup.position.set(
      -parameters.columnsAlongLength * spanLengthX / 2,
      0,
      -parameters.columnsAlongWidth * spanLengthZ / 2
    );
  }, [parameters, storyHeight, spanLengthX, spanLengthZ]);
  
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
    sceneRef.current.add(deformedGroup);
    
    // Create deformed structure based on results
    // This is a placeholder since CalculationResults doesn't have displacements
    const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    // Use maximum displacement as a proxy for visualization
    if (results.maximumDisplacement) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      
      // Apply a simple displacement to demonstrate deformation
      node.position.set(
        results.maximumDisplacement * deformationScale * 0.5,
        results.maximumDisplacement * deformationScale,
        results.maximumDisplacement * deformationScale * 0.5
      );
      
      deformedGroup.add(node);
    }
    
    // Center deformed structure
    deformedGroup.position.set(
      -parameters.columnsAlongLength * spanLengthX / 2,
      0,
      -parameters.columnsAlongWidth * spanLengthZ / 2
    );
  }, [parameters, results, deformationScale, spanLengthX, spanLengthZ]);
  
  // Reset deformed geometry
  const resetDeformedGeometry = useCallback(() => {
    if (!sceneRef.current || !deformedStructureRef.current) return;
    
    sceneRef.current.remove(deformedStructureRef.current);
    deformedStructureRef.current = null;
  }, []);
  
  // Create modal shapes visualization
  const createModalShapesVisualization = useCallback(() => {
    if (!sceneRef.current || !results || !results.dynamicAnalysis) return;
    
    // Remove existing modal shapes
    if (modalShapesRef.current) {
      sceneRef.current.remove(modalShapesRef.current);
    }
    
    // Create new modal shapes group
    const modalGroup = new THREE.Group();
    modalShapesRef.current = modalGroup;
    
    // Add modal shapes to scene
    sceneRef.current.add(modalGroup);
    
    // Logic for modal shapes visualization would go here
    console.log('Creating modal shape visualization for mode', selectedMode);
    
    // Add a simple visual indicator for the mode
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
    modalGroup.add(sphere);
  }, [results, selectedMode]);
  
  // Toggle modal shapes visualization
  const toggleModalShapes = useCallback(() => {
    setShowModalShapes(prev => !prev);
  }, []);
  
  // Create moment/shear diagrams
  const createMomentShearDiagrams = useCallback((type: 'moment' | 'shear') => {
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} diagram functionality not implemented yet`);
  }, []);
  
  // Update visualization based on parameters and options
  useEffect(() => {
    // Create or update the original structure
    createOriginalStructure();
    
    // Handle deformed visualization
    if (showDeformed && results) {
      createDeformedStructure();
    } else {
      resetDeformedGeometry();
    }
    
    // Handle modal shapes visualization
    if (showModalShapes && results?.dynamicAnalysis) {
      createModalShapesVisualization();
    } else if (modalShapesRef.current && sceneRef.current) {
      sceneRef.current.remove(modalShapesRef.current);
      modalShapesRef.current = null;
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
    // Structural parameters
    parameters,
    // Visualization controls
    showDeformed,
    showModalShapes,
    showGrid,
    showShadows,
    deformationScale,
    // Results data
    results,
    // Functions
    createOriginalStructure,
    createDeformedStructure,
    createModalShapesVisualization,
    resetDeformedGeometry
  ]);
  
  // Initialize 3D scene in useEffect
  useEffect(() => {
    const cleanup = initializeScene();
    return () => {
      // Ensure cleanup function is called
      if (cleanup) {
        cleanup();
      }
    };
  }, [initializeScene]);
  
  // Control Button component for consistent styling
  const ControlButton = ({ 
    onClick, 
    isActive, 
    title, 
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    title: string; 
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
      title={title}
    >
      {children}
    </button>
  );

  // Deformation Scale Slider component
  const DeformationScaleSlider = () => (
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
  );

  // Legend component for stress/deflection visualization
  const VisualizationLegend = () => (
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
  );
  
  // Add mode selector UI
  const renderModeSelector = () => (
    <div className="absolute top-20 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200">
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
            <ControlButton
              onClick={() => setViewMode('default')}
              isActive={viewMode === 'default'}
              title="Default view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </ControlButton>
            <ControlButton
              onClick={() => setViewMode('stress')}
              isActive={viewMode === 'stress'}
              title="Stress visualization"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2H4a2 2 0 00-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
            </ControlButton>
            <ControlButton
              onClick={() => setViewMode('deflection')}
              isActive={viewMode === 'deflection'}
              title="Deflection visualization"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6v1a1 1 0 01-2 0V5a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM11 5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM12 13a1 1 0 012-2h2a1 1 0 012 2v2a1 1 0 01-2 2h-2a1 1 0 01-2-2v-2z" />
              </svg>
            </ControlButton>
          </div>
          <div className="flex gap-2">
            <ControlButton
              onClick={() => setShowDeformed(!showDeformed)}
              isActive={showDeformed}
              title={showDeformed ? "Show original shape" : "Show deformed shape"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </ControlButton>
            <ControlButton
              onClick={() => setShowGrid(!showGrid)}
              isActive={showGrid}
              title={showGrid ? "Hide grid" : "Show grid"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2H4a2 2 0 00-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
            </ControlButton>
            <ControlButton
              onClick={() => setShowShadows(!showShadows)}
              isActive={showShadows}
              title={showShadows ? "Hide shadows" : "Show shadows"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 2a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6v1a1 1 0 01-2 0V5a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 012-2h2a1 1 0 012 2v2a1 1 0 01-2 2h-2a1 1 0 01-2-2V5zM12 13a1 1 0 012-2h2a1 1 0 012 2v2a1 1 0 01-2 2h-2a1 1 0 01-2-2v-2z" />
              </svg>
            </ControlButton>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200 flex gap-2">
          <ControlButton
            onClick={toggleModalShapes}
            isActive={showModalShapes}
            title={showModalShapes ? "Hide modal shapes" : "Show modal shapes"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2H4a2 2 0 00-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
            </svg>
          </ControlButton>
          <ControlButton
            onClick={() => createMomentShearDiagrams('moment')}
            title="Show moment diagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 012-2h2a1 1 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </ControlButton>
          <ControlButton
            onClick={() => createMomentShearDiagrams('shear')}
            title="Show shear diagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 012-2h2a1 1 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </ControlButton>
        </div>
      </div>

      {/* Legend for stress/deflection visualization */}
      {viewMode !== 'default' && (
        <VisualizationLegend />
      )}

      {/* Deformation scale slider */}
      {showDeformed && (
        <DeformationScaleSlider />
      )}
      
      {/* Mode selector only shown when modal shapes are visible */}
      {showModalShapes && results?.dynamicAnalysis && (
        renderModeSelector()
      )}
      
      {/* Visualization canvas */}
      <div ref={mountRef} className="w-full h-full bg-gradient-to-b from-blue-50 to-gray-50" />
    </div>
  );
};

export default Visualization;
export { Visualization };
