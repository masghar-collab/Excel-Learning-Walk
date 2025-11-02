
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Observation, TeachingStrategies, YearGroup } from './types';
import { YEAR_GROUPS, STRATEGY_KEYS, STRATEGY_LABELS } from './constants';

const initialStrategies: TeachingStrategies = {
  miniWhiteboards: false,
  thinkPairShare: false,
  dumtums: false,
  coldCalling: false,
};

const getInitialFormState = (): Observation => ({
  id: '',
  dateTime: '',
  yearGroup: '',
  teacherName: '',
  observationNotes: '',
  strategies: { ...initialStrategies },
});

// Helper component for the details modal. Defined outside the main App component to prevent re-renders.
interface ObservationDetailsModalProps {
  observation: Observation | null;
  onClose: () => void;
}

const ObservationDetailsModal: React.FC<ObservationDetailsModalProps> = ({ observation, onClose }) => {
  if (!observation) return null;

  const formatDate = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 m-4 w-full max-w-lg relative text-slate-200 border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-white">&times;</button>
        <h2 className="text-xl font-bold mb-4 text-cyan-400">Observation Details</h2>
        <div className="space-y-3">
          <p><strong>Date & Time:</strong> {formatDate(observation.dateTime)}</p>
          <p><strong>Teacher:</strong> {observation.teacherName}</p>
          <p><strong>Year Group:</strong> {observation.yearGroup}</p>
          <div>
            <p className="font-semibold"><strong>Observation Notes:</strong></p>
            <p className="mt-1 p-2 bg-slate-700 rounded whitespace-pre-wrap">{observation.observationNotes}</p>
          </div>
          <div>
            <p className="font-semibold"><strong>Strategies Observed:</strong></p>
            <ul className="list-disc list-inside mt-1">
              {STRATEGY_KEYS.filter(key => observation.strategies[key]).map(key => (
                <li key={key}>{STRATEGY_LABELS[key]}</li>
              ))}
              {STRATEGY_KEYS.every(key => !observation.strategies[key]) && <li>None observed</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [formState, setFormState] = useState<Observation>(getInitialFormState());
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  useEffect(() => {
    try {
      const storedObservations = localStorage.getItem('learningWalks');
      if (storedObservations) {
        setObservations(JSON.parse(storedObservations));
      }
    } catch (error) {
      console.error("Failed to load observations from local storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('learningWalks', JSON.stringify(observations));
    } catch (error) {
      console.error("Failed to save observations to local storage", error);
    }
  }, [observations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      strategies: { ...prev.strategies, [name]: checked },
    }));
  };

  const resetForm = useCallback(() => {
    setFormState(getInitialFormState());
  }, []);

  const handleSave = () => {
    if (!formState.dateTime || !formState.teacherName || !formState.yearGroup) {
      alert('Please fill in Date/Time, Teacher Name, and Year Group.');
      return;
    }
    const newObservation: Observation = { ...formState, id: new Date().toISOString() };
    setObservations(prev => [newObservation, ...prev]);
    resetForm();
  };

  const handleEmail = () => {
    const { teacherName, dateTime, observationNotes, strategies } = formState;
    if (!teacherName || !dateTime) {
        alert('Please provide a Teacher Name and Date before sending an email.');
        return;
    }

    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const subject = `Learning Walk Feedback – ${teacherName} – ${formattedDate}`;
    
    const strategiesList = STRATEGY_KEYS
      .filter(key => strategies[key])
      .map(key => `- ${STRATEGY_LABELS[key]}`)
      .join('\n');

    const body = `Hi ${teacherName},\n\nHere is some feedback from a recent learning walk.\n\nObservation Notes:\n${observationNotes}\n\nTeaching Strategies Observed:\n${strategiesList || 'None specified'}\n\nBest regards,`;
    
    window.location.href = `ms-outlook://compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const handleExport = () => {
    if (observations.length === 0) {
      alert('No observations to export.');
      return;
    }

    const headers = ['Date', 'Time', 'Year Group', 'Teacher Name', 'Observation Notes', ...Object.values(STRATEGY_LABELS)];
    
    const csvRows = observations.map(obs => {
      const date = new Date(obs.dateTime);
      const csvDate = date.toLocaleDateString('en-CA');
      const csvTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Sanitize notes for CSV
      const sanitizedNotes = `"${obs.observationNotes.replace(/"/g, '""')}"`;
      
      const strategyValues = STRATEGY_KEYS.map(key => obs.strategies[key] ? 'Y' : 'N');

      return [csvDate, csvTime, obs.yearGroup, obs.teacherName, sanitizedNotes, ...strategyValues].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `learning_walks_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isFormValid = useMemo(() => {
    return formState.dateTime && formState.teacherName && formState.yearGroup;
  }, [formState.dateTime, formState.teacherName, formState.yearGroup]);

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto pb-28">
          <header className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">Learning Walk Assistant</h1>
            <p className="text-slate-400 mt-2">Record and manage classroom observations with ease.</p>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
              <h2 className="text-2xl font-semibold mb-6 border-b border-slate-600 pb-3 text-white">New Observation</h2>
              <form className="space-y-4">
                {/* Form Fields */}
                <div>
                  <label htmlFor="dateTime" className="block text-sm font-medium text-slate-300 mb-1">Date & Time</label>
                  <input type="datetime-local" id="dateTime" name="dateTime" value={formState.dateTime} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="yearGroup" className="block text-sm font-medium text-slate-300 mb-1">Year Group</label>
                    <select id="yearGroup" name="yearGroup" value={formState.yearGroup} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200">
                      <option value="" disabled>Select Year</option>
                      {YEAR_GROUPS.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="teacherName" className="block text-sm font-medium text-slate-300 mb-1">Class Teacher Name</label>
                    <input type="text" id="teacherName" name="teacherName" value={formState.teacherName} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200" />
                  </div>
                </div>

                <div>
                  <label htmlFor="observationNotes" className="block text-sm font-medium text-slate-300 mb-1">Observation Notes</label>
                  <textarea id="observationNotes" name="observationNotes" value={formState.observationNotes} onChange={handleInputChange} rows={5} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200"></textarea>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-300">Teaching Strategies</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STRATEGY_KEYS.map(key => (
                      <label key={key} className="flex items-center space-x-3 bg-slate-700 p-2 rounded-md cursor-pointer hover:bg-slate-600 transition-colors">
                        <input type="checkbox" name={key} checked={formState.strategies[key]} onChange={handleStrategyChange} className="h-4 w-4 rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                        <span className="text-sm text-slate-300">{STRATEGY_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col">
              <h2 className="text-2xl font-semibold mb-6 border-b border-slate-600 pb-3 text-white">Saved Observations</h2>
              <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {observations.length > 0 ? (
                  <ul className="space-y-3">
                    {observations.map(obs => (
                      <li key={obs.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center transition-shadow hover:shadow-md hover:shadow-cyan-500/10">
                        <div>
                          <p className="font-semibold text-slate-100">{obs.teacherName}</p>
                          <p className="text-sm text-slate-400">{obs.yearGroup} - {new Date(obs.dateTime).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setSelectedObservation(obs)} className="bg-cyan-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-cyan-500 transition-colors">View Details</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <p>No observations saved yet.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
      
      {/* Sticky Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 p-3 z-40">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center sm:justify-end gap-3">
            <button onClick={handleEmail} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!formState.teacherName || !formState.dateTime}>Send Feedback</button>
            <button onClick={handleExport} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors disabled:opacity-50" disabled={observations.length === 0}>Export to CSV</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-slate-900 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isFormValid}>Save Observation</button>
        </div>
      </footer>

      <ObservationDetailsModal observation={selectedObservation} onClose={() => setSelectedObservation(null)} />
    </>
  );
};

export default App;
