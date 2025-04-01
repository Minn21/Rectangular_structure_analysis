'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BuildingParameters, Material } from '@/lib/types';
import * as THREE from 'three';
// @ts-expect-error - OrbitControls types not available
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface RectangularStructureAnalysisProps {
  buildingParameters: BuildingParameters;
  material: Material;
  onElementSelect?: (element: StructuralElement) => void;
}

const RectangularStructureAnalysis: React.FC<RectangularStructureAnalysisProps> = ({
  buildingParameters,
  material,
  onElementSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showGridHelper, setShowGridHelper] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'wireframe' | 'solid' | 'realistic' | 'stress'>('realistic');
  const [explodedView, setExplodedView] = useState<boolean>(false);
  const [animateLoading, setAnimateLoading] = useState<boolean>(false);
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  
  // Add CSS styles for element labels and hover effects
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .element-label {
        position: absolute;
        color: black;
        background-color: rgba(255, 255, 255, 0.7);
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 10px;
        pointer-events: none;
        z-index: 100;
        transition: opacity 0.2s;
      }
      
      .element-label.hover {
        background-color: rgba(255, 255, 255, 0.9);
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Set up and render the Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera setup
    const width = mountRef.current.clientWidth;
    const height = 500; // Fixed height for visualization
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);
    
    // Environment map for reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Create a default environment with a gradient sky
    const skyColor = new THREE.Color(0x87ceeb); // Sky blue
    const groundColor = new THREE.Color(0xeeeeee); // Light gray
    const hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
    scene.add(hemisphereLight);
    
    // Create a default environment
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x87ceeb);
    const envMap = pmremGenerator.fromScene(scene2).texture;
    scene.environment = envMap;
    
    // Lighting
    // Ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light to simulate sun
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // Add a second directional light from opposite direction
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-50, 30, -50);
    scene.add(backLight);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Setup raycaster for element selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Event handler for element selection
    const handleElementSelect = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      // Get all meshes that represent structural elements
      const structuralElements = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.type) {
          structuralElements.push(child);
        }
      });
      
      const intersects = raycaster.intersectObjects(structuralElements);
      
      if (intersects.length > 0) {
        const selectedMesh = intersects[0].object as THREE.Mesh;
        
        // Reset all elements to their original material
        structuralElements.forEach((element) => {
          if (element instanceof THREE.Mesh) {
            if (element.userData.originalMaterial) {
              element.material = element.userData.originalMaterial.clone();
            }
          }
        });
        
        // Highlight selected element
        if (!selectedMesh.userData.originalMaterial) {
          selectedMesh.userData.originalMaterial = selectedMesh.material;
        }
        
        const highlightMaterial = (selectedMesh.userData.originalMaterial as THREE.Material).clone();
        if (highlightMaterial instanceof THREE.MeshStandardMaterial) {
          highlightMaterial.emissive.setHex(0x666666);
          highlightMaterial.emissiveIntensity = 0.5;
        }
        selectedMesh.material = highlightMaterial;
        
        // Create structural element data
        const elementData: StructuralElement = {
          id: selectedMesh.userData.elementId,
          type: selectedMesh.userData.type,
          position: selectedMesh.position.clone(),
          orientation: selectedMesh.userData.orientation || 'x',
          floor: selectedMesh.userData.floor || 0,
          length: selectedMesh.userData.length || 0,
          isSelected: true
        };
        
        // Notify parent component
        if (onElementSelect) {
          onElementSelect(elementData);
        }
      }
    };
    
    // Add click event listener
    renderer.domElement.addEventListener('click', handleElementSelect);
    
    // Create a stress heat map texture for stress visualization
    const createStressTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (!context) return null;
      
      const gradient = context.createLinearGradient(0, 0, 256, 0);
      gradient.addColorStop(0, 'blue');    // Low stress
      gradient.addColorStop(0.33, 'green');
      gradient.addColorStop(0.66, 'yellow');
      gradient.addColorStop(1, 'red');     // High stress
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 1);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };
    
    const stressTexture = createStressTexture();
    
    // Helper functions to build the structure
    const createStructure = () => {
      // Extract parameters
      const { 
        buildingLength, 
        buildingWidth, 
        buildingHeight, 
        numberOfStoreys, 
        columnsAlongLength, 
        columnsAlongWidth,
        slabThickness
      } = buildingParameters;
      
      // Create building group
      const buildingGroup = new THREE.Group();
      
      // Floor
      const floorGeometry = new THREE.BoxGeometry(
        buildingLength + 10, 
        0.5, 
        buildingWidth + 10
      );
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xaaaaaa,
        roughness: 0.7,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.set(0, -0.25, 0);
      floor.receiveShadow = true;
      buildingGroup.add(floor);
      
      // Grid helper
      if (showGridHelper) {
        const gridHelper = new THREE.GridHelper(
          Math.max(buildingLength, buildingWidth) + 20, 
          20, 
          0x888888, 
          0xcccccc
        );
        gridHelper.position.y = 0.01;
        buildingGroup.add(gridHelper);
      }
      
      // Axes helper
      if (showAxes) {
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.position.y = 0.01;
        buildingGroup.add(axesHelper);
      }
      
      // Calculate derived dimensions
      const storyHeight = buildingHeight / numberOfStoreys;
      const columnSpacingLength = buildingLength / (columnsAlongLength - 1);
      const columnSpacingWidth = buildingWidth / (columnsAlongWidth - 1);
      
      // Determine material color and properties
      let buildingColor;
      let materialRoughness;
      let materialMetalness;
      
      switch(material.type) {
        case 'Steel':
          buildingColor = 0x8c8c8c;
          materialRoughness = 0.3;
          materialMetalness = 0.8;
          break;
        case 'Concrete':
          buildingColor = 0xd6d6d6;
          materialRoughness = 0.7;
          materialMetalness = 0.1;
          break;
        case 'Timber':
          buildingColor = 0xc19a6b;
          materialRoughness = 0.8;
          materialMetalness = 0;
          break;
        default:
          buildingColor = 0xaaaaaa;
          materialRoughness = 0.5;
          materialMetalness = 0.2;
      }
      
      // Create material based on view mode
      let buildingMaterial;
      switch(viewMode) {
        case 'wireframe':
          buildingMaterial = new THREE.MeshBasicMaterial({ 
            color: buildingColor,
            wireframe: true
          });
          break;
        case 'solid':
          buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: buildingColor
          });
          break;
        case 'stress':
          if (stressTexture) {
            const stressVertexShader = `
              varying vec2 vUv;
              varying float vStress;
              
              // Enhanced stress simulation considering multiple factors
              void main() {
                vUv = uv;
                
                // Calculate base stress from height and position
                float heightStress = position.y / ${buildingHeight.toFixed(1)};
                float distanceFromCenter = length(position.xz) / ${(Math.max(buildingParameters.buildingLength, buildingParameters.buildingWidth) / 2).toFixed(1)};
                
                // Combine factors with different weights
                vStress = mix(heightStress, distanceFromCenter, 0.3);
                
                // Add slight variation based on position
                vStress = clamp(vStress + sin(position.x * 2.0) * 0.1 + cos(position.z * 2.0) * 0.1, 0.0, 1.0);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `;
            
            const stressFragmentShader = `
              uniform sampler2D heatmapTexture;
              varying vec2 vUv;
              varying float vStress;
              
              void main() {
                // Enhanced color mapping with smoother transitions
                vec2 stressCoord = vec2(smoothstep(0.0, 1.0, vStress), 0.5);
                vec4 color = texture2D(heatmapTexture, stressCoord);
                
                // Add slight ambient occlusion effect
                float ao = 1.0 - vStress * 0.2;
                gl_FragColor = vec4(color.rgb * ao, color.a);
              }
            `;
            
            buildingMaterial = new THREE.ShaderMaterial({
              uniforms: {
                heatmapTexture: { value: stressTexture }
              },
              vertexShader: stressVertexShader,
              fragmentShader: stressFragmentShader,
              side: THREE.DoubleSide
            });
          } else {
            // Fallback if shader compilation fails
            buildingMaterial = new THREE.MeshBasicMaterial({
              color: 0xff0000,
              wireframe: false
            });
          }
          break;
        case 'realistic':
        default:
          buildingMaterial = new THREE.MeshStandardMaterial({ 
            color: buildingColor,
            roughness: materialRoughness,
            metalness: materialMetalness,
            envMapIntensity: 1.0
          });
      }
      
      // Create columns
      const columnWidth = buildingParameters.columnWidth / 1000; // Convert mm to m
      const columnDepth = buildingParameters.columnDepth / 1000; // Convert mm to m
      const columnGeometry = new THREE.BoxGeometry(
        columnWidth, 
        buildingHeight, 
        columnDepth
      );
      
      // Create columns with labels and selection
      for (let i = 0; i < columnsAlongLength; i++) {
        for (let j = 0; j < columnsAlongWidth; j++) {
          const column = new THREE.Mesh(columnGeometry, buildingMaterial);
          const x = -buildingLength / 2 + i * columnSpacingLength;
          const z = -buildingWidth / 2 + j * columnSpacingWidth;
          column.position.set(x, buildingHeight / 2, z);
          column.castShadow = true;
          column.receiveShadow = true;
          
          // Add column to structural elements array if not exists
          const columnId = `C${i+1}-${j+1}`;
          column.name = columnId;
          column.userData.type = 'column';
          column.userData.elementId = columnId;
          
          // Create label for column
          const columnLabel = document.createElement('div');
          columnLabel.className = 'element-label';
          columnLabel.textContent = columnId;
          columnLabel.style.position = 'absolute';
          columnLabel.style.color = 'black';
          columnLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          columnLabel.style.padding = '2px 5px';
          columnLabel.style.borderRadius = '3px';
          columnLabel.style.fontSize = '10px';
          columnLabel.style.pointerEvents = 'none';
          
          if (mountRef.current) {
            mountRef.current.appendChild(columnLabel);
          }
          
          // Store label in column's userData for position updates
          column.userData.label = columnLabel;
          
          buildingGroup.add(column);
        }
      }
      
      // Create slabs for each storey
      const slabThicknessMeters = slabThickness / 1000; // Convert mm to m
      const slabGeometry = new THREE.BoxGeometry(
        buildingLength, 
        slabThicknessMeters, 
        buildingWidth
      );
      
      for (let floor = 0; floor <= numberOfStoreys; floor++) {
        const slab = new THREE.Mesh(slabGeometry, buildingMaterial);
        const y = floor * storyHeight;
        slab.position.set(0, y, 0);
        slab.castShadow = true;
        slab.receiveShadow = true;
        buildingGroup.add(slab);
      }
      
      // Create beams
      const beamWidth = buildingParameters.beamWidth / 1000; // Convert mm to m
      const beamHeight = buildingParameters.beamHeight / 1000; // Convert mm to m
      
      // Along length
      for (let floor = 1; floor <= numberOfStoreys; floor++) {
        for (let j = 0; j < columnsAlongWidth; j++) {
          const beamGeometry = new THREE.BoxGeometry(
            buildingLength,
            beamHeight,
            beamWidth
          );
          
          const beam = new THREE.Mesh(beamGeometry, buildingMaterial);
          const y = floor * storyHeight - beamHeight / 2 - slabThicknessMeters / 2;
          const z = -buildingWidth / 2 + j * columnSpacingWidth;
          
          beam.position.set(0, y, z);
          beam.castShadow = true;
          beam.receiveShadow = true;
          
          // Add beam to structural elements array if not exists
          const beamId = `BL${floor}-${j+1}`; // BL for Beam-Length direction
          beam.name = beamId;
          beam.userData.type = 'beam';
          beam.userData.elementId = beamId;
          beam.userData.orientation = 'x';
          beam.userData.floor = floor;
          beam.userData.length = buildingLength;
          
          // Create label for beam
          const beamLabel = document.createElement('div');
          beamLabel.className = 'element-label';
          beamLabel.textContent = beamId;
          beamLabel.style.position = 'absolute';
          beamLabel.style.color = 'black';
          beamLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          beamLabel.style.padding = '2px 5px';
          beamLabel.style.borderRadius = '3px';
          beamLabel.style.fontSize = '10px';
          beamLabel.style.pointerEvents = 'none';
          
          if (mountRef.current) {
            mountRef.current.appendChild(beamLabel);
          }
          
          // Store label in beam's userData for position updates
          beam.userData.label = beamLabel;
          
          buildingGroup.add(beam);
        }
      }
      
      // Along width
      for (let floor = 1; floor <= numberOfStoreys; floor++) {
        for (let i = 0; i < columnsAlongLength; i++) {
          const beamGeometry = new THREE.BoxGeometry(
            beamWidth,
            beamHeight,
            buildingWidth
          );
          
          const beam = new THREE.Mesh(beamGeometry, buildingMaterial);
          const x = -buildingLength / 2 + i * columnSpacingLength;
          const y = floor * storyHeight - beamHeight / 2 - slabThicknessMeters / 2;
          
          beam.position.set(x, y, 0);
          beam.castShadow = true;
          beam.receiveShadow = true;
          
          // Add beam to structural elements array if not exists
          const beamId = `BW${floor}-${i+1}`; // BW for Beam-Width direction
          beam.name = beamId;
          beam.userData.type = 'beam';
          beam.userData.elementId = beamId;
          beam.userData.orientation = 'z';
          beam.userData.floor = floor;
          beam.userData.length = buildingWidth;
          
          // Create label for beam
          const beamLabel = document.createElement('div');
          beamLabel.className = 'element-label';
          beamLabel.textContent = beamId;
          beamLabel.style.position = 'absolute';
          beamLabel.style.color = 'black';
          beamLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          beamLabel.style.padding = '2px 5px';
          beamLabel.style.borderRadius = '3px';
          beamLabel.style.fontSize = '10px';
          beamLabel.style.pointerEvents = 'none';
          
          if (mountRef.current) {
            mountRef.current.appendChild(beamLabel);
          }
          
          // Store label in beam's userData for position updates
          beam.userData.label = beamLabel;
          
          buildingGroup.add(beam);
        }
      }
      
      // Add dimensions if enabled
      if (showDimensions) {
        // Create dimension lines and labels
        const createDimensionLine = (start: THREE.Vector3, end: THREE.Vector3, labelText: string, offset: THREE.Vector3) => {
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
          const points = [start, end];
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          buildingGroup.add(line);
          
          // Create label using HTML and CSS
          const labelDiv = document.createElement('div');
          labelDiv.className = 'dimension-label';
          labelDiv.textContent = labelText;
          labelDiv.style.position = 'absolute';
          labelDiv.style.color = 'black';
          labelDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          labelDiv.style.padding = '2px 5px';
          labelDiv.style.borderRadius = '3px';
          labelDiv.style.fontSize = '10px';
          labelDiv.style.pointerEvents = 'none';
          labelDiv.style.zIndex = '100'; // Ensure the labels stay on top
          
          // Position will be updated in the animation loop
          if (mountRef.current) {
            mountRef.current.appendChild(labelDiv);
          }
          
          // Store the label and its target position for updates
          return {
            element: labelDiv,
            position: new THREE.Vector3(
              (start.x + end.x) / 2 + offset.x,
              (start.y + end.y) / 2 + offset.y,
              (start.z + end.z) / 2 + offset.z
            )
          };
        };
        
        // Create dimensions for length, width, and height
        const lengthStart = new THREE.Vector3(-buildingLength/2, 0, buildingWidth/2 + 1);
        const lengthEnd = new THREE.Vector3(buildingLength/2, 0, buildingWidth/2 + 1);
        const lengthLabel = createDimensionLine(lengthStart, lengthEnd, `Length: ${buildingLength}m`, new THREE.Vector3(0, 0.5, 0));
        
        const widthStart = new THREE.Vector3(buildingLength/2 + 1, 0, -buildingWidth/2);
        const widthEnd = new THREE.Vector3(buildingLength/2 + 1, 0, buildingWidth/2);
        const widthLabel = createDimensionLine(widthStart, widthEnd, `Width: ${buildingWidth}m`, new THREE.Vector3(0.5, 0.5, 0));
        
        const heightStart = new THREE.Vector3(-buildingLength/2 - 1, 0, -buildingWidth/2);
        const heightEnd = new THREE.Vector3(-buildingLength/2 - 1, buildingHeight, -buildingWidth/2);
        const heightLabel = createDimensionLine(heightStart, heightEnd, `Height: ${buildingHeight}m`, new THREE.Vector3(-0.5, 0, 0));
        
        // Labels array to update in animation loop
        const dimensionLabels = [lengthLabel, widthLabel, heightLabel];
        
        // Update label positions in animation loop
        const updateLabelPositions = () => {
          dimensionLabels.forEach(label => {
            const screenPosition = label.position.clone().project(camera);
            const x = (screenPosition.x * 0.5 + 0.5) * width;
            const y = (-(screenPosition.y * 0.5) + 0.5) * height;
            
            label.element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
          });
        };
        
        // Add to animation loop
        const origRender = renderer.render;
        renderer.render = function(scene, camera) {
          updateLabelPositions();
          origRender.call(this, scene, camera);
        };
      }
      
      return buildingGroup;
    };
    
    // Create and add building structure
    const buildingGroup = createStructure();
    scene.add(buildingGroup);
    
    // Function to update exploded view with enhanced animation
    const updateExplodedView = (factor: number) => {
      if (!buildingGroup) return;
      
      // Reset all positions first
      let elementIndex = 0;
      const time = Date.now() * 0.001; // Current time in seconds
      
      // Process each element in the building group
      buildingGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Store original position and properties if not stored
          if (!child.userData.originalPosition) {
            child.userData.originalPosition = child.position.clone();
            child.userData.originalRotation = child.rotation.clone();
            child.userData.originalScale = child.scale.clone();
            child.userData.elementIndex = elementIndex++;
            
            // Calculate unique phase offset based on position
            child.userData.phaseOffset = Math.random() * Math.PI * 2;
            
            // Determine direction vector from center with Y-bias
            const dirFromCenter = new THREE.Vector3()
              .copy(child.position)
              .normalize();
            // Add upward bias to the explosion direction
            dirFromCenter.y += 0.3;
            dirFromCenter.normalize();
            
            child.userData.explodeDir = dirFromCenter;
            
            // Add random rotation axis
            child.userData.rotationAxis = new THREE.Vector3(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5
            ).normalize();
          }
          
          const originalPos = child.userData.originalPosition;
          const explodeDir = child.userData.explodeDir;
          const phaseOffset = child.userData.phaseOffset;
          
          if (originalPos && explodeDir) {
            // Apply elastic easing to the explosion factor
            const elasticFactor = factor * (1 + Math.sin(time * 2 + phaseOffset) * 0.1);
            
            // Calculate position with smooth transition
            child.position.copy(originalPos).add(
              explodeDir.clone().multiplyScalar(elasticFactor * 1.5)
            );
            
            // Apply rotation based on explosion factor
            if (factor > 0) {
              const rotationAmount = factor * Math.PI * 0.5;
              child.rotation.copy(child.userData.originalRotation);
              child.rotateOnAxis(child.userData.rotationAxis, rotationAmount);
              
              // Add subtle oscillation to rotation
              const oscillation = Math.sin(time * 3 + phaseOffset) * 0.1 * factor;
              child.rotateX(oscillation);
              child.rotateZ(oscillation);
            } else {
              child.rotation.copy(child.userData.originalRotation);
            }
            
            // Apply subtle scale animation
            const scaleFactor = 1 + Math.sin(time * 4 + phaseOffset) * 0.05 * factor;
            child.scale.copy(child.userData.originalScale).multiplyScalar(scaleFactor);
          }
        }
      });
    };
    
    // Animation for loading simulation
    const animateLoadingEffect = (time: number) => {
      if (!buildingGroup || !animateLoading) return;
      
      const frequency = 2; // Hz
      const amplitude = 0.03; // meters
      const deflection = Math.sin(time * frequency) * amplitude;
      
      buildingGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.userData.originalPosition) {
            child.userData.originalPosition = child.position.clone();
          }
          
          const originalPos = child.userData.originalPosition;
          if (originalPos) {
            // Apply sinusoidal deflection based on Y position and element type
            let deflectionFactor = child.position.y / buildingParameters.buildingHeight;
            
            // Enhance deflection for beams and slabs
            if (child.name.includes('beam') || child.name.includes('slab')) {
              deflectionFactor *= 1.5;
            }
            
            // Apply horizontal sway for columns
            if (child.name.includes('column')) {
              const horizontalDeflection = Math.sin(time * frequency * 0.5) * amplitude * 0.5;
              child.position.x = originalPos.x + horizontalDeflection * deflectionFactor;
            }
            
            // Vertical deflection
            const verticalOffset = deflection * deflectionFactor;
            child.position.y = originalPos.y + verticalOffset;
          }
        }
      });
    };
    
    // Animation loop with clock for time-based animations
    const clock = new THREE.Clock();
    let animationFrameId: number;
    
    const animate = () => {
      const time = clock.getElapsedTime();
      
      // Apply exploded view
      if (explodedView) {
        updateExplodedView(explodeFactor);
      } else {
        updateExplodedView(0);
      }
      
      // Apply loading animation
      if (animateLoading) {
        animateLoadingEffect(time);
      }
      
      // Update element labels
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.label) {
          const screenPosition = child.position.clone().project(camera);
          const x = (screenPosition.x * 0.5 + 0.5) * width;
          const y = (-(screenPosition.y * 0.5) + 0.5) * height;
          child.userData.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
          
          // Show/hide label based on element visibility
          const vector = new THREE.Vector3();
          vector.setFromMatrixPosition(child.matrixWorld);
          vector.project(camera);
          
          if (vector.z < 1) {
            child.userData.label.style.display = 'block';
          } else {
            child.userData.label.style.display = 'none';
          }
        }
      });
      
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Capture the current value of the ref for cleanup
    const currentMountRef = mountRef.current;
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      
      // Remove element labels and cleanup DOM nodes
      const cleanupLabels = () => {
        if (!currentMountRef) return;
        
        // First remove all element labels
        const elementLabels = currentMountRef.getElementsByClassName('element-label');
        Array.from(elementLabels).forEach(label => {
          if (label.parentNode === currentMountRef) {
            currentMountRef.removeChild(label);
          }
        });
        
        // Then remove dimension labels
        const dimensionLabels = currentMountRef.getElementsByClassName('dimension-label');
        Array.from(dimensionLabels).forEach(label => {
          if (label.parentNode === currentMountRef) {
            currentMountRef.removeChild(label);
          }
        });
      };
      
      // Remove event listeners
      renderer.domElement.removeEventListener('click', handleElementSelect);
      window.removeEventListener('resize', handleResize);
      
      // Clean up DOM nodes
      cleanupLabels();
      
      // Remove renderer element
      if (currentMountRef && renderer.domElement && currentMountRef.contains(renderer.domElement)) {
        currentMountRef.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js resources
      scene.traverse((object) => {
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
      
      if (stressTexture) stressTexture.dispose();
      if (envMap) envMap.dispose();
      pmremGenerator.dispose();
      
      renderer.dispose();
    };
  }, [buildingParameters, material, viewMode, showGridHelper, showAxes, showDimensions, explodedView, explodeFactor, animateLoading]);
  
  return (
    <div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            View Mode
          </label>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'wireframe' | 'solid' | 'realistic' | 'stress')}
            aria-label="View mode"
          >
            <option value="realistic">Realistic</option>
            <option value="solid">Solid</option>
            <option value="wireframe">Wireframe</option>
            <option value="stress">Stress Analysis</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exploded View
          </label>
          <div className="flex items-center gap-2">
            <input
              id="exploded-view"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={explodedView}
              onChange={(e) => setExplodedView(e.target.checked)}
              aria-label="Exploded view"
            />
            {explodedView && (
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={explodeFactor}
                onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                className="w-24"
                aria-label="Explode factor"
              />
            )}
          </div>
        </div>
        
        <div className="flex items-end">
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              animateLoading 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={() => setAnimateLoading(!animateLoading)}
            aria-label={animateLoading ? "Stop animation" : "Animate loading"}
          >
            {animateLoading ? "Stop Animation" : "Animate Loading"}
          </button>
        </div>
        
        <div className="flex items-end gap-4">
          <div className="flex items-center">
            <input
              id="show-dimensions"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              aria-label="Show dimensions"
            />
            <label htmlFor="show-dimensions" className="ml-2 text-sm text-gray-700">
              Show Dimensions
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="show-grid"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={showGridHelper}
              onChange={(e) => setShowGridHelper(e.target.checked)}
              aria-label="Show grid"
            />
            <label htmlFor="show-grid" className="ml-2 text-sm text-gray-700">
              Show Grid
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="show-axes"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={showAxes}
              onChange={(e) => setShowAxes(e.target.checked)}
              aria-label="Show axes"
            />
            <label htmlFor="show-axes" className="ml-2 text-sm text-gray-700">
              Show Axes
            </label>
          </div>
        </div>
      </div>
      
      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <div ref={mountRef} className="w-full h-full" />
        <div className="absolute bottom-3 right-3 text-xs text-gray-600 bg-white bg-opacity-70 p-1 rounded">
          <p>Drag to rotate | Scroll to zoom | Shift+drag to pan</p>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-medium">Advanced Visualization Options:</h4>
        <ul className="list-disc list-inside mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          <li><strong>Stress Analysis:</strong> Color gradient shows simulated stress distribution</li>
          <li><strong>Exploded View:</strong> Separate building components for detailed examination</li>
          <li><strong>Animation:</strong> Simulate building deflection under loading</li>
          <li><strong>Realistic Rendering:</strong> View with material-specific shading and reflections</li>
        </ul>
      </div>
    </div>
  );
};

export default RectangularStructureAnalysis;