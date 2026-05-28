/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { candidatesData } from './data/candidates';
import { Header } from './components/Header';
import { LookupFilters } from './components/LookupFilters';
import { CandidateCard } from './components/CandidateCard';
import { Code as CodeIcon } from 'lucide-react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // District matching state
  const [addressLookupActive, setAddressLookupActive] = useState(false);
  const [userCongressional, setUserCongressional] = useState<string | null>(null);
  const [userStateSenate, setUserStateSenate] = useState<string | null>(null);
  const [userStateHouse, setUserStateHouse] = useState<string | null>(null);
  const [userPollingLocation, setUserPollingLocation] = useState<{name: string, address: string} | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  // Derive the active candidates to render
  const filteredData = useMemo(() => {
    let filtered = candidatesData;

    // 1. Text Search Filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(lowerSearch) ||
        candidate.office.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Category Dropdown Filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(candidate => candidate.level === selectedCategory);
    }
    
    // 3. Address / District Matching Filter
    if (addressLookupActive && (userCongressional || userStateSenate || userStateHouse)) {
      filtered = filtered.filter(candidate => {
         // Everyone sees statewide
         if (candidate.level === 'Statewide') return true;
         
         // Only show their congressional
         if (candidate.level === 'Congressional') {
             if (!userCongressional) return false;
             return candidate.office.includes(userCongressional);
         }
         
         // Only show their state house
         if (candidate.level === 'State House') {
             if (!userStateHouse) return false;
             return candidate.office.includes(userStateHouse); // e.g., District 045
         }
         
         return false;
      });
    }

    // Group by level
    const grouped = filtered.reduce((acc, candidate) => {
      if (!acc[candidate.level]) {
        acc[candidate.level] = [];
      }
      acc[candidate.level].push(candidate);
      return acc;
    }, {} as Record<string, typeof candidatesData>);

    return grouped;
  }, [searchTerm, selectedCategory, addressLookupActive, userCongressional, userStateSenate, userStateHouse]);

  // Define display order
  const order = ['Statewide', 'Congressional', 'State House'];

  return (
    <div className="w-full bg-transparent font-sans text-gray-900 flex justify-center">
      <main className="w-full max-w-[400px] bg-white pt-2 pb-8">
        <Header />
        <LookupFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          userCongressional={userCongressional}
          userStateSenate={userStateSenate}
          userStateHouse={userStateHouse}
          userPollingLocation={userPollingLocation}
          setUserCongressional={setUserCongressional}
          setUserStateSenate={setUserStateSenate}
          setUserStateHouse={setUserStateHouse}
          setUserPollingLocation={setUserPollingLocation}
          addressLookupActive={addressLookupActive}
          setAddressLookupActive={setAddressLookupActive}
        />
        
        {/* Results Feed */}
        {addressLookupActive && (
          <div className="space-y-6 mt-6">
            {order.map(level => {
              const candidates = filteredData[level];
              if (!candidates || candidates.length === 0) return null;

              return (
                <section key={level} className="border border-gray-300 bg-white">
                  <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 text-center">
                    <h2 className="text-[#0A2540] text-[11px] font-bold uppercase tracking-widest">
                      {level} Candidates
                    </h2>
                  </div>
                  <div className="px-3 pb-2 flex flex-col">
                    {candidates.map((candidate, idx) => (
                      <CandidateCard key={`${candidate.name}-${idx}`} candidate={candidate} />
                    ))}
                  </div>
                </section>
              );
            })}
            
            {Object.keys(filteredData).length === 0 && (
              <div className="text-center py-8 px-4 text-gray-500 bg-white border border-gray-300">
                 <p className="text-sm">No candidates found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Embed Link */}
        <div className="mt-8 text-center text-xs text-gray-500 flex justify-center items-center">
            <button onClick={() => setIsEmbedModalOpen(true)} className="flex items-center gap-1 hover:text-[#0A2540] transition-colors">
                <CodeIcon className="w-3 h-3" /> Embed this tool
            </button>
        </div>
      </main>

      {/* Embed Modal */}
      {isEmbedModalOpen && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded max-w-sm w-full p-6 shadow-xl relative text-left">
                <h3 className="font-bold text-lg text-[#0A2540] mb-2">Embed Lookup Tool</h3>
                <p className="text-xs text-gray-600 mb-4">Copy the code below to embed the OKDEMS Candidate Lookup form securely on your own website.</p>
                
                <div className="bg-gray-100 p-3 rounded border border-gray-200 font-mono text-[10px] text-gray-800 break-all select-all h-32 overflow-y-auto mb-4">
                    {`<div style="width: 100%; max-width: 400px; margin: 0 auto;">\n  <iframe src="https://candidatelookup2.vercel.app/" width="100%" height="800" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" title="2026 Candidate Lookup" loading="lazy"></iframe>\n</div>`}
                </div>

                <button 
                  onClick={() => {
                     navigator.clipboard.writeText(`<div style="width: 100%; max-width: 400px; margin: 0 auto;">\n  <iframe src="https://candidatelookup2.vercel.app/" width="100%" height="800" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" title="2026 Candidate Lookup" loading="lazy"></iframe>\n</div>`);
                     alert("Copied to clipboard!");
                  }}
                  className="w-full bg-[#0A2540] text-white py-2 font-bold mb-2 hover:bg-[#081e33] transition-colors text-sm rounded">
                  Copy HTML
                </button>
                <button onClick={() => setIsEmbedModalOpen(false)} className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-800 py-2">Close</button>
            </div>
         </div>
      )}
    </div>
  );
}
