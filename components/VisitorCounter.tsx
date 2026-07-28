'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export default function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    async function trackVisitor() {
      try {
        let deviceId = localStorage.getItem('unique_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
          localStorage.setItem('unique_device_id', deviceId);
        }

        const res = await fetch('/api/visitors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId }),
        });

        const data = await res.json();
        if (data.success && typeof data.count === 'number') {
          setVisitorCount(data.count);
        }
      } catch (err) {
        console.error('Failed to track visitor:', err);
      }
    }

    trackVisitor();
  }, []);

  if (visitorCount === null) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-stone-700 bg-amber-100/60 border border-amber-300/60 shadow-sm">
      <Users className="w-3.5 h-3.5 text-amber-700" />
      <span>عدد زوار الموقع: <strong className="font-mono text-stone-900">{visitorCount.toLocaleString('ar-EG')}</strong></span>
    </div>
  );
}
