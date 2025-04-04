import { Foundation, FoundationType, Material, SectionProfile } from './types';

// Reference soil bearing capacities in kPa
const soilBearingCapacities: Record<string, number> = {
  'Soft clay': 75,
  'Medium clay': 150,
  'Stiff clay': 300,
  'Very stiff clay': 600,
  'Hard clay': 800,
  'Loose sand': 100,
  'Medium dense sand': 250,
  'Dense sand': 500,
  'Very dense sand': 800,
  'Loose gravel': 200,
  'Medium dense gravel': 500,
  'Dense gravel': 800,
  'Soft rock': 1500,
  'Medium rock': 3000,
  'Hard rock': 10000,
  'Weathered rock': 1000,
  'Organic soil': 30,
  'Fill (uncompacted)': 50,
  'Fill (compacted)': 150,
  'Silt': 100,
  'Sandy silt': 150,
  'Silty sand': 200,
  'Clayey sand': 175,
  'Sandy clay': 200,
  'Silty clay': 125,
  'Peat': 20,
  'Hardpan': 1000
};

// Soil elastic moduli in MPa
const soilElasticModuli: Record<string, number> = {
  'Soft clay': 5,
  'Medium clay': 15,
  'Stiff clay': 30,
  'Very stiff clay': 60,
  'Hard clay': 100,
  'Loose sand': 10,
  'Medium dense sand': 30,
  'Dense sand': 60,
  'Very dense sand': 100,
  'Loose gravel': 30,
  'Medium dense gravel': 80,
  'Dense gravel': 150,
  'Soft rock': 500,
  'Medium rock': 2000,
  'Hard rock': 10000,
  'Weathered rock': 300,
  'Organic soil': 2,
  'Fill (uncompacted)': 5,
  'Fill (compacted)': 20,
  'Silt': 8,
  'Sandy silt': 15,
  'Silty sand': 20,
  'Clayey sand': 25,
  'Sandy clay': 30,
  'Silty clay': 10,
  'Peat': 1,
  'Hardpan': 200
};

// Soil compression indices (Cc)
const soilCompressionIndices: Record<string, number> = {
  'Soft clay': 0.35,
  'Medium clay': 0.25,
  'Stiff clay': 0.15,
  'Very stiff clay': 0.10,
  'Hard clay': 0.05,
  'Silt': 0.20,
  'Sandy silt': 0.15,
  'Silty clay': 0.30,
  'Organic soil': 0.80,
  'Peat': 3.00
};

// Typical void ratios for various soil types
const soilVoidRatios: Record<string, number> = {
  'Soft clay': 1.2,
  'Medium clay': 0.9,
  'Stiff clay': 0.7,
  'Very stiff clay': 0.6,
  'Hard clay': 0.5,
  'Loose sand': 0.8,
  'Medium dense sand': 0.65,
  'Dense sand': 0.5,
  'Very dense sand': 0.4,
  'Loose gravel': 0.7,
  'Medium dense gravel': 0.5,
  'Dense gravel': 0.3,
  'Silt': 0.9,
  'Sandy silt': 0.7,
  'Silty sand': 0.6,
  'Clayey sand': 0.6,
  'Sandy clay': 0.6,
  'Silty clay': 1.0,
  'Organic soil': 2.5,
  'Peat': 4.0,
  'Fill (uncompacted)': 1.0,
  'Fill (compacted)': 0.6
};

// Coefficient of consolidation (Cv) in m²/month
const soilConsolidationCoefficients: Record<string, number> = {
  'Soft clay': 0.1,
  'Medium clay': 0.4,
  'Stiff clay': 1.0,
  'Very stiff clay': 2.0,
  'Hard clay': 4.0,
  'Silt': 0.3,
  'Sandy silt': 1.0,
  'Silty clay': 0.2,
  'Clayey sand': 2.0,
  'Sandy clay': 1.5,
  'Organic soil': 0.05,
  'Peat': 0.03
};

// Design a spread footing for a column
export function designSpreadFooting(
  column: SectionProfile,
  axialLoad: number, // N
  moment: number, // N-m
  soilBearingCapacity: number, // kPa
  concreteMaterial: Material
): Foundation {
  // Convert soil bearing capacity to Pa
  const soilBearingCapacityPa = soilBearingCapacity * 1000;
  
  // Add safety factor to the bearing capacity
  const designSoilBearingCapacity = soilBearingCapacityPa / 3.0; // Apply factor of safety of 3.0 (common in foundation design)
  
  // Calculate eccentricity due to moment
  const eccentricity = moment / axialLoad; // e = M/P
  
  // Calculate minimum required footing area for axial load
  const requiredAreaAxial = axialLoad / designSoilBearingCapacity;
  
  // Calculate required area accounting for moment (eccentric loading)
  // Using the formula: A = P / (q - 6*e*P/B²) where B is the width in direction of moment
  // For preliminary sizing, we can use: A = P * (1 + 6*e/B)
  // Assume square footing initially with side B = sqrt(requiredAreaAxial)
  let footingWidth = Math.sqrt(requiredAreaAxial);
  
  // Check if eccentricity is significant
  if (eccentricity > 0) {
    // Add 10% for small eccentricity, more for larger eccentricity
    const eccentricityRatio = eccentricity / footingWidth;
    if (eccentricityRatio < 1/6) { 
      // Small eccentricity - increase size by factor
      footingWidth *= (1 + 2 * eccentricityRatio);
    } else {
      // Large eccentricity - need larger increase
      footingWidth *= (1 + 3 * eccentricityRatio);
      
      // For very large eccentricity (e > B/6), consider adding grade beam
      if (eccentricityRatio > 1/6) {
        console.warn("Large eccentricity detected. Consider adding a grade beam or adjusting column location.");
      }
    }
  }
  
  // Round up to nearest 100mm (for constructability)
  footingWidth = Math.ceil(footingWidth * 10) / 10;
  
  // Square footing (for symmetric loading)
  const footingLength = footingWidth;
  
  // Calculate actual soil pressure considering the moment
  const actualArea = footingWidth * footingLength;
  const basePressure = axialLoad / actualArea;
  
  // Calculate section modulus for footing
  const sectionModulus = (footingWidth * footingLength * footingLength) / 6;
  
  // Calculate maximum soil pressure with moment
  const maxSoilPressure = basePressure + moment / sectionModulus;
  const minSoilPressure = basePressure - moment / sectionModulus;
  
  // Check if soil pressure exceeds capacity
  if (maxSoilPressure > designSoilBearingCapacity) {
    // Increase footing size if pressure exceeds capacity
    const sizeFactor = Math.sqrt(maxSoilPressure / designSoilBearingCapacity);
    return designSpreadFooting(
      column,
      axialLoad,
      moment,
      soilBearingCapacity * sizeFactor, // Adjusted for next iteration
      concreteMaterial
    );
  }
  
  // Check for tension in soil (negative soil pressure)
  if (minSoilPressure < 0 && eccentricity > footingLength/6) {
    // Footing is partially uplifted - redesign with larger footing
    console.warn("Footing experiences uplift. Redesigning with larger size.");
    return designSpreadFooting(
      column,
      axialLoad,
      moment,
      soilBearingCapacity * 0.8, // Reduce bearing capacity to get larger footing
      concreteMaterial
    );
  }
  
  // Calculate footing thickness based on several criteria
  
  // 1. Punching shear (Two-way shear)
  // Critical perimeter at d/2 from column face
  // Typically concrete cover is 75mm, assume effective depth d = thickness - 75mm - 10mm (half of bar dia)
  const assumedEffectiveDepth = 0.85; // Assume d = 0.85 * thickness for initial sizing
  const criticalPerimeter = 2 * (column.width + column.height + 2 * assumedEffectiveDepth);
  
  // Concrete punching shear strength (per code requirements)
  // Using simplified ACI formula: Vc = 0.33 * lambda * sqrt(f'c)
  const lambda = 1.0; // Normal weight concrete
  const concretePunchingStrength = 0.33 * lambda * Math.sqrt(concreteMaterial.yieldStrength);
  
  // Punching shear force = total load - pressure within critical section
  const criticalArea = (column.width + assumedEffectiveDepth) * (column.height + assumedEffectiveDepth);
  const punchingForce = axialLoad - maxSoilPressure * criticalArea;
  
  // Required thickness for punching shear
  let reqThicknessPunching = punchingForce / (criticalPerimeter * concretePunchingStrength * assumedEffectiveDepth);
  reqThicknessPunching = reqThicknessPunching / 0.85; // Account for our assumption that d = 0.85*h
  
  // 2. One-way (beam) shear
  // Critical section at d from column face
  const cantilever = (footingWidth - column.width) / 2;
  const criticalSectionBeamShear = cantilever - assumedEffectiveDepth;
  const beamShearForce = maxSoilPressure * footingLength * criticalSectionBeamShear;
  
  // Beam shear strength (ACI)
  const concreteBeamShearStrength = 0.17 * lambda * Math.sqrt(concreteMaterial.yieldStrength);
  
  // Required thickness for beam shear
  let reqThicknessBeamShear = beamShearForce / (footingLength * concreteBeamShearStrength * assumedEffectiveDepth);
  reqThicknessBeamShear = reqThicknessBeamShear / 0.85;
  
  // 3. Bending moment (flexure)
  // Critical section at face of column
  const momentArm = cantilever;
  const designMoment = 0.5 * maxSoilPressure * footingLength * momentArm * momentArm;
  
  // Required steel area based on flexural design
  // Using Whitney stress block: As = Mu / (fy * 0.9d * (1 - a/2))
  // Where a = As*fy/(0.85*f'c*b)
  // For preliminary design using simplified method
  const steelYieldStrength = 500e6; // 500 MPa for typical reinforcing steel
  const phi = 0.9; // Strength reduction factor for flexure
  
  // Required effective depth for flexure (using simplified approach)
  const reqDepthFlexure = Math.sqrt((2 * designMoment) / (phi * 0.85 * 0.9 * concreteMaterial.yieldStrength * footingLength));
  const reqThicknessFlexure = reqDepthFlexure / 0.85;
  
  // Take maximum of required thicknesses
  let footingThickness = Math.max(reqThicknessPunching, reqThicknessBeamShear, reqThicknessFlexure);
  
  // Minimum thickness for practical considerations and frost protection
  footingThickness = Math.max(footingThickness, 0.3);
  
  // Round thickness to next 50mm for constructability
  footingThickness = Math.ceil(footingThickness * 20) / 20;
  
  // Calculate final effective depth
  const effectiveDepth = footingThickness - 0.075; // 75mm cover
  
  // Calculate required reinforcement
  // Calculate required steel area using simplified formula
  // Assume balanced reinforcement ratio for simplicity
  const reinforcementRatio = 0.018 * concreteMaterial.yieldStrength / steelYieldStrength; // Approximate balanced ratio
  const steelArea = reinforcementRatio * footingLength * effectiveDepth;
  
  // Check minimum steel requirements (typically 0.0018 * gross area for temperature and shrinkage)
  const minSteelArea = 0.0018 * footingWidth * footingThickness;
  
  // Use larger of calculated and minimum steel areas
  const finalSteelArea = Math.max(steelArea, minSteelArea);
  
  // Calculate practical reinforcement layout
  // Assume #6 (20mm) bars with Ast = 314 mm²
  const barAreaMm2 = 314; // Area of one #6 bar in mm²
  const barCount = Math.ceil(finalSteelArea * 1e6 / barAreaMm2);
  const barSpacing = Math.floor(footingWidth * 1000 / barCount);
  
  // Return foundation design
  return {
    type: 'SpreadFooting',
    dimensions: {
      length: footingLength,
      width: footingWidth,
      depth: footingThickness
    },
    material: 'Concrete',
    reinforcementDetails: `${Math.ceil(finalSteelArea * 1e6)} mm² total steel area. ${barCount} #6 bars at ${barSpacing}mm spacing in both directions.`,
    soilBearingCapacity: designSoilBearingCapacity,
    depthBelowGrade: footingThickness + 0.15 // Add 150mm cover below footing
  };
}

// Design a strip footing for a wall or multiple columns
export function designStripFooting(
  columnLoads: { column: SectionProfile, axialLoad: number, moment: number, position: number }[],
  wallLength: number,
  soilBearingCapacity: number, // kPa
  concreteMaterial: Material
): Foundation {
  // Convert soil bearing capacity to Pa
  const soilBearingCapacityPa = soilBearingCapacity * 1000;
  
  // Calculate total axial load
  const totalAxialLoad = columnLoads.reduce((sum, col) => sum + col.axialLoad, 0);
  
  // Calculate required footing area
  const requiredFootingArea = (totalAxialLoad * 1.3) / soilBearingCapacityPa;
  
  // Strip footing width (assume length is fixed by wall length)
  const footingLength = wallLength;
  const footingWidth = requiredFootingArea / footingLength;
  
  // Note: We're ignoring moments for strip footings in this simplified approach
  
  // Calculate footing thickness (similar to spread footing)
  // But use strip footing design principles
  
  // Assume load is distributed evenly for simplicity
  const loadPerMeter = totalAxialLoad / footingLength;
  
  // Maximum moment for continuous footing
  const momentPerMeter = (loadPerMeter * Math.pow(footingWidth / 2, 2)) / 2;
  
  // Flexural strength of concrete (simplified)
  const flexuralStrength = 0.1 * concreteMaterial.yieldStrength;
  
  // Required thickness based on flexure
  let footingThickness = Math.sqrt((6 * momentPerMeter) / flexuralStrength);
  
  // Minimum thickness for practical considerations
  footingThickness = Math.max(footingThickness, 0.4);
  
  // Round thickness to next 50mm
  footingThickness = Math.ceil(footingThickness * 20) / 20;
  
  // Basic reinforcement calculation
  const asReq = momentPerMeter / (0.9 * 500e6 * 0.9 * footingThickness); // Assuming 500 MPa steel
  const minReinforcement = 0.002 * footingWidth * footingThickness; // Minimum steel percentage
  const reinforcementArea = Math.max(asReq, minReinforcement);
  
  // Return foundation design
  return {
    type: 'StripFooting',
    dimensions: {
      length: footingLength,
      width: footingWidth,
      depth: footingThickness
    },
    material: 'Concrete',
    reinforcementDetails: `${Math.ceil(reinforcementArea * 1e4)} mm² longitudinal, ${Math.ceil(reinforcementArea * 0.5 * 1e4)} mm² transverse`,
    soilBearingCapacity: soilBearingCapacityPa,
    depthBelowGrade: footingThickness + 0.15 // Add 150mm cover
  };
}

// Design a mat foundation for the entire building
export function designMatFoundation(
  buildingLength: number,
  buildingWidth: number,
  totalBuildingLoad: number,
  columnLoads: { column: SectionProfile, axialLoad: number, position: { x: number, y: number } }[],
  soilBearingCapacity: number, // kPa
  concreteMaterial: Material
): Foundation {
  // Convert soil bearing capacity to Pa
  const soilBearingCapacityPa = soilBearingCapacity * 1000;
  
  // Basic mat dimensions are the building footprint
  const matLength = buildingLength;
  const matWidth = buildingWidth;
  
  // Check if mat is needed based on soil conditions
  const matArea = matLength * matWidth;
  const averagePressure = totalBuildingLoad / matArea;
  
  if (averagePressure < soilBearingCapacityPa * 0.5) {
    // If soil can easily support the load, individual footings might be more economical
    // But we'll still design a mat as requested
    console.warn('Individual footings might be more economical than a mat foundation.');
  }
  
  // Calculate mat thickness based on punching shear around columns
  // and flexural requirements
  
  // Find maximum column load for punching shear check
  const maxColumnLoad = columnLoads.reduce((max, col) => Math.max(max, col.axialLoad), 0);
  const typicalColumn = columnLoads.find(col => col.axialLoad === maxColumnLoad)?.column;
  
  if (!typicalColumn) {
    throw new Error('No columns found for mat foundation design');
  }
  
  // Punching shear perimeter (assuming d = 0.9 * thickness)
  const columnWidth = typicalColumn.width;
  const columnHeight = typicalColumn.height; // Using height for depth if rectangular
  
  // Critical perimeter for punching shear
  const criticalPerimeter = 2 * (columnWidth + columnHeight + 2 * 0.9 * 0.5); // Assuming 500mm thickness
  
  // Concrete shear strength (simplified)
  const concreteShearStrength = 0.17 * Math.sqrt(concreteMaterial.yieldStrength);
  
  // Punching shear calculation
  const requiredThicknessShear = maxColumnLoad / (criticalPerimeter * concreteShearStrength);
  
  // Flexural requirements (simplified strip method)
  // Approximate column spacing
  const avgColumnSpacing = Math.sqrt((matArea) / columnLoads.length);
  
  // Maximum moment in spanning between columns (simplified)
  const momentPerMeter = (averagePressure * Math.pow(avgColumnSpacing, 2)) / 8;
  
  // Flexural strength of concrete (simplified)
  const flexuralStrength = 0.1 * concreteMaterial.yieldStrength;
  
  // Required thickness based on flexure
  const requiredThicknessFlexure = Math.sqrt((6 * momentPerMeter) / flexuralStrength);
  
  // Take maximum of required thicknesses
  let matThickness = Math.max(requiredThicknessShear, requiredThicknessFlexure);
  
  // Minimum thickness for practical considerations
  matThickness = Math.max(matThickness, 0.5);
  
  // Round thickness to next 50mm
  matThickness = Math.ceil(matThickness * 20) / 20;
  
  // Basic reinforcement calculation (two-way slab design simplified)
  const asReq = momentPerMeter / (0.9 * 500e6 * 0.9 * matThickness); // Assuming 500 MPa steel
  const minReinforcement = 0.0018 * 1 * matThickness; // Minimum steel percentage for temperature and shrinkage
  const reinforcementArea = Math.max(asReq, minReinforcement);
  
  // Return foundation design
  return {
    type: 'MatFoundation',
    dimensions: {
      length: matLength,
      width: matWidth,
      depth: matThickness
    },
    material: 'Concrete',
    reinforcementDetails: `${Math.ceil(reinforcementArea * 1e4)} mm²/m in both directions, additional ${Math.ceil(reinforcementArea * 0.5 * 1e4)} mm²/m at columns`,
    soilBearingCapacity: soilBearingCapacityPa,
    depthBelowGrade: matThickness + 0.15 // Add 150mm cover
  };
}

// Design pile foundations
export function designPileFoundation(
  column: SectionProfile,
  axialLoad: number,
  moment: number,
  soilProperties: {
    type: string;
    bearingCapacity: number;
    frictionAngle?: number;
    cohesion?: number;
    SPTvalue?: number; // Standard Penetration Test N-value
    liquidLimit?: number; // For settlement calculations
  }
): Foundation {
  // Enhanced pile design with proper geotechnical calculations
  
  // Step 1: Determine pile capacity based on soil properties
  const pileDiameter = 0.5; // Standard 500mm diameter pile
  
  // Determine initial pile length based on soil type
  let pileLength = 12; // Default initial assumption
  
  if (soilProperties.SPTvalue) {
    // If SPT N-value is provided, use it to estimate pile length
    // Rule of thumb: 0.5m per N-value for end bearing piles
    pileLength = Math.max(10, 0.5 * (100 / soilProperties.SPTvalue) * 10);
  } else if (soilProperties.type.includes('clay')) {
    // Clay soils typically need longer piles
    pileLength = 15;
  } else if (soilProperties.type.includes('sand')) {
    // Sandy soils may allow shorter piles
    pileLength = 12;
  }

  // Calculate pile end bearing capacity
  const pileArea = Math.PI * Math.pow(pileDiameter/2, 2);
  const endBearingCapacity = pileArea * soilProperties.bearingCapacity * 1000;
  
  // Calculate skin friction based on soil type
  let averageSkinFriction: number; // Pa (N/m²)
  
  if (soilProperties.type.includes('clay')) {
    // Cohesive soils (clays) - adhesion method
    // α method for cohesive soils: fs = α * cu (undrained cohesion)
    const alpha = 0.55; // Empirical adhesion factor (varies from 0.4 to 0.7)
    const cu = soilProperties.cohesion || 50000; // Default to 50 kPa if not provided
    averageSkinFriction = alpha * cu;
  } else {
    // Non-cohesive soils (sands) - friction method
    // β method for granular soils: fs = β * σ'v (effective vertical stress)
    const beta = 0.35; // Empirical factor (typically 0.25-0.4)
    const avgEffectiveStress = 10000 * pileLength/2; // Simplified, average at mid-length (Pa)
    averageSkinFriction = beta * avgEffectiveStress;
  }
  
  // Calculate total skin friction capacity
  const pilePerimeter = Math.PI * pileDiameter;
  const skinFrictionCapacity = pilePerimeter * pileLength * averageSkinFriction;
  
  // Total pile capacity (with factor of safety)
  const singlePileCapacity = (endBearingCapacity + skinFrictionCapacity) / 2.0; // FOS = 2.0
  
  // Step 2: Determine number of piles needed for axial load
  const requiredNumberOfPiles = Math.ceil(axialLoad / singlePileCapacity);
  
  // Step 3: Account for moment and lateral loading
  // Check if moment is significant compared to axial load
  const eccentricity = moment / axialLoad;
  let additionalPilesForMoment = 0;
  
  if (eccentricity > 0.1) {
    // Significant moment - need additional piles
    additionalPilesForMoment = Math.ceil(moment / (singlePileCapacity * 1.5 * pileDiameter));
  }
  
  // Total required piles
  const totalRequiredPiles = requiredNumberOfPiles + additionalPilesForMoment;
  
  // Step 4: Design pile arrangement
  // Determine pile arrangement (try to make it symmetric for moment resistance)
  // For small groups, use square arrangement; for larger groups, use rectangular
  let pileRows: number;
  let pileCols: number;
  
  if (totalRequiredPiles <= 4) {
    // Simple square or rectangular arrangement
    pileRows = Math.ceil(Math.sqrt(totalRequiredPiles));
    pileCols = Math.ceil(totalRequiredPiles / pileRows);
  } else if (moment > axialLoad * 0.2) {
    // Significant moment - use rectangular arrangement with more piles in moment direction
    const momentRatio = moment / (axialLoad * pileDiameter);
    if (momentRatio > 0.5) {
      // Elongate in direction of moment
      pileRows = Math.ceil(Math.sqrt(totalRequiredPiles * 0.6));
      pileCols = Math.ceil(totalRequiredPiles / pileRows);
      // Ensure longer side is in moment direction (assume moment about x-axis)
      if (pileCols < pileRows) {
        [pileRows, pileCols] = [pileCols, pileRows];
      }
    } else {
      pileRows = Math.ceil(Math.sqrt(totalRequiredPiles));
      pileCols = Math.ceil(totalRequiredPiles / pileRows);
    }
  } else {
    // Default to square-ish arrangement
    pileRows = Math.ceil(Math.sqrt(totalRequiredPiles));
    pileCols = Math.ceil(totalRequiredPiles / pileRows);
  }
  
  // Calculate actual number of piles in the arrangement
  const actualNumberOfPiles = pileRows * pileCols;
  
  // Step 5: Consider pile group effects
  // Group efficiency (simplified Converse-Labarre formula)
  const minPileSpacing = 3 * pileDiameter; // Standard minimum pile spacing
  
  // Group efficiency factor (simplified)
  const theta = Math.atan(pileDiameter / minPileSpacing);
  const groupEfficiency = 1 - (theta / 90) * (pileRows - 1) * pileCols / (2 * actualNumberOfPiles);
  
  // Adjusted pile group capacity
  const pileGroupCapacity = singlePileCapacity * actualNumberOfPiles * groupEfficiency;
  
  // Final safety check
  const safetyFactor = pileGroupCapacity / axialLoad;
  if (safetyFactor < 1.5) {
    console.warn(`Pile group safety factor is ${safetyFactor.toFixed(2)}, which is lower than recommended 1.5. Consider adding more piles.`);
  }
  
  // Step 6: Design pile cap
  // Minimum spacing between piles = 3 × diameter (standard practice)
  // Pile cap dimensions
  const pileCapLength = (pileCols - 1) * minPileSpacing + 2 * pileDiameter;
  const pileCapWidth = (pileRows - 1) * minPileSpacing + 2 * pileDiameter;
  
  // Pile cap thickness based on:
  // 1. Punching shear around columns
  // 2. Punching shear around individual piles
  // 3. Beam shear between piles
  
  // Simplified approach using empirical rules
  // Minimum thickness = pile diameter or column width + 150mm, whichever is greater
  let pileCapThickness = Math.max(pileDiameter, column.width) + 0.15;
  
  // Check punching shear (simplified)
  const pileForce = axialLoad / actualNumberOfPiles;
  const pileCapConcreteStrength = 30e6; // Assume 30 MPa concrete
  const concretePunchingStrength = 0.33 * Math.sqrt(pileCapConcreteStrength);
  
  // Increase thickness if needed based on shear calculations
  const shearPerimeter = 2 * Math.PI * (pileDiameter/2 + pileCapThickness/2);
  const requiredThickness = pileForce / (shearPerimeter * concretePunchingStrength);
  
  pileCapThickness = Math.max(pileCapThickness, requiredThickness);
  
  // Ensure minimum thickness for practical construction
  pileCapThickness = Math.max(pileCapThickness, 0.6);
  
  // Round to nearest 50mm for constructability
  pileCapThickness = Math.ceil(pileCapThickness * 20) / 20;
  
  // Step 7: Design reinforcement
  // Bottom reinforcement for pile cap (simplified)
  const bottomReinforcementRatio = 0.003; // Typically 0.3% for pile caps
  const bottomReinforcement = bottomReinforcementRatio * pileCapWidth * pileCapThickness;
  
  // Pile reinforcement (longitudinal)
  const pileReinforcementRatio = 0.01; // Typically 1% for piles
  const pileReinforcement = pileReinforcementRatio * Math.PI * Math.pow(pileDiameter/2, 2);
  
  // Step 8: Estimate settlement
  let estimatedSettlement = 0;
  
  if (soilProperties.SPTvalue) {
    // Estimated settlement based on SPT N-value (simplified)
    // Using Meyerhof's empirical approach
    estimatedSettlement = (axialLoad * 1000) / (pileArea * 120 * soilProperties.SPTvalue);
  } else if (soilProperties.type.includes('clay')) {
    // Clay settlement (simplified elastic shortening + consolidation)
    estimatedSettlement = 0.02 + (axialLoad / pileGroupCapacity) * 0.03;
  } else {
    // Sand settlement (simplified)
    estimatedSettlement = 0.01 + (axialLoad / pileGroupCapacity) * 0.02;
  }
  
  // Cap settlement to reasonable range (in meters)
  estimatedSettlement = Math.min(estimatedSettlement, 0.05);
  
  // Generate comprehensive reinforcement details
  const reinforcementDetails = `Pile cap: ${Math.ceil(bottomReinforcement * 1e6)} mm² bottom steel mesh. ` +
                              `${actualNumberOfPiles} piles in ${pileRows}×${pileCols} arrangement, ` +
                              `each ${Math.round(pileDiameter * 1000)}mm diameter × ${pileLength.toFixed(1)}m deep with ` +
                              `${Math.ceil(pileReinforcement * 1e6)} mm² longitudinal steel (${Math.round(pileReinforcementRatio * 100)}%). ` +
                              `Estimated settlement: ${Math.round(estimatedSettlement * 1000)}mm.`;
  
  return {
    type: 'PileFoundation',
    dimensions: {
      length: pileCapLength,
      width: pileCapWidth,
      depth: pileCapThickness
    },
    material: 'Concrete',
    reinforcementDetails: reinforcementDetails,
    soilBearingCapacity: soilProperties.bearingCapacity * 1000,
    depthBelowGrade: pileLength + pileCapThickness
  };
}

// Get foundation type recommendation based on soil and loading
export function recommendFoundationType(
  totalBuildingLoad: number,
  buildingArea: number,
  soilType: string,
  buildingHeight: number
): FoundationType {
  // Get soil bearing capacity
  const soilBearingCapacity = soilBearingCapacities[soilType] || 150; // kPa, default to medium clay
  
  // Average pressure on soil
  const averagePressure = (totalBuildingLoad / buildingArea) / 1000; // kPa
  
  // Pressure ratio
  const pressureRatio = averagePressure / soilBearingCapacity;
  
  // Tall building factor
  const isTallBuilding = buildingHeight > 40; // Tall if > 40m (approx. 12 stories)
  
  // Decide foundation type
  if (pressureRatio > 1.5 || (isTallBuilding && pressureRatio > 0.8)) {
    return 'PileFoundation';
  } else if (pressureRatio > 0.7 || (isTallBuilding && pressureRatio > 0.5)) {
    return 'MatFoundation';
  } else if (pressureRatio > 0.4) {
    return 'StripFooting';
  } else {
    return 'SpreadFooting';
  }
}

// Enhanced foundation recommendation function that provides more detailed recommendations
export function recommendOptimalFoundation(
  buildingParameters: {
    totalBuildingLoad: number;
    buildingArea: number;
    buildingHeight: number;
    buildingType: string;
    columnSpacing?: number;
    maximumColumnLoad?: number;
  },
  soilConditions: {
    soilType: string;
    groundwaterLevel?: number; // meters below surface
    frostDepth?: number; // meters
    adjacentStructures?: boolean;
    SPTvalue?: number; // Standard Penetration Test N-value
  },
  constructabilityFactors?: {
    sitePrepared?: boolean;
    accessForEquipment?: boolean;
    constructionSchedule?: number; // months
    environmentalConstraints?: string[];
  }
): {
  recommendedFoundationType: FoundationType;
  alternativeFoundationType: FoundationType;
  rationale: string[];
  estimatedCostImpact: 'low' | 'medium' | 'high';
  recommendedDimensions?: {
    length: number;
    width: number;
    depth: number;
  };
  specialConsiderations?: string[];
} {
  // Get basic foundation type recommendation
  const { totalBuildingLoad, buildingArea, buildingHeight, buildingType } = buildingParameters;
  const { soilType } = soilConditions;
  
  // Initial recommendation based on load and soil conditions
  const initialRecommendation = recommendFoundationType(
    totalBuildingLoad, 
    buildingArea, 
    soilType,
    buildingHeight
  );
  
  // Calculate load intensity
  const averagePressure = (totalBuildingLoad / buildingArea) / 1000; // kPa
  const soilBearingCapacity = soilBearingCapacities[soilType] || 150; // kPa
  const pressureRatio = averagePressure / soilBearingCapacity;
  
  // Initialize result variables
  let recommendedFoundationType = initialRecommendation;
  let alternativeFoundationType: FoundationType = 'None';
  const rationale: string[] = [];
  let estimatedCostImpact: 'low' | 'medium' | 'high' = 'medium';
  const specialConsiderations: string[] = [];
  
  // Factors that might affect the recommendation
  
  // 2. High groundwater considerations
  if (soilConditions.groundwaterLevel !== undefined && soilConditions.groundwaterLevel < 2) {
    if (initialRecommendation === 'SpreadFooting' || initialRecommendation === 'StripFooting') {
      specialConsiderations.push("High groundwater table requires waterproofing and dewatering during construction");
      
      // If groundwater is very high and soil is susceptible to liquefaction
      if (soilConditions.groundwaterLevel < 1 && 
          (soilType.includes('sand') || soilType.includes('silt'))) {
        alternativeFoundationType = recommendedFoundationType;
        recommendedFoundationType = 'PileFoundation';
        rationale.push("High groundwater in liquefiable soil requires deep foundation");
        estimatedCostImpact = 'high';
      }
    }
  }
  
  // 3. Frost considerations
  if (soilConditions.frostDepth !== undefined && soilConditions.frostDepth > 0.5) {
    if (initialRecommendation === 'SpreadFooting' || initialRecommendation === 'StripFooting') {
      specialConsiderations.push(`Foundation depth must extend below frost line (${soilConditions.frostDepth}m)`);
    }
  }
  
  // 4. Adjacent structures
  if (soilConditions.adjacentStructures) {
    if (initialRecommendation === 'PileFoundation') {
      specialConsiderations.push("Vibration monitoring required for pile driving near adjacent structures");
      specialConsiderations.push("Consider auger-cast piles or drilled shafts to minimize vibration");
    }
    
    if (buildingHeight > 20 && initialRecommendation !== 'PileFoundation') {
      specialConsiderations.push("Foundation excavation may require shoring to protect adjacent structures");
    }
  }
  
  // 5. Construction constraints
  if (constructabilityFactors) {
    const { accessForEquipment, constructionSchedule, environmentalConstraints } = constructabilityFactors;
    
    // Limited equipment access might affect pile foundation feasibility
    if (accessForEquipment === false && recommendedFoundationType === 'PileFoundation') {
      alternativeFoundationType = recommendedFoundationType;
      recommendedFoundationType = 'MatFoundation';
      rationale.push("Limited site access for pile driving equipment");
      estimatedCostImpact = 'medium';
    }
    
    // Tight construction schedule might favor simpler foundations
    if (constructionSchedule !== undefined && constructionSchedule < 3) {
      if (recommendedFoundationType === 'PileFoundation' || recommendedFoundationType === 'MatFoundation') {
        specialConsiderations.push("Tight schedule may require accelerated construction methods");
        
        if (pressureRatio < 0.9 && recommendedFoundationType === 'MatFoundation') {
          alternativeFoundationType = recommendedFoundationType;
          recommendedFoundationType = 'StripFooting';
          rationale.push("Faster construction time with strip footings meets tight schedule");
        }
      }
    }
    
    // Environmental constraints
    if (environmentalConstraints && environmentalConstraints.length > 0) {
      if (environmentalConstraints.includes('noise restrictions') && recommendedFoundationType === 'PileFoundation') {
        specialConsiderations.push("Noise restrictions may require silent piling methods");
      }
      
      if (environmentalConstraints.includes('groundwater protection')) {
        specialConsiderations.push("Special precautions needed for groundwater protection during excavation");
      }
    }
  }
  
  // 6. Soil condition specific considerations
  if (soilType.includes('organic') || soilType === 'Peat') {
    // Organic soils are poor foundation soils
    recommendedFoundationType = 'PileFoundation';
    alternativeFoundationType = 'None';
    rationale.push(`${soilType} has very poor bearing capacity and high settlement potential`);
    specialConsiderations.push("Piles must extend through organic layer to competent bearing strata");
    estimatedCostImpact = 'high';
  }
  
  if (soilType.includes('clay') && pressureRatio > 0.5) {
    // Clay soils can have long-term settlement issues
    specialConsiderations.push("Monitor long-term consolidation settlement in clay");
    
    if (buildingType === 'industrial' || buildingType === 'healthcare') {
      if (recommendedFoundationType !== 'PileFoundation') {
        alternativeFoundationType = recommendedFoundationType;
        recommendedFoundationType = 'PileFoundation';
        rationale.push("Sensitive equipment in this building type requires minimal settlement");
      }
    }
  }
  
  // 7. Building type specific recommendations
  if (buildingType === 'residential' && buildingHeight < 15 && pressureRatio < 0.6) {
    // Low-rise residential can often use simpler foundations
    if (recommendedFoundationType === 'MatFoundation') {
      alternativeFoundationType = recommendedFoundationType;
      recommendedFoundationType = 'StripFooting';
      rationale.push("Low-rise residential allows for more economical strip footings");
      estimatedCostImpact = 'low';
    }
  }
  
  if (buildingType === 'industrial') {
    // Industrial buildings often have heavy concentrated loads
    const maxColumnLoad = buildingParameters.maximumColumnLoad || totalBuildingLoad / 10;
    if (maxColumnLoad > 2000000) { // 2000 kN
      if (recommendedFoundationType === 'SpreadFooting') {
        alternativeFoundationType = recommendedFoundationType;
        recommendedFoundationType = 'MatFoundation';
        rationale.push("Heavy column loads benefit from more rigid foundation system");
      }
    }
    
    // Add vibration consideration
    specialConsiderations.push("Consider dynamic loading and vibration from machinery in design");
  }
  
  // If we haven't set an alternative yet, provide one
  if (alternativeFoundationType === 'None') {
    // Provide next best alternative
    switch (recommendedFoundationType) {
      case 'SpreadFooting':
        alternativeFoundationType = 'StripFooting';
        break;
      case 'StripFooting':
        alternativeFoundationType = pressureRatio > 0.6 ? 'MatFoundation' : 'SpreadFooting';
        break;
      case 'MatFoundation':
        alternativeFoundationType = pressureRatio > 1.0 ? 'PileFoundation' : 'StripFooting';
        break;
      case 'PileFoundation':
        alternativeFoundationType = 'MatFoundation';
        break;
      default:
        alternativeFoundationType = 'SpreadFooting';
    }
  }
  
  // Determine cost impact if not already set
  if (estimatedCostImpact === 'medium') {
    if (recommendedFoundationType === 'SpreadFooting') {
      estimatedCostImpact = 'low';
    } else if (recommendedFoundationType === 'PileFoundation') {
      estimatedCostImpact = 'high';
    } else if (recommendedFoundationType === 'MatFoundation' && buildingArea > 1000) {
      estimatedCostImpact = 'high';
    }
  }
  
  // Generate recommended dimensions based on foundation type
  let recommendedDimensions;
  
  if (recommendedFoundationType === 'SpreadFooting' && buildingParameters.columnSpacing) {
    // Typical spread footing dimensions
    const columnLoad = buildingParameters.maximumColumnLoad || totalBuildingLoad / (buildingArea / Math.pow(buildingParameters.columnSpacing, 2));
    const area = columnLoad / (soilBearingCapacity * 1000);
    const size = Math.sqrt(area);
    recommendedDimensions = {
      length: Math.ceil(size * 10) / 10, // Round up to nearest 0.1m
      width: Math.ceil(size * 10) / 10,
      depth: Math.max(0.3, Math.ceil(size * 0.4 * 10) / 10) // Typically 0.3-0.5 times width
    };
  } else if (recommendedFoundationType === 'MatFoundation') {
    // Mat foundation dimensions
    recommendedDimensions = {
      length: Math.sqrt(buildingArea) + 1, // Add 0.5m on each side
      width: Math.sqrt(buildingArea) + 1,
      depth: Math.max(0.3, Math.ceil(Math.sqrt(buildingArea) * 0.03 * 10) / 10) // Typically 3-5% of width
    };
  }
  
  // Make sure we have some rationale
  if (rationale.length === 0) {
    if (recommendedFoundationType === 'SpreadFooting') {
      rationale.push("Soil bearing capacity adequate for isolated footings");
    } else if (recommendedFoundationType === 'StripFooting') {
      rationale.push("Strip footings provide efficient load distribution for this structure");
    } else if (recommendedFoundationType === 'MatFoundation') {
      rationale.push("Mat foundation provides uniform settlement control and load distribution");
    } else if (recommendedFoundationType === 'PileFoundation') {
      rationale.push("Deep foundation required due to soil conditions or structural loads");
    }
  }
  
  return {
    recommendedFoundationType,
    alternativeFoundationType,
    rationale,
    estimatedCostImpact,
    ...(recommendedDimensions ? { recommendedDimensions } : {}),
    ...(specialConsiderations.length > 0 ? { specialConsiderations } : {})
  };
}

// Estimate cost of foundation
export function estimateFoundationCost(
  foundation: Foundation,
  region: string = 'US', // Add region parameter for regional cost factors
  projectScale: 'small' | 'medium' | 'large' = 'medium' // Scale affects unit costs
): {
  total: number;
  breakdown: {
    concrete: number;
    reinforcement: number;
    excavation: number;
    formwork: number;
    piling?: number;
    mobilization?: number;
    other: number;
  };
  quantities: {
    concreteVolume: number;
    reinforcementTonnage: number;
    excavationVolume: number;
    formworkArea: number;
    pilingMeters?: number;
  };
} {
  // Regional cost factors (relative to US base costs)
  const regionalFactors: Record<string, number> = {
    'US': 1.0,
    'Europe': 1.2,
    'UK': 1.3,
    'Canada': 1.1,
    'Australia': 1.25,
    'Asia': 0.8,
    'Middle East': 0.9,
    'South America': 0.75,
    'Africa': 0.7
  };
  
  // Apply the appropriate regional factor
  const regionalFactor = regionalFactors[region] || 1.0;
  
  // Project scale factors
  const scaleFactor = projectScale === 'small' ? 1.2 : 
                     projectScale === 'large' ? 0.85 : 1.0;
  
  // Base unit costs (in US dollars)
  const baseCosts = {
    concrete: 200, // $/m³
    reinforcement: 2200, // $/ton
    excavation: 50, // $/m³
    formwork: 60, // $/m²
    piling: 350, // $/meter of pile
    mobilization: 5000, // $ fixed cost for pile driving equipment
    other: 0.05 // 5% of total for miscellaneous costs
  };
  
  // Apply regional and scale factors to unit costs
  const unitCosts = {
    concrete: baseCosts.concrete * regionalFactor * scaleFactor,
    reinforcement: baseCosts.reinforcement * regionalFactor * scaleFactor,
    excavation: baseCosts.excavation * regionalFactor * scaleFactor,
    formwork: baseCosts.formwork * regionalFactor * scaleFactor,
    piling: baseCosts.piling * regionalFactor * scaleFactor,
    mobilization: baseCosts.mobilization * regionalFactor,
    other: baseCosts.other // Percentage remains the same
  };
  
  // Calculate foundation dimensions
  const { dimensions } = foundation;
  const { length, width, depth } = dimensions;
  
  // Calculate material quantities
  const concreteVolume = length * width * depth;
  
  // Calculate excavation volume (foundation volume + working space)
  // Typically need 0.5m extra on each side and 0.2m below
  const excavationLength = length + 1.0;
  const excavationWidth = width + 1.0;
  const excavationDepth = depth + 0.2;
  const excavationVolume = excavationLength * excavationWidth * excavationDepth;
  
  // Calculate formwork area (vertical sides of the foundation)
  const formworkArea = 2 * (length + width) * depth;
  
  // Extract reinforcement details from the foundation
  const reinforcementString = foundation.reinforcementDetails || '';
  
  // Extract reinforcement quantities using more sophisticated pattern matching
  let reinforcementTonnage = 0;
  
  // Match patterns like "1234 mm²" or "1234mm²"
  const areaMatches = reinforcementString.match(/(\d+(?:\.\d+)?)\s*mm²/g);
  if (areaMatches && areaMatches.length > 0) {
    // Sum up all matched areas
    const totalAreaMm2 = areaMatches.reduce((sum, match) => {
      const areaValue = parseFloat(match.replace(/[^\d.]/g, ''));
      return sum + areaValue;
    }, 0);
    
    // Calculate tonnage based on foundation type
    if (foundation.type === 'MatFoundation') {
      // For mat foundations, steel runs in both directions and covers the entire area
      reinforcementTonnage = totalAreaMm2 * 1e-6 * (length + width) * 7850 / 1000;
    } else if (foundation.type === 'SpreadFooting' || foundation.type === 'StripFooting') {
      // For spread/strip footings, apply a length factor
      reinforcementTonnage = totalAreaMm2 * 1e-6 * Math.max(length, width) * 7850 / 1000;
    } else {
      // Default calculation
      reinforcementTonnage = totalAreaMm2 * 1e-6 * Math.sqrt(length * width) * 7850 / 1000;
    }
  }
  
  // For pile foundations, extract more details
  let pilingMeters = 0;
  let pilingCost = 0;
  let mobilizationCost = 0;
  
  if (foundation.type === 'PileFoundation') {
    // Extract number of piles and pile length
    const pileCountMatch = reinforcementString.match(/(\d+)\s*piles?/i);
    const pileLengthMatch = reinforcementString.match(/(\d+(?:\.\d+)?)\s*m\s*deep/i);
    const pileDiameterMatch = reinforcementString.match(/(\d+)\s*mm\s*diameter/i);
    
    const pileCount = pileCountMatch && pileCountMatch[1] ? parseInt(pileCountMatch[1]) : 0;
    const pileLength = pileLengthMatch && pileLengthMatch[1] ? parseFloat(pileLengthMatch[1]) : 0;
    const pileDiameter = pileDiameterMatch && pileDiameterMatch[1] ? parseInt(pileDiameterMatch[1]) : 500;
    
    // Calculate total linear meters of piling
    pilingMeters = pileCount * pileLength;
    
    // Additional costs for pile foundations
    pilingCost = pilingMeters * unitCosts.piling * (pileDiameter / 500); // Adjust for pile diameter
    mobilizationCost = unitCosts.mobilization;
    
    // For pile foundations, add additional reinforcement for the piles
    if (pileCount > 0) {
      // Approximate reinforcement in the piles
      const pileSteelRatio = 0.01; // 1% reinforcement in piles
      const pileDiameterM = pileDiameter / 1000;
      const pileVolume = Math.PI * Math.pow(pileDiameterM / 2, 2) * pileLength * pileCount;
      const pileSteelVolume = pileVolume * pileSteelRatio;
      
      // Add pile reinforcement to total
      reinforcementTonnage += pileSteelVolume * 7850 / 1000;
    }
  }
  
  // Calculate costs for each component
  const concreteCost = concreteVolume * unitCosts.concrete;
  const reinforcementCost = reinforcementTonnage * unitCosts.reinforcement;
  const excavationCost = excavationVolume * unitCosts.excavation;
  const formworkCost = formworkArea * unitCosts.formwork;
  
  // Calculate direct costs
  const directCosts = concreteCost + reinforcementCost + excavationCost + formworkCost + pilingCost + mobilizationCost;
  
  // Other costs (contingency, miscellaneous)
  const otherCosts = directCosts * unitCosts.other;
  
  // Total cost
  const totalCost = directCosts + otherCosts;
  
  // Return detailed cost breakdown
  return {
    total: Math.round(totalCost),
    breakdown: {
      concrete: Math.round(concreteCost),
      reinforcement: Math.round(reinforcementCost),
      excavation: Math.round(excavationCost),
      formwork: Math.round(formworkCost),
      ...(pilingCost > 0 ? { piling: Math.round(pilingCost) } : {}),
      ...(mobilizationCost > 0 ? { mobilization: Math.round(mobilizationCost) } : {}),
      other: Math.round(otherCosts)
    },
    quantities: {
      concreteVolume: parseFloat(concreteVolume.toFixed(2)),
      reinforcementTonnage: parseFloat(reinforcementTonnage.toFixed(2)),
      excavationVolume: parseFloat(excavationVolume.toFixed(2)),
      formworkArea: parseFloat(formworkArea.toFixed(2)),
      ...(pilingMeters > 0 ? { pilingMeters: parseFloat(pilingMeters.toFixed(2)) } : {})
    }
  };
}

// Calculate estimated settlement for different foundation types
export function calculateSettlement(
  foundation: Foundation,
  soilProperties: {
    soilType: string;
    elasticModulus?: number; // MPa
    compressionIndex?: number; // For consolidation settlement
    voidRatio?: number; // For consolidation settlement
    preconsolidationPressure?: number; // kPa
    waterContent?: number; // %
    liquidLimit?: number; // %
    plasticityIndex?: number; // %
    SPTvalue?: number; // N-value from Standard Penetration Test
  },
  loadParameters: {
    totalLoad: number; // N
    averagePressure?: number; // kPa (calculated if not provided)
    eccentricity?: { x: number, y: number }; // m, load eccentricity
  }
): {
  immediateSettlement: number; // mm
  consolidationSettlement: number; // mm
  secondarySettlement: number; // mm
  totalSettlement: number; // mm
  timeToReach90Percent: number; // days
  differentialSettlementRisk: 'low' | 'medium' | 'high';
  settlementProfile?: number[][]; // 2D grid of settlement values for mat foundations
  designRecommendations: string[];
} {
  // Extract foundation dimensions
  const { dimensions, type } = foundation;
  const { length, width, depth } = dimensions;
  
  // Calculate foundation area and pressure if not provided
  const foundationArea = length * width; // m²
  const averagePressure = loadParameters.averagePressure || 
                         (loadParameters.totalLoad / foundationArea) / 1000; // kPa
  
  // Initialize settlement values
  let immediateSettlement = 0;
  let consolidationSettlement = 0;
  let secondarySettlement = 0;
  let timeToReach90Percent = 0;
  let differentialSettlementRisk: 'low' | 'medium' | 'high' = 'low';
  const designRecommendations: string[] = [];
  
  // Get soil elastic modulus (estimate if not provided)
  let elasticModulus = soilProperties.elasticModulus;
  if (!elasticModulus) {
    // Estimate elastic modulus from SPT if available
    if (soilProperties.SPTvalue) {
      // Correlations for different soil types
      if (soilProperties.soilType.includes('sand')) {
        elasticModulus = soilProperties.SPTvalue * 0.5; // MPa
      } else if (soilProperties.soilType.includes('clay')) {
        elasticModulus = soilProperties.SPTvalue * 0.4; // MPa
      } else if (soilProperties.soilType.includes('gravel')) {
        elasticModulus = soilProperties.SPTvalue * 1.0; // MPa
      } else {
        elasticModulus = soilProperties.SPTvalue * 0.45; // MPa (default)
      }
    } else {
      // Default values based on soil type
      elasticModulus = soilElasticModuli[soilProperties.soilType] || 20; // MPa
    }
  }
  
  // Calculate influence depth (depth of significant stress increase)
  // Typically 1-2 times foundation width for spread footings
  let influenceDepth = 0;
  if (type === 'SpreadFooting' || type === 'StripFooting') {
    influenceDepth = Math.min(width, length) * 2;
  } else if (type === 'MatFoundation') {
    influenceDepth = Math.min(width, length);
  } else if (type === 'PileFoundation') {
    // For pile foundations, influence depth is typically to pile tip plus some additional depth
    // Extract pile length from reinforcement details if available
    const pileLengthMatch = (foundation.reinforcementDetails || '').match(/(\d+(?:\.\d+)?)\s*m\s*deep/i);
    const pileLength = pileLengthMatch && pileLengthMatch[1] ? parseFloat(pileLengthMatch[1]) : 10;
    influenceDepth = pileLength * 1.2;
  }
  
  // 1. Calculate immediate (elastic) settlement
  // Use the simplified elastic formula: s = q * B * (1-v²) * If / Es
  // where q = pressure, B = width, v = Poisson's ratio, If = influence factor, Es = elastic modulus
  
  // Shape factor (If) varies with foundation shape
  let shapeFactor = 0.0;
  const aspectRatio = length / width;
  
  if (type === 'SpreadFooting') {
    if (aspectRatio <= 1.5) {
      shapeFactor = 0.82; // Nearly square footing
    } else if (aspectRatio <= 5) {
      shapeFactor = 0.75; // Rectangular footing
    } else {
      shapeFactor = 0.67; // Strip/continuous footing
    }
  } else if (type === 'StripFooting') {
    shapeFactor = 0.67;
  } else if (type === 'MatFoundation') {
    shapeFactor = 0.85; // Typical value for mat foundations
  } else { // PileFoundation
    shapeFactor = 0.5; // Lower value for pile groups
  }
  
  // Adjustment for embedment depth
  const depthFactor = Math.max(0.5, 1 - 0.5 * (depth / width));
  
  // Poisson's ratio for soil (estimate based on soil type)
  let poissonsRatio = 0.3; // Default value
  if (soilProperties.soilType.includes('clay')) {
    poissonsRatio = 0.4;
  } else if (soilProperties.soilType.includes('sand')) {
    poissonsRatio = 0.3;
  } else if (soilProperties.soilType.includes('rock')) {
    poissonsRatio = 0.25;
  }
  
  // Calculate immediate settlement in mm
  immediateSettlement = averagePressure * width * (1 - Math.pow(poissonsRatio, 2)) * shapeFactor * depthFactor / (elasticModulus * 1000);
  immediateSettlement *= 1000; // Convert from m to mm
  
  // 2. Calculate consolidation settlement (for cohesive soils)
  if (soilProperties.soilType.includes('clay') || 
      soilProperties.soilType.includes('silt') || 
      soilProperties.soilType === 'Organic soil' ||
      soilProperties.soilType === 'Peat') {
    
    // Need compression index and void ratio for consolidation settlement
    let compressionIndex = soilProperties.compressionIndex;
    let voidRatio = soilProperties.voidRatio;
    let preconsolidationPressure = soilProperties.preconsolidationPressure;
    
    // Estimate if not provided
    if (!compressionIndex && soilProperties.liquidLimit) {
      // Correlation with liquid limit for normally consolidated clays
      compressionIndex = 0.009 * (soilProperties.liquidLimit - 10);
    } else if (!compressionIndex) {
      // Default value based on soil type
      compressionIndex = soilCompressionIndices[soilProperties.soilType] || 0.2;
    }
    
    if (!voidRatio && soilProperties.waterContent) {
      // Estimate void ratio from water content (assuming fully saturated soil)
      const specificGravity = 2.7; // Typical value for most soils
      voidRatio = soilProperties.waterContent * specificGravity / 100;
    } else if (!voidRatio) {
      // Default values based on soil type
      voidRatio = soilVoidRatios[soilProperties.soilType] || 0.8;
    }
    
    if (!preconsolidationPressure) {
      // Assume normally consolidated soil with some overconsolidation from overburden
      const unitWeight = 18; // kN/m³, typical soil unit weight
      preconsolidationPressure = depth * unitWeight * 1.2; // 20% overconsolidation
    }
    
    // Calculate stress at middle of compressible layer
    const overburdenStress = depth * 18; // kPa, at foundation level
    
    // Stress increase at the middle of the compressible layer
    // Use approximate 2:1 stress distribution method
    const z = influenceDepth / 2; // Middle of influence zone
    const stressIncrease = averagePressure * (width * length) / ((width + z) * (length + z));
    
    // Check if soil is normally consolidated or overconsolidated
    if (overburdenStress + stressIncrease > preconsolidationPressure) {
      // Partially overconsolidated case
      if (overburdenStress < preconsolidationPressure) {
        // Recompression up to preconsolidation pressure + virgin compression after
        const recompressionIndex = compressionIndex / 5; // Typical relationship
        
        consolidationSettlement = influenceDepth * (
          (recompressionIndex / (1 + voidRatio)) * Math.log10(preconsolidationPressure / overburdenStress) +
          (compressionIndex / (1 + voidRatio)) * Math.log10((overburdenStress + stressIncrease) / preconsolidationPressure)
        );
      } else {
        // Normally consolidated case
        consolidationSettlement = influenceDepth * (compressionIndex / (1 + voidRatio)) * 
                               Math.log10((overburdenStress + stressIncrease) / overburdenStress);
      }
    } else {
      // Fully overconsolidated case
      const recompressionIndex = compressionIndex / 5; // Typical relationship
      consolidationSettlement = influenceDepth * (recompressionIndex / (1 + voidRatio)) * 
                             Math.log10((overburdenStress + stressIncrease) / overburdenStress);
    }
    
    // Convert to mm
    consolidationSettlement *= 1000;
    
    // Calculate time for 90% consolidation
    // Using Terzaghi's theory: t₉₀ = T₉₀ * H² / Cv
    // where T₉₀ ≈ 0.848, H = drainage path length, Cv = coefficient of consolidation
    
    // Estimate coefficient of consolidation based on soil type
    const coefficientOfConsolidation = soilConsolidationCoefficients[soilProperties.soilType] || 0.1; // m²/month
    
    // Drainage path length (typically half the thickness for double drainage)
    const drainagePath = influenceDepth / 2;
    
    // Time for 90% consolidation (in months)
    const timeInMonths = 0.848 * Math.pow(drainagePath, 2) / coefficientOfConsolidation;
    
    // Convert to days
    timeToReach90Percent = timeInMonths * 30;
    
    // 3. Calculate secondary settlement (creep)
    // Important for organic soils, peat, and some clays
    if (soilProperties.soilType === 'Organic soil' || 
        soilProperties.soilType === 'Peat' || 
        (soilProperties.soilType.includes('clay') && soilProperties.plasticityIndex && soilProperties.plasticityIndex > 30)) {
        
      // Secondary compression index (Cα)
      let secondaryCompressionIndex = 0.0;
      
      if (soilProperties.soilType === 'Organic soil') {
        secondaryCompressionIndex = 0.03;
      } else if (soilProperties.soilType === 'Peat') {
        secondaryCompressionIndex = 0.05;
      } else {
        // For clays, typically Cα/Cc ratio = 0.04 ± 0.01
        secondaryCompressionIndex = compressionIndex * 0.04;
      }
      
      // Time factor (typical design life / time to reach 90% consolidation)
      const designLife = 50 * 365; // 50 years in days
      const timeFactor = Math.log10(designLife / timeToReach90Percent);
      
      // Secondary settlement
      secondarySettlement = influenceDepth * (secondaryCompressionIndex / (1 + voidRatio)) * timeFactor * 1000; // mm
    }
  }
  
  // Calculate total settlement
  const totalSettlement = immediateSettlement + consolidationSettlement + secondarySettlement;
  
  // Evaluate differential settlement risk
  // Based on foundation type, soil heterogeneity, and load eccentricity
  if (loadParameters.eccentricity && 
      (Math.abs(loadParameters.eccentricity.x) > width/6 || 
       Math.abs(loadParameters.eccentricity.y) > length/6)) {
    differentialSettlementRisk = 'high';
    
    designRecommendations.push(
      "High load eccentricity detected. Consider enlarging foundation or adding counterbalance."
    );
  } else if (soilProperties.soilType.includes('Soft') || 
            soilProperties.soilType === 'Organic soil' || 
            soilProperties.soilType === 'Peat' ||
            soilProperties.soilType === 'Fill (uncompacted)') {
    differentialSettlementRisk = 'high';
    
    designRecommendations.push(
      `High differential settlement risk due to ${soilProperties.soilType}. Consider soil improvement or structural measures.`
    );
  } else if (totalSettlement > 50) {
    differentialSettlementRisk = 'medium';
    
    designRecommendations.push(
      "Significant total settlement expected. Monitor during and after construction."
    );
  }
  
  // Special case for Mat foundations - calculate settlement profile
  let settlementProfile: number[][] | undefined;
  
  if (type === 'MatFoundation' && totalSettlement > 10) {
    // Create a simplified 3x3 grid of settlement values to show distribution
    settlementProfile = [];
    
    const centerSettlement = totalSettlement;
    const cornerSettlement = totalSettlement * 0.7; // Typically 70-80% of center settlement
    const edgeSettlement = totalSettlement * 0.85; // Typically 80-90% of center settlement
    
    // Adjust for eccentric loading if present
    if (loadParameters.eccentricity) {
      const { x, y } = loadParameters.eccentricity;
      const xFactor = 1 + (x / (width/2)) * 0.3; // Up to 30% increase/decrease
      const yFactor = 1 + (y / (length/2)) * 0.3;
      
      // Create settlement profile grid (3x3)
      for (let i = 0; i < 3; i++) {
        const row = [];
        for (let j = 0; j < 3; j++) {
          let baseValue;
          if ((i === 0 || i === 2) && (j === 0 || j === 2)) {
            baseValue = cornerSettlement; // Corners
          } else if (i === 1 && j === 1) {
            baseValue = centerSettlement; // Center
          } else {
            baseValue = edgeSettlement; // Edges
          }
          
          // Apply eccentricity factors
          const xPos = (j - 1) / 1; // -1, 0, or 1
          const yPos = (i - 1) / 1; // -1, 0, or 1
          const eccFactor = 1 + (xPos * xFactor - 1) + (yPos * yFactor - 1);
          
          row.push(Math.round(baseValue * eccFactor));
        }
        settlementProfile.push(row);
      }
    } else {
      // Symmetric settlement without eccentricity
      settlementProfile = [
        [Math.round(cornerSettlement), Math.round(edgeSettlement), Math.round(cornerSettlement)],
        [Math.round(edgeSettlement), Math.round(centerSettlement), Math.round(edgeSettlement)],
        [Math.round(cornerSettlement), Math.round(edgeSettlement), Math.round(cornerSettlement)]
      ];
    }
  }
  
  // Add design recommendations based on settlement values
  if (totalSettlement > 100) {
    designRecommendations.push(
      "Settlement exceeds 100mm. Consider changing foundation type or improving soil conditions."
    );
  }
  
  if (type === 'SpreadFooting' && totalSettlement > 25) {
    designRecommendations.push(
      "For spread footings, settlement exceeds typical limits. Consider connecting footings with grade beams."
    );
  }
  
  if (timeToReach90Percent > 180) {
    designRecommendations.push(
      `Long consolidation time (${Math.round(timeToReach90Percent/30)} months). Consider ground improvement or preloading.`
    );
  }
  
  return {
    immediateSettlement: Math.round(immediateSettlement),
    consolidationSettlement: Math.round(consolidationSettlement),
    secondarySettlement: Math.round(secondarySettlement),
    totalSettlement: Math.round(totalSettlement),
    timeToReach90Percent: Math.round(timeToReach90Percent),
    differentialSettlementRisk,
    ...(settlementProfile ? { settlementProfile } : {}),
    designRecommendations
  };
} 