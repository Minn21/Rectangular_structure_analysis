'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Foundation } from '@/lib/types';

interface FoundationContextType {
  foundations: Foundation[];
  currentFoundation: Foundation | null;
  addFoundation: (foundation: Foundation) => void;
  updateFoundation: (id: string, foundation: Foundation) => void;
  setCurrentFoundation: (foundation: Foundation | null) => void;
  deleteFoundation: (id: string) => void;
}

const FoundationContext = createContext<FoundationContextType | undefined>(undefined);

// Sample foundation data
const sampleFoundations: Foundation[] = [
  {
    type: 'SpreadFooting',
    dimensions: { length: 2.5, width: 2.5, depth: 0.6 },
    material: 'Concrete',
    reinforcementDetails: '16mm bars @ 150mm c/c both ways, single layer',
    materialGrade: {
      concrete: 'C25/30',
      steel: 'B500B'
    },
    soilBearingCapacity: 150,
    depthBelowGrade: 1.2,
    designLoad: 1000000
  },
  {
    type: 'MatFoundation',
    dimensions: { length: 15, width: 15, depth: 0.8 },
    material: 'Concrete',
    reinforcementDetails: '12mm bars @ 200mm c/c both ways, 2 layers of reinforcement',
    materialGrade: {
      concrete: 'C30/37',
      steel: 'B500B'
    },
    soilBearingCapacity: 100,
    depthBelowGrade: 1.5,
    designLoad: 12000000
  },
  {
    type: 'PileFoundation',
    dimensions: { length: 15, width: 15, depth: 0.8 },
    material: 'Concrete',
    reinforcementDetails: '24 piles, 450mm diameter, 12m deep, 6-16mm bars per pile',
    materialGrade: {
      concrete: 'C35/45',
      steel: 'B500B'
    },
    soilBearingCapacity: 50,
    depthBelowGrade: 2.0,
    designLoad: 15000000
  }
];

interface FoundationProviderProps {
  children: ReactNode;
}

export const FoundationProvider: React.FC<FoundationProviderProps> = ({ children }) => {
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [currentFoundation, setCurrentFoundation] = useState<Foundation | null>(null);
  
  // Initialize with sample data
  useEffect(() => {
    // In a real app, you would load from an API or local storage
    setFoundations(sampleFoundations);
  }, []);
  
  const addFoundation = (foundation: Foundation) => {
    setFoundations([...foundations, foundation]);
  };
  
  const updateFoundation = (id: string, updatedFoundation: Foundation) => {
    // In this simple example, we don't have IDs, so we'd need to match properties
    // In a real app, you would use proper IDs
    const index = foundations.findIndex(f => 
      f.type === id || 
      (f.dimensions.length === parseFloat(id.split('-')[0]) && 
       f.dimensions.width === parseFloat(id.split('-')[1]))
    );
    
    if (index !== -1) {
      const newFoundations = [...foundations];
      newFoundations[index] = updatedFoundation;
      setFoundations(newFoundations);
      
      // Update current foundation if it was the one updated
      if (currentFoundation && 
         (currentFoundation.type === id || 
          (currentFoundation.dimensions.length === parseFloat(id.split('-')[0]) && 
           currentFoundation.dimensions.width === parseFloat(id.split('-')[1])))) {
        setCurrentFoundation(updatedFoundation);
      }
    }
  };
  
  const deleteFoundation = (id: string) => {
    const newFoundations = foundations.filter(f => 
      f.type !== id && 
      !(f.dimensions.length === parseFloat(id.split('-')[0]) && 
        f.dimensions.width === parseFloat(id.split('-')[1]))
    );
    setFoundations(newFoundations);
    
    // Clear current foundation if it was the one deleted
    if (currentFoundation && 
        (currentFoundation.type === id || 
         (currentFoundation.dimensions.length === parseFloat(id.split('-')[0]) && 
          currentFoundation.dimensions.width === parseFloat(id.split('-')[1])))) {
      setCurrentFoundation(null);
    }
  };
  
  return (
    <FoundationContext.Provider value={{
      foundations,
      currentFoundation,
      addFoundation,
      updateFoundation,
      setCurrentFoundation,
      deleteFoundation
    }}>
      {children}
    </FoundationContext.Provider>
  );
};

export const useFoundation = (): FoundationContextType => {
  const context = useContext(FoundationContext);
  if (context === undefined) {
    throw new Error('useFoundation must be used within a FoundationProvider');
  }
  return context;
}; 