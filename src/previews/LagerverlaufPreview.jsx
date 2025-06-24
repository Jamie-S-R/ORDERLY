import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const LagerverlaufPreview = ({ orders = [], outputs = [] }) => {
  const monthlyData = useMemo(() => {
    const data = {};
    const formatMonth = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 7);
    };

    orders.forEach(o => {
      const month = formatMonth(o.Bestelldatum);
      if (!month) return;
      if (!data[month]) data[month] = { month, zugang: 0, abgang: 0 };
      data[month].zugang += parseInt(o.Menge || 0);
    });

    outputs.forEach(a => {
      const month = formatMonth(a.Ausgangsdatum);
      if (!month) return;
      if (!data[month]) data[month] = { month, zugang: 0, abgang: 0 };
      data[month].abgang += parseInt(a.VerbrauchteMenge || 0);
    });

    const sorted = Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
    let bestand = 0;
    return sorted.map(d => {
      bestand += (d.zugang || 0) - (d.abgang || 0);
      return { ...d, bestand };
    });
  }, [orders, outputs]);

  return (
    <div className="relative w-full h-full">
      {monthlyData.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#ccc" tick={{ fontSize: 10 }} />
            <YAxis stroke="#ccc" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Bar dataKey="zugang" stackId="a" fill="#4caf50" name="Zugang" />
            <Bar dataKey="abgang" stackId="a" fill="#f44336" name="Abgang" />
            <Line type="monotone" dataKey="bestand" stroke="#2196f3" name="Bestand" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LagerverlaufPreview;