'use client';
import React, { useState } from 'react';
import { ParameterForm } from './ParameterForm';
import { Visualization } from './Visualization';
import CalculationResults from './CalculationResults';
import { BuildingParameters, CalculationResults as CalculationResultsType } from '../lib/types';
import { calculateBuildingResults } from '../lib/calculations';

export default function StructuralAnalysis() {
  const [parameters, setParameters] = useState<BuildingParameters>({
    buildingLength: 10,
    buildingWidth: 8,
    buildingHeight: 3,
    numberOfStoreys: 1,
    columnsAlongLength: 2,
    columnsAlongWidth: 2,
    beamsAlongLength: 1,
    beamsAlongWidth: 1,
    slabThickness: 0.2,
    slabLoad: 5000,
    beamWidth: 0.3,
    beamHeight: 0.5,
    elasticModulus: 2e11,
    columnWidth: 0.3,
    columnDepth: 0.3,
    materialName: 'steel',
    beamSection: '',
    columnSection: '',
  });

  const [results, setResults] = useState<CalculationResultsType>(
    calculateBuildingResults(parameters)
  );

  const handleParametersChange = (newParams: BuildingParameters) => {
    setParameters(newParams);
    setResults(calculateBuildingResults(newParams));
  };

  return (
    <div className="container-responsive py-4 md:py-6 lg:py-8 space-y-4 md:space-y-6 lg:space-y-8">
      <header className="text-center mb-4 md:mb-6 lg:mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Structural Analysis Studio
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
          Interactive 3D structural modeling and analysis for building design
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4">
            <ParameterForm onParametersChange={handleParametersChange} />
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
          <div className="card">
            <Visualization parameters={parameters} results={results} />
          </div>
          <CalculationResults results={results} />
        </div>
      </div>
    </div>
  );
}