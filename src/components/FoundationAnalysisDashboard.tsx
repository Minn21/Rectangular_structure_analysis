'use client';

import React, { useState, useEffect } from 'react';
import { Foundation, FoundationType } from '../lib/types';
import { estimateFoundationCost, recommendOptimalFoundation } from '../lib/foundations';
import SettlementAnalysis from './SettlementAnalysis';
import { useFoundation } from '@/providers/FoundationProvider';

const FoundationAnalysisDashboard: React.FC = () => {
  // Use the foundation context
  const { 
    foundations, 
    currentFoundation, 
    setCurrentFoundation, 
    addFoundation, 
    updateFoundation 
  } = useFoundation();
  
  // State for foundation parameters
  const [foundation, setFoundation] = useState<Foundation>({
    type: 'MatFoundation',
    dimensions: { length: 15, width: 15, depth: 0.8 },
    reinforcementDetails: '12mm bars @ 200mm c/c both ways, 2 layers of reinforcement',
    material: 'Concrete',
    soilBearingCapacity: 150000, // 150 kPa in Pa
    depthBelowGrade: 1.0
  });
  
  // State for soil properties
  const [soilProperties, setSoilProperties] = useState({
    soilType: 'Medium clay',
    elasticModulus: 15,
    compressionIndex: 0.25,
    voidRatio: 0.9,
    waterContent: 30,
    plasticityIndex: 20,
    SPTvalue: 8
  });
  
  // State for building parameters
  const [buildingParameters] = useState({
    totalBuildingLoad: 10000000, // 10,000 kN
    buildingArea: 400,
    buildingHeight: 25,
    columnSpacing: 5,
    buildingType: 'residential',
    columnLoads: [800000, 900000, 1100000, 1000000, 900000, 1200000],
    maximumColumnLoad: 1200000
  });
  
  // State for region and project scale
  const [region, setRegion] = useState('US');
  const [projectScale, setProjectScale] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Sync with context when currentFoundation changes
  useEffect(() => {
    if (currentFoundation) {
      setFoundation(currentFoundation);
    }
  }, [currentFoundation]);
  
  // Calculate cost estimation
  const costEstimation = estimateFoundationCost(
    foundation,
    region,
    projectScale
  );
  
  // Calculate recommended foundation
  const recommendationResults = recommendOptimalFoundation(
    buildingParameters,
    {
      soilType: soilProperties.soilType,
      groundwaterLevel: 3,
      frostDepth: 0.5,
      adjacentStructures: false,
      SPTvalue: soilProperties.SPTvalue
    },
    {
      sitePrepared: true,
      accessForEquipment: true,
      constructionSchedule: 6,
      environmentalConstraints: []
    }
  );
  
  // Load parameters for settlement calculation
  const loadParameters = {
    totalLoad: buildingParameters.totalBuildingLoad,
    averagePressure: buildingParameters.totalBuildingLoad / (foundation.dimensions.length * foundation.dimensions.width) / 1000,
    eccentricity: { x: 0, y: 0 } // No eccentricity by default
  };
  
  // Handle save foundation
  const handleSaveFoundation = () => {
    if (currentFoundation) {
      // Generate a simple ID from foundation type and dimensions
      const id = `${foundation.type}-${foundation.dimensions.length}-${foundation.dimensions.width}`;
      updateFoundation(id, foundation);
    } else {
      addFoundation(foundation);
      setCurrentFoundation(foundation);
    }
  };
  
  // Handle load foundation
  const handleLoadFoundation = (selectedFoundation: Foundation) => {
    setCurrentFoundation(selectedFoundation);
  };
  
  // Handle foundation type change
  const handleFoundationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as FoundationType;
    
    // Default dimensions based on foundation type
    let newDimensions = { ...foundation.dimensions };
    let newReinforcement = foundation.reinforcementDetails;
    
    if (newType === 'SpreadFooting') {
      newDimensions = { length: 2.5, width: 2.5, depth: 0.6 };
      newReinforcement = '16mm bars @ 150mm c/c both ways, single layer';
    } else if (newType === 'StripFooting') {
      newDimensions = { length: 15, width: 1.2, depth: 0.5 };
      newReinforcement = '12mm bars @ 200mm c/c longitudinal, 10mm @ 250mm transverse';
    } else if (newType === 'MatFoundation') {
      newDimensions = { length: 15, width: 15, depth: 0.8 };
      newReinforcement = '12mm bars @ 200mm c/c both ways, 2 layers of reinforcement';
    } else if (newType === 'PileFoundation') {
      newDimensions = { length: 15, width: 15, depth: 0.8 };
      newReinforcement = '24 piles, 450mm diameter, 12m deep, 6-16mm bars per pile';
    }
    
    setFoundation({
      ...foundation,
      type: newType,
      dimensions: newDimensions,
      reinforcementDetails: newReinforcement
    });
  };
  
  // Handle foundation dimension changes
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFoundation({
      ...foundation,
      dimensions: {
        ...foundation.dimensions,
        [name]: parseFloat(value)
      }
    });
  };
  
  // Handle soil type change
  const handleSoilTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSoilProperties({
      ...soilProperties,
      soilType: e.target.value
    });
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Foundation Analysis Dashboard</h2>
      
      {/* Foundation Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Saved Foundations</h3>
        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium text-gray-700">
            Select a foundation:
          </label>
          <select 
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            onChange={(e) => {
              const selected = foundations.find((f, idx) => idx === parseInt(e.target.value));
              if (selected) handleLoadFoundation(selected);
            }}
            value={foundations.findIndex(f => f === currentFoundation)}
            aria-label="Select foundation"
          >
            <option value="-1">-- Select a foundation --</option>
            {foundations.map((f, idx) => (
              <option key={idx} value={idx}>
                {f.type} ({f.dimensions.length}m × {f.dimensions.width}m)
              </option>
            ))}
          </select>
          
          <button
            onClick={handleSaveFoundation}
            className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Foundation
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Foundation Parameters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Foundation Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foundation Type
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={foundation.type}
                onChange={handleFoundationTypeChange}
                aria-label="Foundation type"
              >
                <option value="SpreadFooting">Spread Footing</option>
                <option value="StripFooting">Strip Footing</option>
                <option value="MatFoundation">Mat Foundation</option>
                <option value="PileFoundation">Pile Foundation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Length (m)</label>
                  <input
                    type="number"
                    name="length"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={foundation.dimensions.length}
                    onChange={handleDimensionChange}
                    min={0.1}
                    step={0.1}
                    aria-label="Foundation length"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Width (m)</label>
                  <input
                    type="number"
                    name="width"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={foundation.dimensions.width}
                    onChange={handleDimensionChange}
                    min={0.1}
                    step={0.1}
                    aria-label="Foundation width"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Depth (m)</label>
                  <input
                    type="number"
                    name="depth"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={foundation.dimensions.depth}
                    onChange={handleDimensionChange}
                    min={0.1}
                    step={0.1}
                    aria-label="Foundation depth"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reinforcement Details
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={foundation.reinforcementDetails}
                onChange={(e) => setFoundation({ ...foundation, reinforcementDetails: e.target.value })}
                rows={2}
                aria-label="Reinforcement details"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  aria-label="Region"
                >
                  <option value="US">United States</option>
                  <option value="Europe">Europe</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Asia">Asia</option>
                  <option value="Middle East">Middle East</option>
                  <option value="South America">South America</option>
                  <option value="Africa">Africa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Scale
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={projectScale}
                  onChange={(e) => setProjectScale(e.target.value as 'small' | 'medium' | 'large')}
                  aria-label="Project scale"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Soil Properties */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Soil Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Type
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={soilProperties.soilType}
                onChange={handleSoilTypeChange}
                aria-label="Soil type"
              >
                <option value="Soft clay">Soft Clay</option>
                <option value="Medium clay">Medium Clay</option>
                <option value="Stiff clay">Stiff Clay</option>
                <option value="Loose sand">Loose Sand</option>
                <option value="Medium dense sand">Medium Dense Sand</option>
                <option value="Dense sand">Dense Sand</option>
                <option value="Organic soil">Organic Soil</option>
                <option value="Silty clay">Silty Clay</option>
                <option value="Sandy clay">Sandy Clay</option>
                <option value="Silt">Silt</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SPT N-Value
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={soilProperties.SPTvalue}
                  onChange={(e) => setSoilProperties({ ...soilProperties, SPTvalue: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                  aria-label="Soil SPT N-Value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elastic Modulus (MPa)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={soilProperties.elasticModulus}
                  onChange={(e) => setSoilProperties({ ...soilProperties, elasticModulus: parseFloat(e.target.value) })}
                  min={1}
                  max={100}
                  aria-label="Soil elastic modulus"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compression Index
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={soilProperties.compressionIndex}
                  onChange={(e) => setSoilProperties({ ...soilProperties, compressionIndex: parseFloat(e.target.value) })}
                  min={0}
                  step={0.01}
                  aria-label="Soil compression index"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Void Ratio
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={soilProperties.voidRatio}
                  onChange={(e) => setSoilProperties({ ...soilProperties, voidRatio: parseFloat(e.target.value) })}
                  min={0}
                  step={0.01}
                  aria-label="Soil void ratio"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Water Content (%)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={soilProperties.waterContent}
                  onChange={(e) => setSoilProperties({ ...soilProperties, waterContent: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                  aria-label="Soil water content"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plasticity Index
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={soilProperties.plasticityIndex}
                  onChange={(e) => setSoilProperties({ ...soilProperties, plasticityIndex: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                  aria-label="Soil plasticity index"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Cost Analysis */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Cost Analysis</h3>
          
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-3xl font-bold text-indigo-600">
                ${costEstimation.total.toLocaleString()}
              </span>
              <p className="text-sm text-gray-500">Total Estimated Cost</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Cost Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(costEstimation.breakdown).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2">
                    <div className="text-sm col-span-2 capitalize">
                      {key}:
                    </div>
                    <div className="text-sm font-medium text-right">
                      ${value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Material Quantities</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm col-span-2">Concrete:</div>
                  <div className="text-sm font-medium text-right">
                    {costEstimation.quantities.concreteVolume.toFixed(2)} m³
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm col-span-2">Reinforcement:</div>
                  <div className="text-sm font-medium text-right">
                    {costEstimation.quantities.reinforcementTonnage.toFixed(2)} tons
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm col-span-2">Excavation:</div>
                  <div className="text-sm font-medium text-right">
                    {costEstimation.quantities.excavationVolume.toFixed(2)} m³
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm col-span-2">Formwork:</div>
                  <div className="text-sm font-medium text-right">
                    {costEstimation.quantities.formworkArea.toFixed(2)} m²
                  </div>
                </div>
                
                {costEstimation.quantities.pilingMeters && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm col-span-2">Piling:</div>
                    <div className="text-sm font-medium text-right">
                      {costEstimation.quantities.pilingMeters.toFixed(2)} m
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settlement Analysis */}
      <SettlementAnalysis 
        foundation={foundation}
        soilProperties={soilProperties}
        loadParameters={loadParameters}
      />
      
      {/* Foundation Recommendation */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-5">
        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Foundation Recommendation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Recommended Foundation Type:</div>
              <div className="text-lg font-bold text-indigo-600">
                {recommendationResults.recommendedFoundationType.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Alternative: {recommendationResults.alternativeFoundationType.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              
              <div className="mt-3 flex items-center">
                <span className="text-sm font-medium mr-2">Estimated Cost Impact:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  recommendationResults.estimatedCostImpact === 'high' ? 'bg-red-100 text-red-800' :
                  recommendationResults.estimatedCostImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {recommendationResults.estimatedCostImpact.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Rationale</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {recommendationResults.rationale.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Design Considerations</h4>
                {recommendationResults.specialConsiderations && recommendationResults.specialConsiderations.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {recommendationResults.specialConsiderations.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No special design considerations needed.</p>
                )}
              </div>
              
              {/* Constructability Issues */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Constructability Issues</h4>
                {recommendationResults.rationale && recommendationResults.rationale.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {recommendationResults.rationale.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No constructability issues identified.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundationAnalysisDashboard; 