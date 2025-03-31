'use client'; 
import React from 'react';
//import dynamic from 'next/dynamic';
import Link from 'next/link';

// Use dynamic import for the component that uses Three.js
/*const StructuralAnalysisComponent = dynamic(
  () => import('../components'),
  { ssr: false, loading: () => <Loading /> }
);*/

/*function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}*/

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-10">
      <section className="mb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Structural Analysis Application</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive tools for structural engineers to analyze, design, and optimize 
            building components with precision and efficiency.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Beam Analysis</h2>
              <p className="text-gray-600 mb-4">
                Analyze beams with various support conditions, loading patterns, and cross-sections. 
                Calculate bending moments, shear forces, and deflections.
              </p>
              <Link href="/beam-analysis" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Try Beam Analysis &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Column Analysis</h2>
              <p className="text-gray-600 mb-4">
                Design and check columns for axial loads, biaxial bending, and buckling effects. 
                Verify capacities according to different design codes.
              </p>
              <Link href="/column-analysis" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Try Column Analysis &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Rectangular Structure Analysis</h2>
              <p className="text-gray-600 mb-4">
                Analyze complete rectangular structures with advanced 3D visualization. 
                Evaluate building behavior, load distribution, and structural integrity.
              </p>
              <Link href="/structural-analysis" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Try Rectangular Structure Analysis &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Foundation Analysis</h2>
              <p className="text-gray-600 mb-4">
                Design and analyze various foundation types with cost estimation, settlement prediction, 
                and automated foundation type recommendations.
              </p>
              <Link href="/foundation-analysis" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Try Foundation Analysis &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Seismic Simulation</h2>
              <p className="text-gray-600 mb-4">
                Simulate the effects of earthquakes on building structures. Analyze seismic response,
                displacement patterns, and identify critical structural elements.
              </p>
              <Link href="/seismic-simulation" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Try Seismic Simulation &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}