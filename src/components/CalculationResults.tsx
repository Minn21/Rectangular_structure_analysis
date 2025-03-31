import React, { useState } from 'react';
import type { CalculationResults } from '../lib/types';

interface CalculationResultsProps {
  results: CalculationResults;
}

export default function CalculationResults({ results }: CalculationResultsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'beams' | 'columns' | 'advanced' | 'checks'>('summary');
  
  const exportResults = () => {
    const csvContent = [
      'Metric,Value,Unit',
      results.maxBeamDeflection ? `Max Beam Deflection,${results.maxBeamDeflection.toFixed(6)},m` : 'Max Beam Deflection,N/A,m',
      results.maxBeamStress ? `Max Beam Stress,${(results.maxBeamStress / 1e6).toFixed(2)},MPa` : 'Max Beam Stress,N/A,MPa',
      results.maxColumnStress ? `Max Column Stress,${(results.maxColumnStress / 1e6).toFixed(2)},MPa` : 'Max Column Stress,N/A,MPa',
      results.totalWeight ? `Total Weight,${(results.totalWeight / 1000).toFixed(2)},kN` : '',
      results.naturalFrequency ? `Natural Frequency,${results.naturalFrequency.toFixed(3)},Hz` : '',
      results.baseShear ? `Base Shear,${(results.baseShear / 1000).toFixed(2)},kN` : '',
      '\nStructural Checks',
      results.structuralChecks ? `Deflection Check,${results.structuralChecks.deflectionCheck ? 'Pass' : 'Fail'},` : '',
      results.structuralChecks ? `Stress Check,${results.structuralChecks.stressCheck ? 'Pass' : 'Fail'},` : '',
      results.structuralChecks ? `Buckling Check,${results.structuralChecks.buckling ? 'Pass' : 'Fail'},` : '',
      results.structuralChecks ? `Shear Capacity Check,${results.structuralChecks.shearCapacity ? 'Pass' : 'Fail'},` : '',
      '\nBeam Results',
      'Beam #,Max Deflection (m),Max Stress (MPa),Left Reaction (N),Right Reaction (N),Utilization Ratio',
      ...results.beamResults.map((beam, index) => 
        `${index + 1},${beam.maxDeflection.toFixed(6)},${(beam.maxStress / 1e6).toFixed(2)},${beam.reactionLeft.toFixed(2)},${beam.reactionRight.toFixed(2)},${beam.utilizationRatio ? beam.utilizationRatio.toFixed(3) : 'N/A'}`
      ),
      '\nColumn Loads',
      'Column #,Axial Load (N)',
      ...results.columnAxialLoads.map((load, index) => 
        `${index + 1},${load.toFixed(2)}`
      ),
      results.dynamicAnalysis ? '\nDynamic Analysis Results' : '',
      results.dynamicAnalysis ? 'Mode,Frequency (Hz),Participation Factor' : '',
      ...(results.dynamicAnalysis ? results.dynamicAnalysis.frequencies.map((freq, index) => 
        `${index + 1},${freq.toFixed(3)},${results.dynamicAnalysis?.participationFactors[index].toFixed(3) || 'N/A'}`
      ) : [])
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
    <div className="space-y-6">
      {/* Improved Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide bg-gray-100/60 backdrop-blur-sm rounded-lg p-1.5">
        {(['summary', 'beams', 'columns', 'advanced', 'checks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm md:text-base font-medium rounded-md whitespace-nowrap transition-all duration-200 mx-0.5 capitalize
              ${activeTab === tab 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-white/60 hover:text-blue-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ResultCard 
                title="Max Beam Deflection" 
                value={results.maxBeamDeflection?.toFixed(3) || 'N/A'} 
                unit="m"
                icon={<DeflectionIcon />}
                severity={getSeverity((results.maxBeamDeflection || 0) / (results.allowableDeflection || 1))}
              />
              <ResultCard 
                title="Max Beam Stress" 
                value={results.maxBeamStress ? (results.maxBeamStress / 1e6).toFixed(2) : 'N/A'} 
                unit="MPa"
                icon={<StressIcon />}
                severity={getSeverity((results.maxBeamStress || 0) / (results.allowableStress || 1))}
              />
              <ResultCard 
                title="Max Column Stress" 
                value={results.maxColumnStress ? (results.maxColumnStress / 1e6).toFixed(2) : 'N/A'} 
                unit="MPa"
                icon={<ColumnIcon />}
                severity={getSeverity((results.maxColumnStress || 0) / (results.allowableStress || 1))}
              />
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={exportResults}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <DownloadIcon />
                Export Results
              </button>
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
                  {results.beamResults[0]?.utilizationRatio !== undefined && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization Ratio</th>
                  )}
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
                    {beam.utilizationRatio !== undefined && (
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        beam.utilizationRatio > 0.9 ? 'text-red-500 font-medium' : 
                        beam.utilizationRatio > 0.7 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {beam.utilizationRatio.toFixed(3)}
                      </td>
                    )}
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
                  {results.buckling && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buckling Factor</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.columnAxialLoads.map((load, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{load.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {results.maxColumnStress ? (results.maxColumnStress / 1e6).toFixed(2) : 'N/A'}
                    </td>
                    {results.buckling && (
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        results.buckling.bucklingFactor < 1.5 ? 'text-red-500 font-medium' : 
                        results.buckling.bucklingFactor < 2.5 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {results.buckling.bucklingFactor.toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Building Properties Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Dynamic Properties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.naturalFrequency && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-500">Natural Frequency</p>
                    <p className="text-lg font-medium">{results.naturalFrequency.toFixed(3)} Hz</p>
                  </div>
                )}
                {results.periodOfVibration && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-500">Period of Vibration</p>
                    <p className="text-lg font-medium">{results.periodOfVibration.toFixed(3)} s</p>
                  </div>
                )}
                {results.maximumDisplacement && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-500">Maximum Displacement</p>
                    <p className="text-lg font-medium">{(results.maximumDisplacement * 1000).toFixed(2)} mm</p>
                  </div>
                )}
                {results.baseShear && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-500">Base Shear</p>
                    <p className="text-lg font-medium">{(results.baseShear / 1000).toFixed(2)} kN</p>
                  </div>
                )}
                {results.totalWeight && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-500">Total Weight</p>
                    <p className="text-lg font-medium">{(results.totalWeight / 1000).toFixed(2)} kN</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Analysis Results */}
            {results.dynamicAnalysis && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Modal Analysis Results</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency (Hz)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participation Factor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.dynamicAnalysis.frequencies.map((frequency, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{frequency.toFixed(3)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {results.dynamicAnalysis?.participationFactors[index].toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checks' && results.structuralChecks && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-700">Structural Code Checks</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${results.structuralChecks.deflectionCheck ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Deflection Check</h4>
                    <p className="text-xs text-gray-500">Limit: Span/360</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${results.structuralChecks.deflectionCheck ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {results.structuralChecks.deflectionCheck ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${results.structuralChecks.stressCheck ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Stress Check</h4>
                    <p className="text-xs text-gray-500">Limit: Material Allowable</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${results.structuralChecks.stressCheck ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {results.structuralChecks.stressCheck ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${results.structuralChecks.buckling ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Buckling Check</h4>
                    <p className="text-xs text-gray-500">Euler Buckling Analysis</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${results.structuralChecks.buckling ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {results.structuralChecks.buckling ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${results.structuralChecks.shearCapacity ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Shear Capacity</h4>
                    <p className="text-xs text-gray-500">Limit: 0.4 × Allowable Stress</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${results.structuralChecks.shearCapacity ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {results.structuralChecks.shearCapacity ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Code Compliance Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Code Compliance</h4>
              <div className={`p-3 rounded ${
                Object.values(results.structuralChecks).every(Boolean) 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <p className="text-sm">
                  {Object.values(results.structuralChecks).every(Boolean)
                    ? 'All structural checks passed. The structure meets basic design requirements.'
                    : 'One or more structural checks failed. Review design parameters and consider modifications.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine severity
function getSeverity(ratio: number): 'low' | 'medium' | 'high' {
  if (ratio < 0.7) return 'low';
  if (ratio < 0.9) return 'medium';
  return 'high';
}

// UI Components for the results
function ResultCard({ title, value, unit, icon, severity }: { 
  title: string; 
  value: string; 
  unit: string; 
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high';
}) {
  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover-lift hover-glow">
      <div className="flex items-start">
        <div className="mr-3 text-blue-500">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <div className="flex items-baseline mt-1 gap-1">
            <span className="text-xl md:text-2xl font-semibold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          <div className={`mt-2 inline-block px-2 py-0.5 text-xs rounded-full ${severityColors[severity]}`}>
            {severity === 'low' ? 'Safe' : severity === 'medium' ? 'Warning' : 'Critical'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Icons for visual elements
function DeflectionIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M12 3v18M5 9l4-4 4 4M5 15l4 4 4-4" />
    </svg>
  );
}

function StressIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a1 1 0 00-1 1v8a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1h-3l-2.5-3z" />
      <path d="M8 12l4 4 4-4" />
    </svg>
  );
}

function ColumnIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="20" />
      <path d="M3 7h18M3 17h18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}