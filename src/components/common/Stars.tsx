import React from 'react';
import { Star } from 'lucide-react';

interface StarsProps {
  rating: number;
  c: any;
  size?: number;
}

export const Stars: React.FC<StarsProps> = ({ rating, c, size = 14 }) => {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          color={c.brass}
          fill={i <= Math.round(rating) ? c.brass : "none"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
};
