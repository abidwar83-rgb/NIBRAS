export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export type BookStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";

export interface BookChapter {
  id: string;
  title: string;
  content: string;
}

export interface BookFile {
  id: string;
  bookId: string;
  fileName: string;
  fileType: "PDF" | "EPUB";
  fileSize: number;
  filePath: string;
  createdAt: string;
}

export interface BookTranslation {
  id: string;
  bookId: string;
  language: string;
  title: string;
  description: string;
  sampleText?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number; // in INR base currency
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  language: string;
  pages: number;
  format: string; // e.g. "PDF, EPUB"
  publishedDate: string;
  bestseller: boolean;
  newRelease: boolean;
  description: string;
  tags: string[];
  status: BookStatus;
  coverImage?: string;
  isbn?: string;
  previewChapters: BookChapter[];
  fullChapters: BookChapter[]; // accessible only after purchase
  createdAt: string;
  updatedAt: string;
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

export interface Purchase {
  id: string;
  userId: string;
  bookId: string;
  orderId: string;
  purchasedAt: string;
  pricePaid: number;
  currency: string;
}

export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Wishlist {
  userId: string;
  bookIds: string[];
  updatedAt: string;
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
  approved: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number; // e.g. 0.10 for 10%
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  currentChapterIndex: number;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  lastReadAt: string;
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

export interface Advertisement {
  id: string;
  title: string;
  placement: "HOME_BANNER" | "SPONSORED_BOOK" | "SIDEBAR";
  targetUrl: string;
  imageUrl?: string;
  impressions: number;
  clicks: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface DownloadLog {
  id: string;
  userId: string;
  bookId: string;
  fileType: string;
  ipAddress?: string;
  downloadedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type:
    | "BOOK_VIEW"
    | "SEARCH"
    | "ADD_TO_CART"
    | "CHECKOUT_STARTED"
    | "PURCHASE"
    | "DOWNLOAD"
    | "BOOK_OPEN"
    | "READING_PROGRESS"
    | "WISHLIST_ADD"
    | "REVIEW"
    | "AI_QUERY";
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
