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
    materialName?: string;
    beamSection?: string;
    columnSection?: string;
  }
  
  export interface Material {
    name: string;
    displayName: string;
    elasticModulus: number;
    density: number;
    color: string;
    description: string;
  }
  
  export interface BeamResults {
    maxDeflection: number;
    maxStress: number;
    reactionLeft: number;
    reactionRight: number;
  }
  
  export interface CalculationResults {
    beamResults: BeamResults[];
    columnAxialLoads: number[];
    maxBeamDeflection: number;
    maxBeamStress: number;
    maxColumnStress: number;
  }

  export interface SectionProfile {
    id: string;
    name: string;
    type: 'beam' | 'column';
    width: number;
    height: number;
    area: number;
    momentOfInertiaX: number;
    momentOfInertiaY: number;
    description?: string;
  }