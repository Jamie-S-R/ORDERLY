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

const FinanzenPreview = ({ orders = [] }) => {
  const data = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const monat = o.JahrMonat || new Date(o.Bestelldatum).toISOString().slice(0, 7);
      const summe = parseFloat(o.Gesamtpreis || 0);
      map[monat] = (map[monat] || 0) + summe;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monat, ausgabe]) => ({ monat, ausgabe: +ausgabe.toFixed(2) }));
  }, [orders]);

  return (
    <div className="relative w-full h-full">
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="monat" stroke="#ccc" tick={{ fontSize: 10 }} />
            <YAxis stroke="#ccc" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Bar dataKey="ausgabe" fill="#4caf50" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FinanzenPreview;