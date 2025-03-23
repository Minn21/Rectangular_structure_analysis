import type { Metadata } from 'next';
import BeamAnalysisContent from '@/components/BeamAnalysisContent';

export const metadata: Metadata = {
  title: 'Beam Analysis | Structural Analysis App',
  description: 'Analyze beams with various support conditions and loading patterns',
};

export default function BeamAnalysisPage() {
  return <BeamAnalysisContent />;
} 