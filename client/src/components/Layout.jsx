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
    background: '#FBFBFD',
    borderRight: '1px solid var(--border, #E5E5E7)',
  };

  const navItemBase = {
    padding: '10px 12px',
    borderRadius: '10px',
    transition: 'all 200ms ease',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.006em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    position: 'relative',
  };

  const navItemActive = {
    ...navItemBase,
    background: 'var(--accent-light, #EFF6FF)',
    color: 'var(--accent, #0071E3)',
  };

  const navItemInactive = {
    ...navItemBase,
    color: 'var(--text-secondary, #6E6E73)',
  };

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid var(--border, #E5E5E7)',
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
    background: 'var(--accent, #0071E3)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'box-shadow 200ms ease, transform 200ms ease',
    border: '2px solid transparent',
    letterSpacing: '0',
  };

  const dropdownStyle = {
    position: 'absolute',
    right: 0,
    marginTop: '8px',
    width: '200px',
    background: 'var(--surface, #FFFFFF)',
    border: '1px solid var(--border, #E5E5E7)',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    zIndex: 60,
    padding: '4px',
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 450,
    color: 'var(--text-primary, #1D1D1F)',
    textDecoration: 'none',
    transition: 'background 150ms ease',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
  };

  const newInvoiceBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'var(--accent, #0071E3)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'all 200ms ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 113, 227, 0.3)',
    letterSpacing: '-0.006em',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page, #F7F7F8)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} className="lg:hidden">
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              transition: 'opacity 200ms ease',
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
            borderBottom: '1px solid var(--border, #E5E5E7)',
          }}
        >
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary, #1D1D1F)',
              letterSpacing: '-0.022em',
            }}
          >
            ARM Technologies
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-tertiary, #86868B)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '12px 12px', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                      e.currentTarget.style.background = 'var(--border-light, #F0F0F2)';
                      e.currentTarget.style.color = 'var(--text-primary, #1D1D1F)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary, #6E6E73)';
                    }
                  }}
                >
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '20px',
                        borderRadius: '0 3px 3px 0',
                        background: 'var(--accent, #0071E3)',
                      }}
                    />
                  )}
                  <Icon
                    style={{
                      width: '18px',
                      height: '18px',
                      color: active
                        ? 'var(--accent, #0071E3)'
                        : 'var(--text-tertiary, #86868B)',
                      transition: 'color 200ms ease',
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
            borderTop: '1px solid var(--border, #E5E5E7)',
          }}
        >
          <Link
            to="/invoices/create"
            style={newInvoiceBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover, #0077ED)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 113, 227, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent, #0071E3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 113, 227, 0.3)';
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
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
                color: 'var(--text-secondary, #6E6E73)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Title */}
            <h1
              className="lg:hidden"
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-primary, #1D1D1F)',
                letterSpacing: '-0.022em',
              }}
            >
              Billing Software
            </h1>

            <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between">
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <h1
                  style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--text-primary, #1D1D1F)',
                    letterSpacing: '-0.022em',
                  }}
                >
                  Multi-Domain Billing System
                </h1>
              </div>

              {/* Profile Section */}
              <div style={{ position: 'relative', marginLeft: '16px' }} ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={avatarStyle}
                  title={businessName}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.2)';
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
                        borderBottom: '1px solid var(--border, #E5E5E7)',
                        marginBottom: '4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary, #1D1D1F)',
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
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-light, #F0F0F2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                      Profile Settings
                    </Link>
                    <Link
                      to="/logout"
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary, #1D1D1F)'; }}
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
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-light, #F0F0F2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                    Profile
                  </Link>
                  <Link
                    to="/logout"
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary, #1D1D1F)'; }}
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