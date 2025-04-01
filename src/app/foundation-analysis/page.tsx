import React from 'react';
import FoundationAnalysisDashboard from '@/components/FoundationAnalysisDashboard';

export const metadata = {
  title: 'Foundation Analysis | Structural Analysis App',
  description: 'Comprehensive foundation analysis including cost estimation, settlement prediction, and design recommendations',
};

export default function FoundationAnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      
      <FoundationAnalysisDashboard />
    </div>
  );
} 