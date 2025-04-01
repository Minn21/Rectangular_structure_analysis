import React, { useRef, useState, useEffect } from 'react';
import { Material } from '../types';
import { SeismicParameters } from '../types';

const SeismicSimulationWrapper = () => {
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
  const elementDamageRef = useRef<{ [key: string]: number }>({});
  
  // States
  const [currentView, setCurrentView] = useState<string>('default');
  const [showDamageKey, setShowDamageKey] = useState<boolean>(false);
  
  // Track component mounting state and handle cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // Set mounted flag to false first to prevent new operations
      isMountedRef.current = false;
      
      // Cancel any pending animation frames
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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
  
  // Initialize three.js scene, camera, and renderer
  useEffect(() => {
    // Immediately return if component is not mounted or mountRef is not available
    if (!mountRef.current || !isMountedRef.current) return;
    
    console.log('Initializing Three.js scene');
    
    // Store a reference to the current mount element to avoid closure issues
    const mountElement = mountRef.current;
    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight || 500;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5); // Light gray background
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(40, 30, 40);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraRef.current = camera;
    
    // Create renderer - use let to allow reassignment if needed
    let renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0xf5f5f5, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    
    // Safely clear any existing children from the mount element
    const safelyRemoveChildren = () => {
      if (!mountElement) return;
      
      // Use a safer approach with a static copy of children
      const childNodes = Array.from(mountElement.childNodes);
      childNodes.forEach(child => {
        try {
          if (mountElement.contains(child)) {
            mountElement.removeChild(child);
          }
        } catch (e) {
          console.warn('Error removing child node:', e);
        }
      });
    };
    
    // Safely append the renderer to the DOM
    const safelyAppendRenderer = () => {
      if (!isMountedRef.current || !mountElement || !renderer) return;
      
      try {
        // First check if the renderer's domElement already has a parent
        if (renderer.domElement && renderer.domElement.parentNode) {
          try {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          } catch (e) {
            console.warn('Failed to remove renderer from previous parent:', e);
            
            // If we can't detach it, create a new renderer
            if (rendererRef.current) {
              rendererRef.current.dispose();
            }
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setClearColor(0xf5f5f5, 1);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            rendererRef.current = renderer;
          }
        }
        
        // Now safely append the renderer to the DOM
        if (isMountedRef.current && mountElement && renderer.domElement) {
          safelyRemoveChildren(); // Clear existing children first
          mountElement.appendChild(renderer.domElement);
          console.log('Renderer appended to DOM successfully');
        }
      } catch (error) {
        console.error('Error appending renderer to DOM:', error);
      }
    };
    
    // Execute the DOM operations safely
    if (isMountedRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (isMountedRef.current) {
          safelyAppendRenderer();
        }
      }, 0);
    }
    
    console.log('Three.js scene initialized');
    
    // Add window resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current || !isMountedRef.current) return;
      
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 500;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Three.js resources');
      
      // First set mounted flag to false to prevent any new operations
      isMountedRef.current = false;
      
      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      
      // Cancel any pending animation frames
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Safely remove renderer's domElement from DOM
      if (mountRef.current && rendererRef.current && rendererRef.current.domElement) {
        try {
          // Check if the domElement is actually a child of mountRef before removing
          if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
        } catch (e) {
          console.warn('Error removing renderer domElement:', e);
        }
      }
      
      // Dispose of all Three.js objects
      if (sceneRef.current) {
        // Properly dispose of all geometries and materials
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        
        // Clear the scene
        while(sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0]);
        }
        
        sceneRef.current = null;
      }
      
      // Dispose of renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clear camera reference
      if (cameraRef.current) {
        cameraRef.current = null;
      }
    };
  }, []);
  
  // Log when structural results change
  useEffect(() => {
    if (structuralResults) {
      console.log('Structural results received in simulation:', structuralResults);
    }
  }, [structuralResults]);
  
  // Initialize three.js scene, camera, and renderer
  useEffect(() => {
    // Immediately return if component is not mounted or mountRef is not available
    if (!mountRef.current || !isMountedRef.current) return;
    
    console.log('Initializing Three.js scene');
    
    // Store a reference to the current mount element to avoid closure issues
    const mountElement = mountRef.current;
    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight || 500;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5); // Light gray background
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(40, 30, 40);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraRef.current = camera;
    
    // Create renderer - use let to allow reassignment if needed
    let renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0xf5f5f5, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    
    // Safely clear any existing children from the mount element
    const safelyRemoveChildren = () => {
      if (!mountElement) return;
      
      // Use a safer approach with a static copy of children
      const childNodes = Array.from(mountElement.childNodes);
      childNodes.forEach(child => {
        try {
          if (mountElement.contains(child)) {
            mountElement.removeChild(child);
          }
        } catch (e) {
          console.warn('Error removing child node:', e);
        }
      });
    };
    
    // Safely append the renderer to the DOM
    const safelyAppendRenderer = () => {
      if (!isMountedRef.current || !mountElement || !renderer) return;
      
      try {
        // First check if the renderer's domElement already has a parent
        if (renderer.domElement && renderer.domElement.parentNode) {
          try {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          } catch (e) {
            console.warn('Failed to remove renderer from previous parent:', e);
            
            // If we can't detach it, create a new renderer
            if (rendererRef.current) {
              rendererRef.current.dispose();
            }
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setClearColor(0xf5f5f5, 1);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            rendererRef.current = renderer;
          }
        }
        
        // Now safely append the renderer to the DOM
        if (isMountedRef.current && mountElement && renderer.domElement) {
          safelyRemoveChildren(); // Clear existing children first
          mountElement.appendChild(renderer.domElement);
          console.log('Renderer appended to DOM successfully');
        }
      } catch (error) {
        console.error('Error appending renderer to DOM:', error);
      }
    };
    
    // Execute the DOM operations safely
    if (isMountedRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (isMountedRef.current) {
          safelyAppendRenderer();
        }
      }, 0);
    }
    
    console.log('Three.js scene initialized');
    
    // Add window resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current || !isMountedRef.current) return;
      
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 500;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        sceneRef.current = null;
      }
      
      // Safely remove renderer's domElement from mountRef
      if (mountRef.current) {
        try {
          // Store a reference to the current mount element to avoid closure issues
          const mountElement = mountRef.current;
          
          // First check if renderer's domElement is a child of mountRef
          if (rendererRef.current && rendererRef.current.domElement) {
            const domElement = rendererRef.current.domElement;
            // Only try to remove if it's actually a child of mountRef
            try {
              if (mountElement.contains(domElement)) {
                // Use requestAnimationFrame to ensure DOM operations happen in the right context
                requestAnimationFrame(() => {
                  try {
                    if (mountElement.contains(domElement)) {
                      mountElement.removeChild(domElement);
                    }
                  } catch (e) {
                    console.warn('Failed to remove domElement in animation frame:', e);
                  }
                });
              }
            } catch (e) {
              console.warn('Error checking if domElement is contained in mountElement:', e);
            }
          } 
          // Then safely remove any remaining children if needed
          else {
            // Use a safer approach with Array.from to create a static copy of children
            const childNodes = Array.from(mountElement.childNodes);
            childNodes.forEach(child => {
              try {
                if (mountElement.contains(child)) {
                  mountElement.removeChild(child);
                }
              } catch (e) {
                console.warn('Error removing child node:', e);
              }
            });
          }
        } catch (error) {
          console.error('Error cleaning up DOM nodes:', error);
        }
      }
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    
    // Mouse event handling for camera controls
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;
      
      const { x, y } = previousMousePositionRef.current;
      const deltaX = e.clientX - x;
      const deltaY = e.clientY - y;
      
      // Determine if shift key is pressed for panning
      if (e.shiftKey) {
        // Pan the camera
        const panSpeed = 0.05;
        const panOffset = new THREE.Vector3();
        
        // Get the camera's right and up vectors
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0); // World up vector
        cameraRef.current.getWorldDirection(right);
        right.cross(up).normalize();
        
        // Calculate pan amount
        panOffset.copy(right).multiplyScalar(-deltaX * panSpeed);
        panOffset.add(up.multiplyScalar(deltaY * panSpeed));
        
        // Apply pan
        cameraRef.current.position.add(panOffset);
        
        // Update the target that the camera is looking at
        const lookTarget = new THREE.Vector3();
        lookTarget.copy(cameraRef.current.position);
        lookTarget.add(cameraRef.current.getWorldDirection(new THREE.Vector3()));
        cameraRef.current.lookAt(lookTarget);
      } else {
        // Rotate the camera around the target
        const rotationSpeed = 0.005;
        
        // Get the center of the building
        const targetX = buildingParameters.buildingLength / 2;
        const targetY = buildingParameters.buildingHeight / 2;
        const targetZ = buildingParameters.buildingWidth / 2;
        const target = new THREE.Vector3(targetX, targetY, targetZ);
        
        // Get camera position relative to target
        const relativePosition = new THREE.Vector3().subVectors(cameraRef.current.position, target);
        
        // Apply horizontal rotation (around Y axis)
        const horizontalAngle = -deltaX * rotationSpeed;
        relativePosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), horizontalAngle);
        
        // Apply vertical rotation (around horizontal axis)
        const verticalAxis = new THREE.Vector3().crossVectors(relativePosition, new THREE.Vector3(0, 1, 0)).normalize();
        const verticalAngle = -deltaY * rotationSpeed;
        if (verticalAxis.length() > 0) { // Prevent NaN when vectors are parallel
          relativePosition.applyAxisAngle(verticalAxis, verticalAngle);
        }
        
        // Set new camera position
        cameraRef.current.position.copy(relativePosition.add(target));
        cameraRef.current.lookAt(target);
      }
      
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    // Zoom with mouse wheel
    const handleWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      e.preventDefault();
      
      const scrollAmount = e.deltaY * 0.001;
      const zoomDirection = new THREE.Vector3();
      cameraRef.current.getWorldDirection(zoomDirection);
      
      // Apply zoom
      cameraRef.current.position.addScaledVector(zoomDirection, scrollAmount);
    };
    
    // Add mouse event listeners with proper error handling
    try {
      // Store a reference to the renderer's domElement to ensure it's the same one we remove listeners from
      const domElement = renderer.domElement;
      
      if (domElement) {
        // Use try/catch for each event listener to prevent one failure from blocking others
        try {
          domElement.addEventListener('mousedown', handleMouseDown);
        } catch (e) {
          console.warn('Failed to add mousedown event listener:', e);
        }
        
        try {
          domElement.addEventListener('wheel', handleWheel, { passive: false });
        } catch (e) {
          console.warn('Failed to add wheel event listener:', e);
        }
      }
      
      // Add window event listeners
      try {
        window.addEventListener('mouseup', handleMouseUp);
      } catch (e) {
        console.warn('Failed to add mouseup event listener:', e);
      }
      
      try {
        window.addEventListener('mousemove', handleMouseMove);
      } catch (e) {
        console.warn('Failed to add mousemove event listener:', e);
      }
    } catch (error) {
      console.error('Error adding event listeners:', error);
    }
    
    // Create the building structure
    createBuildingStructure();
    
    // Initialize the default camera view after building is created
    setTimeout(() => {
      setCameraView('default');
    }, 100);
    
    // The animation loop with improved safety checks
    const animate = () => {
      // First check if component is still mounted before doing anything
      if (!isMountedRef.current) {
        // Safety cleanup if animation is running but component is unmounted
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      // Check if all required refs are valid
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        console.warn('Missing required Three.js objects in animation loop');
        return;
      }
      
      try {
        // Check again if component is mounted before rendering
        if (isMountedRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          
          // Only request next frame if component is still mounted
          if (isMountedRef.current) {
            // Clear any existing animation frame first to prevent duplicates
            if (animationFrameRef.current !== null) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        }
      } catch (error) {
        console.error('Error in animation loop:', error);
        // Cancel animation frame on error
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };
    
    // Only start animation if component is mounted
    if (isMountedRef.current) {
      animate();
    }
    
    // Once loaded, set loading state to false
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }, 500);
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Three.js scene');
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      
      // Safely remove event listeners from renderer domElement
      if (rendererRef.current && rendererRef.current.domElement) {
        try {
          // Check if the domElement is still valid before removing event listeners
          if (rendererRef.current.domElement instanceof Element) {
            rendererRef.current.domElement.removeEventListener('mousedown', handleMouseDown);
            rendererRef.current.domElement.removeEventListener('wheel', handleWheel);
          }
        } catch (error) {
          console.error('Error removing event listeners:', error);
        }
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      
      // Dispose of all Three.js objects
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
      // Dispose of renderer and safely remove its domElement from DOM
      if (rendererRef.current) {
        // First try to safely remove the domElement from DOM if it's still attached
        try {
          if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
            rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
          }
        } catch (error) {
          console.error('Error removing renderer domElement from DOM:', error);
        }
        
        // Then dispose the renderer
        rendererRef.current.dispose();
      }
    };
  }, [buildingParameters, material]);

  // Function to create the building structure
  const createBuildingStructure = () => {
    if (!sceneRef.current || !isMountedRef.current) return;

    try {
      // Clear any existing meshes
      while(sceneRef.current.children.length > 0){ 
        sceneRef.current.remove(sceneRef.current.children[0]); 
      }
      originalPositionsRef.current = {};
      elementDamageRef.current = {}; // Reset damage values

      const { buildingLength, buildingWidth, buildingHeight, numberOfStoreys, columnWidth, columnDepth, beamWidth, beamHeight, slabThickness } = buildingParameters;
      const storyHeight = buildingHeight / numberOfStoreys;

      // Get material properties for visualization
      const materialColor = material?.color || '#808080';
      const columnOpacity = material?.type === 'Concrete' ? 1.0 : 0.9;
      const beamOpacity = material?.type === 'Concrete' ? 1.0 : 0.9;
      const isSteel = material?.type === 'Steel';
      
      console.log('Using material for visualization:', material);

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

      // Create columns with material-specific properties
      for (let x = 0; x <= buildingParameters.columnsAlongLength - 1; x++) {
        for (let z = 0; z <= buildingParameters.columnsAlongWidth - 1; z++) {
          for (let y = 0; y < numberOfStoreys; y++) {
            // Use actual column dimensions from building parameters
            const columnGeometry = new THREE.BoxGeometry(
              columnWidth / 1000,
              storyHeight,
              columnDepth / 1000
            );
            
            // Use material properties for visualization
            const columnMaterial = new THREE.MeshStandardMaterial({
              color: materialColor,
              metalness: isSteel ? 0.6 : 0.1,
              roughness: isSteel ? 0.4 : 0.8,
              emissive: isSteel ? 0x222222 : 0x000000,
              emissiveIntensity: isSteel ? 0.1 : 0,
              transparent: columnOpacity < 1.0,
              opacity: columnOpacity
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
            
            // Store element type for damage visualization
            column.userData = {
              type: 'column',
              storyLevel: y,
              material: columnMaterial.clone(),
              originalColor: new THREE.Color(materialColor),
              stressMultiplier: 1.0 + (Math.random() * 0.2 - 0.1) // +/- 10% variation
            };
            
            // Initialize damage level
            elementDamageRef.current[column.uuid] = 0;
            
            // Add to scene
            sceneRef.current.add(column);
          }
        }
      }

      // Create beams with material-specific properties
      for (let x = 0; x < buildingParameters.columnsAlongLength; x++) {
        for (let z = 0; z < buildingParameters.columnsAlongWidth - 1; z++) {
          for (let y = 1; y <= numberOfStoreys; y++) {
            // Use actual beam dimensions from building parameters
            const beamGeometry = new THREE.BoxGeometry(
              beamWidth / 1000,
              beamHeight / 1000,
              buildingWidth / (buildingParameters.columnsAlongWidth - 1)
            );
            
            // Use material properties for visualization
            const beamMaterial = new THREE.MeshStandardMaterial({
              color: isSteel ? 
                new THREE.Color(materialColor).multiplyScalar(0.9).getHex() : // Slightly darker for steel
                materialColor,
              metalness: isSteel ? 0.5 : 0.1,
              roughness: isSteel ? 0.5 : 0.8,
              transparent: beamOpacity < 1.0,
              opacity: beamOpacity
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
            
            // Store element type for damage visualization
            beam.userData = {
              type: 'beam',
              storyLevel: y - 1,
              material: beamMaterial.clone(),
              originalColor: new THREE.Color(beamMaterial.color.getHex()),
              stressMultiplier: 1.0 + (Math.random() * 0.2 - 0.1) // +/- 10% variation
            };
            
            // Initialize damage level
            elementDamageRef.current[beam.uuid] = 0;
            
            // Add to scene
            sceneRef.current.add(beam);
          }
        }
      }

      // Create beams along length with material-specific properties
      for (let x = 0; x < buildingParameters.columnsAlongLength - 1; x++) {
        for (let z = 0; z < buildingParameters.columnsAlongWidth; z++) {
          for (let y = 1; y <= numberOfStoreys; y++) {
            // Use actual beam dimensions from building parameters
            const beamGeometry = new THREE.BoxGeometry(
              buildingLength / (buildingParameters.columnsAlongLength - 1),
              beamHeight / 1000,
              beamWidth / 1000
            );
            
            // Use material properties for visualization
            const beamMaterial = new THREE.MeshStandardMaterial({
              color: isSteel ? 
                new THREE.Color(materialColor).multiplyScalar(0.9).getHex() : // Slightly darker for steel
                materialColor,
              metalness: isSteel ? 0.5 : 0.1,
              roughness: isSteel ? 0.5 : 0.8,
              transparent: beamOpacity < 1.0,
              opacity: beamOpacity
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
            
            // Store element type for damage visualization
            beam.userData = {
              type: 'beam',
              storyLevel: y - 1,
              material: beamMaterial.clone(),
              originalColor: new THREE.Color(beamMaterial.color.getHex()),
              stressMultiplier: 1.0 + (Math.random() * 0.15 - 0.075) // +/- 7.5% variation
            };
            
            // Initialize damage level
            elementDamageRef.current[beam.uuid] = 0;
            
            // Add to scene
            sceneRef.current.add(beam);
          }
        }
      }

      // Create slabs with material-specific properties
      for (let y = 1; y <= numberOfStoreys; y++) {
        // Use actual slab thickness from building parameters
        const slabGeometry = new THREE.BoxGeometry(
          buildingLength,
          slabThickness / 1000,
          buildingWidth
        );
        
        // Use material properties for visualization
        const slabMaterial = new THREE.MeshStandardMaterial({
          color: isSteel ? '#e0e0e0' : '#d0d0d0', // Concrete-like for slabs
          metalness: 0.1,
          roughness: 0.9,
          transparent: true,
          opacity: 0.8
        });
        
        const slab = new THREE.Mesh(slabGeometry, slabMaterial);
        
        // Position slabs
        slab.position.set(
          buildingLength / 2,
          y * storyHeight + slabThickness / 2000,
          buildingWidth / 2
        );
        slab.castShadow = true;
        slab.receiveShadow = true;
        
        // Store original position
        originalPositionsRef.current[slab.uuid] = slab.position.clone();
        
        // Store element type for damage visualization
        slab.userData = {
          type: 'slab',
          storyLevel: y - 1,
          material: slabMaterial.clone(),
          originalColor: new THREE.Color(slabMaterial.color.getHex()),
          stressMultiplier: 1.0 + (Math.random() * 0.1 - 0.05) // +/- 5% variation
        };
        
        // Initialize damage level
        elementDamageRef.current[slab.uuid] = 0;
        
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
    // First check if component is still mounted
    if (!isMountedRef.current) return;
    
    // Cancel any existing animation frame before starting new simulation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsSimulating(true);
    setResults(null);
    
    // Reset damage values
    Object.keys(elementDamageRef.current).forEach(key => {
      elementDamageRef.current[key] = 0;
    });
    
    // Make sure we have a scene and renderer before starting
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
      console.error('Cannot start simulation: missing scene, renderer, or camera');
      if (isMountedRef.current) setIsSimulating(false);
      return;
    }
    
    // Reset building to original position if previous simulation was run
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
      }
    });
    
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
    
    // ===== Animation function for the earthquake =====
    const simulateEarthquake = () => {
      if (!isMountedRef.current) return;
      
      const elapsed = (Date.now() - startTime) / 1000; // Time elapsed in seconds
      
      // Calculate simulation progress as a percentage
      const progress = Math.min(elapsed / simulationDuration, 1.0);
      
      // Progressive damage factor increases over time
      const damageTimeFactor = progress * progress; // Non-linear increase
      
      // Apply motion to the building considering structural properties
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && originalPositionsRef.current[object.uuid]) {
            // Get original position
            const originalPos = originalPositionsRef.current[object.uuid];
            
            // Get story level (approximate from y position)
            const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
            const storyLevel = object.userData?.storyLevel !== undefined ? 
              object.userData.storyLevel : 
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
            
            // Track maximum displacements for each story for results
            if (storyLevel >= 0 && storyLevel < buildingParameters.numberOfStoreys) {
              const displacement = Math.sqrt(xOffset * xOffset + zOffset * zOffset);
              maxDisplacements[storyLevel] = Math.max(maxDisplacements[storyLevel], displacement);
              
              // Estimate story forces using F = k*x
              const storyStiffnessRatio = 1 - (storyLevel / buildingParameters.numberOfStoreys) * 0.5;
              storyForces[storyLevel] = stiffness * storyStiffnessRatio * displacement;
              
              // Calculate stress and damage for this element
              // Higher stories and connection points experience more stress
              const stressMultiplier = object.userData?.stressMultiplier || 1.0;
              const storyDamageMultiplier = 1 + (storyLevel / buildingParameters.numberOfStoreys);
              const materialDamageMultiplier = material.type === 'Concrete' ? 1.2 : 0.8; // Concrete cracks more easily
              
              // Calculate stress as percentage of maximum (0-1)
              const stress = Math.min(
                (displacement * stressMultiplier * storyDamageMultiplier * 
                materialDamageMultiplier * resonanceFactor) / 0.05, // 0.05m as max displacement
                1.0
              );
              
              // Accumulate damage - damage increases more rapidly as it gets worse
              // and after a lot of cycles (elapsed time)
              const existingDamage = elementDamageRef.current[object.uuid] || 0;
              let newDamage = existingDamage;
              
              if (object.userData.type === 'beam' || object.userData.type === 'column') {
                // Structural elements accumulate damage differently
                newDamage = Math.min(
                  existingDamage + 
                  (stress * stress * 0.002 * (1 + existingDamage * 5) * damageTimeFactor * stressMultiplier),
                  1.0
                );
              } else if (object.userData.type === 'slab') {
                // Slabs have different damage patterns
                newDamage = Math.min(
                  existingDamage + 
                  (stress * 0.001 * (1 + existingDamage * 3) * damageTimeFactor),
                  1.0
                );
              }
              
              // Update damage level
              elementDamageRef.current[object.uuid] = newDamage;
              
              // Apply visual damage indicators based on damage level
              if (newDamage > 0 && object.material instanceof THREE.MeshStandardMaterial) {
                // Update material color based on damage
                if (newDamage < 0.3) {
                  // Low damage - yellow tint
                  object.material.color.setRGB(
                    object.userData.originalColor.r * (1 + newDamage * 0.5),
                    object.userData.originalColor.g * (1 + newDamage * 0.3),
                    object.userData.originalColor.b * (1 - newDamage * 0.5)
                  );
                } else if (newDamage < 0.7) {
                  // Medium damage - orange tint
                  object.material.color.setRGB(
                    object.userData.originalColor.r * (1 + newDamage * 0.8),
                    object.userData.originalColor.g * (1 - newDamage * 0.3),
                    object.userData.originalColor.b * (1 - newDamage * 0.7)
                  );
                  
                  // Add some emissive glow for medium damage
                  object.material.emissive.setRGB(0.2, 0.05, 0);
                  object.material.emissiveIntensity = newDamage * 0.3;
                } else {
                  // High damage - red tint
                  object.material.color.setRGB(
                    object.userData.originalColor.r * (1 + newDamage * 0.5),
                    object.userData.originalColor.g * (1 - newDamage * 0.8),
                    object.userData.originalColor.b * (1 - newDamage * 0.8)
                  );
                  
                  // Stronger emissive glow for high damage
                  object.material.emissive.setRGB(0.3, 0, 0);
                  object.material.emissiveIntensity = newDamage * 0.5;
                }
              }
            }
            
            // Set new position with offset
            object.position.set(
              originalPos.x + (seismicParameters.direction !== 'z' ? xOffset : 0),
              originalPos.y,
              originalPos.z + (seismicParameters.direction !== 'x' ? zOffset : 0)
            );
          }
        });
      }
      
      // Continue the simulation if time hasn't elapsed and component is still mounted
      if (elapsed < simulationDuration && isMountedRef.current) {
        try {
          animationFrameRef.current = requestAnimationFrame(simulateEarthquake);
        } catch (error) {
          console.error('Error requesting animation frame:', error);
          // Safely end the simulation
          if (isMountedRef.current) setIsSimulating(false);
        }
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
  
  // Camera preset views
  const setCameraView = (viewName: string) => {
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
        cameraRef.current.lookAt(centerX, centerY, centerZ);
        break;
      case 'side': // Side view (Z-Y plane)
        cameraRef.current.position.set(centerX + buildingLength * 1.5, centerY, centerZ);
        cameraRef.current.lookAt(centerX, centerY, centerZ);
        break;
      case 'top': // Top view (X-Z plane)
        cameraRef.current.position.set(centerX, centerY + buildingHeight * 2, centerZ);
        cameraRef.current.lookAt(centerX, centerY, centerZ);
        break;
      case 'corner': // Corner/Isometric view
        cameraRef.current.position.set(
          centerX + buildingLength * 1.2, 
          centerY + buildingHeight * 0.8, 
          centerZ + buildingWidth * 1.2
        );
        cameraRef.current.lookAt(centerX, centerY, centerZ);
        break;
      case 'bottom': // View from below
        cameraRef.current.position.set(centerX, -buildingHeight * 0.5, centerZ);
        cameraRef.current.lookAt(centerX, centerY, centerZ);
        break;
      default: // Default view
        cameraRef.current.position.set(40, 30, 40);
        cameraRef.current.lookAt(centerX, centerY, centerZ);
        break;
    }
    
    setCurrentView(viewName);
    
    // Update camera
    cameraRef.current.updateProjectionMatrix();
  };

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
              <p className="text-gray-600">Loading 3D visualization...</p>
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
              <span className="font-medium">{(structuralResults.periodOfVibration || 0).toFixed(3)} s</span>
              
              <span>Weight:</span>
              <span className="font-medium">{((structuralResults.totalWeight || 0) / 1000).toFixed(1)} kN</span>
              
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
              <span>T = {(structuralResults.periodOfVibration || 0).toFixed(2)}s</span>
            )}
          </div>
        )}
      </div>
      
      {/* Simulation controls */}
      <div className="flex justify-between">
        <div className="flex space-x-2">
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
        
        <div>
          <button
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
            onClick={() => setShowDamageKey(!showDamageKey)}
          >
            {showDamageKey ? 'Hide Damage Legend' : 'Show Damage Legend'}
          </button>
        </div>
      </div>
      
      {/* Results section */}
      {results && (
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
                    <span className="font-medium">{(structuralResults.periodOfVibration || 0).toFixed(3)} s</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Earthquake Period:</span>
                    <span className="font-medium">{(1/seismicParameters.frequency).toFixed(3)} s</span>
                  </p>
                  {Math.abs(structuralResults.periodOfVibration - (1/seismicParameters.frequency)) < 0.1 && (
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
};

export default SeismicSimulationWrapper;