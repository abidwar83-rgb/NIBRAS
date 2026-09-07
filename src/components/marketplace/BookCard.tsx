import React from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Book, CurrencyCode } from '../../types';
import { BookCover } from '../common/BookCover';
import { Stars } from '../common/Stars';
import { formatPrice } from '../../services/api';

interface BookCardProps {
  book: Book;
  c: any;
  currency: CurrencyCode;
  onSelect: (book: Book) => void;
  onAddToCart: (book: Book, e: React.MouseEvent) => void;
  onToggleWishlist: (bookId: string, e: React.MouseEvent) => void;
  isInWishlist: boolean;
  isInCart: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  c,
  currency,
  onSelect,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isInCart
}) => {
  const discountPercent = book.originalPrice > book.price
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0;

  return (
    <div
      id={`book-card-${book.id}`}
      onClick={() => onSelect(book)}
      style={{
        background: c.card,
        border: `1px solid ${c.line}`,
        borderRadius: 10,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        position: "relative"
      }}
      className="hover:shadow-lg hover:-translate-y-1 group"
    >
      {/* Top badges */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", gap: 6 }}>
        <button
          id={`wishlist-toggle-${book.id}`}
          type="button"
          onClick={(e) => onToggleWishlist(book.id, e)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: c.paper,
            border: `1px solid ${c.line}`,
            color: isInWishlist ? c.brass : c.inkSoft,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}
          title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isInWishlist ? c.brass : "none"} color={isInWishlist ? c.brass : c.inkSoft} />
        </button>
      </div>

      {discountPercent > 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            background: c.danger,
            color: "#F2EFE6",
            fontSize: 10.5,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 4,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
          }}
        >
          {discountPercent}% OFF
        </div>
      )}

      {/* Book Cover Center */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <BookCover book={book} c={c} size="md" />
      </div>

      {/* Book Metadata */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.brass, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            {book.category}
          </div>
          <h3
            style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: 15.5,
              fontWeight: 700,
              color: c.ink,
              margin: "4px 0 2px",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {book.title}
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: c.inkSoft }}>
            {book.author}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Stars rating={book.rating} c={c} size={13} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink2 }}>
              {book.rating.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: c.inkSoft }}>
              ({book.reviewsCount})
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div
          style={{
            borderTop: `1px solid ${c.line}`,
            paddingTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: c.ink
                }}
              >
                {formatPrice(book.price, currency)}
              </span>
              {book.originalPrice > book.price && (
                <span style={{ fontSize: 12, color: c.inkSoft, textDecoration: "line-through" }}>
                  {formatPrice(book.originalPrice, currency)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: c.inkSoft, marginTop: 1 }}>
              {book.format}
            </div>
          </div>

          <button
            id={`add-to-cart-${book.id}`}
            type="button"
            onClick={(e) => onAddToCart(book, e)}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: `1px solid ${isInCart ? c.good : c.brass}`,
              background: isInCart ? `${c.good}15` : c.brass,
              color: isInCart ? c.good : "#F2EFE6",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            {isInCart ? (
              <>
                <Check size={14} />
                <span>In cart</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
