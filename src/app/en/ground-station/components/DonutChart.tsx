import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
    value: number;
    maxValue: number;
    label: string;
    color: string;
}

export const DonutChart = ({ value, maxValue, label, color }: DonutChartProps) => {
    const percentage = (value / maxValue) * 100;

    const data: ChartData<"doughnut"> = {
        labels: [label, ''],
        datasets: [
            {
                data: [percentage, 100 - percentage],
                backgroundColor: [color, '#e2e8f0'],
                borderWidth: 0,
            },
        ],
    };

    const options = {
        cutout: '70%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div className="relative h-48 w-48">
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{value}</span>
                <span className="text-sm text-gray-500">{label}</span>
            </div>
        </div>
    );
}; 