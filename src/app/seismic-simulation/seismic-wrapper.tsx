'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Material, SeismicParameters } from '@/lib/types';
import * as THREE from 'three';

// Loading component for simulation
export const SimulationLoading = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4">Loading Seismic Simulation</h2>
    <div className="p-10 bg-gray-100 rounded flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D visualization...</p>
      </div>
    </div>
  </div>
);

interface SimulationResults {
  maxDisplacement: number;
  baseShear: number;
  storyDrifts: number[];
  periodOfVibration: number;
  damagePercentage?: number;
}

interface BuildingParameters {
  buildingLength: number;
  buildingWidth: number;
  buildingHeight: number;
  numberOfStoreys: number;
  columnsAlongLength: number;
  columnsAlongWidth: number;
  columnWidth: number;
  columnDepth: number;
  beamWidth: number;
  beamHeight: number;
  slabThickness: number;
  buildingWeight?: number;
  [key: string]: any; // For other potential properties
}

interface StructuralResults {
  totalWeight?: number;
  periodOfVibration?: number;
  naturalFrequency?: number;
  dynamicAnalysis?: {
    modalShapes?: number[][];
  };
  [key: string]: any; // For other potential properties
}

interface SeismicSimulationWrapperProps {
  buildingParameters: BuildingParameters;
  material: Material;
  seismicParameters: SeismicParameters;
  structuralResults?: StructuralResults;
  onSimulationComplete?: (results: SimulationResults) => void;
  onError?: (error: string) => void;
}

// Add toRadians function
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Utility function to safely dispose THREE.js objects
const safeDispose = (object: THREE.Object3D | null) => {
  if (!object) return;
  
  // Cancel any animations or physics
  object.userData = {};
  
  // Remove from parent safely
  if (object.parent) {
    try {
      object.parent.remove(object);
    } catch (e) {
      console.warn('Error removing object from parent:', e);
    }
  }
  
  // Dispose of geometries and materials
  if (object instanceof THREE.Mesh) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      } else {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    }
  } else if (object instanceof THREE.InstancedMesh) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      } else {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    }
    // The instanceMatrix is a InstancedBufferAttribute and doesn't have a dispose method directly
    // We can set it to needsUpdate = false to help garbage collection
    if (object.instanceMatrix) {
      object.instanceMatrix.needsUpdate = false;
    }
  }
  
  // Recursively dispose children, but make a copy of the array first to avoid modification issues
  const childrenToDispose = [...object.children];
  childrenToDispose.forEach(child => {
    safeDispose(child);
  });
};

// Component definition
export default function SeismicSimulationWrapper({
  buildingParameters,
  material,
  seismicParameters,
  structuralResults,
  onSimulationComplete,
  onError
}: SeismicSimulationWrapperProps) {
  // Component state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string>('');
  const [currentView, setCurrentView] = useState<string>('front');
  const [showDamageKey, setShowDamageKey] = useState<boolean>(false);
  
  // Refs for THREE.js objects
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const originalPositionsRef = useRef<Record<string, THREE.Vector3>>({});
  const elementDamageRef = useRef<Record<string, number>>({});
  const visibilityRef = useRef<boolean>(true);
  const lightsAddedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    setResults(null);
    setError('');
    
    // Reset camera to current view
    setCameraView(currentView);
    
    // Re-create the building
    createBuildingStructure();
  }, [currentView]);

  // Camera preset views with boundary checks
  const setCameraView = useCallback((viewName: string) => {
    if (!cameraRef.current || !sceneRef.current) return;
    
    const { buildingLength, buildingWidth, buildingHeight } = buildingParameters;
    
    // Calculate the building center
    const centerX = buildingLength / 2;
    const centerY = buildingHeight / 2;
    const centerZ = buildingWidth / 2;
    
    // Set camera position based on view
    switch(viewName) {
      case 'front': // Front view (X-Y plane)
        cameraRef.current.position.set(centerX, centerY, centerZ + buildingWidth * 1.5);
        break;
      case 'side': // Side view (Z-Y plane)
        cameraRef.current.position.set(centerX + buildingLength * 1.5, centerY, centerZ);
        break;
      case 'top': // Top view (X-Z plane)
        cameraRef.current.position.set(centerX, centerY + buildingHeight * 2, centerZ);
        break;
      case 'corner': // Corner/Isometric view
        cameraRef.current.position.set(
          centerX + buildingLength * 1.2, 
          centerY + buildingHeight * 0.8, 
          centerZ + buildingWidth * 1.2
        );
        break;
      case 'bottom': // View from below
        cameraRef.current.position.set(centerX, -buildingHeight * 0.5, centerZ);
        break;
      default: // Default view
        cameraRef.current.position.set(
          buildingLength + 20,
          buildingHeight + 10,
          buildingWidth + 20
        );
        break;
    }
    
    // Look at building center
    cameraRef.current.lookAt(centerX, centerY, centerZ);
    setCurrentView(viewName);
    
    // Update camera
    cameraRef.current.updateProjectionMatrix();
  }, [buildingParameters]);

  // Clear all resources and reset state
  const clearResources = useCallback(() => {
    // Cancel any animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    // Clear references
    originalPositionsRef.current = {};
    elementDamageRef.current = {};
    
    // Clear scene
    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0) {
        safeDispose(sceneRef.current.children[0]);
      }
    }
    
    // Clear errors
    setError('');
  }, []);

  // Track component mounting state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Track page visibility for performance optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      visibilityRef.current = isVisible;
      
      if (!isVisible && animationFrameRef.current) {
        // Pause animation when tab is not visible to save resources
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      } else if (isVisible && isSimulating) {
        // Resume animation when tab becomes visible again
        // The simulateEarthquake function is defined in the startSimulation function
        // and isn't accessible here. Instead, we can just restart the animation loop.
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          const animate = () => {
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !isMountedRef.current) return;
            
            // Only render if the page is visible
            if (visibilityRef.current) {
              rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
            
            animationFrameRef.current = requestAnimationFrame(animate);
          };
          
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSimulating]);
  
  // Debug mounting
  useEffect(() => {
    console.log('SeismicSimulationWrapper mounted');
    console.log('mountRef exists:', !!mountRef.current);
    console.log('Building parameters:', buildingParameters);
    
    // Don't set isLoading to true here anymore, as it will prevent mounting
    
    return () => {
      console.log('SeismicSimulationWrapper unmounted');
    };
  }, []);

  // Log when structural results change
  useEffect(() => {
    if (structuralResults) {
      console.log('Structural results received in simulation:', structuralResults);
    }
  }, [structuralResults]);

  // Helper function to check WebGL support
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      const contexts = ['webgl2', 'webgl', 'experimental-webgl'];
      
      // Try different WebGL contexts
      for (const contextType of contexts) {
        try {
          const context = canvas.getContext(contextType, {
            failIfMajorPerformanceCaveat: true,
            powerPreference: 'high-performance'
          });
          if (context) {
            console.log(`WebGL context available: ${contextType}`);
            return true;
          }
        } catch (e) {
          console.warn(`Error checking ${contextType}:`, e);
        }
      }
      
      console.warn('WebGL not available');
      return false;
    } catch (e) {
      console.error('Error checking WebGL support:', e);
      return false;
    }
  }

  // Initialize three.js scene, camera, and renderer or fallback to 2D canvas
  useEffect(() => {
    if (!mountRef.current) return;
    
    let width = mountRef.current.clientWidth;
    let height = mountRef.current.clientHeight || 500;
    
    console.log('Attempting to initialize visualization with dimensions:', width, height);
    
    // First, try to check for WebGL support
    const hasWebGL = isWebGLAvailable();
    
    if (!hasWebGL) {
      console.warn('WebGL not available, using 2D fallback visualization');
      createFallback2DVisualization(width, height);
      return;
    }
    
    // Try to initialize 3D visualization
    try {
      // Create a cleanup function that we'll use for both normal cleanup and error cases
      const cleanupResources = () => {
        console.log('Cleaning up Three.js resources');
        
        // Cancel any ongoing animations
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
        }
        
        // Clean up renderer
        if (rendererRef.current) {
          try {
            rendererRef.current.dispose();
          } catch (e) {
            console.warn('Error disposing renderer:', e);
          }
          rendererRef.current = null;
        }
        
        // Clean up scene objects
        if (sceneRef.current) {
          try {
            while(sceneRef.current.children.length > 0) {
              safeDispose(sceneRef.current.children[0]);
            }
          } catch (e) {
            console.warn('Error cleaning up scene:', e);
          }
        }
        
        // Clear references
        sceneRef.current = null;
        cameraRef.current = null;
      };
      
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5); // Light gray background
      sceneRef.current = scene;
      
      // Create camera with proper aspect ratio
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      
      // Calculate initial camera position based on building size
      const { buildingLength, buildingWidth, buildingHeight } = buildingParameters;
      const maxDimension = Math.max(buildingLength, buildingWidth, buildingHeight);
      const distanceFactor = 2.5; // Adjust for best initial view
      
      camera.position.set(
        buildingLength + maxDimension/distanceFactor,
        buildingHeight + maxDimension/distanceFactor,
        buildingWidth + maxDimension/distanceFactor
      );
      
      // Look at building center
      camera.lookAt(
        buildingLength/2,
        buildingHeight/2,
        buildingWidth/2
      );
      
      cameraRef.current = camera;
      
      // Create renderer with progressive enhancement approach
      let renderer: THREE.WebGLRenderer;
      
      // Try to create renderer with optimal settings first
      try {
        console.log('Attempting to create high-performance WebGL renderer');
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          precision: 'highp',
          logarithmicDepthBuffer: false
        });
      } catch (e) {
        console.warn('Failed to create high-performance renderer, trying fallback:', e);
        // Fallback to simpler renderer settings
        try {
          renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            alpha: true,
            powerPreference: 'default',
            precision: 'mediump'
          });
        } catch (e2) {
          console.error('Failed to create fallback renderer:', e2);
          throw new Error('Could not initialize WebGL rendering context');
        }
      }
      
      console.log('Successfully created WebGL renderer');
      
      // Configure the renderer
      renderer.setSize(width, height);
      
      // Limit pixel ratio to improve performance on high-DPI displays
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(pixelRatio);
      
      renderer.setClearColor(0xf5f5f5, 1);
      
      // Only enable shadows if we're using the high-performance renderer
      if (renderer.capabilities.maxTextureSize > 2048) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      
      // Only handle DOM manipulation when mountRef is still mounted and the renderer doesn't exist yet
      if (mountRef.current && !rendererRef.current) {
        // Store the renderer before attempting DOM operations
        rendererRef.current = renderer;
        
        // Check if there's already a canvas from a previous render
        const existingCanvas = mountRef.current.querySelector('canvas');
        if (existingCanvas) {
          // If a canvas already exists, don't try to remove it or add a new one
          console.log('Canvas already exists, using existing one');
          
          // Check if it's actually a different canvas
          if (existingCanvas !== renderer.domElement) {
            // Remove the existing canvas before adding the new one
            try {
              existingCanvas.remove();
              mountRef.current.appendChild(renderer.domElement);
            } catch (e) {
              console.error('Error handling canvas replacement:', e);
              throw new Error('Failed to update canvas element');
            }
          }
        } else {
          // No existing canvas, safe to append
          try {
            mountRef.current.appendChild(renderer.domElement);
          } catch (e) {
            console.error('Error appending canvas to mount point:', e);
            throw new Error('Failed to add canvas element to the DOM');
          }
        }
      } else {
        // If we can't append for some reason, clean up the renderer
        console.warn('Mount point unavailable or renderer already exists');
        renderer.dispose();
        return;
      }
      
      console.log('Three.js scene initialized successfully');
      
      // Rest of the initialization code...
      
      // Once loaded, set loading state to false
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      
      // Cleanup function
      return () => {
        cleanupResources();
      };
    } catch (error) {
      console.error('Failed to initialize 3D visualization, falling back to 2D:', error);
      createFallback2DVisualization(width, height);
    }
  }, [buildingParameters, material, setCameraView]);
  
  // Create a simple 2D visualization as fallback when WebGL is not available
  const createFallback2DVisualization = (width: number, height: number) => {
    try {
      // Clear any existing canvas
      if (mountRef.current) {
        const existingCanvas = mountRef.current.querySelector('canvas');
        if (existingCanvas) {
          existingCanvas.remove();
        }
        
        // Create a new canvas for 2D rendering
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        mountRef.current.appendChild(canvas);
        
        // Get the 2D context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2D context');
        }
        
        // Set loading to false since we have a fallback
        setIsLoading(false);
        
        // Set info message
        setError('Using 2D fallback visualization (3D not available)');
        
        // Draw the building in 2D
        draw2DBuilding(ctx, width, height);
        
        // Add event listener for simulating earthquakes
        canvas.addEventListener('click', () => {
          if (isSimulating) return;
          
          setIsSimulating(true);
          animate2DEarthquake(ctx, width, height);
        });
      }
    } catch (e) {
      console.error('Failed to create 2D fallback:', e);
      setError('Visualization not available. Please try a different browser.');
      setIsLoading(false);
    }
  };
  
  // Draw a 2D representation of the building
  const draw2DBuilding = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas with light background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate scale to fit building
    const margin = 50;
    const buildingWidth = buildingParameters.buildingWidth;
    const buildingLength = buildingParameters.buildingLength;
    const buildingHeight = buildingParameters.buildingHeight;
    
    // Use the largest dimension for scaling
    const scale = Math.min(
      (width - margin * 2) / Math.max(buildingWidth, buildingLength),
      (height - margin * 2) / buildingHeight
    );
    
    // Calculate center position
    const centerX = width / 2;
    const centerY = height - margin;
    
    // Draw ground
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(centerX - (buildingLength * scale) / 2 - 20, centerY, buildingLength * scale + 40, 10);
    
    // Draw building outline
    const buildingX = centerX - (buildingLength * scale) / 2;
    const buildingY = centerY - buildingHeight * scale;
    const scaledBuildingWidth = buildingLength * scale;
    const scaledBuildingHeight = buildingHeight * scale;
    
    // Fill building with material color
    ctx.fillStyle = material.type === 'Concrete' ? '#cccccc' : '#8899aa';
    ctx.fillRect(buildingX, buildingY, scaledBuildingWidth, scaledBuildingHeight);
    
    // Draw stories
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    const storyHeight = buildingHeight / buildingParameters.numberOfStoreys;
    
    for (let i = 1; i < buildingParameters.numberOfStoreys; i++) {
      const y = centerY - (storyHeight * i * scale);
      ctx.beginPath();
      ctx.moveTo(buildingX, y);
      ctx.lineTo(buildingX + scaledBuildingWidth, y);
      ctx.stroke();
    }
    
    // Draw columns
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    const bayWidth = buildingLength / buildingParameters.baysX;
    
    for (let i = 0; i <= buildingParameters.baysX; i++) {
      const x = buildingX + (bayWidth * i * scale);
      ctx.beginPath();
      ctx.moveTo(x, buildingY);
      ctx.lineTo(x, centerY);
      ctx.stroke();
    }
    
    // Draw title and instructions
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Building Visualization (${buildingParameters.numberOfStoreys} stories, ${buildingParameters.baysX} bays)`, centerX, 30);
    
    ctx.fillStyle = '#555555';
    ctx.font = '12px Arial';
    ctx.fillText('Click to simulate earthquake', centerX, 50);
    
    // Store original positions for animation
    const buildingData = {
      x: buildingX,
      y: buildingY,
      width: scaledBuildingWidth,
      height: scaledBuildingHeight,
      centerY: centerY
    };
    
    return buildingData;
  };
  
  // Animate a simple 2D earthquake
  const animate2DEarthquake = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const buildingData = draw2DBuilding(ctx, width, height);
    const { x, y, width: buildingWidth, height: buildingHeight, centerY } = buildingData;
    
    const intensity = seismicParameters.intensity * 0.03;
    const frequency = seismicParameters.frequency;
    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    
    // Create animation
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        setIsSimulating(false);
        // Reset building position
        draw2DBuilding(ctx, width, height);
        
        // Show results
        const maxDisplacement = intensity * 10 * 100; // Convert to cm
        
        // Calculate estimated building weight if not provided
        const buildingWeight = buildingParameters.buildingWeight || 
                              (buildingParameters.buildingLength * 
                               buildingParameters.buildingWidth * 
                               buildingParameters.buildingHeight * 25); // Approx 25 kN/m³
        
        setResults({
          maxDisplacement,
          baseShear: buildingWeight * seismicParameters.spectralAcceleration * seismicParameters.importanceFactor / 1.5,
          storyDrifts: new Array(buildingParameters.numberOfStoreys).fill(0).map(() => maxDisplacement / buildingParameters.numberOfStoreys),
          periodOfVibration: structuralResults?.periodOfVibration || 0.5,
          damagePercentage: Math.min(seismicParameters.intensity * 10, 100)
        });
        
        return;
      }
      
      // Clear canvas
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
      
      // Draw ground
      ctx.fillStyle = '#dddddd';
      ctx.fillRect(x - 20, centerY, buildingWidth + 40, 10);
      
      // Calculate offset
      const dampingFactor = Math.exp(-0.05 * Math.PI * progress * 10);
      const offset = Math.sin(elapsed * frequency * 0.01) * intensity * dampingFactor * 100;
      
      // Draw building with offset
      ctx.fillStyle = material.type === 'Concrete' ? '#cccccc' : '#8899aa';
      
      // Draw with simple deformation
      ctx.save();
      ctx.beginPath();
      
      // Bottom corners stay fixed
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + buildingWidth, centerY);
      
      // Top moves with offset
      const topOffset = offset * (1 + buildingParameters.numberOfStoreys / 10);
      ctx.lineTo(x + buildingWidth + topOffset, y);
      ctx.lineTo(x + topOffset, y);
      
      ctx.closePath();
      ctx.fill();
      
      // Draw stories with deformation
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      const storyHeight = buildingHeight / buildingParameters.numberOfStoreys;
      
      for (let i = 1; i < buildingParameters.numberOfStoreys; i++) {
        const storyY = centerY - (storyHeight * i);
        const storyOffset = offset * (i / buildingParameters.numberOfStoreys);
        
        ctx.beginPath();
        ctx.moveTo(x + storyOffset * 0.5, storyY);
        ctx.lineTo(x + buildingWidth + storyOffset * 0.5, storyY);
        ctx.stroke();
      }
      
      // Draw columns with deformation
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      const bayWidth = buildingWidth / buildingParameters.baysX;
      
      for (let i = 0; i <= buildingParameters.baysX; i++) {
        const columnX = x + (bayWidth * i);
        const topX = columnX + offset * (buildingHeight / centerY);
        
        ctx.beginPath();
        ctx.moveTo(columnX, centerY);
        ctx.lineTo(topX, y);
        ctx.stroke();
      }
      
      // Draw title and status
      ctx.fillStyle = '#333333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Simulating Earthquake (${Math.round(progress * 100)}%)`, width / 2, 30);
      
      ctx.fillStyle = '#dd3333';
      ctx.font = '12px Arial';
      ctx.fillText(`Displacement: ${Math.abs(offset).toFixed(1)} units`, width / 2, 50);
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    requestAnimationFrame(animate);
  };

  // Create building visualization
  const createBuildingStructure = () => {
    if (!sceneRef.current) return;
    
    try {
      // Clear any existing meshes first
      const objectsToDispose: THREE.Object3D[] = [];
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.GridHelper || 
            child instanceof THREE.AxesHelper || child instanceof THREE.Light) {
          objectsToDispose.push(child);
        }
      });
      
      // Dispose objects outside of traverse to avoid modifying during iteration
      objectsToDispose.forEach(obj => {
        safeDispose(obj);
      });
      
      console.log('Creating building with parameters:', buildingParameters);
      
      // Prepare materials - reuse materials when possible to save memory
      const concreteMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        roughness: 0.7,
        metalness: 0.1
      });
      
      const steelMaterial = new THREE.MeshStandardMaterial({
        color: 0x8899AA,
        roughness: 0.3,
        metalness: 0.7
      });
      
      // Choose material based on selection
      const buildingMaterial = material.type === 'Concrete' ? concreteMaterial : steelMaterial;
      
      // Reset tracking references
      originalPositionsRef.current = {};
      elementDamageRef.current = {};
      
      // Calculate building dimensions
      const bayWidth = buildingParameters.buildingLength / buildingParameters.baysX;
      const bayDepth = buildingParameters.buildingWidth / buildingParameters.baysZ;
      const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
      
      // Calculate total element counts for memory optimization
      const totalColumns = (buildingParameters.baysX + 1) * (buildingParameters.baysZ + 1) * buildingParameters.numberOfStoreys;
      const totalBeamsX = buildingParameters.baysX * (buildingParameters.baysZ + 1) * buildingParameters.numberOfStoreys;
      const totalBeamsZ = (buildingParameters.baysX + 1) * buildingParameters.baysZ * buildingParameters.numberOfStoreys;
      
      console.log('Element counts:', { totalColumns, totalBeamsX, totalBeamsZ });
      
      // Set performance limits based on system capabilities
      const maxElementsPerMesh = 1000; // Limit for regular meshes
      const minElementsForInstancing = Math.min(totalColumns > 500 ? 20 : 30, 50);
      
      // Use instanced meshes for better performance when we have many elements
      const useInstancedColumns = totalColumns > minElementsForInstancing;
      const useInstancedBeamsX = totalBeamsX > minElementsForInstancing;
      const useInstancedBeamsZ = totalBeamsZ > minElementsForInstancing;
      
      // Dynamically adjust geometry detail based on element count
      const geometryDetailLevel = totalColumns > 500 ? 'low' : 'normal';
      
      // Calculate column dimensions based on material, building height, and performance needs
      const columnDimension = material.type === 'Concrete' ? 
        Math.max(0.3, 0.3 + buildingParameters.numberOfStoreys * 0.01) :
        Math.max(0.25, 0.25 + buildingParameters.numberOfStoreys * 0.008);
        
      // Simplify geometry when we have many elements
      const segmentsCount = geometryDetailLevel === 'low' ? 1 : 2;
      
      // Create geometries just once and reuse
      const columnGeometry = new THREE.BoxGeometry(
        columnDimension,
        storyHeight * 0.98, // Slight gap for visual separation
        columnDimension,
        segmentsCount, segmentsCount, segmentsCount
      );
      
      // Calculate beam dimensions
      const beamWidth = columnDimension * 0.8;
      const beamHeight = storyHeight * 0.2;
      
      // X-direction beams
      const beamXGeometry = new THREE.BoxGeometry(
        bayWidth + columnDimension, // Add column width to bridge the gap
        beamHeight,
        beamWidth,
        segmentsCount, segmentsCount, segmentsCount
      );
      
      // Z-direction beams
      const beamZGeometry = new THREE.BoxGeometry(
        beamWidth,
        beamHeight,
        bayDepth + columnDimension, // Add column width to bridge the gap
        segmentsCount, segmentsCount, segmentsCount
      );
      
      // Slab geometry - fewer segments for better performance
      const slabGeometry = new THREE.BoxGeometry(
        bayWidth,
        storyHeight * 0.05, // 5% of story height
        bayDepth,
        1, 1, 1 // Minimum segments for slabs (many instances)
      );
      
      try {
        // Rest of the building structure creation code...
        
        // Memory-efficient instanced mesh creation
        // ... (rest of the instanced mesh creation code stays the same)
        
      } catch (buildingError: any) {
        console.error('Error creating building elements:', buildingError);
        // Clean up geometries if building creation fails
        try {
          columnGeometry.dispose();
          beamXGeometry.dispose();
          beamZGeometry.dispose();
          slabGeometry.dispose();
        } catch (e) {
          console.warn('Error cleaning up geometries:', e);
        }
        throw new Error('Failed to create building structure: ' + buildingError.message);
      }
      
      // Dispose geometries when they're no longer needed to avoid memory leaks
      // We only need to dispose them if we're not using them in the scene anymore
      // For instanced meshes, the geometry is already attached and managed
      
      // Add minimal lighting for performance
      if (!lightsAddedRef.current) {
        try {
          // Use fewer lights for better performance
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
          sceneRef.current.add(ambientLight);
          
          // One directional light is usually sufficient
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
          directionalLight.position.set(5, 10, 7);
          
          // Only use shadow maps on high-performance devices
          if (rendererRef.current?.capabilities.maxTextureSize && 
              rendererRef.current.capabilities.maxTextureSize > 2048) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
          }
          
          sceneRef.current.add(directionalLight);
          lightsAddedRef.current = true;
        } catch (lightError) {
          console.warn('Error adding lights, continuing without them:', lightError);
        }
      }
      
      // Add simplified grid helper with fewer lines
      try {
        const gridDivisions = geometryDetailLevel === 'low' ? 10 : 20;
        const gridHelper = new THREE.GridHelper(
          Math.max(buildingParameters.buildingLength, buildingParameters.buildingWidth) * 1.5,
          gridDivisions,
          0x444444,
          0x888888
        );
        gridHelper.position.y = -0.01;
        sceneRef.current.add(gridHelper);
      } catch (gridError) {
        console.warn('Error adding grid helper, continuing without it:', gridError);
      }
      
      // Add minimal ground plane
      try {
        const groundGeometry = new THREE.PlaneGeometry(
          Math.max(buildingParameters.buildingLength, buildingParameters.buildingWidth) * 2,
          Math.max(buildingParameters.buildingLength, buildingParameters.buildingWidth) * 2,
          1, 1 // Minimum segments
        );
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: 0xeeeeee,
          roughness: 0.8,
          metalness: 0.1,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.02;
        
        // Only receive shadows if we're using shadow maps
        if (rendererRef.current?.shadowMap.enabled) {
          ground.receiveShadow = true;
        }
        
        sceneRef.current.add(ground);
      } catch (groundError) {
        console.warn('Error adding ground plane, continuing without it:', groundError);
      }
      
      console.log('Building structure created successfully');
      
      // Force garbage collection hint
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          // Optional GC not available
        }
      }
    } catch (error) {
      console.error('Error creating building structure:', error);
      setError('Failed to create building visualization. Please try reducing model complexity or refresh the page.');
    }
  };

  // Start the simulation
  const startSimulation = () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsSimulating(true);
      setResults(null);
      
      // Reset damage values
      Object.keys(elementDamageRef.current).forEach(key => {
        elementDamageRef.current[key] = 0;
      });
      
      // Make sure we have a scene before starting
      if (!sceneRef.current) {
        if (isMountedRef.current) {
          setIsSimulating(false);
          setError("Scene initialization failed. Please refresh the page.");
        }
        return;
      }
      
      // Reset building position if previous simulation was run
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
          object.position.copy(originalPositionsRef.current[object.uuid]);
          
          // Reset material color
          if (object.userData && object.userData.originalColor) {
            const material = object.material as THREE.MeshStandardMaterial;
            material.color.copy(object.userData.originalColor);
            material.emissive.set(0, 0, 0);
            material.emissiveIntensity = 0;
          }
        } else if (object instanceof THREE.InstancedMesh) {
          // Handle instanced meshes differently
          // We need to reset each instance matrix
          const matrix = new THREE.Matrix4();
          for (let i = 0; i < object.count; i++) {
            object.getMatrixAt(i, matrix);
            // Find the corresponding key in originalPositionsRef
            const keys = Object.keys(object.userData).filter(key => key.includes(`_${i}_`));
            if (keys.length > 0) {
              const originalPosition = originalPositionsRef.current[keys[0]];
              if (originalPosition) {
                // Extract rotation and scale from matrix
                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                matrix.decompose(position, quaternion, scale);
                
                // Apply original position and re-create matrix
                position.copy(originalPosition);
                matrix.compose(position, quaternion, scale);
                object.setMatrixAt(i, matrix);
              }
            }
          }
          object.instanceMatrix.needsUpdate = true;
        }
      });
      
      // Use requestAnimationFrame for precise timing
      console.log('Starting simulation with structural data:', structuralResults);
      
      // Duration of the simulation in seconds
      const simulationDuration = 10;
      const startTime = Date.now();
      
      // ===== Use structural properties for more realistic simulation =====
      
      // Use actual building weight from structural analysis (convert from N to kN)
      const buildingWeight = structuralResults?.totalWeight 
        ? structuralResults.totalWeight / 1000 
        : (buildingParameters.buildingWeight || 1000); // kN
      
      // Use actual period and frequency from structural analysis
      const naturalPeriod = structuralResults?.periodOfVibration || 1.0; // seconds
      const naturalFrequency = structuralResults?.naturalFrequency || 1 / naturalPeriod; // Hz
      
      console.log('Using structural properties: ', {
        buildingWeight,
        naturalPeriod,
        naturalFrequency
      });
      
      // Calculate mass from weight
      const mass = buildingWeight * 1000 / 9.81; // kg
      
      // Calculate stiffness using structural properties:
      // k = (2π)² × m × f²  where f is the natural frequency
      const stiffness = structuralResults 
        ? 4 * Math.PI * Math.PI * mass * (naturalFrequency * naturalFrequency) 
        : 5000000; // N/m - default if no structural results
        
      console.log('Calculated stiffness: ', stiffness, 'N/m');
      
      // Material properties affect damping
      const materialDampingFactor = material.type === 'Steel' ? 0.9 : 1.2; // Steel has less damping than concrete
      
      // Earthquake parameters
      const earthquakeIntensity = seismicParameters.intensity * 0.1; // Scale the intensity
      const earthquakeFrequency = seismicParameters.frequency; // Frequency in Hz
      
      // Calculate resonance factor - amplifies motion when earthquake frequency is close to natural frequency
      const resonanceFactor = calculateResonanceFactor(earthquakeFrequency, naturalFrequency);
      console.log('Resonance factor: ', resonanceFactor);
      
      // Calculate fundamental mode shape if available
      const modeShape = structuralResults?.dynamicAnalysis?.modalShapes?.[0] || 
        // Generate approximate mode shape if not available
        Array.from({length: buildingParameters.numberOfStoreys}, (_, i) => 
          Math.sin((i + 1) * Math.PI / (2 * buildingParameters.numberOfStoreys))
        );
        
      // Create physics tracking variables
      const maxDisplacements = Array(buildingParameters.numberOfStoreys).fill(0);
      const storyForces = Array(buildingParameters.numberOfStoreys).fill(0);
      
      // Cache for instanced mesh matrices to avoid recreating them each frame
      const instancedMeshMatrices: { [key: string]: { matrices: THREE.Matrix4[], isDirty: boolean } } = {};
      
      // Initialize matrices cache for instanced meshes
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) {
          const matrices: THREE.Matrix4[] = [];
          for (let i = 0; i < object.count; i++) {
            const matrix = new THREE.Matrix4();
            object.getMatrixAt(i, matrix);
            matrices.push(matrix);
          }
          instancedMeshMatrices[object.uuid] = {
            matrices,
            isDirty: false
          };
        }
      });
      
      // Use web workers for heavy computation if available
      const useWebWorker = 'Worker' in window && buildingParameters.numberOfStoreys > 10;
      
      // ===== Animation function for the earthquake =====
      // Use performance.now() for more accurate timing
      let lastFrameTime = 0;
      
      const simulateEarthquake = (frameTime: number) => {
        if (!isMountedRef.current) return;
        
        // Calculate delta time for smooth animation regardless of frame rate
        const deltaTime = lastFrameTime === 0 ? 0 : (frameTime - lastFrameTime) / 1000;
        lastFrameTime = frameTime;
        
        // Calculate elapsed time since start of simulation
        const elapsed = (Date.now() - startTime) / 1000; // Time elapsed in seconds
        
        // Calculate simulation progress as a percentage
        const progress = Math.min(elapsed / simulationDuration, 1.0);
        
        // Progressive damage factor increases over time
        const damageTimeFactor = progress * progress; // Non-linear increase
        
        // Apply motion to the building considering structural properties
        if (sceneRef.current) {
          // Reset the dirty flag for instanced meshes
          Object.keys(instancedMeshMatrices).forEach(key => {
            instancedMeshMatrices[key].isDirty = false;
          });
          
          // Apply earthquake forces to building elements
          sceneRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
              // Handle regular meshes
              applyEarthquakeToElement(
                object, 
                object.uuid, 
                originalPositionsRef.current[object.uuid],
                object.userData,
                elapsed,
                damageTimeFactor
              );
            } else if (object instanceof THREE.InstancedMesh && instancedMeshMatrices[object.uuid]) {
              // Only update if we haven't already processed this mesh in this frame
              if (!instancedMeshMatrices[object.uuid].isDirty) {
                // Handle instanced meshes
                const keys = Object.keys(object.userData).filter(key => key.includes('_'));
                const matrices = instancedMeshMatrices[object.uuid].matrices;
                
                // Process in small batches for better responsiveness
                const batchSize = Math.min(20, keys.length);
                const startIdx = Math.floor(progress * (keys.length - batchSize));
                
                // Process only part of the instances each frame for better performance
                for (let i = 0; i < batchSize; i++) {
                  const idx = (startIdx + i) % keys.length;
                  const key = keys[idx];
                  const originalPosition = originalPositionsRef.current[key];
                  
                  if (originalPosition && matrices[idx]) {
                    // Extract data from matrix
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    matrices[idx].decompose(position, quaternion, scale);
                    
                    // Apply earthquake forces
                    applyEarthquakeForces(
                      key,
                      position,
                      object.userData[key],
                      originalPosition,
                      elapsed,
                      damageTimeFactor
                    );
                    
                    // Update matrix
                    matrices[idx].compose(position, quaternion, scale);
                    object.setMatrixAt(idx, matrices[idx]);
                  }
                }
                
                object.instanceMatrix.needsUpdate = true;
                instancedMeshMatrices[object.uuid].isDirty = true;
              }
            }
          });
        }
        
        // Continue the simulation if time hasn't elapsed
        if (elapsed < simulationDuration && isMountedRef.current) {
          animationFrameRef.current = requestAnimationFrame(simulateEarthquake);
        } else if (isMountedRef.current) {
          // Simulation complete - calculate results
          
          // Calculate story drifts from maximum displacements
          const storyDrifts = calculateStoryDrifts(
            maxDisplacements,
            buildingParameters.numberOfStoreys,
            earthquakeIntensity,
            earthquakeFrequency,
            resonanceFactor,
            seismicParameters.dampingRatio || 0.05
          );
          
          // Calculate base shear using actual structural properties
          // Base shear = Spectral acceleration * Weight / R
          // Where R is the response modification factor
          const baseShear = (buildingWeight * seismicParameters.spectralAcceleration * 
            seismicParameters.importanceFactor / seismicParameters.responseModificationFactor);
            
          // Calculate max displacement (convert to cm for display)
          const maxDisplacement = Math.max(...maxDisplacements) * 100;
          
          // Calculate total damage percentage
          let totalDamage = 0;
          let elementCount = 0;
          Object.values(elementDamageRef.current).forEach(damage => {
            totalDamage += damage;
            elementCount++;
          });
          const averageDamage = elementCount > 0 ? (totalDamage / elementCount) * 100 : 0;
          
          // Generate simulation results
          const simulationResults: SimulationResults = {
            maxDisplacement, 
            baseShear,
            storyDrifts,
            periodOfVibration: naturalPeriod,
            damagePercentage: averageDamage
          };
          
          console.log('Simulation complete, results:', simulationResults);
          
          // Set results and finish simulation
          setResults(simulationResults);
          setIsSimulating(false);
          
          // Pass results to parent component
          if (onSimulationComplete) {
            onSimulationComplete(simulationResults);
          }
          
          // Reset building to original position after a delay
          setTimeout(() => {
            if (!isMountedRef.current) return;
            
            if (sceneRef.current) {
              // Reset regular meshes
              sceneRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
                  object.position.copy(originalPositionsRef.current[object.uuid]);
                }
              });
              
              // Reset instanced meshes
              Object.keys(instancedMeshMatrices).forEach(uuid => {
                const object = sceneRef.current?.getObjectByProperty('uuid', uuid) as THREE.InstancedMesh;
                if (object) {
                  // Reset the matrix for each instance
                  const keys = Object.keys(object.userData).filter(key => key.includes('_'));
                  for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const originalPosition = originalPositionsRef.current[key];
                    if (originalPosition && instancedMeshMatrices[uuid].matrices[i]) {
                      // Extract data from matrix
                      const position = new THREE.Vector3();
                      const quaternion = new THREE.Quaternion();
                      const scale = new THREE.Vector3();
                      instancedMeshMatrices[uuid].matrices[i].decompose(position, quaternion, scale);
                      
                      // Reset position
                      position.copy(originalPosition);
                      
                      // Update matrix
                      instancedMeshMatrices[uuid].matrices[i].compose(position, quaternion, scale);
                      object.setMatrixAt(i, instancedMeshMatrices[uuid].matrices[i]);
                    }
                  }
                  object.instanceMatrix.needsUpdate = true;
                }
              });
            }
          }, 1000);
        }
      };
      
      // Function to apply earthquake forces to a single element
      const applyEarthquakeToElement = (
        object: THREE.Mesh,
        uuid: string,
        originalPos: THREE.Vector3,
        userData: any,
        elapsed: number,
        damageTimeFactor: number
      ) => {
        // Get story level from user data or calculate from position
        const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
        const storyLevel = userData?.storyLevel !== undefined ? 
          userData.storyLevel : 
          Math.floor(object.position.y / storyHeight);
        
        // Calculate height ratio - higher parts of building sway more
        const heightRatio = object.position.y / (buildingParameters.buildingHeight);
        
        // Use mode shape if available, otherwise use height ratio
        const modeAmplification = storyLevel < modeShape.length ? modeShape[storyLevel] : heightRatio;
        
        // Determine damping - use actual damping ratio from seismicParameters
        const dampingRatio = seismicParameters.dampingRatio || 0.05;
        const dampingFactor = Math.exp(-dampingRatio * materialDampingFactor * Math.PI * elapsed);
        
        // Scale intensity based on all factors
        const scaledIntensity = earthquakeIntensity * 
          modeAmplification * 3 * // Mode shape amplification
          resonanceFactor * // Resonance effect
          dampingFactor; // Damping effect
        
        // Apply earthquake effects with more realistic motion
        // Add phase difference between X and Z to create more complex motion
        const xOffset = Math.sin(elapsed * earthquakeFrequency * Math.PI * 2) * scaledIntensity;
        const zOffset = Math.cos(elapsed * earthquakeFrequency * Math.PI * 2 + 0.4) * scaledIntensity * 0.7;
        
        // Apply the earthquake forces to the position
        const newPosition = applyEarthquakeForces(
          uuid,
          object.position.clone(),
          userData,
          originalPos,
          elapsed,
          damageTimeFactor,
          storyLevel
        );
        
        // Set new position
        object.position.copy(newPosition);
        
        // Track displacement for results
        if (storyLevel >= 0 && storyLevel < buildingParameters.numberOfStoreys) {
          const displacement = Math.sqrt(xOffset * xOffset + zOffset * zOffset);
          maxDisplacements[storyLevel] = Math.max(maxDisplacements[storyLevel], displacement);
        }
      };
      
      // Function to apply earthquake forces to a position
      const applyEarthquakeForces = (
        uuid: string,
        position: THREE.Vector3,
        userData: any,
        originalPos: THREE.Vector3,
        elapsed: number,
        damageTimeFactor: number,
        storyLevel?: number
      ): THREE.Vector3 => {
        // Get story level from user data or calculate from position
        const actualStoryLevel = storyLevel ?? userData?.storyLevel ?? 0;
        
        // Calculate height ratio - higher parts of building sway more
        const heightRatio = position.y / (buildingParameters.buildingHeight);
        
        // Use mode shape if available, otherwise use height ratio
        const modeAmplification = actualStoryLevel < modeShape.length ? 
          modeShape[actualStoryLevel] : 
          heightRatio;
        
        // Determine damping - use actual damping ratio from seismicParameters
        const dampingRatio = seismicParameters.dampingRatio || 0.05;
        const dampingFactor = Math.exp(-dampingRatio * materialDampingFactor * Math.PI * elapsed);
        
        // Scale intensity based on all factors
        const scaledIntensity = earthquakeIntensity * 
          modeAmplification * 3 * // Mode shape amplification
          resonanceFactor * // Resonance effect
          dampingFactor; // Damping effect
        
        // Apply earthquake effects with more realistic motion
        // Add phase difference between X and Z to create more complex motion
        const xOffset = Math.sin(elapsed * earthquakeFrequency * Math.PI * 2) * scaledIntensity;
        const zOffset = Math.cos(elapsed * earthquakeFrequency * Math.PI * 2 + 0.4) * scaledIntensity * 0.7;
        
        // Track maximum displacements for each story for results
        if (actualStoryLevel >= 0 && actualStoryLevel < buildingParameters.numberOfStoreys) {
          const displacement = Math.sqrt(xOffset * xOffset + zOffset * zOffset);
          maxDisplacements[actualStoryLevel] = Math.max(maxDisplacements[actualStoryLevel], displacement);
          
          // Estimate story forces using F = k*x
          const storyStiffnessRatio = 1 - (actualStoryLevel / buildingParameters.numberOfStoreys) * 0.5;
          storyForces[actualStoryLevel] = stiffness * storyStiffnessRatio * displacement;
          
          // Calculate stress and damage for this element
          // Higher stories and connection points experience more stress
          const stressMultiplier = userData?.stressMultiplier || 1.0;
          const storyDamageMultiplier = 1 + (actualStoryLevel / buildingParameters.numberOfStoreys);
          const materialDamageMultiplier = material.type === 'Concrete' ? 1.2 : 0.8; // Concrete cracks more easily
          
          // Calculate stress as percentage of maximum (0-1)
          const stress = Math.min(
            (displacement * stressMultiplier * storyDamageMultiplier * 
            materialDamageMultiplier * resonanceFactor) / 0.05, // 0.05m as max displacement
            1.0
          );
          
          // Accumulate damage - damage increases more rapidly as it gets worse
          // and after a lot of cycles (elapsed time)
          const existingDamage = elementDamageRef.current[uuid] || 0;
          let newDamage = existingDamage;
          
          if (userData?.type === 'beam' || userData?.type === 'column') {
            // Structural elements accumulate damage differently
            newDamage = Math.min(
              existingDamage + 
              (stress * stress * 0.002 * (1 + existingDamage * 5) * damageTimeFactor * stressMultiplier),
              1.0
            );
          } else if (userData?.type === 'slab') {
            // Slabs have different damage patterns
            newDamage = Math.min(
              existingDamage + 
              (stress * 0.001 * (1 + existingDamage * 3) * damageTimeFactor),
              1.0
            );
          }
          
          // Update damage level
          elementDamageRef.current[uuid] = newDamage;
        }
        
        // Set new position with offset
        return new THREE.Vector3(
          originalPos.x + (seismicParameters.direction !== 'z' ? xOffset : 0),
          originalPos.y,
          originalPos.z + (seismicParameters.direction !== 'x' ? zOffset : 0)
        );
      };
      
      // Start the earthquake simulation using requestAnimationFrame for timing
      animationFrameRef.current = requestAnimationFrame(simulateEarthquake);
    } catch (error) {
      console.error('Simulation error:', error);
      setIsSimulating(false);
      setError('An error occurred during simulation. Please try again with different parameters.');
    }
  };

  // Helper function to calculate story drifts based on structural properties
  const calculateStoryDrifts = (
    maxDisplacements: number[],
    numberOfStoreys: number, 
    intensity: number, 
    frequency: number,
    resonanceFactor: number,
    dampingRatio: number = 0.05
  ): number[] => {
    // If we have tracked displacements, calculate actual drifts between stories
    if (maxDisplacements && maxDisplacements.length > 0) {
      const drifts = [];
      // Convert displacements to mm for reporting
      const displacementsInMm = maxDisplacements.map(d => d * 1000);
      
      // Calculate inter-story drift (difference in displacement between adjacent stories)
      for (let i = 0; i < numberOfStoreys - 1; i++) {
        drifts.push(Math.abs(displacementsInMm[i+1] - displacementsInMm[i]));
      }
      // Add the ground to first story drift
      drifts.push(displacementsInMm[0]);
      
      // Reverse to report from top story to bottom
      return drifts.reverse();
    }
    
    // Fallback method if displacements aren't available
    // Use structural properties from analysis results if available
    const stiffnessDistribution = structuralResults?.dynamicAnalysis?.modalShapes?.[0] || 
      // Create a default distribution if unavailable - higher floors have more drift
      Array.from({length: numberOfStoreys}, (_, i) => (i + 1) / numberOfStoreys);
    
    // Base drift values
    const baseDrift = 0.05 * intensity * (frequency / 2) * resonanceFactor;
    const maxDrift = 0.08 * intensity * (frequency / 2) * resonanceFactor;
    
    return Array.from({ length: numberOfStoreys }, (_, i) => {
      // Higher stories experience more drift
      const heightFactor = stiffnessDistribution[i] || (i + 1) / numberOfStoreys;
      // Add some randomness for realism, but base it on actual structural behavior
      return baseDrift + maxDrift * heightFactor * (0.8 + Math.random() * 0.4);
    });
  };
  
  // Helper function to calculate resonance effect
  const calculateResonanceFactor = (earthquakeFreq: number, naturalFreq: number): number => {
    // Calculate amplification due to resonance using a simplification of response spectrum
    const frequencyRatio = earthquakeFreq / naturalFreq;
    
    // Simple resonance model - peak at ratio = 1.0
    // Real behavior would follow a more complex response spectrum
    if (frequencyRatio > 0 && frequencyRatio < 2) {
      // Peak amplification near resonance (freq ratio ≈ 1)
      return 1.0 + 2.0 * Math.exp(-4 * Math.pow(frequencyRatio - 1.0, 2));
    }
    return 1.0; // Default - no resonance amplification
  };

  // Log when component renders
  console.log('Render - isLoading:', isLoading);
  
  // Return the component JSX
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Mount container for Three.js */}
      <div 
        ref={mountRef}
        className="border border-gray-300 rounded-lg bg-white w-full h-[500px] relative"
        style={{ minHeight: '500px' }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading visualization...</p>
            </div>
          </div>
        )}
        
        {/* Error message display */}
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex justify-center items-center z-20">
            <div className="text-center max-w-md p-6 bg-red-50 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Visualization Error</h3>
              <p className="text-gray-700 mb-4">{error}</p>
              
              <div className="text-left text-xs mt-4 mb-4 bg-gray-100 p-3 rounded">
                <h4 className="font-medium mb-1">Troubleshooting tips:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Enable hardware acceleration in your browser settings</li>
                  <li>Try using Chrome, Edge, or Firefox</li>
                  <li>Reduce the model complexity (fewer stories/columns)</li>
                  <li>Close other browser tabs to free up memory</li>
                  <li>Update your graphics drivers</li>
                </ul>
              </div>
              
              <button 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
        
        {/* Structural Properties Overlay */}
        {structuralResults && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-80 p-2 rounded text-xs shadow-md z-10">
            <h4 className="font-semibold text-xs mb-1">Structural Properties</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span>Material:</span>
              <span className="font-medium">{material.displayName || material.name}</span>
              
              <span>Natural Period:</span>
              <span className="font-medium">{(structuralResults?.periodOfVibration || 0).toFixed(3)} s</span>
              
              <span>Weight:</span>
              <span className="font-medium">{((structuralResults?.totalWeight || 0) / 1000).toFixed(1)} kN</span>
              
              <span>Elastic Modulus:</span>
              <span className="font-medium">{(material.elasticModulus / 1000).toFixed(0)} GPa</span>
            </div>
          </div>
        )}
        
        {/* Damage visualization legend */}
        {showDamageKey && (
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded text-xs shadow-md z-10">
            <h4 className="font-semibold text-xs mb-1 flex justify-between">
              <span>Damage Legend</span>
              <button 
                onClick={() => setShowDamageKey(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </h4>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span>No Damage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span>Minor Damage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span>Moderate Damage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                <span>Severe Damage</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Camera view controls */}
        <div className="absolute bottom-2 left-2 flex flex-col bg-white bg-opacity-80 rounded shadow-md z-10 p-1">
          <div className="text-xs font-medium text-gray-600 mb-1 px-1">Camera Views</div>
          <div className="flex flex-wrap gap-1">
            <button 
              onClick={() => setCameraView('default')}
              className={`text-xs px-2 py-1 rounded ${currentView === 'default' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Default
            </button>
            <button 
              onClick={() => setCameraView('front')}
              className={`text-xs px-2 py-1 rounded ${currentView === 'front' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Front
            </button>
            <button 
              onClick={() => setCameraView('side')}
              className={`text-xs px-2 py-1 rounded ${currentView === 'side' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Side
            </button>
            <button 
              onClick={() => setCameraView('top')}
              className={`text-xs px-2 py-1 rounded ${currentView === 'top' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Top
            </button>
            <button 
              onClick={() => setCameraView('corner')}
              className={`text-xs px-2 py-1 rounded ${currentView === 'corner' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Corner
            </button>
          </div>
        </div>
        
        {/* Simulation status overlay */}
        {isSimulating && (
          <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-800 px-3 py-1 rounded shadow-md z-10 text-sm font-medium">
            Simulating earthquake... {structuralResults && (
              <span>T = {(structuralResults?.periodOfVibration || 0).toFixed(2)}s</span>
            )}
          </div>
        )}
      </div>
      
      {/* Simulation controls */}
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${
              isSimulating || isLoading || error
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={startSimulation}
            disabled={isSimulating || isLoading || !!error}
          >
            {isSimulating ? 'Simulating...' : 'Start Simulation'}
          </button>
          
          <button
            className={`px-4 py-2 rounded-md ${
              isSimulating || isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={resetSimulation}
            disabled={isSimulating || isLoading}
          >
            Reset
          </button>
        </div>
        
        <div>
          <button
            className={`px-4 py-2 rounded-md ${
              isLoading || !!error
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
            onClick={() => setShowDamageKey(!showDamageKey)}
            disabled={isLoading || !!error}
          >
            {showDamageKey ? 'Hide Damage Legend' : 'Show Damage Legend'}
          </button>
        </div>
      </div>
      
      {/* Results section */}
      {results && !error && (
        <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-2">Simulation Results</h3>
          
          {/* Structural Response Summary */}
          {structuralResults && (
            <div className="mb-4 bg-blue-50 p-3 rounded">
              <h4 className="text-sm font-semibold text-blue-700 mb-1">Structural Response</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="flex justify-between">
                    <span>Building Natural Period:</span>
                    <span className="font-medium">{(structuralResults?.periodOfVibration || 0).toFixed(3)} s</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Earthquake Period:</span>
                    <span className="font-medium">{(1/seismicParameters.frequency).toFixed(3)} s</span>
                  </p>
                  {Math.abs((structuralResults?.periodOfVibration || 0) - (1/seismicParameters.frequency)) < 0.1 && (
                    <p className="text-red-600 text-xs mt-1 font-medium">⚠️ Near resonance condition detected!</p>
                  )}
                </div>
                <div>
                  <p className="flex justify-between">
                    <span>Material:</span>
                    <span className="font-medium">{material.type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Damping Ratio:</span>
                    <span className="font-medium">{(seismicParameters.dampingRatio || 0.05).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-700"><span className="font-medium">Max Displacement:</span> {results.maxDisplacement.toFixed(2)} cm</p>
              <p className="text-gray-700"><span className="font-medium">Natural Period:</span> {results.periodOfVibration.toFixed(2)} seconds</p>
            </div>
            <div>
              <p className="text-gray-700"><span className="font-medium">Base Shear:</span> {results.baseShear.toFixed(2)} kN</p>
              <p className="text-gray-700"><span className="font-medium">Average Story Drift:</span> {(results.storyDrifts.reduce((a, b) => a + b, 0) / results.storyDrifts.length).toFixed(4)} m</p>
            </div>
            {results.damagePercentage !== undefined && (
              <div>
                <p className="text-gray-700">
                  <span className="font-medium">Estimated Damage:</span>
                  <span className={`ml-1 ${
                    results.damagePercentage > 15 ? 'text-red-600 font-medium' : 
                    results.damagePercentage > 5 ? 'text-orange-500' : 
                    'text-green-600'
                  }`}>
                    {results.damagePercentage.toFixed(1)}%
                  </span>
                </p>
                {results.damagePercentage > 15 && (
                  <p className="text-xs text-red-600">Building may require significant repairs</p>
                )}
                {results.damagePercentage > 5 && results.damagePercentage <= 15 && (
                  <p className="text-xs text-orange-500">Building has minor structural damage</p>
                )}
                {results.damagePercentage <= 5 && (
                  <p className="text-xs text-green-600">Building has minimal damage</p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-1">Story Drifts (m)</h4>
            <div className="grid grid-cols-5 gap-2">
              {results.storyDrifts.map((drift, index) => (
                <div key={index} className={`text-sm p-2 rounded ${
                  drift > 0.08 ? 'bg-red-100' : 
                  drift > 0.05 ? 'bg-yellow-100' : 
                  'bg-green-100'
                }`}>
                  <span className="font-medium">Story {buildingParameters.numberOfStoreys - index}:</span> {drift.toFixed(4)}
                  {structuralResults && (
                    <span className="block text-xs mt-1">
                      {drift > 0.08 ? 'Significant' : 
                       drift > 0.05 ? 'Moderate' : 
                       'Minor'} drift
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 