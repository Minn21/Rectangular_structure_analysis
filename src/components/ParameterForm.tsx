'use client';
import React, { useState, useEffect } from 'react';
import { BuildingParameters } from '../lib/types';
import { getMaterialNames } from '../lib/materials';
import { validateParameters } from '../lib/calculations';

interface ParameterFormProps {
  initialParameters: BuildingParameters;
  onParametersSubmit: (parameters: BuildingParameters) => void;
}

export default function ParameterForm({
  initialParameters,
  onParametersSubmit
}: ParameterFormProps) {
  const [parameters, setParameters] = useState<BuildingParameters>(initialParameters);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [materialOptions, setMaterialOptions] = useState<string[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'geometry' | 'structure' | 'materials'>('geometry');
  
  // Load available materials when component mounts
  useEffect(() => {
    setMaterialOptions(getMaterialNames());
  }, []);
  
  // Handle unit system change
  const handleUnitSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnitSystem = e.target.value as 'metric' | 'imperial';
    setUnitSystem(newUnitSystem);
    
    // Convert values based on the new unit system
    if (newUnitSystem !== unitSystem) {
      const updated = { ...parameters };
      
      if (newUnitSystem === 'imperial') {
        // Convert from metric to imperial
        updated.buildingLength = updated.buildingLength * 3.28084; // m to ft
        updated.buildingWidth = updated.buildingWidth * 3.28084;
        updated.buildingHeight = updated.buildingHeight * 3.28084;
        updated.beamWidth = updated.beamWidth * 3.28084;
        updated.beamHeight = updated.beamHeight * 3.28084;
        updated.slabThickness = updated.slabThickness * 3.28084;
        updated.columnWidth = updated.columnWidth * 3.28084;
        updated.columnDepth = updated.columnDepth * 3.28084;
        updated.slabLoad = updated.slabLoad * 0.020885; // N/m² to lbf/ft²
      } else {
        // Convert from imperial to metric
        updated.buildingLength = updated.buildingLength * 0.3048; // ft to m
        updated.buildingWidth = updated.buildingWidth * 0.3048;
        updated.buildingHeight = updated.buildingHeight * 0.3048;
        updated.beamWidth = updated.beamWidth * 0.3048;
        updated.beamHeight = updated.beamHeight * 0.3048;
        updated.slabThickness = updated.slabThickness * 0.3048;
        updated.columnWidth = updated.columnWidth * 0.3048;
        updated.columnDepth = updated.columnDepth * 0.3048;
        updated.slabLoad = updated.slabLoad * 47.8803; // lbf/ft² to N/m²
      }
      
      // Round values to 2 decimal places for display
      Object.keys(updated).forEach(key => {
        const k = key as keyof BuildingParameters;
        if (typeof updated[k] === 'number' && k !== 'elasticModulus') {
          // Use type assertion to tell TypeScript this is a numeric property
          (updated[k] as number) = Math.round((updated[k] as number) * 100) / 100;
        }
      });
      
      setParameters(updated);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? Number(value) : value;
    
    setParameters(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate parameters
    const validation = validateParameters(parameters);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Clear any previous validation errors
    setValidationErrors([]);
    
    // Add unit system to parameters
    const finalParameters = {
      ...parameters,
      unitSystem
    };
    
    onParametersSubmit(finalParameters);
  };

  // Get the unit label for a parameter
  const getUnitLabel = (paramType: 'length' | 'load' | 'pressure') => {
    switch(paramType) {
      case 'length':
        return unitSystem === 'metric' ? 'm' : 'ft';
      case 'load':
        return unitSystem === 'metric' ? 'N/m²' : 'lbf/ft²';
      case 'pressure':
        return unitSystem === 'metric' ? 'Pa' : 'psi';
      default:
        return '';
    }
  };

  const renderInput = (
    id: keyof BuildingParameters, 
    label: string, 
    unitType: 'length' | 'load' | 'pressure' | 'none' = 'length',
    min: number = 0,
    step: string = "any"
  ) => {
    const unitLabel = unitType === 'none' ? '' : getUnitLabel(unitType);
    
    // Get the value, ensuring it's a string or number
    const getValue = () => {
      const value = parameters[id];
      if (value === undefined || value === null) return '';
      if (typeof value === 'string' || typeof value === 'number') return value;
      return ''; // For complex objects like Location, return empty string
    };

  return (
      <div className="form-group">
        <label htmlFor={id} className="form-label flex justify-between">
          <span>{label}</span>
          {unitLabel && <span className="text-xs text-gray-500">{unitLabel}</span>}
        </label>
        <div className="relative">
          <input
            type="number"
            id={id}
            name={id}
            value={getValue()}
            onChange={handleInputChange}
            step={step}
            min={min}
            className="input-primary pr-10"
            required
          />
          {unitLabel && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-400 sm:text-sm">{unitLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="form-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Building Parameters</h2>
        
        {/* Unit system selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="unitSystem" className="text-xs md:text-sm text-gray-600">Units:</label>
          <select
            id="unitSystem"
            name="unitSystem"
            value={unitSystem}
            onChange={handleUnitSystemChange}
            className="input-primary py-1 px-2 text-sm"
          >
            <option value="metric">Metric (m, N)</option>
            <option value="imperial">Imperial (ft, lbf)</option>
          </select>
        </div>
        </div>
        
      {/* Display validation errors if any */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700">
          <h3 className="text-sm font-medium mb-2">Please correct the following errors:</h3>
          <ul className="list-disc pl-5 text-xs space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parameter Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide bg-gray-100/60 backdrop-blur-sm rounded-lg p-1">
          {(['geometry', 'structure', 'materials'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm md:text-base font-medium rounded-md whitespace-nowrap transition-all duration-200 mx-0.5 capitalize
                ${activeTab === tab 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-white/60 hover:text-blue-600'}`}
            >
              {tab === 'geometry' ? 'Building Geometry' : tab === 'structure' ? 'Structural Elements' : 'Materials'}
            </button>
          ))}
        </div>
        
        {/* Geometry Tab */}
        {activeTab === 'geometry' && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Building Dimensions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {renderInput('buildingLength', 'Building Length')}
              {renderInput('buildingWidth', 'Building Width')}
              {renderInput('buildingHeight', 'Story Height')}
              {renderInput('numberOfStoreys', 'Number of Storeys', 'none', 1, "1")}
            </div>
        </div>
        )}

        {/* Structure Tab */}
        {activeTab === 'structure' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Column Layout</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {renderInput('columnsAlongLength', 'Columns Along Length', 'none', 2, "1")}
                {renderInput('columnsAlongWidth', 'Columns Along Width', 'none', 2, "1")}
              </div>
        </div>
        
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Beams</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {renderInput('beamWidth', 'Beam Width')}
                {renderInput('beamHeight', 'Beam Height')}
        </div>
      </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Columns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {renderInput('columnWidth', 'Column Width')}
                {renderInput('columnDepth', 'Column Depth')}
              </div>
          </div>
          
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Slab</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {renderInput('slabThickness', 'Slab Thickness')}
                {renderInput('slabLoad', 'Slab Load', 'load')}
              </div>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Material Properties</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group">
                <label htmlFor="materialName" className="form-label">Structural Material</label>
                <select
                  id="materialName"
                  name="materialName"
                  value={parameters.materialName || 'steel'}
                  onChange={handleInputChange}
              className="input-primary"
                >
                  {materialOptions.map(material => (
                    <option key={material} value={material}>
                      {material.charAt(0).toUpperCase() + material.slice(1)}
                    </option>
                  ))}
                </select>
          </div>
          
              {renderInput('elasticModulus', 'Elastic Modulus', 'pressure')}
          </div>

            {/* Toggle for advanced options */}
            <div className="pt-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center hover-lift group"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <span className={`inline-flex justify-center items-center w-6 h-6 mr-2 rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:bg-blue-200 ${showAdvancedOptions ? 'rotate-180' : ''}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
          </div>
          
            {/* Advanced options */}
            {showAdvancedOptions && (
              <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-4 border-b pb-2">Advanced Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderInput('beamsAlongLength', 'Beams Along Length', 'none', 1, "1")}
                  {renderInput('beamsAlongWidth', 'Beams Along Width', 'none', 1, "1")}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center gap-2 hover-lift"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Calculate Results
          </button>
        </div>
      </form>
      </div>
  );
}