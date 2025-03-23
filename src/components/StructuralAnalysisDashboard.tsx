'use client';

import React, { useState } from 'react';
import { Material, SectionProfile, BuildingParameters, DesignCode } from '@/lib/types';
import BeamAnalysis from './BeamAnalysis';
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

// Default building parameters
const defaultBuildingParameters: BuildingParameters = {
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
  columnDepth: 400,
  designCode: 'Eurocode'
};

export default function StructuralAnalysisDashboard() {
  // Selected material and section
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(sampleMaterials[1]); // Default to Steel S275
  const [selectedSection, setSelectedSection] = useState<SectionProfile>(sampleSections[0]); // Default to IPE200
  
  // Building parameters for rectangular structure
  const [buildingParameters, setBuildingParameters] = useState<BuildingParameters>(defaultBuildingParameters);
  
  // Active tab (beam or rectangular)
  const [activeTab, setActiveTab] = useState<'beam' | 'rectangular'>('beam');
  
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

  // Helper function to update building parameters
  const updateBuildingParameter = (key: keyof BuildingParameters, value: number) => {
    setBuildingParameters({
      ...buildingParameters,
      [key]: value
    });
  };
  
  const handleBuildingParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBuildingParameters(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Structural Analysis Dashboard</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'beam' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('beam')}
              aria-label="Switch to beam analysis"
              aria-selected={activeTab === 'beam'}
              role="tab"
            >
              Beam Analysis
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'rectangular' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('rectangular')}
              aria-label="Switch to rectangular structure analysis"
              aria-selected={activeTab === 'rectangular'}
              role="tab"
            >
              Rectangular Structure
            </button>
          </li>
        </ul>
      </div>
      
      {activeTab === 'beam' ? (
        <>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Density (kg/m³)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={selectedMaterial.density}
                      onChange={(e) => {
                        setSelectedMaterial({
                          ...selectedMaterial,
                          density: parseFloat(e.target.value)
                        });
                      }}
                      aria-label="Density"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poisson&apos;s Ratio
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={selectedMaterial.poissonRatio}
                      onChange={(e) => {
                        setSelectedMaterial({
                          ...selectedMaterial,
                          poissonRatio: parseFloat(e.target.value)
                        });
                      }}
                      aria-label="Poisson's ratio"
                      step="0.01"
                      min="0"
                      max="0.5"
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
                    {sampleSections.map((section) => (
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
                      value={(selectedSection.area * 10000).toFixed(2)}
                      onChange={(e) => {
                        setSelectedSection({
                          ...selectedSection,
                          area: parseFloat(e.target.value) / 10000
                        });
                      }}
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
                      onChange={(e) => {
                        setSelectedSection({
                          ...selectedSection,
                          momentOfInertiaX: parseFloat(e.target.value) / 100000000
                        });
                      }}
                      aria-label="Moment of inertia"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Modulus (cm³)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={(selectedSection.sectionModulusX * 1000000).toFixed(0)}
                    onChange={(e) => {
                      setSelectedSection({
                        ...selectedSection,
                        sectionModulusX: parseFloat(e.target.value) / 1000000
                      });
                    }}
                    aria-label="Section modulus"
                  />
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
                    Support Conditions
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={supportCondition}
                    onChange={(e) => setSupportCondition(e.target.value as 'simple' | 'fixed-fixed' | 'cantilever' | 'fixed-pinned')}
                    aria-label="Support conditions"
                  >
                    <option value="simple">Simple Support (Pinned-Roller)</option>
                    <option value="fixed-fixed">Fixed-Fixed</option>
                    <option value="cantilever">Cantilever</option>
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
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Point Loads
                    </label>
                    <button
                      type="button"
                      onClick={addPointLoad}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Load
                    </button>
                  </div>
                  
                  {pointLoads.length > 0 ? (
                    <div className="space-y-2">
                      {pointLoads.map((load, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="number"
                            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={load.magnitude / 1000}
                            onChange={(e) => updatePointLoad(index, 'magnitude', parseFloat(e.target.value) * 1000)}
                            min="0"
                            step="0.1"
                            aria-label={`Point load ${index + 1} magnitude`}
                            placeholder="kN"
                          />
                          <span className="text-xs">kN at</span>
                          <input
                            type="number"
                            className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={load.position}
                            onChange={(e) => updatePointLoad(index, 'position', parseFloat(e.target.value))}
                            min="0"
                            max={beamLength}
                            step="0.1"
                            aria-label={`Point load ${index + 1} position`}
                            placeholder="m"
                          />
                          <span className="text-xs">m</span>
                          <button
                            type="button"
                            onClick={() => removePointLoad(index)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove point load ${index + 1}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No point loads defined</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Beam Analysis Results */}
          <BeamAnalysis
            section={selectedSection}
            material={selectedMaterial}
            length={beamLength}
            loads={{
              uniformLoad: uniformLoad / 1000,
              pointLoads: pointLoads.map(load => ({
                magnitude: load.magnitude / 1000,
                position: load.position
              }))
            }}
            supportConditions={supportCondition}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Building Dimensions */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Building Dimensions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building Length (m)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.buildingLength}
                    onChange={handleBuildingParamChange}
                    name="buildingLength"
                    min="1"
                    step="0.5"
                    aria-label="Building length"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building Width (m)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.buildingWidth}
                    onChange={handleBuildingParamChange}
                    name="buildingWidth"
                    min="1"
                    step="0.5"
                    aria-label="Building width"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building Height (m)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.buildingHeight}
                    onChange={handleBuildingParamChange}
                    name="buildingHeight"
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
                    onChange={handleBuildingParamChange}
                    name="numberOfStoreys"
                    min="1"
                    step="1"
                    aria-label="Number of storeys"
                  />
                </div>
              </div>
            </div>
            
            {/* Structural Elements */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Structural Elements</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columns Along Length
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.columnsAlongLength}
                    onChange={handleBuildingParamChange}
                    name="columnsAlongLength"
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
                    onChange={handleBuildingParamChange}
                    name="columnsAlongWidth"
                    min="2"
                    step="1"
                    aria-label="Columns along width"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Column Size (mm)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={buildingParameters.columnWidth}
                      onChange={handleBuildingParamChange}
                      name="columnWidth"
                      min="200"
                      step="50"
                      aria-label="Column width"
                      placeholder="Width"
                    />
                    <span className="text-sm self-center">×</span>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={buildingParameters.columnDepth}
                      onChange={handleBuildingParamChange}
                      name="columnDepth"
                      min="200"
                      step="50"
                      aria-label="Column depth"
                      placeholder="Depth"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slab Thickness (mm)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.slabThickness}
                    onChange={handleBuildingParamChange}
                    name="slabThickness"
                    min="100"
                    step="25"
                    aria-label="Slab thickness"
                  />
                </div>
              </div>
            </div>
            
            {/* Material and Loading */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Material & Loading</h3>
              
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
                      if (selected) {
                        setSelectedMaterial(selected);
                        updateBuildingParameter('elasticModulus', selected.elasticModulus);
                      }
                    }}
                    aria-label="Building material"
                  >
                    {sampleMaterials.map((material) => (
                      <option key={material.name} value={material.name}>
                        {material.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elastic Modulus (MPa)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.elasticModulus}
                    onChange={handleBuildingParamChange}
                    name="elasticModulus"
                    aria-label="Elastic modulus"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Code
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.designCode}
                    onChange={(e) => setBuildingParameters({
                      ...buildingParameters,
                      designCode: e.target.value as DesignCode
                    })}
                    aria-label="Design code"
                  >
                    <option value="ASCE7-16">ASCE 7-16</option>
                    <option value="ASCE7-22">ASCE 7-22</option>
                    <option value="Eurocode">Eurocode</option>
                    <option value="IS456">IS 456</option>
                    <option value="BS5950">BS 5950</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slab Load (kN/m²)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={buildingParameters.slabLoad}
                    onChange={handleBuildingParamChange}
                    name="slabLoad"
                    min="1"
                    step="0.5"
                    aria-label="Slab load"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Rectangular Structure Analysis */}
          <RectangularStructureAnalysis 
            buildingParameters={buildingParameters}
            material={selectedMaterial}
          />
        </>
      )}
    </div>
  );
} 