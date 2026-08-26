export const previewImages = {
  hero: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=2200&q=85',
  food: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
  drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80',
  room: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
  event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80',
  ],
};

export const previewCategories = [
  { id: 'food', name: 'From the Kitchen', slug: 'food' },
  { id: 'cocktails', name: 'Cocktails', slug: 'cocktails' },
  { id: 'spirits', name: 'Spirits & Bottles', slug: 'spirits' },
];

export const previewMenu = [
  { id: 'p1', name: 'Suya Skewers', description: 'Charred beef, onion, yaji spice, smoked peanut dust.', price: 8500, category_id: 'food', image_url: previewImages.food, featured: true, available: true, published: true },
  { id: 'p2', name: 'Pepper Prawns', description: 'Tiger prawns, roasted peppers, citrus, fresh herbs.', price: 14500, category_id: 'food', image_url: previewImages.room, featured: false, available: true, published: true },
  { id: 'p3', name: 'Green Room', description: 'Gin, cucumber, lime, basil, a clean Lagos evening.', price: 9500, category_id: 'cocktails', image_url: previewImages.drinks, featured: true, available: true, published: true },
  { id: 'p4', name: 'Palm & Tonic', description: 'Palm wine, tonic, lemon leaf, a quiet twist.', price: 8000, category_id: 'cocktails', image_url: previewImages.drinks, featured: false, available: true, published: true },
  { id: 'p5', name: 'Haolas Bottle Service', description: 'Ask the room for tonight’s selection and service.', price: 65000, category_id: 'spirits', image_url: previewImages.room, featured: false, available: true, published: true },
];

export const previewEvents = [
  { id: 'weekly-entertainment', title: 'Weekly Entertainment', description: 'Great music, familiar faces, and a room that knows how to move.', date: 'Every week', time: 'From 7:00 PM', location: 'Haolas Bar & Lounge', cover_image_url: previewImages.event, featured: true, published: true },
  { id: 'live-music', title: 'Live Music', description: 'A rotating evening of live sound and good company.', date: 'Coming up', time: 'See the room for details', location: 'Haolas Bar & Lounge', cover_image_url: previewImages.gallery[3], featured: false, published: true },
  { id: 'weekend-event', title: 'Weekend Event', description: 'The weekend starts when the lights come on.', date: 'This weekend', time: 'From 7:00 PM', location: 'Haolas Bar & Lounge', cover_image_url: previewImages.gallery[4], featured: false, published: true },
];