export const MOCK_RESTAURANTS = [
  { id: '1', name: 'Pizza Roma',      description: 'Authentic Italian pizza',       image: '/images/restaurants/pizza-roma.jpg',   category: 'Pizza',    rating: 8.6, deliveryTime: '25–35 min', deliveryFee: 0, isPromoted: true },
  { id: '2', name: 'Sushi Bar TLV',   description: 'Fresh sushi & Japanese cuisine', image: '/images/restaurants/sushi-bar-tlv.jpg', category: 'Sushi',    rating: 9.4, deliveryTime: '35–45 min', deliveryFee: 0, isPromoted: true },
  { id: '3', name: 'Burger Boss',      description: 'Smash burgers & loaded fries',  image: '/images/restaurants/burger-boss.jpg',   category: 'Burgers',  rating: 8.8, deliveryTime: '25–35 min', deliveryFee: 0, isPromoted: true },
  { id: '4', name: 'Golden Dragon',    description: 'Chinese & Asian favorites',      image: '/images/restaurants/golden-dragon.jpg', category: 'Asian',    rating: 8.4, deliveryTime: '30–40 min', deliveryFee: 9, isPromoted: false },
  { id: '5', name: 'Green Bowl',       description: 'Healthy salads & grain bowls',   image: '/images/restaurants/green-bowl.jpg',    category: 'Salads',   rating: 8.9, deliveryTime: '20–30 min', deliveryFee: 0, isPromoted: false },
  { id: '6', name: 'The Pasta House',  description: 'Homemade pasta & risotto',       image: '/images/restaurants/pasta-house.jpg',   category: 'Pasta',    rating: 8.2, deliveryTime: '30–40 min', deliveryFee: 9, isPromoted: false },
  { id: '7', name: 'Sweet Dreams',     description: 'Desserts, cakes & ice cream',    image: '/images/restaurants/sweet-dreams.jpg',  category: 'Desserts', rating: 9.1, deliveryTime: '20–30 min', deliveryFee: 0, isPromoted: false },
  { id: '8', name: 'Taco Fiesta',      description: 'Mexican street food & tacos',    image: '/images/restaurants/taco-fiesta.jpg',   category: 'Mexican',  rating: 8.0, deliveryTime: '30–40 min', deliveryFee: 9, isPromoted: false },
];

export const CATEGORIES = [
  { name: 'Pizza',    emoji: '🍕', image: '/images/categories/pizza.jpg' },
  { name: 'Sushi',   emoji: '🍣', image: '/images/categories/sushi.jpg' },
  { name: 'Burgers', emoji: '🍔', image: '/images/categories/burgers.jpg' },
  { name: 'Asian',   emoji: '🥡', image: '/images/categories/asian.jpg' },
  { name: 'Salads',  emoji: '🥗', image: '/images/categories/salads.jpg' },
  { name: 'Pasta',   emoji: '🍝', image: '/images/categories/pasta.jpg' },
  { name: 'Desserts',emoji: '🍰', image: '/images/categories/desserts.jpg' },
  { name: 'Mexican', emoji: '🌮', image: '/images/categories/mexican.jpg' },
];

export function getRestaurants({ search = '', category = null } = {}) {
  return MOCK_RESTAURANTS.filter(r => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || r.category === category;
    return matchesSearch && matchesCategory;
  });
}

export function getCategories() {
  return CATEGORIES.map(c => c.name);
}
