// Using BeamResult interface from types.d.ts

export interface SectionProfile {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  area: number;
  momentOfInertiaX: number;
  momentOfInertiaY?: number;
  description?: string;
  shape?: string;
  sectionModulusX: number;
  sectionModulusY: number;
  plasticModulusX?: number;
  plasticModulusY?: number;
  torsionalConstant?: number;
  shearAreaX?: number;
  shearAreaY?: number;
  flangeThickness?: number;
  webThickness?: number;
  designationCode?: string;
}

export interface Material {
  id?: string;
  name: string;
  displayName: string;
  elasticModulus: number;
  density: number;
  color: string;
  description: string;
  yieldStrength: number;
  ultimateStrength: number;
  poissonRatio: number;
  thermalExpansion: number;
  type: string;
  gradeCode: string;
  beamColor?: number;
  columnColor?: number;
  metalness?: number;
  roughness?: number;
}

export interface StructuralElement {
  id: string;
  type: string;
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
}

// Seismic parameters for earthquake simulation
export interface SeismicParameters {
  intensity: number; // Peak ground acceleration (g)
  frequency: number; // Dominant frequency (Hz)
  duration: number; // Duration of earthquake (seconds)
  direction: 'x' | 'z' | 'both'; // Direction of seismic force
  spectralAcceleration: number; // Design spectral acceleration (g)
  importanceFactor: number; // Building importance factor
  responseModificationFactor: number; // Structural ductility factor
  soilType: 'A' | 'B' | 'C' | 'D' | 'E'; // Site soil classification
  dampingRatio?: number; // Structural damping ratio (default 0.05)
}

// Using CalculationResults interface from types.d.ts

export interface Foundation {
  id: string;
  type: FoundationType;
  width: number;
  length: number;
  depth: number;
  reinforcement?: {
    barSize: number;
    spacing: number;
    layers: number;
  };
  material: {
    concrete: string;
    steel?: string;
  };
  allowableBearingCapacity: number;
  settlement?: {
    immediate: number;
    consolidation: number;
    total: number;
  };
}

export enum FoundationType {
  ISOLATED = 'isolated',
  STRIP = 'strip',
  RAFT = 'raft',
  PILE = 'pile'
}