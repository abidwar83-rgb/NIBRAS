import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User, Book, Category, Order, Purchase, Cart, Wishlist,
  Review, Coupon, ReadingProgress, Bookmark, Highlight,
  Note, Advertisement, DownloadLog, AnalyticsEvent, BookTranslation
} from './types.js';

interface DatabaseSchema {
  users: User[];
  books: Book[];
  categories: Category[];
  orders: Order[];
  purchases: Purchase[];
  carts: Record<string, Cart>; // userId -> Cart
  wishlists: Record<string, Wishlist>; // userId -> Wishlist
  reviews: Review[];
  coupons: Coupon[];
  readingProgress: ReadingProgress[];
  bookmarks: Bookmark[];
  highlights: Highlight[];
  notes: Note[];
  ads: Advertisement[];
  downloadLogs: DownloadLog[];
  analyticsEvents: AnalyticsEvent[];
  translations: BookTranslation[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nibras.json');

const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Technology", slug: "technology" },
  { id: "cat-2", name: "Programming", slug: "programming" },
  { id: "cat-3", name: "AI", slug: "ai" },
  { id: "cat-4", name: "Business", slug: "business" },
  { id: "cat-5", name: "Finance", slug: "finance" },
  { id: "cat-6", name: "Education", slug: "education" },
  { id: "cat-7", name: "Self Improvement", slug: "self-improvement" },
  { id: "cat-8", name: "Fiction", slug: "fiction" },
  { id: "cat-9", name: "Romance", slug: "romance" },
  { id: "cat-10", name: "Mystery", slug: "mystery" },
  { id: "cat-11", name: "Academic", slug: "academic" },
  { id: "cat-12", name: "Children's Books", slug: "childrens-books" },
];

function generateBookContent(title: string, author: string, category: string): { previewChapters: any[]; fullChapters: any[]; chapters: any[] } {
  const preview = [
    {
      id: "ch-1",
      title: "Chapter 1: The Quiet Foundation",
      content: `Chapter One. The first thing to understand about ${title} is that systems fail quietly, long before anyone notices the noise.
It begins, as these things usually do, with a decision that felt too small to write down at the time.
By the second week, the underlying patterns were already visible to anyone who thought to inspect them closely — which, notably, no one had.
In this foundational chapter, ${author} demonstrates why architectural discipline and steady patience outweigh clever short-cuts.
When building for endurance in ${category}, every assumption must be examined, documented, and tested under load.`
    },
    {
      id: "ch-2",
      title: "Chapter 2: Signal in the Friction",
      content: `Chapter Two. Friction is rarely an obstacle; it is diagnostic data.
Whenever a team experiences resistance in their workflows or when an individual struggles with complex material, the natural instinct is to push harder.
Instead, ${author} introduces the principle of deliberate deceleration.
Examining the points of stress reveals where definitions are muddy, where dependencies are coupled, and where unstated expectations clash.`
    }
  ];

  const full = [
    ...preview,
    {
      id: "ch-3",
      title: "Chapter 3: The Three Warning Indicators",
      content: `Chapter Three. In examining historic breakdowns across decades, three specific warning indicators emerge repeatedly:
First: Semantic Drift. When words mean different things to different collaborators, alignment is an illusion.
Second: Invisible Debt. The accumulation of unverified assumptions creates brittleness beneath seemingly stable facades.
Third: Premature Optimization. Pouring concrete around ideas before their operational reality is validated.
Understanding these three indicators equips the reader with practical reflexes for long-term mastery.`
    },
    {
      id: "ch-4",
      title: "Chapter 4: Compounding Knowledge",
      content: `Chapter Four. Learning is not an event; it is a compounding asset.
Just as capital earns interest upon interest, mental models strengthen when connected across varied domains.
${author} provides practical frameworks for organizing notes, reflecting after milestones, and synthesizing complex insights into actionable everyday principles.`
    },
    {
      id: "ch-5",
      title: "Chapter 5: Execution & Mastery",
      content: `Chapter Five. The concluding chapter brings theory into direct application.
True craftsmanship is measured not by how fast one begins, but by the resilience, elegance, and integrity of what remains after years of scrutiny.
Nibras stands as a testament to this ideal: a lamp guiding each step into the next chapter of knowledge.`
    }
  ];

  return {
    previewChapters: preview,
    fullChapters: full,
    chapters: full
  };
}

const SEED_BOOKS: Book[] = [
  {
    id: "b1",
    title: "The Quiet Algorithm",
    author: "Devika Rao",
    category: "Technology",
    price: 449,
    originalPrice: 699,
    rating: 4.6,
    reviewsCount: 212,
    language: "English",
    pages: 284,
    format: "PDF, EPUB",
    publishedDate: "2025-11-02",
    bestseller: true,
    newRelease: false,
    description: "A field guide to the invisible systems shaping daily life — from recommendation engines to traffic lights — told through the people who build and break them.",
    tags: ["systems", "software", "essays", "algorithms"],
    status: "PUBLISHED",
    ...generateBookContent("The Quiet Algorithm", "Devika Rao", "Technology"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b2",
    title: "Learn Python the Patient Way",
    author: "Marcus Ehlers",
    category: "Programming",
    price: 399,
    originalPrice: 399,
    rating: 4.8,
    reviewsCount: 530,
    language: "English",
    pages: 412,
    format: "PDF, EPUB",
    publishedDate: "2024-03-14",
    bestseller: true,
    newRelease: false,
    description: "A beginner's course in Python built around one idea: confusion is data. Every chapter starts from a real mistake and works backward to understanding.",
    tags: ["python", "beginner", "programming", "code"],
    status: "PUBLISHED",
    ...generateBookContent("Learn Python the Patient Way", "Marcus Ehlers", "Programming"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b3",
    title: "Small Models, Sharp Minds",
    author: "Priya Chandrasekaran",
    category: "AI",
    price: 599,
    originalPrice: 849,
    rating: 4.4,
    reviewsCount: 98,
    language: "English",
    pages: 196,
    format: "EPUB",
    publishedDate: "2026-01-20",
    bestseller: false,
    newRelease: true,
    description: "An argument for restraint in machine learning — why the next leap in AI may come from smaller, better-understood models rather than bigger ones.",
    tags: ["machine learning", "ai", "research", "deep learning"],
    status: "PUBLISHED",
    ...generateBookContent("Small Models, Sharp Minds", "Priya Chandrasekaran", "AI"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b4",
    title: "The Founder's Ledger",
    author: "Tomas Rehn",
    category: "Business",
    price: 349,
    originalPrice: 499,
    rating: 4.2,
    reviewsCount: 167,
    language: "English",
    pages: 238,
    format: "PDF, EPUB",
    publishedDate: "2023-08-09",
    bestseller: false,
    newRelease: false,
    description: "A no-nonsense account of the first eighteen months of running a company, told through the actual numbers most founders never show anyone.",
    tags: ["startups", "finance", "memoir", "business"],
    status: "PUBLISHED",
    ...generateBookContent("The Founder's Ledger", "Tomas Rehn", "Business"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b5",
    title: "Compound Thinking",
    author: "Elena Marsh",
    category: "Finance",
    price: 299,
    originalPrice: 299,
    rating: 4.7,
    reviewsCount: 341,
    language: "English",
    pages: 210,
    format: "PDF",
    publishedDate: "2022-05-30",
    bestseller: true,
    newRelease: false,
    description: "Personal finance stripped of jargon: how small, boring decisions made consistently outperform clever ones made occasionally.",
    tags: ["money", "habits", "investing", "wealth"],
    status: "PUBLISHED",
    ...generateBookContent("Compound Thinking", "Elena Marsh", "Finance"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b6",
    title: "Teaching Without a Script",
    author: "Grace Odum",
    category: "Education",
    price: 249,
    originalPrice: 349,
    rating: 4.3,
    reviewsCount: 76,
    language: "English",
    pages: 172,
    format: "EPUB",
    publishedDate: "2025-02-11",
    bestseller: false,
    newRelease: false,
    description: "A classroom teacher's notebook on the moments lesson plans don't cover, and what they taught her about actually reaching students.",
    tags: ["teaching", "education", "pedagogy"],
    status: "PUBLISHED",
    ...generateBookContent("Teaching Without a Script", "Grace Odum", "Education"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b7",
    title: "The Discipline of Rest",
    author: "Kenji Watanabe",
    category: "Self Improvement",
    price: 279,
    originalPrice: 399,
    rating: 4.5,
    reviewsCount: 289,
    language: "English",
    pages: 154,
    format: "PDF, EPUB",
    publishedDate: "2024-09-01",
    bestseller: false,
    newRelease: false,
    description: "A short, practical book on why rest is a skill rather than an absence, and how to build a working relationship with your own limits.",
    tags: ["habits", "wellbeing", "health", "mindset"],
    status: "PUBLISHED",
    ...generateBookContent("The Discipline of Rest", "Kenji Watanabe", "Self Improvement"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b8",
    title: "Salt Water and Citrus",
    author: "Anaya Fernandes",
    category: "Fiction",
    price: 329,
    originalPrice: 329,
    rating: 4.6,
    reviewsCount: 412,
    language: "English",
    pages: 296,
    format: "PDF, EPUB",
    publishedDate: "2025-06-18",
    bestseller: true,
    newRelease: false,
    description: "Three sisters return to their grandmother's coastal house one final summer before it's sold, and unravel a family story none of them knew whole.",
    tags: ["literary fiction", "family", "drama"],
    status: "PUBLISHED",
    ...generateBookContent("Salt Water and Citrus", "Anaya Fernandes", "Fiction"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b9",
    title: "A Longer Way Home",
    author: "Isabel Cortez",
    category: "Romance",
    price: 259,
    originalPrice: 259,
    rating: 4.1,
    reviewsCount: 158,
    language: "English",
    pages: 224,
    format: "EPUB",
    publishedDate: "2026-02-02",
    bestseller: false,
    newRelease: true,
    description: "Two former partners are stranded on the same delayed train route across three countries, and neither of them booked the detour on purpose.",
    tags: ["romance", "slow burn", "travel"],
    status: "PUBLISHED",
    ...generateBookContent("A Longer Way Home", "Isabel Cortez", "Romance"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b10",
    title: "The Cartographer's Alibi",
    author: "Owen Blackwood",
    category: "Mystery",
    price: 319,
    originalPrice: 449,
    rating: 4.4,
    reviewsCount: 203,
    language: "English",
    pages: 268,
    format: "PDF, EPUB",
    publishedDate: "2023-11-27",
    bestseller: false,
    newRelease: false,
    description: "A mapmaker is the only witness to a disappearance in a town that insists nothing has ever happened there — and he has the maps to prove it.",
    tags: ["mystery", "thriller", "suspense"],
    status: "PUBLISHED",
    ...generateBookContent("The Cartographer's Alibi", "Owen Blackwood", "Mystery"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b11",
    title: "Structures & Proofs",
    author: "Dr. Hannah Liu",
    category: "Academic",
    price: 549,
    originalPrice: 549,
    rating: 4.5,
    reviewsCount: 64,
    language: "English",
    pages: 388,
    format: "PDF",
    publishedDate: "2022-01-15",
    bestseller: false,
    newRelease: false,
    description: "An undergraduate companion to discrete mathematics, built around worked proofs rather than isolated theorems.",
    tags: ["mathematics", "textbook", "logic", "proofs"],
    status: "PUBLISHED",
    ...generateBookContent("Structures & Proofs", "Dr. Hannah Liu", "Academic"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b12",
    title: "Wren and the Paper Kingdom",
    author: "Lily Ashworth",
    category: "Children's Books",
    price: 199,
    originalPrice: 249,
    rating: 4.9,
    reviewsCount: 501,
    language: "English",
    pages: 48,
    format: "PDF, EPUB",
    publishedDate: "2025-04-04",
    bestseller: true,
    newRelease: true,
    description: "A folded-paper fox teaches a curious girl that kingdoms can be small, quiet, and still worth defending.",
    tags: ["picture book", "children", "illustrated"],
    status: "PUBLISHED",
    ...generateBookContent("Wren and the Paper Kingdom", "Lily Ashworth", "Children's Books"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file, initializing defaults:', err);
    }
    return this.initializeDefaults();
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private initializeDefaults(): DatabaseSchema {
    const adminPasswordHash = bcrypt.hashSync("admin123", 10);
    const customerPasswordHash = bcrypt.hashSync("customer123", 10);

    const defaultUsers: User[] = [
      {
        id: "usr-admin",
        name: "Nibras Administrator",
        email: "admin@nibras.com",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        createdAt: new Date("2025-01-01").toISOString()
      },
      {
        id: "usr-customer",
        name: "Aarav Mehta",
        email: "aarav.mehta@example.com",
        passwordHash: customerPasswordHash,
        role: "CUSTOMER",
        createdAt: new Date("2025-02-15").toISOString()
      }
    ];

    const defaultPurchases: Purchase[] = [
      {
        id: "pur-1",
        userId: "usr-customer",
        bookId: "b1",
        orderId: "ord-1001",
        purchasedAt: new Date("2026-02-10").toISOString(),
        pricePaid: 449,
        currency: "INR"
      },
      {
        id: "pur-2",
        userId: "usr-customer",
        bookId: "b2",
        orderId: "ord-1002",
        purchasedAt: new Date("2026-03-01").toISOString(),
        pricePaid: 399,
        currency: "INR"
      }
    ];

    const defaultOrders: Order[] = [
      {
        id: "ord-1001",
        userId: "usr-customer",
        customerName: "Aarav Mehta",
        customerEmail: "aarav.mehta@example.com",
        items: [{ bookId: "b1", title: "The Quiet Algorithm", price: 449, quantity: 1 }],
        subtotal: 449,
        discount: 0,
        total: 449,
        currency: "INR",
        status: "PAID",
        paymentId: "pay_sample_1001",
        createdAt: new Date("2026-02-10").toISOString()
      },
      {
        id: "ord-1002",
        userId: "usr-customer",
        customerName: "Aarav Mehta",
        customerEmail: "aarav.mehta@example.com",
        items: [{ bookId: "b2", title: "Learn Python the Patient Way", price: 399, quantity: 1 }],
        subtotal: 399,
        discount: 0,
        total: 399,
        currency: "INR",
        status: "PAID",
        paymentId: "pay_sample_1002",
        createdAt: new Date("2026-03-01").toISOString()
      }
    ];

    const defaultCoupons: Coupon[] = [
      {
        id: "cp-1",
        code: "NIBRAS10",
        discountPercent: 0.10,
        minOrderValue: 0,
        expiryDate: "2027-12-31",
        usageLimit: 1000,
        timesUsed: 42,
        isActive: true
      },
      {
        id: "cp-2",
        code: "WELCOME50",
        discountPercent: 0.15,
        minOrderValue: 500,
        expiryDate: "2027-12-31",
        usageLimit: 500,
        timesUsed: 19,
        isActive: true
      },
      {
        id: "cp-3",
        code: "SPRING25",
        discountPercent: 0.25,
        minOrderValue: 1000,
        expiryDate: "2027-06-30",
        usageLimit: 200,
        timesUsed: 8,
        isActive: true
      }
    ];

    const defaultAds: Advertisement[] = [
      {
        id: "ad-1",
        title: "Spring Season Spotlight: Essential Systems",
        placement: "HOME_BANNER",
        targetUrl: "/books",
        impressions: 12450,
        clicks: 342,
        active: true,
        startDate: "2026-01-01",
        endDate: "2026-12-31"
      },
      {
        id: "ad-2",
        title: "Sponsored: Compound Thinking by Elena Marsh",
        placement: "SPONSORED_BOOK",
        targetUrl: "/books/b5",
        impressions: 8320,
        clicks: 215,
        active: true,
        startDate: "2026-02-01",
        endDate: "2026-12-31"
      },
      {
        id: "ad-3",
        title: "Staff Picks: Small Models, Sharp Minds",
        placement: "SIDEBAR",
        targetUrl: "/books/b3",
        impressions: 5410,
        clicks: 128,
        active: true,
        startDate: "2026-02-15",
        endDate: "2026-12-31"
      }
    ];

    const defaultReviews: Review[] = [
      {
        id: "rev-1",
        bookId: "b1",
        userId: "usr-customer",
        userName: "Aarav Mehta",
        rating: 5,
        comment: "Exactly the kind of book I keep recommending to friends who ask where to start understanding modern software.",
        verifiedPurchase: true,
        createdAt: "2026-02-14",
        approved: true
      },
      {
        id: "rev-2",
        bookId: "b1",
        userId: "usr-random1",
        userName: "R. Sharma",
        rating: 5,
        comment: "Dense in places but the payoff in the final chapters made it completely worth slowing down for.",
        verifiedPurchase: true,
        createdAt: "2026-02-20",
        approved: true
      },
      {
        id: "rev-3",
        bookId: "b2",
        userId: "usr-customer",
        userName: "Aarav Mehta",
        rating: 5,
        comment: "The error-first approach really cemented python syntax for me.",
        verifiedPurchase: true,
        createdAt: "2026-03-02",
        approved: true
      }
    ];

    const initialData: DatabaseSchema = {
      users: defaultUsers,
      books: SEED_BOOKS,
      categories: INITIAL_CATEGORIES,
      orders: defaultOrders,
      purchases: defaultPurchases,
      carts: {
        "usr-customer": { userId: "usr-customer", items: [], updatedAt: new Date().toISOString() }
      },
      wishlists: {
        "usr-customer": { userId: "usr-customer", bookIds: ["b3", "b8"], updatedAt: new Date().toISOString() }
      },
      reviews: defaultReviews,
      coupons: defaultCoupons,
      readingProgress: [
        {
          id: "prog-1",
          userId: "usr-customer",
          bookId: "b1",
          currentChapterIndex: 1,
          currentPage: 24,
          totalPages: 284,
          progressPercent: 35,
          lastReadAt: new Date().toISOString()
        }
      ],
      bookmarks: [
        {
          id: "bm-1",
          userId: "usr-customer",
          bookId: "b1",
          chapterIndex: 1,
          page: 12,
          label: "Signal in the Friction note",
          createdAt: new Date().toISOString()
        }
      ],
      highlights: [
        {
          id: "hl-1",
          userId: "usr-customer",
          bookId: "b1",
          chapterIndex: 0,
          selectedText: "systems fail quietly, long before anyone notices the noise.",
          color: "yellow",
          createdAt: new Date().toISOString()
        }
      ],
      notes: [
        {
          id: "nt-1",
          userId: "usr-customer",
          bookId: "b1",
          chapterIndex: 1,
          page: 14,
          text: "Remember to apply this principle when reviewing architecture bottlenecks.",
          createdAt: new Date().toISOString()
        }
      ],
      ads: defaultAds,
      downloadLogs: [],
      analyticsEvents: [
        {
          id: "ev-1",
          type: "BOOK_VIEW",
          userId: "usr-customer",
          metadata: { bookId: "b1" },
          timestamp: new Date().toISOString()
        }
      ],
      translations: []
    };

    this.data = initialData;
    this.save();
    return initialData;
  }

  // --- Users ---
  public getUsers(): User[] { return this.data.users; }
  public getUserById(id: string): User | undefined { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  public addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  // --- Books ---
  public getBooks(): Book[] { return this.data.books; }
  public getBookById(id: string): Book | undefined { return this.data.books.find(b => b.id === id); }
  public addBook(book: Book): void {
    this.data.books.unshift(book);
    this.save();
  }
  public updateBook(id: string, updates: Partial<Book>): Book | undefined {
    const idx = this.data.books.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    this.data.books[idx] = { ...this.data.books[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.books[idx];
  }
  public deleteBook(id: string): boolean {
    const len = this.data.books.length;
    this.data.books = this.data.books.filter(b => b.id !== id);
    if (this.data.books.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Categories ---
  public getCategories(): Category[] { return this.data.categories; }
  public addCategory(cat: Category): void {
    this.data.categories.push(cat);
    this.save();
  }

  // --- Purchases & Library ---
  public getPurchases(userId: string): Purchase[] {
    return this.data.purchases.filter(p => p.userId === userId);
  }
  public hasPurchased(userId: string, bookId: string): boolean {
    return this.data.purchases.some(p => p.userId === userId && p.bookId === bookId);
  }
  public addPurchase(purchase: Purchase): void {
    this.data.purchases.push(purchase);
    this.save();
  }

  // --- Orders ---
  public getOrders(userId?: string): Order[] {
    if (userId) {
      return this.data.orders.filter(o => o.userId === userId);
    }
    return this.data.orders;
  }
  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }
  public addOrder(order: Order): void {
    this.data.orders.unshift(order);
    this.save();
  }
  public updateOrder(id: string, updates: Partial<Order>): void {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
      this.save();
    }
  }

  // --- Cart ---
  public getCart(userId: string): Cart {
    if (!this.data.carts[userId]) {
      this.data.carts[userId] = { userId, items: [], updatedAt: new Date().toISOString() };
      this.save();
    }
    return this.data.carts[userId];
  }
  public updateCart(userId: string, items: { id: string; bookId: string; quantity: number }[]): Cart {
    this.data.carts[userId] = { userId, items, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.carts[userId];
  }

  // --- Wishlist ---
  public getWishlist(userId: string): string[] {
    return this.data.wishlists[userId]?.bookIds || [];
  }
  public toggleWishlist(userId: string, bookId: string): string[] {
    if (!this.data.wishlists[userId]) {
      this.data.wishlists[userId] = { userId, bookIds: [], updatedAt: new Date().toISOString() };
    }
    const list = this.data.wishlists[userId].bookIds;
    const exists = list.includes(bookId);
    if (exists) {
      this.data.wishlists[userId].bookIds = list.filter(id => id !== bookId);
    } else {
      this.data.wishlists[userId].bookIds.push(bookId);
    }
    this.data.wishlists[userId].updatedAt = new Date().toISOString();
    this.save();
    return this.data.wishlists[userId].bookIds;
  }

  // --- Reviews ---
  public getReviews(bookId: string): Review[] {
    return this.data.reviews.filter(r => r.bookId === bookId && r.approved);
  }
  public addReview(review: Review): void {
    this.data.reviews.unshift(review);
    // update book rating
    const bookReviews = this.data.reviews.filter(r => r.bookId === review.bookId);
    const avg = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
    const rounded = Math.round(avg * 10) / 10;
    this.updateBook(review.bookId, { rating: rounded, reviewsCount: bookReviews.length });
    this.save();
  }

  // --- Coupons ---
  public getCoupons(): Coupon[] { return this.data.coupons; }
  public getCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  }
  public addCoupon(coupon: Coupon): void {
    this.data.coupons.push(coupon);
    this.save();
  }
  public incrementCouponUsage(code: string): void {
    const c = this.getCouponByCode(code);
    if (c) {
      c.timesUsed += 1;
      this.save();
    }
  }

  // --- Reader Progress ---
  public getProgress(userId: string, bookId: string): ReadingProgress | undefined {
    return this.data.readingProgress.find(p => p.userId === userId && p.bookId === bookId);
  }
  public setProgress(progress: Omit<ReadingProgress, 'id'>): ReadingProgress {
    const idx = this.data.readingProgress.findIndex(
      p => p.userId === progress.userId && p.bookId === progress.bookId
    );
    const updated: ReadingProgress = {
      id: idx !== -1 ? this.data.readingProgress[idx].id : `prog-${Date.now()}`,
      ...progress
    };
    if (idx !== -1) {
      this.data.readingProgress[idx] = updated;
    } else {
      this.data.readingProgress.push(updated);
    }
    this.save();
    return updated;
  }

  // --- Bookmarks, Highlights, Notes ---
  public getBookmarks(userId: string, bookId: string): Bookmark[] {
    return this.data.bookmarks.filter(b => b.userId === userId && b.bookId === bookId);
  }
  public addBookmark(bookmark: Bookmark): void {
    this.data.bookmarks.push(bookmark);
    this.save();
  }
  public deleteBookmark(id: string, userId: string): void {
    this.data.bookmarks = this.data.bookmarks.filter(b => !(b.id === id && b.userId === userId));
    this.save();
  }

  public getHighlights(userId: string, bookId: string): Highlight[] {
    return this.data.highlights.filter(h => h.userId === userId && h.bookId === bookId);
  }
  public addHighlight(hl: Highlight): void {
    this.data.highlights.push(hl);
    this.save();
  }
  public deleteHighlight(id: string, userId: string): void {
    this.data.highlights = this.data.highlights.filter(h => !(h.id === id && h.userId === userId));
    this.save();
  }

  public getNotes(userId: string, bookId: string): Note[] {
    return this.data.notes.filter(n => n.userId === userId && n.bookId === bookId);
  }
  public addNote(note: Note): void {
    this.data.notes.push(note);
    this.save();
  }
  public deleteNote(id: string, userId: string): void {
    this.data.notes = this.data.notes.filter(n => !(n.id === id && n.userId === userId));
    this.save();
  }

  // --- Ads ---
  public getAds(): Advertisement[] { return this.data.ads; }
  public addAd(ad: Advertisement): void {
    this.data.ads.push(ad);
    this.save();
  }
  public recordAdImpression(id: string): void {
    const ad = this.data.ads.find(a => a.id === id);
    if (ad) {
      ad.impressions += 1;
      this.save();
    }
  }
  public recordAdClick(id: string): void {
    const ad = this.data.ads.find(a => a.id === id);
    if (ad) {
      ad.clicks += 1;
      this.save();
    }
  }

  // --- Download Logs ---
  public addDownloadLog(log: DownloadLog): void {
    this.data.downloadLogs.push(log);
    this.save();
  }
  public getDownloadLogs(): DownloadLog[] { return this.data.downloadLogs; }

  // --- Analytics ---
  public trackEvent(event: AnalyticsEvent): void {
    this.data.analyticsEvents.push(event);
    if (this.data.analyticsEvents.length > 5000) {
      this.data.analyticsEvents = this.data.analyticsEvents.slice(-4000);
    }
    this.save();
  }
  public getAnalyticsEvents(): AnalyticsEvent[] { return this.data.analyticsEvents; }
}

export const db = new Database();
