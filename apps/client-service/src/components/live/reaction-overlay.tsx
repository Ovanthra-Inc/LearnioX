'use client';

import React, { useEffect, useState } from 'react';

interface FloatingReaction {
  id: string;
  emoji: string;
  leftOffset: number; // percentage across screen (20% to 80%)
  speed: number;
}

const EMOJI_MAP: Record<string, string> = {
  clap: '👏',
  fire: '🔥',
  heart: '❤️',
  thumbs_up: '👍',
  celebrate: '🎉',
  confused: '🤔',
};

interface ReactionOverlayProps {
  incomingCounts: Record<string, number> | null;
}

export function ReactionOverlay({ incomingCounts }: ReactionOverlayProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (!incomingCounts) return;

    const newItems: FloatingReaction[] = [];
    Object.entries(incomingCounts).forEach(([rtype, count]) => {
      const emoji = EMOJI_MAP[rtype] || '👍';
      const spawnCount = Math.min(count, 12); // cap max visual bursts per batch
      for (let i = 0; i < spawnCount; i++) {
        newItems.push({
          id: `${Date.now()}-${Math.random()}`,
          emoji,
          leftOffset: Math.floor(Math.random() * 60) + 20, // 20% to 80%
          speed: 2 + Math.random() * 1.5,
        });
      }
    });

    if (newItems.length > 0) {
      setReactions((prev) => [...prev.slice(-30), ...newItems]);
    }
  }, [incomingCounts]);

  const handleAnimationEnd = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {reactions.map((r) => (
        <span
          key={r.id}
          onAnimationEnd={() => handleAnimationEnd(r.id)}
          className="absolute bottom-16 text-3xl animate-floating-reaction select-none"
          style={{
            left: `${r.leftOffset}%`,
            animationDuration: `${r.speed}s`,
          }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
