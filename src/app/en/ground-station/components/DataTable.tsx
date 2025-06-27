interface DataTableProps {
    headers: string[];
    data: any[][];
}

export const DataTable = ({ headers, data }: DataTableProps) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        {headers.map((header, index) => (
                            <th key={index} className="px-6 py-4 text-left font-bold text-lg border-b-2 border-gray-700 border-r border-gray-600">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                                    {typeof cell === 'number' ? cell.toFixed(2) : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};