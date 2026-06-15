'use strict';

const restRepo = require('./services/repositories/restaurants.repository');
const productsRepo = require('./services/repositories/products.repository');

const RESTAURANTS = [
  { name: 'Pizza Roma',     description: 'Authentic Italian pizza',        image: '/images/restaurants/pizza-roma.jpg',    category: 'Pizza',    rating: 8.6, deliveryTime: '25–35 min', deliveryFee: 0, isPromoted: true,  address: 'Tel Aviv', phone: '03-1111111', openHours: '10:00-23:00', tags: [], creatorId: 'system' },
  { name: 'Sushi Bar TLV', description: 'Fresh sushi & Japanese cuisine',  image: '/images/restaurants/sushi-bar-tlv.jpg', category: 'Sushi',    rating: 9.4, deliveryTime: '35–45 min', deliveryFee: 0, isPromoted: true,  address: 'Tel Aviv', phone: '03-2222222', openHours: '12:00-23:00', tags: [], creatorId: 'system' },
  { name: 'Burger Boss',   description: 'Smash burgers & loaded fries',   image: '/images/restaurants/burger-boss.jpg',   category: 'Burgers',  rating: 8.8, deliveryTime: '25–35 min', deliveryFee: 0, isPromoted: true,  address: 'Tel Aviv', phone: '03-3333333', openHours: '11:00-00:00', tags: [], creatorId: 'system' },
  { name: 'Golden Dragon', description: 'Chinese & Asian favorites',       image: '/images/restaurants/golden-dragon.jpg', category: 'Asian',    rating: 8.4, deliveryTime: '30–40 min', deliveryFee: 9, isPromoted: false, address: 'Tel Aviv', phone: '03-4444444', openHours: '11:00-22:30', tags: [], creatorId: 'system' },
  { name: 'Green Bowl',    description: 'Healthy salads & grain bowls',    image: '/images/restaurants/green-bowl.jpg',    category: 'Salads',   rating: 8.9, deliveryTime: '20–30 min', deliveryFee: 0, isPromoted: false, address: 'Tel Aviv', phone: '03-5555555', openHours: '09:00-21:00', tags: [], creatorId: 'system' },
  { name: 'The Pasta House', description: 'Homemade pasta & risotto',     image: '/images/restaurants/pasta-house.jpg',   category: 'Pasta',    rating: 8.2, deliveryTime: '30–40 min', deliveryFee: 9, isPromoted: false, address: 'Tel Aviv', phone: '03-6666666', openHours: '12:00-23:00', tags: [], creatorId: 'system' },
  { name: 'Sweet Dreams',  description: 'Desserts, cakes & ice cream',    image: '/images/restaurants/sweet-dreams.jpg',  category: 'Desserts', rating: 9.1, deliveryTime: '20–30 min', deliveryFee: 0, isPromoted: false, address: 'Tel Aviv', phone: '03-7777777', openHours: '10:00-23:30', tags: [], creatorId: 'system' },
  { name: 'Taco Fiesta',   description: 'Mexican street food & tacos',    image: '/images/restaurants/taco-fiesta.jpg',   category: 'Mexican',  rating: 8.0, deliveryTime: '30–40 min', deliveryFee: 9, isPromoted: false, address: 'Tel Aviv', phone: '03-8888888', openHours: '11:00-23:00', tags: [], creatorId: 'system' },
];

const MENUS = [
  // 0: Pizza Roma
  [
    { title: 'Most Ordered', items: [
      { name: 'Margherita Pizza',  description: 'San Marzano tomato, fresh mozzarella, basil',            price: 62, image: '/images/menu/pizza-roma/margherita-pizza.jpg', maxQty: 10, isPopular: true  },
      { name: 'Pepperoni Pizza',   description: 'Tomato sauce, mozzarella, pepperoni slices',             price: 72, image: '/images/menu/pizza-roma/pepperoni-pizza.jpg',   maxQty: 10, isPopular: true  },
    ]},
    { title: 'Starters', items: [
      { name: 'Garlic Bread',      description: 'Toasted ciabatta, roasted garlic, herbs',                price: 24, image: '/images/menu/pizza-roma/garlic-bread.jpg',      maxQty: 5,  isPopular: false },
      { name: 'Bruschetta',        description: 'Fresh tomatoes, basil, olive oil on grilled bread',      price: 28, image: '/images/menu/pizza-roma/bruschetta.jpg',         maxQty: 10, isPopular: false },
      { name: 'Arancini (3 pcs)',  description: 'Fried risotto balls with mozzarella filling',            price: 36, image: '/images/menu/pizza-roma/arancini.jpg',           maxQty: 10, isPopular: false },
    ]},
    { title: 'Pizzas', items: [
      { name: 'Quattro Formaggi',  description: 'Mozzarella, gorgonzola, parmesan, ricotta',              price: 76, image: '/images/menu/pizza-roma/quattro-formaggi.jpg',   maxQty: 10, isPopular: false },
      { name: 'Truffle Mushroom',  description: 'Truffle cream, wild mushrooms, arugula, parmesan',       price: 84, image: '/images/menu/pizza-roma/truffle-mushroom.jpg',   maxQty: 10, isPopular: false },
      { name: 'Diavola',           description: 'Spicy tomato, mozzarella, salami, chili flakes',         price: 74, image: '/images/menu/pizza-roma/diavola.jpg',             maxQty: 10, isPopular: false },
      { name: 'Marinara',          description: 'Tomato, garlic, oregano, olive oil — no cheese',         price: 54, image: '/images/menu/pizza-roma/marinara.jpg',           maxQty: 10, isPopular: false },
    ]},
    { title: 'Drinks', items: [
      { name: 'Sparkling Water',   description: '500ml bottle',                                           price: 12, image: '/images/menu/pizza-roma/sparkling-water.jpg',    maxQty: 10, isPopular: false },
      { name: 'Italian Lemonade',  description: 'Homemade lemon, mint, soda',                            price: 18, image: '/images/menu/pizza-roma/italian-lemonade.jpg',   maxQty: 10, isPopular: false },
      { name: 'Espresso',          description: 'Double shot',                                            price: 14, image: '/images/menu/pizza-roma/espresso.jpg',           maxQty: 3,  isPopular: false },
    ]},
  ],
  // 1: Sushi Bar TLV
  [
    { title: 'Most Ordered', items: [
      { name: 'Dragon Roll (8 pcs)',       description: 'Shrimp tempura, avocado, topped with tuna & tobiko',    price: 74, image: '/images/menu/sushi-bar-tlv/dragon-roll.jpg',        maxQty: 10, isPopular: true  },
      { name: 'Salmon Sashimi (6 pcs)',    description: 'Premium fresh Atlantic salmon',                          price: 68, image: '/images/menu/sushi-bar-tlv/salmon-sashimi.jpg',      maxQty: 10, isPopular: true  },
    ]},
    { title: 'Starters', items: [
      { name: 'Edamame',                   description: 'Steamed salted soy beans',                               price: 22, image: '/images/menu/sushi-bar-tlv/edamame.jpg',             maxQty: 5,  isPopular: false },
      { name: 'Gyoza (5 pcs)',             description: 'Pan-fried pork & cabbage dumplings, ponzu sauce',        price: 38, image: '/images/menu/sushi-bar-tlv/gyoza.jpg',               maxQty: 10, isPopular: false },
      { name: 'Miso Soup',                 description: 'Tofu, wakame, green onion',                              price: 16, image: '/images/menu/sushi-bar-tlv/miso-soup.jpg',           maxQty: 10, isPopular: false },
    ]},
    { title: 'Special Rolls', items: [
      { name: 'Rainbow Roll (8 pcs)',      description: 'Crab, cucumber, topped with assorted fish & avocado',   price: 78, image: '/images/menu/sushi-bar-tlv/rainbow-roll.jpg',        maxQty: 10, isPopular: false },
      { name: 'Spicy Tuna Roll (8 pcs)',   description: 'Tuna, sriracha mayo, cucumber, sesame',                 price: 66, image: '/images/menu/sushi-bar-tlv/spicy-tuna-roll.jpg',     maxQty: 10, isPopular: false },
      { name: 'Vegetable Roll (8 pcs)',    description: 'Avocado, cucumber, carrot, pickled radish',             price: 52, image: '/images/menu/sushi-bar-tlv/vegetable-roll.jpg',      maxQty: 10, isPopular: false },
      { name: 'Crispy Salmon Roll (8 pcs)',description: 'Salmon, cream cheese, tempura flakes',                  price: 72, image: '/images/menu/sushi-bar-tlv/crispy-salmon-roll.jpg', maxQty: 10, isPopular: false },
    ]},
    { title: 'Mains', items: [
      { name: 'Teriyaki Salmon',           description: 'Grilled salmon, teriyaki glaze, steamed rice, pickles', price: 86, image: '/images/menu/sushi-bar-tlv/teriyaki-salmon.jpg',    maxQty: 10, isPopular: false },
      { name: 'Chicken Katsu Don',         description: 'Crispy chicken cutlet over rice with egg & onion',      price: 72, image: '/images/menu/sushi-bar-tlv/chicken-katsu-don.jpg',  maxQty: 10, isPopular: false },
      { name: 'Vegetable Ramen',           description: 'Miso broth, noodles, tofu, mushrooms, soft egg',        price: 64, image: '/images/menu/sushi-bar-tlv/vegetable-ramen.jpg',    maxQty: 10, isPopular: false },
    ]},
  ],
  // 2: Burger Boss
  [
    { title: 'Most Ordered', items: [
      { name: 'Boss Smash Burger',     description: 'Double smash patty, American cheese, Boss sauce, pickles', price: 68, image: '/images/menu/burger-boss/boss-smash-burger.jpg',    maxQty: 10, isPopular: true  },
      { name: 'Loaded Fries',          description: 'Crispy fries, cheese sauce, jalapeños, sour cream',        price: 38, image: '/images/menu/burger-boss/loaded-fries.jpg',          maxQty: 10, isPopular: true  },
    ]},
    { title: 'Burgers', items: [
      { name: 'Classic Smash',         description: '200g beef, American cheese, lettuce, tomato, pickles',     price: 58, image: '/images/menu/burger-boss/classic-smash.jpg',         maxQty: 10, isPopular: false },
      { name: 'Crispy Chicken Burger', description: 'Fried chicken thigh, coleslaw, sriracha mayo',             price: 62, image: '/images/menu/burger-boss/crispy-chicken-burger.jpg', maxQty: 10, isPopular: false },
      { name: 'Mushroom Swiss',        description: 'Smash patty, Swiss cheese, sautéed mushrooms, truffle mayo',price: 72, image: '/images/menu/burger-boss/mushroom-swiss.jpg',       maxQty: 10, isPopular: false },
      { name: 'Veggie Smash',          description: 'Plant-based patty, vegan cheese, lettuce, tomato, pickles',price: 64, image: '/images/menu/burger-boss/veggie-smash.jpg',          maxQty: 10, isPopular: false },
    ]},
    { title: 'Sides', items: [
      { name: 'Classic Fries',         description: 'Golden crispy fries, sea salt',                            price: 22, image: '/images/menu/burger-boss/classic-fries.jpg',         maxQty: 5,  isPopular: false },
      { name: 'Onion Rings (6 pcs)',   description: 'Beer-battered onion rings, ranch dip',                     price: 28, image: '/images/menu/burger-boss/onion-rings.jpg',           maxQty: 10, isPopular: false },
      { name: 'Coleslaw',              description: 'Creamy homemade coleslaw',                                  price: 16, image: '/images/menu/burger-boss/coleslaw.jpg',             maxQty: 10, isPopular: false },
    ]},
    { title: 'Drinks', items: [
      { name: 'Craft Cola',            description: 'House-made cola syrup with soda',                           price: 18, image: '/images/menu/burger-boss/craft-cola.jpg',           maxQty: 10, isPopular: false },
      { name: 'Milkshake',             description: 'Vanilla, chocolate or strawberry',                          price: 32, image: '/images/menu/burger-boss/milkshake.jpg',            maxQty: 3,  isPopular: false },
      { name: 'Still Water',           description: '500ml bottle',                                              price: 10, image: '/images/menu/burger-boss/still-water.jpg',           maxQty: 10, isPopular: false },
    ]},
  ],
  // 3: Golden Dragon
  [
    { title: 'Most Ordered', items: [
      { name: 'Dim Sum Basket (6 pcs)',      description: 'Assorted steamed dumplings, ginger soy dip',              price: 52, image: '/images/menu/golden-dragon/dim-sum-basket.jpg',       maxQty: 10, isPopular: true  },
      { name: 'Kung Pao Chicken',            description: 'Wok-fried chicken, peanuts, dried chili, Sichuan pepper', price: 68, image: '/images/menu/golden-dragon/kung-pao-chicken.jpg',      maxQty: 10, isPopular: true  },
    ]},
    { title: 'Starters', items: [
      { name: 'Spring Rolls (4 pcs)',        description: 'Crispy vegetable rolls, sweet chili sauce',               price: 32, image: '/images/menu/golden-dragon/spring-rolls.jpg',           maxQty: 5,  isPopular: false },
      { name: 'Wonton Soup',                 description: 'Pork wontons in clear broth, green onion',                price: 36, image: '/images/menu/golden-dragon/wonton-soup.jpg',            maxQty: 10, isPopular: false },
      { name: 'Peking Duck Pancakes (4 pcs)',description: 'Crispy duck, hoisin sauce, cucumber, spring onion',       price: 58, image: '/images/menu/golden-dragon/peking-duck-pancakes.jpg',   maxQty: 10, isPopular: false },
    ]},
    { title: 'Mains', items: [
      { name: 'Sweet & Sour Chicken',        description: 'Crispy chicken, bell peppers, pineapple, sweet & sour glaze', price: 64, image: '/images/menu/golden-dragon/sweet-sour-chicken.jpg', maxQty: 10, isPopular: false },
      { name: 'Beef in Black Bean Sauce',    description: 'Tender beef strips, black bean sauce, peppers, onion',    price: 72, image: '/images/menu/golden-dragon/beef-black-bean.jpg',        maxQty: 10, isPopular: false },
      { name: 'Mapo Tofu',                   description: 'Silken tofu, minced meat, Sichuan chili bean paste',      price: 58, image: '/images/menu/golden-dragon/mapo-tofu.jpg',             maxQty: 10, isPopular: false },
      { name: 'Fried Rice',                  description: 'Wok-fried rice, egg, vegetables, soy sauce',              price: 44, image: '/images/menu/golden-dragon/fried-rice.jpg',            maxQty: 10, isPopular: false },
    ]},
  ],
  // 4: Green Bowl
  [
    { title: 'Most Ordered', items: [
      { name: 'Buddha Bowl',            description: 'Quinoa, roasted chickpeas, avocado, tahini dressing',         price: 62, image: '/images/menu/green-bowl/buddha-bowl.jpg',          maxQty: 10, isPopular: true  },
      { name: 'Falafel Salad',          description: 'Crispy falafel, mixed greens, cherry tomatoes, lemon tahini', price: 54, image: '/images/menu/green-bowl/falafel-salad.jpg',         maxQty: 10, isPopular: true  },
    ]},
    { title: 'Grain Bowls', items: [
      { name: 'Mediterranean Bowl',     description: 'Farro, hummus, roasted vegetables, olives, feta',             price: 64, image: '/images/menu/green-bowl/mediterranean-bowl.jpg',    maxQty: 10, isPopular: false },
      { name: 'Asian Sesame Bowl',      description: 'Brown rice, edamame, carrot, cucumber, sesame dressing',      price: 58, image: '/images/menu/green-bowl/asian-sesame-bowl.jpg',     maxQty: 10, isPopular: false },
      { name: 'Power Protein Bowl',     description: 'Lentils, grilled tofu, sweet potato, spinach, tahini',        price: 66, image: '/images/menu/green-bowl/power-protein-bowl.jpg',  maxQty: 10, isPopular: false },
    ]},
    { title: 'Salads', items: [
      { name: 'Classic Caesar',         description: 'Romaine, house caesar dressing, croutons, parmesan',          price: 48, image: '/images/menu/green-bowl/classic-caesar.jpg',        maxQty: 10, isPopular: false },
      { name: 'Watermelon Arugula',     description: 'Watermelon, arugula, feta, mint, balsamic reduction',         price: 52, image: '/images/menu/green-bowl/watermelon-arugula.jpg',   maxQty: 10, isPopular: false },
      { name: 'Chopped Salad',          description: 'Tomato, cucumber, onion, parsley, lemon-olive oil',           price: 38, image: '/images/menu/green-bowl/chopped-salad.jpg',         maxQty: 5,  isPopular: false },
    ]},
    { title: 'Extras', items: [
      { name: 'Extra Avocado',          description: 'Half avocado',                                                price: 14, image: '/images/menu/green-bowl/extra-avocado.jpg',         maxQty: 3,  isPopular: false },
      { name: 'Extra Tahini',           description: 'House-made tahini sauce',                                     price: 8,  image: '/images/menu/green-bowl/extra-tahini.jpg',         maxQty: 5,  isPopular: false },
      { name: 'Add Grilled Chicken',    description: '100g seasoned grilled chicken breast',                        price: 22, image: '/images/menu/green-bowl/grilled-chicken.jpg',        maxQty: 3,  isPopular: false },
    ]},
  ],
  // 5: The Pasta House
  [
    { title: 'Most Ordered', items: [
      { name: 'Cacio e Pepe',           description: 'Tonnarelli, Pecorino Romano, black pepper',                   price: 68, image: '/images/menu/pasta-house/cacio-e-pepe.jpg',         maxQty: 10, isPopular: true  },
      { name: 'Truffle Tagliatelle',    description: 'Fresh tagliatelle, black truffle, butter, parmesan',          price: 88, image: '/images/menu/pasta-house/truffle-tagliatelle.jpg',  maxQty: 10, isPopular: true  },
    ]},
    { title: 'Pasta', items: [
      { name: 'Spaghetti Carbonara',    description: 'Guanciale, egg yolk, Pecorino, black pepper',                 price: 72, image: '/images/menu/pasta-house/spaghetti-carbonara.jpg',  maxQty: 10, isPopular: false },
      { name: 'Pappardelle Bolognese',  description: 'Slow-cooked beef & pork ragù, pappardelle',                  price: 78, image: '/images/menu/pasta-house/pappardelle-bolognese.jpg',maxQty: 10, isPopular: false },
      { name: 'Spinach Ricotta Ravioli',description: 'Homemade ravioli, sage brown butter, parmesan',              price: 76, image: '/images/menu/pasta-house/spinach-ravioli.jpg',       maxQty: 10, isPopular: false },
      { name: 'Arrabbiata',             description: 'Penne, spicy tomato sauce, garlic, fresh basil',             price: 58, image: '/images/menu/pasta-house/arrabbiata.jpg',            maxQty: 10, isPopular: false },
    ]},
    { title: 'Risotto', items: [
      { name: 'Mushroom Risotto',       description: 'Arborio rice, porcini, parmesan, fresh thyme',               price: 74, image: '/images/menu/pasta-house/mushroom-risotto.jpg',      maxQty: 10, isPopular: false },
      { name: 'Saffron Risotto',        description: 'Milanese-style saffron risotto, bone marrow',                price: 82, image: '/images/menu/pasta-house/saffron-risotto.jpg',       maxQty: 10, isPopular: false },
    ]},
  ],
  // 6: Sweet Dreams
  [
    { title: 'Most Ordered', items: [
      { name: 'Chocolate Lava Cake',    description: 'Warm chocolate cake, molten center, vanilla ice cream',       price: 46, image: '/images/menu/sweet-dreams/chocolate-lava-cake.jpg', maxQty: 10, isPopular: true  },
      { name: 'Cheesecake Slice',       description: 'New York style, berry compote, graham cracker crust',         price: 42, image: '/images/menu/sweet-dreams/cheesecake-slice.jpg',    maxQty: 10, isPopular: true  },
    ]},
    { title: 'Cakes & Slices', items: [
      { name: 'Tiramisu',               description: 'Mascarpone, espresso-soaked ladyfingers, cocoa',              price: 44, image: '/images/menu/sweet-dreams/tiramisu.jpg',             maxQty: 10, isPopular: false },
      { name: 'Red Velvet Slice',       description: 'Red velvet cake, cream cheese frosting',                      price: 40, image: '/images/menu/sweet-dreams/red-velvet-slice.jpg',     maxQty: 10, isPopular: false },
      { name: 'Carrot Cake',            description: 'Spiced carrot cake, walnuts, cream cheese frosting',          price: 40, image: '/images/menu/sweet-dreams/carrot-cake.jpg',          maxQty: 10, isPopular: false },
      { name: 'Opera Cake',             description: 'Almond sponge, coffee buttercream, chocolate ganache',        price: 48, image: '/images/menu/sweet-dreams/opera-cake.jpg',           maxQty: 10, isPopular: false },
    ]},
    { title: 'Ice Cream', items: [
      { name: 'Ice Cream (2 scoops)',   description: 'Choose: vanilla, chocolate, strawberry, pistachio',           price: 28, image: '/images/menu/sweet-dreams/ice-cream-scoops.jpg',    maxQty: 5,  isPopular: false },
      { name: 'Affogato',               description: 'Vanilla ice cream, double espresso shot',                     price: 32, image: '/images/menu/sweet-dreams/affogato.jpg',             maxQty: 5,  isPopular: false },
      { name: 'Sundae',                 description: 'Vanilla ice cream, hot fudge, whipped cream, cherry',         price: 38, image: '/images/menu/sweet-dreams/sundae.jpg',               maxQty: 5,  isPopular: false },
    ]},
    { title: 'Hot Drinks', items: [
      { name: 'Specialty Coffee',       description: 'Latte, cappuccino, flat white — your choice',                 price: 18, image: '/images/menu/sweet-dreams/specialty-coffee.jpg',    maxQty: 3,  isPopular: false },
      { name: 'Hot Chocolate',          description: 'Belgian chocolate, steamed milk, whipped cream',              price: 22, image: '/images/menu/sweet-dreams/hot-chocolate.jpg',        maxQty: 3,  isPopular: false },
    ]},
  ],
  // 7: Taco Fiesta
  [
    { title: 'Most Ordered', items: [
      { name: 'Taco Trio',              description: 'Choice of 3 tacos: chicken, beef or veggie, pico de gallo',  price: 54, image: '/images/menu/taco-fiesta/taco-trio.jpg',             maxQty: 10, isPopular: true  },
      { name: 'Loaded Nachos',          description: 'Tortilla chips, cheese sauce, jalapeños, guacamole, sour cream', price: 48, image: '/images/menu/taco-fiesta/loaded-nachos.jpg',    maxQty: 10, isPopular: true  },
    ]},
    { title: 'Tacos', items: [
      { name: 'Grilled Chicken Taco',   description: 'Marinated chicken, cabbage slaw, chipotle mayo, lime',       price: 22, image: '/images/menu/taco-fiesta/grilled-chicken-taco.jpg',  maxQty: 10, isPopular: false },
      { name: 'Beef Barbacoa Taco',     description: 'Slow-cooked beef, onion, cilantro, salsa verde',             price: 24, image: '/images/menu/taco-fiesta/beef-barbacoa-taco.jpg',    maxQty: 10, isPopular: false },
      { name: 'Baja Fish Taco',         description: 'Beer-battered fish, pickled cabbage, mango salsa',           price: 26, image: '/images/menu/taco-fiesta/baja-fish-taco.jpg',        maxQty: 10, isPopular: false },
      { name: 'Black Bean Taco',        description: 'Spiced black beans, roasted corn, avocado, pico',            price: 20, image: '/images/menu/taco-fiesta/black-bean-taco.jpg',       maxQty: 10, isPopular: false },
    ]},
    { title: 'Mains', items: [
      { name: 'Chicken Burrito',        description: 'Large flour tortilla, rice, beans, chicken, cheese, salsa',  price: 62, image: '/images/menu/taco-fiesta/chicken-burrito.jpg',       maxQty: 10, isPopular: false },
      { name: 'Beef Quesadilla',        description: 'Grilled flour tortilla, beef, cheese, peppers, sour cream',  price: 58, image: '/images/menu/taco-fiesta/beef-quesadilla.jpg',       maxQty: 10, isPopular: false },
      { name: 'Veggie Bowl',            description: 'Rice, black beans, roasted vegetables, guacamole, salsa',    price: 52, image: '/images/menu/taco-fiesta/veggie-bowl.jpg',           maxQty: 10, isPopular: false },
    ]},
    { title: 'Extras & Sauces', items: [
      { name: 'Guacamole',              description: 'Fresh avocado, lime, onion, cilantro',                       price: 18, image: '/images/menu/taco-fiesta/guacamole.jpg',             maxQty: 3,  isPopular: false },
      { name: 'Extra Salsa',            description: 'Choice: pico, salsa verde or roja',                          price: 8,  image: '/images/menu/taco-fiesta/extra-salsa.jpg',           maxQty: 5,  isPopular: false },
      { name: 'Tortilla Chips',         description: 'Fresh corn tortilla chips, sea salt',                        price: 16, image: '/images/menu/taco-fiesta/tortilla-chips.jpg',        maxQty: 5,  isPopular: false },
    ]},
  ],
];

function seed() {
  if (restRepo.findAll().length > 0) return;

  RESTAURANTS.forEach((restData, i) => {
    const rest = restRepo.create(restData);
    (MENUS[i] || []).forEach((section, sectionOrder) => {
      section.items.forEach(item => {
        productsRepo.create({
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          maxQty: item.maxQty,
          isPopular: item.isPopular,
          section: section.title,
          sectionOrder,
          category: section.title,
          isAvailable: true,
          restId: rest.id,
        });
      });
    });
  });

  console.log(`Seeded ${RESTAURANTS.length} restaurants.`);
}

module.exports = { seed };
