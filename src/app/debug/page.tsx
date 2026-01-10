'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/sync-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setDebugResult(result);
    } catch (error) {
      setDebugResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runActualSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/sync?force=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setDebugResult(result);
    } catch (error) {
      setDebugResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Sync Process</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={runDebugSync}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Debug Sync'}
          </button>
          
          <button
            onClick={runActualSync}
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
          >
            {loading ? 'Running...' : 'Run Actual Sync (Force)'}
          </button>
        </div>

        {debugResult && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Debug Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}