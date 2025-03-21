import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Re-export OrbitControls type
export type OrbitControls = ThreeOrbitControls;

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
}

export interface BeamResult {
  maxDeflection: number;
  maxStress: number;
  reactionLeft: number;
  reactionRight: number;
}

export interface CalculationResults {
  maxBeamDeflection: number;
  maxBeamStress: number;
  maxColumnStress: number;
  beamResults: BeamResult[];
  columnAxialLoads: number[];
} 