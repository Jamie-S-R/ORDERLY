import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaClipboardList, FaCommentDots,
  FaCogs, FaQuestionCircle, FaChartLine, FaClock,
  FaUndoAlt, FaTruckLoading, FaEuroSign, FaStarHalfAlt,
  FaChevronDown, FaChevronRight
} from 'react-icons/fa';

const SidebarSection = ({ title, icon, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="sidebar-section">
      <div className="sidebar-header" onClick={() => setOpen(!open)}>
        {icon} <span className="label" style={{ marginLeft: 10 }}>{title}</span>
        <span style={{ marginLeft: 'auto' }}>{open ? <FaChevronDown /> : <FaChevronRight />}</span>
      </div>
      {open && <ul className="sidebar-submenu">{children}</ul>}
    </div>
  );
};

const Sidebar = () => (
  <div className="sidebar sidebar--open">
    <SidebarSection title="Dashboard" icon={<FaHome />}>
      <li><NavLink to="/" className="sidebar-link">Startseite</NavLink></li>
    </SidebarSection>

    <SidebarSection title="Lagerverwaltung" icon={<FaBoxOpen />}>
      <li><NavLink to="/orderlog" className="sidebar-link">📦 Bestelllog</NavLink></li>
      <li><NavLink to="/outputlog" className="sidebar-link">📤 Ausgänge</NavLink></li>
      <li><NavLink to="/lagerverlauf" className="sidebar-link">📊 Lagerverlauf</NavLink></li>
    </SidebarSection>

    <SidebarSection title="Automatisierung" icon={<FaCogs />}>
      <li><NavLink to="/automatisierung" className="sidebar-link">⚙️ Automatisierung</NavLink></li>
    </SidebarSection>

    <SidebarSection title="Analyse & Reporting" icon={<FaChartLine />}>
      <li><NavLink to="/termintreue" className="sidebar-link">⏱️ Termintreue</NavLink></li>
      <li><NavLink to="/retouren" className="sidebar-link">🔁 Retouren</NavLink></li>
      <li><NavLink to="/engpaesse" className="sidebar-link">🚧 Engpässe</NavLink></li>
      <li><NavLink to="/lager-finanz" className="sidebar-link">💶 Finanzen</NavLink></li>
    </SidebarSection>

    <SidebarSection title="Lieferanten" icon={<FaStarHalfAlt />}>
      <li><NavLink to="/lieferantenbewertung" className="sidebar-link">⭐ Bewertung</NavLink></li>
    </SidebarSection>

    <SidebarSection title="Support & Feedback" icon={<FaQuestionCircle />}>
      <li><NavLink to="/feedback" className="sidebar-link">📝 Feedback</NavLink></li>
      <li><NavLink to="/help" className="sidebar-link">📘 Hilfe</NavLink></li>
    </SidebarSection>
  </div>
);

export default Sidebar;
