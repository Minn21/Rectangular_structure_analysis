'use client';
import React, { useState, useEffect } from 'react';
import ParameterForm from './ParameterForm';
import Visualization from './Visualization';
import CalculationResults from './CalculationResults';
import { BuildingParameters, CalculationResults as CalculationResultsType } from '../lib/types';
import { calculateBuildingResults } from '../lib/calculations';

// Define page types to avoid using 'any'
type PageType = 'parameters' | 'visualization' | 'results' | 'export';

// Define navigation item type
interface NavigationItem {
  id: PageType;
  label: string;
  icon: React.ReactNode;
}

export default function StructuralAnalysis() {
  const [parameters, setParameters] = useState<BuildingParameters>({
    buildingLength: 10,
    buildingWidth: 8,
    buildingHeight: 3,
    numberOfStoreys: 1,
    columnsAlongLength: 2,
    columnsAlongWidth: 2,
    beamsAlongLength: 1,
    beamsAlongWidth: 1,
    slabThickness: 0.2,
    slabLoad: 5000,
    beamWidth: 0.3,
    beamHeight: 0.5,
    elasticModulus: 2e11,
    columnWidth: 0.3,
    columnDepth: 0.3,
    materialName: 'steel',
    beamSection: '',
    columnSection: '',
  });

  const [results, setResults] = useState<CalculationResultsType>(
    calculateBuildingResults(parameters)
  );

  const [activePage, setActivePage] = useState<PageType>('parameters');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  const handleParametersChange = (newParams: BuildingParameters) => {
    setParameters(newParams);
    setResults(calculateBuildingResults(newParams));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Add actual dark mode implementation if needed
  };

  const navigationItems: NavigationItem[] = [
    { id: 'parameters', label: 'Parameters', icon: <ParametersIcon /> },
    { id: 'visualization', label: 'Visualization', icon: <VisualizationIcon /> },
    { id: 'results', label: 'Results', icon: <ResultsIcon /> },
    { id: 'export', label: 'Export', icon: <ExportIcon /> }
  ];

  return (
    <div className={`${darkMode ? 'dark bg-gray-900' : ''} min-h-screen`}>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="container-responsive py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Structural Analysis
          </h1>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Toggle mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="bg-white border-b border-gray-200 py-2">
            <div className="container-responsive">
              <ul className="flex flex-col space-y-1">
                {navigationItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActivePage(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === item.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3">{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-gray-200 bg-white min-h-screen sticky top-0">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Structural Analysis
            </h1>
            <p className="text-sm text-gray-500 mt-1">Interactive 3D Modeling</p>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activePage === item.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-5 h-5 mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <span className="w-5 h-5 mr-3">
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </span>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-6 lg:py-8">
          <div className="container-responsive">
            {/* Page Header */}
            <header className="mb-8 hidden lg:block">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {activePage === 'parameters' && 'Building Parameters'}
                {activePage === 'visualization' && '3D Visualization'}
                {activePage === 'results' && 'Analysis Results'}
                {activePage === 'export' && 'Export & Reports'}
              </h1>
              <p className="text-gray-600">
                {activePage === 'parameters' && 'Configure your building structure parameters'}
                {activePage === 'visualization' && 'Explore your building structure in 3D'}
                {activePage === 'results' && 'View detailed structural analysis results'}
                {activePage === 'export' && 'Export your analysis results and generate reports'}
              </p>
            </header>

            {/* Content Pages */}
            {activePage === 'parameters' && (
              <ParameterForm 
                initialParameters={parameters} 
                onParametersSubmit={handleParametersChange} 
              />
            )}
            
            {activePage === 'visualization' && (
              <div className="card hover-glow rounded-2xl overflow-hidden">
                <Visualization parameters={parameters} results={results} />
              </div>
            )}
            
            {activePage === 'results' && (
              <div className="glass-card p-0 rounded-2xl overflow-hidden">
                <div className="p-4 md:p-6 bg-gradient-to-r from-indigo-600 to-blue-600">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Analysis Results</h2>
                  <p className="text-indigo-100 text-sm md:text-base">
                    Detailed structural calculations based on your parameters
                  </p>
                </div>
                <div className="p-4 md:p-6">
                  <CalculationResults results={results} />
                </div>
              </div>
            )}
            
            {activePage === 'export' && (
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Export Options</h2>
                <p className="text-gray-600 mb-6">Export your analysis results in various formats</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ExportCard 
                    title="PDF Report" 
                    description="Comprehensive report with all analysis details"
                    icon={<PDFIcon />}
                    onClick={() => alert('PDF export would be implemented here')}
                  />
                  <ExportCard 
                    title="CSV Data" 
                    description="Raw data in spreadsheet format"
                    icon={<CSVIcon />}
                    onClick={() => alert('CSV export would be implemented here')}
                  />
                  <ExportCard 
                    title="3D Model" 
                    description="Export as 3D model file (GLB/OBJ)"
                    icon={<ModelIcon />}
                    onClick={() => alert('3D model export would be implemented here')}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-20">
        <div className="grid grid-cols-4">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center py-3 ${
                activePage === item.id
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={`View ${item.label}`}
            >
              <span className="w-6 h-6">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container-responsive">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Structural Analysis Studio. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-indigo-600">
                <span className="sr-only">Documentation</span>
                <DocumentIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600">
                <span className="sr-only">GitHub</span>
                <GitHubIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600">
                <span className="sr-only">Help</span>
                <HelpIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export card component
function ExportCard({ title, description, icon, onClick }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover-lift text-left"
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}

// Icons
function ParametersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function VisualizationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function PDFIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function CSVIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ModelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
    </svg>
  );
}

function DocumentIcon({ className = "h-6 w-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function GitHubIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function HelpIcon({ className = "h-6 w-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}