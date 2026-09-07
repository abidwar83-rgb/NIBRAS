import React, { useState } from 'react';
import { Search, Sparkles, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Book, CurrencyCode } from '../../types';
import { BookCard } from './BookCard';
import { TranslationDict } from '../../i18n/translations';
import { api } from '../../services/api';

interface BooksMarketplaceProps {
  books: Book[];
  c: any;
  currency: CurrencyCode;
  t: TranslationDict;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book, e: React.MouseEvent) => void;
  onToggleWishlist: (bookId: string, e: React.MouseEvent) => void;
  wishlistIds: string[];
  cartBookIds: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const BooksMarketplace: React.FC<BooksMarketplaceProps> = ({
  books,
  c,
  currency,
  t,
  onSelectBook,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  cartBookIds,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // AI Semantic Search State
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [aiSemanticQuery, setAiSemanticQuery] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<Array<{ id: string; reason: string }> | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  const categories = [
    "All",
    "Technology",
    "Programming",
    "AI",
    "Business",
    "Finance",
    "Education",
    "Self Improvement",
    "Fiction",
    "Romance",
    "Mystery",
    "Academic",
    "Children's Books"
  ];

  const handleAiSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSemanticQuery.trim()) return;
    setAiSearchLoading(true);

    try {
      const res = await api.ai.semanticSearch(aiSemanticQuery.trim());
      setAiSearchResults(res.matches);
    } catch (err) {
      console.error('AI search failed', err);
    } finally {
      setAiSearchLoading(false);
    }
  };

  // Filter books
  let filtered = books.filter(b => {
    if (selectedCategory && selectedCategory !== 'All' && b.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (b.price > maxPrice) return false;
    if (minRating > 0 && b.rating < minRating) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = b.title.toLowerCase().includes(q) ||
                    b.author.toLowerCase().includes(q) ||
                    b.tags.some(tag => tag.toLowerCase().includes(q)) ||
                    b.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // If AI Semantic Search matches exist, filter & order by AI matches
  if (aiSearchResults && aiSearchResults.length > 0) {
    const aiIds = aiSearchResults.map(m => m.id);
    filtered = filtered.filter(b => aiIds.includes(b.id));
    filtered.sort((a, b) => aiIds.indexOf(a.id) - aiIds.indexOf(b.id));
  }

  // Sorting
  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'bestselling') filtered.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));

  return (
    <div id="marketplace-view-root" style={{ background: c.paper, minHeight: "100vh", padding: "30px 20px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Marketplace Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 30, fontWeight: 700, color: c.ink, margin: "0 0 6px" }}>
              Explore the Nibras Catalog
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: c.inkSoft }}>
              Showing {filtered.length} of {books.length} curated eBooks
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* AI Search Toggle Button */}
            <button
              id="toggle-ai-search-btn"
              onClick={() => setIsAiSearchActive(!isAiSearchActive)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: `1px solid ${c.brass}`,
                background: isAiSearchActive ? c.brass : `${c.brass}15`,
                color: isAiSearchActive ? "#F2EFE6" : c.brass,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Sparkles size={15} />
              <span>AI Semantic Discovery</span>
            </button>

            {/* Mobile Filter Toggle */}
            <button
              className="md:hidden"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: `1px solid ${c.line}`,
                background: c.paper2,
                color: c.ink,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* AI Semantic Query Bar */}
        {isAiSearchActive && (
          <div
            id="ai-search-banner"
            style={{
              background: c.card,
              border: `1px solid ${c.brass}`,
              borderRadius: 10,
              padding: "18px 20px",
              marginBottom: 24,
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color={c.brass} />
              <span style={{ fontSize: 13, fontWeight: 700, color: c.brass, textTransform: "uppercase" }}>
                AI Semantic Concept Matching
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: c.ink2 }}>
              Describe what skill, conceptual framework, or outcome you are seeking in natural language:
            </p>
            <form onSubmit={handleAiSemanticSearch} style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={aiSemanticQuery}
                onChange={(e) => setAiSemanticQuery(e.target.value)}
                placeholder="e.g., 'A practical guide to overcoming cognitive biases in financial decisions' or 'Rust memory management'"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: `1px solid ${c.line}`,
                  background: c.paper,
                  color: c.ink,
                  fontSize: 13,
                  outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={aiSearchLoading}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "none",
                  background: c.brass,
                  color: "#F2EFE6",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: aiSearchLoading ? "not-allowed" : "pointer"
                }}
              >
                {aiSearchLoading ? "Searching..." : "Search with Gemini"}
              </button>
              {aiSearchResults && (
                <button
                  type="button"
                  onClick={() => { setAiSearchResults(null); setAiSemanticQuery(''); }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: `1px solid ${c.line}`,
                    background: "transparent",
                    color: c.inkSoft,
                    cursor: "pointer"
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        )}

        {/* Layout: Sidebar Filters + Books Grid */}
        <div style={{ display: "flex", gap: 28 }}>
          {/* Desktop Left Sidebar Filters */}
          <aside
            id="catalog-filters-sidebar"
            className="hidden md:flex"
            style={{
              width: 240,
              flexShrink: 0,
              flexDirection: "column",
              gap: 24
            }}
          >
            {/* Category Filter */}
            <div style={{ background: c.card, padding: 18, borderRadius: 10, border: `1px solid ${c.line}` }}>
              <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14.5, fontWeight: 700, color: c.ink, margin: "0 0 12px" }}>
                Categories
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: (selectedCategory === cat || (!selectedCategory && cat === 'All')) ? `${c.brass}20` : "transparent",
                      color: (selectedCategory === cat || (!selectedCategory && cat === 'All')) ? c.brass : c.ink,
                      fontWeight: (selectedCategory === cat || (!selectedCategory && cat === 'All')) ? 700 : 500,
                      fontSize: 12.5,
                      cursor: "pointer"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div style={{ background: c.card, padding: 18, borderRadius: 10, border: `1px solid ${c.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14.5, fontWeight: 700, color: c.ink, margin: 0 }}>
                  Max Price
                </h4>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: c.brass }}>₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: "100%", accentColor: c.brass, cursor: "pointer" }}
              />
            </div>

            {/* Rating Filter */}
            <div style={{ background: c.card, padding: 18, borderRadius: 10, border: `1px solid ${c.line}` }}>
              <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14.5, fontWeight: 700, color: c.ink, margin: "0 0 10px" }}>
                Customer Rating
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "All Ratings", val: 0 },
                  { label: "4.5★ and above", val: 4.5 },
                  { label: "4.0★ and above", val: 4.0 },
                ].map(r => (
                  <label key={r.val} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: c.ink, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="minRating"
                      checked={minRating === r.val}
                      onChange={() => setMinRating(r.val)}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            <button
              onClick={() => {
                onSelectCategory('All');
                setMinRating(0);
                setMaxPrice(1200);
                onSearchChange('');
                setAiSearchResults(null);
              }}
              style={{
                padding: "8px",
                borderRadius: 6,
                border: `1px solid ${c.line}`,
                background: "transparent",
                color: c.inkSoft,
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Reset all filters
            </button>
          </aside>

          {/* Books Grid */}
          <main style={{ flex: 1 }}>
            {/* Top sorting & active filter badges */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {selectedCategory && selectedCategory !== 'All' && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.paper2, border: `1px solid ${c.line}`, padding: "3px 8px", borderRadius: 4, fontSize: 12 }}>
                    Category: {selectedCategory}
                    <X size={13} style={{ cursor: "pointer" }} onClick={() => onSelectCategory('All')} />
                  </span>
                )}
                {searchQuery && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.paper2, border: `1px solid ${c.line}`, padding: "3px 8px", borderRadius: 4, fontSize: 12 }}>
                    Search: "{searchQuery}"
                    <X size={13} style={{ cursor: "pointer" }} onClick={() => onSearchChange('')} />
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: c.inkSoft }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: `1px solid ${c.line}`,
                    background: c.card,
                    color: c.ink,
                    fontSize: 12.5,
                    cursor: "pointer"
                  }}
                >
                  <option value="featured">Featured Picks</option>
                  <option value="bestselling">Best Sellers</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: "60px 20px", textAlign: "center" }}>
                <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, color: c.ink, margin: "0 0 8px" }}>
                  No eBooks Match Your Search
                </h3>
                <p style={{ fontSize: 13, color: c.inkSoft, margin: "0 0 16px" }}>
                  Try relaxing your price filter or browsing another category.
                </p>
                <button
                  onClick={() => { onSelectCategory('All'); onSearchChange(''); setMinRating(0); setMaxPrice(1200); }}
                  style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: c.brass, color: "#fff", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {filtered.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    c={c}
                    currency={currency}
                    onSelect={onSelectBook}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isInWishlist={wishlistIds.includes(book.id)}
                    isInCart={cartBookIds.includes(book.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
