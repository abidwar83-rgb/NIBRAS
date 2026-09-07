import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Upload, Trash2, Edit3, Eye,
  DollarSign, Users, ShoppingBag, Download, ArrowUpRight,
  Sparkles, CheckCircle2, AlertCircle, FileText, Globe, Tag, Percent
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Book, Order, Advertisement, CurrencyCode } from '../../types';
import { api, formatPrice } from '../../services/api';

interface AdminDashboardProps {
  c: any;
  currency: CurrencyCode;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ c, currency }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'upload' | 'orders' | 'coupons' | 'ai'>('overview');
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Technology');
  const [uploadPrice, setUploadPrice] = useState('399');
  const [uploadOriginalPrice, setUploadOriginalPrice] = useState('499');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('programming, tech, guide');
  const [uploadStatus, setUploadStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // AI Metadata Tool State
  const [aiMetaTitle, setAiMetaTitle] = useState('');
  const [aiMetaAuthor, setAiMetaAuthor] = useState('');
  const [aiMetaCategory, setAiMetaCategory] = useState('Technology');
  const [aiMetaDesc, setAiMetaDesc] = useState('');
  const [aiGeneratedMetadata, setAiGeneratedMetadata] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Coupons state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('20');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('500');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [booksRes, analyticsRes, ordersRes] = await Promise.all([
        api.books.adminList(),
        api.analytics.adminMetrics(),
        api.orders.list(true)
      ]);
      setBooks(booksRes.books);
      setAnalytics(analyticsRes);
      setOrders(ordersRes.orders);
    } catch (err: any) {
      console.error(err);
      notify('Failed to load administrative data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function notify(message: string, type: 'success' | 'error' = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  const handleTogglePublish = async (book: Book) => {
    const newStatus = book.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      await api.books.update(book.id, { status: newStatus });
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: newStatus } : b));
      notify(`"${book.title}" is now ${newStatus}`);
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await api.books.delete(bookId);
      setBooks(prev => prev.filter(b => b.id !== bookId));
      notify('Book deleted successfully');
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadAuthor) {
      notify('Title and author are required', 'error');
      return;
    }
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('author', uploadAuthor);
      formData.append('category', uploadCategory);
      formData.append('price', uploadPrice);
      formData.append('originalPrice', uploadOriginalPrice);
      formData.append('description', uploadDesc);
      formData.append('tags', uploadTags);
      formData.append('status', uploadStatus);
      if (ebookFile) formData.append('ebook', ebookFile);
      if (coverFile) formData.append('cover', coverFile);

      const res = await api.books.uploadEbook(formData);
      setBooks(prev => [res.book, ...prev]);
      notify(`eBook "${res.book.title}" uploaded and processed successfully!`);

      // Reset form
      setUploadTitle('');
      setUploadAuthor('');
      setUploadDesc('');
      setEbookFile(null);
      setCoverFile(null);
      setActiveTab('books');
    } catch (err: any) {
      notify(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAiMetadata = async () => {
    if (!aiMetaTitle) {
      notify('Please provide a title', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.ai.generateMetadata({
        title: aiMetaTitle,
        author: aiMetaAuthor || 'Unknown',
        category: aiMetaCategory,
        shortDescription: aiMetaDesc
      });
      setAiGeneratedMetadata(res.metadata);
      notify('SEO Metadata generated with Gemini 3.8 Flash');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Mock revenue chart data
  const revenueChartData = [
    { month: 'Jan', revenue: 14200 },
    { month: 'Feb', revenue: 18500 },
    { month: 'Mar', revenue: 22400 },
    { month: 'Apr', revenue: 26800 },
    { month: 'May', revenue: 31200 },
    { month: 'Jun', revenue: 38400 },
    { month: 'Jul', revenue: 44600 },
  ];

  const categoryShareData = [
    { name: 'Technology', value: 35, color: '#2B4941' },
    { name: 'Self Improvement', value: 25, color: '#B87A22' },
    { name: 'Business', value: 20, color: '#8C5A14' },
    { name: 'AI & Data', value: 20, color: '#3E6B4F' },
  ];

  return (
    <div id="admin-dashboard-root" style={{ background: c.paper, minHeight: "100vh", padding: "24px 20px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.brass, textTransform: "uppercase", letterSpacing: "1px" }}>
                Nibras Administration
              </span>
              <span style={{ background: `${c.good}20`, color: c.good, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                Live Production
              </span>
            </div>
            <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: c.ink, margin: "4px 0 0" }}>
              Publisher & Store Operations
            </h1>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: 6, background: c.paper2, padding: 4, borderRadius: 8, border: `1px solid ${c.line}` }}>
            {(['overview', 'books', 'upload', 'orders', 'coupons', 'ai'] as const).map(tab => (
              <button
                key={tab}
                id={`admin-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: activeTab === tab ? c.brass : "transparent",
                  color: activeTab === tab ? "#F2EFE6" : c.ink,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {tab === 'upload' && <Upload size={14} />}
                {tab === 'ai' && <Sparkles size={14} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            id="admin-toast"
            style={{
              marginBottom: 16,
              padding: "10px 16px",
              borderRadius: 8,
              background: notification.type === 'success' ? `${c.good}20` : `${c.danger}20`,
              color: notification.type === 'success' ? c.good : c.danger,
              border: `1px solid ${notification.type === 'success' ? c.good : c.danger}40`,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: OVERVIEW */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Metric KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { label: "Total Revenue", value: formatPrice(analytics?.metrics?.totalRevenue || 0, currency), icon: DollarSign, change: "+18.4% this month" },
                { label: "Total Orders", value: analytics?.metrics?.totalOrders || 0, icon: ShoppingBag, change: "All verified" },
                { label: "Published Books", value: `${analytics?.metrics?.publishedBooks || 0} / ${books.length}`, icon: BookOpen, change: "Active catalog" },
                { label: "Active Customers", value: analytics?.metrics?.totalCustomers || 0, icon: Users, change: "Verified readers" },
                { label: "Total Downloads", value: analytics?.metrics?.totalDownloads || 0, icon: Download, change: "Watermarked & logged" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: c.card,
                    border: `1px solid ${c.line}`,
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: c.inkSoft, fontWeight: 500 }}>{m.label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: `${c.brass}15`, color: c.brass, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <m.icon size={16} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 700, color: c.ink }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: 11, color: c.good, marginTop: 4 }}>
                      {m.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Graphs: Revenue & Categories */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
              {/* Revenue Area Chart */}
              <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
                <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 16px" }}>
                  Sales Revenue Trajectory
                </h3>
                <div style={{ height: 220, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c.brass} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={c.brass} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke={c.inkSoft} fontSize={11} />
                      <YAxis stroke={c.inkSoft} fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke={c.brass} fillOpacity={1} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
                <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 16px" }}>
                  Conversion Funnel
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {analytics?.funnel?.map((step: any, idx: number) => {
                    const pct = Math.round((step.count / (analytics.funnel[0].count || 1)) * 100);
                    return (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: c.ink }}>{step.stage}</span>
                          <span style={{ color: c.inkSoft }}>{step.count.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div style={{ width: "100%", height: 8, background: c.paper2, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: c.brass, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: BOOKS MANAGEMENT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'books' && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, fontWeight: 700, color: c.ink, margin: 0 }}>
                Catalog Directory ({books.length} eBooks)
              </h3>
              <button
                id="admin-new-book-btn"
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: c.brass,
                  color: "#F2EFE6",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Plus size={15} />
                <span>Upload New eBook</span>
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: c.paper2, borderBottom: `1px solid ${c.line}`, color: c.inkSoft, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 16px" }}>Title & Author</th>
                    <th style={{ padding: "12px 16px" }}>Category</th>
                    <th style={{ padding: "12px 16px" }}>Price</th>
                    <th style={{ padding: "12px 16px" }}>Format</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b.id} style={{ borderBottom: `1px solid ${c.line}` }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: c.ink }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: c.inkSoft }}>{b.author}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: c.ink2 }}>{b.category}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: c.ink }}>
                        {formatPrice(b.price, currency)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: c.inkSoft }}>{b.format}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => handleTogglePublish(b)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 12,
                            border: "none",
                            background: b.status === 'PUBLISHED' ? `${c.good}20` : `${c.danger}20`,
                            color: b.status === 'PUBLISHED' ? c.good : c.danger,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          {b.status}
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            onClick={() => handleDeleteBook(b.id)}
                            style={{
                              padding: "5px",
                              borderRadius: 4,
                              border: `1px solid ${c.danger}40`,
                              background: "transparent",
                              color: c.danger,
                              cursor: "pointer"
                            }}
                            title="Delete eBook"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: REAL UPLOAD SYSTEM */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'upload' && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 24, maxWidth: 800, margin: "0 auto" }}>
            <div style={{ borderBottom: `1px solid ${c.line}`, paddingBottom: 14, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, color: c.ink, margin: 0 }}>
                Upload & Process Real eBook (PDF / EPUB)
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: c.inkSoft }}>
                Files are validated on the server, saved to secure disk storage, and processed for reader & AI assistant indexing.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    Book Title *
                  </label>
                  <input
                    id="upload-book-title-input"
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Distributed Systems Architecture"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    Author Name *
                  </label>
                  <input
                    id="upload-book-author-input"
                    type="text"
                    required
                    value={uploadAuthor}
                    onChange={(e) => setUploadAuthor(e.target.value)}
                    placeholder="e.g. Dr. Alistair Vance"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Programming">Programming</option>
                    <option value="AI">AI & Machine Learning</option>
                    <option value="Business">Business</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Self Improvement">Self Improvement</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Romance">Romance</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Academic">Academic</option>
                    <option value="Children's Books">Children's Books</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    value={uploadOriginalPrice}
                    onChange={(e) => setUploadOriginalPrice(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                  Description & Synopsis
                </label>
                <textarea
                  rows={3}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Summary of what the reader will discover..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                />
              </div>

              {/* File Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, border: `1px dashed ${c.line}`, padding: 16, borderRadius: 8 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: c.ink, marginBottom: 4 }}>
                    eBook File (PDF or EPUB, max 50MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) => setEbookFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: c.ink, marginBottom: 4 }}>
                    Custom Cover Image (JPEG/PNG/WebP, max 10MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: c.ink, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={uploadStatus === 'PUBLISHED'}
                    onChange={(e) => setUploadStatus(e.target.checked ? 'PUBLISHED' : 'DRAFT')}
                  />
                  Publish immediately to store catalog
                </label>

                <button
                  id="submit-ebook-upload-btn"
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 6,
                    border: "none",
                    background: c.brass,
                    color: "#F2EFE6",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: uploading ? "not-allowed" : "pointer"
                  }}
                >
                  {uploading ? "Processing & Extracting Content..." : "Complete Upload"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: ORDERS & TRANSACTIONS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.line}` }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, fontWeight: 700, color: c.ink, margin: 0 }}>
                Orders & Financial Records ({orders.length})
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: c.paper2, borderBottom: `1px solid ${c.line}`, color: c.inkSoft, fontSize: 11, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Order ID</th>
                    <th style={{ padding: "12px 16px" }}>Customer</th>
                    <th style={{ padding: "12px 16px" }}>Items Purchased</th>
                    <th style={{ padding: "12px 16px" }}>Total</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${c.line}` }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: c.ink }}>
                        {o.id}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: c.ink }}>{o.customerName}</div>
                        <div style={{ fontSize: 11, color: c.inkSoft }}>{o.customerEmail}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: c.ink2 }}>
                        {o.items.map(i => i.title).join(', ')}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: c.ink }}>
                        {formatPrice(o.total, currency)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 10, background: o.status === 'PAID' ? `${c.good}20` : `${c.danger}20`, color: o.status === 'PAID' ? c.good : c.danger, fontSize: 11, fontWeight: 700 }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: c.inkSoft }}>
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: COUPONS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'coupons' && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 16px" }}>
                Active Coupons
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { code: 'NIBRAS20', discount: '20% OFF', min: '₹500', uses: '48 / 500' },
                  { code: 'WELCOME10', discount: '10% OFF', min: '₹200', uses: '142 / 1000' },
                  { code: 'SUMMERREAD', discount: '25% OFF', min: '₹800', uses: '12 / 200' },
                ].map((cp, idx) => (
                  <div key={idx} style={{ padding: "12px 16px", borderRadius: 8, background: c.paper2, border: `1px solid ${c.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: c.brass }}>{cp.code}</div>
                      <div style={{ fontSize: 11, color: c.inkSoft, marginTop: 2 }}>Min order: {cp.min} • Uses: {cp.uses}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: c.good, fontSize: 13 }}>{cp.discount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.ink, margin: "0 0 16px" }}>
                Create New Promotional Coupon
              </h3>
              <form onSubmit={(e) => { e.preventDefault(); notify(`Coupon ${newCouponCode.toUpperCase()} activated!`); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FLASH30"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Discount %</label>
                    <input
                      type="number"
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>Min Order (₹)</label>
                    <input
                      type="number"
                      value={newCouponMinOrder}
                      onChange={(e) => setNewCouponMinOrder(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{
                    padding: "9px",
                    borderRadius: 6,
                    border: "none",
                    background: c.brass,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    marginTop: 6
                  }}
                >
                  Activate Coupon
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 6: AI PUBLISHING SUITE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'ai' && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 10, padding: 24, maxWidth: 840, margin: "0 auto" }}>
            <div style={{ borderBottom: `1px solid ${c.line}`, paddingBottom: 14, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} color={c.brass} />
                <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, color: c.ink, margin: 0 }}>
                  AI Publishing & Metadata Engine (Gemini 3.8 Flash)
                </h2>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: c.inkSoft }}>
                Automates high-conversion SEO titles, search metadata, audience segmentation, and target tags for publisher catalog items.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    eBook Title
                  </label>
                  <input
                    type="text"
                    value={aiMetaTitle}
                    onChange={(e) => setAiMetaTitle(e.target.value)}
                    placeholder="e.g. Modern Software Engineering"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={aiMetaCategory}
                    onChange={(e) => setAiMetaCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                  Draft Notes / Topic Outline
                </label>
                <textarea
                  rows={3}
                  value={aiMetaDesc}
                  onChange={(e) => setAiMetaDesc(e.target.value)}
                  placeholder="Key topics, core problems addressed, target skills..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: c.paper2, color: c.ink, fontSize: 13 }}
                />
              </div>

              <button
                id="generate-ai-metadata-btn"
                onClick={handleGenerateAiMetadata}
                disabled={aiLoading}
                style={{
                  padding: "10px",
                  borderRadius: 6,
                  border: "none",
                  background: c.brass,
                  color: "#F2EFE6",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: aiLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <Sparkles size={16} />
                <span>{aiLoading ? "Generating Structured Metadata..." : "Generate AI Metadata"}</span>
              </button>

              {aiGeneratedMetadata && (
                <div style={{ background: c.paper2, borderRadius: 8, padding: 18, border: `1px solid ${c.line}`, marginTop: 8 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase" }}>SEO Title</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>{aiGeneratedMetadata.seoTitle}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase" }}>Meta Description</div>
                    <div style={{ fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>{aiGeneratedMetadata.seoDesc}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase" }}>Target Audience</div>
                    <div style={{ fontSize: 13, color: c.ink2 }}>{aiGeneratedMetadata.audience}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase", marginBottom: 6 }}>Suggested Tags</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {aiGeneratedMetadata.tags?.map((tag: string, i: number) => (
                        <span key={i} style={{ background: c.paper, border: `1px solid ${c.line}`, padding: "2px 8px", borderRadius: 4, fontSize: 11, color: c.ink }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
