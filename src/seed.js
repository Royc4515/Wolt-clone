'use strict';

const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');

const RESTAURANTS = [
  {
    name: 'Pizza Roma', description: 'Authentic Italian pizza', location: { lat: 32.0853, lng: 34.7818 },
    category: 'Pizza', phone: '03-1111111', openHours: '10:00-23:00', isPromoted: true, rating: 8.6, ownerId: 'system',
    image: '/images/restaurants/pizza-roma.jpg', deliveryTime: 30, deliveryFee: 0
  },
  {
    name: 'Sushi Bar TLV', description: 'Fresh sushi & Japanese cuisine', location: { lat: 32.0722, lng: 34.7789 },
    category: 'Sushi', phone: '03-2222222', openHours: '12:00-23:00', isPromoted: true, rating: 9.4, ownerId: 'system',
    image: '/images/restaurants/sushi-bar-tlv.jpg', deliveryTime: 40, deliveryFee: 0
  },
  {
    name: 'Burger Boss', description: 'Smash burgers & loaded fries', location: { lat: 32.0669, lng: 34.7778 },
    category: 'Burgers', phone: '03-3333333', openHours: '11:00-00:00', isPromoted: true, rating: 8.8, ownerId: 'system',
    image: '/images/restaurants/burger-boss.jpg', deliveryTime: 30, deliveryFee: 0
  },
  {
    name: 'Golden Dragon', description: 'Chinese & Asian favorites', location: { lat: 32.0745, lng: 34.7912 },
    category: 'Asian', phone: '03-4444444', openHours: '11:00-22:30', isPromoted: false, rating: 8.4, ownerId: 'system',
    image: '/images/restaurants/golden-dragon.jpg', deliveryTime: 35, deliveryFee: 9
  },
  {
    name: 'Green Bowl', description: 'Healthy salads & grain bowls', location: { lat: 32.0624, lng: 34.7712 },
    category: 'Salads', phone: '03-5555555', openHours: '09:00-21:00', isPromoted: false, rating: 8.9, ownerId: 'system',
    image: '/images/restaurants/green-bowl.jpg', deliveryTime: 25, deliveryFee: 0
  },
  {
    name: 'The Pasta House', description: 'Homemade pasta & risotto', location: { lat: 32.0801, lng: 34.7805 },
    category: 'Pasta', phone: '03-6666666', openHours: '12:00-23:00', isPromoted: false, rating: 8.2, ownerId: 'system',
    image: '/images/restaurants/pasta-house.jpg', deliveryTime: 35, deliveryFee: 9
  },
  {
    name: 'Sweet Dreams', description: 'Desserts, cakes & ice cream', location: { lat: 32.0700, lng: 34.7750 },
    category: 'Desserts', phone: '03-7777777', openHours: '10:00-23:30', isPromoted: false, rating: 9.1, ownerId: 'system',
    image: '/images/restaurants/sweet-dreams.jpg', deliveryTime: 25, deliveryFee: 0
  },
  {
    name: 'Taco Fiesta', description: 'Mexican street food & tacos', location: { lat: 32.0555, lng: 34.7700 },
    category: 'Mexican', phone: '03-8888888', openHours: '11:00-23:00', isPromoted: false, rating: 8.0, ownerId: 'system',
    image: '/images/restaurants/taco-fiesta.jpg', deliveryTime: 35, deliveryFee: 9
  },
];

const MENUS = [
  // 0: Pizza Roma
  [
    { title: 'Most Ordered', items: [
      { name: 'Margherita Pizza',  description: 'San Marzano tomato, fresh mozzarella, basil',            price: 62, image: '/images/menu/pizza-roma/margherita-pizza.jpg'  },
      { name: 'Pepperoni Pizza',   description: 'Tomato sauce, mozzarella, pepperoni slices',             price: 72, image: '/images/menu/pizza-roma/pepperoni-pizza.jpg'    },
    ]},
    { title: 'Starters', items: [
      { name: 'Garlic Bread',      description: 'Toasted ciabatta, roasted garlic, herbs',                price: 24, image: '/images/menu/pizza-roma/garlic-bread.jpg'       },
      { name: 'Bruschetta',        description: 'Fresh tomatoes, basil, olive oil on grilled bread',      price: 28, image: '/images/menu/pizza-roma/bruschetta.jpg'          },
      { name: 'Arancini (3 pcs)',  description: 'Fried risotto balls with mozzarella filling',            price: 36, image: '/images/menu/pizza-roma/arancini.jpg'            },
    ]},
    { title: 'Pizzas', items: [
      { name: 'Quattro Formaggi',  description: 'Mozzarella, gorgonzola, parmesan, ricotta',              price: 76, image: '/images/menu/pizza-roma/quattro-formaggi.jpg'   },
      { name: 'Truffle Mushroom',  description: 'Truffle cream, wild mushrooms, arugula, parmesan',       price: 84, image: '/images/menu/pizza-roma/truffle-mushroom.jpg'   },
      { name: 'Diavola',           description: 'Spicy tomato, mozzarella, salami, chili flakes',         price: 74, image: '/images/menu/pizza-roma/diavola.jpg'             },
      { name: 'Marinara',          description: 'Tomato, garlic, oregano, olive oil — no cheese',         price: 54, image: '/images/menu/pizza-roma/marinara.jpg'           },
    ]},
    { title: 'Drinks', items: [
      { name: 'Sparkling Water',   description: '500ml bottle',                                           price: 12, image: '/images/menu/pizza-roma/sparkling-water.jpg'    },
      { name: 'Italian Lemonade',  description: 'Homemade lemon, mint, soda',                            price: 18, image: '/images/menu/pizza-roma/italian-lemonade.jpg'   },
      { name: 'Espresso',          description: 'Double shot',                                            price: 14, image: '/images/menu/pizza-roma/espresso.jpg'           },
    ]},
  ],
  // 1: Sushi Bar TLV
  [
    { title: 'Most Ordered', items: [
      { name: 'Dragon Roll (8 pcs)',        description: 'Shrimp tempura, avocado, topped with tuna & tobiko',    price: 74, image: '/images/menu/sushi-bar-tlv/dragon-roll.jpg'        },
      { name: 'Salmon Sashimi (6 pcs)',     description: 'Premium fresh Atlantic salmon',                          price: 68, image: '/images/menu/sushi-bar-tlv/salmon-sashimi.jpg'      },
    ]},
    { title: 'Starters', items: [
      { name: 'Edamame',                    description: 'Steamed salted soy beans',                               price: 22, image: '/images/menu/sushi-bar-tlv/edamame.jpg'             },
      { name: 'Gyoza (5 pcs)',              description: 'Pan-fried pork & cabbage dumplings, ponzu sauce',        price: 38, image: '/images/menu/sushi-bar-tlv/gyoza.jpg'               },
      { name: 'Miso Soup',                  description: 'Tofu, wakame, green onion',                              price: 16, image: '/images/menu/sushi-bar-tlv/miso-soup.jpg'           },
    ]},
    { title: 'Special Rolls', items: [
      { name: 'Rainbow Roll (8 pcs)',       description: 'Crab, cucumber, topped with assorted fish & avocado',   price: 78, image: '/images/menu/sushi-bar-tlv/rainbow-roll.jpg'        },
      { name: 'Spicy Tuna Roll (8 pcs)',    description: 'Tuna, sriracha mayo, cucumber, sesame',                 price: 66, image: '/images/menu/sushi-bar-tlv/spicy-tuna-roll.jpg'     },
      { name: 'Vegetable Roll (8 pcs)',     description: 'Avocado, cucumber, carrot, pickled radish',             price: 52, image: '/images/menu/sushi-bar-tlv/vegetable-roll.jpg'      },
      { name: 'Crispy Salmon Roll (8 pcs)', description: 'Salmon, cream cheese, tempura flakes',                  price: 72, image: '/images/menu/sushi-bar-tlv/crispy-salmon-roll.jpg' },
    ]},
    { title: 'Mains', items: [
      { name: 'Teriyaki Salmon',            description: 'Grilled salmon, teriyaki glaze, steamed rice, pickles', price: 86, image: '/images/menu/sushi-bar-tlv/teriyaki-salmon.jpg'    },
      { name: 'Chicken Katsu Don',          description: 'Crispy chicken cutlet over rice with egg & onion',      price: 72, image: '/images/menu/sushi-bar-tlv/chicken-katsu-don.jpg'  },
      { name: 'Vegetable Ramen',            description: 'Miso broth, noodles, tofu, mushrooms, soft egg',        price: 64, image: '/images/menu/sushi-bar-tlv/vegetable-ramen.jpg'    },
    ]},
  ],
  // 2: Burger Boss
  [
    { title: 'Most Ordered', items: [
      { name: 'Boss Smash Burger',      description: 'Double smash patty, American cheese, Boss sauce, pickles', price: 68, image: '/images/menu/burger-boss/boss-smash-burger.jpg'    },
      { name: 'Loaded Fries',           description: 'Crispy fries, cheese sauce, jalapeños, sour cream',        price: 38, image: '/images/menu/burger-boss/loaded-fries.jpg'          },
    ]},
    { title: 'Burgers', items: [
      { name: 'Classic Smash',          description: '200g beef, American cheese, lettuce, tomato, pickles',     price: 58, image: '/images/menu/burger-boss/classic-smash.jpg'         },
      { name: 'Crispy Chicken Burger',  description: 'Fried chicken thigh, coleslaw, sriracha mayo',             price: 62, image: '/images/menu/burger-boss/crispy-chicken-burger.jpg' },
      { name: 'Mushroom Swiss',         description: 'Smash patty, Swiss cheese, sautéed mushrooms, truffle mayo', price: 72, image: '/images/menu/burger-boss/mushroom-swiss.jpg'    },
      { name: 'Veggie Smash',           description: 'Plant-based patty, vegan cheese, lettuce, tomato, pickles', price: 64, image: '/images/menu/burger-boss/veggie-smash.jpg'        },
    ]},
    { title: 'Sides', items: [
      { name: 'Classic Fries',          description: 'Golden crispy fries, sea salt',                            price: 22, image: '/images/menu/burger-boss/classic-fries.jpg'         },
      { name: 'Onion Rings (6 pcs)',    description: 'Beer-battered onion rings, ranch dip',                     price: 28, image: '/images/menu/burger-boss/onion-rings.jpg'           },
      { name: 'Coleslaw',               description: 'Creamy homemade coleslaw',                                  price: 16, image: '/images/menu/burger-boss/coleslaw.jpg'             },
    ]},
    { title: 'Drinks', items: [
      { name: 'Craft Cola',             description: 'House-made cola syrup with soda',                           price: 18, image: '/images/menu/burger-boss/craft-cola.jpg'           },
      { name: 'Milkshake',              description: 'Vanilla, chocolate or strawberry',                          price: 32, image: '/images/menu/burger-boss/milkshake.jpg'            },
      { name: 'Still Water',            description: '500ml bottle',                                              price: 10, image: '/images/menu/burger-boss/still-water.jpg'           },
    ]},
  ],
  // 3: Golden Dragon
  [
    { title: 'Most Ordered', items: [
      { name: 'Dim Sum Basket (6 pcs)',       description: 'Assorted steamed dumplings, ginger soy dip',              price: 52, image: '/images/menu/golden-dragon/dim-sum-basket.jpg'       },
      { name: 'Kung Pao Chicken',             description: 'Wok-fried chicken, peanuts, dried chili, Sichuan pepper', price: 68, image: '/images/menu/golden-dragon/kung-pao-chicken.jpg'      },
    ]},
    { title: 'Starters', items: [
      { name: 'Spring Rolls (4 pcs)',         description: 'Crispy vegetable rolls, sweet chili sauce',               price: 32, image: '/images/menu/golden-dragon/spring-rolls.jpg'           },
      { name: 'Wonton Soup',                  description: 'Pork wontons in clear broth, green onion',                price: 36, image: '/images/menu/golden-dragon/wonton-soup.jpg'            },
      { name: 'Peking Duck Pancakes (4 pcs)', description: 'Crispy duck, hoisin sauce, cucumber, spring onion',       price: 58, image: '/images/menu/golden-dragon/peking-duck-pancakes.jpg'   },
    ]},
    { title: 'Mains', items: [
      { name: 'Sweet & Sour Chicken',         description: 'Crispy chicken, bell peppers, pineapple, sweet & sour glaze', price: 64, image: '/images/menu/golden-dragon/sweet-sour-chicken.jpg' },
      { name: 'Beef in Black Bean Sauce',     description: 'Tender beef strips, black bean sauce, peppers, onion',    price: 72, image: '/images/menu/golden-dragon/beef-black-bean.jpg'        },
      { name: 'Mapo Tofu',                    description: 'Silken tofu, minced meat, Sichuan chili bean paste',      price: 58, image: '/images/menu/golden-dragon/mapo-tofu.jpg'             },
      { name: 'Fried Rice',                   description: 'Wok-fried rice, egg, vegetables, soy sauce',              price: 44, image: '/images/menu/golden-dragon/fried-rice.jpg'            },
    ]},
  ],
  // 4: Green Bowl
  [
    { title: 'Most Ordered', items: [
      { name: 'Buddha Bowl',             description: 'Quinoa, roasted chickpeas, avocado, tahini dressing',         price: 62, image: '/images/menu/green-bowl/buddha-bowl.jpg'          },
      { name: 'Falafel Salad',           description: 'Crispy falafel, mixed greens, cherry tomatoes, lemon tahini', price: 54, image: '/images/menu/green-bowl/falafel-salad.jpg'         },
    ]},
    { title: 'Grain Bowls', items: [
      { name: 'Mediterranean Bowl',      description: 'Farro, hummus, roasted vegetables, olives, feta',             price: 64, image: '/images/menu/green-bowl/mediterranean-bowl.jpg'    },
      { name: 'Asian Sesame Bowl',       description: 'Brown rice, edamame, carrot, cucumber, sesame dressing',      price: 58, image: '/images/menu/green-bowl/asian-sesame-bowl.jpg'     },
      { name: 'Power Protein Bowl',      description: 'Lentils, grilled tofu, sweet potato, spinach, tahini',        price: 66, image: '/images/menu/green-bowl/power-protein-bowl.jpg'  },
    ]},
    { title: 'Salads', items: [
      { name: 'Classic Caesar',          description: 'Romaine, house caesar dressing, croutons, parmesan',          price: 48, image: '/images/menu/green-bowl/classic-caesar.jpg'        },
      { name: 'Watermelon Arugula',      description: 'Watermelon, arugula, feta, mint, balsamic reduction',         price: 52, image: '/images/menu/green-bowl/watermelon-arugula.jpg'   },
      { name: 'Chopped Salad',           description: 'Tomato, cucumber, onion, parsley, lemon-olive oil',           price: 38, image: '/images/menu/green-bowl/chopped-salad.jpg'         },
    ]},
    { title: 'Extras', items: [
      { name: 'Extra Avocado',           description: 'Half avocado',                                                price: 14, image: '/images/menu/green-bowl/extra-avocado.jpg'         },
      { name: 'Extra Tahini',            description: 'House-made tahini sauce',                                     price: 8,  image: '/images/menu/green-bowl/extra-tahini.jpg'         },
      { name: 'Add Grilled Chicken',     description: '100g seasoned grilled chicken breast',                        price: 22, image: '/images/menu/green-bowl/grilled-chicken.jpg'        },
    ]},
  ],
  // 5: The Pasta House
  [
    { title: 'Most Ordered', items: [
      { name: 'Cacio e Pepe',            description: 'Tonnarelli, Pecorino Romano, black pepper',                   price: 68, image: '/images/menu/pasta-house/cacio-e-pepe.jpg'         },
      { name: 'Truffle Tagliatelle',     description: 'Fresh tagliatelle, black truffle, butter, parmesan',          price: 88, image: '/images/menu/pasta-house/truffle-tagliatelle.jpg'  },
    ]},
    { title: 'Pasta', items: [
      { name: 'Spaghetti Carbonara',     description: 'Guanciale, egg yolk, Pecorino, black pepper',                 price: 72, image: '/images/menu/pasta-house/spaghetti-carbonara.jpg'  },
      { name: 'Pappardelle Bolognese',   description: 'Slow-cooked beef & pork ragù, pappardelle',                  price: 78, image: '/images/menu/pasta-house/pappardelle-bolognese.jpg' },
      { name: 'Spinach Ricotta Ravioli', description: 'Homemade ravioli, sage brown butter, parmesan',              price: 76, image: '/images/menu/pasta-house/spinach-ravioli.jpg'       },
      { name: 'Arrabbiata',              description: 'Penne, spicy tomato sauce, garlic, fresh basil',             price: 58, image: '/images/menu/pasta-house/arrabbiata.jpg'            },
    ]},
    { title: 'Risotto', items: [
      { name: 'Mushroom Risotto',        description: 'Arborio rice, porcini, parmesan, fresh thyme',               price: 74, image: '/images/menu/pasta-house/mushroom-risotto.jpg'      },
      { name: 'Saffron Risotto',         description: 'Milanese-style saffron risotto, bone marrow',                price: 82, image: '/images/menu/pasta-house/saffron-risotto.jpg'       },
    ]},
  ],
  // 6: Sweet Dreams
  [
    { title: 'Most Ordered', items: [
      { name: 'Chocolate Lava Cake',     description: 'Warm chocolate cake, molten center, vanilla ice cream',       price: 46, image: '/images/menu/sweet-dreams/chocolate-lava-cake.jpg' },
      { name: 'Cheesecake Slice',        description: 'New York style, berry compote, graham cracker crust',         price: 42, image: '/images/menu/sweet-dreams/cheesecake-slice.jpg'    },
    ]},
    { title: 'Cakes & Slices', items: [
      { name: 'Tiramisu',                description: 'Mascarpone, espresso-soaked ladyfingers, cocoa',              price: 44, image: '/images/menu/sweet-dreams/tiramisu.jpg'             },
      { name: 'Red Velvet Slice',        description: 'Red velvet cake, cream cheese frosting',                      price: 40, image: '/images/menu/sweet-dreams/red-velvet-slice.jpg'     },
      { name: 'Carrot Cake',             description: 'Spiced carrot cake, walnuts, cream cheese frosting',          price: 40, image: '/images/menu/sweet-dreams/carrot-cake.jpg'          },
      { name: 'Opera Cake',              description: 'Almond sponge, coffee buttercream, chocolate ganache',        price: 48, image: '/images/menu/sweet-dreams/opera-cake.jpg'           },
    ]},
    { title: 'Ice Cream', items: [
      { name: 'Ice Cream (2 scoops)',    description: 'Choose: vanilla, chocolate, strawberry, pistachio',           price: 28, image: '/images/menu/sweet-dreams/ice-cream-scoops.jpg'    },
      { name: 'Affogato',                description: 'Vanilla ice cream, double espresso shot',                     price: 32, image: '/images/menu/sweet-dreams/affogato.jpg'             },
      { name: 'Sundae',                  description: 'Vanilla ice cream, hot fudge, whipped cream, cherry',         price: 38, image: '/images/menu/sweet-dreams/sundae.jpg'               },
    ]},
    { title: 'Hot Drinks', items: [
      { name: 'Specialty Coffee',        description: 'Latte, cappuccino, flat white — your choice',                 price: 18, image: '/images/menu/sweet-dreams/specialty-coffee.jpg'    },
      { name: 'Hot Chocolate',           description: 'Belgian chocolate, steamed milk, whipped cream',              price: 22, image: '/images/menu/sweet-dreams/hot-chocolate.jpg'        },
    ]},
  ],
  // 7: Taco Fiesta
  [
    { title: 'Most Ordered', items: [
      { name: 'Taco Trio',               description: 'Choice of 3 tacos: chicken, beef or veggie, pico de gallo',  price: 54, image: '/images/menu/taco-fiesta/taco-trio.jpg'             },
      { name: 'Loaded Nachos',           description: 'Tortilla chips, cheese sauce, jalapeños, guacamole, sour cream', price: 48, image: '/images/menu/taco-fiesta/loaded-nachos.jpg'    },
    ]},
    { title: 'Tacos', items: [
      { name: 'Grilled Chicken Taco',    description: 'Marinated chicken, cabbage slaw, chipotle mayo, lime',       price: 22, image: '/images/menu/taco-fiesta/grilled-chicken-taco.jpg'  },
      { name: 'Beef Barbacoa Taco',      description: 'Slow-cooked beef, onion, cilantro, salsa verde',             price: 24, image: '/images/menu/taco-fiesta/beef-barbacoa-taco.jpg'    },
      { name: 'Baja Fish Taco',          description: 'Beer-battered fish, pickled cabbage, mango salsa',           price: 26, image: '/images/menu/taco-fiesta/baja-fish-taco.jpg'        },
      { name: 'Black Bean Taco',         description: 'Spiced black beans, roasted corn, avocado, pico',            price: 20, image: '/images/menu/taco-fiesta/black-bean-taco.jpg'       },
    ]},
    { title: 'Mains', items: [
      { name: 'Chicken Burrito',         description: 'Large flour tortilla, rice, beans, chicken, cheese, salsa',  price: 62, image: '/images/menu/taco-fiesta/chicken-burrito.jpg'       },
      { name: 'Beef Quesadilla',         description: 'Grilled flour tortilla, beef, cheese, peppers, sour cream',  price: 58, image: '/images/menu/taco-fiesta/beef-quesadilla.jpg'       },
      { name: 'Veggie Bowl',             description: 'Rice, black beans, roasted vegetables, guacamole, salsa',    price: 52, image: '/images/menu/taco-fiesta/veggie-bowl.jpg'           },
    ]},
    { title: 'Extras & Sauces', items: [
      { name: 'Guacamole',               description: 'Fresh avocado, lime, onion, cilantro',                       price: 18, image: '/images/menu/taco-fiesta/guacamole.jpg'             },
      { name: 'Extra Salsa',             description: 'Choice: pico, salsa verde or roja',                          price: 8,  image: '/images/menu/taco-fiesta/extra-salsa.jpg'           },
      { name: 'Tortilla Chips',          description: 'Fresh corn tortilla chips, sea salt',                        price: 16, image: '/images/menu/taco-fiesta/tortilla-chips.jpg'        },
    ]},
  ],
];

async function seed() {
    const count = await Restaurant.countDocuments();
    if (count > 0) return;

    for (let i = 0; i < RESTAURANTS.length; i++) {
        const rest = await Restaurant.create(RESTAURANTS[i]);
        const sections = MENUS[i] || [];

        const products = sections.flatMap((section, sectionOrder) =>
            section.items.map(item => ({
                name:         item.name,
                description:  item.description,
                price:        item.price,
                image:        item.image,
                section:      section.title,
                sectionOrder,
                isAvailable:  true,
                restaurantId: rest.id,
            }))
        );

        if (products.length > 0) await Product.insertMany(products);
    }

    console.log(`Seeded ${RESTAURANTS.length} restaurants.`);
}

module.exports = { seed };
