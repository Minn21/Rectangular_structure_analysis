import React, { useState } from 'react';
import type { CalculationResults } from '../lib/types';

interface CalculationResultsProps {
  results: CalculationResults;
}

export default function CalculationResults({ results }: CalculationResultsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'beams' | 'columns'>('summary');
  
  const exportResults = () => {
    const csvContent = [
      'Metric,Value,Unit',
      `Max Beam Deflection,${results.maxBeamDeflection.toFixed(6)},m`,
      `Max Beam Stress,${(results.maxBeamStress / 1e6).toFixed(2)},MPa`,
      `Max Column Stress,${(results.maxColumnStress / 1e6).toFixed(2)},MPa`,
      '\nBeam Results',
      'Beam #,Max Deflection (m),Max Stress (MPa),Left Reaction (N),Right Reaction (N)',
      ...results.beamResults.map((beam, index) => 
        `${index + 1},${beam.maxDeflection.toFixed(6)},${(beam.maxStress / 1e6).toFixed(2)},${beam.reactionLeft.toFixed(2)},${beam.reactionRight.toFixed(2)}`
      ),
      '\nColumn Loads',
      'Column #,Axial Load (N)',
      ...results.columnAxialLoads.map((load, index) => 
        `${index + 1},${load.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'structural_analysis_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center p-3 md:p-5 border-b border-gray-100">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Analysis Results</h2>
        <button 
          onClick={exportResults}
          className="btn-primary btn-sm flex items-center"
          title="Export results to CSV file"
        >
          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex px-2 md:px-5 -mb-px min-w-full" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Summary
          </button>
          
          <button
            onClick={() => setActiveTab('beams')}
            className={`py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'beams'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Beam Analysis
          </button>
          
          <button
            onClick={() => setActiveTab('columns')}
            className={`py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'columns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Column Analysis
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-3 md:p-5">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            <div className="result-card">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500 font-medium">Max Beam Deflection</h3>
                  <p className="text-lg md:text-2xl font-bold text-blue-600">{results.maxBeamDeflection.toFixed(6)} <span className="text-xs md:text-sm font-normal text-gray-500">m</span></p>
                </div>
                <div className="stress-indicator bg-blue-500"></div>
              </div>
            </div>

            <div className="result-card">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500 font-medium">Max Beam Stress</h3>
                  <p className="text-lg md:text-2xl font-bold text-yellow-600">{(results.maxBeamStress / 1e6).toFixed(2)} <span className="text-xs md:text-sm font-normal text-gray-500">MPa</span></p>
                </div>
                <div className="stress-indicator bg-yellow-500"></div>
              </div>
            </div>

            <div className="result-card">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500 font-medium">Max Column Stress</h3>
                  <p className="text-lg md:text-2xl font-bold text-red-600">{(results.maxColumnStress / 1e6).toFixed(2)} <span className="text-xs md:text-sm font-normal text-gray-500">MPa</span></p>
                </div>
                <div className="stress-indicator bg-red-500"></div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'beams' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beam #</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Deflection (m)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Stress (MPa)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Left Reaction (N)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Right Reaction (N)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.beamResults.map((beam, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{beam.maxDeflection.toFixed(6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(beam.maxStress / 1e6).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{beam.reactionLeft.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{beam.reactionRight.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'columns' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column #</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Axial Load (N)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stress (MPa)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.columnAxialLoads.map((load, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{load.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(results.maxColumnStress / 1e6).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}