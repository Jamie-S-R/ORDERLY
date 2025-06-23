import React from 'react';
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
import { FaCamera } from 'react-icons/fa';

const categories = [
  {
    title: 'Scannen', // Änderung: Emoji entfernt
    icon: FaCamera,
    links: [
      { to: '/live-scannen', label: 'Live-Scannen', icon: FaCamera },
    ],
  },
  {
    title: 'Automatisierung', // Änderung: Automatisierung nach oben verschoben
    icon: FaCogs,
    links: [
      { to: '/automatisierung', label: 'Automatisierung', icon: FaCogs },
    ],
  },
  {
    title: 'Allgemein', // Änderung: Emoji entfernt
    icon: FaHome,
    links: [
      { to: '/', label: 'Startseite', icon: FaHome },
    ],
  },
  {
    title: 'Daten', // Änderung: Emoji entfernt
    icon: FaClipboardList,
    links: [
      { to: '/orderlog', label: 'Bestelllog', icon: FaClipboardList },
      { to: '/outputlog', label: 'Ausgänge', icon: FaBoxOpen },
    ],
  },
  {
    title: 'Analyse', // Änderung: Emoji entfernt
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
];

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const location = useLocation();

  return (
    <div
      className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
      onMouseEnter={() => !isMobile && setIsOpen(true)}
      onMouseLeave={() => !isMobile && setIsOpen(false)}
    >
      <div className="sidebar-content">
        <ul className="sidebar-main">
          {isOpen ? (
            categories.map((category, index) => {
              const isCategoryActive = category.links.some(link => location.pathname === link.to);
              return (
                <React.Fragment key={index}>
                  <li className={`sidebar-category ${isCategoryActive ? 'active-category' : ''}`}>
                    {category.title}
                  </li>
                  {category.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <NavLink
                        to={link.to}
                        end
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        <link.icon className="icon" size={20} />
                        <span className="label">{link.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </React.Fragment>
              );
            })
          ) : (
            categories.map((category, index) => {
              const isCategoryActive = category.links.some(link => location.pathname === link.to);
              return (
                <li key={index} className={`sidebar-icon-only ${isCategoryActive ? 'active-category-collapsed' : ''}`}>
                  <div className="sidebar-icon-only" title={category.title}>
                    <category.icon className="icon" size={20} />
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
      <ul className="sidebar-footer">
        <li>
          <NavLink
            to="/feedback"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <FaCommentDots className="icon" size={20} />
            {isOpen && <span className="label">Feedback</span>}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/help"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <FaQuestionCircle className="icon" size={20} />
            {isOpen && <span className="label">Hilfe</span>}
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;