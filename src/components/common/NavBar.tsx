import React, { useState } from 'react';
import {
  BookOpen, Search, Heart, ShoppingBag, Moon, Sun,
  Globe, DollarSign, User as UserIcon, Shield, LogOut, Menu, X
} from 'lucide-react';
import { User, CurrencyCode, LanguageCode } from '../../types';
import { LANGUAGES, TranslationDict } from '../../i18n/translations';

interface NavBarProps {
  c: any;
  mode: "light" | "dark";
  onToggleMode: () => void;
  user: User | null;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  cartCount: number;
  wishlistCount: number;
  currency: CurrencyCode;
  onSelectCurrency: (c: CurrencyCode) => void;
  language: LanguageCode;
  onSelectLanguage: (l: LanguageCode) => void;
  t: TranslationDict;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  c,
  mode,
  onToggleMode,
  user,
  onOpenAuth,
  onLogout,
  currentPage,
  onNavigate,
  cartCount,
  wishlistCount,
  currency,
  onSelectCurrency,
  language,
  onSelectLanguage,
  t,
  searchQuery,
  onSearchChange
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { id: 'home', label: t.home },
    { id: 'ebooks', label: t.ebooks },
    { id: 'wishlist', label: t.wishlist, badge: wishlistCount },
    ...(user ? [{ id: 'account', label: t.myLibrary }] : []),
    ...(user?.role === 'ADMIN' ? [{ id: 'admin', label: t.admin, isSpecial: true }] : [])
  ];

  return (
    <nav
      id="main-navigation"
      style={{
        background: c.paper,
        borderBottom: `1px solid ${c.line}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${c.brass}, ${c.brassDeep})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F2EFE6",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }}
            >
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 21,
                  fontWeight: 700,
                  color: c.ink,
                  letterSpacing: "0.5px",
                  lineHeight: 1.1
                }}
              >
                {t.appName}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: c.inkSoft,
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.3px"
                }}
              >
                {t.tagline}
              </div>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onNavigate(item.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: currentPage === item.id ? 600 : 500,
                  color: currentPage === item.id ? c.brass : c.ink2,
                  background: currentPage === item.id ? `${c.brass}15` : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                {item.id === 'admin' && <Shield size={14} />}
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      background: c.brass,
                      color: "#F2EFE6",
                      borderRadius: 10,
                      padding: "1px 6px",
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="hidden lg:flex items-center"
          style={{
            position: "relative",
            flex: 1,
            maxWidth: 340,
            margin: "0 12px"
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              color: c.inkSoft,
              pointerEvents: "none"
            }}
          />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (currentPage !== 'ebooks' && e.target.value.trim().length > 1) {
                onNavigate('ebooks');
              }
            }}
            placeholder={t.searchPlaceholder}
            style={{
              width: "100%",
              padding: "7px 12px 7px 36px",
              borderRadius: 20,
              border: `1px solid ${c.line}`,
              background: c.paper2,
              color: c.ink,
              fontSize: 13,
              outline: "none",
              transition: "border 0.2s"
            }}
          />
        </div>

        {/* Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Currency Selector */}
          <div style={{ position: "relative" }}>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                border: `1px solid ${c.line}`,
                background: c.paper2,
                color: c.ink2,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
              title="Change Currency"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
              <option value="AED">AED</option>
            </select>
          </div>

          {/* Multilingual Selector */}
          <div style={{ position: "relative" }}>
            <select
              id="language-select"
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                border: `1px solid ${c.line}`,
                background: c.paper2,
                color: c.ink2,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                outline: "none"
              }}
              title="Select Language / زبان منتخب کریں"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Dark / Light Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleMode}
            style={{
              padding: "7px",
              borderRadius: 6,
              border: `1px solid ${c.line}`,
              background: c.paper2,
              color: c.ink2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title={mode === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Wishlist Button */}
          <button
            id="nav-wishlist-btn"
            onClick={() => onNavigate('wishlist')}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${c.line}`,
              background: currentPage === 'wishlist' ? `${c.brass}15` : c.paper2,
              color: currentPage === 'wishlist' ? c.brass : c.ink2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              position: "relative"
            }}
            title={t.wishlist}
          >
            <Heart size={16} fill={wishlistCount > 0 ? c.brass : 'none'} color={wishlistCount > 0 ? c.brass : c.ink2} />
            {wishlistCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.brass
                }}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            id="nav-cart-btn"
            onClick={() => onNavigate('cart')}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: `1px solid ${c.brass}`,
              background: c.brass,
              color: "#F2EFE6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 13
            }}
            title={t.cart}
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">{t.cart}</span>
            <span
              style={{
                background: "rgba(255,255,255,0.25)",
                padding: "1px 6px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {cartCount}
            </span>
          </button>

          {/* User Account / Login */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                id="user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
                  borderRadius: 20,
                  border: `1px solid ${c.line}`,
                  background: c.paper2,
                  color: c.ink,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: user.role === 'ADMIN' ? c.brass : c.ink2,
                    color: "#F2EFE6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
              </button>

              {showUserMenu && (
                <div
                  id="user-dropdown-menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "110%",
                    width: 200,
                    borderRadius: 8,
                    background: c.card,
                    border: `1px solid ${c.line}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    padding: "6px",
                    zIndex: 60
                  }}
                >
                  <div style={{ padding: "8px 12px", borderBottom: `1px solid ${c.line}`, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: c.inkSoft }}>{user.email}</div>
                    <div style={{ fontSize: 10.5, color: c.brass, fontWeight: 700, marginTop: 2 }}>{user.role}</div>
                  </div>
                  <button
                    id="user-menu-library"
                    onClick={() => { onNavigate('account'); setShowUserMenu(false); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 4,
                      background: "none",
                      border: "none",
                      color: c.ink,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <BookOpen size={15} />
                    {t.myLibrary}
                  </button>
                  {user.role === 'ADMIN' && (
                    <button
                      id="user-menu-admin"
                      onClick={() => { onNavigate('admin'); setShowUserMenu(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 4,
                        background: "none",
                        border: "none",
                        color: c.ink,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <Shield size={15} color={c.brass} />
                      {t.admin}
                    </button>
                  )}
                  <button
                    id="user-menu-logout"
                    onClick={() => { onLogout(); setShowUserMenu(false); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 4,
                      background: "none",
                      border: "none",
                      color: c.danger,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <LogOut size={15} />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-signin-btn"
              onClick={() => onOpenAuth('login')}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: `1px solid ${c.line}`,
                background: c.paper2,
                color: c.ink,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <UserIcon size={15} />
              <span>{t.login}</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle-btn"
            className="md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: "6px",
              borderRadius: 6,
              border: `1px solid ${c.line}`,
              background: c.paper2,
              color: c.ink,
              cursor: "pointer"
            }}
          >
            {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden"
          style={{
            background: c.paper,
            borderBottom: `1px solid ${c.line}`,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setShowMobileMenu(false); }}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: 6,
                border: "none",
                background: currentPage === item.id ? `${c.brass}15` : "transparent",
                color: currentPage === item.id ? c.brass : c.ink,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{ background: c.brass, color: "#fff", padding: "1px 6px", borderRadius: 8, fontSize: 11 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};
