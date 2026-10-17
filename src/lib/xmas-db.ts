import { supabase } from './supabase';
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
  if (error) { console.error('dbLoadChildren:', error); return []; }
  return (data ?? []).map(rowToChild);
}

export async function dbSaveChildren(userId: string, children: ChildProfile[]): Promise<void> {
  if (!supabase) return;
  // Upsert all children
  const rows = children.map(c => childToRow(userId, c));
  if (rows.length > 0) {
    const { error } = await supabase.from('children').upsert(rows, { onConflict: 'id' });
    if (error) console.error('dbSaveChildren upsert:', error);
  }
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
  if (error) { console.error('dbLoadWishes:', error); return []; }
  return (data ?? []).map(rowToWish);
}

export async function dbSaveAllWishes(childId: string, wishes: XmasWish[]): Promise<void> {
  if (!supabase) return;
  await supabase.from('xmas_wishes').delete().eq('child_id', childId);
  if (wishes.length === 0) return;
  const rows = wishes.map(w => wishToRow(childId, w));
  const { error } = await supabase.from('xmas_wishes').insert(rows);
  if (error) console.error('dbSaveAllWishes:', error);
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
  try {
    // Sync children + their wishes
    const children = await dbLoadChildren(userId);
    if (children.length > 0) {
      localStorage.setItem('xmas_children', JSON.stringify(children));
      await Promise.all(children.map(async child => {
        const wishes = await dbLoadWishes(child.id);
        if (wishes.length > 0) {
          localStorage.setItem(`xmas_wishes_${child.id}`, JSON.stringify(wishes));
        }
      }));
    }
  } catch (e) {
    console.error('syncFromSupabase error:', e);
  }
}
