import React, { useState } from 'react';
import { Trash2, ArrowRight, ShoppingBag, Tag, Check, AlertCircle } from 'lucide-react';
import { Book, CurrencyCode } from '../../types';
import { BookCover } from '../common/BookCover';
import { formatPrice, api } from '../../services/api';

interface CartPageProps {
  cartItems: Book[];
  c: any;
  currency: CurrencyCode;
  onRemoveItem: (bookId: string) => void;
  onProceedToCheckout: (appliedDiscountPercent: number, couponCode?: string) => void;
  onContinueShopping: () => void;
  ownedBookIds: string[];
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  c,
  currency,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping,
  ownedBookIds
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode.trim()) return;

    try {
      const res = await api.coupons.validate(couponCode.trim(), subtotal);
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discountPercent: res.discountPercent });
        setCouponSuccess(`Coupon applied! ${res.discountPercent}% off`);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  const hasDuplicateOwnedBooks = cartItems.some(item => ownedBookIds.includes(item.id));

  if (cartItems.length === 0) {
    return (
      <div id="cart-empty-view" style={{ background: c.paper, minHeight: "80vh", padding: "80px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${c.brass}15`, color: c.brass, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShoppingBag size={28} />
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
            Your Cart is Empty
          </h2>
          <p style={{ fontSize: 14, color: c.inkSoft, margin: "0 0 24px", lineHeight: 1.5 }}>
            You haven't selected any digital editions yet. Explore our curated selection of architecture, philosophy, and tech titles.
          </p>
          <button
            id="cart-continue-shopping-btn"
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
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="cart-page-root" style={{ background: c.paper, minHeight: "100vh", padding: "30px 20px 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: c.ink, margin: "0 0 24px" }}>
          Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
        </h1>

        {hasDuplicateOwnedBooks && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: `${c.danger}15`, border: `1px solid ${c.danger}40`, color: c.danger, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} />
            <span>Notice: One or more books in your cart are already in your personal library.</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
          {/* Cart Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cartItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: c.card,
                  border: `1px solid ${c.line}`,
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <BookCover book={item} c={c} size="sm" />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: c.ink }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: 12, color: c.inkSoft, marginBottom: 6 }}>
                    {item.author} • <span style={{ textTransform: "uppercase" }}>{item.format}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.brass }}>
                    {formatPrice(item.price, currency)}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: c.inkSoft,
                    cursor: "pointer",
                    padding: 8
                  }}
                  title="Remove from cart"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={onContinueShopping}
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                color: c.brass,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px 0"
              }}
            >
              ← Continue browsing books
            </button>
          </div>

          {/* Order Summary */}
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.line}`,
              borderRadius: 10,
              padding: 24
            }}
          >
            <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, fontWeight: 700, color: c.ink, margin: "0 0 16px" }}>
              Order Summary
            </h3>

            {/* Subtotal breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderBottom: `1px solid ${c.line}`, paddingBottom: 16, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: c.ink2 }}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", color: c.good, fontWeight: 600 }}>
                  <span>Discount ({appliedCoupon.code} - {appliedCoupon.discountPercent}%)</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: c.ink2 }}>
                <span>Digital Delivery</span>
                <span style={{ color: c.good, fontWeight: 600 }}>Free Instant</span>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: c.ink }}>Total Amount</span>
              <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, fontWeight: 700, color: c.brass }}>
                {formatPrice(finalTotal, currency)}
              </span>
            </div>

            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code (e.g. NIBRAS20)"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: `1px solid ${c.line}`,
                    background: c.paper2,
                    color: c.ink,
                    fontSize: 12.5,
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: `1px solid ${c.brass}`,
                    background: `${c.brass}15`,
                    color: c.brass,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Apply
                </button>
              </div>
              {couponError && <div style={{ fontSize: 11, color: c.danger, marginTop: 4 }}>{couponError}</div>}
              {couponSuccess && <div style={{ fontSize: 11, color: c.good, marginTop: 4 }}>{couponSuccess}</div>}
            </form>

            {/* Checkout Button */}
            <button
              id="proceed-checkout-btn"
              onClick={() => onProceedToCheckout(appliedCoupon?.discountPercent || 0, appliedCoupon?.code)}
              style={{
                width: "100%",
                padding: "12px",
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
                gap: 8
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
