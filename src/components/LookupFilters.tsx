/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, ChevronDown, MapPin } from 'lucide-react';
import { useState } from 'react';
import Autocomplete from 'react-google-autocomplete';
import { lookupDistricts } from '../lib/civic';

interface LookupFiltersProps {
  searchTerm: string;
  setSearchTerm: (t: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  userCongressional: string | null;
  userStateSenate: string | null;
  userStateHouse: string | null;
  userPollingLocation: {name: string, address: string} | null;
  setUserCongressional: (val: string | null) => void;
  setUserStateSenate: (val: string | null) => void;
  setUserStateHouse: (val: string | null) => void;
  setUserPollingLocation: (val: {name: string, address: string} | null) => void;
  addressLookupActive: boolean;
  setAddressLookupActive: (val: boolean) => void;
}

export function LookupFilters({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory,
  userCongressional,
  userStateSenate,
  userStateHouse,
  userPollingLocation,
  setUserCongressional,
  setUserStateSenate,
  setUserStateHouse,
  setUserPollingLocation,
  addressLookupActive,
  setAddressLookupActive
}: LookupFiltersProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const executeLookup = async (lookupAddress: string) => {
    if (!lookupAddress.trim()) return;
    setLoading(true);
    setError(null);

    const result = await lookupDistricts(lookupAddress);
    setLoading(false);

    if (result.error) {
       setError(result.error);
       return;
    }

    if (result.congressional) setUserCongressional(result.congressional);
    if (result.stateSenate) setUserStateSenate(result.stateSenate);
    if (result.stateHouse) setUserStateHouse(result.stateHouse);
    if (result.pollingLocation) setUserPollingLocation(result.pollingLocation);
    setAddressLookupActive(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(address);
  };

  const skipLookup = () => {
    setError(null);
    setUserCongressional(null);
    setUserStateSenate(null);
    setUserStateHouse(null);
    setUserPollingLocation(null);
    setAddressLookupActive(true);
  };

  const clearAddress = () => {
    setAddressLookupActive(false);
    setUserCongressional(null);
    setUserStateSenate(null);
    setUserStateHouse(null);
    setUserPollingLocation(null);
    setAddress('');
  };

  return (
    <div className="bg-white border-y sm:border border-gray-300">
      
      {!addressLookupActive ? (
        <div className="p-6 flex flex-col items-center text-center">
          <label className="block text-base font-bold text-[#0A2540] mb-4">Enter your address to see your ballot:</label>
          <div className="w-full max-w-sm flex flex-col gap-3">
            {mapsApiKey ? (
              <Autocomplete
                apiKey={mapsApiKey}
                onPlaceSelected={(place) => {
                   if (place && place.formatted_address) {
                       setAddress(place.formatted_address);
                       executeLookup(place.formatted_address);
                   }
                }}
                options={{
                  types: ["address"],
                  componentRestrictions: { country: "us" },
                }}
                defaultValue={address}
                onChange={(e) => setAddress((e.target as HTMLInputElement).value)}
                className="w-full px-4 py-3 border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A2540] text-sm text-gray-900 placeholder:text-gray-400 text-center"
                placeholder="Start typing your home address..."
              />
            ) : (
              <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="Street Address, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A2540] text-sm text-gray-900 placeholder:text-gray-400 text-center"
                  required
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0A2540] text-white px-4 py-3 text-sm font-bold hover:bg-[#081e33] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Find My Candidates'}
                </button>
              </form>
            )}

            {error && <p className="text-sm text-red-700 font-medium mt-1">{error}</p>}
          </div>

          <div className="mt-5 text-sm max-w-xs flex justify-center">
            <button type="button" onClick={skipLookup} className="text-gray-500 underline hover:text-[#0A2540]">Skip & view all candidates</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white p-4 border-b flex flex-col justify-center items-center gap-1 text-center">
            <div className="text-sm w-full">
               {userCongressional || userStateSenate || userStateHouse ? (
                 <div className="flex flex-col items-center">
                   <div className="flex items-center gap-1 font-bold text-[#0A2540]">
                      <MapPin className="h-3 w-3" /> Your Districts
                   </div> 
                   <span className="text-gray-600 text-xs mt-1">
                      {[userCongressional, userStateSenate, userStateHouse].filter(Boolean).join(' | ')}
                   </span>
                   
                   {userPollingLocation ? (
                     <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 w-full max-w-sm">
                       <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Your Polling Location</p>
                       <p className="text-sm font-semibold text-blue-950">{userPollingLocation.name}</p>
                       <p className="text-xs text-blue-800 mt-0.5">{userPollingLocation.address}</p>
                     </div>
                   ) : (
                     <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 w-full max-w-sm">
                       <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Your Polling Location</p>
                       <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                         To find your polling location, please visit the <a href="https://okvoterportal.okelections.us/" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">OK Voter Portal</a>.
                       </p>
                     </div>
                   )}
                 </div>
               ) : (
                 <span className="font-bold text-[#0A2540]">All Candidates</span>
               )}
            </div>
            <button 
              onClick={clearAddress}
              className="text-xs font-bold mt-3 text-blue-600 hover:text-blue-800 hover:underline"
            >
              Change Address
            </button>
          </div>

          <div className="p-3 flex flex-col gap-3 bg-gray-50">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Filter by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
              />
            </div>
            
            <div className="relative w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
              >
                <option value="All">All Levels</option>
                <option value="Statewide">Statewide</option>
                <option value="Congressional">Congressional</option>
                <option value="State House">State House</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none h-4 w-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}