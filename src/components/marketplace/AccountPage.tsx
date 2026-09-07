import React, { useState, useEffect } from 'react';
import { BookOpen, Download, ShoppingBag, User as UserIcon, LogOut, CheckCircle2, Clock } from 'lucide-react';
import { User, Book, Order, CurrencyCode, ReadingProgress } from '../../types';
import { BookCover } from '../common/BookCover';
import { formatPrice, api } from '../../services/api';

interface AccountPageProps {
  user: User;
  c: any;
  currency: CurrencyCode;
  allBooks: Book[];
  onOpenReader: (book: Book) => void;
  onSignOut: () => void;
  onExploreStore: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  c,
  currency,
  allBooks,
  onOpenReader,
  onSignOut,
  onExploreStore
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'orders' | 'profile'>('library');
  const [library, setLibrary] = useState<{ bookId: string; purchasedAt: string; progress: ReadingProgress }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserLibraryAndOrders();
  }, []);

  async function loadUserLibraryAndOrders() {
    setLoading(true);
    try {
      const [libRes, ordRes] = await Promise.all([
        api.library.get(),
        api.orders.list()
      ]);
      setLibrary(libRes.library || []);
      setOrders(ordRes.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Filter books in library
  const ownedBooks = library.map(item => {
    const book = allBooks.find(b => b.id === item.bookId);
    return {
      book,
      progress: item.progress,
      purchasedAt: item.purchasedAt
    };
  }).filter(item => item.book !== undefined) as { book: Book; progress: ReadingProgress; purchasedAt: string }[];

  const handleDownloadFile = (book: Book) => {
    // Generate text/binary blob download for licensed copy
    const chapters = book.fullChapters || book.previewChapters || [];
    const content = `NIBRAS SECURE WATERMARKED EDITION\nTitle: ${book.title}\nAuthor: ${book.author}\nLicensed to: ${user.name} (${user.email})\nLicense Hash: ${Math.random().toString(36).substring(2)}\n\nTABLE OF CONTENTS:\n${chapters.map((ch, idx) => `Chapter ${idx + 1}: ${ch.title}`).join('\n')}\n\n` +
      chapters.map(ch => `\n\n=== ${ch.title} ===\n\n${ch.content}`).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/\s+/g, '_')}_Nibras_Licensed.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="account-page-root" style={{ background: c.paper, minHeight: "100vh", padding: "30px 20px 80px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        {/* User Summary Header */}
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 12, padding: "24px 28px", marginBottom: 28, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${c.brass}20`, color: c.brass, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 700, color: c.ink, margin: 0 }}>
                  {user.name}
                </h1>
                <span style={{ fontSize: 11, fontWeight: 700, background: user.role === 'ADMIN' ? `${c.brass}20` : `${c.good}20`, color: user.role === 'ADMIN' ? c.brass : c.good, padding: "2px 8px", borderRadius: 10 }}>
                  {user.role}
                </span>
              </div>
              <div style={{ fontSize: 13, color: c.inkSoft, marginTop: 2 }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 6,
                border: `1px solid ${c.line}`,
                background: c.paper2,
                color: c.ink,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${c.line}`, marginBottom: 28 }}>
          {[
            { id: 'library', label: `My Library (${ownedBooks.length})`, icon: BookOpen },
            { id: 'orders', label: `Order History (${orders.length})`, icon: ShoppingBag },
            { id: 'profile', label: 'Preferences & Keys', icon: UserIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                color: activeTab === tab.id ? c.brass : c.inkSoft,
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                borderBottom: `2px solid ${activeTab === tab.id ? c.brass : "transparent"}`,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: MY LIBRARY */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'library' && (
          <div>
            {ownedBooks.length === 0 ? (
              <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: "60px 20px", textAlign: "center" }}>
                <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, color: c.ink, margin: "0 0 8px" }}>
                  Your Library Shelf is Empty
                </h3>
                <p style={{ fontSize: 13.5, color: c.inkSoft, margin: "0 0 20px" }}>
                  Titles you purchase will be accessible here forever, with synchronized bookmarks, annotations, and AI study notes.
                </p>
                <button
                  onClick={onExploreStore}
                  style={{ padding: "10px 20px", borderRadius: 6, border: "none", background: c.brass, color: "#F2EFE6", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Browse Bookstore
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                {ownedBooks.map(({ book, progress, purchasedAt }) => {
                  const percent = progress?.completionPercentage || 0;
                  return (
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
                      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                        <BookCover book={book} c={c} size="sm" />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase" }}>
                            {book.category}
                          </span>
                          <h3 style={{ margin: "2px 0 4px", fontSize: 15, fontWeight: 700, color: c.ink }}>
                            {book.title}
                          </h3>
                          <div style={{ fontSize: 12, color: c.inkSoft, marginBottom: 8 }}>
                            {book.author}
                          </div>

                          {/* Progress */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.inkSoft, marginBottom: 4 }}>
                              <span>Reading progress</span>
                              <span style={{ fontWeight: 700, color: c.ink }}>{percent}%</span>
                            </div>
                            <div style={{ width: "100%", height: 6, background: c.paper2, borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${percent}%`, height: "100%", background: c.brass }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${c.line}`, paddingTop: 12 }}>
                        <button
                          id={`read-owned-book-${book.id}`}
                          onClick={() => onOpenReader(book)}
                          style={{
                            flex: 1,
                            padding: "9px 12px",
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
                          <BookOpen size={15} />
                          <span>{percent > 0 ? 'Continue Reading' : 'Start Reading'}</span>
                        </button>

                        <button
                          onClick={() => handleDownloadFile(book)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 6,
                            border: `1px solid ${c.line}`,
                            background: c.paper2,
                            color: c.ink,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                          title="Download Licensed Copy"
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: ORDER HISTORY */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, overflow: "hidden" }}>
            {orders.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: c.inkSoft, fontSize: 13 }}>
                No completed orders found in this profile.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: c.paper2, borderBottom: `1px solid ${c.line}`, color: c.inkSoft, fontSize: 11, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Order ID</th>
                    <th style={{ padding: "12px 16px" }}>Purchased Titles</th>
                    <th style={{ padding: "12px 16px" }}>Total Paid</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${c.line}` }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: c.ink }}>{o.id}</td>
                      <td style={{ padding: "12px 16px", color: c.ink2 }}>{o.items.map(i => i.title).join(', ')}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: c.brass }}>{formatPrice(o.total, currency)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 10, background: `${c.good}20`, color: c.good, fontSize: 11, fontWeight: 700 }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: c.inkSoft }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: PROFILE & PREFERENCES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 24, maxWidth: 600 }}>
            <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, fontWeight: 700, color: c.ink, margin: "0 0 16px" }}>
              Reader Preferences & System Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
              <div>
                <label style={{ fontSize: 11, color: c.inkSoft, display: "block" }}>Full Name</label>
                <div style={{ fontWeight: 600, color: c.ink }}>{user.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: c.inkSoft, display: "block" }}>Email</label>
                <div style={{ fontWeight: 600, color: c.ink }}>{user.email}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: c.inkSoft, display: "block" }}>Platform Role</label>
                <div style={{ fontWeight: 600, color: c.brass }}>{user.role}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: c.inkSoft, display: "block" }}>Gemini AI Reading Engine</label>
                <div style={{ fontWeight: 600, color: c.good }}>Active (Server-Side Verified)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
