import { Material } from './types';

export const materials: Record<string, Material> = {
  steel: {
    name: 'steel',
    displayName: 'Structural Steel',
    elasticModulus: 2.1e11, // Pa
    density: 7850, // kg/m³
    color: '#8a8a8a',
    description: 'High-strength alloy commonly used in structural frameworks',
  },
  concrete: {
    name: 'concrete',
    displayName: 'Reinforced Concrete',
    elasticModulus: 3.0e10, // Pa
    density: 2400, // kg/m³
    color: '#adadad',
    description: 'Composite material with high compressive strength',
  },
  aluminum: {
    name: 'aluminum',
    displayName: 'Aluminum Alloy',
    elasticModulus: 6.9e10, // Pa
    density: 2700, // kg/m³
    color: '#d6d6d6',
    description: 'Lightweight metal with good corrosion resistance',
  },
  timber: {
    name: 'timber',
    displayName: 'Structural Timber',
    elasticModulus: 1.2e10, // Pa
    density: 600, // kg/m³
    color: '#9e7e52',
    description: 'Renewable material with good strength-to-weight ratio',
  },
  compositeFRP: {
    name: 'compositeFRP',
    displayName: 'Fiber Reinforced Polymer',
    elasticModulus: 4.0e10, // Pa
    density: 1800, // kg/m³
    color: '#657da3',
    description: 'Advanced composite material with high specific strength',
  }
};

export const getMaterial = (name: string): Material => {
  return materials[name] || materials.steel;
};

export const getMaterialNames = (): string[] => {
  return Object.keys(materials);
}; 