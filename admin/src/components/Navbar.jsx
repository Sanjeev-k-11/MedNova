import React, { useContext, useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/doctorContext';
import { StaffContext } from '../context/StaffContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onToggleSidebar }) => {      /* ⬅ receive the toggle prop */
  /* -------------- your existing hooks -------------- */
  const { token, setToken } = useContext(AdminContext);
  const { dtoken, setDtoken } = useContext(DoctorContext);
  const { staffToken, setStaffToken } = useContext(StaffContext);
  const navigate = useNavigate();

  const {
    currentTheme,
    themeOptions,
    showThemeOptions,
    setShowThemeOptions,
    handleTextColorChange,
    handleBgColorChange,
    resetTheme,
  } = useTheme();

  /* -------------- existing state & refs -------------- */
  const [showAdminMenu1, setShowAdminMenu1] = useState(false);
  const [showAdminMenu2, setShowAdminMenu2] = useState(false);
  const [showAdminMenu3, setShowAdminMenu3] = useState(false);

  const themeButtonRef = useRef(null);
  const themePanelRef = useRef(null);
  const adminMenu1ButtonRef = useRef(null);
  const adminMenu1PanelRef = useRef(null);
  const adminMenu2ButtonRef = useRef(null);
  const adminMenu2PanelRef = useRef(null);
  const adminMenu3ButtonRef = useRef(null);
  const adminMenu3PanelRef = useRef(null);

  /* -------------- your link arrays unchanged -------------- */
  const adminLinks = [
    { to: '/add-doctor', icon: assets.add_icon, label: 'Add Doctor' },
    { to: '/staf-add', icon: assets.add_icon, label: 'Staff Add' },
    { to: '/staff-list', icon: assets.list_icon, label: 'Staff List' },
    { to: '/allPatient', icon: assets.people_icon, label: 'All Patient' },
    { to: '/medicine-add', icon: assets.add_icon, label: 'Add Medicine' },
    { to: '/medicine-list', icon: assets.list_icon, label: 'Medicine List' },
    { to: '/purchases', icon: assets.list_icon, label: 'Purchases' },
    { to: '/staf-add', icon: assets.add_icon, label: 'Add Staff' },
    { to: '/staff-list', icon: assets.list_icon, label: 'Staff List' },
  ];
  const adminMenu1Links = adminLinks.slice(0, 3);
  const adminMenu2Links = adminLinks.slice(3, 4).concat(adminLinks.slice(7, 9));
  const adminMenu3Links = adminLinks.slice(4, 7);

  /* -------------- click‑outside & handlers unchanged -------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showThemeOptions &&
        !themeButtonRef.current?.contains(e.target) &&
        !themePanelRef.current?.contains(e.target)
      )
        setShowThemeOptions(false);
      if (
        showAdminMenu1 &&
        !adminMenu1ButtonRef.current?.contains(e.target) &&
        !adminMenu1PanelRef.current?.contains(e.target)
      )
        setShowAdminMenu1(false);
      if (
        showAdminMenu2 &&
        !adminMenu2ButtonRef.current?.contains(e.target) &&
        !adminMenu2PanelRef.current?.contains(e.target)
      )
        setShowAdminMenu2(false);
      if (
        showAdminMenu3 &&
        !adminMenu3ButtonRef.current?.contains(e.target) &&
        !adminMenu3PanelRef.current?.contains(e.target)
      )
        setShowAdminMenu3(false);
    };
    if (showThemeOptions || showAdminMenu1 || showAdminMenu2 || showAdminMenu3)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThemeOptions, showAdminMenu1, showAdminMenu2, showAdminMenu3]);

  const closeAllMenus = () => {
    setShowThemeOptions(false);
    setShowAdminMenu1(false);
    setShowAdminMenu2(false);
    setShowAdminMenu3(false);
  };
  const toggleTheme = () => { const o = !showThemeOptions; closeAllMenus(); setShowThemeOptions(o); };
  const toggleAdminMenu1 = () => { const o = !showAdminMenu1; closeAllMenus(); setShowAdminMenu1(o); };
  const toggleAdminMenu2 = () => { const o = !showAdminMenu2; closeAllMenus(); setShowAdminMenu2(o); };
  const toggleAdminMenu3 = () => { const o = !showAdminMenu3; closeAllMenus(); setShowAdminMenu3(o); };

  const logout = () => {
    token && setToken && (setToken(''), localStorage.removeItem('token'));
    dtoken && setDtoken && (setDtoken(''), localStorage.removeItem('dtoken'));
    staffToken && setStaffToken && (setStaffToken(null), localStorage.removeItem('staffToken'));
    closeAllMenus();
    navigate('/');
  };

  const userType = token ? 'Admin' : dtoken ? 'Doctor' : staffToken ? 'Staff' : 'Guest';
  const isLoggedIn = !!(token || dtoken || staffToken);
  const isAdmin = !!token && !dtoken && !staffToken;

  const dropdownPanelStyle = {
    color: ['#000000', '#1F2937', '#0F172A'].includes(currentTheme.navbarBgColor)
      ? '#FFFFFF'
      : '#1F2937',
    backgroundColor: ['#000000', '#1F2937', '#0F172A'].includes(currentTheme.navbarBgColor)
      ? '#4B5563'
      : '#FFFFFF',
    borderColor: 'rgba(128,128,128,0.3)',
  };

  const renderLinks = (links, close) => (
    <nav className="py-1">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={close}
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 transition"
        >
          {l.icon && <img src={l.icon} alt="" className="w-4 h-4 opacity-70" />}
          {l.label}
        </Link>
      ))}
    </nav>
  );

  /* -------------- JSX -------------- */
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-8 py-1 border-b shadow-md"
      style={{
        backgroundColor: currentTheme.navbarBgColor,
        color: currentTheme.textColor,
        borderColor: currentTheme.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        transition: 'background-color .3s, color .3s, border-color .3s',
      }}
    >
      {/* ---------- LEFT SECTION ---------- */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger: visible only on mobile */}
        {isLoggedIn && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <img
          className="w-24 md:w-28 cursor-pointer"
          src={assets.logo || assets.admin_logo || '/placeholder-logo.png'}
          alt="Logo"
          onClick={() => navigate('/')}
        />

        {isLoggedIn && (
          <p
            className="border px-2 py-0.5 rounded-full text-xs sm:text-sm whitespace-nowrap"
            style={{ borderColor: currentTheme.textColor, color: currentTheme.textColor }}
          >
            {userType}
          </p>
        )}
      </div>

      {/* ---------- CENTER SECTION (admin menus) ---------- */}
      <div className="hidden sm:flex justify-center items-center gap-4">
        {isAdmin && (
          <>
            <div className="relative">
              <button
                ref={adminMenu1ButtonRef}
                onClick={toggleAdminMenu1}
                className="px-3 py-1 rounded text-sm font-medium hover:bg-black/10"
                style={{ color: currentTheme.textColor }}
              >
                Staff
              </button>
              {showAdminMenu1 && (
                <div
                  ref={adminMenu1PanelRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 z-[51] rounded-md shadow-xl border"
                  style={dropdownPanelStyle}
                >
                  {renderLinks(adminMenu1Links, () => setShowAdminMenu1(false))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                ref={adminMenu2ButtonRef}
                onClick={toggleAdminMenu2}
                className="px-3 py-1 rounded text-sm font-medium hover:bg-black/10"
                style={{ color: currentTheme.textColor }}
              >
                Personnel
              </button>
              {showAdminMenu2 && (
                <div
                  ref={adminMenu2PanelRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 z-[51] rounded-md shadow-xl border"
                  style={dropdownPanelStyle}
                >
                  {renderLinks(adminMenu2Links, () => setShowAdminMenu2(false))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                ref={adminMenu3ButtonRef}
                onClick={toggleAdminMenu3}
                className="px-3 py-1 rounded text-sm font-medium hover:bg-black/10"
                style={{ color: currentTheme.textColor }}
              >
                Inventory
              </button>
              {showAdminMenu3 && (
                <div
                  ref={adminMenu3PanelRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 z-[51] rounded-md shadow-xl border"
                  style={dropdownPanelStyle}
                >
                  {renderLinks(adminMenu3Links, () => setShowAdminMenu3(false))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                resetTheme();
                closeAllMenus();
              }}
              className="px-4 py-1 rounded text-sm font-medium hover:bg-black/10"
              style={{ color: currentTheme.textColor }}
            >
              Reset Theme
            </button>
          </>
        )}
      </div>

      {/* ---------- RIGHT SECTION ---------- */}
      <div className="flex items-center gap-3 sm:gap-4">
        {isLoggedIn && (
          <div className="relative">
            <button
                            ref={themeButtonRef}
                            onClick={toggleTheme} // Use toggleTheme to close other menus
                            className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition duration-200"
                            title="Customize Theme"
                            style={{ color: currentTheme.textColor }}
                        >
                            <img src={assets.palette_icon || assets.patients_icons || '/theme-icon.svg'} alt="Customize Theme" className="w-5 h-5" />
                         </button>
            {showThemeOptions && (
              <div
                ref={themePanelRef}
                className="absolute top-full right-0 mt-2 w-64 z-50 p-4 rounded-md shadow-xl border space-y-3"
                style={dropdownPanelStyle}
              >
                {/* ---- theme picker content unchanged ---- */}
                <div>
                  <p className="text-xs font-semibold mb-1">Text Color:</p>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions?.textColors?.map((c) => (
                      <button
                        key={'text-' + c}
                        onClick={() => handleTextColorChange(c)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          currentTheme.textColor === c
                            ? 'ring-2 ring-offset-1 ring-current scale-110'
                            : 'border-gray-400'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Main Background:</p>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions?.bgColors?.map((c) => (
                      <button
                        key={'bg-main-' + c}
                        onClick={() => handleBgColorChange(c, 'main')}
                        className={`w-6 h-6 rounded-full border-2 ${
                          currentTheme.bgColor === c
                            ? 'ring-2 ring-offset-1 ring-current scale-110'
                            : 'border-gray-400'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Sidebar Background:</p>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions?.bgColors?.map((c) => (
                      <button
                        key={'bg-sidebar-' + c}
                        onClick={() => handleBgColorChange(c, 'sidebar')}
                        className={`w-6 h-6 rounded-full border-2 ${
                          currentTheme.sidebarBgColor === c
                            ? 'ring-2 ring-offset-1 ring-current scale-110'
                            : 'border-gray-400'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Navbar Background:</p>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions?.bgColors?.map((c) => (
                      <button
                        key={'bg-navbar-' + c}
                        onClick={() => handleBgColorChange(c, 'navbar')}
                        className={`w-6 h-6 rounded-full border-2 ${
                          currentTheme.navbarBgColor === c
                            ? 'ring-2 ring-offset-1 ring-current scale-110'
                            : 'border-gray-400'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={resetTheme}
                  className="text-xs w-full px-2 py-1 rounded border mt-3 hover:bg-black/10"
                >
                  Reset to Default
                </button>
              </div>
            )}
          </div>
        )}

        {isLoggedIn && (
          <button
            onClick={logout}
            className="text-xs sm:text-sm px-4 py-1.5 rounded-full transition"
            style={{
              backgroundColor:
                currentTheme.textColor === '#FFFFFF'
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(0,0,0,0.6)',
              color:
                currentTheme.textColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
