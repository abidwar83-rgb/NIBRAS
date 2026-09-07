import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Heart, ShoppingBag, BookOpen, Star,
  ShieldCheck, Clock, Download, Check, Sparkles, Send
} from 'lucide-react';
import { Book, Review, CurrencyCode, User } from '../../types';
import { BookCover } from '../common/BookCover';
import { Stars } from '../common/Stars';
import { formatPrice, api } from '../../services/api';

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  c: any;
  currency: CurrencyCode;
  onAddToCart: (book: Book, e: React.MouseEvent) => void;
  onBuyNow: (book: Book) => void;
  onOpenReader: (book: Book) => void;
  onToggleWishlist: (bookId: string, e: React.MouseEvent) => void;
  isInWishlist: boolean;
  isInCart: boolean;
  isOwned: boolean;
  user: User | null;
  onSelectBook: (book: Book) => void;
  allBooks: Book[];
}

export const BookDetail: React.FC<BookDetailProps> = ({
  book,
  onBack,
  c,
  currency,
  onAddToCart,
  onBuyNow,
  onOpenReader,
  onToggleWishlist,
  isInWishlist,
  isInCart,
  isOwned,
  user,
  onSelectBook,
  allBooks
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.reviews.get(book.id).then(res => setReviews(res.reviews)).catch(() => {});
  }, [book.id]);

  const discountPercent = book.originalPrice > book.price
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await api.reviews.submit(book.id, newRating, newComment.trim());
      setReviews(prev => [res.review, ...prev]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const related = allBooks.filter(b => b.id !== book.id && b.category === book.category).slice(0, 3);

  return (
    <div id="book-detail-root" style={{ background: c.paper, minHeight: "100vh", padding: "30px 20px 80px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        {/* Back navigation */}
        <button
          id="detail-back-btn"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 6,
            border: `1px solid ${c.line}`,
            background: c.paper2,
            color: c.ink,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 24
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to catalog</span>
        </button>

        {/* Main Grid: Cover Left, Info Right */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "start", marginBottom: 60 }}>
          {/* Left Column: Cover & Preview */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ transform: "scale(1.05)", marginBottom: 20 }}>
              <BookCover book={book} c={c} size="lg" />
            </div>

            <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 300, justifyContent: "center" }}>
              <button
                id="free-preview-btn"
                onClick={() => setShowPreviewModal(true)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: `1px solid ${c.brass}`,
                  background: `${c.brass}15`,
                  color: c.brass,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <BookOpen size={16} />
                <span>Read Free Sample</span>
              </button>

              <button
                id="detail-wishlist-toggle"
                onClick={(e) => onToggleWishlist(book.id, e)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: `1px solid ${c.line}`,
                  background: c.card,
                  color: isInWishlist ? c.brass : c.inkSoft,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title={isInWishlist ? "In Wishlist" : "Add to Wishlist"}
              >
                <Heart size={18} fill={isInWishlist ? c.brass : "none"} color={isInWishlist ? c.brass : c.inkSoft} />
              </button>
            </div>
          </div>

          {/* Right Column: Information & CTAs */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.brass, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {book.category}
              </span>
              {book.bestseller && (
                <span style={{ background: `${c.good}20`, color: c.good, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                  BESTSELLER
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(26px, 4vw, 36px)",
                fontWeight: 700,
                color: c.ink,
                lineHeight: 1.2,
                margin: "0 0 8px"
              }}
            >
              {book.title}
            </h1>

            <p style={{ fontSize: 15, color: c.inkSoft, margin: "0 0 16px" }}>
              By <span style={{ color: c.ink, fontWeight: 600 }}>{book.author}</span>
            </p>

            {/* Rating summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Stars rating={book.rating} c={c} size={16} />
              <span style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>
                {book.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: c.inkSoft }}>
                • ({book.reviewsCount} customer reviews)
              </span>
            </div>

            {/* Pricing Box */}
            <div
              style={{
                background: c.card,
                border: `1px solid ${c.line}`,
                borderRadius: 10,
                padding: "20px 24px",
                marginBottom: 28
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: c.ink }}>
                  {formatPrice(book.price, currency)}
                </span>
                {book.originalPrice > book.price && (
                  <span style={{ fontSize: 16, color: c.inkSoft, textDecoration: "line-through" }}>
                    {formatPrice(book.originalPrice, currency)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span style={{ background: c.danger, color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {isOwned ? (
                  <button
                    id="detail-read-now-btn"
                    onClick={() => onOpenReader(book)}
                    style={{
                      flex: 1,
                      minWidth: 160,
                      padding: "12px 20px",
                      borderRadius: 6,
                      border: "none",
                      background: c.brass,
                      color: "#F2EFE6",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    }}
                  >
                    <BookOpen size={18} />
                    <span>Open in eBook Reader</span>
                  </button>
                ) : (
                  <>
                    <button
                      id="detail-add-cart-btn"
                      onClick={(e) => onAddToCart(book, e)}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: "12px 18px",
                        borderRadius: 6,
                        border: `1px solid ${isInCart ? c.good : c.brass}`,
                        background: isInCart ? `${c.good}20` : `${c.brass}15`,
                        color: isInCart ? c.good : c.brass,
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      {isInCart ? <Check size={16} /> : <ShoppingBag size={16} />}
                      <span>{isInCart ? 'In Your Cart' : 'Add to Cart'}</span>
                    </button>

                    <button
                      id="detail-buy-now-btn"
                      onClick={() => onBuyNow(book)}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: "12px 18px",
                        borderRadius: 6,
                        border: "none",
                        background: c.brass,
                        color: "#F2EFE6",
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <span>Buy Now</span>
                    </button>
                  </>
                )}
              </div>

              {/* Guarantees */}
              <div style={{ display: "flex", gap: 16, marginTop: 18, fontSize: 11.5, color: c.inkSoft }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={14} color={c.good} />
                  <span>Licensed Edition</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={14} color={c.brass} />
                  <span>Instant Access</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Download size={14} color={c.inkSoft} />
                  <span>PDF & EPUB Format</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, fontWeight: 700, color: c.ink, margin: "0 0 10px" }}>
                Synopsis & Content
              </h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: c.ink2, margin: 0, whiteSpace: "pre-line" }}>
                {book.description}
              </p>
            </div>

            {/* Specifications */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, background: c.paper2, padding: 16, borderRadius: 8, border: `1px solid ${c.line}` }}>
              <div>
                <div style={{ fontSize: 11, color: c.inkSoft }}>Format</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{book.format}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: c.inkSoft }}>Language</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{book.language}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: c.inkSoft }}>Pages</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{book.pages} pages</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: c.inkSoft }}>Published Date</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{book.publishedDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* FREE PREVIEW MODAL */}
        {showPreviewModal && (
          <div
            id="free-sample-modal"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20
            }}
          >
            <div
              style={{
                background: c.paper,
                borderRadius: 10,
                width: "100%",
                maxWidth: 680,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${c.line}`,
                overflow: "hidden"
              }}
            >
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase" }}>Free Sample Chapter</div>
                  <h3 style={{ margin: 0, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, color: c.ink }}>{book.title}</h3>
                </div>
                <button onClick={() => setShowPreviewModal(false)} style={{ background: "none", border: "none", color: c.ink, fontSize: 18, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, lineHeight: 1.8, color: c.ink }}>
                {book.previewChapters && book.previewChapters.length > 0 ? (
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{book.previewChapters[0].title}</h4>
                    <p style={{ whiteSpace: "pre-line" }}>{book.previewChapters[0].content}</p>
                  </div>
                ) : (
                  <p>Sample excerpt from {book.title}. Buy the book to unlock full reading experience.</p>
                )}
              </div>
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${c.line}`, background: c.paper2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: c.inkSoft }}>End of free preview</span>
                <button
                  onClick={() => { setShowPreviewModal(false); onBuyNow(book); }}
                  style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: c.brass, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Unlock Full eBook ({formatPrice(book.price, currency)})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <section style={{ borderTop: `1px solid ${c.line}`, paddingTop: 40, marginBottom: 60 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 700, color: c.ink, margin: 0 }}>
                Verified Customer Reviews ({reviews.length})
              </h2>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {/* Reviews List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reviews.length === 0 ? (
                <div style={{ padding: 24, background: c.card, borderRadius: 8, border: `1px solid ${c.line}`, fontSize: 13, color: c.inkSoft }}>
                  No reviews submitted yet. Be the first reader to review this edition!
                </div>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} style={{ background: c.card, padding: 18, borderRadius: 8, border: `1px solid ${c.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: c.ink }}>{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: `${c.good}20`, color: c.good, fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                            <ShieldCheck size={12} />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: c.inkSoft }}>{rev.createdAt}</span>
                    </div>
                    <Stars rating={rev.rating} c={c} size={14} />
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Write a review form */}
            <div style={{ background: c.card, padding: 20, borderRadius: 8, border: `1px solid ${c.line}`, height: "fit-content" }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 12px" }}>
                Write a Reader Review
              </h3>

              {user ? (
                <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                      Your Rating
                    </label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                        >
                          <Star size={20} color={c.brass} fill={star <= newRating ? c.brass : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                      Your Feedback & Review
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="What did you learn or enjoy most about this book?"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13, outline: "none" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      background: c.brass,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: submittingReview ? "not-allowed" : "pointer"
                    }}
                  >
                    {submittingReview ? "Submitting..." : "Post Review"}
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: 12.5, color: c.inkSoft }}>
                  Please sign in to write an authorized review.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RELATED BOOKS */}
        {related.length > 0 && (
          <section style={{ borderTop: `1px solid ${c.line}`, paddingTop: 40 }}>
            <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, color: c.ink, margin: "0 0 20px" }}>
              More in {book.category}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {related.map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBook(b)}
                  style={{
                    background: c.card,
                    border: `1px solid ${c.line}`,
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    gap: 14,
                    cursor: "pointer"
                  }}
                  className="hover:shadow-md"
                >
                  <BookCover book={b} c={c} size="sm" />
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: c.ink }}>{b.title}</h4>
                    <div style={{ fontSize: 11, color: c.inkSoft, marginBottom: 8 }}>{b.author}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.brass }}>{formatPrice(b.price, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
