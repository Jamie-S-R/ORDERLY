import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const RetourenPreview = ({ retouren = [] }) => {
  const data = useMemo(() => {
    const map = {};
    retouren.forEach(r => {
      const name = r.Lieferant || 'Unbekannt';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([lieferant, count]) => ({ lieferant, count }));
  }, [retouren]);

  return (
    <div className="relative w-full h-full">
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 10 }} />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Bar dataKey="count" fill="#ff9800" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RetourenPreview;