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