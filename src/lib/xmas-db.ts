import { supabase } from './supabase';

const pending = new Map<string, Promise<void>>();
function enqueue(userId: string, action: () => Promise<void>): Promise<void> {
  const next = (pending.get(userId) ?? Promise.resolve()).catch(() => {}).then(action);
  pending.set(userId, next);
  return next;
}
import type { ChildProfile, XmasWish } from '../screens/xmas-data';

// ─── CHILDREN ─────────────────────────────────────────────────────────────────

function rowToChild(row: Record<string, unknown>): ChildProfile {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    age: row['age'] as number,
    country: (row['country'] as string | undefined) ?? 'CL',
    santaName: row['santa_name'] as string,
    parentMessage: row['parent_message'] as string | undefined,
    interests: (row['interests'] as string[] | undefined) ?? [],
    exclusions: (row['exclusions'] as string[] | undefined) ?? [],
    maxGiftPrice: (row['max_gift_price'] as number | undefined) ?? 30000,
    adultBudget: row['adult_budget'] as number,
    setupDone: row['setup_done'] as boolean,
    letterSent: row['letter_sent'] as boolean,
    letterSentAt: row['letter_sent_at'] as string | undefined,
  };
}

function childToRow(userId: string, child: ChildProfile) {
  return {
    id: child.id,
    user_id: userId,
    name: child.name,
    age: child.age,
    country: child.country ?? 'CL',
    santa_name: child.santaName,
    parent_message: child.parentMessage ?? null,
    interests: child.interests ?? [],
    exclusions: child.exclusions ?? [],
    max_gift_price: child.maxGiftPrice ?? 30000,
    adult_budget: child.adultBudget,
    setup_done: child.setupDone,
    letter_sent: child.letterSent,
    letter_sent_at: child.letterSentAt ?? null,
  };
}

export async function dbLoadChildren(userId: string): Promise<ChildProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(rowToChild);
}

export async function dbSaveChildren(userId: string, children: ChildProfile[]): Promise<void> {
  const rows = children.map(c => childToRow(userId, c));
  return enqueue(userId, async () => {
    if (!supabase || rows.length === 0) return;
    const { error } = await supabase.from('children').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    const key = `gl:${userId}:pending_children`;
    if (localStorage.getItem(key) === JSON.stringify(children)) localStorage.removeItem(key);
  });
}

export async function dbDeleteChild(childId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('children').delete().eq('id', childId);
  if (error) console.error('dbDeleteChild:', error);
}

// ─── XMAS WISHES ──────────────────────────────────────────────────────────────

function rowToWish(row: Record<string, unknown>): XmasWish {
  return {
    id: row['id'] as string,
    childId: row['child_id'] as string,
    productId: row['product_id'] as string | undefined,
    name: row['name'] as string,
    price: (row['price'] as number | undefined) ?? 0,
    image: row['image'] as string | undefined,
    store: row['store'] as string | undefined,
    category: row['category'] as string | undefined,
    isFavorite: row['is_favorite'] as boolean,
    isFree: row['is_free'] as boolean,
    freeText: row['free_text'] as string | undefined,
    adultStatus: row['adult_status'] as XmasWish['adultStatus'],
    reservedBy: row['reserved_by'] as string | undefined,
  };
}

function wishToRow(childId: string, wish: XmasWish) {
  return {
    id: wish.id,
    child_id: childId,
    product_id: wish.productId ?? null,
    name: wish.name,
    price: wish.price ?? 0,
    image: wish.image ?? null,
    store: wish.store ?? null,
    category: wish.category ?? null,
    is_favorite: wish.isFavorite,
    is_free: wish.isFree,
    free_text: wish.freeText ?? null,
    adult_status: wish.adultStatus,
    reserved_by: wish.reservedBy ?? null,
  };
}

export async function dbLoadWishes(childId: string): Promise<XmasWish[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('xmas_wishes')
    .select('*')
    .eq('child_id', childId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(rowToWish);
}

export async function dbSaveAllWishes(userId: string, childId: string, wishes: XmasWish[]): Promise<void> {
  const rows = wishes.map(w => wishToRow(childId, w));
  return enqueue(userId, async () => {
    if (!supabase) return;
    const { error } = await supabase.rpc('replace_xmas_wishes', { p_child_id: childId, p_wishes: rows });
    if (error) throw error;
    const key = `gl:${userId}:pending_wishes_${childId}`;
    if (localStorage.getItem(key) === JSON.stringify(wishes)) localStorage.removeItem(key);
  });
}

// ─── STORES ───────────────────────────────────────────────────────────────────

export async function dbLoadStores() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('xmas_stores').select('*').order('name');
  if (error) { console.error('dbLoadStores:', error); return null; }
  return (data ?? []).map(row => ({
    id: row['id'] as string,
    name: row['name'] as string,
    logoEmoji: row['logo_emoji'] as string,
    description: (row['description'] as string | undefined) ?? '',
    categories: (row['categories'] as string[] | undefined) ?? [],
    contactName: (row['contact_name'] as string | undefined) ?? '',
    contactEmail: (row['contact_email'] as string | undefined) ?? '',
  }));
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export async function dbLoadProducts(storeId?: string) {
  if (!supabase) return null;
  let q = supabase.from('xmas_products').select('*');
  if (storeId) q = q.eq('store_id', storeId);
  const { data, error } = await q.order('name');
  if (error) { console.error('dbLoadProducts:', error); return null; }
  return (data ?? []).map(row => ({
    id: row['id'] as string,
    storeId: row['store_id'] as string,
    name: row['name'] as string,
    description: (row['description'] as string | undefined) ?? '',
    price: row['price'] as number,
    images: (row['images'] as string[] | undefined) ?? [],
    category: (row['category'] as string | undefined) ?? '',
    stock: row['stock'] as number,
    status: row['status'] as 'draft' | 'published',
    minAge: row['min_age'] as number,
  }));
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

export async function dbLoadCampaigns() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('xmas_campaigns').select('*').order('created_at');
  if (error) { console.error('dbLoadCampaigns:', error); return null; }
  return (data ?? []).map(row => ({
    id: row['id'] as string,
    name: row['name'] as string,
    storeId: (row['store_id'] as string | undefined) ?? '',
    status: row['status'] as 'draft' | 'scheduled' | 'active' | 'ended',
    locations: (row['locations'] as string[] | undefined) ?? [],
    products: (row['products'] as string[] | undefined) ?? [],
    startDate: (row['start_date'] as string | undefined) ?? '',
    endDate: (row['end_date'] as string | undefined) ?? '',
  }));
}

// ─── SYNC: pull Supabase → localStorage on login ──────────────────────────────

export async function syncFromSupabase(userId: string): Promise<void> {
  const pendingChildren = localStorage.getItem(`gl:${userId}:pending_children`);
  if (pendingChildren) await dbSaveChildren(userId, JSON.parse(pendingChildren));
  const prefix = `gl:${userId}:pending_wishes_`;
  const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) await dbSaveAllWishes(userId, key.slice(prefix.length), JSON.parse(value));
  }
  const children = await dbLoadChildren(userId);
  const lists = await Promise.all(children.map(async child => ({ child, wishes: await dbLoadWishes(child.id) })));
  localStorage.setItem(`gl:${userId}:xmas_children`, JSON.stringify(children));
  for (const { child, wishes } of lists) {
    localStorage.setItem(`gl:${userId}:xmas_wishes_${child.id}`, JSON.stringify(wishes));
  }
}
