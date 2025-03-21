'use client';
import React, { useState } from 'react';
import { BuildingParameters } from '../lib/types';
import { getMaterial, getMaterialNames } from '../lib/materials';
import { getBeamSection, getColumnSection, getSectionsByType } from '../lib/sections';

interface ParameterFormProps {
  onParametersChange: (params: BuildingParameters) => void;
}

export const ParameterForm: React.FC<ParameterFormProps> = ({ onParametersChange }) => {
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

  const [activeSection, setActiveSection] = useState<'geometry' | 'material' | 'elements'>('geometry');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedParams = {
      ...parameters,
      [name]: [
        'numberOfStoreys',
        'columnsAlongLength',
        'columnsAlongWidth',
        'beamsAlongLength',
        'beamsAlongWidth'
      ].includes(name)
        ? parseInt(value)
        : ['materialName', 'beamSection', 'columnSection'].includes(name)
          ? value
          : parseFloat(value),
    };
    
    // Update elastic modulus when material changes
    if (name === 'materialName') {
      const material = getMaterial(value);
      updatedParams.elasticModulus = material.elasticModulus;
    }
    
    // Update beam dimensions when beam section changes
    if (name === 'beamSection' && value) {
      const section = getBeamSection(value);
      if (section) {
        updatedParams.beamWidth = section.width;
        updatedParams.beamHeight = section.height;
      }
    }
    
    // Update column dimensions when column section changes
    if (name === 'columnSection' && value) {
      const section = getColumnSection(value);
      if (section) {
        updatedParams.columnWidth = section.width;
        updatedParams.columnDepth = section.height;
      }
    }
    
    setParameters(updatedParams);
    onParametersChange(updatedParams);
  };

  const materialOptions = getMaterialNames().map(name => {
    const material = getMaterial(name);
    return (
      <option key={name} value={name}>
        {material.displayName}
      </option>
    );
  });
  
  const beamSectionOptions = getSectionsByType('beam').map(section => (
    <option key={section.id} value={section.id}>
      {section.name} ({section.width*1000}x{section.height*1000}mm)
    </option>
  ));
  
  const columnSectionOptions = getSectionsByType('column').map(section => (
    <option key={section.id} value={section.id}>
      {section.name} ({section.width*1000}x{section.height*1000}mm)
    </option>
  ));

  const material = getMaterial(parameters.materialName || 'steel');

  return (
    <div className="form-card">
      <h2 className="text-lg md:text-xl font-semibold text-gray-800 pb-3 md:pb-4 border-b border-gray-200 mb-4 md:mb-5">Building Parameters</h2>
      
      {/* Tab navigation */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4 md:mb-6">
        <button
          onClick={() => setActiveSection('geometry')}
          className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors ${
            activeSection === 'geometry'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
          }`}
          title="Show geometry parameters"
        >
          Geometry
        </button>
        <button
          onClick={() => setActiveSection('material')}
          className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors ${
            activeSection === 'material'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
          }`}
          title="Show material parameters"
        >
          Material
        </button>
        <button
          onClick={() => setActiveSection('elements')}
          className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors ${
            activeSection === 'elements'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
          }`}
          title="Show element parameters"
        >
          Elements
        </button>
      </div>
      
      {/* Geometry Section */}
      {activeSection === 'geometry' && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="form-group">
              <label htmlFor="buildingLength" className="form-label">Building Length (m)</label>
              <div className="relative">
                <input
                  id="buildingLength"
                  type="number"
                  name="buildingLength"
                  value={parameters.buildingLength}
                  onChange={handleChange}
                  className="input-primary"
                  min="1"
                  step="0.1"
                  title="Building length value"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs md:text-sm text-gray-500">m</span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="buildingWidth" className="form-label">Building Width (m)</label>
              <div className="relative">
                <input
                  id="buildingWidth"
                  type="number"
                  name="buildingWidth"
                  value={parameters.buildingWidth}
                  onChange={handleChange}
                  className="input-primary"
                  min="1"
                  step="0.1"
                  title="Building width value"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs md:text-sm text-gray-500">m</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="form-group">
              <label htmlFor="buildingHeight" className="form-label">Storey Height (m)</label>
              <div className="relative">
                <input
                  id="buildingHeight"
                  type="number"
                  name="buildingHeight"
                  value={parameters.buildingHeight}
                  onChange={handleChange}
                  className="input-primary"
                  min="1"
                  step="0.1"
                  title="Storey height value"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs md:text-sm text-gray-500">m</span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="numberOfStoreys" className="form-label">Number of Storeys</label>
              <input
                id="numberOfStoreys"
                type="number"
                name="numberOfStoreys"
                value={parameters.numberOfStoreys}
                onChange={handleChange}
                className="input-primary"
                min="1"
                step="1"
                title="Number of storeys value"
              />
            </div>
          </div>

          <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Structural Grid</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="form-group">
                <label htmlFor="columnsAlongLength" className="form-label">Columns Along Length</label>
                <input
                  id="columnsAlongLength"
                  type="number"
                  name="columnsAlongLength"
                  value={parameters.columnsAlongLength}
                  onChange={handleChange}
                  className="input-primary"
                  min="2"
                  step="1"
                  title="Columns along length value"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="columnsAlongWidth" className="form-label">Columns Along Width</label>
                <input
                  id="columnsAlongWidth"
                  type="number"
                  name="columnsAlongWidth"
                  value={parameters.columnsAlongWidth}
                  onChange={handleChange}
                  className="input-primary"
                  min="2"
                  step="1"
                  title="Columns along width value"
                />
              </div>

              <div className="form-group">
                <label htmlFor="beamsAlongLength" className="form-label">Beams Along Length</label>
                <input
                  id="beamsAlongLength"
                  type="number"
                  name="beamsAlongLength"
                  value={parameters.beamsAlongLength}
                  onChange={handleChange}
                  className="input-primary"
                  min="1"
                  step="1"
                  title="Beams along length value"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="beamsAlongWidth" className="form-label">Beams Along Width</label>
                <input
                  id="beamsAlongWidth"
                  type="number"
                  name="beamsAlongWidth"
                  value={parameters.beamsAlongWidth}
                  onChange={handleChange}
                  className="input-primary"
                  min="1"
                  step="1"
                  title="Beams along width value"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Material Section */}
      {activeSection === 'material' && (
        <div className="space-y-4 md:space-y-6">
          <div className="p-3 md:p-5 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full mb-2 sm:mb-0 sm:mr-4" style={{ backgroundColor: material.color }}></div>
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-800">{material.displayName}</h3>
                <p className="text-xs md:text-sm text-gray-600">{material.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white p-2 md:p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Elastic Modulus</p>
                <p className="font-medium">{(material.elasticModulus / 1e9).toFixed(1)} GPa</p>
              </div>
              
              <div className="bg-white p-2 md:p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Density</p>
                <p className="font-medium">{material.density} kg/m³</p>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="materialName" className="form-label">Select Material</label>
            <select
              id="materialName"
              name="materialName"
              value={parameters.materialName}
              onChange={handleChange}
              className="input-primary w-full"
              title="Select material type"
              aria-label="Select material"
            >
              {materialOptions}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="elasticModulus" className="form-label">Elastic Modulus (Pa)</label>
            <div className="relative">
              <input
                id="elasticModulus"
                type="number"
                name="elasticModulus"
                value={parameters.elasticModulus}
                onChange={handleChange}
                className="input-primary"
                min="1e9"
                step="1e9"
                title="Elastic modulus value"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">Pa</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Elements Section */}
      {activeSection === 'elements' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Predefined Sections</h3>
            
            <div className="grid grid-cols-1 gap-4 mb-5">
              <div className="form-group">
                <label htmlFor="beamSection" className="form-label">Beam Section</label>
                <select
                  id="beamSection"
                  name="beamSection"
                  value={parameters.beamSection}
                  onChange={handleChange}
                  className="input-primary w-full"
                  title="Select beam section"
                  aria-label="Select beam section"
                >
                  <option value="">Custom</option>
                  {beamSectionOptions}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="columnSection" className="form-label">Column Section</label>
                <select
                  id="columnSection"
                  name="columnSection"
                  value={parameters.columnSection}
                  onChange={handleChange}
                  className="input-primary w-full"
                  title="Select column section"
                  aria-label="Select column section"
                >
                  <option value="">Custom</option>
                  {columnSectionOptions}
                </select>
              </div>
            </div>
            
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Dimensions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="beamWidth" className="form-label">Beam Width (m)</label>
                <div className="relative">
                  <input
                    id="beamWidth"
                    type="number"
                    name="beamWidth"
                    value={parameters.beamWidth}
                    onChange={handleChange}
                    className="input-primary"
                    min="0.1"
                    step="0.01"
                    title="Beam width value"
                    disabled={!!parameters.beamSection}
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">m</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="beamHeight" className="form-label">Beam Height (m)</label>
                <div className="relative">
                  <input
                    id="beamHeight"
                    type="number"
                    name="beamHeight"
                    value={parameters.beamHeight}
                    onChange={handleChange}
                    className="input-primary"
                    min="0.1"
                    step="0.01"
                    title="Beam height value"
                    disabled={!!parameters.beamSection}
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">m</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="columnWidth" className="form-label">Column Width (m)</label>
                <div className="relative">
                  <input
                    id="columnWidth"
                    type="number"
                    name="columnWidth"
                    value={parameters.columnWidth}
                    onChange={handleChange}
                    className="input-primary"
                    min="0.1"
                    step="0.01"
                    title="Column width value"
                    disabled={!!parameters.columnSection}
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">m</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="columnDepth" className="form-label">Column Depth (m)</label>
                <div className="relative">
                  <input
                    id="columnDepth"
                    type="number"
                    name="columnDepth"
                    value={parameters.columnDepth}
                    onChange={handleChange}
                    className="input-primary"
                    min="0.1"
                    step="0.01"
                    title="Column depth value"
                    disabled={!!parameters.columnSection}
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">m</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="slabThickness" className="form-label">Slab Thickness (m)</label>
            <div className="relative">
              <input
                id="slabThickness"
                type="number"
                name="slabThickness"
                value={parameters.slabThickness}
                onChange={handleChange}
                className="input-primary"
                min="0.1"
                step="0.01"
                title="Slab thickness value"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">m</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="slabLoad" className="form-label">Slab Load (N/m²)</label>
            <div className="relative">
              <input
                id="slabLoad"
                type="number"
                name="slabLoad"
                value={parameters.slabLoad}
                onChange={handleChange}
                className="input-primary"
                min="1000"
                step="100"
                title="Slab load value"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">N/m²</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};