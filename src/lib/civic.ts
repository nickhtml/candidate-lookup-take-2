/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This function takes an address string and returns districts for that address.
export async function lookupDistricts(address: string): Promise<{ congressional: string | null, stateHouse: string | null, pollingLocation?: {name: string, address: string} | null, error?: string }> {
  // If the user has added a Google Civic API Key, prefer that since it's more accurate.
  const civicApiKey = (import.meta as any).env?.VITE_GOOGLE_CIVIC_API_KEY || (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
  
  if (civicApiKey) {
    return await lookupViaGoogleCivic(address, civicApiKey);
  }

  // Fallback to the free US Census Geocoder via our serverless edge function.
  return await lookupViaCensus(address);
}

async function lookupViaGoogleCivic(address: string, apiKey: string) {
  try {
    const encodedAddress = encodeURIComponent(address);
    // Fetch representatives for districts
    const repResponse = await fetch(`https://www.googleapis.com/civicinfo/v2/representatives?address=${encodedAddress}&key=${apiKey}`);
    
    if (!repResponse.ok) {
        console.warn(`Google Civic API Error:`, await repResponse.text());
        // Fall back to Census
        return await lookupViaCensus(address);
    }

    const data = await repResponse.json();
    let congressional = null;
    let stateHouse = null;
    
    if (data.divisions) {
        for (const id of Object.keys(data.divisions)) {
            if (id.includes('/cd:')) {
                const num = parseInt(id.split('/cd:')[1], 10);
                if (!isNaN(num)) congressional = `CD ${num.toString().padStart(3, '0')}`;
            }
            if (id.includes('/sldl:')) {
                const num = parseInt(id.split('/sldl:')[1], 10);
                if (!isNaN(num)) stateHouse = `District ${num.toString().padStart(3, '0')}`;
            }
        }
    }
    
    // Attempt to fetch polling location (using returnAllAvailableData to get info even if no major election is near)
    let pollingLocation = null;
    try {
        const voterResponse = await fetch(`https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodedAddress}&returnAllAvailableData=true&key=${apiKey}`);
        if (voterResponse.ok) {
            const voterData = await voterResponse.json();
            if (voterData.pollingLocations && voterData.pollingLocations.length > 0) {
                const loc = voterData.pollingLocations[0];
                pollingLocation = {
                    name: loc.address?.locationName || loc.address?.line1 || 'Polling Location',
                    address: `${loc.address?.line1 || ''}, ${loc.address?.city || ''}, ${loc.address?.state || ''} ${loc.address?.zip || ''}`.trim().replace(/^,\s/, '')
                };
            }
        } else {
            console.warn(`Civic VoterInfo API non-ok:`, await voterResponse.text());
        }
    } catch (e) {
        console.log("Could not fetch voter info details", e);
    }

    return { congressional, stateHouse, pollingLocation };
  } catch (err) {
    console.error('Fetch error', err);
    return { congressional: null, stateHouse: null, pollingLocation: null, error: 'Network error.' };
  }
}

async function lookupViaCensus(address: string) {
  try {
    // US Census Geocoder is very strict. The Google Autocomplete appends ", USA" which breaks the Census API.
    // Strip out ", USA" or ", United States" from the end of the string.
    const cleanAddress = address.replace(/(,\s*USA|,\s*United States)$/i, '').trim();
    const encodedAddress = encodeURIComponent(cleanAddress);
    
    // Fetch from our local proxy to avoid CORS issues
    const url = `/api/lookup?address=${encodedAddress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        let errMsg = 'Network error with Geocoder API.';
        try {
            const errData = await response.json();
            errMsg = errData.error || errData.message || errMsg;
        } catch(e) {}
        return { congressional: null, stateHouse: null, pollingLocation: null, error: errMsg };
    }

    const data = await response.json();
    
    // Census returns empty or error format
    if (data.error) {
         return { congressional: null, stateHouse: null, pollingLocation: null, error: data.error };
    }
    if (!data.result || !data.result.addressMatches || data.result.addressMatches.length === 0) {
        return { congressional: null, stateHouse: null, pollingLocation: null, error: `No exact district matches for: ${cleanAddress}` };
    }

    const match = data.result.addressMatches[0];
    const geographies = match.geographies || {};

    let congressional = null;
    let stateHouse = null;

    // Parse Congressional District
    const cdKey = Object.keys(geographies).find(k => k.includes('Congressional District'));
    if (cdKey && geographies[cdKey].length > 0) {
        const cdBase = geographies[cdKey][0].BASENAME;
        congressional = `CD ${cdBase.padStart(3, '0')}`;
    }

    // Parse State House District (Lower Legislative District)
    const lowerKey = Object.keys(geographies).find(k => k.includes('State Legislative Districts - Lower'));
    if (lowerKey && geographies[lowerKey].length > 0) {
        const houseBase = geographies[lowerKey][0].BASENAME;
        stateHouse = `District ${houseBase.padStart(3, '0')}`;
    }

    return { congressional, stateHouse, pollingLocation: null };
  } catch (err) {
    console.error('Fetch error', err);
    return { congressional: null, stateHouse: null, pollingLocation: null, error: 'Network error.' };
  }
}

