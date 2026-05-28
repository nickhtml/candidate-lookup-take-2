/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candidate } from '../types';
import { ExternalLink } from 'lucide-react';

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  // Parse for incumbent marker
  const isIncumbent = candidate.name.endsWith('*');
  const cleanName = candidate.name.replace(/\*$/, '');

  // Handle N/A websites
  const hasWebsite = candidate.website !== 'N/A';
  
  // Extract URL if formatted as markdown [text](url)
  let cleanUrl = candidate.website;
  const match = candidate.website.match(/\[.*?\]\((.*?)\)/);
  if (match) {
    cleanUrl = match[1];
  } else if (!hasWebsite) {
      cleanUrl = "#";
  } else if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
  }

  return (
    <div className="bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-1 text-left">
      <div className="flex-1">
        <div className="text-sm font-bold text-[#0A2540] flex items-center gap-2">
          <span>{cleanName}</span>
          {isIncumbent && (
             <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide">
                Incumbent
             </span>
          )}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {candidate.office}
        </div>
      </div>
      
      <div className="mt-2 sm:mt-0">
        {hasWebsite ? (
          <a 
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#0A2540] hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            Website <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-400">No Website</span>
        )}
      </div>
    </div>
  );
}
