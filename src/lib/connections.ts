import { Connection, SectionProfile, Material } from './types';

// Interface for bolt properties
interface BoltProperties {
  diameter: number; // mm
  tensileStrength: number; // MPa
  shearStrength: number; // MPa
  bearingStrength: number; // MPa
}

// Standard bolt grades and their properties (mm, MPa)
const boltGrades: Record<string, BoltProperties> = {
  'A307': { 
    diameter: 20, 
    tensileStrength: 400, 
    shearStrength: 240, 
    bearingStrength: 620 
  },
  '8.8': { 
    diameter: 20, 
    tensileStrength: 800, 
    shearStrength: 480, 
    bearingStrength: 900 
  },
  '10.9': { 
    diameter: 20, 
    tensileStrength: 1000, 
    shearStrength: 600, 
    bearingStrength: 1100 
  },
  'A325': { 
    diameter: 22, 
    tensileStrength: 620, 
    shearStrength: 372, 
    bearingStrength: 800 
  },
  'A490': { 
    diameter: 22, 
    tensileStrength: 900, 
    shearStrength: 540, 
    bearingStrength: 1000 
  },
};

// Standard weld types and their properties
interface WeldProperties {
  type: 'Fillet' | 'Butt' | 'PlugSlot';
  strengthFactor: number; // Relative to parent metal
  minSize: number; // mm
  maxSize: number; // mm
}

const weldTypes: Record<string, WeldProperties> = {
  'E70XX': {
    type: 'Fillet',
    strengthFactor: 0.6,
    minSize: 5,
    maxSize: 16
  },
  'E80XX': {
    type: 'Fillet',
    strengthFactor: 0.7,
    minSize: 6,
    maxSize: 20
  },
  'E70XX-Butt': {
    type: 'Butt',
    strengthFactor: 0.9,
    minSize: 3,
    maxSize: 25
  }
};

// Design a beam-to-column moment connection
export function designMomentConnection(
  beam: SectionProfile,
  column: SectionProfile,
  moment: number, // N-m
  shear: number, // N
  beamMaterial: Material,
  boltGrade: string = 'A325'
): Connection {
  // Get bolt properties
  const bolt = boltGrades[boltGrade] || boltGrades['A325'];
  
  // Calculate number of bolts required for moment
  const leverArm = beam.height - (beam.flangeThickness || 0.05);
  const boltTensileForce = (moment / leverArm) / 2; // For two rows of bolts
  const boltTensileCapacity = 0.75 * bolt.tensileStrength * (Math.PI * Math.pow(bolt.diameter / 1000, 2) / 4);
  const numBoltsPerRow = Math.ceil(boltTensileForce / boltTensileCapacity);
  
  // Calculate required plate thickness
  const plateWidth = column.width * 0.9; // Slightly narrower than column flange
  const plateMoment = moment * 1.1; // Add 10% safety factor
  const plateSection = (plateMoment * 6) / (beamMaterial.yieldStrength * plateWidth * plateWidth);
  const plateThickness = Math.sqrt(plateSection);
  
  // Determine if stiffeners are needed
  const needsStiffeners = ((column.flangeThickness || 0.05) < (beam.flangeThickness || 0.05) * 0.75);
  
  // Simplified end plate type based on moment magnitude
  const endPlateType = moment > 200000 ? 'Extended' : moment > 100000 ? 'Flush' : 'Partial';
  
  // Calculate connection capacities
  const momentCapacity = boltTensileCapacity * numBoltsPerRow * 2 * leverArm;
  const shearCapacity = 0.75 * bolt.shearStrength * (Math.PI * Math.pow(bolt.diameter / 1000, 2) / 4) * (numBoltsPerRow * 2);
  
  return {
    type: 'Rigid',
    method: 'Bolted',
    boltGrade,
    boltDiameter: bolt.diameter / 1000, // Convert to meters
    numberOfBolts: numBoltsPerRow * 4, // Typically 2 rows per flange, 2 flanges
    plateThickness,
    endPlateType: endPlateType as 'Flush' | 'Extended' | 'Partial',
    stiffenerDetails: needsStiffeners,
    momentCapacity,
    shearCapacity
  };
}

// Design a beam-to-column shear connection
export function designShearConnection(
  beam: SectionProfile,
  column: SectionProfile,
  shear: number, // N
  beamMaterial: Material,
  boltGrade: string = 'A325',
  connectionType: 'Simple' | 'SemiRigid' = 'Simple'
): Connection {
  // Get bolt properties
  const bolt = boltGrades[boltGrade] || boltGrades['A325'];
  
  // Calculate number of bolts required for shear
  const boltShearCapacity = 0.75 * bolt.shearStrength * (Math.PI * Math.pow(bolt.diameter / 1000, 2) / 4);
  const numBolts = Math.ceil(shear / boltShearCapacity);
  
  // Calculate required angle thickness (for angle connections)
  const angleThickness = Math.max(beam.webThickness || 0.01, 0.01); // At least as thick as web, minimum 10mm
  
  return {
    type: connectionType,
    method: 'Bolted',
    boltGrade,
    boltDiameter: bolt.diameter / 1000, // Convert to meters
    numberOfBolts: numBolts,
    plateThickness: angleThickness,
    stiffenerDetails: false,
    momentCapacity: connectionType === 'Simple' ? 0 : 0.2 * (beam.plasticModulusX || beam.sectionModulusX) * beamMaterial.yieldStrength,
    shearCapacity: boltShearCapacity * numBolts
  };
}

// Design a welded connection
export function designWeldedConnection(
  beam: SectionProfile,
  column: SectionProfile,
  moment: number, // N-m
  shear: number, // N
  beamMaterial: Material,
  weldType: string = 'E70XX',
  connectionType: 'Rigid' | 'SemiRigid' = 'Rigid'
): Connection {
  // Get weld properties
  const weld = weldTypes[weldType] || weldTypes['E70XX'];
  
  // Calculate required weld size (simplified)
  // Based on throat area needed for the force
  const weldStrength = 0.6 * beamMaterial.ultimateStrength * weld.strengthFactor;
  
  // For moment connection, calculate flange weld size
  const flangeThickness = beam.flangeThickness || 0.05;
  const flangeForce = moment / (beam.height - flangeThickness);
  const flangeWeldLength = beam.width * 2; // Top and bottom of flange
  const flangeWeldSize = Math.ceil((flangeForce / (weldStrength * flangeWeldLength)) * 1000); // mm
  
  // For shear connection, calculate web weld size
  const webWeldLength = (beam.height - 2 * flangeThickness) * 2; // Both sides of web
  const webWeldSize = Math.ceil((shear / (weldStrength * webWeldLength)) * 1000); // mm
  
  // Check against min/max weld sizes
  const finalWeldSize = Math.max(
    Math.min(Math.max(flangeWeldSize, webWeldSize), weld.maxSize),
    weld.minSize
  );
  
  // Calculate capacities
  const momentCapacity = weldStrength * finalWeldSize/1000 * flangeWeldLength * (beam.height - flangeThickness);
  const shearCapacity = weldStrength * finalWeldSize/1000 * webWeldLength;
  
  return {
    type: connectionType,
    method: 'Welded',
    weldType: weld.type,
    weldSize: finalWeldSize / 1000, // Convert to meters
    stiffenerDetails: moment > (beamMaterial.yieldStrength * (beam.plasticModulusX || beam.sectionModulusX) * 0.7),
    momentCapacity,
    shearCapacity
  };
}

// Design a column base plate
export function designColumnBasePlate(
  column: SectionProfile,
  axialForce: number, // N (compression)
  moment: number, // N-m
  columnMaterial: Material,
  concreteMaterial: Material,
  anchorBoltGrade: string = 'A307'
): Connection {
  // Get bolt properties for anchor bolts
  const bolt = boltGrades[anchorBoltGrade] || boltGrades['A307'];
  
  // Design parameters
  const bearingStrength = 0.85 * concreteMaterial.yieldStrength; // concrete compressive strength
  
  // Calculate required bearing area
  const requiredArea = Math.max(axialForce / bearingStrength, column.area * 1.5);
  
  // Calculate base plate dimensions
  const basePlateWidth = Math.max(column.width * 1.5, Math.sqrt(requiredArea));
  const basePlateLength = requiredArea / basePlateWidth;
  
  // Calculate plate thickness (simplified)
  // Based on cantilever bending of plate beyond column face
  const cantilever = Math.max((basePlateWidth - column.width) / 2, (basePlateLength - column.height) / 2);
  const plateBendingMoment = bearingStrength * cantilever * cantilever / 2;
  const plateThickness = Math.sqrt((4 * plateBendingMoment) / (0.9 * columnMaterial.yieldStrength));
  
  // Calculate number of anchor bolts needed
  // Simplified: assuming tension from overturning moment
  let numberOfBolts = 4; // Minimum
  if (moment > 0) {
    const tensionForce = moment / basePlateWidth;
    const boltTensileCapacity = 0.75 * bolt.tensileStrength * (Math.PI * Math.pow(bolt.diameter / 1000, 2) / 4);
    numberOfBolts = Math.max(4, Math.ceil(tensionForce / boltTensileCapacity) * 2);
  }
  
  return {
    type: 'Rigid',
    method: 'Bolted',
    boltGrade: anchorBoltGrade,
    boltDiameter: bolt.diameter / 1000, // Convert to meters
    numberOfBolts,
    plateThickness,
    stiffenerDetails: moment > (axialForce * basePlateWidth / 6),
    momentCapacity: axialForce * basePlateWidth / 3 + (numberOfBolts / 2) * 0.75 * bolt.tensileStrength * 
                     (Math.PI * Math.pow(bolt.diameter / 1000, 2) / 4) * basePlateWidth,
    shearCapacity: axialForce * 0.3 // Friction-based shear capacity, simplified
  };
}

// Get all available bolt grades
export function getBoltGrades(): string[] {
  return Object.keys(boltGrades);
}

// Get all available weld types
export function getWeldTypes(): string[] {
  return Object.keys(weldTypes);
}

// Check if a connection design is adequate
export function checkConnectionAdequacy(
  connection: Connection,
  designMoment: number,
  designShear: number
): { adequate: boolean; momentRatio: number; shearRatio: number; issues: string[] } {
  const issues: string[] = [];
  
  // Calculate utilization ratios
  const momentRatio = connection.momentCapacity ? designMoment / connection.momentCapacity : 0;
  const shearRatio = connection.shearCapacity ? designShear / connection.shearCapacity : 0;
  
  // Check moment capacity
  if (connection.type !== 'Simple' && momentRatio > 0.95) {
    issues.push(`Moment utilization (${(momentRatio * 100).toFixed(1)}%) exceeds 95% of capacity`);
  }
  
  // Check shear capacity
  if (shearRatio > 0.95) {
    issues.push(`Shear utilization (${(shearRatio * 100).toFixed(1)}%) exceeds 95% of capacity`);
  }
  
  // Check for simple connections with moment
  if (connection.type === 'Simple' && connection.shearCapacity && designMoment > 0.05 * connection.shearCapacity) {
    issues.push('Simple connection has significant moment demand');
  }
  
  // Overall adequacy check
  const adequate = momentRatio <= 1.0 && shearRatio <= 1.0 && issues.length < 2;
  
  return {
    adequate,
    momentRatio,
    shearRatio,
    issues
  };
} 