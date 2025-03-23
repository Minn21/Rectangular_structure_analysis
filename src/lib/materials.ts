import { Material } from './types';

const materials: Material[] = [
  {
    name: 'steel',
    displayName: 'Steel (S355)',
    description: 'Structural steel, high strength and ductility',
    elasticModulus: 2.1e11, // Pa
    density: 7850, // kg/m³
    color: '#607080',
    beamColor: 0x607080,
    columnColor: 0x505060,
    metalness: 0.6,
    roughness: 0.4,
    yieldStrength: 355e6, // Pa (S355 steel)
    ultimateStrength: 470e6, // Pa
    poissonRatio: 0.3,
    thermalExpansion: 1.2e-5, // per °C
    type: 'Steel',
    gradeCode: 'S355'
  },
  {
    name: 'steel-s275',
    displayName: 'Steel (S275)',
    description: 'Common structural steel for general construction',
    elasticModulus: 2.1e11,
    density: 7850,
    color: '#6b7b8b',
    beamColor: 0x6b7b8b,
    columnColor: 0x5b6b7b,
    metalness: 0.6,
    roughness: 0.4,
    yieldStrength: 275e6, // Pa
    ultimateStrength: 430e6, // Pa
    poissonRatio: 0.3,
    thermalExpansion: 1.2e-5,
    type: 'Steel',
    gradeCode: 'S275'
  },
  {
    name: 'steel-s235',
    displayName: 'Steel (S235)',
    description: 'Lower strength structural steel',
    elasticModulus: 2.1e11,
    density: 7850,
    color: '#768696',
    beamColor: 0x768696,
    columnColor: 0x667686,
    metalness: 0.6,
    roughness: 0.4,
    yieldStrength: 235e6, // Pa
    ultimateStrength: 360e6, // Pa
    poissonRatio: 0.3,
    thermalExpansion: 1.2e-5,
    type: 'Steel',
    gradeCode: 'S235'
  },
  {
    name: 'concrete-c30',
    displayName: 'Concrete (C30/37)',
    description: 'Standard structural concrete',
    elasticModulus: 3.3e10,
    density: 2400,
    color: '#b0b0b0',
    beamColor: 0xb0b0b0,
    columnColor: 0x909090,
    metalness: 0.1,
    roughness: 0.7,
    yieldStrength: 30e6, // Compressive strength in Pa
    ultimateStrength: 37e6, // Pa
    poissonRatio: 0.2,
    thermalExpansion: 1.0e-5,
    type: 'Concrete',
    gradeCode: 'C30/37'
  },
  {
    name: 'concrete-c40',
    displayName: 'Concrete (C40/50)',
    description: 'High-strength structural concrete',
    elasticModulus: 3.5e10,
    density: 2500,
    color: '#a6a6a6',
    beamColor: 0xa6a6a6,
    columnColor: 0x868686,
    metalness: 0.1,
    roughness: 0.7,
    yieldStrength: 40e6, // Pa
    ultimateStrength: 50e6, // Pa
    poissonRatio: 0.2,
    thermalExpansion: 1.0e-5,
    type: 'Concrete',
    gradeCode: 'C40/50'
  },
  {
    name: 'aluminum-6061',
    displayName: 'Aluminum (6061-T6)',
    description: 'Common structural aluminum alloy',
    elasticModulus: 6.9e10,
    density: 2700,
    color: '#e0e0e8',
    beamColor: 0xe0e0e8,
    columnColor: 0xd0d0d8,
    metalness: 0.8,
    roughness: 0.2,
    yieldStrength: 240e6, // Pa
    ultimateStrength: 290e6, // Pa
    poissonRatio: 0.33,
    thermalExpansion: 2.3e-5,
    type: 'Aluminum',
    gradeCode: '6061-T6'
  },
  {
    name: 'aluminum-7075',
    displayName: 'Aluminum (7075-T6)',
    description: 'High-strength aerospace aluminum alloy',
    elasticModulus: 7.1e10,
    density: 2810,
    color: '#d8d8e0',
    beamColor: 0xd8d8e0,
    columnColor: 0xc8c8d0,
    metalness: 0.8,
    roughness: 0.2,
    yieldStrength: 503e6, // Pa
    ultimateStrength: 572e6, // Pa
    poissonRatio: 0.33,
    thermalExpansion: 2.3e-5,
    type: 'Aluminum',
    gradeCode: '7075-T6'
  },
  {
    name: 'timber-glulam',
    displayName: 'Glulam Timber',
    description: 'Engineered glued laminated timber',
    elasticModulus: 1.3e10,
    density: 500,
    color: '#c09060',
    beamColor: 0xc09060,
    columnColor: 0xb08050,
    metalness: 0.0,
    roughness: 0.8,
    yieldStrength: 24e6, // Parallel to grain, Pa
    ultimateStrength: 30e6, // Pa
    poissonRatio: 0.25,
    thermalExpansion: 5.0e-6,
    type: 'Timber',
    gradeCode: 'GL24h'
  },
  {
    name: 'timber-clf',
    displayName: 'Cross Laminated Timber',
    description: 'Modern engineered wood product',
    elasticModulus: 1.2e10,
    density: 480,
    color: '#c8a070',
    beamColor: 0xc8a070,
    columnColor: 0xb89060,
    metalness: 0.0,
    roughness: 0.8,
    yieldStrength: 20e6, // Pa
    ultimateStrength: 26e6, // Pa
    poissonRatio: 0.3, // More balanced due to cross-lamination
    thermalExpansion: 4.5e-6,
    type: 'Timber',
    gradeCode: 'CLT90'
  },
  {
    name: 'composite-frp',
    displayName: 'Fiber Reinforced Polymer',
    description: 'Carbon fiber reinforced composite',
    elasticModulus: 1.5e11,
    density: 1600,
    color: '#303030',
    beamColor: 0x303030,
    columnColor: 0x202020,
    metalness: 0.4,
    roughness: 0.3,
    yieldStrength: 600e6, // Pa
    ultimateStrength: 900e6, // Pa
    poissonRatio: 0.3,
    thermalExpansion: 0.8e-6,
    type: 'Composite',
    gradeCode: 'CFRP'
  }
];

export function getMaterial(name: string): Material {
  const material = materials.find(m => m.name === name);
  return material || materials[0];
}

export function getMaterialNames(): string[] {
  return materials.map(m => m.name);
}

export function getMaterialsByType(type: string): Material[] {
  return materials.filter(m => m.type === type);
}

export function getAllMaterials(): Material[] {
  return [...materials];
} 