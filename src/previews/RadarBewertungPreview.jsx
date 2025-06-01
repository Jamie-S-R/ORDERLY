// src/previews/RadarBewertungPreview.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';

const RadarBewertungPreview = () => {
  const [orders, setOrders] = useState([]);
  const [retouren, setRetouren] = useState([]);

  useEffect(() => {
    Papa.parse('/data/bestellungen.csv', {
      header: true,
      download: true,
      complete: (results) => {
        setOrders(results.data.filter(r => r.BestellID));
      }
    });

    Papa.parse('/data/retouren.csv', {
      header: true,
      download: true,
      complete: (results) => {
        setRetouren(results.data.filter(r => r.RetoureID));
      }
    });
  }, []);

  const data = useMemo(() => {
    const lieferanten = [...new Set(orders.map(o => o.Lieferant).filter(Boolean))];
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
        puenktlichkeit: total > 0 ? Number((puenktlich / total * 100).toFixed(1)) : 0,
        lieferdauer: Number(avgLieferdauer.toFixed(1)),
        retouren: relevantRetouren.length,
        engpaesse
      };
    });

    return Object.values(map);
  }, [orders, retouren]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="lieferant" />
        <PolarRadiusAxis />
        <Radar name="Pünktlichkeit (%)" dataKey="puenktlichkeit" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
        <Radar name="Engpässe" dataKey="engpaesse" stroke="#f44336" fill="#f44336" fillOpacity={0.3} />
        <Radar name="Retouren" dataKey="retouren" stroke="#ff9800" fill="#ff9800" fillOpacity={0.3} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default RadarBewertungPreview;
