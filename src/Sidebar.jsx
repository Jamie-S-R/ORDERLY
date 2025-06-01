import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBoxOpen,
  FaClipboardList,
  FaCommentDots,
  FaCogs,
  FaQuestionCircle,
  FaChartLine,
  FaClock,
  FaUndoAlt,
  FaTruckLoading,
  FaEuroSign,
  FaStarHalfAlt
} from 'react-icons/fa';

const categories = [
  {
    title: '🏠 Allgemein',
    icon: FaHome,
    links: [
      { to: '/', label: 'Startseite', icon: FaHome },
    ],
  },
  {
    title: '📋 Daten',
    icon: FaClipboardList,
    links: [
      { to: '/orderlog', label: 'Bestelllog', icon: FaClipboardList },
      { to: '/outputlog', label: 'Ausgänge', icon: FaBoxOpen },
    ],
  },
  {
    title: '📊 Analyse',
    icon: FaChartLine,
    links: [
      { to: '/lagerverlauf', label: 'Lagerverlauf', icon: FaChartLine },
      { to: '/termintreue', label: 'Termintreue', icon: FaClock },
      { to: '/retouren', label: 'Retouren', icon: FaUndoAlt },
      { to: '/engpaesse', label: 'Engpässe', icon: FaTruckLoading },
      { to: '/finanzen', label: 'Finanzen', icon: FaEuroSign },
      { to: '/lieferantenbewertung', label: 'Bewertung', icon: FaStarHalfAlt },

    ],
  },
  {
    title: '⚙️ Verwaltung',
    icon: FaCogs,
    links: [
      { to: '/automatisierung', label: 'Automatisierung', icon: FaCogs },
    ],
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div
      className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="sidebar-content">
        <ul className="sidebar-main">
          {isOpen ? (
            // 👉 Offene Sidebar: mit NavLinks & Aktivitätslogik
            categories.map((category, index) => {
              const isCategoryActive = category.links.some(link => location.pathname === link.to);
              return (
                <React.Fragment key={index}>
                  <li className="sidebar-category">
                    {category.title}
                  </li>
                  {category.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <NavLink
                        to={link.to}
                        end
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      >
                        <link.icon className="icon" />
                        <span className="label">{link.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </React.Fragment>
              );
            })
          ) : (
            // 👉 Eingeklappte Sidebar: Nur Icons, keine NavLinks
            categories.map((category, index) => {
              const isCategoryActive = category.links.some(link => location.pathname === link.to);
              return (
                <li key={index} className={isCategoryActive ? 'active-category-collapsed' : ''}>
                  <div className="sidebar-icon-only" title={category.title}>
                    <category.icon className="icon" />
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <ul className="sidebar-footer">
        <li>
          <NavLink to="/feedback" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FaCommentDots className="icon" />
            {isOpen && <span className="label">Feedback</span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/help" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FaQuestionCircle className="icon" />
            {isOpen && <span className="label">Hilfe</span>}
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
