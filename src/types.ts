export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface BookChapter {
  id: string;
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  language: string;
  pages: number;
  format: string;
  publishedDate: string;
  bestseller: boolean;
  newRelease: boolean;
  description: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  coverImage?: string;
  chapters?: BookChapter[];
  previewChapters?: BookChapter[];
  fullChapters?: BookChapter[];
  owned?: boolean;
}

export interface ReadingProgress {
  bookId?: string;
  currentChapterIndex?: number;
  completionPercentage: number;
  lastReadAt?: string;
}

export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
  book?: Book;
}

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED";
  paymentId?: string;
  createdAt: string;
}

export interface LibraryBook extends Book {
  purchasedAt: string;
  progressPercent: number;
  currentChapterIndex: number;
  currentPage: number;
  lastReadAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export interface Advertisement {
  id: string;
  title: string;
  placement: "HOME_BANNER" | "SPONSORED_BOOK" | "SIDEBAR";
  targetUrl: string;
  impressions: number;
  clicks: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  chapterIndex: number;
  page: number;
  label: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  chapterIndex: number;
  selectedText: string;
  color: "yellow" | "green" | "blue" | "pink";
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  bookId: string;
  chapterIndex: number;
  page: number;
  text: string;
  createdAt: string;
}

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // relative to INR
}

export type LanguageCode =
  | "en"
  | "hi"
  | "ur"
  | "ar"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "ml"
  | "pa"
  | "kn";
