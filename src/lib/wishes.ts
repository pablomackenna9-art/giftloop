import type { Wish } from '../components/data';
import { readUserData } from './user-storage';
import { supabase } from './supabase';

export type PersonalWish = Wish & { url: string; list: string; listId: string };
export function loadPersonalWishes(): PersonalWish[] { return readUserData('wishes', []); }
export async function savePersonalWish(userId: string, wish: PersonalWish) {
  const key = `gl:${userId}:wishes`;
  if (supabase) {
    const { error } = await supabase.from('wishes').insert({
      id: wish.id, user_id: userId, name: wish.name, price: wish.price,
      brand: wish.store ?? '', image: wish.image, url: wish.url, note: wish.note,
      kind: wish.kind, list_id: wish.listId, list_name: wish.list,
    });
    if (error) throw new Error('No pudimos guardar el deseo. Intenta nuevamente.');
  }
  const previous = JSON.parse(localStorage.getItem(key) ?? '[]') as PersonalWish[];
  localStorage.setItem(key, JSON.stringify([...previous, wish]));
}
export async function syncPersonalWishes(userId: string) {
  if (!supabase) return;
  const { data, error } = await supabase.from('wishes').select('*').eq('user_id', userId);
  if (error) throw error;
  const wishes: PersonalWish[] = (data ?? []).map(row => ({
    id: row.id, name: row.name, price: Number(row.price ?? 0), store: row.brand || null,
    image: row.image ?? '', url: row.url ?? '', note: row.note ?? '',
    list: row.list_name ?? 'Mi lista', listId: row.list_id ?? 'cumple30',
    kind: row.kind === 'experience' ? 'experience' : 'product', status: 'free',
  }));
  // Se escribe con el usuario de la petición, aunque la sesión cambie durante la consulta.
  localStorage.setItem(`gl:${userId}:wishes`, JSON.stringify(wishes));
}
