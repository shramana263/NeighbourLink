// Replaced with a minimal Node script that fetches the endpoint and saves JSON to disk.
// Usage: node helpter.js [tok] [eventName] [outFile]
// Example: node helpter.js mytoken "My Event" ./pandalData.json

import fs from 'node:fs/promises'
import { URL, URLSearchParams } from 'node:url';
async function fetchAndSaveJSON({ tok = null, event = null, outFile = 'pandalData.json' } = {}) {
    const base = 'https://geobums.com/api/getData';
    const url = new URL(base);
    const params = new URLSearchParams();
    if (tok) params.set('tok', tok);
    // else params.set('logout', ''); // mimic previous behavior when no token
    if (event) params.set('event', event);
    url.search = params.toString();

    console.log('Fetching:', url.toString());

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const text = await res.text();

    // Try to parse JSON; if it fails, save raw text under "raw" key
    let out;
    try {
        out = JSON.parse(text);
    } catch {
        out = { raw: text };
    }

    await fs.writeFile(outFile, JSON.stringify(out, null, 2), 'utf8');
    console.log('Saved data to', outFile);
    return out;
}

    const [, , tokArg, eventArg, outFileArg] = process.argv;
    fetchAndSaveJSON({ tok: tokArg || null, event: eventArg || null, outFile: outFileArg || 'pandalData.json' })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
