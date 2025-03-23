import React from 'react';
import { Foundation } from '../lib/types';
import { calculateSettlement } from '../lib/foundations';

interface SettlementAnalysisProps {
  foundation: Foundation;
  soilProperties: {
    soilType: string;
    elasticModulus?: number;
    compressionIndex?: number;
    voidRatio?: number;
    preconsolidationPressure?: number;
    waterContent?: number;
    liquidLimit?: number;
    plasticityIndex?: number;
    SPTvalue?: number;
  };
  loadParameters: {
    totalLoad: number;
    averagePressure?: number;
    eccentricity?: { x: number, y: number };
  };
}

const SettlementAnalysis: React.FC<SettlementAnalysisProps> = ({
  foundation,
  soilProperties,
  loadParameters
}) => {
  const settlementResults = calculateSettlement(foundation, soilProperties, loadParameters);
  
  const {
    immediateSettlement,
    consolidationSettlement,
    secondarySettlement,
    totalSettlement,
    timeToReach90Percent,
    differentialSettlementRisk,
    settlementProfile,
    designRecommendations
  } = settlementResults;
  
  // Helper function to determine settlement risk color
  const getSettlementRiskColor = (value: number): string => {
    if (value > 50) return 'text-red-600';
    if (value > 25) return 'text-amber-500';
    return 'text-green-600';
  };
  
  // Helper function for differential risk color
  const getDifferentialRiskColor = (risk: string): string => {
    if (risk === 'high') return 'text-red-600';
    if (risk === 'medium') return 'text-amber-500';
    return 'text-green-600';
  };
  
  // Helper function to generate settlement visualization
  const generateSettlementVisualization = () => {
    const maxSettlement = Math.max(
      immediateSettlement,
      consolidationSettlement,
      secondarySettlement
    );
    
    return (
      <div className="flex items-end h-32 mt-4 mb-6 space-x-2">
        <div 
          className="bg-blue-500 w-20 flex flex-col justify-end items-center text-white"
          style={{ height: `${(immediateSettlement / maxSettlement) * 100}%` }}
        >
          <span className="text-xs p-1">{immediateSettlement}mm</span>
          <span className="text-xs font-medium mt-2">Immediate</span>
        </div>
        
        <div 
          className="bg-purple-500 w-20 flex flex-col justify-end items-center text-white"
          style={{ height: `${(consolidationSettlement / maxSettlement) * 100}%` }}
        >
          <span className="text-xs p-1">{consolidationSettlement}mm</span>
          <span className="text-xs font-medium mt-2">Consolidation</span>
        </div>
        
        <div 
          className="bg-indigo-500 w-20 flex flex-col justify-end items-center text-white"
          style={{ height: `${(secondarySettlement / maxSettlement) * 100}%` }}
        >
          <span className="text-xs p-1">{secondarySettlement}mm</span>
          <span className="text-xs font-medium mt-2">Secondary</span>
        </div>
        
        <div 
          className={`bg-gray-700 w-20 flex flex-col justify-end items-center text-white ${getSettlementRiskColor(totalSettlement)}`}
          style={{ height: '100%' }}
        >
          <span className="text-sm font-bold p-1">{totalSettlement}mm</span>
          <span className="text-xs font-medium mt-2">Total</span>
        </div>
      </div>
    );
  };
  
  // Visualize the settlement profile for mat foundations
  const renderSettlementProfile = () => {
    if (!settlementProfile) return null;
    
    return (
      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-2">Settlement Profile (mm)</h4>
        <div className="grid grid-cols-3 gap-1 w-48 mx-auto">
          {settlementProfile.map((row, rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              {row.map((value, colIndex) => {
                const intensityPercent = Math.min(100, (value / totalSettlement) * 100);
                return (
                  <div 
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="h-12 w-12 flex items-center justify-center text-white font-medium text-xs"
                    style={{ 
                      backgroundColor: `rgba(79, 70, 229, ${intensityPercent/100})`,
                      border: '1px solid #e2e8f0' 
                    }}
                  >
                    {value}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Mat foundation settlement distribution (plan view)
        </p>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-5">
      <h3 className="text-lg font-semibold border-b pb-2 mb-3">Settlement Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-sm mb-3">Settlement Magnitudes</h4>
          {generateSettlementVisualization()}
          
          <div className="space-y-2 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Total Settlement:</div>
              <div className={`text-sm font-medium ${getSettlementRiskColor(totalSettlement)}`}>
                {totalSettlement} mm
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Differential Risk:</div>
              <div className={`text-sm font-medium ${getDifferentialRiskColor(differentialSettlementRisk)}`}>
                {differentialSettlementRisk.charAt(0).toUpperCase() + differentialSettlementRisk.slice(1)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Time to 90% Consolidation:</div>
              <div className="text-sm font-medium">
                {timeToReach90Percent > 365 
                  ? `${(timeToReach90Percent / 365).toFixed(1)} years` 
                  : `${timeToReach90Percent} days`}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          {renderSettlementProfile()}
          
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">Design Recommendations</h4>
            {designRecommendations.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {designRecommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No specific recommendations needed. Settlement is within acceptable limits.
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t">
        <h4 className="font-semibold text-sm mb-2">Settlement Timeline</h4>
        <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500"
            style={{ width: `${Math.min(100, (immediateSettlement / totalSettlement) * 100)}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
              Immediate
            </span>
          </div>
          <div 
            className="absolute top-0 h-full bg-purple-500"
            style={{ 
              left: `${Math.min(100, (immediateSettlement / totalSettlement) * 100)}%`,
              width: `${Math.min(100, (consolidationSettlement / totalSettlement) * 100)}%` 
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
              Primary
            </span>
          </div>
          <div 
            className="absolute top-0 right-0 h-full bg-indigo-500"
            style={{ 
              width: `${Math.min(100, (secondarySettlement / totalSettlement) * 100)}%` 
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
              Secondary
            </span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Construction</span>
          <span>{timeToReach90Percent > 30 ? `${Math.ceil(timeToReach90Percent/30)} months` : `${timeToReach90Percent} days`}</span>
          <span>50+ years</span>
        </div>
      </div>
    </div>
  );
};

export default SettlementAnalysis; 