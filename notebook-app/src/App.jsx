import { useEffect, useState } from 'react';
import AppLayout from './components/Layout/AppLayout';
import dbConnection from './database/connection';
import useNoteStore from './store/noteStore';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const { loadNotes } = useNoteStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await dbConnection.initialize();

        // Load initial notes
        await loadNotes();

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(error.message);
      }
    };

    initializeApp();
  }, [loadNotes]);

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">
            Failed to Initialize
          </div>
          <div className="text-red-500 text-sm">
            {initError}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Initializing NoteBook...</div>
        </div>
      </div>
    );
  }

  return <AppLayout />;
}

export default App;
