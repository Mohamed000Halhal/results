'use client';

import { useEffect } from 'react';

export default function VisitorCounter() {
  useEffect(() => {
    async function trackVisitor() {
      try {
        let deviceId = localStorage.getItem('unique_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
          localStorage.setItem('unique_device_id', deviceId);
        }

        await fetch('/api/visitors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId }),
        });
      } catch (err) {
        console.error('Failed to track visitor:', err);
      }
    }

    trackVisitor();
  }, []);

  return null;
}

