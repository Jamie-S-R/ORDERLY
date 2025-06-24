import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const TermintreuePreview = ({ orders = [] }) => {
  const data = useMemo(() => {
    const lieferanten = [...new Set(orders.map(o => o.Lieferant).filter(Boolean))];
    if (lieferanten.length === 0) return [];

    return lieferanten.map(lieferant => {
      const relevantOrders = orders.filter(o => o.Lieferant === lieferant);
      const puenktlich = relevantOrders.filter(o => {
        if (!o.TatsächlichesLieferdatum || !o.GeplantesLieferdatum) return false;
        return new Date(o.TatsächlichesLieferdatum) <= new Date(o.GeplantesLieferdatum);
      }).length;
      const verspaetet = relevantOrders.length - puenktlich;
      return { name: lieferant, Pünktlich: puenktlich, Verspätet: verspaetet };
    });
  }, [orders]);

  return (
    <div className="relative w-full h-full">
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#ccc" tick={{ fontSize: 10 }} />
            <YAxis stroke="#ccc" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Bar dataKey="Pünktlich" fill="#4caf50" />
            <Bar dataKey="Verspätet" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TermintreuePreview;