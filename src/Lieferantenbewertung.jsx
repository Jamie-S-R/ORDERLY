import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const AccordionSection = ({ title, children }) => (
  <section className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
    <header className="p-3 bg-gray-700 text-white font-semibold cursor-pointer">
      ▼ {title}
    </header>
    <div className="p-4 bg-gray-800">{children}</div>
  </section>
);

const Lieferantenbewertung = ({ orders = [], retouren = [] }) => {
  const lieferanten = useMemo(() => {
    return [...new Set(orders.map(o => o.Lieferant).filter(Boolean))];
  }, [orders]);

  const bewertungen = useMemo(() => {
    const map = {};
    lieferanten.forEach(lieferant => {
      const relevantOrders = orders.filter(o => o.Lieferant === lieferant);
      const relevantRetouren = retouren.filter(r => r.Lieferant === lieferant);
      const total = relevantOrders.length;
      const puenktlich = relevantOrders.filter(o => o.TatsächlichesLieferdatum <= o.GeplantesLieferdatum).length;
      const avgLieferdauer = relevantOrders.reduce((acc, o) => acc + parseInt(o.Lieferdauer || 0), 0) / total;
      const engpaesse = relevantOrders.filter(o => o.Engpass === 'True').length;

      map[lieferant] = {
        lieferant,
        puenktlichkeit: total > 0 ? (puenktlich / total * 100).toFixed(1) : 0,
        lieferdauer: avgLieferdauer.toFixed(1),
        retouren: relevantRetouren.length,
        engpaesse
      };
    });
    return Object.values(map);
  }, [orders, retouren, lieferanten]);

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">📈 Lieferantenbewertung</h2>

      <AccordionSection title="Radar-Diagramm: Vergleich">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={bewertungen}>
            <PolarGrid />
            <PolarAngleAxis dataKey="lieferant" />
            <PolarRadiusAxis />
            <Radar name="Pünktlichkeit (%)" dataKey="puenktlichkeit" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
            <Radar name="Engpässe" dataKey="engpaesse" stroke="#f44336" fill="#f44336" fillOpacity={0.3} />
            <Radar name="Retouren" dataKey="retouren" stroke="#ff9800" fill="#ff9800" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Durchschnittliche Lieferdauer">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bewertungen}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: 'Tage', angle: -90, position: 'insideLeft' }} stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey="lieferdauer" fill="#2196f3" name="Ø Lieferdauer (Tage)" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Detailtabelle">
        <table className="w-full text-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left border-b border-gray-500">Lieferant</th>
              <th className="p-2 text-right border-b border-gray-500">Pünktlich (%)</th>
              <th className="p-2 text-right border-b border-gray-500">Ø Lieferdauer</th>
              <th className="p-2 text-right border-b border-gray-500">Retouren</th>
              <th className="p-2 text-right border-b border-gray-500">Engpässe</th>
            </tr>
          </thead>
          <tbody>
            {bewertungen.map((b, i) => (
              <tr key={i} className="hover:bg-gray-700">
                <td className="p-2 border-b border-gray-600">{b.lieferant}</td>
                <td className="p-2 text-right border-b border-gray-600">{b.puenktlichkeit}</td>
                <td className="p-2 text-right border-b border-gray-600">{b.lieferdauer}</td>
                <td className="p-2 text-right border-b border-gray-600">{b.retouren}</td>
                <td className="p-2 text-right border-b border-gray-600">{b.engpaesse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AccordionSection>
    </div>
  );
};

export default Lieferantenbewertung;