'use client'; 
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import for the component that uses Three.js
const StructuralAnalysis = dynamic(
  () => import('../components'),
  { ssr: false, loading: () => <Loading /> }
);

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <StructuralAnalysis />
    </Suspense>
  );
}