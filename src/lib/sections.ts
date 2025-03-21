import { SectionProfile } from './types';

// Helper function to calculate rectangular section properties
const calculateRectangularSectionProperties = (width: number, height: number) => {
  const area = width * height;
  const momentOfInertiaX = (width * Math.pow(height, 3)) / 12;
  const momentOfInertiaY = (height * Math.pow(width, 3)) / 12;
  
  return {
    width,
    height,
    area,
    momentOfInertiaX,
    momentOfInertiaY,
  };
};

// Standard beam sections
export const beamSections: SectionProfile[] = [
  {
    id: 'b300x500',
    name: 'B300x500',
    type: 'beam',
    width: 0.3,
    height: 0.5,
    area: 0.3 * 0.5,
    momentOfInertiaX: (0.3 * Math.pow(0.5, 3)) / 12,
    momentOfInertiaY: (0.5 * Math.pow(0.3, 3)) / 12,
    description: 'Standard rectangular beam 300mm x 500mm',
  },
  {
    id: 'b250x450',
    name: 'B250x450',
    type: 'beam',
    width: 0.25,
    height: 0.45,
    area: 0.25 * 0.45,
    momentOfInertiaX: (0.25 * Math.pow(0.45, 3)) / 12,
    momentOfInertiaY: (0.45 * Math.pow(0.25, 3)) / 12,
    description: 'Medium-sized rectangular beam 250mm x 450mm',
  },
  {
    id: 'b200x400',
    name: 'B200x400',
    type: 'beam',
    width: 0.2,
    height: 0.4,
    area: 0.2 * 0.4,
    momentOfInertiaX: (0.2 * Math.pow(0.4, 3)) / 12,
    momentOfInertiaY: (0.4 * Math.pow(0.2, 3)) / 12,
    description: 'Smaller rectangular beam 200mm x 400mm',
  },
  {
    id: 'b350x600',
    name: 'B350x600',
    type: 'beam',
    width: 0.35,
    height: 0.6,
    area: 0.35 * 0.6,
    momentOfInertiaX: (0.35 * Math.pow(0.6, 3)) / 12,
    momentOfInertiaY: (0.6 * Math.pow(0.35, 3)) / 12,
    description: 'Large rectangular beam 350mm x 600mm',
  },
  {
    id: 'b400x700',
    name: 'B400x700',
    type: 'beam',
    width: 0.4,
    height: 0.7,
    area: 0.4 * 0.7,
    momentOfInertiaX: (0.4 * Math.pow(0.7, 3)) / 12,
    momentOfInertiaY: (0.7 * Math.pow(0.4, 3)) / 12,
    description: 'Extra large rectangular beam 400mm x 700mm',
  },
];

// Standard column sections
export const columnSections: SectionProfile[] = [
  {
    id: 'c300x300',
    name: 'C300x300',
    type: 'column',
    width: 0.3,
    height: 0.3,
    area: 0.3 * 0.3,
    momentOfInertiaX: (0.3 * Math.pow(0.3, 3)) / 12,
    momentOfInertiaY: (0.3 * Math.pow(0.3, 3)) / 12,
    description: 'Standard square column 300mm x 300mm',
  },
  {
    id: 'c350x350',
    name: 'C350x350',
    type: 'column',
    width: 0.35,
    height: 0.35,
    area: 0.35 * 0.35,
    momentOfInertiaX: (0.35 * Math.pow(0.35, 3)) / 12,
    momentOfInertiaY: (0.35 * Math.pow(0.35, 3)) / 12,
    description: 'Medium square column 350mm x 350mm',
  },
  {
    id: 'c400x400',
    name: 'C400x400',
    type: 'column',
    width: 0.4,
    height: 0.4,
    area: 0.4 * 0.4,
    momentOfInertiaX: (0.4 * Math.pow(0.4, 3)) / 12,
    momentOfInertiaY: (0.4 * Math.pow(0.4, 3)) / 12,
    description: 'Large square column 400mm x 400mm',
  },
  {
    id: 'c300x400',
    name: 'C300x400',
    type: 'column',
    width: 0.3,
    height: 0.4,
    area: 0.3 * 0.4,
    momentOfInertiaX: (0.3 * Math.pow(0.4, 3)) / 12,
    momentOfInertiaY: (0.4 * Math.pow(0.3, 3)) / 12,
    description: 'Rectangular column 300mm x 400mm',
  },
  {
    id: 'c250x250',
    name: 'C250x250',
    type: 'column',
    width: 0.25,
    height: 0.25,
    area: 0.25 * 0.25,
    momentOfInertiaX: (0.25 * Math.pow(0.25, 3)) / 12,
    momentOfInertiaY: (0.25 * Math.pow(0.25, 3)) / 12,
    description: 'Small square column 250mm x 250mm',
  },
];

// Utility functions
export const getBeamSection = (id: string): SectionProfile | undefined => {
  return beamSections.find(section => section.id === id);
};

export const getColumnSection = (id: string): SectionProfile | undefined => {
  return columnSections.find(section => section.id === id);
};

export const getAllSections = (): SectionProfile[] => {
  return [...beamSections, ...columnSections];
};

export const getSectionsByType = (type: 'beam' | 'column'): SectionProfile[] => {
  return type === 'beam' ? beamSections : columnSections;
}; 