'use client';

import React, { useState } from 'react';
import { Material } from '@/lib/types';
import RectangularStructureAnalysis from './RectangularStructureAnalysis';

// Sample materials data
const sampleMaterials: Material[] = [
  {
    name: 'Concrete_C25',
    displayName: 'Concrete C25/30',
    elasticModulus: 31000, // MPa
    density: 2500, // kg/m3
    color: '#C0C0C0',
    description: 'Standard structural concrete',
    yieldStrength: 25, // MPa
    ultimateStrength: 30, // MPa
    poissonRatio: 0.2,
    thermalExpansion: 10e-6,
    type: 'Concrete',
    gradeCode: 'C25/30'
  },
  {
    name: 'Steel_S275',
    displayName: 'Structural Steel S275',
    elasticModulus: 210000, // MPa
    density: 7850, // kg/m3
    color: '#808080',
    description: 'Standard structural steel',
    yieldStrength: 275, // MPa
    ultimateStrength: 430, // MPa
    poissonRatio: 0.3,
    thermalExpansion: 12e-6,
    type: 'Steel',
    gradeCode: 'S275'
  },
  {
    name: 'Steel_S355',
    displayName: 'Structural Steel S355',
    elasticModulus: 210000, // MPa
    density: 7850, // kg/m3
    color: '#606060',
    description: 'High-strength structural steel',
    yieldStrength: 355, // MPa
    ultimateStrength: 510, // MPa
    poissonRatio: 0.3,
    thermalExpansion: 12e-6,
    type: 'Steel',
    gradeCode: 'S355'
  },
  {
    name: 'Timber_C24',
    displayName: 'Timber C24',
    elasticModulus: 11000, // MPa
    density: 420, // kg/m3
    color: '#D2B48C',
    description: 'Structural softwood timber',
    yieldStrength: 24, // MPa (bending strength)
    ultimateStrength: 40, // MPa
    poissonRatio: 0.2,
    thermalExpansion: 5e-6,
    type: 'Timber',
    gradeCode: 'C24'
  }
];

// Default building parameters
const defaultBuildingParameters = {
  buildingLength: 20,
  buildingWidth: 15,
  buildingHeight: 12,
  numberOfStoreys: 4,
  columnsAlongLength: 5,
  columnsAlongWidth: 4,
  beamsAlongLength: 5,
  beamsAlongWidth: 4,
  slabThickness: 200,
  slabLoad: 5,
  beamWidth: 300,
  beamHeight: 500,
  elasticModulus: 210000,
  columnWidth: 400,
  columnDepth: 400
};

export default function RectangularStructureVisualization() {
  // Add a ref to track component mounted state
  const isMountedRef = React.useRef(true);
  
  // Set mounted state to false when component unmounts
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  // State for building parameters
  const [buildingParameters, setBuildingParameters] = useState(defaultBuildingParameters);
  
  // State for selected material
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(sampleMaterials[1]); // Default to Steel S275
  
  // Derived calculations
  const totalVolume = buildingParameters.buildingLength * buildingParameters.buildingWidth * buildingParameters.buildingHeight;
  const totalWeight = totalVolume * selectedMaterial.density;
  const estimatedCost = selectedMaterial.type === 'Steel' 
    ? totalWeight * 2.5 // Steel cost per kg
    : selectedMaterial.type === 'Concrete' 
      ? totalWeight * 0.3 // Concrete cost per kg
      : totalWeight * 1.8; // Timber cost per kg
  
  // Helper function to update a single parameter
  const updateParameter = (name: keyof typeof buildingParameters, value: number) => {
    setBuildingParameters((prev: typeof buildingParameters) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Calculate estimated loads
  const deadLoad = (buildingParameters.slabThickness / 1000) * 25 * buildingParameters.numberOfStoreys; // kN/m²
  const liveLoad = buildingParameters.slabLoad * buildingParameters.numberOfStoreys; // kN/m²
  const totalLoad = deadLoad + liveLoad; // kN/m²
  const foundationPressure = totalLoad / (buildingParameters.buildingLength * buildingParameters.buildingWidth); // kN/m²

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Rectangular Structure Analysis</h1>
      <p className="text-gray-600 mb-8">
        Visualize and analyze rectangular building structures with 3D visualization.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Building Parameters Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Building Parameters</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length (m)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={buildingParameters.buildingLength}
                  onChange={(e) => updateParameter('buildingLength', Number(e.target.value))}
                  min="1"
                  step="0.5"
                  aria-label="Building length"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (m)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={buildingParameters.buildingWidth}
                  onChange={(e) => updateParameter('buildingWidth', Number(e.target.value))}
                  min="1"
                  step="0.5"
                  aria-label="Building width"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (m)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={buildingParameters.buildingHeight}
                  onChange={(e) => updateParameter('buildingHeight', Number(e.target.value))}
                  min="1"
                  step="0.5"
                  aria-label="Building height"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Storeys
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={buildingParameters.numberOfStoreys}
                  onChange={(e) => updateParameter('numberOfStoreys', Number(e.target.value))}
                  min="1"
                  step="1"
                  aria-label="Number of storeys"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Columns Along Length
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={buildingParameters.columnsAlongLength}
                  onChange={(e) => updateParameter('columnsAlongLength', Number(e.target.value))}
                  min="2"
                  step="1"
                  aria-label="Columns along length"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Columns Along Width
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={buildingParameters.columnsAlongWidth}
                  onChange={(e) => updateParameter('columnsAlongWidth', Number(e.target.value))}
                  min="2"
                  step="1"
                  aria-label="Columns along width"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Material Properties Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Material Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedMaterial.name}
                onChange={(e) => {
                  const selected = sampleMaterials.find(m => m.name === e.target.value);
                  if (selected) setSelectedMaterial(selected);
                }}
                aria-label="Material selection"
              >
                {sampleMaterials.map((material) => (
                  <option key={material.name} value={material.name}>
                    {material.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elastic Modulus (MPa)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedMaterial.elasticModulus}
                  readOnly
                  aria-label="Elastic modulus"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Density (kg/m³)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedMaterial.density}
                  readOnly
                  aria-label="Density"
                />
              </div>
            </div>
            
            <div className="p-3 rounded bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Material Information</h4>
              <p className="text-sm text-gray-700">{selectedMaterial.description}</p>
              <p className="text-sm text-gray-700 mt-1">
                Type: {selectedMaterial.type} | Grade: {selectedMaterial.gradeCode}
              </p>
            </div>
          </div>
        </div>
        
        {/* Analysis Results Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Analysis Summary</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-sm text-gray-600">Total Volume:</div>
              <div className="text-sm font-medium">{totalVolume.toFixed(2)} m³</div>
              
              <div className="text-sm text-gray-600">Total Weight:</div>
              <div className="text-sm font-medium">{(totalWeight / 1000).toFixed(2)} tonnes</div>
              
              <div className="text-sm text-gray-600">Dead Load:</div>
              <div className="text-sm font-medium">{deadLoad.toFixed(2)} kN/m²</div>
              
              <div className="text-sm text-gray-600">Live Load:</div>
              <div className="text-sm font-medium">{liveLoad.toFixed(2)} kN/m²</div>
              
              <div className="text-sm text-gray-600">Total Load:</div>
              <div className="text-sm font-medium">{totalLoad.toFixed(2)} kN/m²</div>
              
              <div className="text-sm text-gray-600">Foundation Pressure:</div>
              <div className="text-sm font-medium">{foundationPressure.toFixed(2)} kN/m²</div>
              
              <div className="text-sm text-gray-600">Estimated Cost:</div>
              <div className="text-sm font-medium">${estimatedCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            </div>
            
            <div className="p-3 rounded bg-indigo-50 mt-4">
              <h4 className="text-sm font-medium mb-2">Structural Recommendations</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {selectedMaterial.type === 'Steel' && (
                  <>
                    <li>Consider bracing for lateral stability</li>
                    <li>Check connection details at column-beam joints</li>
                    <li>Ensure adequate fire protection</li>
                  </>
                )}
                {selectedMaterial.type === 'Concrete' && (
                  <>
                    <li>Consider shear wall placement for lateral stability</li>
                    <li>Check reinforcement requirements</li>
                    <li>Consider creep and shrinkage effects</li>
                  </>
                )}
                {selectedMaterial.type === 'Timber' && (
                  <>
                    <li>Consider moisture protection measures</li>
                    <li>Evaluate fire resistance requirements</li>
                    <li>Check connection details carefully</li>
                  </>
                )}
              </ul>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* 3D Visualization Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-3">3D Visualization</h3>
        <RectangularStructureAnalysis
          buildingParameters={buildingParameters}
          material={selectedMaterial}
        />
      </div>
    </div>
  );
}