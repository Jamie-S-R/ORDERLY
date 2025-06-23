import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#4caf50', '#f44336'];

const AccordionSection = ({ title, children }) => (
  <section className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
    <header className="p-3 bg-gray-700 text-white font-semibold cursor-pointer">
      ▼ {title}
    </header>
    <div className="p-4 bg-gray-800">{children}</div>
  </section>
);

const Termintreue = ({ orders = [] }) => {
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const filteredOrders = useMemo(() =>
    orders.filter(order =>
      selectedSupplier ? order.Lieferant === selectedSupplier : true
    ), [orders, selectedSupplier]);

  const termintreueData = useMemo(() => {
    const monthData = {};
    const formatMonth = (date) => new Date(date).toISOString().slice(0, 7);

    filteredOrders.forEach(order => {
      const month = formatMonth(order.TatsächlichesLieferdatum);
      if (!monthData[month]) {
        monthData[month] = {
          month,
          Pünktlich: 0,
          Verspätet: 0,
          Gesamt: 0,
          GesamtVerspätungstage: 0
        };
      }

      const geplant = new Date(order.GeplantesLieferdatum);
      const tatsaechlich = new Date(order.TatsächlichesLieferdatum);
      const verspaetung = (tatsaechlich - geplant) / (1000 * 60 * 60 * 24);

      if (tatsaechlich <= geplant) {
        monthData[month].Pünktlich += 1;
      } else {
        monthData[month].Verspätet += 1;
        monthData[month].GesamtVerspätungstage += verspaetung;
      }

      monthData[month].Gesamt += 1;
    });

    return Object.values(monthData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        ...d,
        Pünktlichkeitsrate: ((d.Pünktlich / d.Gesamt) * 100).toFixed(1),
        DurchschnittlicheVerspätung: d.Verspätet > 0
          ? (d.GesamtVerspätungstage / d.Verspätet).toFixed(1)
          : 0
      }));
  }, [filteredOrders]);

  const pieData = useMemo(() => {
    let p = 0, v = 0;
    filteredOrders.forEach(order => {
      const geplant = new Date(order.GeplantesLieferdatum);
      const tatsaechlich = new Date(order.TatsächlichesLieferdatum);
      if (tatsaechlich <= geplant) p++;
      else v++;
    });
    return [
      { name: 'Pünktlich', value: p },
      { name: 'Verspätet', value: v }
    ];
  }, [filteredOrders]);

  const lieferanten = [...new Set(orders.map(o => o.Lieferant))];

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">📊 Liefertermintreue</h2>

      <div className="mb-6">
        <label className="flex items-center text-white">
          Lieferant:
          <select
            value={selectedSupplier}
            onChange={e => setSelectedSupplier(e.target.value)}
            className="ml-2 p-2 bg-gray-700 text-white rounded-lg"
          >
            <option value="">Alle</option>
            {lieferanten.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <AccordionSection title="Pünktlich vs. Verspätet">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={termintreueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#ccc" />
            <YAxis allowDecimals={false} stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey="Pünktlich" stackId="a" fill="#4caf50" />
            <Bar dataKey="Verspätet" stackId="a" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Pünktlichkeitsrate (%)">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={termintreueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#ccc" />
            <YAxis unit="%" stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Pünktlichkeitsrate" stroke="#2196f3" name="Pünktlichkeitsrate (%)" />
          </LineChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Ø Verspätung (Tage)">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={termintreueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey="DurchschnittlicheVerspätung" fill="#ffc107" name="Ø Verspätung (Tage)" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Aktuelle Verteilung (Tortendiagramm)">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </AccordionSection>
    </div>
  );
};

export default Termintreue;