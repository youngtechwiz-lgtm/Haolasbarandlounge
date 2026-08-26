import { supabaseFetch } from './supabase';

export type MenuCategory = { id: string; name: string; slug?: string | null; sort_order?: number | null };
export type MenuItem = { id: string; name: string; description?: string | null; price: number; category_id?: string | null; image_url?: string | null; featured?: boolean; available?: boolean; published?: boolean };
export type EventRecord = { id: string; title: string; description?: string | null; date?: string | null; time?: string | null; location?: string | null; cover_image_url?: string | null; featured?: boolean; published?: boolean };
export type GalleryItem = { id: string; image_url: string; caption?: string | null; category?: string | null; published?: boolean };
export type EnquiryInput = { name: string; phone: string; email?: string; message: string };

export const getMenuCategories = () => supabaseFetch<MenuCategory[]>('menu_categories', { query: '?select=*&order=sort_order.asc' });
export const getPublishedMenuItems = () => supabaseFetch<MenuItem[]>('menu_items', { query: '?select=*&published=eq.true&available=eq.true&order=sort_order.asc' });
export const getFeaturedMenuItems = () => supabaseFetch<MenuItem[]>('menu_items', { query: '?select=*&published=eq.true&available=eq.true&featured=eq.true&order=sort_order.asc' });
export const getPublishedEvents = () => supabaseFetch<EventRecord[]>('events', { query: '?select=*&published=eq.true&order=date.asc' });
export const getFeaturedEvents = () => supabaseFetch<EventRecord[]>('events', { query: '?select=*&published=eq.true&featured=eq.true&order=date.asc' });
export const getGalleryItems = () => supabaseFetch<GalleryItem[]>('gallery_items', { query: '?select=*&published=eq.true&order=created_at.desc' });
export const getAdminMenuCategories = () => supabaseFetch<MenuCategory[]>('menu_categories', { query: '?select=*&order=sort_order.asc' });
export const getAdminMenuItems = () => supabaseFetch<MenuItem[]>('menu_items', { query: '?select=*&order=sort_order.asc' });
export const getAdminEvents = () => supabaseFetch<EventRecord[]>('events', { query: '?select=*&order=date.desc' });
export const getAdminGalleryItems = () => supabaseFetch<GalleryItem[]>('gallery_items', { query: '?select=*&order=created_at.desc' });
export const createEnquiry = (input: EnquiryInput) => supabaseFetch<EnquiryInput[]>('enquiries', { method: 'POST', body: input });
export const createMenuCategory = (input: Pick<MenuCategory, 'name'>) => supabaseFetch<MenuCategory[]>('menu_categories', { method: 'POST', body: input });
export const updateMenuCategory = (id: string, input: Pick<MenuCategory, 'name'>) => supabaseFetch<MenuCategory[]>('menu_categories', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: input });
export const createMenuItem = (input: Partial<MenuItem>) => supabaseFetch<MenuItem[]>('menu_items', { method: 'POST', body: input });
export const updateMenuItem = (id: string, input: Partial<MenuItem>) => supabaseFetch<MenuItem[]>('menu_items', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: input });
export const deleteMenuItem = (id: string) => supabaseFetch<void>('menu_items', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
export const createEvent = (input: Partial<EventRecord>) => supabaseFetch<EventRecord[]>('events', { method: 'POST', body: input });
export const updateEvent = (id: string, input: Partial<EventRecord>) => supabaseFetch<EventRecord[]>('events', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: input });
export const deleteEvent = (id: string) => supabaseFetch<void>('events', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
export const createGalleryItem = (input: Pick<GalleryItem, 'image_url' | 'caption' | 'category' | 'published'>) => supabaseFetch<GalleryItem[]>('gallery_items', { method: 'POST', body: input });
export const updateGalleryItem = (id: string, input: Partial<Pick<GalleryItem, 'caption' | 'category' | 'published'>>) => supabaseFetch<GalleryItem[]>('gallery_items', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: input });
export const deleteGalleryItem = (id: string) => supabaseFetch<void>('gallery_items', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
export const getAdminCounts = async () => {
  const [menu, events, gallery] = await Promise.all([
    supabaseFetch<MenuItem[]>('menu_items', { query: '?select=id' }),
    supabaseFetch<EventRecord[]>('events', { query: '?select=id' }),
    supabaseFetch<GalleryItem[]>('gallery_items', { query: '?select=id' }),
  ]);
  return { menu: menu.length, events: events.length, gallery: gallery.length };
};
