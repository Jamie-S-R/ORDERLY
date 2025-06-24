import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';

const RadarBewertungPreview = ({ orders = [], retouren = [] }) => {
  const data = useMemo(() => {
    const lieferanten = [...new Set(orders.map(o => o.Lieferant).filter(Boolean))];
    if (lieferanten.length === 0) return [];

    const map = {};
    lieferanten.forEach(lieferant => {
      const relevantOrders = orders.filter(o => o.Lieferant === lieferant);
      const relevantRetouren = retouren.filter(r => r.Lieferant === lieferant);
      const total = relevantOrders.length;
      const puenktlich = relevantOrders.filter(o => {
        if (!o.TatsächlichesLieferdatum || !o.GeplantesLieferdatum) return false;
        return new Date(o.TatsächlichesLieferdatum) <= new Date(o.GeplantesLieferdatum);
      }).length;
      const avgLieferdauer = relevantOrders.reduce((acc, o) => acc + parseInt(o.Lieferdauer || 0), 0) / total;

      map[lieferant] = {
        lieferant,
        puenktlichkeit: total > 0 ? Number((puenktlich / total * 100).toFixed(1)) : 0,
        lieferdauer: Number(avgLieferdauer.toFixed(1)),
        retouren: relevantRetouren.length,
      };
    });

    return Object.values(map);
  }, [orders, retouren]);

  return (
    <div className="relative w-full h-full">
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="lieferant" stroke="#ccc" tick={{ fontSize: 8 }} />
            <PolarRadiusAxis stroke="#ccc" tick={{ fontSize: 8 }} />
            <Radar name="Pünktlichkeit (%)" dataKey="puenktlichkeit" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
            <Radar name="Retouren" dataKey="retouren" stroke="#ff9800" fill="#ff9800" fillOpacity={0.3} />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RadarBewertungPreview;