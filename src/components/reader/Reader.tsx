import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, BookOpen, Bookmark, Highlighter, FileText,
  Sparkles, Search, Sun, Moon, Coffee, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Download, Send, Check, X,
  HelpCircle, Layers, Globe
} from 'lucide-react';
import { Book, Bookmark as BookmarkType, Highlight, Note, CurrencyCode, LanguageCode } from '../../types';
import { api } from '../../services/api';
import { LANGUAGES } from '../../i18n/translations';

interface ReaderProps {
  book: Book;
  onBack: () => void;
  c: any;
  currency: CurrencyCode;
}

export const Reader: React.FC<ReaderProps> = ({ book, onBack, c }) => {
  const [chapters, setChapters] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reading Mode & Preferences
  const [readingTheme, setReadingTheme] = useState<'paper' | 'sepia' | 'dark'>('paper');
  const [fontSize, setFontSize] = useState<number>(18);
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'annotations' | 'ai' | null>(null);

  // Annotations
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  // Text selection toolbar
  const [selectedText, setSelectedText] = useState('');
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);

  // Search inside book
  const [inBookSearch, setInBookSearch] = useState('');

  // AI Drawer State
  const [aiMode, setAiMode] = useState<'chat' | 'summary' | 'explain' | 'quiz' | 'flashcards' | 'translate'>('chat');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ summary: string; takeaways: string[] } | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiQuiz, setAiQuiz] = useState<Array<{ question: string; options: string[]; correctAnswerIndex: number; explanation: string }> | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [aiFlashcards, setAiFlashcards] = useState<Array<{ front: string; back: string }> | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [translateTarget, setTranslateTarget] = useState<string>('Hindi');
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch full book content (or preview if fallback)
  useEffect(() => {
    let mounted = true;
    async function loadContent() {
      try {
        setLoading(true);
        const res = await api.books.getContent(book.id);
        if (mounted) {
          setChapters(res.chapters);
          setLoading(false);
        }
      } catch (err: any) {
        // Fallback to preview chapters if content access failed
        if (mounted) {
          if (book.previewChapters && book.previewChapters.length > 0) {
            setChapters(book.previewChapters);
          } else {
            setChapters([
              { id: 'ch-1', title: 'Chapter 1: The Core Thesis', content: book.description || 'Welcome to the eBook reader.' }
            ]);
          }
          setLoading(false);
        }
      }
    }

    async function loadAnnotations() {
      try {
        const res = await api.library.getAnnotations(book.id);
        if (mounted) {
          setBookmarks(res.bookmarks);
          setHighlights(res.highlights);
          setNotes(res.notes);
        }
      } catch (err) {
        console.error('Failed to load annotations:', err);
      }
    }

    loadContent();
    loadAnnotations();
    return () => { mounted = false; };
  }, [book.id]);

  // Sync Reading Progress
  useEffect(() => {
    if (chapters.length > 0) {
      const progressPercent = Math.round(((currentChapterIndex + 1) / chapters.length) * 100);
      api.library.saveProgress({
        bookId: book.id,
        currentChapterIndex,
        currentPage: currentChapterIndex + 1,
        totalPages: chapters.length,
        progressPercent
      }).catch(() => {});
    }
  }, [book.id, currentChapterIndex, chapters.length]);

  // Text Selection Handler
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 2) {
      const text = sel.toString().trim();
      setSelectedText(text);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top - 45 });
    } else {
      setSelectionPos(null);
    }
  };

  const addHighlightColor = async (color: 'yellow' | 'green' | 'blue' | 'pink') => {
    if (!selectedText) return;
    try {
      const res = await api.library.addHighlight({
        bookId: book.id,
        chapterIndex: currentChapterIndex,
        selectedText,
        color
      });
      setHighlights(prev => [res.highlight, ...prev]);
      setSelectionPos(null);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBookmark = async () => {
    try {
      const label = chapters[currentChapterIndex]?.title || `Chapter ${currentChapterIndex + 1}`;
      const res = await api.library.addBookmark({
        bookId: book.id,
        chapterIndex: currentChapterIndex,
        page: currentChapterIndex + 1,
        label
      });
      setBookmarks(prev => [res.bookmark, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      const res = await api.library.addNote({
        bookId: book.id,
        chapterIndex: currentChapterIndex,
        page: currentChapterIndex + 1,
        text: newNoteText.trim()
      });
      setNotes(prev => [res.note, ...prev]);
      setNewNoteText('');
      setShowAddNoteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // AI Handler
  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    const q = aiQuestion.trim();
    setAiQuestion('');
    setAiChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setAiLoading(true);

    try {
      const res = await api.ai.chat(book.id, q);
      setAiChatHistory(prev => [...prev, { role: 'ai', text: res.answer }]);
    } catch (err: any) {
      setAiChatHistory(prev => [...prev, { role: 'ai', text: `Error: ${err.message || 'Unable to generate response'}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSummarize = async () => {
    setAiLoading(true);
    try {
      const res = await api.ai.summarize(book.id, currentChapterIndex);
      setAiSummary(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiExplain = async (passageToExplain: string) => {
    setSidebarTab('ai');
    setAiMode('explain');
    setAiLoading(true);
    setSelectionPos(null);
    try {
      const res = await api.ai.explain(book.title, passageToExplain, 'simple');
      setAiExplanation(res.explanation);
    } catch (err: any) {
      setAiExplanation(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiQuiz = async () => {
    setAiLoading(true);
    try {
      const res = await api.ai.quiz(book.id);
      setAiQuiz(res.questions);
      setSelectedQuizAnswers({});
    } catch (err: any) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiFlashcards = async () => {
    setAiLoading(true);
    try {
      const res = await api.ai.flashcards(book.id);
      setAiFlashcards(res.flashcards);
      setFlippedCards({});
    } catch (err: any) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiTranslate = async () => {
    const textToTranslate = selectedText || chapters[currentChapterIndex]?.content.slice(0, 500) || '';
    if (!textToTranslate) return;
    setAiLoading(true);
    try {
      const res = await api.ai.translate(textToTranslate, translateTarget);
      setTranslatedResult(res.translatedText);
    } catch (err: any) {
      setTranslatedResult(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Theme palettes for the reader area
  const themeStyles = {
    paper: { bg: "#FBF9F3", text: "#17302B", headerBg: "#F2EFE6", line: "#D2C9AE" },
    sepia: { bg: "#F4ECD8", text: "#433422", headerBg: "#EADECA", line: "#D5C4A1" },
    dark: { bg: "#131A1C", text: "#E2DDD2", headerBg: "#192225", line: "#29383C" }
  }[readingTheme];

  const currentChapter = chapters[currentChapterIndex] || {
    title: 'Loading Chapter...',
    content: ''
  };

  const isCurrentBookmarked = bookmarks.some(b => b.chapterIndex === currentChapterIndex);

  return (
    <div
      id="reader-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: themeStyles.bg,
        color: themeStyles.text,
        overflow: "hidden"
      }}
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Header */}
      <header
        id="reader-header"
        style={{
          height: 56,
          background: themeStyles.headerBg,
          borderBottom: `1px solid ${themeStyles.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          flexShrink: 0,
          zIndex: 30
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            id="reader-back-btn"
            onClick={onBack}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${themeStyles.line}`,
              background: "transparent",
              color: themeStyles.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Exit Reader</span>
          </button>
          <div style={{ borderLeft: `1px solid ${themeStyles.line}`, paddingLeft: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
              {book.title}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {currentChapter.title}
            </div>
          </div>
        </div>

        {/* Center Progress */}
        <div className="hidden md:flex items-center gap-3">
          <button
            id="reader-prev-chapter-btn"
            disabled={currentChapterIndex === 0}
            onClick={() => setCurrentChapterIndex(prev => Math.max(0, prev - 1))}
            style={{
              padding: 5,
              borderRadius: 4,
              border: "none",
              background: "transparent",
              color: themeStyles.text,
              cursor: currentChapterIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentChapterIndex === 0 ? 0.4 : 1
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <span style={{ fontSize: 12, fontWeight: 600 }}>
            Chapter {currentChapterIndex + 1} of {chapters.length || 1}
          </span>

          <button
            id="reader-next-chapter-btn"
            disabled={currentChapterIndex >= chapters.length - 1}
            onClick={() => setCurrentChapterIndex(prev => Math.min(chapters.length - 1, prev + 1))}
            style={{
              padding: 5,
              borderRadius: 4,
              border: "none",
              background: "transparent",
              color: themeStyles.text,
              cursor: currentChapterIndex >= chapters.length - 1 ? "not-allowed" : "pointer",
              opacity: currentChapterIndex >= chapters.length - 1 ? 0.4 : 1
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Font Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button
              id="reader-zoom-out-btn"
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
              style={{
                padding: "6px",
                border: "none",
                background: "transparent",
                color: themeStyles.text,
                cursor: "pointer"
              }}
              title="Decrease Font Size"
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: 11, minWidth: 20, textAlign: "center" }}>{fontSize}</span>
            <button
              id="reader-zoom-in-btn"
              onClick={() => setFontSize(prev => Math.min(26, prev + 2))}
              style={{
                padding: "6px",
                border: "none",
                background: "transparent",
                color: themeStyles.text,
                cursor: "pointer"
              }}
              title="Increase Font Size"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Theme Palette */}
          <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
            <button
              id="reader-theme-paper-btn"
              onClick={() => setReadingTheme('paper')}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#FBF9F3",
                border: readingTheme === 'paper' ? `2px solid ${c.brass}` : "1px solid #999",
                cursor: "pointer"
              }}
              title="Day Mode"
            />
            <button
              id="reader-theme-sepia-btn"
              onClick={() => setReadingTheme('sepia')}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#F4ECD8",
                border: readingTheme === 'sepia' ? `2px solid ${c.brass}` : "1px solid #999",
                cursor: "pointer"
              }}
              title="Sepia Mode"
            />
            <button
              id="reader-theme-dark-btn"
              onClick={() => setReadingTheme('dark')}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#131A1C",
                border: readingTheme === 'dark' ? `2px solid ${c.brass}` : "1px solid #999",
                cursor: "pointer"
              }}
              title="Night Mode"
            />
          </div>

          {/* Bookmark toggle */}
          <button
            id="reader-bookmark-btn"
            onClick={handleAddBookmark}
            style={{
              padding: "6px",
              border: "none",
              background: "transparent",
              color: isCurrentBookmarked ? c.brass : themeStyles.text,
              cursor: "pointer"
            }}
            title={isCurrentBookmarked ? "Chapter Bookmarked" : "Bookmark this Chapter"}
          >
            <Bookmark size={18} fill={isCurrentBookmarked ? c.brass : "none"} />
          </button>

          {/* Licensed Download */}
          <a
            id="reader-download-licensed-btn"
            href={api.books.downloadUrl(book.id)}
            download
            style={{
              padding: "6px",
              border: "none",
              background: "transparent",
              color: themeStyles.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            title="Download Licensed eBook File"
          >
            <Download size={18} />
          </a>

          {/* Table of Contents Drawer */}
          <button
            id="reader-toc-btn"
            onClick={() => setSidebarTab(sidebarTab === 'toc' ? null : 'toc')}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${sidebarTab === 'toc' ? c.brass : themeStyles.line}`,
              background: sidebarTab === 'toc' ? `${c.brass}15` : "transparent",
              color: sidebarTab === 'toc' ? c.brass : themeStyles.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Chapters</span>
          </button>

          {/* Annotations Drawer */}
          <button
            id="reader-annotations-btn"
            onClick={() => setSidebarTab(sidebarTab === 'annotations' ? null : 'annotations')}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${sidebarTab === 'annotations' ? c.brass : themeStyles.line}`,
              background: sidebarTab === 'annotations' ? `${c.brass}15` : "transparent",
              color: sidebarTab === 'annotations' ? c.brass : themeStyles.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <Highlighter size={16} />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* AI Companion Drawer Button */}
          <button
            id="reader-ai-companion-btn"
            onClick={() => setSidebarTab(sidebarTab === 'ai' ? null : 'ai')}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${c.brass}`,
              background: sidebarTab === 'ai' ? c.brass : `${c.brass}15`,
              color: sidebarTab === 'ai' ? "#F2EFE6" : c.brass,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
            }}
          >
            <Sparkles size={16} />
            <span>AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Main Reading & Sidebar Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* eBook Content Reading View */}
        <main
          id="reader-content-area"
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "40px 24px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div style={{ maxWidth: 720, width: "100%" }}>
            {/* Chapter Header */}
            <div style={{ borderBottom: `1px solid ${themeStyles.line}`, paddingBottom: 16, marginBottom: 32 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", color: c.brass, fontWeight: 700 }}>
                {book.title}
              </div>
              <h1
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: fontSize * 1.5,
                  fontWeight: 700,
                  margin: "8px 0 4px",
                  lineHeight: 1.25
                }}
              >
                {currentChapter.title}
              </h1>
            </div>

            {/* Chapter Body */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: themeStyles.text }}>
                Loading chapter content...
              </div>
            ) : (
              <div
                id="chapter-text-container"
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                  letterSpacing: "0.2px"
                }}
              >
                {currentChapter.content}
              </div>
            )}

            {/* Chapter Navigation Buttons at bottom */}
            <div
              style={{
                marginTop: 60,
                paddingTop: 24,
                borderTop: `1px solid ${themeStyles.line}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <button
                id="reader-bottom-prev-btn"
                disabled={currentChapterIndex === 0}
                onClick={() => {
                  setCurrentChapterIndex(prev => Math.max(0, prev - 1));
                  contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 6,
                  border: `1px solid ${themeStyles.line}`,
                  background: "transparent",
                  color: themeStyles.text,
                  cursor: currentChapterIndex === 0 ? "not-allowed" : "pointer",
                  opacity: currentChapterIndex === 0 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                <ChevronLeft size={16} />
                <span>Previous Chapter</span>
              </button>

              <span style={{ fontSize: 12, opacity: 0.7 }}>
                {Math.round(((currentChapterIndex + 1) / (chapters.length || 1)) * 100)}% Completed
              </span>

              <button
                id="reader-bottom-next-btn"
                disabled={currentChapterIndex >= chapters.length - 1}
                onClick={() => {
                  setCurrentChapterIndex(prev => Math.min(chapters.length - 1, prev + 1));
                  contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 6,
                  border: `1px solid ${c.brass}`,
                  background: c.brass,
                  color: "#F2EFE6",
                  cursor: currentChapterIndex >= chapters.length - 1 ? "not-allowed" : "pointer",
                  opacity: currentChapterIndex >= chapters.length - 1 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                <span>Next Chapter</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>

        {/* Floating Text Selection Context Toolbar */}
        {selectionPos && selectedText && (
          <div
            id="reader-selection-toolbar"
            style={{
              position: "fixed",
              left: Math.max(10, Math.min(window.innerWidth - 300, selectionPos.x - 140)),
              top: Math.max(60, selectionPos.y),
              background: "#1E2A2E",
              color: "#F2EFE6",
              borderRadius: 8,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
              zIndex: 90
            }}
          >
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => addHighlightColor('yellow')}
                style={{ width: 18, height: 18, borderRadius: "50%", background: "#FDE047", border: "none", cursor: "pointer" }}
                title="Highlight Yellow"
              />
              <button
                onClick={() => addHighlightColor('green')}
                style={{ width: 18, height: 18, borderRadius: "50%", background: "#86EFAC", border: "none", cursor: "pointer" }}
                title="Highlight Green"
              />
              <button
                onClick={() => addHighlightColor('blue')}
                style={{ width: 18, height: 18, borderRadius: "50%", background: "#93C5FD", border: "none", cursor: "pointer" }}
                title="Highlight Blue"
              />
              <button
                onClick={() => addHighlightColor('pink')}
                style={{ width: 18, height: 18, borderRadius: "50%", background: "#F472B6", border: "none", cursor: "pointer" }}
                title="Highlight Pink"
              />
            </div>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />

            <button
              onClick={() => setShowAddNoteModal(true)}
              style={{ background: "none", border: "none", color: "#F2EFE6", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <FileText size={14} />
              <span>Note</span>
            </button>

            <button
              onClick={() => handleAiExplain(selectedText)}
              style={{ background: "none", border: "none", color: c.brassSoft, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Sparkles size={14} />
              <span>Explain</span>
            </button>
          </div>
        )}

        {/* Note Creation Modal */}
        {showAddNoteModal && (
          <div
            id="reader-add-note-modal"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20
            }}
          >
            <div style={{ background: c.paper, borderRadius: 8, padding: 20, width: "100%", maxWidth: 420, border: `1px solid ${c.line}` }}>
              <h3 style={{ margin: "0 0 12px", fontFamily: "'Source Serif 4', Georgia, serif", color: c.ink }}>
                Add Margin Note
              </h3>
              <div style={{ fontSize: 11, color: c.inkSoft, marginBottom: 8, fontStyle: "italic", borderLeft: `2px solid ${c.brass}`, paddingLeft: 8 }}>
                "{selectedText.slice(0, 100)}..."
              </div>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write your observation or thought..."
                rows={4}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: `1px solid ${c.line}`,
                  background: c.paper2,
                  color: c.ink,
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical"
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${c.line}`, background: "transparent", color: c.ink, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: c.brass, color: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR: Table of Contents */}
        {sidebarTab === 'toc' && (
          <aside
            id="reader-toc-sidebar"
            style={{
              width: 320,
              borderLeft: `1px solid ${themeStyles.line}`,
              background: themeStyles.headerBg,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0
            }}
          >
            <div style={{ padding: "16px", borderBottom: `1px solid ${themeStyles.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Table of Contents</div>
              <button onClick={() => setSidebarTab(null)} style={{ background: "none", border: "none", color: themeStyles.text, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id || idx}
                  onClick={() => {
                    setCurrentChapterIndex(idx);
                    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: currentChapterIndex === idx ? `${c.brass}20` : "transparent",
                    color: currentChapterIndex === idx ? c.brass : themeStyles.text,
                    fontWeight: currentChapterIndex === idx ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    marginBottom: 4
                  }}
                >
                  {ch.title}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* SIDEBAR: Annotations (Bookmarks, Highlights, Notes) */}
        {sidebarTab === 'annotations' && (
          <aside
            id="reader-annotations-sidebar"
            style={{
              width: 320,
              borderLeft: `1px solid ${themeStyles.line}`,
              background: themeStyles.headerBg,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0
            }}
          >
            <div style={{ padding: "16px", borderBottom: `1px solid ${themeStyles.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>My Annotations</div>
              <button onClick={() => setSidebarTab(null)} style={{ background: "none", border: "none", color: themeStyles.text, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "14px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Bookmarks */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase", marginBottom: 6 }}>
                  Bookmarks ({bookmarks.length})
                </div>
                {bookmarks.length === 0 ? (
                  <div style={{ fontSize: 12, opacity: 0.6 }}>No bookmarks yet. Click the bookmark icon up top.</div>
                ) : (
                  bookmarks.map(bm => (
                    <div
                      key={bm.id}
                      onClick={() => setCurrentChapterIndex(bm.chapterIndex)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: themeStyles.bg,
                        border: `1px solid ${themeStyles.line}`,
                        fontSize: 12,
                        cursor: "pointer",
                        marginBottom: 6,
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{bm.label}</span>
                      <span style={{ opacity: 0.6 }}>Ch. {bm.chapterIndex + 1}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Highlights */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase", marginBottom: 6 }}>
                  Highlights ({highlights.length})
                </div>
                {highlights.length === 0 ? (
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Select text in reader to highlight.</div>
                ) : (
                  highlights.map(hl => (
                    <div
                      key={hl.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: themeStyles.bg,
                        borderLeft: `4px solid ${hl.color === 'green' ? '#86EFAC' : hl.color === 'blue' ? '#93C5FD' : hl.color === 'pink' ? '#F472B6' : '#FDE047'}`,
                        fontSize: 12,
                        marginBottom: 6
                      }}
                    >
                      "{hl.selectedText}"
                    </div>
                  ))
                )}
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.brass, textTransform: "uppercase", marginBottom: 6 }}>
                  Notes ({notes.length})
                </div>
                {notes.length === 0 ? (
                  <div style={{ fontSize: 12, opacity: 0.6 }}>No margin notes recorded.</div>
                ) : (
                  notes.map(nt => (
                    <div
                      key={nt.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: themeStyles.bg,
                        border: `1px solid ${themeStyles.line}`,
                        fontSize: 12,
                        marginBottom: 6
                      }}
                    >
                      <div>{nt.text}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>Ch. {nt.chapterIndex + 1}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        )}

        {/* SIDEBAR: Embedded AI Reading Companion */}
        {sidebarTab === 'ai' && (
          <aside
            id="reader-ai-sidebar"
            style={{
              width: 380,
              borderLeft: `1px solid ${themeStyles.line}`,
              background: themeStyles.headerBg,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0
            }}
          >
            {/* AI Top Nav */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${themeStyles.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color={c.brass} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>AI Reading Companion</span>
              </div>
              <button onClick={() => setSidebarTab(null)} style={{ background: "none", border: "none", color: themeStyles.text, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Mode Selection Pills */}
            <div style={{ padding: "8px 12px", display: "flex", gap: 6, overflowX: "auto", borderBottom: `1px solid ${themeStyles.line}` }}>
              {(['chat', 'summary', 'explain', 'quiz', 'flashcards', 'translate'] as const).map(mode => (
                <button
                  key={mode}
                  id={`ai-mode-${mode}`}
                  onClick={() => setAiMode(mode)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 14,
                    border: "none",
                    background: aiMode === mode ? c.brass : "transparent",
                    color: aiMode === mode ? "#F2EFE6" : themeStyles.text,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* AI Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* CHAT MODE */}
              {aiMode === 'chat' && (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", minHeight: 360 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto", marginBottom: 12 }}>
                    {aiChatHistory.length === 0 && (
                      <div style={{ textAlign: "center", padding: "30px 10px", opacity: 0.7, fontSize: 12.5 }}>
                        <Sparkles size={28} style={{ margin: "0 auto 10px", color: c.brass }} />
                        Ask any question about "{book.title}". Answers are strictly derived from this book's content.
                      </div>
                    )}
                    {aiChatHistory.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: "85%",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: item.role === 'user' ? c.brass : themeStyles.bg,
                          color: item.role === 'user' ? "#F2EFE6" : themeStyles.text,
                          border: item.role === 'user' ? "none" : `1px solid ${themeStyles.line}`,
                          fontSize: 12.5,
                          lineHeight: 1.5
                        }}
                      >
                        {item.text}
                      </div>
                    ))}
                    {aiLoading && (
                      <div style={{ fontSize: 12, color: c.brass, fontStyle: "italic" }}>
                        Thinking and reading authorized chapters...
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      id="ai-question-input"
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAskAi(); }}
                      placeholder="Ask about this book..."
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: `1px solid ${themeStyles.line}`,
                        background: themeStyles.bg,
                        color: themeStyles.text,
                        fontSize: 12.5,
                        outline: "none"
                      }}
                    />
                    <button
                      id="ai-send-btn"
                      onClick={handleAskAi}
                      disabled={aiLoading || !aiQuestion.trim()}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: c.brass,
                        color: "#F2EFE6",
                        cursor: "pointer"
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* SUMMARY MODE */}
              {aiMode === 'summary' && (
                <div>
                  <button
                    id="ai-generate-summary-btn"
                    onClick={handleAiSummarize}
                    disabled={aiLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "none",
                      background: c.brass,
                      color: "#F2EFE6",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 14
                    }}
                  >
                    {aiLoading ? "Generating Summary..." : `Summarize "${currentChapter.title}"`}
                  </button>

                  {aiSummary && (
                    <div style={{ background: themeStyles.bg, padding: 14, borderRadius: 8, border: `1px solid ${themeStyles.line}` }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>Executive Summary</h4>
                      <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: "0 0 14px", opacity: 0.9 }}>
                        {aiSummary.summary}
                      </p>
                      <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>Key Takeaways</h4>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
                        {aiSummary.takeaways?.map((t, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* EXPLAIN MODE */}
              {aiMode === 'explain' && (
                <div>
                  <p style={{ fontSize: 12, opacity: 0.7, margin: "0 0 10px" }}>
                    Select any passage in the book or click below to explain the current paragraph simply.
                  </p>
                  <button
                    onClick={() => handleAiExplain(currentChapter.content.slice(0, 400))}
                    disabled={aiLoading}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 6,
                      border: `1px solid ${c.brass}`,
                      background: `${c.brass}15`,
                      color: c.brass,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 12
                    }}
                  >
                    Explain Current Excerpt
                  </button>
                  {aiExplanation && (
                    <div style={{ background: themeStyles.bg, padding: 14, borderRadius: 8, border: `1px solid ${themeStyles.line}`, fontSize: 12.5, lineHeight: 1.6 }}>
                      {aiExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* QUIZ MODE */}
              {aiMode === 'quiz' && (
                <div>
                  <button
                    id="ai-generate-quiz-btn"
                    onClick={handleAiQuiz}
                    disabled={aiLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "none",
                      background: c.brass,
                      color: "#F2EFE6",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 14
                    }}
                  >
                    {aiLoading ? "Generating Quiz..." : "Create Comprehension Quiz"}
                  </button>

                  {aiQuiz && aiQuiz.map((q, qIdx) => (
                    <div key={qIdx} style={{ background: themeStyles.bg, padding: 12, borderRadius: 8, border: `1px solid ${themeStyles.line}`, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                        {qIdx + 1}. {q.question}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedQuizAnswers[qIdx] === optIdx;
                          const isCorrect = q.correctAnswerIndex === optIdx;
                          const showResult = selectedQuizAnswers[qIdx] !== undefined;

                          return (
                            <button
                              key={optIdx}
                              onClick={() => setSelectedQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                              style={{
                                textAlign: "left",
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: `1px solid ${showResult && isCorrect ? c.good : showResult && isSelected ? c.danger : themeStyles.line}`,
                                background: showResult && isCorrect ? `${c.good}20` : showResult && isSelected ? `${c.danger}20` : "transparent",
                                color: themeStyles.text,
                                fontSize: 12,
                                cursor: "pointer"
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {selectedQuizAnswers[qIdx] !== undefined && (
                        <div style={{ marginTop: 8, fontSize: 11.5, color: c.inkSoft, fontStyle: "italic" }}>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* FLASHCARDS MODE */}
              {aiMode === 'flashcards' && (
                <div>
                  <button
                    id="ai-generate-flashcards-btn"
                    onClick={handleAiFlashcards}
                    disabled={aiLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "none",
                      background: c.brass,
                      color: "#F2EFE6",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 14
                    }}
                  >
                    {aiLoading ? "Generating Flashcards..." : "Generate Study Flashcards"}
                  </button>

                  {aiFlashcards && aiFlashcards.map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      style={{
                        background: themeStyles.bg,
                        padding: 16,
                        borderRadius: 8,
                        border: `1px solid ${themeStyles.line}`,
                        marginBottom: 12,
                        cursor: "pointer",
                        minHeight: 90,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: c.brass, textTransform: "uppercase", marginBottom: 6 }}>
                        {flippedCards[idx] ? "Answer (Click to flip)" : "Question (Click to flip)"}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: flippedCards[idx] ? 400 : 600, lineHeight: 1.5 }}>
                        {flippedCards[idx] ? card.back : card.front}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TRANSLATE MODE */}
              {aiMode === 'translate' && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Translate into:
                    </label>
                    <select
                      value={translateTarget}
                      onChange={(e) => setTranslateTarget(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: 6,
                        border: `1px solid ${themeStyles.line}`,
                        background: themeStyles.bg,
                        color: themeStyles.text,
                        fontSize: 12.5
                      }}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.code} value={l.name}>{l.nativeName} ({l.name})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    id="ai-translate-passage-btn"
                    onClick={handleAiTranslate}
                    disabled={aiLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "none",
                      background: c.brass,
                      color: "#F2EFE6",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 14
                    }}
                  >
                    {aiLoading ? "Translating with Gemini..." : `Translate to ${translateTarget}`}
                  </button>

                  {translatedResult && (
                    <div style={{ background: themeStyles.bg, padding: 14, borderRadius: 8, border: `1px solid ${themeStyles.line}`, fontSize: 13, lineHeight: 1.7 }}>
                      {translatedResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
