import React from 'react';
import { Book } from '../../types';

export const CATEGORY_HUES: Record<string, [string, string]> = {
  Technology: ["#2B4941", "#5B8A7D"],
  Programming: ["#17302B", "#3E6B4F"],
  AI: ["#3A2B49", "#7D5B8A"],
  Business: ["#4A3820", "#8C5A14"],
  Finance: ["#3B3B1F", "#7A7A3E"],
  Education: ["#233B4A", "#4E7D93"],
  "Self Improvement": ["#4A2320", "#8A4C3E"],
  Fiction: ["#3B2340", "#7A4D8A"],
  Romance: ["#4A2036", "#8A3E68"],
  Mystery: ["#1E1E24", "#3E3E52"],
  Academic: ["#2A3A20", "#5C7A3E"],
  "Children's Books": ["#4A3E1A", "#B8862C"],
};

interface BookCoverProps {
  book: Partial<Book>;
  c: any;
  size?: "sm" | "md" | "lg";
}

export const BookCover: React.FC<BookCoverProps> = ({ book, c, size = "md" }) => {
  const [h1, h2] = CATEGORY_HUES[book.category || "Technology"] || ["#2B4941", "#5B8A7D"];
  const dims = size === "sm" ? { w: 90, h: 128 } : size === "lg" ? { w: 220, h: 314 } : { w: 154, h: 218 };

  if (book.coverImage) {
    return (
      <div
        style={{
          width: dims.w,
          height: dims.h,
          borderRadius: 6,
          flexShrink: 0,
          overflow: "hidden",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          border: `1px solid rgba(255,255,255,0.15)`,
          position: "relative"
        }}
      >
        <img
          src={book.coverImage}
          alt={book.title || "Cover"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 6,
        flexShrink: 0,
        background: `linear-gradient(150deg, ${h1}, ${h2})`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: size === "lg" ? "18px" : size === "sm" ? "8px" : "12px",
        border: `1px solid rgba(255,255,255,0.15)`,
        userSelect: "none"
      }}
    >
      <div style={{ width: 22, height: 2, background: c.brassSoft, opacity: 0.9 }} />
      <div>
        <div
          style={{
            color: "#F2EFE6",
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontWeight: 600,
            fontSize: size === "lg" ? 18 : size === "sm" ? 10.5 : 13.5,
            lineHeight: 1.25,
            wordBreak: "break-word"
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            color: "rgba(242,239,230,0.75)",
            fontSize: size === "lg" ? 12 : size === "sm" ? 8.5 : 10,
            marginTop: 4,
            fontFamily: "Inter, sans-serif"
          }}
        >
          {book.author}
        </div>
      </div>
    </div>
  );
};
