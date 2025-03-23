'use client';

import React, { useState, useEffect } from 'react';
import { BeamResults, SectionProfile, Material } from '@/lib/types';

interface BeamAnalysisProps {
  section: SectionProfile;
  material: Material;
  length: number; // meters
  loads: {
    uniformLoad?: number; // N/m
    pointLoads?: Array<{magnitude: number, position: number}>; // N at position in m
    momentLoads?: Array<{magnitude: number, position: number}>; // N-m at position in m
  };
  supportConditions: 'simple' | 'fixed-fixed' | 'cantilever' | 'fixed-pinned';
}

// Helper function to analyze beam
const analyzeBeam = (
  section: SectionProfile,
  material: Material,
  length: number,
  loads: {
    uniformLoad?: number;
    pointLoads?: Array<{magnitude: number, position: number}>;
    momentLoads?: Array<{magnitude: number, position: number}>;
  },
  supportConditions: 'simple' | 'fixed-fixed' | 'cantilever' | 'fixed-pinned'
): BeamResults => {
  // Number of points to calculate in the beam
  const numPoints = 100;
  const dx = length / numPoints;
  
  // Initialize arrays for moment, shear, and deflection diagrams
  const momentDiagram: number[] = Array(numPoints + 1).fill(0);
  const shearDiagram: number[] = Array(numPoints + 1).fill(0);
  const deflectionCurve: number[] = Array(numPoints + 1).fill(0);
  
  // Calculate beam EI (elastic modulus * moment of inertia)
  const EI = material.elasticModulus * 1e6 * section.momentOfInertiaX * 1e-12; // Convert to N-m²
  
  // Reactions based on support conditions and loads
  let reactionLeft = 0;
  let reactionRight = 0;
  let momentLeft = 0;
  let momentRight = 0;
  
  // Calculate reactions based on support conditions
  if (loads.uniformLoad) {
    const w = loads.uniformLoad;
    
    switch (supportConditions) {
      case 'simple':
        reactionLeft = w * length / 2;
        reactionRight = w * length / 2;
        break;
      case 'fixed-fixed':
        reactionLeft = w * length / 2;
        reactionRight = w * length / 2;
        momentLeft = -w * length * length / 12;
        momentRight = w * length * length / 12;
        break;
      case 'cantilever':
        reactionLeft = w * length;
        momentLeft = -w * length * length / 2;
        break;
      case 'fixed-pinned':
        reactionLeft = w * length * (3/8);
        reactionRight = w * length * (5/8);
        momentLeft = -w * length * length / 8;
        break;
    }
  }
  
  // Add point load reactions
  if (loads.pointLoads && loads.pointLoads.length > 0) {
    loads.pointLoads.forEach(load => {
      const { magnitude, position } = load;
      
      switch (supportConditions) {
        case 'simple':
          // Simple beam: R1 = P(L-a)/L, R2 = Pa/L
          reactionLeft += magnitude * (length - position) / length;
          reactionRight += magnitude * position / length;
          break;
        case 'fixed-fixed':
          // Fixed-fixed: more complex, using approximation
          reactionLeft += magnitude * (1 - (3 * position * position) / (length * length) + (2 * position * position * position) / (length * length * length));
          reactionRight += magnitude * (position / length) * (3 - 2 * position / length);
          momentLeft += -magnitude * position * (length - position) * (length - position) / (length * length);
          momentRight += magnitude * position * position * (length - position) / (length * length);
          break;
        case 'cantilever':
          reactionLeft += magnitude;
          momentLeft += -magnitude * position;
          break;
        case 'fixed-pinned':
          // Approximation for fixed-pinned
          reactionLeft += magnitude * (1 - position / length) * (1 + position / (2 * length));
          reactionRight += magnitude * position / length * (1 + (length - position) / (2 * length));
          momentLeft += -magnitude * position * (length - position) / (2 * length);
          break;
      }
    });
  }
  
  // Calculate moment, shear, and deflection at each point
  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    
    // Initialize the values at this point
    let moment = 0;
    let shear = 0;
    
    // Add effects of support moments
    if (momentLeft) moment += momentLeft;
    
    // Add effects of reactions
    if (x > 0 || supportConditions === 'cantilever') shear += reactionLeft;
    if (momentLeft) moment -= momentLeft;
    
    // Add effect of uniform load
    if (loads.uniformLoad) {
      shear -= loads.uniformLoad * x;
      moment += loads.uniformLoad * x * x / 2;
    }
    
    // Add effect of point loads
    if (loads.pointLoads) {
      loads.pointLoads.forEach(load => {
        if (x > load.position) {
          shear -= load.magnitude;
          moment += load.magnitude * (x - load.position);
        }
      });
    }
    
    // Add effect of moment loads
    if (loads.momentLoads) {
      loads.momentLoads.forEach(load => {
        if (x > load.position) {
          moment += load.magnitude;
        }
      });
    }
    
    // Add effect of right reaction
    if (x > length && supportConditions !== 'cantilever') {
      shear -= reactionRight;
      if (momentRight) moment += momentRight;
    }
    
    // Store results
    momentDiagram[i] = moment;
    shearDiagram[i] = shear;
    
    // Calculate deflection (simplified approach)
    // In a real implementation, you would use the double integration method
    // This is a simplified calculation using the maximum moment formula
    if (supportConditions === 'simple' && loads.uniformLoad) {
      // Maximum deflection at center for uniform load on simple beam
      deflectionCurve[i] = (5 * loads.uniformLoad * length * length * length * length) / (384 * EI) * Math.sin(Math.PI * x / length);
    } else if (supportConditions === 'cantilever' && loads.uniformLoad) {
      // Maximum deflection at end for uniform load on cantilever
      deflectionCurve[i] = (loads.uniformLoad * (length ** 4 - (length - x) ** 4)) / (8 * EI);
    } else {
      // Simple approximation for other cases
      deflectionCurve[i] = (moment * x * (length - x)) / (16 * EI);
    }
  }
  
  // Find maximum values
  const maxMoment = Math.max(...momentDiagram.map(Math.abs));
  Math.max(...shearDiagram.map(Math.abs)); // Calculate but don't store
  const maxDeflection = Math.max(...deflectionCurve);
  
  // Calculate stress from bending
  const maxStress = (maxMoment * 1000) / section.sectionModulusX; // MPa
  
  // Calculate utilization ratios
  const allowableStress = material.yieldStrength / 1.5; // Simple safety factor
  const bendingUtilization = maxStress / allowableStress;
  
  const allowableDeflection = length * 1000 / 360; // Typical L/360 criterion in mm
  const deflectionUtilization = maxDeflection / allowableDeflection;
  
  // Overall utilization is the maximum of all checks
  const utilizationRatio = Math.max(bendingUtilization, deflectionUtilization);
  
  return {
    maxDeflection,
    maxStress,
    reactionLeft,
    reactionRight,
    utilizationRatio,
    momentDiagram,
    shearDiagram,
    deflectionCurve,
    bendingUtilization
  };
};

const BeamAnalysis: React.FC<BeamAnalysisProps> = ({
  section,
  material,
  length,
  loads,
  supportConditions
}) => {
  const [results, setResults] = useState<BeamResults>({
    maxDeflection: 0,
    maxStress: 0,
    reactionLeft: 0,
    reactionRight: 0,
    momentDiagram: [],
    shearDiagram: [],
    deflectionCurve: [],
    bendingUtilization: 0,
    utilizationRatio: 0
  });
  
  // Analyze beam when inputs change
  useEffect(() => {
    const beamResults = analyzeBeam(section, material, length, loads, supportConditions);
    setResults(beamResults);
  }, [section, material, length, loads, supportConditions]);
  
  // Helper function to get utilization color
  const getUtilizationColor = (ratio: number): string => {
    if (ratio > 1.0) return 'text-red-600';
    if (ratio > 0.8) return 'text-amber-500';
    return 'text-green-600';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-5">
      <h3 className="text-lg font-semibold border-b pb-2 mb-3">Beam Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-sm mb-3">Analysis Results</h4>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Maximum Moment:</div>
              <div className="text-sm font-medium">
                {results.momentDiagram ? Math.max(...results.momentDiagram.map(Math.abs)).toFixed(2) : 0} kN·m
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Maximum Shear:</div>
              <div className="text-sm font-medium">
                {results.shearDiagram ? Math.max(...results.shearDiagram.map(Math.abs)).toFixed(2) : 0} kN
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Maximum Deflection:</div>
              <div className="text-sm font-medium">
                {results.maxDeflection?.toFixed(2) || 0} mm
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Maximum Stress:</div>
              <div className="text-sm font-medium">
                {results.maxStress?.toFixed(2) || 0} MPa
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Left Reaction:</div>
              <div className="text-sm font-medium">
                {results.reactionLeft?.toFixed(2) || 0} kN
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Right Reaction:</div>
              <div className="text-sm font-medium">
                {results.reactionRight?.toFixed(2) || 0} kN
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Utilization Ratio:</div>
              <div className={`text-sm font-medium ${results.utilizationRatio ? getUtilizationColor(results.utilizationRatio) : ''}`}>
                {results.utilizationRatio?.toFixed(2) || 0}
                {results.utilizationRatio && results.utilizationRatio > 1.0 && 
                  " (Exceeds limit)"
                }
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">Design Check</h4>
            <div className={`p-2 rounded ${results.utilizationRatio && results.utilizationRatio <= 1.0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className="font-medium">
                {results.utilizationRatio && results.utilizationRatio <= 1.0 
                  ? '✓ Design is adequate' 
                  : '✕ Design needs revision'}
              </span>
              {results.utilizationRatio && results.utilizationRatio > 1.0 && (
                <ul className="list-disc pl-5 mt-1 text-sm">
                  <li>Consider increasing section size</li>
                  <li>Check if loads can be reduced</li>
                  <li>Consider adding intermediate supports</li>
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-3">Beam Diagrams</h4>
          
          <div className="mb-4">
            <div className="text-xs font-medium mb-1">Moment Diagram</div>
            <div className="h-24 w-full bg-gray-100 relative rounded overflow-hidden">
              {results.momentDiagram && results.momentDiagram.map((moment, index) => {
                const maxMoment = Math.max(...results.momentDiagram!.map(Math.abs));
                const normalizedHeight = (moment / maxMoment) * 100 * 0.45;
                const x = `${(index / 100) * 100}%`;
                
                return (
                  <div 
                    key={`moment-${index}`}
                    className="absolute bottom-1/2 w-1 bg-teal-500"
                    style={{
                      left: x,
                      height: `${Math.abs(normalizedHeight)}%`,
                      transform: `translateX(-50%) ${moment >= 0 ? 'translateY(0)' : 'translateY(100%) rotate(180deg)'}`,
                      transformOrigin: 'bottom center'
                    }}
                  />
                );
              })}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400" />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{(length/4).toFixed(1)}</span>
              <span>{(length/2).toFixed(1)}</span>
              <span>{(3*length/4).toFixed(1)}</span>
              <span>{length.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs font-medium mb-1">Shear Diagram</div>
            <div className="h-24 w-full bg-gray-100 relative rounded overflow-hidden">
              {results.shearDiagram && results.shearDiagram.map((shear, index) => {
                const maxShear = Math.max(...results.shearDiagram!.map(Math.abs));
                const normalizedHeight = (shear / maxShear) * 100 * 0.45;
                const x = `${(index / 100) * 100}%`;
                
                return (
                  <div 
                    key={`shear-${index}`}
                    className="absolute bottom-1/2 w-1 bg-red-500"
                    style={{
                      left: x,
                      height: `${Math.abs(normalizedHeight)}%`,
                      transform: `translateX(-50%) ${shear >= 0 ? 'translateY(0)' : 'translateY(100%) rotate(180deg)'}`,
                      transformOrigin: 'bottom center'
                    }}
                  />
                );
              })}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400" />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{(length/4).toFixed(1)}</span>
              <span>{(length/2).toFixed(1)}</span>
              <span>{(3*length/4).toFixed(1)}</span>
              <span>{length.toFixed(1)}</span>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium mb-1">Deflection Diagram</div>
            <div className="h-24 w-full bg-gray-100 relative rounded overflow-hidden">
              {results.deflectionCurve && results.deflectionCurve.map((deflection, index) => {
                const maxDeflection = Math.max(...results.deflectionCurve!);
                const normalizedHeight = (deflection / maxDeflection) * 100 * 0.9;
                const x = `${(index / 100) * 100}%`;
                
                return (
                  <div 
                    key={`deflection-${index}`}
                    className="absolute bottom-0 w-1 bg-purple-500"
                    style={{
                      left: x,
                      height: `${normalizedHeight}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{(length/4).toFixed(1)}</span>
              <span>{(length/2).toFixed(1)}</span>
              <span>{(3*length/4).toFixed(1)}</span>
              <span>{length.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeamAnalysis;