import { useEffect, useState } from 'react';
import { loadRequests, syncRequests } from '../screens/xmas-store-data';
import type { PurchaseRequest } from '../screens/xmas-store-data';
import { storageKey } from './user-storage';
import { supabase } from './supabase';

export function usePurchaseRequests() {
  const [requests, setRequests] = useState<PurchaseRequest[]>(loadRequests);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    let refreshing = false;
    const userId = storageKey('').split(':')[1];
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try { await syncRequests(userId); if (alive) setRequests(loadRequests()); }
      catch { if (alive) window.dispatchEvent(new Event('giftloop-sync-error')); }
      finally { refreshing = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, []);
  return [requests, setRequests] as const;
}
