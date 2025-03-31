'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BuildingParameters, Material, SeismicParameters } from '@/lib/types';
import * as THREE from 'three';
// @ts-expect-error - OrbitControls types not available
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface SeismicSimulationProps {
  buildingParameters: BuildingParameters;
  material: Material;
  seismicParameters: SeismicParameters;
  onSimulationComplete?: (results: SeismicAnalysisResults) => void;
}

interface SeismicAnalysisResults {
  maxDisplacement: number;
  baseShear: number;
  storyDrifts: number[];
  periodOfVibration: number;
  spectralAcceleration: number;
  criticalElements: {
    type: string;
    id: string;
    stressRatio: number;
    location: THREE.Vector3;
  }[];
  modalProperties?: {
    frequencies: number[];
    participationFactors: number[];
    modalShapes: number[][];
  };
}

const SeismicSimulation: React.FC<SeismicSimulationProps> = ({
  buildingParameters,
  material,
  seismicParameters,
  onSimulationComplete
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [simulationResults, setSimulationResults] = useState<SeismicAnalysisResults | null>(null);
  const [showStressDiagram, setShowStressDiagram] = useState<boolean>(true);
  
  // Calculate natural period and modal properties
  const calculateModalProperties = (): {
    naturalPeriod: number;
    modalShapes: number[][];
    frequencies: number[];
    participationFactors: number[];
  } => {
    const numModes = Math.min(3, buildingParameters.numberOfStoreys); // Consider first 3 modes
    const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
    const modalShapes: number[][] = [];
    const frequencies: number[] = [];
    const participationFactors: number[] = [];
    
    // Calculate stiffness matrix (simplified)
    const EI = material.elasticModulus * calculateMomentOfInertia();
    const k = EI / Math.pow(storyHeight, 3);
    
    // Calculate mass matrix (simplified lumped mass)
    const storyMass = calculateBuildingWeight() / (buildingParameters.numberOfStoreys * 9.81);
    
    for (let mode = 0; mode < numModes; mode++) {
      // Simplified modal shape calculation
      const modeShape = Array(buildingParameters.numberOfStoreys).fill(0)
        .map((_, i) => Math.sin((mode + 1) * Math.PI * (i + 1) / buildingParameters.numberOfStoreys));
      
      // Natural frequency calculation (simplified)
      const frequency = (mode + 1) * Math.sqrt(k / storyMass) / (2 * Math.PI);
      
      // Modal participation factor calculation
      const numerator = modeShape.reduce((sum, φi) => sum + φi * storyMass, 0);
      const denominator = modeShape.reduce((sum, φi) => sum + φi * φi * storyMass, 0);
      const participationFactor = numerator / denominator;
      
      modalShapes.push(modeShape);
      frequencies.push(frequency);
      participationFactors.push(participationFactor);
    }
    
    // Fundamental period
    const naturalPeriod = 1 / frequencies[0];
    
    return {
      naturalPeriod,
      modalShapes,
      frequencies,
      participationFactors
    };
  };
  
  // Calculate base shear using equivalent lateral force procedure
  const calculateBaseShear = (): number => {
    // V = C_s * W where C_s is seismic response coefficient and W is building weight
    const buildingWeight = calculateBuildingWeight();
    const responseCoefficient = calculateSeismicResponseCoefficient();
    
    return responseCoefficient * buildingWeight;
  };
  
  // Calculate building weight
  const calculateBuildingWeight = (): number => {
    const volume = buildingParameters.buildingLength * 
                  buildingParameters.buildingWidth * 
                  buildingParameters.buildingHeight;
    return volume * material.density * 9.81 / 1000; // Convert to kN
  };
  
  // Calculate seismic response coefficient based on seismic parameters
  const calculateSeismicResponseCoefficient = (): number => {
    const naturalPeriod = calculateNaturalPeriod();
    
    // Simplified calculation based on spectral acceleration and importance factor
    const spectralAcceleration = seismicParameters.spectralAcceleration;
    const importanceFactor = seismicParameters.importanceFactor;
    const responseModificationFactor = seismicParameters.responseModificationFactor;
    
    return (spectralAcceleration * importanceFactor) / responseModificationFactor;
  };
  
  // Calculate story drift for each floor
  const calculateStoryDrifts = (): number[] => {
    const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
    const drifts: number[] = [];
    
    // Simplified calculation - in reality would use structural analysis
    const baseShear = calculateBaseShear();
    const EI = material.elasticModulus * calculateMomentOfInertia();
    
    for (let i = 0; i < buildingParameters.numberOfStoreys; i++) {
      const height = (i + 1) * storyHeight;
      // Approximate lateral displacement at each floor
      // Using simplified cantilever beam analogy
      const displacement = (baseShear * Math.pow(height, 3)) / (3 * EI);
      
      // Story drift is difference in displacement between floors
      if (i === 0) {
        drifts.push(displacement);
      } else {
        const prevHeight = i * storyHeight;
        const prevDisplacement = (baseShear * Math.pow(prevHeight, 3)) / (3 * EI);
        drifts.push(displacement - prevDisplacement);
      }
    }
    
    return drifts;
  };
  
  // Calculate moment of inertia for the building (simplified)
  const calculateMomentOfInertia = (): number => {
    // Simplified calculation using rectangular cross-section
    const width = buildingParameters.buildingWidth;
    const depth = buildingParameters.buildingLength;
    
    // I = (1/12) * b * h^3
    return (1/12) * width * Math.pow(depth, 3);
  };
  
  // Identify critical structural elements based on stress ratios
  const identifyCriticalElements = (): SeismicAnalysisResults['criticalElements'] => {
    const criticalElements: SeismicAnalysisResults['criticalElements'] = [];
    
    // Simplified identification of critical elements
    // In a real implementation, this would be based on detailed structural analysis
    
    // Example: Corner columns typically experience higher stresses
    const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
    
    // Add corner columns as critical elements
    for (let floor = 0; floor < buildingParameters.numberOfStoreys; floor++) {
      const z = floor * storyHeight;
      
      // Calculate stress ratio based on height (lower floors have higher stress)
      const stressRatio = 1 - (floor / buildingParameters.numberOfStoreys) * 0.6;
      
      // Add corner columns
      criticalElements.push(
        {
          type: 'column',
          id: `column_0_0_${floor}`,
          stressRatio,
          location: new THREE.Vector3(0, z, 0)
        },
        {
          type: 'column',
          id: `column_0_${buildingParameters.columnsAlongWidth-1}_${floor}`,
          stressRatio,
          location: new THREE.Vector3(0, z, buildingParameters.buildingWidth)
        },
        {
          type: 'column',
          id: `column_${buildingParameters.columnsAlongLength-1}_0_${floor}`,
          stressRatio,
          location: new THREE.Vector3(buildingParameters.buildingLength, z, 0)
        },
        {
          type: 'column',
          id: `column_${buildingParameters.columnsAlongLength-1}_${buildingParameters.columnsAlongWidth-1}_${floor}`,
          stressRatio,
          location: new THREE.Vector3(buildingParameters.buildingLength, z, buildingParameters.buildingWidth)
        }
      );
    }
    
    return criticalElements;
  };
  
  // Run the seismic analysis and generate results
  const runSeismicAnalysis = () => {
    setIsSimulating(true);
    
    // Calculate modal properties
    const modalProperties = calculateModalProperties();
    const baseShear = calculateBaseShear();
    const storyDrifts = calculateStoryDrifts();
    const criticalElements = identifyCriticalElements();
    
    // Calculate maximum displacement (at top of building)
    const maxDisplacement = storyDrifts.reduce((sum, drift) => sum + drift, 0);
    
    // Calculate dynamic amplification based on modal participation
    const dynamicAmplification = modalProperties.participationFactors.reduce((max, factor) => 
      Math.max(max, Math.abs(factor)), 1);
    
    // Adjust displacement and story drifts for dynamic effects
    const amplifiedDisplacement = maxDisplacement * dynamicAmplification;
    const amplifiedStoryDrifts = storyDrifts.map(drift => drift * dynamicAmplification);
    
    // Create results object with enhanced analysis data
    const results: SeismicAnalysisResults = {
      maxDisplacement: amplifiedDisplacement,
      baseShear: baseShear * dynamicAmplification, // Account for dynamic effects
      storyDrifts: amplifiedStoryDrifts,
      periodOfVibration: modalProperties.naturalPeriod,
      spectralAcceleration: seismicParameters.spectralAcceleration,
      criticalElements,
      modalProperties: {
        frequencies: modalProperties.frequencies,
        participationFactors: modalProperties.participationFactors,
        modalShapes: modalProperties.modalShapes
      }
    };
    
    setSimulationResults(results);
    
    // Notify parent component if callback provided
    if (onSimulationComplete) {
      onSimulationComplete(results);
    }
    
    // End simulation after calculations
    setTimeout(() => {
      setIsSimulating(false);
    }, 1000);
  };
  
  // Set up and render the Three.js scene for visualization
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
    mountRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Create building structure
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    
    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(
      buildingParameters.buildingLength * 3,
      buildingParameters.buildingWidth * 3
    );
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x999999,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Create building structure
    const createBuilding = () => {
      // Clear previous building
      while(buildingGroup.children.length > 0) { 
        buildingGroup.remove(buildingGroup.children[0]); 
      }
      
      const { 
        buildingLength, 
        buildingWidth, 
        buildingHeight,
        numberOfStoreys,
        columnsAlongLength,
        columnsAlongWidth,
        beamWidth,
        beamHeight,
        columnWidth,
        columnDepth,
        slabThickness
      } = buildingParameters;
      
      const storyHeight = buildingHeight / numberOfStoreys;
      
      // Create columns
      const columnMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(material.color),
        roughness: material.roughness || 0.5,
        metalness: material.metalness || 0.2
      });
      
      // Calculate spacing
      const lengthSpacing = buildingLength / (columnsAlongLength - 1);
      const widthSpacing = buildingWidth / (columnsAlongWidth - 1);
      
      // Create columns
      for (let i = 0; i < columnsAlongLength; i++) {
        for (let j = 0; j < columnsAlongWidth; j++) {
          for (let k = 0; k < numberOfStoreys; k++) {
            const columnGeometry = new THREE.BoxGeometry(columnWidth / 1000, storyHeight, columnDepth / 1000);
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            
            column.position.set(
              i * lengthSpacing,
              k * storyHeight + storyHeight / 2,
              j * widthSpacing
            );
            
            column.castShadow = true;
            column.receiveShadow = true;
            
            // Store column data for analysis
            column.userData = {
              type: 'column',
              elementId: `column_${i}_${j}_${k}`,
              floor: k
            };
            
            buildingGroup.add(column);
          }
        }
      }
      
      // Create beams
      const beamMaterial = columnMaterial.clone();
      
      // Create beams along length
      for (let j = 0; j < columnsAlongWidth; j++) {
        for (let k = 0; k < numberOfStoreys; k++) {
          const beamGeometry = new THREE.BoxGeometry(buildingLength, beamHeight / 1000, beamWidth / 1000);
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          
          beam.position.set(
            buildingLength / 2,
            (k + 1) * storyHeight,
            j * widthSpacing
          );
          
          beam.castShadow = true;
          beam.receiveShadow = true;
          
          // Store beam data for analysis
          beam.userData = {
            type: 'beam',
            elementId: `beam_length_${j}_${k}`,
            floor: k,
            orientation: 'x'
          };
          
          buildingGroup.add(beam);
        }
      }
      
      // Create beams along width
      for (let i = 0; i < columnsAlongLength; i++) {
        for (let k = 0; k < numberOfStoreys; k++) {
          const beamGeometry = new THREE.BoxGeometry(beamWidth / 1000, beamHeight / 1000, buildingWidth);
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          
          beam.position.set(
            i * lengthSpacing,
            (k + 1) * storyHeight,
            buildingWidth / 2
          );
          
          beam.castShadow = true;
          beam.receiveShadow = true;
          
          // Store beam data for analysis
          beam.userData = {
            type: 'beam',
            elementId: `beam_width_${i}_${k}`,
            floor: k,
            orientation: 'z'
          };
          
          buildingGroup.add(beam);
        }
      }
      
      // Create slabs
      const slabMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.1
      });
      
      for (let k = 0; k < numberOfStoreys; k++) {
        const slabGeometry = new THREE.BoxGeometry(
          buildingLength,
          slabThickness / 1000,
          buildingWidth
        );
        const slab = new THREE.Mesh(slabGeometry, slabMaterial);
        
        slab.position.set(
          buildingLength / 2,
          (k + 1) * storyHeight + (beamHeight / 2000) + (slabThickness / 2000),
          buildingWidth / 2
        );
        
        slab.receiveShadow = true;
        
        // Store slab data
        slab.userData = {
          type: 'slab',
          elementId: `slab_${k}`,
          floor: k
        };
        
        buildingGroup.add(slab);
      }
      
      // Center the building
      buildingGroup.position.set(-buildingLength / 2, 0, -buildingWidth / 2);
    };
    
    // Create initial building
    createBuilding();
    
    // Animation variables
    let animationFrameId: number;
    let lastTime = 0;
    
    // Animation function for seismic simulation
    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // Update controls
      controls.update();
      
      // If simulation is running, apply seismic motion with modal shapes
      if (isSimulating && seismicParameters && simulationResults?.modalProperties) {
        setCurrentTime(prev => prev + deltaTime / 1000);
        
        const { frequencies, modalShapes, participationFactors } = simulationResults.modalProperties;
        const time = currentTime;
        const storyHeight = buildingParameters.buildingHeight / buildingParameters.numberOfStoreys;
        
        // Calculate modal contributions
        const modalContributions = modalShapes.map((shape, modeIndex) => {
          const amplitude = seismicParameters.intensity * 0.05 * participationFactors[modeIndex];
          const frequency = frequencies[modeIndex];
          return shape.map(φ => φ * amplitude * Math.sin(2 * Math.PI * frequency * time));
        });
        
        // Sum up modal contributions for total displacement
        const totalDisplacements = Array(buildingParameters.numberOfStoreys).fill(0)
          .map((_, floor) => modalContributions.reduce((sum, modeDisp) => sum + modeDisp[floor], 0));
        
        // Apply displacements based on direction
        const directionFactor = {
          x: seismicParameters.direction === 'x' || seismicParameters.direction === 'both' ? 1 : 0,
          z: seismicParameters.direction === 'z' || seismicParameters.direction === 'both' ? 1 : 0
        };
        
        // Apply modal displacements to building elements
        buildingGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            const originalPosition = child.userData.originalPosition || {
              x: child.position.x,
              y: child.position.y,
              z: child.position.z
            };
            
            // Store original position if not already stored
            if (!child.userData.originalPosition) {
              child.userData.originalPosition = originalPosition;
            }
            
            // Get floor number from element position
            const floorIndex = Math.floor(child.position.y / (buildingParameters.buildingHeight / buildingParameters.numberOfStoreys));
            
            // Apply modal displacement based on floor level
            let totalDisplacementX = 0;
            let totalDisplacementZ = 0;
            
            if (floorIndex < totalDisplacements.length) {
              const floorDisplacement = totalDisplacements[floorIndex];
              totalDisplacementX = floorDisplacement * directionFactor.x;
              totalDisplacementZ = floorDisplacement * directionFactor.z;
            }
            
            // Apply displacement
            child.position.x = originalPosition.x + totalDisplacementX;
            child.position.z = originalPosition.z + totalDisplacementZ;
            
            // Apply torsional effects for corner elements
            if (child.userData.type === 'column') {
              const columnId = child.userData.elementId as string;
              if (columnId.includes('_0_0_') || columnId.includes(`_${buildingParameters.columnsAlongLength-1}_${buildingParameters.columnsAlongWidth-1}_`)) {
                const torsionalAngle = 0.001 * totalDisplacementX * Math.sin(2 * Math.PI * frequencies[0] * time);
                child.rotation.y = torsionalAngle;
              }
            }
            
            // Apply stress visualization and modal deformation if enabled
            if (showStressDiagram && simulationResults) {
              // Find if this is a critical element
              const criticalElement = simulationResults.criticalElements.find(
                el => el.id === child.userData.elementId
              );
              
              if (criticalElement) {
                // Calculate dynamic stress amplification
                const dynamicStressRatio = criticalElement.stressRatio * 
                  (1 + Math.abs(totalDisplacementX + totalDisplacementZ) / (buildingParameters.buildingHeight * 0.01));
                
                // Apply color based on dynamic stress ratio
                if (child.material instanceof THREE.MeshStandardMaterial) {
                  const stressColor = new THREE.Color();
                  // Interpolate between green (low stress) and red (high stress)
                  stressColor.setRGB(
                    Math.min(1, dynamicStressRatio), // Red component
                    Math.max(0, 1 - dynamicStressRatio), // Green component
                    0 // Blue component
                  );
                  child.material.color = stressColor;
                  child.material.emissive.setRGB(
                    dynamicStressRatio * 0.2,
                    0,
                    0
                  );
                  child.material.needsUpdate = true;
                }
              }
            }
          }
        });
      } else {
        // Reset building to original position when not simulating
        buildingGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.userData.originalPosition) {
            child.position.x = child.userData.originalPosition.x;
            child.position.z = child.userData.originalPosition.z;
            
            // Reset colors
            if (child.material instanceof THREE.MeshStandardMaterial) {
              if (child.userData.type === 'column' || child.userData.type === 'beam') {
                child.material.color = new THREE.Color(material.color);
              } else if (child.userData.type === 'slab') {
                child.material.color = new THREE.Color(0xcccccc);
              }
              child.material.needsUpdate = true;
            }
          }
        });
      }
      
      // Render scene
      renderer.render(scene, camera);
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate(0);
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [buildingParameters, material, isSimulating, seismicParameters, currentTime, showStressDiagram, simulationResults]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Seismic Response Simulation</h4>
        <div className="space-x-2">
          <button
            onClick={() => runSeismicAnalysis()}
            disabled={isSimulating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button
            onClick={() => setShowStressDiagram(!showStressDiagram)}
            className={`px-4 py-2 rounded ${showStressDiagram ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {showStressDiagram ? 'Hide Stress' : 'Show Stress'}
          </button>
        </div>
      </div>
      
      {/* 3D Visualization Container */}
      <div 
        ref={mountRef} 
        className="w-full h-[500px] border border-gray-300 rounded-lg overflow-hidden bg-gray-100"
      />
      
      {/* Results Display */}
      {simulationResults && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-medium mb-3">Seismic Analysis Results</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Building Response</h5>
              <ul className="mt-2 space-y-1">
                <li className="text-sm">
                  <span className="font-medium">Natural Period:</span> {simulationResults.periodOfVibration.toFixed(2)} seconds
                </li>
                <li className="text-sm">
                  <span className="font-medium">Max Displacement:</span> {simulationResults.maxDisplacement.toFixed(2)} mm
                </li>
                <li className="text-sm">
                  <span className="font-medium">Base Shear:</span> {simulationResults.baseShear.toFixed(2)} kN
                </li>
                <li className="text-sm">
                  <span className="font-medium">Spectral Acceleration:</span> {simulationResults.spectralAcceleration.toFixed(2)}g
                </li>
              </ul>
              
              {simulationResults.modalProperties && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700">Modal Analysis</h5>
                  <ul className="mt-2 space-y-1">
                    {simulationResults.modalProperties.frequencies.map((freq, index) => (
                      <li key={index} className="text-sm">
                        <span className="font-medium">Mode {index + 1}:</span>
                        <div className="ml-2">
                          <div>Frequency: {freq.toFixed(2)} Hz</div>
                          <div>Participation Factor: {simulationResults.modalProperties!.participationFactors[index].toFixed(2)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700">Story Drifts</h5>
              <div className="mt-2 space-y-1">
                <div className="relative h-40 bg-gray-50 rounded p-2">
                  {/* Story drift visualization */}
                  <div className="absolute inset-y-4 left-12 w-1 bg-gray-200"></div>
                  {simulationResults.storyDrifts.map((drift, index) => {
                    const driftPercentage = (drift / 20) * 100; // Scale drift to percentage (20mm as max)
                    return (
                      <div key={index} 
                        className="absolute left-12 flex items-center"
                        style={{ bottom: `${(index / (simulationResults.storyDrifts.length - 1)) * 80 + 10}%` }}
                      >
                        <div 
                          className={`h-0.5 ${drift > 10 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(driftPercentage, 100)}%` }}
                        ></div>
                        <span className="ml-2 text-xs">
                          Story {index + 1}: {drift.toFixed(2)} mm
                          {drift > 10 && <span className="text-red-500 ml-1">(Exceeds)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Critical Elements</h5>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stress Ratio</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {simulationResults.criticalElements
                      .sort((a, b) => b.stressRatio - a.stressRatio)
                      .slice(0, 5) // Show top 5 most critical elements
                      .map((element, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm">{element.type} {element.id}</td>
                          <td className="px-3 py-2 text-sm">
                            Floor {Math.floor(element.location.y / (buildingParameters.buildingHeight / buildingParameters.numberOfStoreys))}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-full rounded-full ${element.stressRatio > 0.8 ? 'bg-red-500' : element.stressRatio > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${element.stressRatio * 100}%` }}
                                ></div>
                              </div>
                              {(element.stressRatio * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${element.stressRatio > 0.8 ? 'bg-red-100 text-red-800' : element.stressRatio > 0.6 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                            >
                              {element.stressRatio > 0.8 ? 'Critical' : element.stressRatio > 0.6 ? 'Warning' : 'Safe'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {simulationResults.modalProperties && (
              <div>
                <h5 className="text-sm font-medium text-gray-700">Modal Response</h5>
                <div className="mt-2 bg-gray-50 rounded p-4">
                  <div className="space-y-4">
                    {simulationResults.modalProperties.modalShapes.map((shape, modeIndex) => (
                      <div key={modeIndex} className="relative">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Mode {modeIndex + 1}</span>
                          <span>Frequency: {simulationResults.modalProperties!.frequencies[modeIndex].toFixed(2)} Hz</span>
                          <span>Participation: {(simulationResults.modalProperties!.participationFactors[modeIndex] * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-16 flex items-end space-x-1">
                          {shape.map((amplitude, floorIndex) => {
                            const normalizedAmplitude = (amplitude + 1) / 2; // Normalize to 0-1
                            return (
                              <div 
                                key={floorIndex}
                                className="flex-1 bg-blue-500 opacity-70 transition-all duration-300"
                                style={{ height: `${normalizedAmplitude * 100}%` }}
                              ></div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Structural Analysis Recommendations</h5>
            <div className="space-y-3">
              {/* Seismic Performance Assessment */}
              <div>
                <h6 className="text-xs font-medium text-blue-700 mb-1">Seismic Performance</h6>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  {simulationResults.maxDisplacement > 15 && (
                    <li>
                      High lateral displacement detected ({simulationResults.maxDisplacement.toFixed(1)}mm).
                      <ul className="ml-5 list-disc text-blue-600 mt-1">
                        <li>Add shear walls along the building perimeter</li>
                        <li>Consider implementing moment-resisting frames</li>
                        <li>Evaluate foundation rigidity and soil-structure interaction</li>
                      </ul>
                    </li>
                  )}
                  {simulationResults.modalProperties && simulationResults.modalProperties.frequencies[0] < 0.5 && (
                    <li>
                      Low fundamental frequency ({simulationResults.modalProperties.frequencies[0].toFixed(2)} Hz) indicates potential resonance risk.
                      <ul className="ml-5 list-disc text-blue-600 mt-1">
                        <li>Increase lateral stiffness through diagonal bracing</li>
                        <li>Consider mass reduction in upper floors</li>
                        <li>Evaluate dynamic damping systems</li>
                      </ul>
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Story Drift Analysis */}
              {simulationResults.storyDrifts.some(drift => drift > 10) && (
                <div>
                  <h6 className="text-xs font-medium text-blue-700 mb-1">Story Drift Control</h6>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>
                      Excessive story drift detected in {simulationResults.storyDrifts.filter(drift => drift > 10).length} floors.
                      <ul className="ml-5 list-disc text-blue-600 mt-1">
                        <li>Increase column dimensions in affected stories</li>
                        <li>Add strategic bracing or shear walls</li>
                        <li>Consider implementing rigid floor diaphragms</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              )}
              
              {/* Structural Element Assessment */}
              {simulationResults.criticalElements.some(el => el.stressRatio > 0.8) && (
                <div>
                  <h6 className="text-xs font-medium text-blue-700 mb-1">Critical Elements</h6>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>
                      High stress concentrations identified in {simulationResults.criticalElements.filter(el => el.stressRatio > 0.8).length} elements.
                      <ul className="ml-5 list-disc text-blue-600 mt-1">
                        <li>Increase section capacity of critical elements</li>
                        <li>Evaluate load redistribution options</li>
                        <li>Consider adding supplementary support systems</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              )}
              
              {/* General Recommendations */}
              <div>
                <h6 className="text-xs font-medium text-blue-700 mb-1">Design Considerations</h6>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>Ensure proper detailing of beam-column connections for ductile behavior</li>
                  <li>Implement capacity design principles to prevent soft-story mechanism</li>
                  <li>Consider soil-structure interaction effects in foundation design</li>
                  {simulationResults.modalProperties && (
                    <li>Modal participation factors suggest {simulationResults.modalProperties.participationFactors[0] > 0.8 ? 'good' : 'suboptimal'} mass distribution</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeismicSimulation;