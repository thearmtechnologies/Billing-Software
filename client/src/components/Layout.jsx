import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  FileText,
  Plus,
  Menu,
  X,
  User,
  LogOut,
  Package,
} from "lucide-react";
import { UserContext } from "../context/userContext";
import logoSrc from "../assets/logo.png";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currentUser } = useContext(UserContext);
  const profileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Services", href: "/services", icon: Package },
    { name: "Invoices", href: "/invoices", icon: FileText },
  ];

  if (currentUser?.role === 'admin') {
    navigation.push({ name: "Users", href: "/admin/users", icon: Settings });
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current && !profileRef.current.contains(event.target) &&
        mobileProfileRef.current && !mobileProfileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const businessName =
    currentUser?.businessName ||
    currentUser?.name ||
    "Business";
  const firstLetter = businessName?.charAt(0)?.toUpperCase() || "B";

  /* ── Styles ── */
  const sidebarStyle = {
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
  };

  const navItemBase = {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-smooth)',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.006em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const navItemActive = {
    ...navItemBase,
    background: 'var(--gradient-subtle)',
    color: 'var(--color-primary)',
  };

  const navItemInactive = {
    ...navItemBase,
    color: 'var(--text-secondary)',
  };

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
  };

  const avatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--gradient-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'box-shadow var(--transition-smooth), transform var(--transition-smooth)',
    border: '2px solid transparent',
  };

  const dropdownStyle = {
    position: 'absolute',
    right: 0,
    marginTop: '8px',
    width: '200px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-soft)',
    overflow: 'hidden',
    zIndex: 60,
    padding: '4px',
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: 450,
    color: 'var(--text-primary)',
    textDecoration: 'none',
    transition: 'background var(--transition-smooth)',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} className="lg:hidden">
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              transition: 'opacity var(--transition-smooth)',
            }}
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transform
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0`}
        style={sidebarStyle}
      >
        {/* Sidebar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            padding: '0 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoSrc} alt="ARM Technologies" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
            <h1
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.022em',
              }}
            >
              ARM Technologies
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '12px 12px', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={active ? navItemActive : navItemInactive}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-secondary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        bottom: '0',
                        width: '3px',
                        background: 'var(--gradient-primary)',
                      }}
                    />
                  )}
                  <Icon
                    style={{
                      width: '18px',
                      height: '18px',
                      color: active
                        ? 'var(--color-primary)'
                        : 'var(--text-secondary)',
                      transition: 'color var(--transition-smooth)',
                      flexShrink: 0,
                    }}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* New Invoice Button */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <Link
            to="/invoices/create"
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar — Glassmorphism */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Title */}
            <div className="lg:hidden flex items-center gap-2">
              <img src={logoSrc} alt="ARM Technologies" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />
              <h1
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Billing Software
              </h1>
            </div>

            <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between">
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                {/* Clean area, title omitted for maximum minimalism, or we can keep it */}
                <h1
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.022em',
                  }}
                >
                  Dashboard Overview
                </h1>
              </div>

              {/* Profile Section */}
              <div style={{ position: 'relative', marginLeft: '16px' }} ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={avatarStyle}
                  title={businessName}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {firstLetter}
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div style={dropdownStyle}>
                    {/* User info */}
                    <div
                      style={{
                        padding: '12px 12px 8px',
                        borderBottom: '1px solid var(--border)',
                        marginBottom: '4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {businessName}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      style={dropdownItemStyle}
                      onClick={() => setProfileOpen(false)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                      Profile Settings
                    </Link>
                    <Link
                      to="/logout"
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    >
                      <LogOut style={{ width: '16px', height: '16px' }} />
                      Logout
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Profile */}
            <div className="lg:hidden" style={{ position: 'relative' }} ref={mobileProfileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ ...avatarStyle, width: '32px', height: '32px', fontSize: '13px' }}
              >
                {firstLetter}
              </button>

              {profileOpen && (
                <div style={dropdownStyle}>
                  <Link
                    to="/profile"
                    style={dropdownItemStyle}
                    onClick={() => setProfileOpen(false)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                    Profile
                  </Link>
                  <Link
                    to="/logout"
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    <LogOut style={{ width: '16px', height: '16px' }} />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
          <div style={{ padding: '32px' }} className="max-sm:!p-4">
            <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;