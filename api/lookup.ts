export default async function handler(req: any, res: any) {
  // Add CORS headers just in case Vercel requires them
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const encodedAddress = encodeURIComponent(address as string);
    // Vercel serverless function proxy to the US Census API
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodedAddress}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OKDEMS Candidate Lookup Serverless Helper (nicholasghickman@gmail.com)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Census API returned status ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel Serverless API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
