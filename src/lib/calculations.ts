import { BuildingParameters, BeamResults, CalculationResults, StructuralChecks, UnitSystem } from './types';
import { getMaterial } from './materials';

// Enhanced beam calculation with moment and shear diagrams
function calculateBeamResults(w: number, L: number, E: number, I: number, h: number, 
                              endCondition: 'simple' | 'fixed' | 'cantilever' | 'continuous' = 'simple'): BeamResults {
    // Calculate based on end conditions
    let maxDeflection: number;
    let M_max: number;
    let reactions: number[];
    
    switch(endCondition) {
        case 'fixed':
            // Fixed-end beam under uniform load
            maxDeflection = (w * L ** 4) / (384 * E * I);
            M_max = (w * L ** 2) / 12; // Max positive moment at midspan
            // Negative moment at supports (can be used for reinforcement design)
            reactions = [w * L / 2, w * L / 2];
            break;
        
        case 'cantilever':
            // Cantilever beam under uniform load
            maxDeflection = (w * L ** 4) / (8 * E * I);
            M_max = (w * L ** 2) / 2; // Moment at fixed end
            reactions = [w * L, 0]; // All load at fixed end
            break;
        
        case 'continuous':
            // Approximate continuous beam under uniform load (interior span)
            maxDeflection = (w * L ** 4) / (384 * E * I) * 0.8; // Reduced due to continuity
            M_max = (w * L ** 2) / 10; // Approximate positive moment for continuous beam
            reactions = [w * L / 2, w * L / 2]; // Simplified reactions
            break;
        
        case 'simple':
        default:
    // Simply supported beam under uniform load
            maxDeflection = (5 * w * L ** 4) / (384 * E * I);
            M_max = (w * L ** 2) / 8;
            reactions = [w * L / 2, w * L / 2];
            break;
    }
    
    // Section properties
    const c = h / 2;
    const maxStress = (M_max * c) / I;
    
    // Generate moment diagram, shear diagram, and deflection curve
    const numPoints = 21; // Number of points to sample
    const momentDiagram: number[] = [];
    const shearDiagram: number[] = [];
    const deflectionCurve: number[] = [];
    
    for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * L;
        let moment = 0;
        let shear = 0;
        let deflection = 0;
        
        switch(endCondition) {
            case 'fixed':
                // Moment for fixed-end beam with uniform load
                moment = (w * x * (L - x)) / 2 - (w * L ** 2) / 12;
                shear = w * (L / 2 - x);
                deflection = (w * x**2 * (L - x)**2) / (24 * E * I);
                break;
                
            case 'cantilever':
                // Cantilever beam with fixed end at x=0
                moment = (w * x ** 2) / 2;
                shear = w * x;
                deflection = (w * x**2) * (6*L**2 - 4*L*x + x**2) / (24 * E * I);
                break;
                
            case 'continuous':
                // Approximate moment for continuous beam (simplified)
                const M_neg = (w * L ** 2) / 10; // Approx. negative moment at supports
                moment = (w * x * (L - x)) / 2 - M_neg * (1 - 4 * x * (L - x) / L**2);
                shear = w * (L / 2 - x);
                deflection = (w * x * (L**3 - 2*L*x**2 + x**3)) / (24 * E * I) * 0.8;
                break;
                
            case 'simple':
            default:
                // Simply supported beam with uniform load
                moment = (w * x * (L - x)) / 2;
                shear = w * (L / 2 - x);
                deflection = (w * x * (L**3 - 2*L*x**2 + x**3)) / (24 * E * I);
                break;
        }
        
        momentDiagram.push(moment);
        shearDiagram.push(shear);
        deflectionCurve.push(deflection);
    }
    
    // Calculate utilization ratios
    const material = getMaterial('steel'); // Default to steel if not specified
    const allowableStress = material.yieldStrength * 0.6; // 60% of yield strength as allowable stress
    const utilizationRatio = maxStress / allowableStress;
    
    // Calculate additional engineering parameters
    const sectionModulus = I / c;
    const bendingUtilization = M_max / (allowableStress * sectionModulus);
    const shearUtilization = Math.max(...shearDiagram.map(Math.abs)) / (0.4 * material.yieldStrength * (h * (h/10))); // Approximate shear area
    const interactionRatio = Math.sqrt(bendingUtilization**2 + shearUtilization**2); // Simple interaction equation
    
    return { 
        maxDeflection, 
        maxStress, 
        reactionLeft: reactions[0],
        reactionRight: reactions[1],
        momentDiagram,
        shearDiagram,
        deflectionCurve,
        utilizationRatio,
        bendingUtilization,
        shearUtilization,
        interactionRatio
    };
}

// Calculate critical buckling load for columns
function calculateBuckling(E: number, I: number, L: number, K: number = 1.0): number {
    // Euler's critical buckling load formula
    // K is the effective length factor (1.0 for pinned ends)
    return (Math.PI ** 2 * E * I) / ((K * L) ** 2);
}

// Calculate natural frequency for a simple system
function calculateNaturalFrequency(k: number, m: number): number {
    // Natural frequency for a single degree of freedom system
    // k = stiffness, m = mass
    return Math.sqrt(k / m) / (2 * Math.PI); // in Hz
}

// Weight calculation based on material and dimensions
function calculateStructuralWeight(params: BuildingParameters): number {
    const {
        buildingLength: L,
        buildingWidth: W,
        buildingHeight: H,
        numberOfStoreys: Ns,
        columnsAlongLength: M,
        columnsAlongWidth: N,
        beamWidth: b,
        beamHeight: h,
        slabThickness: sT,
        columnWidth: cw,
        columnDepth: cd,
        materialName
    } = params;
    
    const material = getMaterial(materialName || 'steel');
    const density = material.density; // kg/m³
    
    // Calculate volume of structural elements
    const columnVolume = M * N * H * Ns * cw * cd;
    const beamVolumeX = Ns * N * (M - 1) * L * b * h / (M - 1);
    const beamVolumeZ = Ns * M * (N - 1) * W * b * h / (N - 1);
    const slabVolume = Ns * L * W * sT;
    
    const totalVolume = columnVolume + beamVolumeX + beamVolumeZ + slabVolume;
    const totalWeight = totalVolume * density * 9.81; // Force in Newtons
    
    return totalWeight;
}

// Perform structural checks
function performStructuralChecks(results: CalculationResults, params: BuildingParameters): StructuralChecks {
    // Allowable deflection is typically span/360 for live load
    const maxSpan = Math.max(
        params.buildingLength / (params.columnsAlongLength - 1),
        params.buildingWidth / (params.columnsAlongWidth - 1)
    );
    const allowableDeflection = maxSpan / 360;
    const deflectionCheck = results.maxBeamDeflection <= allowableDeflection;
    
    // Allowable stress check (simplified)
    const material = getMaterial(params.materialName || 'steel');
    const allowableStress = material.yieldStrength * 0.6;  // 60% of yield as allowable stress
    const stressCheck = results.maxBeamStress <= allowableStress;
    
    // Additional checks
    const Icolumn = (params.columnWidth * params.columnDepth ** 3) / 12;
    const criticalBucklingLoad = calculateBuckling(
        params.elasticModulus, 
        Icolumn, 
        params.buildingHeight, 
        1.0
    );
    
    // Check if any column exceeds the critical buckling load
    const maxColumnLoad = Math.max(...results.columnAxialLoads);
    const bucklingCheck = maxColumnLoad < criticalBucklingLoad;
    
    // Shear capacity check (simplified)
    const maxShear = Math.max(...results.beamResults.flatMap(b => 
        b.shearDiagram ? Math.max(...b.shearDiagram.map(Math.abs)) : 0
    ));
    const allowableShear = 0.4 * allowableStress; // Simplified
    const shearCheck = maxShear < allowableShear;
    
    return {
        deflectionCheck,
        stressCheck,
        buckling: bucklingCheck,
        shearCapacity: shearCheck
    };
}

// Dynamic analysis (simplified modal analysis)
function performDynamicAnalysis(params: BuildingParameters): {
    frequencies: number[];
    modalShapes: number[][];
    participationFactors: number[];
} {
    // Simplified approach for a multi-story building
    const { numberOfStoreys, elasticModulus, columnWidth, columnDepth, buildingHeight } = params;
    
    // Simplified mass and stiffness calculation
    const masses: number[] = [];
    const stiffnesses: number[] = [];
    
    const storyHeight = buildingHeight / numberOfStoreys;
    const Icolumn = (columnWidth * columnDepth ** 3) / 12;
    const columnCount = params.columnsAlongLength * params.columnsAlongWidth;
    
    // Calculate approximate mass and stiffness for each story
    for (let i = 0; i < numberOfStoreys; i++) {
        // Simplified mass calculation (assume uniform mass)
        const storyMass = 5000 * params.buildingLength * params.buildingWidth; // Simplified mass in kg
        masses.push(storyMass);
        
        // Column stiffness (simplified for lateral movement)
        const k = 12 * elasticModulus * Icolumn / (storyHeight ** 3) * columnCount;
        stiffnesses.push(k);
    }
    
    // For a more rigorous approach, we would solve the eigenvalue problem
    // Here we use simplified formulas for demonstration
    
    // Calculate frequencies (simplified approach)
    const frequencies: number[] = [];
    const modalShapes: number[][] = [];
    const participationFactors: number[] = [];
    
    for (let i = 0; i < numberOfStoreys; i++) {
        // Approximate natural frequency using simplified formula
        const frequency = (i + 1) * Math.sqrt(stiffnesses[0] / masses[0]) / (2 * Math.PI);
        frequencies.push(frequency);
        
        // Simplified modal shape (sine waves)
        const modalShape = Array(numberOfStoreys).fill(0).map((_, j) => 
            Math.sin((i + 1) * Math.PI * (j + 1) / (numberOfStoreys + 1))
        );
        modalShapes.push(modalShape);
        
        // Simplified participation factor
        const numerator = modalShape.reduce((sum, val, idx) => sum + val * masses[idx], 0);
        const denominator = modalShape.reduce((sum, val, idx) => sum + val * val * masses[idx], 0);
        const gamma = numerator / denominator;
        participationFactors.push(gamma);
    }
    
    return {
        frequencies,
        modalShapes,
        participationFactors
    };
}

// Enhanced building calculations with additional analyses
export function calculateBuildingResults(params: BuildingParameters): CalculationResults {
    // Original calculation logic
    const {
        buildingLength: L,
        buildingWidth: W,
        buildingHeight: H,
        numberOfStoreys: Ns,
        columnsAlongLength: M,
        columnsAlongWidth: N,
        slabLoad: q,
        beamWidth: b,
        beamHeight: h,
        elasticModulus: E,
        columnWidth: cw,
        columnDepth: cd,
    } = params;

    const dx = L / (M - 1); // Spacing between columns along x
    const dz = W / (N - 1); // Spacing between columns along z
    const I = (b * h ** 3) / 12; // Moment of inertia for beams
    const beamResults: BeamResults[] = [];
    
    // Beams along x-direction
    const beamLengthX = dx; // Length of each beam segment along x
    for (let k = 1; k <= Ns; k++) {
        for (let j = 0; j < N; j++) {
            const isEdgeZ = j === 0 || j === N - 1;
            const tributaryWidth = isEdgeZ ? dz / 2 : dz;
            const w = q * tributaryWidth;
            for (let i = 0; i < M - 1; i++) {
                // Use 'continuous' for interior beams and 'simple' for edge beams
                const endCondition = (i > 0 && i < M - 2) ? 'continuous' : 'simple';
                const beamResult = calculateBeamResults(w, beamLengthX, E, I, h, endCondition);
                beamResults.push(beamResult);
            }
        }
    }

    // Beams along z-direction
    const beamLengthZ = dz; // Length of each beam segment along z
    for (let k = 1; k <= Ns; k++) {
        for (let i = 0; i < M; i++) {
            const isEdgeX = i === 0 || i === M - 1;
            const tributaryWidth = isEdgeX ? dx / 2 : dx;
            const w = q * tributaryWidth;
            for (let j = 0; j < N - 1; j++) {
                // Use 'continuous' for interior beams and 'simple' for edge beams
                const endCondition = (j > 0 && j < N - 2) ? 'continuous' : 'simple';
                const beamResult = calculateBeamResults(w, beamLengthZ, E, I, h, endCondition);
                beamResults.push(beamResult);
            }
        }
    }

    // Column axial loads
    const columnAxialLoads: number[] = [];
    for (let i = 0; i < M; i++) {
        for (let j = 0; j < N; j++) {
            let A = 0;
            if (i === 0 || i === M - 1) A = dx / 2;
            else A = dx;
            if (j === 0 || j === N - 1) A *= dz / 2;
            else A *= dz;
            const axialLoad = q * A * Ns;
            columnAxialLoads.push(axialLoad);
        }
    }

    const maxBeamDeflection = Math.max(...beamResults.map(b => b.maxDeflection));
    const maxBeamStress = Math.max(...beamResults.map(b => b.maxStress));
    const columnArea = cw * cd;
    const maxColumnStress = Math.max(...columnAxialLoads.map(F => F / columnArea));

    // Calculate allowable values
    const material = getMaterial(params.materialName || 'steel');
    const allowableDeflection = Math.max(dx, dz) / 360; // Span/360 is common for live load deflection limit
    const allowableStress = material.yieldStrength * 0.6; // 60% of yield strength as allowable stress

    // Calculate total structural weight
    const totalWeight = calculateStructuralWeight(params);
    
    // Calculate buckling loads
    const Icolumn = (cw * cd ** 3) / 12;
    const bucklingLoad = calculateBuckling(E, Icolumn, H / Ns);
    const maxColumnLoad = Math.max(...columnAxialLoads);
    const bucklingFactor = bucklingLoad / maxColumnLoad;
    
    // Calculate approximate period of vibration (simplified)
    const stiffness = (48 * E * I) / ((dx + dz) / 2) ** 3; // Approximate lateral stiffness
    const approximateMass = totalWeight / 9.81; // Mass in kg
    const naturalFrequency = calculateNaturalFrequency(stiffness, approximateMass);
    const periodOfVibration = 1 / naturalFrequency;
    
    // Perform dynamic analysis
    const dynamicAnalysis = performDynamicAnalysis(params);
    
    // Calculate base shear (very simplified)
    const seismicCoefficient = 0.1; // Example value, would be determined by code
    const baseShear = seismicCoefficient * (totalWeight);
    
    // Maximum lateral displacement (simplified)
    const maximumDisplacement = baseShear / stiffness;
    
    // Perform structural checks
    const baseResults: CalculationResults = {
        beamResults,
        columnAxialLoads,
        maxBeamDeflection,
        maxBeamStress,
        maxColumnStress,
        allowableDeflection,
        allowableStress
    };
    
    const structuralChecks = performStructuralChecks(baseResults, params);

    // Return enhanced results
    return {
        ...baseResults,
        structuralChecks,
        totalWeight,
        naturalFrequency,
        periodOfVibration,
        maximumDisplacement,
        baseShear,
        buckling: {
            bucklingFactor,
            bucklingModes: [{ factor: bucklingFactor, shape: [1.0] }], // Simplified buckling mode shape
            effectiveLengthFactor: 1.0,
            slendernessRatio: (H / Ns) / Math.sqrt(Icolumn / columnArea)
        },
        dynamicAnalysis
    };
}

// Function to validate input parameters
export function validateParameters(params: BuildingParameters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation rules
    if (params.buildingLength <= 0) errors.push("Building length must be positive");
    if (params.buildingWidth <= 0) errors.push("Building width must be positive");
    if (params.buildingHeight <= 0) errors.push("Building height must be positive");
    if (params.numberOfStoreys <= 0) errors.push("Number of storeys must be positive");
    if (params.columnsAlongLength < 2) errors.push("Must have at least 2 columns along length");
    if (params.columnsAlongWidth < 2) errors.push("Must have at least 2 columns along width");
    if (params.beamWidth <= 0) errors.push("Beam width must be positive");
    if (params.beamHeight <= 0) errors.push("Beam height must be positive");
    if (params.slabThickness <= 0) errors.push("Slab thickness must be positive");
    if (params.slabLoad <= 0) errors.push("Slab load must be positive");
    if (params.elasticModulus <= 0) errors.push("Elastic modulus must be positive");
    if (params.columnWidth <= 0) errors.push("Column width must be positive");
    if (params.columnDepth <= 0) errors.push("Column depth must be positive");
    
    // Additional validation
    const maxLength = 100; // meters
    const maxStoreys = 100;
    
    if (params.buildingLength > maxLength) errors.push(`Building length should not exceed ${maxLength}m`);
    if (params.buildingWidth > maxLength) errors.push(`Building width should not exceed ${maxLength}m`);
    if (params.numberOfStoreys > maxStoreys) errors.push(`Number of storeys should not exceed ${maxStoreys}`);
    
    // Check for reasonable values
    if (params.buildingHeight / params.numberOfStoreys < 2) 
        errors.push("Story height seems too low (< 2m)");
    
    if (params.buildingHeight / params.numberOfStoreys > 6) 
        errors.push("Story height seems too high (> 6m)");
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// Unit conversion
export function convertResults(results: CalculationResults, from: UnitSystem, to: UnitSystem): CalculationResults {
    if (from === to) return results;
    
    // Define conversion factors
    const lengthFactor = from === 'metric' ? 3.28084 : 0.3048; // m to ft or ft to m
    const forceFactor = from === 'metric' ? 0.224809 : 4.44822; // N to lbf or lbf to N
    const stressFactor = from === 'metric' ? 0.000145038 : 6894.76; // Pa to psi or psi to Pa
    
    // Create deep copy to avoid modifying original
    const convertedResults: CalculationResults = {
        ...results,
        maxBeamDeflection: results.maxBeamDeflection * lengthFactor,
        maxBeamStress: results.maxBeamStress * stressFactor,
        maxColumnStress: results.maxColumnStress * stressFactor,
        allowableDeflection: results.allowableDeflection * lengthFactor,
        allowableStress: results.allowableStress * stressFactor,
        beamResults: results.beamResults.map(beam => ({
            ...beam,
            maxDeflection: beam.maxDeflection * lengthFactor,
            maxStress: beam.maxStress * stressFactor,
            reactionLeft: beam.reactionLeft * forceFactor,
            reactionRight: beam.reactionRight * forceFactor,
            momentDiagram: beam.momentDiagram?.map(m => m * forceFactor * lengthFactor),
            shearDiagram: beam.shearDiagram?.map(s => s * forceFactor),
            deflectionCurve: beam.deflectionCurve?.map(d => d * lengthFactor),
        })),
        columnAxialLoads: results.columnAxialLoads.map(load => load * forceFactor),
        totalWeight: results.totalWeight ? results.totalWeight * forceFactor : undefined,
        baseShear: results.baseShear ? results.baseShear * forceFactor : undefined,
        maximumDisplacement: results.maximumDisplacement ? results.maximumDisplacement * lengthFactor : undefined,
        buckling: results.buckling ? {
            bucklingFactor: results.buckling.bucklingFactor, // dimensionless
            bucklingModes: results.buckling.bucklingModes, // Keep as is
            effectiveLengthFactor: results.buckling.effectiveLengthFactor, // dimensionless
            slendernessRatio: results.buckling.slendernessRatio // dimensionless
        } : undefined
    };
    
    return convertedResults;
}