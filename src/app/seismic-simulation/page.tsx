'use client';

import React, { useState, Suspense } from 'react';
import { Material, SeismicParameters } from '@/lib/types';
import SeismicParametersForm from '@/components/SeismicParametersForm';
import SeismicSimulationWrapper from './seismic-wrapper';

// Loading component for parameters form
const ParametersFormLoading = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4">Seismic Parameters</h2>
    <div className="p-6 bg-gray-100 rounded">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default function SeismicSimulationPage() {
  // Default building parameters
  const [buildingParameters, setBuildingParameters] = useState({
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
    materialName: 'Steel_S275',
    beamSection: 'IPE300',
    columnSection: 'HEB200',
    designCode: 'Eurocode'
  });

  // Default material for visualization
  const [material, setMaterial] = useState<Material>({
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
  });

  // Default seismic parameters
  const [seismicParameters, setSeismicParameters] = useState<SeismicParameters>({
    intensity: 0.3, // g
    frequency: 2.0, // Hz
    duration: 15, // seconds
    direction: 'both',
    spectralAcceleration: 0.75, // g
    importanceFactor: 1.0,
    responseModificationFactor: 4.5,
    soilType: 'C',
    dampingRatio: 0.05
  });

  // Analysis results state
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleParametersChange = (params: SeismicParameters) => {
    setSeismicParameters(params);
    console.log('Parameters updated:', params);
  };
  
  const handleSimulationComplete = (results: any) => {
    console.log('Simulation results:', results);
    setAnalysisResults(results);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Seismic Simulation</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Suspense fallback={<ParametersFormLoading />}>
            <SeismicParametersForm 
              onParametersChange={handleParametersChange}
              initialParameters={seismicParameters}
            />
          </Suspense>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Seismic Simulation</h2>
            <SeismicSimulationWrapper
              buildingParameters={buildingParameters}
              material={material}
              seismicParameters={seismicParameters}
              onSimulationComplete={handleSimulationComplete}
            />
          </div>
          
          {analysisResults && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500">Maximum Displacement</p>
                  <p className="text-lg font-semibold">{analysisResults.maxDisplacement.toFixed(3)} mm</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500">Base Shear</p>
                  <p className="text-lg font-semibold">{analysisResults.baseShear.toFixed(2)} kN</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500">Period of Vibration</p>
                  <p className="text-lg font-semibold">{analysisResults.periodOfVibration.toFixed(3)} s</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Story Drifts</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Story
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Drift (mm)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Drift Ratio (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisResults.storyDrifts && analysisResults.storyDrifts.map((drift: number, index: number) => (
                        <tr key={`story-drift-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {drift.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {((drift / (buildingParameters.buildingHeight / buildingParameters.numberOfStoreys * 1000)) * 100).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {!analysisResults && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              <p className="text-gray-600 mb-4">Run the simulation to see results.</p>
              <p className="text-sm text-gray-500">Adjust the seismic parameters on the left and use the simulation controls above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 