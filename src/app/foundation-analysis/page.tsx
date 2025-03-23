import React from 'react';
import FoundationAnalysisDashboard from '@/components/FoundationAnalysisDashboard';

export const metadata = {
  title: 'Foundation Analysis | Structural Analysis App',
  description: 'Comprehensive foundation analysis including cost estimation, settlement prediction, and design recommendations',
};

export default function FoundationAnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Foundation Analysis</h1>
      <FoundationAnalysisDashboard />
    </div>
  );
} 