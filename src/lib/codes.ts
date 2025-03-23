import { DesignCode, LoadCombinationType, SeismicLoad, WindLoad, Loads, Location } from './types';

// Interface for load combinations
export interface LoadCombination {
  name: string;
  description: string;
  formula: string;
  factors: {
    dead: number;
    live: number;
    snow?: number;
    wind?: number;
    seismic?: number;
    rain?: number;
    thermal?: number;
  };
  code: DesignCode;
  type: LoadCombinationType;
}

// ASCE 7-16 Load Combinations (LRFD)
export const asce7_16_lrfd: LoadCombination[] = [
  {
    name: 'ASCE 7-16 LRFD 1',
    description: 'Dead load only',
    formula: '1.4D',
    factors: {
      dead: 1.4,
      live: 0,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 2',
    description: 'Dead + Live',
    formula: '1.2D + 1.6L',
    factors: {
      dead: 1.2,
      live: 1.6,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 3',
    description: 'Dead + Live + Snow',
    formula: '1.2D + 1.6L + 0.5S',
    factors: {
      dead: 1.2,
      live: 1.6,
      snow: 0.5,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 4',
    description: 'Dead + Snow + Live',
    formula: '1.2D + 1.0S + 1.0L',
    factors: {
      dead: 1.2,
      live: 1.0,
      snow: 1.0,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 5',
    description: 'Dead + Wind + Live + Snow',
    formula: '1.2D + 1.0W + 1.0L + 0.5S',
    factors: {
      dead: 1.2,
      live: 1.0,
      wind: 1.0,
      snow: 0.5,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 6',
    description: 'Dead + Seismic + Live',
    formula: '1.2D + 1.0E + 1.0L',
    factors: {
      dead: 1.2,
      live: 1.0,
      seismic: 1.0,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 7',
    description: 'Dead + Wind (uplift)',
    formula: '0.9D + 1.0W',
    factors: {
      dead: 0.9,
      live: 0,
      wind: 1.0,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
  {
    name: 'ASCE 7-16 LRFD 8',
    description: 'Dead + Seismic (uplift)',
    formula: '0.9D + 1.0E',
    factors: {
      dead: 0.9,
      live: 0,
      seismic: 1.0,
    },
    code: 'ASCE7-16',
    type: 'LRFD',
  },
];

// ASCE 7-16 Load Combinations (ASD)
export const asce7_16_asd: LoadCombination[] = [
  {
    name: 'ASCE 7-16 ASD 1',
    description: 'Dead + Live',
    formula: 'D + L',
    factors: {
      dead: 1.0,
      live: 1.0,
    },
    code: 'ASCE7-16',
    type: 'ASD',
  },
  {
    name: 'ASCE 7-16 ASD 2',
    description: 'Dead + Live + Snow',
    formula: 'D + L + S',
    factors: {
      dead: 1.0,
      live: 1.0,
      snow: 1.0,
    },
    code: 'ASCE7-16',
    type: 'ASD',
  },
  {
    name: 'ASCE 7-16 ASD 3',
    description: 'Dead + Wind + Live + Snow',
    formula: 'D + 0.75(W + L + S)',
    factors: {
      dead: 1.0,
      live: 0.75,
      wind: 0.75,
      snow: 0.75,
    },
    code: 'ASCE7-16',
    type: 'ASD',
  },
  {
    name: 'ASCE 7-16 ASD 4',
    description: 'Dead + Seismic + Live + Snow',
    formula: 'D + 0.7E + L + 0.75S',
    factors: {
      dead: 1.0,
      live: 1.0,
      seismic: 0.7,
      snow: 0.75,
    },
    code: 'ASCE7-16',
    type: 'ASD',
  },
  {
    name: 'ASCE 7-16 ASD 5',
    description: 'Dead + Wind (uplift)',
    formula: '0.6D + 0.75W',
    factors: {
      dead: 0.6,
      live: 0,
      wind: 0.75,
    },
    code: 'ASCE7-16',
    type: 'ASD',
  },
  {
    name: 'ASCE 7-16 ASD 6',
    description: 'Dead + Seismic (uplift)',
    formula: '0.6D + 0.7E',
    factors: {
      dead: 0.6,
      live: 0,
      seismic: 0.7,
    },
    code: 'ASCE7-16',
    type: 'ASD',
  },
];

// Eurocode Load Combinations (Ultimate Limit State)
export const eurocode_uls: LoadCombination[] = [
  {
    name: 'Eurocode ULS 1',
    description: 'Dead + Live',
    formula: '1.35G + 1.5Q',
    factors: {
      dead: 1.35,
      live: 1.5,
    },
    code: 'Eurocode',
    type: 'LRFD',
  },
  {
    name: 'Eurocode ULS 2',
    description: 'Dead + Live + Wind',
    formula: '1.35G + 1.5Q + 0.9W',
    factors: {
      dead: 1.35,
      live: 1.5,
      wind: 0.9,
    },
    code: 'Eurocode',
    type: 'LRFD',
  },
  {
    name: 'Eurocode ULS 3',
    description: 'Dead + Wind + Live',
    formula: '1.35G + 1.5W + 1.05Q',
    factors: {
      dead: 1.35,
      live: 1.05,
      wind: 1.5,
    },
    code: 'Eurocode',
    type: 'LRFD',
  },
  {
    name: 'Eurocode ULS 4',
    description: 'Dead + Seismic',
    formula: 'G + E',
    factors: {
      dead: 1.0,
      live: 0.3,
      seismic: 1.0,
    },
    code: 'Eurocode',
    type: 'LRFD',
  },
];

// Combined array of all load combinations
export const allLoadCombinations: LoadCombination[] = [
  ...asce7_16_lrfd,
  ...asce7_16_asd,
  ...eurocode_uls,
];

// Wind load calculation per ASCE 7-16
export function calculateWindLoad(location: Location, buildingHeight: number, buildingWidth: number): WindLoad {
  // Basic wind speed from location
  const V = location.basicWindSpeed; // m/s
  
  // Exposure category from location
  const exposureCategory = location.terrainCategory > 3 ? 'D' : location.terrainCategory > 1 ? 'C' : 'B';
  
  // Wind directionality factor
  const Kd = 0.85; // Typical for buildings
  
  // Topographic factor (simplified)
  const Kzt = 1.0;
  
  // Importance factor based on building category
  const I = location.importanceCategory === 'I' ? 0.87 : 
            location.importanceCategory === 'II' ? 1.0 : 
            location.importanceCategory === 'III' ? 1.15 : 1.2;
  
  // Velocity pressure exposure coefficient at height z
  // Note: This is a simplified calculation
  const z = buildingHeight;
  let Kz = 0;
  
  if (exposureCategory === 'B') {
    if (z < 4.6) Kz = 0.57;
    else Kz = 0.62 * Math.pow(z / 10, 0.25);
  } else if (exposureCategory === 'C') {
    if (z < 4.6) Kz = 0.85;
    else Kz = 0.9 * Math.pow(z / 10, 0.2);
  } else {
    if (z < 4.6) Kz = 1.03;
    else Kz = 1.1 * Math.pow(z / 10, 0.15);
  }
  
  // Velocity pressure (SI units: N/m²)
  const qz = 0.613 * Kz * Kzt * Kd * V * V * I;
  
  // Simplified pressure coefficients
  const Cp_windward = 0.8;  // Windward face
  const Cp_leeward = -0.5; // Leeward face
  const Cp_sideWall = -0.7; // Side walls
  const Cp_roof = -0.7;    // Roof (simplified)
  
  // Gust effect factor (simplified)
  const G = 0.85;
  
  // Wall pressures
  const p_windward = qz * G * Cp_windward;
  const p_leeward = qz * G * Cp_leeward;
  const p_sideWall = qz * G * Cp_sideWall;
  const p_roof = qz * G * Cp_roof;
  
  // Return complete wind load data
  return {
    basicSpeed: V,
    direction: 0, // Assumed along x-axis
    exposureCategory,
    gustFactor: G,
    pressureCoefficients: {
      windward: Cp_windward,
      leeward: Cp_leeward,
      sideWall: Cp_sideWall,
      roof: Cp_roof,
    },
    // Additional calculated data for use in calculations
    velocityPressure: qz,
    pressures: {
      windward: p_windward,
      leeward: p_leeward,
      sideWall: p_sideWall,
      roof: p_roof,
    },
    totalForce: (p_windward - p_leeward) * buildingHeight * buildingWidth, // Force in N
  };
}

// Seismic load calculation per ASCE 7-16
export function calculateSeismicLoad(location: Location, buildingHeight: number, totalWeight: number): SeismicLoad {
  // Site class from location
  const siteClass = location.siteClass;
  
  // Importance factor based on building category
  const I = location.importanceCategory === 'I' ? 1.0 : 
            location.importanceCategory === 'II' ? 1.0 : 
            location.importanceCategory === 'III' ? 1.25 : 1.5;
  
  // Response modification factor (R) - assumed typical value for moment frame
  const R = 8.0;
  
  // Spectral response acceleration parameters
  // These would normally come from hazard maps or online tools based on location
  // Using simplified placeholders based on seismic zone
  const Ss = 0.2 * location.seismicZone; // Short period spectral acceleration
  const S1 = 0.1 * location.seismicZone; // 1-second period spectral acceleration
  
  // Site coefficients
  let Fa = 1.0;
  let Fv = 1.0;
  
  // Simplified site coefficients based on site class
  if (siteClass === 'A') {
    Fa = 0.8;
    Fv = 0.8;
  } else if (siteClass === 'B') {
    Fa = 1.0;
    Fv = 1.0;
  } else if (siteClass === 'C') {
    Fa = 1.2;
    Fv = 1.7;
  } else if (siteClass === 'D') {
    Fa = 1.6;
    Fv = 2.4;
  } else {
    Fa = 2.5;
    Fv = 3.5;
  }
  
  // Design spectral acceleration parameters
  const SMS = Fa * Ss;
  const SM1 = Fv * S1;
  const SDS = (2/3) * SMS;
  const SD1 = (2/3) * SM1;
  
  // Approximate fundamental period of the structure
  const Ct = 0.028; // Steel moment frame (in meters)
  const x = 0.8;
  const Ta = Ct * Math.pow(buildingHeight, x);
  
  // Design base shear
  const Cs = Math.min(SDS / (R/I), SD1 / (Ta * (R/I)));
  const V = Cs * totalWeight; // Base shear in N
  
  return {
    sds: SDS,
    sd1: SD1,
    importanceFactor: I,
    responseModificationFactor: R,
    siteClass: siteClass,
    // Additional calculated data for use in calculations
    approximatePeriod: Ta,
    baseShear: V,
    seismicResponseCoefficient: Cs,
  };
}

// Apply load combination to loads
export function applyLoadCombination(loads: Loads, combination: LoadCombination): number {
  let totalLoad = 0;
  
  totalLoad += loads.dead * combination.factors.dead;
  totalLoad += loads.live * combination.factors.live;
  
  if (combination.factors.snow && loads.snow) {
    totalLoad += loads.snow * combination.factors.snow;
  }
  
  if (combination.factors.wind && loads.wind) {
    // Simplified approach for wind
    totalLoad += loads.wind.basicSpeed * combination.factors.wind;
  }
  
  if (combination.factors.seismic && loads.seismic) {
    // Simplified approach for seismic
    totalLoad += loads.seismic.sds * combination.factors.seismic;
  }
  
  return totalLoad;
}

// Get load combinations for a specified code and type
export function getLoadCombinations(code: DesignCode, type: LoadCombinationType): LoadCombination[] {
  return allLoadCombinations.filter(comb => comb.code === code && comb.type === type);
}

// Get design default values by code
export function getDesignDefaults(code: DesignCode): {
  allowableDeflectionRatio: number;
  allowableStressRatio: number;
} {
  switch (code) {
    case 'ASCE7-16':
    case 'ASCE7-22':
      return {
        allowableDeflectionRatio: 360, // L/360 for typical live load only
        allowableStressRatio: 0.6, // Typical for ASD
      };
    case 'Eurocode':
      return {
        allowableDeflectionRatio: 300, // L/300 is common in Eurocode
        allowableStressRatio: 0.66, // Simplified for comparison
      };
    default:
      return {
        allowableDeflectionRatio: 360,
        allowableStressRatio: 0.6,
      };
  }
}

// Verify design according to code
export function verifyDesign(
  code: DesignCode, 
  spanLength: number, 
  maxDeflection: number, 
  maxStress: number, 
  yieldStress: number
): { 
  deflectionCheck: boolean; 
  stressCheck: boolean;
  deflectionRatio: number;
  stressRatio: number;
} {
  const defaults = getDesignDefaults(code);
  
  const allowableDeflection = spanLength / defaults.allowableDeflectionRatio;
  const allowableStress = yieldStress * defaults.allowableStressRatio;
  
  const deflectionCheck = maxDeflection <= allowableDeflection;
  const stressCheck = maxStress <= allowableStress;
  const deflectionRatio = maxDeflection / allowableDeflection;
  const stressRatio = maxStress / allowableStress;
  
  return {
    deflectionCheck,
    stressCheck,
    deflectionRatio,
    stressRatio,
  };
} 