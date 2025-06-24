import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const EngpaessePreview = ({ orders = [] }) => {
  const data = useMemo(() => {
    const engpaesse = orders.filter(r => r.Engpass === 'True' || r.Engpass === true);
    const map = {};
    engpaesse.forEach(r => {
      const name = r.Lieferant || 'Unbekannt';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([lieferant, count]) => ({ lieferant, count }));
  }, [orders]);

  return (
    <div className="relative w-full h-full">
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 10 }} />
            <YAxis stroke="#ccc" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Bar dataKey="count" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default EngpaessePreview;