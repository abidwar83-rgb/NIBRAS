import {
  User, Book, CartItem, Order, LibraryBook, Review,
  Coupon, Advertisement, Bookmark, Highlight, Note, CurrencyCode
} from '../types';

const TOKEN_KEY = 'nibras_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = 'Request failed';
    try {
      const errData = await response.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      errMsg = response.statusText || errMsg;
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setStoredToken(res.token);
      return res;
    },
    register: async (name: string, email: string, password: string, role?: 'CUSTOMER' | 'ADMIN') => {
      const res = await request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      setStoredToken(res.token);
      return res;
    },
    me: async () => {
      return request<{ user: User; purchasedBookIds: string[] }>('/api/auth/me');
    },
    logout: () => {
      clearStoredToken();
    }
  },

  books: {
    list: async (params?: { query?: string; category?: string; minRating?: number; maxPrice?: number; sort?: string; currency?: string }) => {
      const queryStr = new URLSearchParams();
      if (params?.query) queryStr.set('query', params.query);
      if (params?.category) queryStr.set('category', params.category);
      if (params?.minRating) queryStr.set('minRating', params.minRating.toString());
      if (params?.maxPrice) queryStr.set('maxPrice', params.maxPrice.toString());
      if (params?.sort) queryStr.set('sort', params.sort);
      if (params?.currency) queryStr.set('currency', params.currency);
      const url = `/api/books${queryStr.toString() ? '?' + queryStr.toString() : ''}`;
      return request<{ books: Book[] }>(url);
    },
    getById: async (id: string) => {
      return request<{ book: Book; owned: boolean }>(`/api/books/${id}`);
    },
    adminList: async () => {
      return request<{ books: Book[] }>('/api/admin/books');
    },
    create: async (data: Partial<Book>) => {
      return request<{ book: Book }>('/api/books', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    update: async (id: string, updates: Partial<Book>) => {
      return request<{ book: Book }>(`/api/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    delete: async (id: string) => {
      return request<{ success: boolean }>(`/api/books/${id}`, {
        method: 'DELETE'
      });
    },
    getContent: async (id: string) => {
      return request<{ bookId: string; title: string; author: string; chapters: Array<{ id: string; title: string; content: string }> }>(`/api/books/${id}/content`);
    },
    downloadUrl: (id: string) => `/api/books/${id}/download`,
    uploadEbook: async (formData: FormData) => {
      return request<{ book: Book; message: string }>('/api/upload/ebook', {
        method: 'POST',
        body: formData
      });
    }
  },

  cart: {
    get: async () => {
      return request<{ cart: { items: CartItem[] } }>('/api/cart');
    },
    addItem: async (bookId: string, quantity = 1) => {
      return request<{ success: boolean; count: number }>('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ bookId, quantity })
      });
    },
    removeItem: async (bookId: string) => {
      return request<{ success: boolean }>(`/api/cart/items/${bookId}`, {
        method: 'DELETE'
      });
    },
    clear: async () => {
      return request<{ success: boolean }>('/api/cart', {
        method: 'DELETE'
      });
    }
  },

  coupons: {
    validate: async (code: string, subtotal: number) => {
      return request<{ valid: boolean; code: string; discountPercent: number; discountAmount: number }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal })
      });
    }
  },

  orders: {
    create: async (data: { items: Array<{ bookId: string; quantity: number }>; couponCode?: string; currency?: string }) => {
      return request<{ order: Order; clientSecret: string; razorpayOrderId: string }>('/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    verifyPayment: async (data: { orderId: string; paymentId: string }) => {
      return request<{ success: boolean; orderId: string; grantedBookIds: string[]; message: string }>('/api/orders/verify-payment', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    list: async (all = false) => {
      return request<{ orders: Order[] }>(`/api/orders${all ? '?all=true' : ''}`);
    }
  },

  library: {
    get: async () => {
      return request<{ library: LibraryBook[] }>('/api/library');
    },
    saveProgress: async (data: { bookId: string; currentChapterIndex: number; currentPage: number; totalPages: number; progressPercent: number }) => {
      return request<{ progress: any }>('/api/reader/progress', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    getAnnotations: async (bookId: string) => {
      return request<{ bookmarks: Bookmark[]; highlights: Highlight[]; notes: Note[] }>(`/api/reader/${bookId}/annotations`);
    },
    addBookmark: async (data: { bookId: string; chapterIndex: number; page: number; label: string }) => {
      return request<{ bookmark: Bookmark }>('/api/reader/bookmarks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    deleteBookmark: async (id: string) => {
      return request<{ success: boolean }>(`/api/reader/bookmarks/${id}`, {
        method: 'DELETE'
      });
    },
    addHighlight: async (data: { bookId: string; chapterIndex: number; selectedText: string; color: string }) => {
      return request<{ highlight: Highlight }>('/api/reader/highlights', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    deleteHighlight: async (id: string) => {
      return request<{ success: boolean }>(`/api/reader/highlights/${id}`, {
        method: 'DELETE'
      });
    },
    addNote: async (data: { bookId: string; chapterIndex: number; page: number; text: string }) => {
      return request<{ note: Note }>('/api/reader/notes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    deleteNote: async (id: string) => {
      return request<{ success: boolean }>(`/api/reader/notes/${id}`, {
        method: 'DELETE'
      });
    }
  },

  reviews: {
    get: async (bookId: string) => {
      return request<{ reviews: Review[] }>(`/api/books/${bookId}/reviews`);
    },
    submit: async (bookId: string, rating: number, comment: string) => {
      return request<{ review: Review }>(`/api/books/${bookId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
    }
  },

  wishlist: {
    get: async () => {
      return request<{ wishlist: string[] }>('/api/wishlist');
    },
    toggle: async (bookId: string) => {
      return request<{ wishlist: string[] }>('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ bookId })
      });
    }
  },

  ads: {
    list: async () => {
      return request<{ ads: Advertisement[] }>('/api/ads');
    },
    impression: (id: string) => {
      return request<{ success: boolean }>(`/api/ads/${id}/impression`, { method: 'POST' });
    },
    click: (id: string) => {
      return request<{ success: boolean }>(`/api/ads/${id}/click`, { method: 'POST' });
    }
  },

  analytics: {
    track: (type: string, metadata?: Record<string, any>) => {
      return request<{ success: boolean }>('/api/analytics/event', {
        method: 'POST',
        body: JSON.stringify({ type, metadata })
      }).catch(() => {});
    },
    adminMetrics: async () => {
      return request<{
        metrics: {
          totalBooks: number;
          publishedBooks: number;
          totalCustomers: number;
          totalOrders: number;
          totalRevenue: number;
          totalDownloads: number;
        };
        funnel: Array<{ stage: string; count: number }>;
        orders: Order[];
        ads: Advertisement[];
      }>('/api/admin/analytics');
    }
  },

  ai: {
    generateMetadata: async (data: { title: string; author: string; category: string; shortDescription: string }) => {
      return request<{ metadata: any }>('/api/ai/metadata', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    chat: async (bookId: string, question: string) => {
      return request<{ answer: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ bookId, question })
      });
    },
    summarize: async (bookId: string, chapterIndex?: number) => {
      return request<{ summary: string; takeaways: string[] }>('/api/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ bookId, chapterIndex })
      });
    },
    explain: async (bookTitle: string, passage: string, level?: 'simple' | 'in-depth') => {
      return request<{ explanation: string }>('/api/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ bookTitle, passage, level })
      });
    },
    quiz: async (bookId: string) => {
      return request<{ questions: Array<{ question: string; options: string[]; correctAnswerIndex: number; explanation: string }> }>('/api/ai/quiz', {
        method: 'POST',
        body: JSON.stringify({ bookId })
      });
    },
    flashcards: async (bookId: string) => {
      return request<{ flashcards: Array<{ front: string; back: string }> }>('/api/ai/flashcards', {
        method: 'POST',
        body: JSON.stringify({ bookId })
      });
    },
    translate: async (text: string, targetLanguage: string) => {
      return request<{ translatedText: string }>('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLanguage })
      });
    },
    semanticSearch: async (query: string) => {
      return request<{ matches: Array<{ id: string; relevanceScore: number; reason: string }> }>('/api/ai/search', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    }
  }
};

// ----------------------------------------------------
// CURRENCY HELPERS
// ----------------------------------------------------
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
};

export function formatPrice(amountInInr: number, currency: CurrencyCode = "INR"): string {
  const rate = CURRENCY_RATES[currency] || 1;
  const symbol = CURRENCY_SYMBOLS[currency] || "₹";
  const converted = amountInInr * rate;

  if (currency === 'INR') {
    return `${symbol}${amountInInr.toLocaleString('en-IN')}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}
