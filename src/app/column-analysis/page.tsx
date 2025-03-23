import type { Metadata } from 'next';
import ColumnAnalysisClient from '@/components/ColumnAnalysisClient';

export const metadata: Metadata = {
  title: 'Column Analysis | Structural Analysis App',
  description: 'Analyze columns for buckling and combined axial-flexural behavior',
};

export default function ColumnAnalysisPage() {
  return <ColumnAnalysisClient />;
} 