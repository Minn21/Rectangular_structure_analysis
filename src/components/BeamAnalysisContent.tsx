'use client';

import React, { useState } from 'react';
import { Material, SectionProfile } from '@/lib/types';
import BeamAnalysis from '@/components/BeamAnalysis';

// Sample materials data (same as in StructuralAnalysisDashboard)
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

// Sample beam sections
const sampleSections: SectionProfile[] = [
  {
    id: 'IPE200',
    name: 'IPE 200',
    type: 'beam',
    width: 0.1, // meters (flange width)
    height: 0.2, // meters (overall height)
    area: 0.00285, // m²
    momentOfInertiaX: 1940e-8, // m⁴
    momentOfInertiaY: 142e-8, // m⁴
    description: 'European standard I-beam',
    shape: 'WShape',
    sectionModulusX: 194e-6, // m³
    sectionModulusY: 28.5e-6, // m³
    plasticModulusX: 220e-6, // m³
    plasticModulusY: 44.6e-6, // m³
    torsionalConstant: 7.02e-8, // m⁴
    shearAreaX: 0.00126, // m²
    shearAreaY: 0.00179, // m²
    flangeThickness: 0.0085, // meters
    webThickness: 0.0056, // meters
    designationCode: 'IPE200'
  },
  {
    id: 'IPE300',
    name: 'IPE 300',
    type: 'beam',
    width: 0.15, // meters (flange width)
    height: 0.3, // meters (overall height)
    area: 0.00538, // m²
    momentOfInertiaX: 8360e-8, // m⁴
    momentOfInertiaY: 604e-8, // m⁴
    description: 'European standard I-beam',
    shape: 'WShape',
    sectionModulusX: 557e-6, // m³
    sectionModulusY: 80.5e-6, // m³
    plasticModulusX: 628e-6, // m³
    plasticModulusY: 125e-6, // m³
    torsionalConstant: 20.1e-8, // m⁴
    shearAreaX: 0.00239, // m²
    shearAreaY: 0.00349, // m²
    flangeThickness: 0.0107, // meters
    webThickness: 0.0071, // meters
    designationCode: 'IPE300'
  },
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
    id: 'Rectangle_200x300',
    name: 'Rectangle 200×300',
    type: 'beam',
    width: 0.2, // meters
    height: 0.3, // meters
    area: 0.06, // m²
    momentOfInertiaX: 0.00045, // m⁴
    momentOfInertiaY: 0.0002, // m⁴
    description: 'Rectangular concrete section',
    shape: 'Rectangular',
    sectionModulusX: 0.003, // m³
    sectionModulusY: 0.002, // m³
    torsionalConstant: 0.00036, // m⁴
    shearAreaX: 0.05, // m²
    shearAreaY: 0.05, // m²
    designationCode: 'RECT200x300'
  }
];

export default function BeamAnalysisContent() {
  // Selected material and section
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(sampleMaterials[1]); // Default to Steel S275
  const [selectedSection, setSelectedSection] = useState<SectionProfile>(sampleSections[0]); // Default to IPE200
  
  // Beam parameters
  const [beamLength, setBeamLength] = useState<number>(5); // meters
  const [supportCondition, setSupportCondition] = useState<'simple' | 'fixed-fixed' | 'cantilever' | 'fixed-pinned'>('simple');
  const [uniformLoad, setUniformLoad] = useState<number>(10000); // N/m (10 kN/m)
  
  // Point loads
  const [pointLoads, setPointLoads] = useState<Array<{magnitude: number, position: number}>>([
    { magnitude: 15000, position: 2.5 } // 15 kN at middle of beam
  ]);
  
  // Helper function to add a point load
  const addPointLoad = () => {
    setPointLoads([...pointLoads, { magnitude: 10000, position: beamLength / 2 }]);
  };
  
  // Helper function to remove a point load
  const removePointLoad = (index: number) => {
    const newPointLoads = [...pointLoads];
    newPointLoads.splice(index, 1);
    setPointLoads(newPointLoads);
  };
  
  // Helper function to update a point load
  const updatePointLoad = (index: number, field: 'magnitude' | 'position', value: number) => {
    const newPointLoads = [...pointLoads];
    newPointLoads[index] = { 
      ...newPointLoads[index], 
      [field]: value 
    };
    setPointLoads(newPointLoads);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Beam Analysis</h1>
      <p className="text-gray-600 mb-8">
        Analyze the behavior of beams under various loading conditions and support configurations.
        Calculate moment, shear, and deflection diagrams.
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
                {sampleSections.filter(s => s.type === 'beam').map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name} ({section.shape})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (mm)
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
                  aria-label="Section width"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (mm)
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
                  value={(selectedSection.area ? (selectedSection.area * 10000).toFixed(2) : '0.00')}
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
              <h4 className="text-sm font-medium mb-2">Section Information</h4>
              <p className="text-sm text-gray-700">
                {selectedSection.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Beam Parameters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Beam Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beam Length (m)
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={beamLength}
                onChange={(e) => setBeamLength(parseFloat(e.target.value))}
                min="0.1"
                step="0.1"
                aria-label="Beam length"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Condition
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={supportCondition}
                onChange={(e) => setSupportCondition(e.target.value as 'simple' | 'fixed-fixed' | 'cantilever' | 'fixed-pinned')}
                aria-label="Support condition"
              >
                <option value="simple">Simply Supported</option>
                <option value="cantilever">Cantilever</option>
                <option value="fixed-fixed">Fixed at Both Ends</option>
                <option value="fixed-pinned">Fixed-Pinned</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uniform Load (kN/m)
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={uniformLoad / 1000}
                onChange={(e) => setUniformLoad(parseFloat(e.target.value) * 1000)}
                min="0"
                step="0.1"
                aria-label="Uniform load"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Point Loads */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Point Loads</h3>
        
        <div className="space-y-4">
          {pointLoads.map((load, index) => (
            <div key={index} className="flex space-x-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Load {index + 1} (kN)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={load.magnitude / 1000}
                  onChange={(e) => updatePointLoad(index, 'magnitude', parseFloat(e.target.value) * 1000)}
                  min="0"
                  step="0.1"
                  aria-label={`Point load ${index + 1} magnitude`}
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position (m from left)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={load.position}
                  onChange={(e) => updatePointLoad(index, 'position', parseFloat(e.target.value))}
                  min="0"
                  max={beamLength}
                  step="0.1"
                  aria-label={`Point load ${index + 1} position`}
                />
              </div>
              
              <button
                type="button"
                onClick={() => removePointLoad(index)}
                className="bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 mb-1"
                aria-label={`Remove point load ${index + 1}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addPointLoad}
            className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-200 inline-flex items-center"
            aria-label="Add point load"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Point Load
          </button>
        </div>
      </div>
      
      {/* Beam Analysis Results */}
      <BeamAnalysis
        material={selectedMaterial}
        section={selectedSection}
        length={beamLength}
        supportConditions={supportCondition}
        loads={{
          uniformLoad: uniformLoad / 1000,
          pointLoads: pointLoads.map(load => ({
            magnitude: load.magnitude / 1000,
            position: load.position
          }))
        }}
      />
    </div>
  );
}