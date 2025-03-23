'use client';

import React, { useState } from 'react';
import { Material, SectionProfile } from '@/lib/types';
import ColumnAnalysis from '@/components/ColumnAnalysis';

// Sample materials data (same as in other components)
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

// Sample column sections
const sampleSections: SectionProfile[] = [
  {
    id: 'HEB200',
    name: 'HEB 200',
    type: 'column',
    width: 0.2, // meters (flange width)
    height: 0.2, // meters (overall height)
    area: 0.00781, // m²
    momentOfInertiaX: 5700e-8, // m⁴
    momentOfInertiaY: 2000e-8, // m⁴
    description: 'European standard wide flange beam',
    shape: 'WShape',
    sectionModulusX: 570e-6, // m³
    sectionModulusY: 200e-6, // m³
    plasticModulusX: 642e-6, // m³
    plasticModulusY: 305e-6, // m³
    torsionalConstant: 59.3e-8, // m⁴
    shearAreaX: 0.00349, // m²
    shearAreaY: 0.00254, // m²
    flangeThickness: 0.015, // meters
    webThickness: 0.009, // meters
    designationCode: 'HEB200'
  },
  {
    id: 'HEB300',
    name: 'HEB 300',
    type: 'column',
    width: 0.3, // meters (flange width)
    height: 0.3, // meters (overall height)
    area: 0.01491, // m²
    momentOfInertiaX: 25170e-8, // m⁴
    momentOfInertiaY: 8560e-8, // m⁴
    description: 'European standard wide flange beam',
    shape: 'WShape',
    sectionModulusX: 1680e-6, // m³
    sectionModulusY: 571e-6, // m³
    plasticModulusX: 1869e-6, // m³
    plasticModulusY: 870e-6, // m³
    torsionalConstant: 185e-8, // m⁴
    shearAreaX: 0.00782, // m²
    shearAreaY: 0.00443, // m²
    flangeThickness: 0.019, // meters
    webThickness: 0.011, // meters
    designationCode: 'HEB300'
  },
  {
    id: 'Square_300x300',
    name: 'Square 300×300',
    type: 'column',
    width: 0.3, // meters
    height: 0.3, // meters
    area: 0.09, // m²
    momentOfInertiaX: 0.000675, // m⁴
    momentOfInertiaY: 0.000675, // m⁴
    description: 'Square concrete column',
    shape: 'Rectangular',
    sectionModulusX: 0.0045, // m³
    sectionModulusY: 0.0045, // m³
    torsionalConstant: 0.00114, // m⁴
    shearAreaX: 0.075, // m²
    shearAreaY: 0.075, // m²
    designationCode: 'SQ300'
  },
  {
    id: 'Circle_300',
    name: 'Circular Ø300',
    type: 'column',
    width: 0.3, // meters (diameter)
    height: 0.3, // meters (diameter)
    area: 0.0707, // m²
    momentOfInertiaX: 0.000398, // m⁴
    momentOfInertiaY: 0.000398, // m⁴
    description: 'Circular concrete column',
    shape: 'Circular',
    sectionModulusX: 0.00265, // m³
    sectionModulusY: 0.00265, // m³
    torsionalConstant: 0.000795, // m⁴
    shearAreaX: 0.0589, // m²
    shearAreaY: 0.0589, // m²
    designationCode: 'CIR300'
  }
];

// Sample effective length factors
const effectiveLengthFactors = [
  { value: 0.5, description: 'Fixed-Fixed (K=0.5)' },
  { value: 0.7, description: 'Fixed-Pinned (K=0.7)' },
  { value: 1.0, description: 'Pinned-Pinned (K=1.0)' },
  { value: 1.5, description: 'Fixed-Free partial (K=1.5)' },
  { value: 2.0, description: 'Fixed-Free (K=2.0)' },
];

export default function ColumnAnalysisClient() {
  // Selected material and section
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(sampleMaterials[1]); // Default to Steel S275
  const [selectedSection, setSelectedSection] = useState<SectionProfile>(sampleSections[0]); // Default to HEB200
  
  // Column parameters
  const [columnLength, setColumnLength] = useState<number>(3.5); // meters
  const [axialLoad, setAxialLoad] = useState<number>(500000); // N (500 kN)
  const [momentX, setMomentX] = useState<number>(15); // kN-m
  const [momentY] = useState<number>(0); // kN-m - Used in the ColumnAnalysis component but not edited in UI
  const [eccentricity, setEccentricity] = useState<number>(20); // mm
  const [effectiveLengthFactor, setEffectiveLengthFactor] = useState<number>(1.0); 
  const [isBraced, setIsBraced] = useState<boolean>(true);
  
  // Helper function to calculate recommended axial load
  const calculateRecommendedLoad = (): number => {
    const area = selectedSection.area;
    const yield_strength = selectedMaterial.yieldStrength;
    
    // Simple calculation for allowable axial load (area × allowable stress)
    return area * 1e6 * (yield_strength / 1.67);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Column Analysis</h1>
      <p className="text-gray-600 mb-8">
        Analyze structural columns for buckling behavior, load capacity, and combined axial-flexural effects. 
        Evaluate slenderness, calculate critical loads, and check design adequacy.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Material Selection */}
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
                  onChange={(e) => {
                    setSelectedMaterial({
                      ...selectedMaterial,
                      elasticModulus: parseFloat(e.target.value)
                    });
                  }}
                  aria-label="Elastic modulus"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yield Strength (MPa)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedMaterial.yieldStrength}
                  onChange={(e) => {
                    setSelectedMaterial({
                      ...selectedMaterial,
                      yieldStrength: parseFloat(e.target.value)
                    });
                  }}
                  aria-label="Yield strength"
                />
              </div>
            </div>
            
            <div>
              <div className="p-3 rounded bg-gray-50">
                <h4 className="text-sm font-medium mb-2">Material Information</h4>
                <p className="text-sm text-gray-700">{selectedMaterial.description}</p>
                <p className="text-sm text-gray-700 mt-1">
                  Type: {selectedMaterial.type} | Grade: {selectedMaterial.gradeCode}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Selection */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Section Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedSection.id}
                onChange={(e) => {
                  const selected = sampleSections.find(s => s.id === e.target.value);
                  if (selected) setSelectedSection(selected);
                }}
                aria-label="Section selection"
              >
                {sampleSections.filter(s => s.type === 'column').map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name} ({section.shape})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width/Diameter (mm)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedSection.width * 1000}
                  onChange={(e) => {
                    setSelectedSection({
                      ...selectedSection,
                      width: parseFloat(e.target.value) / 1000
                    });
                  }}
                  aria-label="Section width/diameter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height/Depth (mm)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedSection.height * 1000}
                  onChange={(e) => {
                    setSelectedSection({
                      ...selectedSection,
                      height: parseFloat(e.target.value) / 1000
                    });
                  }}
                  aria-label="Section height"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (cm²)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={(selectedSection.area * 10000).toFixed(2)}
                  readOnly
                  aria-label="Section area"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moment of Inertia (cm⁴)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={(selectedSection.momentOfInertiaX * 100000000).toFixed(0)}
                  readOnly
                  aria-label="Moment of inertia"
                />
              </div>
            </div>
            
            <div className="p-3 rounded bg-indigo-50">
              <h4 className="text-sm font-medium mb-2">Recommended Load</h4>
              <p className="text-sm text-gray-700">
                Recommended axial load capacity: <span className="font-semibold">{(calculateRecommendedLoad() / 1000).toFixed(2)} kN</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Column Parameters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Column Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Column Length (m)
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={columnLength}
                onChange={(e) => setColumnLength(parseFloat(e.target.value))}
                min="0.1"
                step="0.1"
                aria-label="Column length"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Length Factor (K)
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={effectiveLengthFactor}
                onChange={(e) => setEffectiveLengthFactor(parseFloat(e.target.value))}
                aria-label="Effective length factor"
              >
                {effectiveLengthFactors.map((factor, index) => (
                  <option key={index} value={factor.value}>
                    {factor.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Axial Load (kN)
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={axialLoad / 1000}
                onChange={(e) => setAxialLoad(parseFloat(e.target.value) * 1000)}
                min="0"
                step="1"
                aria-label="Axial load"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moment X (kN·m)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={momentX}
                  onChange={(e) => setMomentX(parseFloat(e.target.value))}
                  min="0"
                  step="0.1"
                  aria-label="Moment X"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eccentricity (mm)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={eccentricity}
                  onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                  min="0"
                  step="1"
                  aria-label="Eccentricity"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  id="is-braced"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={isBraced}
                  onChange={(e) => setIsBraced(e.target.checked)}
                />
                <label htmlFor="is-braced" className="ml-2 block text-sm text-gray-700">
                  Column is laterally braced
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Un-braced columns have reduced buckling resistance
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Column Analysis Results */}
      <ColumnAnalysis
        section={selectedSection}
        material={selectedMaterial}
        length={columnLength}
        axialLoad={axialLoad}
        eccentricity={eccentricity}
        effectiveLengthFactor={effectiveLengthFactor}
        momentX={momentX}
        momentY={momentY}
        braced={isBraced}
      />
    </div>
  );
} 