import React from 'react';
import { ArrowRight, BookOpen, Sparkles, ShieldCheck, Zap, Star } from 'lucide-react';
import { Book, CurrencyCode } from '../../types';
import { BookCard } from './BookCard';
import { TranslationDict } from '../../i18n/translations';

interface HomeProps {
  books: Book[];
  c: any;
  currency: CurrencyCode;
  t: TranslationDict;
  onNavigate: (page: string, params?: any) => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book, e: React.MouseEvent) => void;
  onToggleWishlist: (bookId: string, e: React.MouseEvent) => void;
  wishlistIds: string[];
  cartBookIds: string[];
}

export const Home: React.FC<HomeProps> = ({
  books,
  c,
  currency,
  t,
  onNavigate,
  onSelectBook,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  cartBookIds
}) => {
  const featured = books.slice(0, 4);
  const bestsellers = books.filter(b => b.bestseller).slice(0, 4);
  const newReleases = books.filter(b => b.newRelease).slice(0, 4);

  const categories = [
    { name: "Technology", count: 24, hue: "#2B4941" },
    { name: "Self Improvement", count: 18, hue: "#8C5A14" },
    { name: "Business", count: 15, hue: "#4A3820" },
    { name: "AI", count: 12, hue: "#3A2B49" },
    { name: "Programming", count: 20, hue: "#17302B" },
    { name: "Fiction", count: 16, hue: "#3B2340" },
  ];

  return (
    <div id="home-view-root">
      {/* HERO SECTION */}
      <section
        id="hero-banner"
        style={{
          background: `linear-gradient(180deg, ${c.paper2} 0%, ${c.paper} 100%)`,
          borderBottom: `1px solid ${c.line}`,
          padding: "70px 20px 80px",
          textAlign: "center"
        }}
      >
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 20,
              background: `${c.brass}15`,
              color: c.brass,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: 20,
              border: `1px solid ${c.brass}30`
            }}
          >
            <Sparkles size={15} />
            <span>THE NEXT-GENERATION eBOOK PLATFORM</span>
          </div>

          <h1
            style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: "clamp(34px, 6vw, 56px)",
              fontWeight: 700,
              color: c.ink,
              lineHeight: 1.15,
              margin: "0 0 18px",
              letterSpacing: "-0.5px"
            }}
          >
            {t.heroTitle}
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 2.5vw, 19px)",
              color: c.ink2,
              lineHeight: 1.6,
              margin: "0 auto 36px",
              maxWidth: 680
            }}
          >
            {t.heroSubtitle}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
            <button
              id="hero-browse-btn"
              onClick={() => onNavigate('ebooks')}
              style={{
                padding: "14px 28px",
                borderRadius: 8,
                border: "none",
                background: c.brass,
                color: "#F2EFE6",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                transition: "transform 0.15s ease"
              }}
              className="hover:scale-105"
            >
              <span>{t.browseEbooks}</span>
              <ArrowRight size={18} />
            </button>

            <button
              id="hero-explore-categories-btn"
              onClick={() => onNavigate('ebooks')}
              style={{
                padding: "14px 24px",
                borderRadius: 8,
                border: `1px solid ${c.line}`,
                background: c.card,
                color: c.ink,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
              }}
            >
              {t.exploreCategories}
            </button>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "50px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
          {[
            {
              icon: Zap,
              title: "Instant Digital Reading",
              desc: "Read on your laptop, tablet, or phone immediately in our distraction-free browser reader."
            },
            {
              icon: Sparkles,
              title: "AI Reading Companion",
              desc: "Ask questions, synthesize chapters, generate comprehension quizzes, and translate with Gemini."
            },
            {
              icon: ShieldCheck,
              title: "Licensed Offline Copies",
              desc: "Download watermarked, licensed copies to take with you anywhere without restrictive DRM locks."
            },
            {
              icon: BookOpen,
              title: "Curated Knowledge",
              desc: "Carefully vetted non-fiction, engineering, finance, and literature from independent thinkers."
            }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: c.card,
                border: `1px solid ${c.line}`,
                borderRadius: 10,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  background: `${c.brass}15`,
                  color: c.brass,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <item.icon size={22} />
              </div>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, fontWeight: 700, color: c.ink, margin: 0 }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: c.inkSoft, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED EBOOKS */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.brass, textTransform: "uppercase", letterSpacing: "1px" }}>
              Handpicked Editions
            </div>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: c.ink, margin: "4px 0 0" }}>
              {t.featuredEbooks}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('ebooks')}
            style={{ background: "none", border: "none", color: c.brass, fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <span>View all</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {featured.map(book => (
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
      </section>

      {/* CATEGORY EXPLORER */}
      <section style={{ background: c.paper2, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}`, padding: "60px 20px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
              {t.popularCategories}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: c.inkSoft }}>
              Find specialized knowledge structured across 12 distinct verticals
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {categories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate('ebooks', { category: cat.name })}
                style={{
                  background: c.card,
                  border: `1px solid ${c.line}`,
                  borderRadius: 10,
                  padding: "20px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                className="hover:-translate-y-1 hover:shadow-md"
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: cat.hue, margin: "0 auto 10px" }} />
                <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 4px" }}>
                  {cat.name}
                </h4>
                <span style={{ fontSize: 12, color: c.inkSoft }}>{cat.count} titles</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.brass, textTransform: "uppercase", letterSpacing: "1px" }}>
              Reader Favorites
            </div>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: c.ink, margin: "4px 0 0" }}>
              {t.bestsellers}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('ebooks', { sort: 'bestselling' })}
            style={{ background: "none", border: "none", color: c.brass, fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <span>Explore bestsellers</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {bestsellers.map(book => (
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
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: c.card, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}`, padding: "60px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.brass, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
            Community
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: c.ink, margin: "0 0 36px" }}>
            {t.readersSay}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, textAlign: "left" }}>
            {[
              {
                quote: "The built-in AI tutor changes how I read technical architecture books. Being able to highlight a paragraph and get an instant clarification without switching tabs is remarkable.",
                author: "Ananya Roy",
                role: "Senior Staff Architect"
              },
              {
                quote: "Clean typography, no invasive tracking, and the ability to download an authorized copy for my offline e-reader. Nibras is what digital bookstores should have been from the start.",
                author: "Vikram Malhotra",
                role: "Independent Researcher"
              },
              {
                quote: "The multi-lingual support and RTL reading for Urdu is exceptionally well done. Crisp, beautiful fonts and accurate text orientation.",
                author: "Tariq Siddiqui",
                role: "Literature Enthusiast"
              }
            ].map((test, idx) => (
              <div key={idx} style={{ background: c.paper, padding: 22, borderRadius: 10, border: `1px solid ${c.line}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: c.ink, lineHeight: 1.6, margin: "0 0 16px" }}>
                  "{test.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: c.ink }}>{test.author}</div>
                  <div style={{ fontSize: 11, color: c.inkSoft }}>{test.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ maxWidth: 680, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
          {t.newsletterTitle}
        </h3>
        <p style={{ fontSize: 14, color: c.inkSoft, margin: "0 0 20px" }}>
          {t.newsletterSubtitle}
        </p>
        <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for subscribing to Nibras literary letters."); }} style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto" }}>
          <input
            type="email"
            required
            placeholder="reader@domain.com"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13, outline: "none" }}
          />
          <button
            type="submit"
            style={{ padding: "10px 18px", borderRadius: 6, border: "none", background: c.brass, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            {t.subscribe}
          </button>
        </form>
      </section>
    </div>
  );
};
