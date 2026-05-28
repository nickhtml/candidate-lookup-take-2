/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { candidatesData } from './data/candidates';
import { Header } from './components/Header';
import { LookupFilters } from './components/LookupFilters';
import { CandidateCard } from './components/CandidateCard';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // District matching state
  const [addressLookupActive, setAddressLookupActive] = useState(false);
  const [userCongressional, setUserCongressional] = useState<string | null>(null);
  const [userStateHouse, setUserStateHouse] = useState<string | null>(null);
  const [userPollingLocation, setUserPollingLocation] = useState<{name: string, address: string} | null>(null);

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
    if (addressLookupActive && (userCongressional || userStateHouse)) {
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
  }, [searchTerm, selectedCategory, addressLookupActive, userCongressional, userStateHouse]);

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
          userStateHouse={userStateHouse}
          userPollingLocation={userPollingLocation}
          setUserCongressional={setUserCongressional}
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
      </main>
    </div>
  );
}
