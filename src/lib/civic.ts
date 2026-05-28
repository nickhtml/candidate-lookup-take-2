/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This function takes an address string and returns districts for that address.
export async function lookupDistricts(address: string): Promise<{ congressional: string | null, stateHouse: string | null, error?: string }> {
  try {
    const encodedAddress = encodeURIComponent(address);
    // Fetch from our local proxy to avoid CORS issues
    const url = `/api/lookup?address=${encodedAddress}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        return { congressional: null, stateHouse: null, error: 'Network error with US Census Geocoder.' };
    }

    const data = await response.json();
    
    if (!data.result || !data.result.addressMatches || data.result.addressMatches.length === 0) {
        return { congressional: null, stateHouse: null, error: 'Could not find exact district info. Please ensure your address includes your house number, street, city, and state.' };
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

    return { congressional, stateHouse };

  } catch (err) {
    console.error('Fetch error', err);
    return { congressional: null, stateHouse: null, error: 'Network error.' };
  }
}

