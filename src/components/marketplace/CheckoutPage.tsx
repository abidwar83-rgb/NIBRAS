import React, { useState } from 'react';
import { ShieldCheck, CreditCard, CheckCircle2, ArrowRight, Lock, BookOpen } from 'lucide-react';
import { Book, User, CurrencyCode } from '../../types';
import { formatPrice, api } from '../../services/api';

interface CheckoutPageProps {
  items: Book[];
  c: any;
  currency: CurrencyCode;
  discountPercent: number;
  couponCode?: string;
  user: User | null;
  onPaymentSuccess: (orderId: string) => void;
  onBackToCart: () => void;
  onOpenAuth: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  c,
  currency,
  discountPercent,
  couponCode,
  user,
  onPaymentSuccess,
  onBackToCart,
  onOpenAuth
}) => {
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !customerName) {
      alert('Please fill out your name and email');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create order
      const createRes = await api.orders.create({
        items: items.map(i => ({
          bookId: i.id,
          quantity: 1
        })),
        couponCode,
        currency
      });

      // 2. Verify / Settle payment simulation
      await api.orders.verifyPayment({
        orderId: createRes.order.id,
        paymentId: `sim_tx_${Date.now()}`
      });

      setCompletedOrder({
        orderId: createRes.order.id,
        items,
        total,
        customerName,
        customerEmail
      });
      onPaymentSuccess(createRes.order.id);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (completedOrder) {
    return (
      <div id="checkout-success-view" style={{ background: c.paper, minHeight: "80vh", padding: "60px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 12, padding: "36px 32px", maxWidth: 540, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${c.good}20`, color: c.good, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
            Payment Successful!
          </h2>
          <p style={{ fontSize: 13.5, color: c.inkSoft, margin: "0 0 20px" }}>
            Your digital licenses have been activated and added directly to your personal library.
          </p>

          <div style={{ background: c.paper2, padding: 16, borderRadius: 8, textAlign: "left", fontSize: 13, marginBottom: 24, border: `1px solid ${c.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: c.inkSoft }}>Order Reference:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: c.ink }}>{completedOrder.orderId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: c.inkSoft }}>Total Paid:</span>
              <span style={{ fontWeight: 700, color: c.brass }}>{formatPrice(completedOrder.total, currency)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: c.inkSoft }}>Purchased:</span>
              <span style={{ fontWeight: 600, color: c.ink }}>{completedOrder.items.length} eBooks</span>
            </div>
          </div>

          <button
            id="success-go-library-btn"
            onClick={() => onPaymentSuccess(completedOrder.orderId)}
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
            <BookOpen size={16} />
            <span>Open in My Library</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout-page-root" style={{ background: c.paper, minHeight: "100vh", padding: "30px 20px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: c.ink, margin: 0 }}>
            Secure Checkout
          </h1>
          <button
            onClick={onBackToCart}
            style={{ background: "none", border: "none", color: c.brass, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            ← Return to cart
          </button>
        </div>

        <form onSubmit={handleCompletePayment} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
          {/* Customer & Payment Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Customer Details */}
            <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 14px" }}>
                1. Account & Delivery Email
              </h3>

              {!user && (
                <div style={{ padding: "8px 12px", borderRadius: 6, background: `${c.brass}15`, fontSize: 12, color: c.brass, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Have a Nibras account?</span>
                  <button type="button" onClick={onOpenAuth} style={{ background: "none", border: "none", color: c.brass, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Sign In</button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Email Address * (eBooks sent here)</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="reader@domain.com"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: 0 }}>
                  2. Payment Method
                </h3>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: c.good, fontWeight: 600 }}>
                  <Lock size={12} />
                  256-bit Encrypted
                </span>
              </div>

              {/* Method Selector Tabs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'card', label: 'Credit / Debit Card' },
                  { id: 'upi', label: 'UPI / GPay' },
                  { id: 'netbanking', label: 'NetBanking' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: `1px solid ${paymentMethod === m.id ? c.brass : c.line}`,
                      background: paymentMethod === m.id ? `${c.brass}15` : c.paper2,
                      color: paymentMethod === m.id ? c.brass : c.ink,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13, fontFamily: "monospace" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Expires</label>
                      <input
                        type="text"
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div style={{ padding: 12, background: c.paper2, borderRadius: 6, fontSize: 12.5, color: c.ink2 }}>
                  Instant QR & Virtual Payment Address (VPA) will generate upon confirmation. Compatible with Google Pay, PhonePe, and Paytm.
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div style={{ padding: 12, background: c.paper2, borderRadius: 6, fontSize: 12.5, color: c.ink2 }}>
                  Direct institutional gateway to HDFC, SBI, ICICI, Axis, and all major commercial banks.
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Final Submit */}
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 14px" }}>
              Order Review
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {items.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: c.ink, fontWeight: 600, flex: 1, paddingRight: 8 }} className="truncate">
                    {i.title}
                  </span>
                  <span style={{ color: c.brass, fontWeight: 700 }}>
                    {formatPrice(i.price, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${c.line}`, paddingTop: 12, marginBottom: 16, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: c.inkSoft }}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: c.good, fontWeight: 600 }}>
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: c.ink, marginTop: 4 }}>
                <span>Final Charge</span>
                <span style={{ color: c.brass }}>{formatPrice(total, currency)}</span>
              </div>
            </div>

            <button
              id="complete-checkout-btn"
              type="submit"
              disabled={processing}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 6,
                border: "none",
                background: c.brass,
                color: "#F2EFE6",
                fontSize: 14,
                fontWeight: 700,
                cursor: processing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>{processing ? "Authorizing Payment..." : `Pay ${formatPrice(total, currency)}`}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: c.inkSoft }}>
              By completing your order, you agree to Nibras terms of digital license.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
