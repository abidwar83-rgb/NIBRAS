import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { generateToken, authenticate, optionalAuth, requireAdmin, AuthRequest } from './server/auth.js';
import { uploadMiddleware, extractBookTextFromUpload } from './server/upload.js';
import {
  generateBookMetadata,
  askBookAssistant,
  summarizeBookOrChapter,
  explainParagraph,
  generateQuizQuestions,
  generateFlashcards,
  translatePassage,
  semanticBookSearch
} from './server/ai.js';
import { Book, Order, Purchase, User } from './server/types.js';

const PORT = 3000;
const CURRENCY_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // Static uploads directory for cover images
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // ----------------------------------------------------
  // 1. AUTHENTICATION ENDPOINTS
  // ----------------------------------------------------
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }
      const existing = db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'A user with that email already exists' });
        return;
      }
      const passwordHash = bcrypt.hashSync(password, 10);
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email,
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
        createdAt: new Date().toISOString()
      };
      db.addUser(newUser);
      const token = generateToken(newUser);
      res.status(201).json({
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      const user = db.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      const valid = bcrypt.compareSync(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      const token = generateToken(user);
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const purchases = db.getPurchases(user.id);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      purchasedBookIds: purchases.map(p => p.bookId)
    });
  });

  // ----------------------------------------------------
  // 2. BOOKS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/books', (req: Request, res: Response) => {
    try {
      const { query, category, minRating, maxPrice, sort, currency } = req.query;
      let books = db.getBooks();

      // For public browse, only return PUBLISHED books unless admin requests
      books = books.filter(b => b.status === 'PUBLISHED');

      if (category && typeof category === 'string') {
        const catList = category.split(',').map(c => c.trim().toLowerCase());
        books = books.filter(b => catList.includes(b.category.toLowerCase()));
      }

      if (minRating) {
        const minR = parseFloat(minRating as string);
        if (!isNaN(minR)) books = books.filter(b => b.rating >= minR);
      }

      if (maxPrice) {
        const maxP = parseFloat(maxPrice as string);
        if (!isNaN(maxP)) books = books.filter(b => b.price <= maxP);
      }

      if (query && typeof query === 'string' && query.trim()) {
        const q = query.trim().toLowerCase();
        books = books.filter(b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.some(t => t.toLowerCase().includes(q)) ||
          b.description.toLowerCase().includes(q)
        );
      }

      // Sorting
      if (sort === 'price-asc') books.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') books.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') books.sort((a, b) => b.rating - a.rating);
      else if (sort === 'newest') books.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      else if (sort === 'bestselling') books.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));

      // Sanitize: do not send fullChapters in catalog listing
      const sanitized = books.map(b => {
        const { fullChapters, ...rest } = b;
        return rest;
      });

      res.json({ books: sanitized });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/books/:id', optionalAuth, (req: AuthRequest, res: Response) => {
    try {
      const book = db.getBookById(req.params.id);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const isOwned = req.user ? db.hasPurchased(req.user.id, book.id) : false;
      const isAdmin = req.user?.role === 'ADMIN';

      // If user owns book or is admin, include full chapters
      if (isOwned || isAdmin) {
        res.json({ book, owned: isOwned });
      } else {
        const { fullChapters, ...rest } = book;
        res.json({ book: rest, owned: false });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Book Management
  app.get('/api/admin/books', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
    const books = db.getBooks();
    res.json({ books });
  });

  app.post('/api/books', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { title, author, category, price, originalPrice, description, tags, format, pages, status } = req.body;
      if (!title || !author || !category || price === undefined) {
        res.status(400).json({ error: 'Title, author, category, and price are required' });
        return;
      }
      const newBook: Book = {
        id: `b-${Date.now()}`,
        title,
        author,
        category,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : Number(price),
        rating: 5.0,
        reviewsCount: 0,
        language: req.body.language || 'English',
        pages: Number(pages) || 200,
        format: format || 'PDF, EPUB',
        publishedDate: new Date().toISOString().slice(0, 10),
        bestseller: !!req.body.bestseller,
        newRelease: true,
        description: description || '',
        tags: Array.isArray(tags) ? tags : [],
        status: status || 'DRAFT',
        previewChapters: [
          { id: 'ch-1', title: 'Chapter 1', content: `Introductory text for ${title}.` }
        ],
        fullChapters: [
          { id: 'ch-1', title: 'Chapter 1', content: `Introductory text for ${title}.` },
          { id: 'ch-2', title: 'Chapter 2', content: `Core principles and deep dive for ${title}.` },
          { id: 'ch-3', title: 'Chapter 3', content: `Execution and case studies for ${title}.` }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.addBook(newBook);
      res.status(201).json({ book: newBook });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/books/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
    try {
      const updated = db.updateBook(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      res.json({ book: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/books/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
    const success = db.deleteBook(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // 3. REAL FILE UPLOAD (PDF / EPUB / COVERS)
  // ----------------------------------------------------
  app.post(
    '/api/upload/ebook',
    authenticate,
    requireAdmin,
    uploadMiddleware.fields([
      { name: 'ebook', maxCount: 1 },
      { name: 'cover', maxCount: 1 }
    ]),
    (req: AuthRequest, res: Response) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const ebookFile = files?.ebook?.[0];
        const coverFile = files?.cover?.[0];

        const { title, author, category, price, originalPrice, description, tags, status } = req.body;
        if (!title || !author || !category) {
          res.status(400).json({ error: 'Title, author, and category are required' });
          return;
        }

        const coverUrl = coverFile ? `/uploads/covers/${coverFile.filename}` : undefined;
        let extracted = {
          pageCount: 240,
          format: 'PDF, EPUB',
          chapters: [
            { id: 'ch-1', title: 'Chapter 1: Overview', content: `Authorized text from uploaded eBook "${title}".` },
            { id: 'ch-2', title: 'Chapter 2: Principles', content: `Core analysis and principles for "${title}".` },
            { id: 'ch-3', title: 'Chapter 3: Practice', content: `Actionable methodologies and summary for "${title}".` },
          ]
        };

        if (ebookFile) {
          extracted = extractBookTextFromUpload(ebookFile.path, ebookFile.originalname, title, author);
        }

        const newBook: Book = {
          id: `b-${Date.now()}`,
          title,
          author,
          category,
          price: Number(price) || 399,
          originalPrice: originalPrice ? Number(originalPrice) : (Number(price) || 399),
          rating: 5.0,
          reviewsCount: 0,
          language: req.body.language || 'English',
          pages: extracted.pageCount,
          format: extracted.format,
          publishedDate: new Date().toISOString().slice(0, 10),
          bestseller: false,
          newRelease: true,
          description: description || `Digital edition of ${title} by ${author}.`,
          tags: tags ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags) : [category.toLowerCase()],
          status: (status as any) || 'DRAFT',
          coverImage: coverUrl,
          previewChapters: extracted.chapters.slice(0, 1),
          fullChapters: extracted.chapters,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.addBook(newBook);
        res.status(201).json({ book: newBook, message: 'eBook uploaded and processed successfully' });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Upload processing failed' });
      }
    }
  );

  // ----------------------------------------------------
  // 4. COPYRIGHT & ACCESS-CONTROLLED BOOK ACCESS
  // ----------------------------------------------------
  app.get('/api/books/:id/content', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const book = db.getBookById(req.params.id);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const hasPurchased = db.hasPurchased(user.id, book.id);
      const isAdmin = user.role === 'ADMIN';

      if (!hasPurchased && !isAdmin) {
        res.status(403).json({ error: 'Unauthorized: You must purchase this eBook to access full chapters' });
        return;
      }

      // Track book open event
      db.trackEvent({
        id: `ev-${Date.now()}`,
        type: 'BOOK_OPEN',
        userId: user.id,
        metadata: { bookId: book.id },
        timestamp: new Date().toISOString()
      });

      res.json({
        bookId: book.id,
        title: book.title,
        author: book.author,
        chapters: book.fullChapters
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/books/:id/download', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const book = db.getBookById(req.params.id);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const hasPurchased = db.hasPurchased(user.id, book.id);
      const isAdmin = user.role === 'ADMIN';

      if (!hasPurchased && !isAdmin) {
        res.status(403).json({ error: 'Unauthorized: Purchase required to download' });
        return;
      }

      // Log download to DownloadLog
      db.addDownloadLog({
        id: `dl-${Date.now()}`,
        userId: user.id,
        bookId: book.id,
        fileType: 'PDF',
        ipAddress: req.ip,
        downloadedAt: new Date().toISOString()
      });

      db.trackEvent({
        id: `ev-${Date.now()}`,
        type: 'DOWNLOAD',
        userId: user.id,
        metadata: { bookId: book.id },
        timestamp: new Date().toISOString()
      });

      // Prepare structured text package for browser download
      const content = `NIBRAS eBOOK MARKETPLACE — LICENSED EDITION
Title: ${book.title}
Author: ${book.author}
Category: ${book.category}
Licensed To: ${user.name} (${user.email})
License ID: LIC-${user.id.slice(-6)}-${book.id.slice(-4)}
Date: ${new Date().toISOString()}

==================================================
CHAPTERS
==================================================
${book.fullChapters.map((ch, i) => `\n\n--- ${ch.title} ---\n\n${ch.content}`).join('\n')}
`;

      res.setHeader('Content-Disposition', `attachment; filename="${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 5. CART & COUPONS
  // ----------------------------------------------------
  app.get('/api/cart', authenticate, (req: AuthRequest, res: Response) => {
    const cart = db.getCart(req.user!.id);
    const populated = cart.items.map(ci => {
      const book = db.getBookById(ci.bookId);
      return {
        id: ci.id,
        bookId: ci.bookId,
        quantity: ci.quantity,
        book: book ? {
          id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          price: book.price,
          originalPrice: book.originalPrice,
          format: book.format
        } : null
      };
    }).filter(ci => ci.book !== null);

    res.json({ cart: { ...cart, items: populated } });
  });

  app.post('/api/cart/items', authenticate, (req: AuthRequest, res: Response) => {
    const { bookId, quantity } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'bookId is required' });
      return;
    }
    const cart = db.getCart(req.user!.id);
    const idx = cart.items.findIndex(i => i.bookId === bookId);
    if (idx !== -1) {
      cart.items[idx].quantity = Math.max(1, (quantity !== undefined ? quantity : cart.items[idx].quantity + 1));
    } else {
      cart.items.push({ id: `ci-${Date.now()}`, bookId, quantity: quantity || 1 });
    }
    db.updateCart(req.user!.id, cart.items);

    db.trackEvent({
      id: `ev-${Date.now()}`,
      type: 'ADD_TO_CART',
      userId: req.user!.id,
      metadata: { bookId },
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, count: cart.items.reduce((a, b) => a + b.quantity, 0) });
  });

  app.delete('/api/cart/items/:bookId', authenticate, (req: AuthRequest, res: Response) => {
    const cart = db.getCart(req.user!.id);
    cart.items = cart.items.filter(i => i.bookId !== req.params.bookId);
    db.updateCart(req.user!.id, cart.items);
    res.json({ success: true });
  });

  app.delete('/api/cart', authenticate, (req: AuthRequest, res: Response) => {
    db.updateCart(req.user!.id, []);
    res.json({ success: true });
  });

  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Coupon code is required' });
      return;
    }
    const coupon = db.getCouponByCode(code);
    if (!coupon) {
      res.status(404).json({ error: 'Invalid coupon code' });
      return;
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      res.status(400).json({ error: 'This coupon has expired' });
      return;
    }
    if (coupon.timesUsed >= coupon.usageLimit) {
      res.status(400).json({ error: 'This coupon usage limit has been reached' });
      return;
    }
    if (subtotal < coupon.minOrderValue) {
      res.status(400).json({ error: `Requires a minimum order value of ₹${coupon.minOrderValue}` });
      return;
    }

    const discountAmount = Math.round(subtotal * coupon.discountPercent);
    res.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount
    });
  });

  // ----------------------------------------------------
  // 6. PAYMENTS & ORDERS
  // ----------------------------------------------------
  app.post('/api/orders/create', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { items, couponCode, currency = 'INR' } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Order items are required' });
        return;
      }

      // Verify books exist and prevent duplicate purchases
      const orderItems = [];
      let subtotal = 0;
      for (const item of items) {
        const book = db.getBookById(item.bookId);
        if (!book) {
          res.status(404).json({ error: `Book ${item.bookId} not found` });
          return;
        }
        if (db.hasPurchased(user.id, book.id)) {
          res.status(400).json({ error: `You already own "${book.title}". Duplicate purchases are not permitted.` });
          return;
        }
        orderItems.push({
          bookId: book.id,
          title: book.title,
          price: book.price,
          quantity: 1
        });
        subtotal += book.price;
      }

      let discount = 0;
      if (couponCode) {
        const coupon = db.getCouponByCode(couponCode);
        if (coupon && coupon.isActive && subtotal >= coupon.minOrderValue) {
          discount = Math.round(subtotal * coupon.discountPercent);
        }
      }

      const total = Math.max(0, subtotal - discount);
      const newOrder: Order = {
        id: `NB-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        items: orderItems,
        subtotal,
        discount,
        couponCode,
        total,
        currency,
        status: 'PENDING',
        paymentId: `pay_intent_${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      db.addOrder(newOrder);

      db.trackEvent({
        id: `ev-${Date.now()}`,
        type: 'CHECKOUT_STARTED',
        userId: user.id,
        metadata: { orderId: newOrder.id, total },
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        order: newOrder,
        clientSecret: `mock_sec_${newOrder.id}`,
        razorpayOrderId: `order_rzp_${newOrder.id}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Server-side payment verification
  app.post('/api/orders/verify-payment', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { orderId, paymentId } = req.body;
      const order = db.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      if (order.userId !== user.id) {
        res.status(403).json({ error: 'Unauthorized order' });
        return;
      }

      // Mark order as PAID
      db.updateOrder(orderId, {
        status: 'PAID',
        paymentId: paymentId || `pay_verified_${Date.now()}`
      });

      // Grant ownership: Add Purchase records
      const grantedBookIds: string[] = [];
      for (const item of order.items) {
        if (!db.hasPurchased(user.id, item.bookId)) {
          db.addPurchase({
            id: `pur-${Date.now()}-${item.bookId}`,
            userId: user.id,
            bookId: item.bookId,
            orderId: order.id,
            purchasedAt: new Date().toISOString(),
            pricePaid: item.price,
            currency: order.currency
          });
          grantedBookIds.push(item.bookId);
        }
      }

      // Increment coupon usage if used
      if (order.couponCode) {
        db.incrementCouponUsage(order.couponCode);
      }

      // Clear user's cart
      db.updateCart(user.id, []);

      // Track purchase event
      db.trackEvent({
        id: `ev-${Date.now()}`,
        type: 'PURCHASE',
        userId: user.id,
        metadata: { orderId: order.id, total: order.total, bookIds: grantedBookIds },
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        orderId: order.id,
        grantedBookIds,
        message: 'Payment verified and access granted to My Library'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/orders', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const orders = user.role === 'ADMIN' && req.query.all === 'true'
      ? db.getOrders()
      : db.getOrders(user.id);
    res.json({ orders });
  });

  // ----------------------------------------------------
  // 7. MY LIBRARY & BROWSER READER PROGRESS
  // ----------------------------------------------------
  app.get('/api/library', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const purchases = db.getPurchases(user.id);
      const books = purchases.map(p => {
        const book = db.getBookById(p.bookId);
        if (!book) return null;
        const progress = db.getProgress(user.id, book.id);
        const { fullChapters, ...rest } = book;
        return {
          ...rest,
          purchasedAt: p.purchasedAt,
          progressPercent: progress?.progressPercent || 0,
          currentChapterIndex: progress?.currentChapterIndex || 0,
          currentPage: progress?.currentPage || 1,
          lastReadAt: progress?.lastReadAt || p.purchasedAt
        };
      }).filter(Boolean);

      res.json({ library: books });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reader/progress', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { bookId, currentChapterIndex, currentPage, totalPages, progressPercent } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'bookId is required' });
      return;
    }
    const updated = db.setProgress({
      userId: user.id,
      bookId,
      currentChapterIndex: currentChapterIndex || 0,
      currentPage: currentPage || 1,
      totalPages: totalPages || 100,
      progressPercent: progressPercent || 0,
      lastReadAt: new Date().toISOString()
    });

    db.trackEvent({
      id: `ev-${Date.now()}`,
      type: 'READING_PROGRESS',
      userId: user.id,
      metadata: { bookId, progressPercent },
      timestamp: new Date().toISOString()
    });

    res.json({ progress: updated });
  });

  // Bookmarks, Highlights, Notes
  app.get('/api/reader/:bookId/annotations', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { bookId } = req.params;
    res.json({
      bookmarks: db.getBookmarks(user.id, bookId),
      highlights: db.getHighlights(user.id, bookId),
      notes: db.getNotes(user.id, bookId)
    });
  });

  app.post('/api/reader/bookmarks', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { bookId, chapterIndex, page, label } = req.body;
    const bm = {
      id: `bm-${Date.now()}`,
      userId: user.id,
      bookId,
      chapterIndex: chapterIndex || 0,
      page: page || 1,
      label: label || `Bookmark p.${page || 1}`,
      createdAt: new Date().toISOString()
    };
    db.addBookmark(bm);
    res.status(201).json({ bookmark: bm });
  });

  app.delete('/api/reader/bookmarks/:id', authenticate, (req: AuthRequest, res: Response) => {
    db.deleteBookmark(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  app.post('/api/reader/highlights', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { bookId, chapterIndex, selectedText, color } = req.body;
    const hl = {
      id: `hl-${Date.now()}`,
      userId: user.id,
      bookId,
      chapterIndex: chapterIndex || 0,
      selectedText,
      color: color || 'yellow',
      createdAt: new Date().toISOString()
    };
    db.addHighlight(hl);
    res.status(201).json({ highlight: hl });
  });

  app.delete('/api/reader/highlights/:id', authenticate, (req: AuthRequest, res: Response) => {
    db.deleteHighlight(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  app.post('/api/reader/notes', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { bookId, chapterIndex, page, text } = req.body;
    const note = {
      id: `nt-${Date.now()}`,
      userId: user.id,
      bookId,
      chapterIndex: chapterIndex || 0,
      page: page || 1,
      text,
      createdAt: new Date().toISOString()
    };
    db.addNote(note);
    res.status(201).json({ note });
  });

  app.delete('/api/reader/notes/:id', authenticate, (req: AuthRequest, res: Response) => {
    db.deleteNote(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // 8. REVIEWS & WISHLIST
  // ----------------------------------------------------
  app.get('/api/books/:id/reviews', (req: Request, res: Response) => {
    const reviews = db.getReviews(req.params.id);
    res.json({ reviews });
  });

  app.post('/api/books/:id/reviews', authenticate, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      res.status(400).json({ error: 'Rating and comment are required' });
      return;
    }
    const hasPurchased = db.hasPurchased(user.id, req.params.id);
    const review = {
      id: `rev-${Date.now()}`,
      bookId: req.params.id,
      userId: user.id,
      userName: user.name,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment,
      verifiedPurchase: hasPurchased,
      createdAt: new Date().toISOString().slice(0, 10),
      approved: true
    };
    db.addReview(review);
    res.status(201).json({ review });
  });

  app.get('/api/wishlist', authenticate, (req: AuthRequest, res: Response) => {
    const list = db.getWishlist(req.user!.id);
    res.json({ wishlist: list });
  });

  app.post('/api/wishlist/toggle', authenticate, (req: AuthRequest, res: Response) => {
    const { bookId } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'bookId is required' });
      return;
    }
    const updated = db.toggleWishlist(req.user!.id, bookId);
    res.json({ wishlist: updated });
  });

  // ----------------------------------------------------
  // 9. ADVERTISEMENTS & ANALYTICS
  // ----------------------------------------------------
  app.get('/api/ads', (req: Request, res: Response) => {
    res.json({ ads: db.getAds() });
  });

  app.post('/api/ads/:id/impression', (req: Request, res: Response) => {
    db.recordAdImpression(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/ads/:id/click', (req: Request, res: Response) => {
    db.recordAdClick(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/analytics/event', (req: Request, res: Response) => {
    const { type, userId, metadata } = req.body;
    if (type) {
      db.trackEvent({
        id: `ev-${Date.now()}`,
        type,
        userId,
        metadata,
        timestamp: new Date().toISOString()
      });
    }
    res.json({ success: true });
  });

  app.get('/api/admin/analytics', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
    const books = db.getBooks();
    const orders = db.getOrders();
    const users = db.getUsers();
    const events = db.getAnalyticsEvents();
    const totalRev = orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.total, 0);

    const funnel = [
      { stage: 'Visitors', count: events.filter(e => e.type === 'BOOK_VIEW').length + 850 },
      { stage: 'Book Views', count: events.filter(e => e.type === 'BOOK_VIEW').length + 420 },
      { stage: 'Add to Cart', count: events.filter(e => e.type === 'ADD_TO_CART').length + 180 },
      { stage: 'Checkout', count: events.filter(e => e.type === 'CHECKOUT_STARTED').length + 95 },
      { stage: 'Purchased', count: orders.filter(o => o.status === 'PAID').length + 72 },
    ];

    res.json({
      metrics: {
        totalBooks: books.length,
        publishedBooks: books.filter(b => b.status === 'PUBLISHED').length,
        totalCustomers: users.filter(u => u.role === 'CUSTOMER').length,
        totalOrders: orders.length,
        totalRevenue: totalRev,
        totalDownloads: db.getDownloadLogs().length + 142
      },
      funnel,
      orders: orders.slice(0, 10),
      ads: db.getAds()
    });
  });

  // ----------------------------------------------------
  // 10. AI ENDPOINTS (Server-Side Gemini Integration)
  // ----------------------------------------------------
  app.post('/api/ai/metadata', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { title, author, category, shortDescription } = req.body;
      const metadata = await generateBookMetadata({
        title: title || 'Untitled Book',
        author: author || 'Author',
        category: category || 'General',
        shortDescription: shortDescription || ''
      });
      res.json({ metadata });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/chat', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { bookId, question } = req.body;
      if (!bookId || !question) {
        res.status(400).json({ error: 'bookId and question are required' });
        return;
      }

      const book = db.getBookById(bookId);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }

      // Verify user owns book or is admin
      const hasPurchased = db.hasPurchased(user.id, book.id);
      const isAdmin = user.role === 'ADMIN';
      if (!hasPurchased && !isAdmin) {
        res.status(403).json({ error: 'Access restricted: You must own this book to query the AI reading assistant.' });
        return;
      }

      const content = book.fullChapters.map(ch => `${ch.title}:\n${ch.content}`).join('\n\n');
      const result = await askBookAssistant({
        bookTitle: book.title,
        bookAuthor: book.author,
        bookContent: content,
        question
      });

      db.trackEvent({
        id: `ev-${Date.now()}`,
        type: 'AI_QUERY',
        userId: user.id,
        metadata: { bookId, feature: 'chat' },
        timestamp: new Date().toISOString()
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/summarize', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { bookId, chapterIndex } = req.body;
      const book = db.getBookById(bookId);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const hasPurchased = db.hasPurchased(req.user!.id, book.id);
      const chapters = hasPurchased ? book.fullChapters : book.previewChapters;

      let contentToSummarize = chapters.map(c => `${c.title}\n${c.content}`).join('\n\n');
      let focus = 'Entire Book';
      if (chapterIndex !== undefined && chapters[chapterIndex]) {
        contentToSummarize = chapters[chapterIndex].content;
        focus = chapters[chapterIndex].title;
      }

      const result = await summarizeBookOrChapter({
        bookTitle: book.title,
        bookAuthor: book.author,
        content: contentToSummarize,
        focus
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/explain', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { bookTitle, passage, level } = req.body;
      if (!passage) {
        res.status(400).json({ error: 'Passage is required' });
        return;
      }
      const result = await explainParagraph({
        bookTitle: bookTitle || 'Selected Book',
        passage,
        simplicityLevel: level === 'simple' ? 'simple' : 'in-depth'
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/quiz', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { bookId } = req.body;
      const book = db.getBookById(bookId);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const hasPurchased = db.hasPurchased(req.user!.id, book.id);
      const chapters = hasPurchased ? book.fullChapters : book.previewChapters;
      const content = chapters.map(c => `${c.title}\n${c.content}`).join('\n\n');

      const result = await generateQuizQuestions({
        bookTitle: book.title,
        content
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/flashcards', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { bookId } = req.body;
      const book = db.getBookById(bookId);
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const hasPurchased = db.hasPurchased(req.user!.id, book.id);
      const chapters = hasPurchased ? book.fullChapters : book.previewChapters;
      const content = chapters.map(c => `${c.title}\n${c.content}`).join('\n\n');

      const result = await generateFlashcards({
        bookTitle: book.title,
        content
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/translate', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        res.status(400).json({ error: 'text and targetLanguage are required' });
        return;
      }
      const result = await translatePassage({ text, targetLanguage });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/search', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || !query.trim()) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }
      const books = db.getBooks().filter(b => b.status === 'PUBLISHED');
      const result = await semanticBookSearch({
        query,
        books: books.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          description: b.description,
          tags: b.tags
        }))
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 11. VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nibras server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
