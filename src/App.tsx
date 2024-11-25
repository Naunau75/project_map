import React from 'react';
import TspMap from './components/TspMap';
import { Navigation } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-900">Voyageur de Commerce</h1>
          </div>
          <div className="text-sm text-gray-500">
            Cliquez sur la carte pour ajouter des points
          </div>
        </div>
      </header>
      <main className="flex-1 h-[calc(100vh-64px)]">
        <TspMap />
      </main>
    </div>
  );
}

export default App;