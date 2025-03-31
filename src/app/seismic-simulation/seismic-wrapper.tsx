'use client';

import React, { useEffect, useState, useRef } from 'react';
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

interface SeismicSimulationWrapperProps {
  buildingParameters: any; // Use any to avoid type issues
  material: Material;
  seismicParameters: SeismicParameters;
  onSimulationComplete?: (results: any) => void;
}

interface SimulationResults {
  maxDisplacement: number;
  baseShear: number;
  storyDrifts: number[];
  periodOfVibration: number;
}

// Add toRadians function
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Use React.memo to prevent unnecessary re-renders
const SeismicSimulationWrapper: React.FC<SeismicSimulationWrapperProps> = React.memo(({
  buildingParameters,
  material,
  seismicParameters,
  onSimulationComplete
}) => {
  console.log('SeismicSimulationWrapper rendering');
  
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const originalPositionsRef = useRef<{ [key: string]: THREE.Vector3 }>({});
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const deltaXRef = useRef<number>(0);
  const deltaYRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const [results, setResults] = useState<SimulationResults | null>(null);
  
  // Track component mounting state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
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

  // Initialize Three.js scene with a more robust approach
  useEffect(() => {
    if (!mountRef.current || !isMountedRef.current) return;
    
    console.log('Scene initialization running');
    
    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Dispose of any existing renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    // Get mount element but DON'T clear it with innerHTML
    // React should manage the DOM structure
    const mountElement = mountRef.current;
    
    try {
      // Scene setup
      console.log('Creating scene');
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0xf0f0f0);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        45,
        mountElement.clientWidth / mountElement.clientHeight,
        0.1,
        1000
      );
      camera.position.set(40, 30, 40);
      const { buildingLength, buildingWidth, buildingHeight, numberOfStoreys } = buildingParameters;
      const storyHeight = buildingHeight / numberOfStoreys;
      camera.lookAt(new THREE.Vector3(buildingLength / 2, storyHeight * (numberOfStoreys / 2), buildingWidth / 2));
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
      renderer.setClearColor(0xf5f5f5, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Check if mount element already has a renderer child
      const existingCanvas = mountElement.querySelector('canvas');
      if (existingCanvas) {
        mountElement.removeChild(existingCanvas);
      }
      
      mountElement.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create building structure
      createBuildingStructure();

      // Initial render to ensure something is visible
      renderer.render(scene, camera);
      
      // Animation function
      const animate = () => {
        if (!isMountedRef.current) return;
        
        animationFrameRef.current = requestAnimationFrame(animate);
        
        if (isDraggingRef.current && cameraRef.current && sceneRef.current) {
          // Update camera position based on mouse movement
          const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              toRadians(deltaYRef.current * 0.5),
              toRadians(deltaXRef.current * 0.5),
              0,
              'XYZ'
            )
          );
          
          cameraRef.current.position.applyQuaternion(deltaRotationQuaternion);
          cameraRef.current.lookAt(new THREE.Vector3(buildingLength / 2, storyHeight * (numberOfStoreys / 2), buildingWidth / 2));
        }
        
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      // Start animation loop
      animate();
      
      // Set up mouse events for camera control
      const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        previousMousePositionRef.current = {
          x: e.clientX,
          y: e.clientY
        };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        
        deltaXRef.current = e.clientX - previousMousePositionRef.current.x;
        deltaYRef.current = e.clientY - previousMousePositionRef.current.y;
        
        previousMousePositionRef.current = {
          x: e.clientX,
          y: e.clientY
        };
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
      };

      const handleWheel = (e: WheelEvent) => {
        if (!cameraRef.current) return;
        
        // Zoom in/out
        const zoomSpeed = 0.1;
        const direction = e.deltaY > 0 ? 1 : -1;
        const factor = 1 + direction * zoomSpeed;
        
        const currentDistance = cameraRef.current.position.distanceTo(
          new THREE.Vector3(buildingLength / 2, storyHeight * (numberOfStoreys / 2), buildingWidth / 2)
        );
        
        if (
          (direction > 0 && currentDistance < 100) || // Zoom out limit
          (direction < 0 && currentDistance > 10)     // Zoom in limit
        ) {
          cameraRef.current.position.multiplyScalar(factor);
        }
      };

      // Add event listeners
      mountElement.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      mountElement.addEventListener('wheel', handleWheel);
      
      // Set loading to false
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      
      // Cleanup function
      return () => {
        console.log('Running useEffect cleanup');
        
        // Only run cleanup if the component is unmounting or dependencies have changed
        if (!isMountedRef.current) return;
        
        // Remove event listeners
        if (mountElement) {
          try {
            mountElement.removeEventListener('mousedown', handleMouseDown);
            mountElement.removeEventListener('wheel', handleWheel);
          } catch (e) {
            console.error('Error removing event listeners:', e);
          }
        }
        
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Dispose of renderer - but don't try to remove the DOM element
        // Let React handle the DOM element removal
        if (rendererRef.current) {
          try {
            rendererRef.current.dispose();
            rendererRef.current = null;
          } catch (e) {
            console.error('Error disposing renderer:', e);
          }
        }
      };
    } catch (error) {
      console.error('Error initializing Three.js scene:', error);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [buildingParameters]);

  // Function to create the building structure
  const createBuildingStructure = () => {
    if (!sceneRef.current || !isMountedRef.current) return;

    try {
      // Clear any existing meshes
      while(sceneRef.current.children.length > 0){ 
        sceneRef.current.remove(sceneRef.current.children[0]); 
      }
      originalPositionsRef.current = {};

      const { buildingLength, buildingWidth, buildingHeight, numberOfStoreys } = buildingParameters;
      const storyHeight = buildingHeight / numberOfStoreys;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      sceneRef.current.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(50, 50, 50);
      directionalLight.castShadow = true;
      sceneRef.current.add(directionalLight);

      // Add grid helper
      const gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0x444444);
      gridHelper.position.y = -0.01;
      sceneRef.current.add(gridHelper);

      // Add axes helper
      const axesHelper = new THREE.AxesHelper(20);
      sceneRef.current.add(axesHelper);

      // Create columns with better materials
      for (let x = 0; x <= buildingParameters.columnsAlongLength - 1; x++) {
        for (let z = 0; z <= buildingParameters.columnsAlongWidth - 1; z++) {
          for (let y = 0; y < numberOfStoreys; y++) {
            const columnGeometry = new THREE.BoxGeometry(
              buildingParameters.columnWidth / 1000,
              storyHeight,
              buildingParameters.columnDepth / 1000
            );
            const columnMaterial = new THREE.MeshStandardMaterial({
              color: '#808080',
              metalness: 0.2,
              roughness: 0.7,
              emissive: 0x111111,
              emissiveIntensity: 0.1
            });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            
            // Position columns
            column.position.set(
              (x * buildingLength) / (buildingParameters.columnsAlongLength - 1),
              y * storyHeight + storyHeight / 2,
              (z * buildingWidth) / (buildingParameters.columnsAlongWidth - 1)
            );
            column.castShadow = true;
            column.receiveShadow = true;
            
            // Store original position
            originalPositionsRef.current[column.uuid] = column.position.clone();
            
            // Add to scene
            sceneRef.current.add(column);
          }
        }
      }

      // Create beams with better materials
      for (let x = 0; x < buildingParameters.columnsAlongLength; x++) {
        for (let z = 0; z < buildingParameters.columnsAlongWidth - 1; z++) {
          for (let y = 1; y <= numberOfStoreys; y++) {
            const beamGeometry = new THREE.BoxGeometry(
              buildingParameters.columnWidth / 1000,
              buildingParameters.beamHeight / 1000,
              buildingWidth / (buildingParameters.columnsAlongWidth - 1)
            );
            const beamMaterial = new THREE.MeshStandardMaterial({
              color: '#606060', // Slightly darker than columns
              metalness: 0.2,
              roughness: 0.7
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            // Position beams
            beam.position.set(
              (x * buildingLength) / (buildingParameters.columnsAlongLength - 1),
              y * storyHeight,
              (z * buildingWidth) / (buildingParameters.columnsAlongWidth - 1) + buildingWidth / (2 * (buildingParameters.columnsAlongWidth - 1))
            );
            beam.castShadow = true;
            beam.receiveShadow = true;
            
            // Store original position
            originalPositionsRef.current[beam.uuid] = beam.position.clone();
            
            // Add to scene
            sceneRef.current.add(beam);
          }
        }
      }

      // Create beams along length with better materials
      for (let x = 0; x < buildingParameters.columnsAlongLength - 1; x++) {
        for (let z = 0; z < buildingParameters.columnsAlongWidth; z++) {
          for (let y = 1; y <= numberOfStoreys; y++) {
            const beamGeometry = new THREE.BoxGeometry(
              buildingLength / (buildingParameters.columnsAlongLength - 1),
              buildingParameters.beamHeight / 1000,
              buildingParameters.columnDepth / 1000
            );
            const beamMaterial = new THREE.MeshStandardMaterial({
              color: '#606060', // Slightly darker than columns
              metalness: 0.2,
              roughness: 0.7
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            // Position beams
            beam.position.set(
              (x * buildingLength) / (buildingParameters.columnsAlongLength - 1) + buildingLength / (2 * (buildingParameters.columnsAlongLength - 1)),
              y * storyHeight,
              (z * buildingWidth) / (buildingParameters.columnsAlongWidth - 1)
            );
            beam.castShadow = true;
            beam.receiveShadow = true;
            
            // Store original position
            originalPositionsRef.current[beam.uuid] = beam.position.clone();
            
            // Add to scene
            sceneRef.current.add(beam);
          }
        }
      }

      // Create slabs with better materials
      for (let y = 1; y <= numberOfStoreys; y++) {
        const slabGeometry = new THREE.BoxGeometry(
          buildingLength,
          buildingParameters.slabThickness / 1000,
          buildingWidth
        );
        const slabMaterial = new THREE.MeshStandardMaterial({
          color: '#e0e0e0', // Light gray
          metalness: 0.1,
          roughness: 0.7,
          transparent: true,
          opacity: 0.8
        });
        const slab = new THREE.Mesh(slabGeometry, slabMaterial);
        
        // Position slabs
        slab.position.set(
          buildingLength / 2,
          y * storyHeight + buildingParameters.beamHeight / 2000,
          buildingWidth / 2
        );
        slab.castShadow = true;
        slab.receiveShadow = true;
        
        // Store original position
        originalPositionsRef.current[slab.uuid] = slab.position.clone();
        
        // Add to scene
        sceneRef.current.add(slab);
      }

      // Add ground plane
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = Math.PI / 2;
      ground.position.y = -0.1;
      ground.receiveShadow = true;
      sceneRef.current.add(ground);
      
    } catch (error) {
      console.error('Error creating building structure:', error);
    }
  };

  // Start the simulation
  const startSimulation = () => {
    if (!isMountedRef.current) return;
    
    setIsSimulating(true);
    setResults(null);
    
    // Make sure we have a scene before starting
    if (!sceneRef.current) {
      if (isMountedRef.current) setIsSimulating(false);
      return;
    }
    
    // Reset building to original position if previous simulation was run
    sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
        object.position.copy(originalPositionsRef.current[object.uuid]);
      }
    });
    
    // Duration of the simulation in seconds
    const simulationDuration = 10;
    const startTime = Date.now();
    
    // Earthquake parameters
    const earthquakeIntensity = seismicParameters.intensity * 0.1; // Scale the intensity
    const earthquakeFrequency = seismicParameters.frequency; // Frequency in Hz
    
    // Animation function for the earthquake
    const simulateEarthquake = () => {
      if (!isMountedRef.current) return;
      
      const elapsed = (Date.now() - startTime) / 1000; // Time elapsed in seconds
      
      // Apply random movement to the building
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
            // Get original position
            const originalPos = originalPositionsRef.current[object.uuid];
            
            // Calculate height ratio - higher parts of building sway more
            const heightRatio = object.position.y / (buildingParameters.buildingHeight);
            const scaledIntensity = earthquakeIntensity * (1 + heightRatio * 2);
            
            // Apply earthquake effects
            const xOffset = Math.sin(elapsed * earthquakeFrequency * Math.PI * 2) * scaledIntensity;
            const zOffset = Math.cos(elapsed * earthquakeFrequency * Math.PI * 2 + 0.4) * scaledIntensity * 0.7;
            
            // Set new position with offset
            object.position.set(
              originalPos.x + xOffset,
              originalPos.y,
              originalPos.z + zOffset
            );
          }
        });
      }
      
      // Continue the simulation if time hasn't elapsed
      if (elapsed < simulationDuration && isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(simulateEarthquake);
      } else if (isMountedRef.current) {
        // Simulation complete - calculate results
        const baseDrift = 0.05 * earthquakeIntensity * (earthquakeFrequency / 2);
        const maxDrift = 0.08 * earthquakeIntensity * (earthquakeFrequency / 2);
        const storyDrifts = Array.from({ length: buildingParameters.numberOfStoreys }, (_, i) => {
          // Higher stories experience more drift
          const heightFactor = (i + 1) / buildingParameters.numberOfStoreys;
          return baseDrift + maxDrift * heightFactor * Math.random();
        });
        
        const naturalFrequency = 0.5 + earthquakeFrequency * 0.2;
        
        // Generate simulation results
        const simulationResults: SimulationResults = {
          maxDisplacement: earthquakeIntensity * 10, // cm
          baseShear: (buildingParameters.buildingWeight || 1000) * earthquakeIntensity, // kN - use fallback if weight is undefined
          storyDrifts,
          periodOfVibration: 1 / naturalFrequency
        };
        
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
            sceneRef.current.traverse((object) => {
              if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
                object.position.copy(originalPositionsRef.current[object.uuid]);
              }
            });
          }
        }, 1000);
      }
    };
    
    // Start the earthquake simulation
    simulateEarthquake();
  };

  // Reset the simulation
  const resetSimulation = () => {
    if (!isMountedRef.current) return;
    
    setIsSimulating(false);
    setResults(null);
    if (onSimulationComplete) {
      onSimulationComplete(null);
    }
    
    // Reset building to original position
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
          object.position.copy(originalPositionsRef.current[object.uuid]);
        }
      });
    }
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
      </div>
      
      {/* Simulation controls */}
      <div className="flex justify-between">
        <button
          className={`px-4 py-2 rounded-md ${
            isSimulating 
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={startSimulation}
          disabled={isSimulating || isLoading}
        >
          {isSimulating ? 'Simulating...' : 'Start Simulation'}
        </button>
        
        <button
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          onClick={resetSimulation}
          disabled={isSimulating || isLoading}
        >
          Reset
        </button>
      </div>
      
      {/* Results section */}
      {results && (
        <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-2">Simulation Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700"><span className="font-medium">Max Displacement:</span> {results.maxDisplacement.toFixed(2)} cm</p>
              <p className="text-gray-700"><span className="font-medium">Natural Period:</span> {results.periodOfVibration.toFixed(2)} seconds</p>
            </div>
            <div>
              <p className="text-gray-700"><span className="font-medium">Base Shear:</span> {results.baseShear.toFixed(2)} kN</p>
              <p className="text-gray-700"><span className="font-medium">Average Story Drift:</span> {(results.storyDrifts.reduce((a, b) => a + b, 0) / results.storyDrifts.length).toFixed(4)} m</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-1">Story Drifts (m)</h4>
            <div className="grid grid-cols-5 gap-2">
              {results.storyDrifts.map((drift, index) => (
                <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                  <span className="font-medium">Story {buildingParameters.numberOfStoreys - index}:</span> {drift.toFixed(4)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SeismicSimulationWrapper; 