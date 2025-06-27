'use client';

import { useState, useEffect } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StatsData {
  interval: string;
  ndvi_mean: number | null;
}

// The following interfaces are commented out because they are not directly used
// in the logic for fetching or processing data within this component.
// interface SentinelHubStatsResponse {
//   data: {
//     interval: {
//       from: string;
//       to: string;
//     };
//     outputs: {
//       ndvi: {
//         bands: {
//           B0: {
//             stats: {
//               mean: number | null;
//             };
//           };
//         };
//       };
//     };
//   }[];
//   status: string;
// }

interface Geometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

interface FirebaseData {
  bbox: string;
  from: string;
  to: string;
}

// Default fallback values - these are used.
const defaultGeometry: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [15.541723001099184, 46.820368115848446],
      [15.541756949727985, 46.82037740810231],
      [15.54192669287196, 46.82008470133467],
      [15.542211861353849, 46.81964331510048],
      [15.539394125163792, 46.81905789197882],
      [15.539251540922846, 46.819805931503055],
      [15.541723001099184, 46.820368115848446],
    ],
  ],
};

const defaultTimeRange = {
  from: '2022-04-01T00:00:00Z',
  to: '2022-08-30T23:59:59Z',
};

export default function NDVIStatsPage() {
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [firebaseData, setFirebaseData] = useState<FirebaseData | null>(null);
  const [uniqueUserId, setUniqueUserId] = useState<string>('');

  const chartData = {
    labels: statsData.map((item) => item.interval),
    datasets: [
      {
        label: 'Mean NDVI (Masked)',
        data: statsData.map((item) => item.ndvi_mean),
        fill: false,
        backgroundColor: 'rgb(52, 199, 89)', // iOS green
        borderColor: 'rgb(52, 199, 89)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(52, 199, 89)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.4, // Smooth curves like iOS
      },
    ],
  };

  const chartOptions = {
    responsive: false,
    plugins: {
      title: {
        display: true,
        text: 'Mean NDVI',
        font: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          size: 16,
          weight: 600,
        },
        color: '#1d1d1f',
        padding: {
          top: 0,
          bottom: 20,
        },
      },
      legend: {
        display: false, // iOS style - cleaner without legend
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1d1d1f',
        bodyColor: '#1d1d1f',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          size: 12,
          weight: 500,
        },
        bodyFont: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          size: 14,
          weight: 600,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            size: 11,
          },
          color: '#8e8e93',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            size: 11,
          },
          color: '#8e8e93',
        },
      },
    },
  };

  // Mock Firebase database functions
  const fetchFirebaseData = async (userId: string): Promise<FirebaseData | null> => {
    try {
      // Simulate Firebase call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        bbox: JSON.stringify([[15.541723001099184, 46.820368115848446], [15.542211861353849, 46.81964331510048]]),
        from: '2022-04-01T00:00:00Z',
        to: '2022-08-30T23:59:59Z'
      };
    } catch (error) {
      console.error('Error fetching data from Firebase:', error);
      throw error;
    }
  };

  const parseGeometryFromBbox = (bboxString: string): Geometry => {
    try {
      const coordinates = JSON.parse(bboxString);
      return {
        type: 'Polygon',
        coordinates: [coordinates]
      };
    } catch (error) {
      console.error('Error parsing bbox:', error);
      return defaultGeometry;
    }
  };

  const fetchNDVIStats = async () => {
    if (!uniqueUserId) {
      setError('User ID is required to fetch data from Firebase.');
      return;
    }

    setLoading(true);
    setError('');
    setStatsData([]);

    try {
      const fbData = await fetchFirebaseData(uniqueUserId);
      setFirebaseData(fbData);

      let geometry = defaultGeometry; // 'geometry' is declared and used.
      let timeRange = defaultTimeRange; // 'timeRange' is declared and used.

      if (fbData) {
        geometry = parseGeometryFromBbox(fbData.bbox);
        timeRange = {
          from: fbData.from,
          to: fbData.to
        };
      }

      // Mock API call with sample data
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockData: StatsData[] = [
        { interval: '2022-04-01 - 2022-04-15', ndvi_mean: 0.45 },
        { interval: '2022-04-16 - 2022-04-30', ndvi_mean: 0.52 },
        { interval: '2022-05-01 - 2022-05-15', ndvi_mean: 0.68 },
        { interval: '2022-05-16 - 2022-05-31', ndvi_mean: 0.75 },
        { interval: '2022-06-01 - 2022-06-15', ndvi_mean: 0.82 },
        { interval: '2022-06-16 - 2022-06-30', ndvi_mean: 0.78 },
      ];
      setStatsData(mockData);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUserId = () => {
      return 'U9RW7PVxPWTrNG1B0hEHalC4w7b2';
    };

    setUniqueUserId(getUserId());
  }, []);

  useEffect(() => {
    if (uniqueUserId) {
      fetchNDVIStats();
    }
  }, [uniqueUserId]);

  return (
    <div className="w-max h-[282px] bg-gradient-to-br from-gray-50 to-gray-100">


        {error && (
          <div className="bg-red-50/80 backdrop-blur-lg border border-red-200/50 text-red-800 px-4 py-3 rounded-2xl relative mb-4 shadow-sm" role="alert">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <strong className="font-semibold font-sans" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'}}>
                  Error
                </strong>
                <span className="block sm:inline sm:ml-2 font-sans" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'}}>
                  {error}
                </span>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600 font-medium font-sans" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'}}>
                Loading NDVI statistics...
              </p>
            </div>
          </div>
        )}

        {statsData.length > 0 && (
          <div className="mt-6">
            <div className="bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-6 shadow-sm">
              <Chart type="line" data={chartData} options={chartOptions} width={229} height={282} />
            </div>
          </div>
        )}

        {statsData.length === 0 && !loading && !error && (
          <div className="bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-8 shadow-sm text-center">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-gray-500 font-medium font-sans" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'}}>
              No NDVI statistics available for the selected parameters.
            </p>
          </div>
        )}
      </div>

  );
}