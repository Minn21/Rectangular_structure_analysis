'use client';

import React, { useState } from 'react';
import { SeismicParameters } from '@/lib/types';

interface SeismicParametersFormProps {
  onParametersChange: (parameters: SeismicParameters) => void;
  initialParameters?: Partial<SeismicParameters>;
}

const defaultSeismicParameters: SeismicParameters = {
  intensity: 0.2, // 0.2g - moderate earthquake
  frequency: 2.0, // 2 Hz - typical earthquake frequency
  duration: 15, // 15 seconds
  direction: 'both', // Both X and Z directions
  spectralAcceleration: 0.4, // 0.4g
  importanceFactor: 1.0, // Standard importance
  responseModificationFactor: 3.5, // Typical for moment frames
  soilType: 'C', // Medium-dense soil
  dampingRatio: 0.05 // 5% damping
};

const SeismicParametersForm: React.FC<SeismicParametersFormProps> = ({
  onParametersChange,
  initialParameters = {}
}) => {
  // Merge initial parameters with defaults
  const [parameters, setParameters] = useState<SeismicParameters>({
    ...defaultSeismicParameters,
    ...initialParameters
  });
  
  // Handle parameter change
  const handleParameterChange = (name: keyof SeismicParameters, value: any) => {
    const updatedParameters = {
      ...parameters,
      [name]: value
    };
    
    setParameters(updatedParameters);
    onParametersChange(updatedParameters);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold border-b pb-2 mb-3">Seismic Load Parameters</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intensity (g)
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={parameters.intensity}
              onChange={(e) => handleParameterChange('intensity', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.1g (Minor)</span>
              <span>{parameters.intensity}g</span>
              <span>1.0g (Severe)</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency (Hz)
            </label>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={parameters.frequency}
              onChange={(e) => handleParameterChange('frequency', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.5Hz (Slow)</span>
              <span>{parameters.frequency}Hz</span>
              <span>5.0Hz (Fast)</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <select
              value={parameters.direction}
              onChange={(e) => handleParameterChange('direction', e.target.value as SeismicParameters['direction'])}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="x">X-Direction (Length)</option>
              <option value="z">Z-Direction (Width)</option>
              <option value="both">Both Directions</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              step="5"
              value={parameters.duration}
              onChange={(e) => handleParameterChange('duration', parseInt(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soil Type
            </label>
            <select
              value={parameters.soilType}
              onChange={(e) => handleParameterChange('soilType', e.target.value as SeismicParameters['soilType'])}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="A">Type A (Hard Rock)</option>
              <option value="B">Type B (Rock)</option>
              <option value="C">Type C (Dense Soil)</option>
              <option value="D">Type D (Stiff Soil)</option>
              <option value="E">Type E (Soft Soil)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importance Factor
            </label>
            <select
              value={parameters.importanceFactor}
              onChange={(e) => handleParameterChange('importanceFactor', parseFloat(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="0.8">0.8 (Low Importance)</option>
              <option value="1.0">1.0 (Standard Building)</option>
              <option value="1.25">1.25 (High Importance)</option>
              <option value="1.5">1.5 (Essential Facility)</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Modification Factor (R)
            </label>
            <select
              value={parameters.responseModificationFactor}
              onChange={(e) => handleParameterChange('responseModificationFactor', parseFloat(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="1.5">1.5 (Brittle Systems)</option>
              <option value="3.5">3.5 (Ordinary Moment Frames)</option>
              <option value="5.0">5.0 (Intermediate Moment Frames)</option>
              <option value="8.0">8.0 (Special Moment Frames)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spectral Acceleration (g)
            </label>
            <input
              type="number"
              min="0.1"
              max="2.0"
              step="0.1"
              value={parameters.spectralAcceleration}
              onChange={(e) => handleParameterChange('spectralAcceleration', parseFloat(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="p-3 rounded bg-blue-50">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Seismic Design Information</h4>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Intensity: {parameters.intensity}g - {parameters.intensity < 0.2 ? 'Minor' : parameters.intensity < 0.4 ? 'Moderate' : parameters.intensity < 0.6 ? 'Strong' : 'Severe'} earthquake</li>
            <li>Soil Type {parameters.soilType}: {{
              'A': 'Hard rock (VS30 > 1500 m/s)',
              'B': 'Rock (760 < VS30 < 1500 m/s)',
              'C': 'Dense soil (360 < VS30 < 760 m/s)',
              'D': 'Stiff soil (180 < VS30 < 360 m/s)',
              'E': 'Soft soil (VS30 < 180 m/s)'
            }[parameters.soilType]}</li>
            <li>Design spectral acceleration: {parameters.spectralAcceleration}g</li>
            <li>Building importance factor: {parameters.importanceFactor}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SeismicParametersForm;