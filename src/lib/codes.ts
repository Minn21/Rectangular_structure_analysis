// Define types here since they were previously imported
export type DesignCode = 'ASCE7-16' | 'Eurocode';
export type LoadCombinationType = 'LRFD' | 'ASD';

export interface WindLoad {
  basicWindSpeed: number;
  velocityPressure: number;
  windwardPressure: number;
  leewardPressure: number;
  designWindPressure: number;
  baseShear: number;
}

export interface Location {
  windZone: number;
  terrain: string;
  importance: number;
}

export interface Loads {
  dead: number;
  live: number;
  wind?: WindLoad;
  snow?: number;
}

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
];

// Combined array of all load combinations
export const allLoadCombinations: LoadCombination[] = [
  ...asce7_16_lrfd,
  ...asce7_16_asd,
  ...eurocode_uls,
];

// Wind load calculation per ASCE 7-16
export function calculateWindLoad(location: Location, buildingHeight: number, buildingWidth: number): WindLoad {
  // Basic wind speed based on location (mph)
  // Simplified - in reality would be from wind speed maps
  const basicWindSpeed = 115 + (location.windZone * 10); // Base of 115 mph + adjustment for zone
  
  // Simplified exposure category factor based on terrain
  let exposureCategoryFactor = 1.0; // Default for Exposure B (Urban/suburban areas)
  if (location.terrain === 'open') {
    exposureCategoryFactor = 1.2; // Exposure C (Open terrain)
  } else if (location.terrain === 'flat') {
    exposureCategoryFactor = 1.4; // Exposure D (Flat, unobstructed areas)
  }
  
  // Importance factor based on building occupancy/risk category
  const importanceFactor = 1.0 + (0.1 * location.importance); // 1.0 - 1.4 range
  
  // Simplified topographic factor
  const topographicFactor = 1.0; // Assuming no special topographic effects
  
  // Simplified gust factor
  const gustFactor = 0.85;
  
  // Direction factor (simplified)
  const directionFactor = 0.85;
  
  // Convert wind speed to pressure (simplified)
  // Pressure = 0.00256 * V^2 * Kz * Kzt * Kd * Kz
  // Where V is wind speed in mph
  const velocityPressure = 0.00256 * Math.pow(basicWindSpeed, 2) * 
                           exposureCategoryFactor * topographicFactor * 
                           directionFactor * importanceFactor;
  
  // Simplified pressure coefficients
  const windwardCoefficient = 0.8;
  const leewardCoefficient = -0.5;
  
  // Calculate design wind pressures
  const windwardPressure = velocityPressure * windwardCoefficient;
  const leewardPressure = velocityPressure * leewardCoefficient;
  
  // Calculate base shear (simplified)
  // Total wind load = pressure * area
  const buildingArea = buildingHeight * buildingWidth;
  const totalWindLoad = (windwardPressure - leewardPressure) * buildingArea;
  
  return {
    basicWindSpeed,
    velocityPressure,
    windwardPressure,
    leewardPressure, 
    designWindPressure: windwardPressure - leewardPressure,
    baseShear: totalWindLoad
  };
}

// Apply a load combination to get total load
export function applyLoadCombination(loads: Loads, combination: LoadCombination): number {
  let totalLoad = 0;
  
  // Apply dead load
  if (combination.factors.dead) {
    totalLoad += loads.dead * combination.factors.dead;
  }
  
  // Apply live load
  if (combination.factors.live) {
    totalLoad += loads.live * combination.factors.live;
  }
  
  // Apply wind load if applicable
  if (combination.factors.wind && loads.wind) {
    totalLoad += loads.wind.baseShear * combination.factors.wind;
  }
  
  // Apply snow load if applicable
  if (combination.factors.snow && loads.snow) {
    totalLoad += loads.snow * combination.factors.snow;
  }
  
  return totalLoad;
}

// Get load combinations for a specific code and type
export function getLoadCombinations(code: DesignCode, type: LoadCombinationType): LoadCombination[] {
  return allLoadCombinations.filter(combo => combo.code === code && combo.type === type);
}

// Get design defaults based on code
export function getDesignDefaults(code: DesignCode): {
  allowableDeflectionRatio: number;
  allowableStressRatio: number;
} {
  switch (code) {
    case 'ASCE7-16':
      return {
        allowableDeflectionRatio: 360, // L/360 for live load
        allowableStressRatio: 0.6, // 0.6Fy for ASD
      };
    case 'Eurocode':
      return {
        allowableDeflectionRatio: 250, // L/250 for variable actions
        allowableStressRatio: 0.7, // Typical allowable stress ratio
      };
    default:
      return {
        allowableDeflectionRatio: 360,
        allowableStressRatio: 0.6,
      };
  }
}

// Verify design against code requirements
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
  
  // Calculate actual deflection ratio (span/deflection)
  const actualDeflectionRatio = spanLength / maxDeflection;
  const deflectionCheck = actualDeflectionRatio >= defaults.allowableDeflectionRatio;
  
  // Calculate stress ratio (actual/allowable)
  const stressRatio = maxStress / (yieldStress * defaults.allowableStressRatio);
  const stressCheck = stressRatio <= 1.0;
  
  return {
    deflectionCheck,
    stressCheck,
    deflectionRatio: actualDeflectionRatio,
    stressRatio
  };
} 