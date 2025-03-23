import type { Metadata } from 'next';
import RectangularStructureVisualization from '@/components/RectangularStructureVisualization';

export const metadata: Metadata = {
  title: 'Rectangular Structure Analysis | Structural Analysis App',
  description: 'Visualize and analyze rectangular structures with 3D visualization',
};

export default function StructuralAnalysisPage() {
  return <RectangularStructureVisualization />;
} 