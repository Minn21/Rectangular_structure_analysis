import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Re-export OrbitControls type
export type OrbitControls = ThreeOrbitControls;

// Unit system types
export type UnitSystem = 'metric' | 'imperial';

export interface UnitConversions {
  length: number;
  force: number;
  stress: number;
}

// Project management
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  parameters: BuildingParameters;
  results?: CalculationResults;
}

// Building parameters with unit system
export interface BuildingParameters {
  buildingLength: number;
  buildingWidth: number; 
  buildingHeight: number;
  numberOfStoreys: number;
  columnsAlongLength: number;
  columnsAlongWidth: number;
  beamsAlongLength: number;
  beamsAlongWidth: number;
  slabThickness: number;
  slabLoad: number;
  beamWidth: number;
  beamHeight: number;
  elasticModulus: number;
  columnWidth: number;
  columnDepth: number;
  materialName: string;
  beamSection: string;
  columnSection: string;
  unitSystem?: UnitSystem;
}

// Enhanced beam results with moment and shear diagrams
export interface BeamResult {
  maxDeflection: number;
  maxStress: number;
  reactionLeft: number;
  reactionRight: number;
  momentDiagram?: number[];
  shearDiagram?: number[];
  deflectionCurve?: number[];
  utilizationRatio?: number;
}

// Additional structural checks
export interface StructuralChecks {
  deflectionCheck: boolean;
  stressCheck: boolean;
  buckling?: boolean;
  shearCapacity?: boolean;
}

// Enhanced calculation results
export interface CalculationResults {
  maxBeamDeflection: number;
  maxBeamStress: number;
  maxColumnStress: number;
  beamResults: BeamResult[];
  columnAxialLoads: number[];
  // New fields for enhanced analysis
  structuralChecks?: StructuralChecks;
  totalWeight?: number;
  naturalFrequency?: number;
  periodOfVibration?: number;
  maximumDisplacement?: number;
  baseShear?: number;
  buckling?: {
    criticalLoad: number;
    bucklingFactor: number;
  };
  dynamicAnalysis?: {
    modalShapes: number[][];
    frequencies: number[];
    participationFactors: number[];
  };
}

// Loading and progress tracking
export interface ProgressState {
  isLoading: boolean;
  progress: number;
  stage: string;
  error?: string;
}

// Error handling
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  min?: number;
  max?: number;
} 