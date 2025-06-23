import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

const LagerverlaufPreview = ({ orders = [], outputs = [] }) => {
  const data = useMemo(() => {
    const monthly = {};
    const getMonth = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 7);
    };

    outputs.forEach((o) => {
      const month = getMonth(o.Ausgangsdatum);
      const menge = parseFloat(o.VerbrauchteMenge) || 0;
      if (!month) return;
      monthly[month] = monthly[month] || { month, Verbrauch: 0, Bestellungen: 0 };
      monthly[month].Verbrauch += menge;
    });

    orders.forEach((o) => {
      const month = getMonth(o.Bestelldatum);
      const menge = parseFloat(o.Menge) || 0;
      if (!month) return;
      monthly[month] = monthly[month] || { month, Verbrauch: 0, Bestellungen: 0 };
      monthly[month].Bestellungen += menge;
    });

    const dataArray = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
    return dataArray.length > 0 ? dataArray : [{ month: 'Keine Daten', Verbrauch: 0, Bestellungen: 0 }];
  }, [orders, outputs]);

  return (
    <div className="relative w-full h-full">
      {data.length === 1 && data[0].month === 'Keine Daten' ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#ccc" tick={{ fontSize: 12 }} />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Legend />
            <Line type="monotone" dataKey="Verbrauch" stroke="#ff9800" strokeWidth={2} />
            <Line type="monotone" dataKey="Bestellungen" stroke="#2196f3" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LagerverlaufPreview;