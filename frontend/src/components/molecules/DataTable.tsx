import { ReactNode } from 'react';

interface Column<T> {
    header: string;
    key: keyof T | string;
    render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
}

export default function DataTable<T>({ columns, data, emptyMessage = 'No data available' }: DataTableProps<T>) {
    return (
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] sm:min-w-0 text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100">
                        {columns.map((col, i) => (
                            <th key={i} className="pb-4 text-[10px] uppercase font-bold text-secondary tracking-widest">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.length > 0 ? (
                        data.map((item, i) => (
                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                {columns.map((col, j) => (
                                    <td key={j} className="py-3 sm:py-4 text-sm text-primary">
                                        {col.render ? col.render(item) : (item[col.key as keyof T] as unknown as ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="py-12 text-center text-sm text-secondary italic">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
