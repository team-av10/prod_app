// lib/sentinelHubAuth.ts
export async function getSentinelHubToken() {
    const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
    const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
    const tokenUrl = 'https://services.sentinel-hub.com/oauth/token';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
      });
  
      if (!response.ok) {
        console.error('Failed to fetch Sentinel Hub token:', response.status);
        return null;
      }
  
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error fetching Sentinel Hub token:', error);
      return null;
    }
  }