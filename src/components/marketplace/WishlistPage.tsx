import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Book, CurrencyCode } from '../../types';
import { BookCover } from '../common/BookCover';
import { formatPrice } from '../../services/api';

interface WishlistPageProps {
  books: Book[];
  c: any;
  currency: CurrencyCode;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book, e: React.MouseEvent) => void;
  onRemoveFromWishlist: (bookId: string) => void;
  onContinueShopping: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  books,
  c,
  currency,
  onSelectBook,
  onAddToCart,
  onRemoveFromWishlist,
  onContinueShopping
}) => {
  if (books.length === 0) {
    return (
      <div id="wishlist-empty-view" style={{ background: c.paper, minHeight: "80vh", padding: "80px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${c.brass}15`, color: c.brass, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Heart size={28} />
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
            Your Wishlist is Empty
          </h2>
          <p style={{ fontSize: 14, color: c.inkSoft, margin: "0 0 24px", lineHeight: 1.5 }}>
            Save books you would love to read later by clicking the heart icon on any title.
          </p>
          <button
            onClick={onContinueShopping}
            style={{
              padding: "12px 24px",
              borderRadius: 6,
              border: "none",
              background: c.brass,
              color: "#F2EFE6",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Explore Titles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="wishlist-page-root" style={{ background: c.paper, minHeight: "100vh", padding: "30px 20px 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: c.ink, margin: "0 0 24px" }}>
          Saved Wishlist ({books.length})
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {books.map(book => (
            <div
              key={book.id}
              style={{
                background: c.card,
                border: `1px solid ${c.line}`,
                borderRadius: 10,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", gap: 14, cursor: "pointer" }} onClick={() => onSelectBook(book)}>
                <BookCover book={book} c={c} size="sm" />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 700, color: c.ink }}>
                    {book.title}
                  </h3>
                  <div style={{ fontSize: 12, color: c.inkSoft, marginBottom: 8 }}>
                    {book.author}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.brass }}>
                    {formatPrice(book.price, currency)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16, borderTop: `1px solid ${c.line}`, paddingTop: 12 }}>
                <button
                  onClick={(e) => onAddToCart(book, e)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: c.brass,
                    color: "#F2EFE6",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <ShoppingBag size={14} />
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => onRemoveFromWishlist(book.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: `1px solid ${c.line}`,
                    background: "transparent",
                    color: c.inkSoft,
                    cursor: "pointer"
                  }}
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
