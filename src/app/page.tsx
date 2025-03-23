'use client'; 
import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Use dynamic import for the component that uses Three.js
const StructuralAnalysisComponent = dynamic(
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
        </div>
      </section>
      
      <section className="mb-16">
        <div className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Foundation Analysis Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Estimation and Quantity Analysis</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Detailed cost breakdown for different foundation types</li>
                <li>Regional cost adjustment factors for global projects</li>
                <li>Material quantity calculations including concrete, reinforcement, excavation and formwork</li>
                <li>Project scale considerations with appropriate unit cost adjustments</li>
                <li>Special considerations for pile foundations including mobilization costs</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Settlement Analysis and Prediction</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Immediate (elastic) settlement calculations</li>
                <li>Primary consolidation settlement for cohesive soils</li>
                <li>Secondary settlement estimation for long-term performance</li>
                <li>Differential settlement risk assessment</li>
                <li>Settlement timelines and visualization for client presentations</li>
                <li>Design recommendations based on settlement results</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Foundation Selection Recommendations</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Smart foundation type recommendations based on soil conditions</li>
                <li>Consideration of structural loads, building type, and site constraints</li>
                <li>Seismic considerations for projects in earthquake-prone areas</li>
                <li>Constructability assessments including equipment access and schedule impacts</li>
                <li>Alternative foundation solutions with comparisons</li>
                <li>Cost impact analysis for different foundation options</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Supported Foundation Types</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Spread footings for isolated columns with reinforcement optimization</li>
                <li>Strip footings for load-bearing walls with efficient design</li>
                <li>Mat/raft foundations for challenging soil conditions or heavy structures</li>
                <li>Pile foundations with options for end-bearing, friction, or combined action</li>
                <li>Customizable dimensions, materials, and reinforcement details</li>
                <li>Support for various soil types with appropriate property correlations</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/foundation-analysis" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Explore Foundation Analysis Dashboard
            </Link>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Our Structural Analysis App?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast and Efficient</h3>
            <p className="text-gray-600">
              Streamlined workflows that reduce design time by up to 50% compared to traditional methods.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reliable Results</h3>
            <p className="text-gray-600">
              Calculations based on industry-standard methods and validated against established engineering software.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Modern Interface</h3>
            <p className="text-gray-600">
              Intuitive design with real-time visualizations that make structural analysis accessible and understandable.
            </p>
          </div>
        </div>
      </section>
      <StructuralAnalysisComponent />
    </div>
  );
}