// Design codes
export type DesignCode = 'ASCE7-16' | 'ASCE7-22' | 'Eurocode' | 'IS456' | 'BS5950' | 'NBCC2015' | 'AS4100' | 'Other';

// Connection types
export type ConnectionType = 'Simple' | 'SemiRigid' | 'Rigid' | 'Custom';

// Foundation types
export type FoundationType = 'SpreadFooting' | 'StripFooting' | 'MatFoundation' | 'PileFoundation' | 'None';

// Joint rigidity
export type JointRigidity = 'Pinned' | 'Fixed' | 'SemiRigid';

// Analysis types
export type AnalysisType = 'LinearStatic' | 'PDelta' | 'ModalDynamic' | 'TimeHistory' | 'Buckling' | 'NonLinear';

// Load combination types
export type LoadCombinationType = 'LRFD' | 'ASD' | 'Eurocode' | 'Custom';

// Analysis results for visualization
export interface AnalysisResults {
  displacements: { x: number; y: number; z: number }[];
  modalShapes?: {
    displacements: { x: number; y: number; z: number }[];
  }[];
}

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
    designCode?: DesignCode;
    projectLocation?: Location;
    connectionType?: ConnectionType;
    foundationType?: FoundationType;
    jointRigidity?: JointRigidity;
    analysisType?: AnalysisType;
    loadCombinationType?: LoadCombinationType;
  }
  
  export interface Material {
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
    type: 'Steel' | 'Concrete' | 'Timber' | 'Aluminum' | 'Composite' | 'Other';
    gradeCode?: string;
    customProperties?: Record<string, number | string>;
    // Three.js specific properties
    beamColor?: number;
    columnColor?: number;
    metalness?: number;
    roughness?: number;
  }
  
  export interface BeamResults {
    maxDeflection: number;
    maxStress: number;
    reactionLeft: number;
    reactionRight: number;
    utilizationRatio?: number;
    momentDiagram?: number[];
    shearDiagram?: number[];
    deflectionCurve?: number[];
    interactionRatio?: number;
    bendingUtilization?: number;
    shearUtilization?: number;
  }
  
  export interface StructuralChecks {
    deflectionCheck: boolean;
    stressCheck: boolean;
    buckling: boolean;
    shearCapacity: boolean;
    combinedStressCheck?: boolean;
    connectionDesignCheck?: boolean;
    slendernessRatioCheck?: boolean;
    lateralTorsionalBucklingCheck?: boolean;
    webCripplingCheck?: boolean;
    codeCompliance?: Record<string, boolean>;
  }

  export interface DynamicAnalysis {
    frequencies: number[];
    participationFactors: number[];
    modalShapes?: number[][];
    dampingRatios?: number[];
    spectralAccelerations?: number[];
    responseSpectrumCurve?: {period: number, acceleration: number}[];
  }

  export interface BucklingResult {
    bucklingFactor: number;
    bucklingModes?: {factor: number, shape: number[]}[];
    effectiveLengthFactor?: number;
    slendernessRatio?: number;
  }
  
  export interface CalculationResults {
    beamResults: BeamResults[];
    columnAxialLoads: number[];
    maxBeamDeflection: number;
    maxBeamStress: number;
    maxColumnStress: number;
    allowableDeflection: number;
    allowableStress: number;
    totalWeight?: number;
    naturalFrequency?: number;
    periodOfVibration?: number;
    maximumDisplacement?: number;
    baseShear?: number;
    structuralChecks?: StructuralChecks;
    dynamicAnalysis?: DynamicAnalysis;
    buckling?: BucklingResult;
    connectionDesigns?: Record<string, Connection>;
    foundationDesigns?: Record<string, Foundation>;
    materialQuantities?: Record<string, number>;
    costEstimate?: {materials: number, labor: number, total: number};
    constructionSequence?: {stage: string, displacement: number}[];
    optimizationResults?: {initialWeight: number, optimizedWeight: number, savings: number};
    codeCompliance?: {code: string, compliant: boolean, issues?: string[]};
    PDeltaEffects?: {storyDrifts: number[], stabilityCoefficients: number[]};
    progressiveCollapseAnalysis?: {dcr: number, alternatePath: boolean};
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
    shape: 'WShape' | 'CShape' | 'LShape' | 'TShape' | 'Rectangular' | 'Circular' | 'Custom';
    sectionModulusX: number;
    sectionModulusY: number;
    plasticModulusX?: number;
    plasticModulusY?: number;
    torsionalConstant: number;
    warpingConstant?: number;
    shearAreaX: number;
    shearAreaY: number;
    flangeThickness?: number;
    webThickness?: number;
    designationCode?: string;
  }

  export interface Connection {
    type: ConnectionType;
    method: 'Welded' | 'Bolted' | 'RivetedBolts' | 'Custom';
    boltGrade?: string;
    boltDiameter?: number;
    numberOfBolts?: number;
    weldType?: 'Fillet' | 'Butt' | 'PlugSlot';
    weldSize?: number;
    plateThickness?: number;
    endPlateType?: 'Flush' | 'Extended' | 'Partial';
    stiffenerDetails?: boolean;
    momentCapacity?: number;
    shearCapacity?: number;
  }

  export interface Foundation {
    type: FoundationType;
    dimensions: {length: number, width: number, depth: number};
    material: 'Concrete' | 'Masonry' | 'Other';
    reinforcementDetails?: string;
    soilBearingCapacity: number;
    depthBelowGrade: number;
    materialGrade?: {
      concrete: string;
      steel: string;
    };
    soilCapacity?: number;
    designLoad?: number;
  }

  export interface Loads {
    dead: number;
    live: number;
    snow?: number;
    wind?: WindLoad;
    seismic?: SeismicLoad;
    thermal?: number;
    concentrated?: ConcentratedLoad[];
    custom?: CustomLoad[];
  }

  export interface WindLoad {
    basicSpeed: number; // m/s
    direction: number; // degrees
    exposureCategory: 'B' | 'C' | 'D';
    gustFactor: number;
    pressureCoefficients: Record<string, number>;
    // Additional properties for calculations
    velocityPressure?: number;
    pressures?: Record<string, number>;
    totalForce?: number;
  }

  export interface SeismicLoad {
    sds: number; // Design spectral response acceleration parameter
    sd1: number; // Design spectral response acceleration parameter
    importanceFactor: number;
    responseModificationFactor: number;
    siteClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    // Additional properties for calculations
    approximatePeriod?: number;
    baseShear?: number;
    seismicResponseCoefficient?: number;
  }

  export interface ConcentratedLoad {
    magnitude: number;
    position: {x: number, y: number, z: number};
    direction: {x: number, y: number, z: number};
  }

  export interface CustomLoad {
    name: string;
    loadFunction: (x: number, y: number, z: number) => number;
    description: string;
  }

  export interface ProjectSettings {
    name: string;
    description?: string;
    client?: string;
    engineer?: string;
    date: Date;
    units: 'Metric' | 'Imperial';
    designCode: DesignCode;
    projectPhase: 'Conceptual' | 'Schematic' | 'DetailedDesign' | 'Construction' | 'AsBuilt';
    revisionNumber?: string;
    notes?: string;
  }

  export type UnitSystem = 'metric' | 'imperial';

  // Location for wind and seismic data
  export interface Location {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
    basicWindSpeed: number; // m/s
    seismicZone: number;
    importanceCategory: 'I' | 'II' | 'III' | 'IV';
    siteClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    terrainCategory: number;
  }