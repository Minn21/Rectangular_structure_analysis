import { SectionProfile } from './types';

// Helper function to calculate rectangular section properties
const calculateRectangularSectionProperties = (width: number, height: number) => {
  const area = width * height;
  const momentOfInertiaX = (width * Math.pow(height, 3)) / 12;
  const momentOfInertiaY = (height * Math.pow(width, 3)) / 12;
  const sectionModulusX = momentOfInertiaX / (height / 2);
  const sectionModulusY = momentOfInertiaY / (width / 2);
  const plasticModulusX = (width * height * height) / 4;
  const plasticModulusY = (height * width * width) / 4;
  const torsionalConstant = calculateTorsionalConstant(width, height);
  const shearAreaX = (5/6) * width * height; // approximation
  const shearAreaY = (5/6) * width * height; // approximation
  
  return {
    width,
    height,
    area,
    momentOfInertiaX,
    momentOfInertiaY,
    sectionModulusX,
    sectionModulusY,
    plasticModulusX,
    plasticModulusY,
    torsionalConstant,
    shearAreaX,
    shearAreaY,
    shape: 'Rectangular' as const,
  };
};

// Helper function to calculate torsional constant (J) for rectangular sections
const calculateTorsionalConstant = (width: number, height: number) => {
  const a = Math.max(width, height);
  const b = Math.min(width, height);
  return (1/3) * a * Math.pow(b, 3) * (1 - 0.63 * (b/a) * (1 - Math.pow(b, 4)/(12 * Math.pow(a, 4))));
};

// Helper function to calculate I-section properties
const calculateISection = (h: number, b: number, tw: number, tf: number) => {
  // h = overall height, b = flange width, tw = web thickness, tf = flange thickness
  const A_f = b * tf; // area of one flange
  const A_w = (h - 2 * tf) * tw; // area of web
  const area = 2 * A_f + A_w;
  
  // Moment of inertia about x-axis (strong axis)
  const I_fx = (b * Math.pow(tf, 3)) / 12; // Ix of one flange about its own centroid
  const I_w = (tw * Math.pow(h - 2 * tf, 3)) / 12; // Ix of web
  const d_f = (h - tf) / 2; // distance from centroid to flange centroid
  
  const momentOfInertiaX = 2 * (I_fx + A_f * Math.pow(d_f, 2)) + I_w;
  
  // Moment of inertia about y-axis (weak axis)
  const I_fy = (tf * Math.pow(b, 3)) / 12; // Iy of one flange
  const I_wy = (Math.pow(tw, 3) * (h - 2 * tf)) / 12; // Iy of web
  
  const momentOfInertiaY = 2 * I_fy + I_wy;
  
  // Section moduli
  const sectionModulusX = momentOfInertiaX / (h / 2);
  const sectionModulusY = momentOfInertiaY / (b / 2);
  
  // Plastic moduli (approximated)
  const plasticModulusX = (b * tf * (h - tf)) + ((h - 2 * tf) * tw * (h - 2 * tf) / 4);
  const plasticModulusY = (2 * tf * b * b) / 4 + (tw * (h - 2 * tf) * tw) / 4;
  
  // Torsional constant (approximated)
  const torsionalConstant = (1/3) * (2 * b * Math.pow(tf, 3) + (h - 2 * tf) * Math.pow(tw, 3));
  
  // Shear areas
  const shearAreaX = (h - 2 * tf) * tw; // web area (Y-direction shear)
  const shearAreaY = area / 5; // approximation for X-direction shear
  
  return {
    width: b,
    height: h,
    area,
    momentOfInertiaX,
    momentOfInertiaY,
    sectionModulusX,
    sectionModulusY,
    plasticModulusX,
    plasticModulusY,
    torsionalConstant,
    shearAreaX,
    shearAreaY,
    shape: 'WShape' as const,
    flangeThickness: tf,
    webThickness: tw,
  };
};

// Standard rectangular beam sections
export const rectangularBeamSections: SectionProfile[] = [
  {
    id: 'b300x500',
    name: 'B300x500',
    type: 'beam',
    ...calculateRectangularSectionProperties(0.3, 0.5),
    description: 'Standard rectangular beam 300mm x 500mm',
  },
  {
    id: 'b250x450',
    name: 'B250x450',
    type: 'beam',
    ...calculateRectangularSectionProperties(0.25, 0.45),
    description: 'Medium-sized rectangular beam 250mm x 450mm',
  },
  {
    id: 'b200x400',
    name: 'B200x400',
    type: 'beam',
    ...calculateRectangularSectionProperties(0.2, 0.4),
    description: 'Smaller rectangular beam 200mm x 400mm',
  },
  {
    id: 'b350x600',
    name: 'B350x600',
    type: 'beam',
    ...calculateRectangularSectionProperties(0.35, 0.6),
    description: 'Large rectangular beam 350mm x 600mm',
  },
  {
    id: 'b400x700',
    name: 'B400x700',
    type: 'beam',
    ...calculateRectangularSectionProperties(0.4, 0.7),
    description: 'Extra large rectangular beam 400mm x 700mm',
  },
];

// Standard rectangular column sections
export const rectangularColumnSections: SectionProfile[] = [
  {
    id: 'c300x300',
    name: 'C300x300',
    type: 'column',
    ...calculateRectangularSectionProperties(0.3, 0.3),
    description: 'Standard square column 300mm x 300mm',
  },
  {
    id: 'c350x350',
    name: 'C350x350',
    type: 'column',
    ...calculateRectangularSectionProperties(0.35, 0.35),
    description: 'Medium square column 350mm x 350mm',
  },
  {
    id: 'c400x400',
    name: 'C400x400',
    type: 'column',
    ...calculateRectangularSectionProperties(0.4, 0.4),
    description: 'Large square column 400mm x 400mm',
  },
  {
    id: 'c300x400',
    name: 'C300x400',
    type: 'column',
    ...calculateRectangularSectionProperties(0.3, 0.4),
    description: 'Rectangular column 300mm x 400mm',
  },
  {
    id: 'c250x250',
    name: 'C250x250',
    type: 'column',
    ...calculateRectangularSectionProperties(0.25, 0.25),
    description: 'Small square column 250mm x 250mm',
  },
];

// Standard W-shape (Wide Flange) beam sections following AISC naming conventions (converted to meters)
export const wShapeBeamSections: SectionProfile[] = [
  {
    id: 'W12x26',
    name: 'W12x26',
    type: 'beam',
    ...calculateISection(0.3048, 0.1651, 0.0071, 0.0113), // 12" x 26 lb/ft
    description: 'W12x26 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W14x30',
    name: 'W14x30',
    type: 'beam',
    ...calculateISection(0.3556, 0.1702, 0.0071, 0.0111), // 14" x 30 lb/ft
    description: 'W14x30 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W16x36',
    name: 'W16x36',
    type: 'beam',
    ...calculateISection(0.4064, 0.1778, 0.0071, 0.0114), // 16" x 36 lb/ft
    description: 'W16x36 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W18x50',
    name: 'W18x50',
    type: 'beam',
    ...calculateISection(0.4572, 0.1905, 0.0095, 0.0160), // 18" x 50 lb/ft
    description: 'W18x50 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W21x62',
    name: 'W21x62',
    type: 'beam',
    ...calculateISection(0.5334, 0.2093, 0.0103, 0.0163), // 21" x 62 lb/ft
    description: 'W21x62 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W24x76',
    name: 'W24x76',
    type: 'beam',
    ...calculateISection(0.6096, 0.2286, 0.0112, 0.0175), // 24" x 76 lb/ft
    description: 'W24x76 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W30x108',
    name: 'W30x108',
    type: 'beam',
    ...calculateISection(0.7620, 0.2654, 0.0140, 0.0216), // 30" x 108 lb/ft
    description: 'W30x108 Wide Flange Beam (AISC)',
    designationCode: 'AISC',
  },
];

// European IPE sections (in meters)
export const ipeBeamSections: SectionProfile[] = [
  {
    id: 'IPE200',
    name: 'IPE200',
    type: 'beam',
    ...calculateISection(0.200, 0.100, 0.0056, 0.0085), // h=200mm, b=100mm, tw=5.6mm, tf=8.5mm
    description: 'IPE200 I-section (European standard)',
    designationCode: 'Eurocode',
  },
  {
    id: 'IPE300',
    name: 'IPE300',
    type: 'beam',
    ...calculateISection(0.300, 0.150, 0.0071, 0.0107), // h=300mm, b=150mm, tw=7.1mm, tf=10.7mm
    description: 'IPE300 I-section (European standard)',
    designationCode: 'Eurocode',
  },
  {
    id: 'IPE400',
    name: 'IPE400',
    type: 'beam',
    ...calculateISection(0.400, 0.180, 0.0086, 0.0135), // h=400mm, b=180mm, tw=8.6mm, tf=13.5mm
    description: 'IPE400 I-section (European standard)',
    designationCode: 'Eurocode',
  },
  {
    id: 'IPE500',
    name: 'IPE500',
    type: 'beam',
    ...calculateISection(0.500, 0.200, 0.0102, 0.0160), // h=500mm, b=200mm, tw=10.2mm, tf=16mm
    description: 'IPE500 I-section (European standard)',
    designationCode: 'Eurocode',
  },
];

// W-shape columns
export const wShapeColumnSections: SectionProfile[] = [
  {
    id: 'W10x33',
    name: 'W10x33',
    type: 'column',
    ...calculateISection(0.2540, 0.2032, 0.0079, 0.0130), // 10" x 33 lb/ft
    description: 'W10x33 Wide Flange Column (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W12x40',
    name: 'W12x40',
    type: 'column',
    ...calculateISection(0.3048, 0.2032, 0.0079, 0.0135), // 12" x 40 lb/ft
    description: 'W12x40 Wide Flange Column (AISC)',
    designationCode: 'AISC',
  },
  {
    id: 'W14x53',
    name: 'W14x53',
    type: 'column',
    ...calculateISection(0.3556, 0.2032, 0.0089, 0.0155), // 14" x 53 lb/ft
    description: 'W14x53 Wide Flange Column (AISC)',
    designationCode: 'AISC',
  },
];

// European HE sections for columns
export const heColumnSections: SectionProfile[] = [
  {
    id: 'HE200B',
    name: 'HE200B',
    type: 'column',
    ...calculateISection(0.200, 0.200, 0.0090, 0.0150), // h=200mm, b=200mm, tw=9mm, tf=15mm
    description: 'HE200B Column (European standard)',
    designationCode: 'Eurocode',
  },
  {
    id: 'HE240B',
    name: 'HE240B',
    type: 'column',
    ...calculateISection(0.240, 0.240, 0.0100, 0.0170), // h=240mm, b=240mm, tw=10mm, tf=17mm
    description: 'HE240B Column (European standard)',
    designationCode: 'Eurocode',
  },
  {
    id: 'HE300B',
    name: 'HE300B',
    type: 'column',
    ...calculateISection(0.300, 0.300, 0.0110, 0.0190), // h=300mm, b=300mm, tw=11mm, tf=19mm
    description: 'HE300B Column (European standard)',
    designationCode: 'Eurocode',
  },
];

// Combine all beam and column sections
export const beamSections: SectionProfile[] = [
  ...rectangularBeamSections,
  ...wShapeBeamSections,
  ...ipeBeamSections,
];

export const columnSections: SectionProfile[] = [
  ...rectangularColumnSections,
  ...wShapeColumnSections,
  ...heColumnSections,
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

export const getSectionsByShape = (shape: string): SectionProfile[] => {
  return getAllSections().filter(section => section.shape === shape);
};

export const getSectionsByDesignationCode = (code: string): SectionProfile[] => {
  return getAllSections().filter(section => section.designationCode === code);
}; 