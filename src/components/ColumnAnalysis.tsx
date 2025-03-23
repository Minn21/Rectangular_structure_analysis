'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Material, SectionProfile } from '@/lib/types';

interface ColumnAnalysisProps {
  section: SectionProfile;
  material: Material;
  length: number;
  axialLoad: number;
  momentX: number;
  momentY: number;
  eccentricity: number;
  effectiveLengthFactor: number;
  braced: boolean;
}

const ColumnAnalysis: React.FC<ColumnAnalysisProps> = ({
  section,
  material,
  length,
  axialLoad,
  momentX, 
  momentY,
  eccentricity,
  effectiveLengthFactor,
  braced
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDeformed, setShowDeformed] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.0);
  const [bucklingMode, setBucklingMode] = useState<'x-axis' | 'y-axis'>('x-axis');
  
  // Calculate key column properties
  const calculateColumnProperties = () => {
    // Effective length
    const effectiveLength = length * effectiveLengthFactor;
    
    // Radius of gyration (i = sqrt(I/A))
    const radiusOfGyrationX = Math.sqrt(section.momentOfInertiaX / section.area);
    const radiusOfGyrationY = Math.sqrt(section.momentOfInertiaY / section.area);
    
    // Slenderness ratio (λ = Le/i)
    const slendernessRatioX = effectiveLength / radiusOfGyrationX;
    const slendernessRatioY = effectiveLength / radiusOfGyrationY;
    
    // Critical slenderness (transition between elastic and inelastic buckling)
    const criticalSlenderness = Math.PI * Math.sqrt(material.elasticModulus / (0.5 * material.yieldStrength));
    
    // Euler critical load (Pe = π²EI/Le²)
    const eulerCriticalLoadX = (Math.PI ** 2 * material.elasticModulus * 1e6 * section.momentOfInertiaX) / (effectiveLength ** 2);
    const eulerCriticalLoadY = (Math.PI ** 2 * material.elasticModulus * 1e6 * section.momentOfInertiaY) / (effectiveLength ** 2);
    
    // Governing buckling direction (lowest critical load)
    const governingLoad = Math.min(eulerCriticalLoadX, eulerCriticalLoadY);
    const governingAxis = eulerCriticalLoadX <= eulerCriticalLoadY ? 'x-axis' : 'y-axis';
    
    // Safety factor against buckling
    const bucklingFactor = governingLoad / axialLoad;
    
    // Axial stress
    const axialStress = axialLoad / (section.area * 1e6); // MPa
    
    // Bending stress due to primary moment
    const bendingStressX = (momentX * 1000) / (section.sectionModulusX); // MPa
    const bendingStressY = (momentY * 1000) / (section.sectionModulusY); // MPa
    
    // Additional bending stress due to eccentricity (e * P / S)
    const eccentricityStress = (eccentricity / 1000) * axialLoad / section.sectionModulusX; // MPa
    
    // Combined stress
    const combinedStress = axialStress + bendingStressX + bendingStressY + eccentricityStress; // MPa
    
    // Governing slenderness
    const governingSlenderness = Math.max(slendernessRatioX, slendernessRatioY);
    
    // AISC simplified check for steel
    let allowableStress = material.yieldStrength;
    
    if (material.type === 'Steel') {
      if (governingSlenderness < criticalSlenderness) {
        // Inelastic buckling (short to intermediate column)
        allowableStress = material.yieldStrength * (1 - 0.5 * (governingSlenderness / criticalSlenderness) ** 2);
      } else {
        // Elastic buckling (long column)
        allowableStress = material.yieldStrength * (0.877 / (governingSlenderness / criticalSlenderness) ** 2);
      }
    }
    
    // Utilization ratio
    const utilizationRatio = combinedStress / allowableStress;
    
    // Column status
    let status: 'Adequate' | 'Warning' | 'Overstressed';
    if (utilizationRatio <= 0.7) {
      status = 'Adequate';
    } else if (utilizationRatio <= 1.0) {
      status = 'Warning';
    } else {
      status = 'Overstressed';
    }
    
    return {
      effectiveLength,
      radiusOfGyrationX,
      radiusOfGyrationY,
      slendernessRatioX,
      slendernessRatioY,
      criticalSlenderness,
      eulerCriticalLoadX,
      eulerCriticalLoadY,
      governingLoad,
      governingAxis,
      bucklingFactor,
      axialStress,
      bendingStressX,
      bendingStressY,
      eccentricityStress,
      combinedStress,
      allowableStress,
      utilizationRatio,
      status
    };
  };
  
  const columnProps = calculateColumnProperties();

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Scale factors for drawing
    const scaleFactor = scale * Math.min(canvasWidth / (section.width * 6 * 1000), canvasHeight / (length * 1.2 * 1000));
    
    // Column dimensions in pixels
    const columnWidthPx = section.width * 1000 * scaleFactor;
    const columnHeightPx = length * 1000 * scaleFactor;
    
    // Starting position (centered)
    const startX = canvasWidth / 2 - columnWidthPx / 2;
    const startY = canvasHeight - 30; // Bottom with margin
    
    // Colors
    const columnColor = material.type === 'Concrete' ? '#D3D3D3' : 
                      material.type === 'Steel' ? '#A0A0A0' : 
                      '#D2B48C'; // Timber
    
    // Draw column base
    ctx.fillStyle = '#555555';
    ctx.fillRect(startX - columnWidthPx * 0.2, startY, columnWidthPx * 1.4, 10);
    
    // Function to draw the deformed shape
    const drawDeformedColumn = () => {
      const maxDeflection = columnWidthPx * 0.75; // Maximum deflection in pixels
      
      // Calculate deflection based on the utilization ratio (simplified)
      const deflectionFactor = Math.min(1.0, columnProps.utilizationRatio) * maxDeflection;
      
      // Number of segments to draw the curve
      const segments = 20;
      
      ctx.beginPath();
      
      // Starting point (bottom of column)
      ctx.moveTo(startX + columnWidthPx / 2, startY);
      
      for (let i = 0; i <= segments; i++) {
        const y = startY - (i / segments) * columnHeightPx;
        
        // Calculate horizontal position based on sine curve for buckled shape
        // The amplitude is greatest at midheight
        let deflection = 0;
        if (bucklingMode === 'x-axis') {
          deflection = deflectionFactor * Math.sin(Math.PI * (i / segments));
        } else {
          // For y-axis buckling, draw it perpendicular (we're looking at the column from the side)
          deflection = 0;
        }
        
        const x = startX + columnWidthPx / 2 + deflection;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    
    // Draw column
    if (section.shape === 'Circular') {
      // Draw circular column
      ctx.fillStyle = columnColor;
      
      // Base
      ctx.beginPath();
      ctx.ellipse(
        startX + columnWidthPx / 2, 
        startY, 
        columnWidthPx / 2, 
        columnWidthPx / 6, 
        0, 
        0, 
        2 * Math.PI
      );
      ctx.fill();
      
      // Body
      ctx.beginPath();
      ctx.rect(
        startX, 
        startY - columnHeightPx, 
        columnWidthPx, 
        columnHeightPx
      );
      ctx.fill();
      
      // Top
      ctx.beginPath();
      ctx.ellipse(
        startX + columnWidthPx / 2, 
        startY - columnHeightPx, 
        columnWidthPx / 2, 
        columnWidthPx / 6, 
        0, 
        0, 
        2 * Math.PI
      );
      ctx.fill();
      
      // Outline
      ctx.beginPath();
      ctx.rect(
        startX, 
        startY - columnHeightPx, 
        columnWidthPx, 
        columnHeightPx
      );
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (section.shape === 'WShape') {
      // Simplified W-shape (I-beam)
      const flangeWidth = columnWidthPx;
      const flangeHeight = columnWidthPx * 0.15;
      const webWidth = columnWidthPx * 0.2;
      
      ctx.fillStyle = columnColor;
      
      // Bottom flange
      ctx.fillRect(startX, startY - flangeHeight, flangeWidth, flangeHeight);
      
      // Web
      ctx.fillRect(
        startX + (flangeWidth - webWidth) / 2, 
        startY - columnHeightPx + flangeHeight, 
        webWidth, 
        columnHeightPx - 2 * flangeHeight
      );
      
      // Top flange
      ctx.fillRect(startX, startY - columnHeightPx, flangeWidth, flangeHeight);
      
      // Outline
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, startY - flangeHeight, flangeWidth, flangeHeight);
      ctx.strokeRect(
        startX + (flangeWidth - webWidth) / 2, 
        startY - columnHeightPx + flangeHeight, 
        webWidth, 
        columnHeightPx - 2 * flangeHeight
      );
      ctx.strokeRect(startX, startY - columnHeightPx, flangeWidth, flangeHeight);
    } else {
      // Rectangular column
      ctx.fillStyle = columnColor;
      ctx.fillRect(startX, startY - columnHeightPx, columnWidthPx, columnHeightPx);
      
      // Outline
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, startY - columnHeightPx, columnWidthPx, columnHeightPx);
    }
    
    // Draw axial load arrow
    const arrowSize = 15;
    ctx.beginPath();
    ctx.moveTo(startX + columnWidthPx / 2, startY - columnHeightPx - 30);
    ctx.lineTo(startX + columnWidthPx / 2, startY - columnHeightPx - 10);
    ctx.moveTo(startX + columnWidthPx / 2 - arrowSize / 2, startY - columnHeightPx - 20);
    ctx.lineTo(startX + columnWidthPx / 2, startY - columnHeightPx - 10);
    ctx.lineTo(startX + columnWidthPx / 2 + arrowSize / 2, startY - columnHeightPx - 20);
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw text for axial load
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${(axialLoad / 1000).toFixed(0)} kN`, startX + columnWidthPx / 2, startY - columnHeightPx - 35);
    
    // Draw moment arrow if moment exists
    if (momentX > 0) {
      const momentPosition = startY - columnHeightPx + 50;
      
      ctx.beginPath();
      ctx.arc(
        startX - 20, 
        momentPosition, 
        20, 
        0, 
        1.5 * Math.PI
      );
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(startX - 30, momentPosition - 10);
      ctx.lineTo(startX - 20, momentPosition);
      ctx.lineTo(startX - 10, momentPosition - 10);
      ctx.strokeStyle = '#4CAF50';
      ctx.stroke();
      
      // Draw text for moment
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${momentX.toFixed(1)} kN·m`, startX - 20, momentPosition - 25);
    }
    
    // Draw deformed shape
    if (showDeformed) {
      drawDeformedColumn();
    }
    
    // Draw effective length 
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.moveTo(startX + columnWidthPx + 20, startY);
    ctx.lineTo(startX + columnWidthPx + 20, startY - columnHeightPx * effectiveLengthFactor);
    ctx.strokeStyle = '#0077ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw dimension arrows
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(startX + columnWidthPx + 15, startY);
    ctx.lineTo(startX + columnWidthPx + 25, startY);
    ctx.moveTo(startX + columnWidthPx + 15, startY - columnHeightPx * effectiveLengthFactor);
    ctx.lineTo(startX + columnWidthPx + 25, startY - columnHeightPx * effectiveLengthFactor);
    ctx.strokeStyle = '#0077ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw text for effective length
    ctx.fillStyle = '#0077ff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Le = ${(length * effectiveLengthFactor).toFixed(2)} m`, 
      startX + columnWidthPx + 30, 
      startY - columnHeightPx * effectiveLengthFactor / 2
    );
    
  }, [section, material, length, axialLoad, momentX, eccentricity, effectiveLengthFactor, showDeformed, scale, bucklingMode, columnProps]);

  // Status colors and labels
  const getStatusColor = () => {
    switch (columnProps.status) {
      case 'Adequate': return 'bg-green-100 text-green-800';
      case 'Warning': return 'bg-yellow-100 text-yellow-800';
      case 'Overstressed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Column Analysis Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visualization */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Column Visualization</h3>
          
          <div className="flex mb-3 space-x-4">
            <button
              className={`px-3 py-1 rounded text-sm ${showDeformed ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setShowDeformed(!showDeformed)}
              aria-label="Toggle deformed shape"
            >
              {showDeformed ? 'Hide Deformed Shape' : 'Show Deformed Shape'}
            </button>
            
            <select
              className="px-2 py-1 rounded text-sm border-gray-300"
              value={bucklingMode}
              onChange={(e) => setBucklingMode(e.target.value as 'x-axis' | 'y-axis')}
              aria-label="Buckling mode"
            >
              <option value="x-axis">X-Axis Buckling</option>
              <option value="y-axis">Y-Axis Buckling</option>
            </select>
            
            <div className="flex items-center">
              <button
                className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-sm"
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="mx-2 text-sm">{scale.toFixed(1)}×</span>
              <button
                className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-sm"
                onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={500} 
              className="w-full h-auto"
              aria-label="Column visualization canvas"
            ></canvas>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            <div className="flex items-center mb-1">
              <div className="w-4 h-4 mr-2 bg-red-500"></div>
              <span>Axial Load: {(axialLoad / 1000).toFixed(0)} kN</span>
            </div>
            {momentX > 0 && (
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 mr-2 bg-green-500"></div>
                <span>Bending Moment: {momentX.toFixed(1)} kN·m</span>
              </div>
            )}
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 bg-blue-500"></div>
              <span>Effective Length: {(length * effectiveLengthFactor).toFixed(2)} m (K={effectiveLengthFactor})</span>
            </div>
          </div>
        </div>
        
        {/* Analysis Results */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
          
          <div className={`p-3 rounded-lg mb-4 ${getStatusColor()}`}>
            <div className="font-semibold">Column Status: {columnProps.status}</div>
            <div>Utilization Ratio: {(columnProps.utilizationRatio * 100).toFixed(1)}%</div>
            {columnProps.status === 'Overstressed' && (
              <div className="text-sm mt-1">
                This column is overstressed and needs to be redesigned with a larger section or higher strength material.
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Slenderness and Buckling */}
            <div>
              <h4 className="font-medium border-b pb-1 mb-2">Slenderness & Buckling</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Slenderness Ratio (X):</span>
                  <span className="font-mono">{columnProps.slendernessRatioX.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slenderness Ratio (Y):</span>
                  <span className="font-mono">{columnProps.slendernessRatioY.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Slenderness:</span>
                  <span className="font-mono">{columnProps.criticalSlenderness.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Governing Axis:</span>
                  <span className="font-mono">{columnProps.governingAxis}</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Buckling Load:</span>
                  <span className="font-mono">{(columnProps.governingLoad / 1000).toFixed(0)} kN</span>
                </div>
                <div className="flex justify-between">
                  <span>Safety Factor:</span>
                  <span className={`font-mono ${columnProps.bucklingFactor < 1.5 ? 'text-red-600' : 'text-green-600'}`}>
                    {columnProps.bucklingFactor.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Stress Analysis */}
            <div>
              <h4 className="font-medium border-b pb-1 mb-2">Stress Analysis</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Axial Stress:</span>
                  <span className="font-mono">{columnProps.axialStress.toFixed(1)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Bending Stress (X):</span>
                  <span className="font-mono">{columnProps.bendingStressX.toFixed(1)} MPa</span>
                </div>
                {eccentricity > 0 && (
                  <div className="flex justify-between">
                    <span>Eccentricity Stress:</span>
                    <span className="font-mono">{columnProps.eccentricityStress.toFixed(1)} MPa</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Combined Stress:</span>
                  <span className="font-mono font-semibold">{columnProps.combinedStress.toFixed(1)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowable Stress:</span>
                  <span className="font-mono">{columnProps.allowableStress.toFixed(1)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Yield Strength:</span>
                  <span className="font-mono">{material.yieldStrength} MPa</span>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div>
              <h4 className="font-medium border-b pb-1 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {columnProps.utilizationRatio > 0.9 && (
                  <li>Consider increasing the section size or using a stronger material.</li>
                )}
                {columnProps.slendernessRatioX > 150 && (
                  <li>The column is very slender in the X direction and may be susceptible to buckling.</li>
                )}
                {columnProps.slendernessRatioY > 150 && (
                  <li>The column is very slender in the Y direction and may be susceptible to buckling.</li>
                )}
                {eccentricity > 50 && (
                  <li>High eccentricity detected. Consider reducing load eccentricity or increasing section size.</li>
                )}
                {!braced && (
                  <li>Unbraced column may require additional lateral support to increase stability.</li>
                )}
                {columnProps.utilizationRatio < 0.5 && (
                  <li>The column is significantly oversized. A smaller section could be more economical.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnAnalysis; 