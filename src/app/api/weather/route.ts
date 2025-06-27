// app/api/weather/route.ts  <--- Important:  Placed in app/api
import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url); // Use URL to get searchParams
  const location = searchParams.get('location');

  if (!location || typeof location !== 'string') {
    return NextResponse.json({ error: 'Please provide a location.' }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'OPENWEATHER_API_KEY is not set in environment variables.' }, { status: 500 });
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: location,
        appid: API_KEY,
        units: 'metric',
      },
    });
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    if (error.response) {
      return NextResponse.json(
        { error: `OpenWeatherMap API error: ${error.response.data.message || 'Unknown error'}` },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json({ error: 'No response received from OpenWeatherMap API' }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Error setting up the request: ' + error.message }, { status: 500 });
    }
  }
}
