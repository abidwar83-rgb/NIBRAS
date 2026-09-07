import React, { useState, useEffect } from 'react';
import { NavBar } from './components/common/NavBar';
import { Home } from './components/marketplace/Home';
import { BooksMarketplace } from './components/marketplace/BooksMarketplace';
import { BookDetail } from './components/marketplace/BookDetail';
import { CartPage } from './components/marketplace/CartPage';
import { CheckoutPage } from './components/marketplace/CheckoutPage';
import { WishlistPage } from './components/marketplace/WishlistPage';
import { AccountPage } from './components/marketplace/AccountPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Reader } from './components/reader/Reader';
import { AuthModal } from './components/auth/AuthModal';
import { Book, User, CurrencyCode } from './types';
import { api } from './services/api';
import { translations, SupportedLanguage, LanguageConfig, getLanguageConfig } from './i18n/translations';
import { CheckCircle2, ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  // Theme Archetype (Warm Paper)
  const c = {
    paper: "#F7F5EE",
    paper2: "#EFECE1",
    card: "#FFFFFF",
    ink: "#1A1815",
    ink2: "#3C3833",
    inkSoft: "#736D64",
    brass: "#8C5A14",
    brassDark: "#6E460E",
    line: "#DFDBD0",
    good: "#2E6B4F",
    danger: "#9E2A2B",
  };

  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [cart, setCart] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('nibras_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nibras_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Routing State
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [readerBook, setReaderBook] = useState<Book | null>(null);

  // Checkout State
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);

  // Localization State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('INR');

  // Modal State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[currentLang] || translations.en;
  const langConfig: LanguageConfig = getLanguageConfig(currentLang);

  // Sync RTL / LTR dynamically to HTML document
  useEffect(() => {
    document.documentElement.dir = langConfig.dir;
    document.documentElement.lang = currentLang;
  }, [currentLang, langConfig.dir]);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('nibras_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    localStorage.setItem('nibras_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Initial Boot Data Loading
  useEffect(() => {
    bootApp();
  }, []);

  async function bootApp() {
    try {
      // 1. Check existing session
      const meRes = await api.auth.me();
      if (meRes.user) {
        setUser(meRes.user);
        // Load user library
        api.library.get().then(res => setLibrary(res.library || [])).catch(() => {});
      }
    } catch {
      // No active session or guest mode
    }

    try {
      // 2. Fetch books
      const booksRes = await api.books.list();
      setBooks(booksRes.books || []);
    } catch (err) {
      console.error('Failed to load catalog', err);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Cart operations
  const handleAddToCart = (book: Book, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!cart.some(item => item.id === book.id)) {
      setCart(prev => [...prev, book]);
      showToast(`Added "${book.title}" to cart`);
    } else {
      showToast(`"${book.title}" is already in your cart`);
    }
  };

  const handleRemoveFromCart = (bookId: string) => {
    setCart(prev => prev.filter(item => item.id !== bookId));
  };

  // Wishlist operations
  const handleToggleWishlist = (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (wishlist.includes(bookId)) {
      setWishlist(prev => prev.filter(id => id !== bookId));
      showToast('Removed from wishlist');
    } else {
      setWishlist(prev => [...prev, bookId]);
      showToast('Saved to wishlist');
    }
  };

  // Navigation handlers
  const handleNavigate = (page: string, params?: any) => {
    if (params?.category) {
      setSelectedCategory(params.category);
    }
    if (params?.search) {
      setSearchQuery(params.search);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentPage('book-detail');
    window.scrollTo(0, 0);
  };

  const handleBuyNow = (book: Book) => {
    if (!cart.some(item => item.id === book.id)) {
      setCart([book]);
    }
    setCurrentPage('checkout');
    window.scrollTo(0, 0);
  };

  const handleOpenReader = (book: Book) => {
    setReaderBook(book);
    setCurrentPage('reader');
    window.scrollTo(0, 0);
  };

  const handleProceedToCheckout = (discountPercent: number, couponCode?: string) => {
    setAppliedDiscount(discountPercent);
    setAppliedCouponCode(couponCode);
    setCurrentPage('checkout');
    window.scrollTo(0, 0);
  };

  const handlePaymentSuccess = async (orderId: string) => {
    // Clear cart
    setCart([]);
    // Reload user library
    try {
      const libRes = await api.library.get();
      setLibrary(libRes.library || []);
    } catch {}
    showToast('Payment successful! Added to My Library');
    setCurrentPage('library');
    window.scrollTo(0, 0);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setShowAuthModal(false);
    showToast(`Welcome back, ${authenticatedUser.name}`);
    api.library.get().then(res => setLibrary(res.library || [])).catch(() => {});
  };

  const handleSignOut = () => {
    api.auth.logout();
    setUser(null);
    setLibrary([]);
    showToast('Signed out of Nibras');
    setCurrentPage('home');
  };

  // Compute IDs
  const ownedBookIds = library.map(l => l.bookId);
  const cartBookIds = cart.map(c => c.id);
  const wishlistBooks = books.filter(b => wishlist.includes(b.id));

  // If currently in reader mode, render Reader standalone for full immersive reading
  if (currentPage === 'reader' && readerBook) {
    return (
      <Reader
        book={readerBook}
        onClose={() => setCurrentPage(selectedBook ? 'book-detail' : 'library')}
        c={c}
      />
    );
  }

  return (
    <div
      id="nibras-app-root"
      dir={langConfig.dir}
      style={{
        background: c.paper,
        minHeight: "100vh",
        color: c.ink,
        fontFamily: langConfig.fontFamily,
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="global-toast"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: c.ink,
            color: "#F2EFE6",
            padding: "12px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeIn 0.2s ease"
          }}
        >
          <CheckCircle2 size={16} color={c.brass} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navigation */}
      <NavBar
        user={user}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        c={c}
        currentLang={currentLang}
        currentCurrency={currentCurrency}
        onLanguageChange={setCurrentLang}
        onCurrencyChange={setCurrentCurrency}
        onOpenAuth={(tab) => { setAuthInitialTab(tab); setShowAuthModal(true); }}
        onNavigate={handleNavigate}
        activePage={currentPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={["All", "Technology", "Self Improvement", "Business", "AI", "Fiction", "Programming"]}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => { setSelectedCategory(cat); if (currentPage !== 'ebooks') setCurrentPage('ebooks'); }}
        t={t}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        {currentPage === 'home' && (
          <Home
            books={books}
            c={c}
            currency={currentCurrency}
            t={t}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlist}
            cartBookIds={cartBookIds}
          />
        )}

        {currentPage === 'ebooks' && (
          <BooksMarketplace
            books={books}
            c={c}
            currency={currentCurrency}
            t={t}
            onSelectBook={handleSelectBook}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlist}
            cartBookIds={cartBookIds}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentPage === 'book-detail' && selectedBook && (
          <BookDetail
            book={selectedBook}
            onBack={() => setCurrentPage('ebooks')}
            c={c}
            currency={currentCurrency}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenReader={handleOpenReader}
            onToggleWishlist={handleToggleWishlist}
            isInWishlist={wishlist.includes(selectedBook.id)}
            isInCart={cartBookIds.includes(selectedBook.id)}
            isOwned={ownedBookIds.includes(selectedBook.id)}
            user={user}
            onSelectBook={handleSelectBook}
            allBooks={books}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            cartItems={cart}
            c={c}
            currency={currentCurrency}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={handleProceedToCheckout}
            onContinueShopping={() => setCurrentPage('ebooks')}
            ownedBookIds={ownedBookIds}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            items={cart}
            c={c}
            currency={currentCurrency}
            discountPercent={appliedDiscount}
            couponCode={appliedCouponCode}
            user={user}
            onPaymentSuccess={handlePaymentSuccess}
            onBackToCart={() => setCurrentPage('cart')}
            onOpenAuth={() => { setAuthInitialTab('login'); setShowAuthModal(true); }}
          />
        )}

        {currentPage === 'wishlist' && (
          <WishlistPage
            books={wishlistBooks}
            c={c}
            currency={currentCurrency}
            onSelectBook={handleSelectBook}
            onAddToCart={handleAddToCart}
            onRemoveFromWishlist={handleToggleWishlist}
            onContinueShopping={() => setCurrentPage('ebooks')}
          />
        )}

        {currentPage === 'library' && user && (
          <AccountPage
            user={user}
            c={c}
            currency={currentCurrency}
            allBooks={books}
            onOpenReader={handleOpenReader}
            onSignOut={handleSignOut}
            onExploreStore={() => setCurrentPage('ebooks')}
          />
        )}

        {currentPage === 'library' && !user && (
          <div style={{ padding: "80px 20px", textAlign: "center", minHeight: "70vh" }}>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
              Sign In to View Your Library
            </h2>
            <p style={{ fontSize: 14, color: c.inkSoft, margin: "0 0 20px" }}>
              Access your authorized digital books and synchronized reader annotations.
            </p>
            <button
              onClick={() => { setAuthInitialTab('login'); setShowAuthModal(true); }}
              style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: c.brass, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Sign In
            </button>
          </div>
        )}

        {currentPage === 'admin' && (
          <AdminDashboard
            c={c}
            currency={currentCurrency}
          />
        )}
      </div>

      {/* Global Footer */}
      <footer
        id="nibras-global-footer"
        style={{
          background: c.paper2,
          borderTop: `1px solid ${c.line}`,
          padding: "50px 20px 40px",
          marginTop: "auto"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.brass }} />
                <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, color: c.ink, letterSpacing: "-0.5px" }}>
                  NIBRAS
                </span>
              </div>
              <p style={{ fontSize: 13, color: c.inkSoft, lineHeight: 1.6, margin: 0 }}>
                A thoughtful digital marketplace for eBooks with integrated in-browser reader and conversational AI tutoring.
              </p>
            </div>

            <div>
              <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 700, color: c.ink, margin: "0 0 12px" }}>
                Catalog
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: c.inkSoft }}>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('ebooks', { category: 'Technology' })}>Technology</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('ebooks', { category: 'Programming' })}>Programming</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('ebooks', { category: 'AI' })}>AI & Machine Learning</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('ebooks', { category: 'Business' })}>Business & Finance</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 700, color: c.ink, margin: "0 0 12px" }}>
                Reader Tools
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: c.inkSoft }}>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('library')}>My Digital Shelf</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('wishlist')}>Wishlist</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('cart')}>Shopping Cart</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleNavigate('admin')}>Publisher Operations</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 700, color: c.ink, margin: "0 0 12px" }}>
                Guarantees
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: c.inkSoft }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={14} color={c.good} />
                  <span>Licensed Watermarked Copies</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color={c.brass} />
                  <span>Gemini 3.8 AI Assistant</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={14} color={c.inkSoft} />
                  <span>Distraction-free In-Browser Reader</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${c.line}`, paddingTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12, color: c.inkSoft }}>
            <div>
              © {new Date().getFullYear()} NIBRAS Publishing & Technology. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span>Privacy</span>
              <span>Terms</span>
              <span>Digital Rights</span>
              <span>Publish With Us</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          initialTab={authInitialTab}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          c={c}
        />
      )}
    </div>
  );
}
