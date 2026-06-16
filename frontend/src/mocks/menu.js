const MENU_BY_RESTAURANT = {
  '1': [ // Pizza Roma
    {
      id: 'pr-popular', title: 'Most Ordered',
      items: [
        { id: 'pr-p1', name: 'Margherita Pizza', description: 'San Marzano tomato, fresh mozzarella, basil', price: 62, image: '', maxQty: 10, isPopular: true },
        { id: 'pr-p2', name: 'Pepperoni Pizza', description: 'Tomato sauce, mozzarella, pepperoni slices', price: 72, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'pr-starters', title: 'Starters',
      items: [
        { id: 'pr-s1', name: 'Garlic Bread', description: 'Toasted ciabatta, roasted garlic, herbs', price: 24, image: '', maxQty: 5, isPopular: false },
        { id: 'pr-s2', name: 'Bruschetta', description: 'Fresh tomatoes, basil, olive oil on grilled bread', price: 28, image: '', maxQty: 10, isPopular: false },
        { id: 'pr-s3', name: 'Arancini (3 pcs)', description: 'Fried risotto balls with mozzarella filling', price: 36, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'pr-pizzas', title: 'Pizzas',
      items: [
        { id: 'pr-pz1', name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmesan, ricotta', price: 76, image: '', maxQty: 10, isPopular: false },
        { id: 'pr-pz2', name: 'Truffle Mushroom', description: 'Truffle cream, wild mushrooms, arugula, parmesan', price: 84, image: '', maxQty: 10, isPopular: false },
        { id: 'pr-pz3', name: 'Diavola', description: 'Spicy tomato, mozzarella, salami, chili flakes', price: 74, image: '', maxQty: 10, isPopular: false },
        { id: 'pr-pz4', name: 'Marinara', description: 'Tomato, garlic, oregano, olive oil — no cheese', price: 54, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'pr-drinks', title: 'Drinks',
      items: [
        { id: 'pr-d1', name: 'Sparkling Water', description: '500ml bottle', price: 12, image: '', maxQty: 10, isPopular: false },
        { id: 'pr-d2', name: 'Italian Lemonade', description: 'Homemade lemon, mint, soda', price: 18, image: '', maxQty: 10, isPopular: false },
        { id: 'pr-d3', name: 'Espresso', description: 'Double shot', price: 14, image: '', maxQty: 3, isPopular: false },
      ],
    },
  ],

  '2': [ // Sushi Bar TLV
    {
      id: 'sb-popular', title: 'Most Ordered',
      items: [
        { id: 'sb-p1', name: 'Dragon Roll (8 pcs)', description: 'Shrimp tempura, avocado, topped with tuna & tobiko', price: 74, image: '', maxQty: 10, isPopular: true },
        { id: 'sb-p2', name: 'Salmon Sashimi (6 pcs)', description: 'Premium fresh Atlantic salmon', price: 68, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'sb-starters', title: 'Starters',
      items: [
        { id: 'sb-s1', name: 'Edamame', description: 'Steamed salted soy beans', price: 22, image: '', maxQty: 5, isPopular: false },
        { id: 'sb-s2', name: 'Gyoza (5 pcs)', description: 'Pan-fried pork & cabbage dumplings, ponzu sauce', price: 38, image: '', maxQty: 10, isPopular: false },
        { id: 'sb-s3', name: 'Miso Soup', description: 'Tofu, wakame, green onion', price: 16, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'sb-rolls', title: 'Special Rolls',
      items: [
        { id: 'sb-r1', name: 'Rainbow Roll (8 pcs)', description: 'Crab, cucumber, topped with assorted fish & avocado', price: 78, image: '', maxQty: 10, isPopular: false },
        { id: 'sb-r2', name: 'Spicy Tuna Roll (8 pcs)', description: 'Tuna, sriracha mayo, cucumber, sesame', price: 66, image: '', maxQty: 10, isPopular: false },
        { id: 'sb-r3', name: 'Vegetable Roll (8 pcs)', description: 'Avocado, cucumber, carrot, pickled radish', price: 52, image: '', maxQty: 10, isPopular: false },
        { id: 'sb-r4', name: 'Crispy Salmon Roll (8 pcs)', description: 'Salmon, cream cheese, tempura flakes', price: 72, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'sb-mains', title: 'Mains',
      items: [
        { id: 'sb-m1', name: 'Teriyaki Salmon', description: 'Grilled salmon, teriyaki glaze, steamed rice, pickles', price: 86, image: '', maxQty: 10, isPopular: false },
        { id: 'sb-m2', name: 'Chicken Katsu Don', description: 'Crispy chicken cutlet over rice with egg & onion', price: 72, image: '', maxQty: 10, isPopular: false },
        { id: 'sb-m3', name: 'Vegetable Ramen', description: 'Miso broth, noodles, tofu, mushrooms, soft egg', price: 64, image: '', maxQty: 10, isPopular: false },
      ],
    },
  ],

  '3': [ // Burger Boss
    {
      id: 'bb-popular', title: 'Most Ordered',
      items: [
        { id: 'bb-p1', name: 'Boss Smash Burger', description: 'Double smash patty, American cheese, Boss sauce, pickles', price: 68, image: '', maxQty: 10, isPopular: true },
        { id: 'bb-p2', name: 'Loaded Fries', description: 'Crispy fries, cheese sauce, jalapeños, sour cream', price: 38, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'bb-burgers', title: 'Burgers',
      items: [
        { id: 'bb-b1', name: 'Classic Smash', description: '200g beef, American cheese, lettuce, tomato, pickles', price: 58, image: '', maxQty: 10, isPopular: false },
        { id: 'bb-b2', name: 'Crispy Chicken Burger', description: 'Fried chicken thigh, coleslaw, sriracha mayo', price: 62, image: '', maxQty: 10, isPopular: false },
        { id: 'bb-b3', name: 'Mushroom Swiss', description: 'Smash patty, Swiss cheese, sautéed mushrooms, truffle mayo', price: 72, image: '', maxQty: 10, isPopular: false },
        { id: 'bb-b4', name: 'Veggie Smash', description: 'Plant-based patty, vegan cheese, lettuce, tomato, pickles', price: 64, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'bb-sides', title: 'Sides',
      items: [
        { id: 'bb-s1', name: 'Classic Fries', description: 'Golden crispy fries, sea salt', price: 22, image: '', maxQty: 5, isPopular: false },
        { id: 'bb-s2', name: 'Onion Rings (6 pcs)', description: 'Beer-battered onion rings, ranch dip', price: 28, image: '', maxQty: 10, isPopular: false },
        { id: 'bb-s3', name: 'Coleslaw', description: 'Creamy homemade coleslaw', price: 16, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'bb-drinks', title: 'Drinks',
      items: [
        { id: 'bb-d1', name: 'Craft Cola', description: 'House-made cola syrup with soda', price: 18, image: '', maxQty: 10, isPopular: false },
        { id: 'bb-d2', name: 'Milkshake', description: 'Vanilla, chocolate or strawberry', price: 32, image: '', maxQty: 3, isPopular: false },
        { id: 'bb-d3', name: 'Still Water', description: '500ml bottle', price: 10, image: '', maxQty: 10, isPopular: false },
      ],
    },
  ],

  '4': [ // Golden Dragon
    {
      id: 'gd-popular', title: 'Most Ordered',
      items: [
        { id: 'gd-p1', name: 'Dim Sum Basket (6 pcs)', description: 'Assorted steamed dumplings, ginger soy dip', price: 52, image: '', maxQty: 10, isPopular: true },
        { id: 'gd-p2', name: 'Kung Pao Chicken', description: 'Wok-fried chicken, peanuts, dried chili, Sichuan pepper', price: 68, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'gd-starters', title: 'Starters',
      items: [
        { id: 'gd-s1', name: 'Spring Rolls (4 pcs)', description: 'Crispy vegetable rolls, sweet chili sauce', price: 32, image: '', maxQty: 5, isPopular: false },
        { id: 'gd-s2', name: 'Wonton Soup', description: 'Pork wontons in clear broth, green onion', price: 36, image: '', maxQty: 10, isPopular: false },
        { id: 'gd-s3', name: 'Peking Duck Pancakes (4 pcs)', description: 'Crispy duck, hoisin sauce, cucumber, spring onion', price: 58, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'gd-mains', title: 'Mains',
      items: [
        { id: 'gd-m1', name: 'Sweet & Sour Chicken', description: 'Crispy chicken, bell peppers, pineapple, sweet & sour glaze', price: 64, image: '', maxQty: 10, isPopular: false },
        { id: 'gd-m2', name: 'Beef in Black Bean Sauce', description: 'Tender beef strips, black bean sauce, peppers, onion', price: 72, image: '', maxQty: 10, isPopular: false },
        { id: 'gd-m3', name: 'Mapo Tofu', description: 'Silken tofu, minced meat, Sichuan chili bean paste', price: 58, image: '', maxQty: 10, isPopular: false },
        { id: 'gd-m4', name: 'Fried Rice', description: 'Wok-fried rice, egg, vegetables, soy sauce', price: 44, image: '', maxQty: 10, isPopular: false },
      ],
    },
  ],

  '5': [ // Green Bowl
    {
      id: 'gb-popular', title: 'Most Ordered',
      items: [
        { id: 'gb-p1', name: 'Buddha Bowl', description: 'Quinoa, roasted chickpeas, avocado, tahini dressing', price: 62, image: '', maxQty: 10, isPopular: true },
        { id: 'gb-p2', name: 'Falafel Salad', description: 'Crispy falafel, mixed greens, cherry tomatoes, lemon tahini', price: 54, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'gb-bowls', title: 'Grain Bowls',
      items: [
        { id: 'gb-b1', name: 'Mediterranean Bowl', description: 'Farro, hummus, roasted vegetables, olives, feta', price: 64, image: '', maxQty: 10, isPopular: false },
        { id: 'gb-b2', name: 'Asian Sesame Bowl', description: 'Brown rice, edamame, carrot, cucumber, sesame dressing', price: 58, image: '', maxQty: 10, isPopular: false },
        { id: 'gb-b3', name: 'Power Protein Bowl', description: 'Lentils, grilled tofu, sweet potato, spinach, tahini', price: 66, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'gb-salads', title: 'Salads',
      items: [
        { id: 'gb-s1', name: 'Classic Caesar', description: 'Romaine, house caesar dressing, croutons, parmesan', price: 48, image: '', maxQty: 10, isPopular: false },
        { id: 'gb-s2', name: 'Watermelon Arugula', description: 'Watermelon, arugula, feta, mint, balsamic reduction', price: 52, image: '', maxQty: 10, isPopular: false },
        { id: 'gb-s3', name: 'Chopped Salad', description: 'Tomato, cucumber, onion, parsley, lemon-olive oil', price: 38, image: '', maxQty: 5, isPopular: false },
      ],
    },
    {
      id: 'gb-extras', title: 'Extras',
      items: [
        { id: 'gb-e1', name: 'Extra Avocado', description: 'Half avocado', price: 14, image: '', maxQty: 3, isPopular: false },
        { id: 'gb-e2', name: 'Extra Tahini', description: 'House-made tahini sauce', price: 8, image: '', maxQty: 5, isPopular: false },
        { id: 'gb-e3', name: 'Add Grilled Chicken', description: '100g seasoned grilled chicken breast', price: 22, image: '', maxQty: 3, isPopular: false },
      ],
    },
  ],

  '6': [ // The Pasta House
    {
      id: 'ph-popular', title: 'Most Ordered',
      items: [
        { id: 'ph-p1', name: 'Cacio e Pepe', description: 'Tonnarelli, Pecorino Romano, black pepper', price: 68, image: '', maxQty: 10, isPopular: true },
        { id: 'ph-p2', name: 'Truffle Tagliatelle', description: 'Fresh tagliatelle, black truffle, butter, parmesan', price: 88, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'ph-pasta', title: 'Pasta',
      items: [
        { id: 'ph-pa1', name: 'Spaghetti Carbonara', description: 'Guanciale, egg yolk, Pecorino, black pepper', price: 72, image: '', maxQty: 10, isPopular: false },
        { id: 'ph-pa2', name: 'Pappardelle Bolognese', description: 'Slow-cooked beef & pork ragù, pappardelle', price: 78, image: '', maxQty: 10, isPopular: false },
        { id: 'ph-pa3', name: 'Spinach Ricotta Ravioli', description: 'Homemade ravioli, sage brown butter, parmesan', price: 76, image: '', maxQty: 10, isPopular: false },
        { id: 'ph-pa4', name: 'Arrabbiata', description: 'Penne, spicy tomato sauce, garlic, fresh basil', price: 58, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'ph-risotto', title: 'Risotto',
      items: [
        { id: 'ph-r1', name: 'Mushroom Risotto', description: 'Arborio rice, porcini, parmesan, fresh thyme', price: 74, image: '', maxQty: 10, isPopular: false },
        { id: 'ph-r2', name: 'Saffron Risotto', description: 'Milanese-style saffron risotto, bone marrow', price: 82, image: '', maxQty: 10, isPopular: false },
      ],
    },
  ],

  '7': [ // Sweet Dreams
    {
      id: 'sd-popular', title: 'Most Ordered',
      items: [
        { id: 'sd-p1', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake, molten center, vanilla ice cream', price: 46, image: '', maxQty: 10, isPopular: true },
        { id: 'sd-p2', name: 'Cheesecake Slice', description: 'New York style, berry compote, graham cracker crust', price: 42, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'sd-cakes', title: 'Cakes & Slices',
      items: [
        { id: 'sd-c1', name: 'Tiramisu', description: 'Mascarpone, espresso-soaked ladyfingers, cocoa', price: 44, image: '', maxQty: 10, isPopular: false },
        { id: 'sd-c2', name: 'Red Velvet Slice', description: 'Red velvet cake, cream cheese frosting', price: 40, image: '', maxQty: 10, isPopular: false },
        { id: 'sd-c3', name: 'Carrot Cake', description: 'Spiced carrot cake, walnuts, cream cheese frosting', price: 40, image: '', maxQty: 10, isPopular: false },
        { id: 'sd-c4', name: 'Opera Cake', description: 'Almond sponge, coffee buttercream, chocolate ganache', price: 48, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'sd-ice', title: 'Ice Cream',
      items: [
        { id: 'sd-i1', name: 'Ice Cream (2 scoops)', description: 'Choose: vanilla, chocolate, strawberry, pistachio', price: 28, image: '', maxQty: 5, isPopular: false },
        { id: 'sd-i2', name: 'Affogato', description: 'Vanilla ice cream, double espresso shot', price: 32, image: '', maxQty: 5, isPopular: false },
        { id: 'sd-i3', name: 'Sundae', description: 'Vanilla ice cream, hot fudge, whipped cream, cherry', price: 38, image: '', maxQty: 5, isPopular: false },
      ],
    },
    {
      id: 'sd-drinks', title: 'Hot Drinks',
      items: [
        { id: 'sd-d1', name: 'Specialty Coffee', description: 'Latte, cappuccino, flat white — your choice', price: 18, image: '', maxQty: 3, isPopular: false },
        { id: 'sd-d2', name: 'Hot Chocolate', description: 'Belgian chocolate, steamed milk, whipped cream', price: 22, image: '', maxQty: 3, isPopular: false },
      ],
    },
  ],

  '8': [ // Taco Fiesta
    {
      id: 'tf-popular', title: 'Most Ordered',
      items: [
        { id: 'tf-p1', name: 'Taco Trio', description: 'Choice of 3 tacos: chicken, beef or veggie, pico de gallo', price: 54, image: '', maxQty: 10, isPopular: true },
        { id: 'tf-p2', name: 'Loaded Nachos', description: 'Tortilla chips, cheese sauce, jalapeños, guacamole, sour cream', price: 48, image: '', maxQty: 10, isPopular: true },
      ],
    },
    {
      id: 'tf-tacos', title: 'Tacos',
      items: [
        { id: 'tf-t1', name: 'Grilled Chicken Taco', description: 'Marinated chicken, cabbage slaw, chipotle mayo, lime', price: 22, image: '', maxQty: 10, isPopular: false },
        { id: 'tf-t2', name: 'Beef Barbacoa Taco', description: 'Slow-cooked beef, onion, cilantro, salsa verde', price: 24, image: '', maxQty: 10, isPopular: false },
        { id: 'tf-t3', name: 'Baja Fish Taco', description: 'Beer-battered fish, pickled cabbage, mango salsa', price: 26, image: '', maxQty: 10, isPopular: false },
        { id: 'tf-t4', name: 'Black Bean Taco', description: 'Spiced black beans, roasted corn, avocado, pico', price: 20, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'tf-mains', title: 'Mains',
      items: [
        { id: 'tf-m1', name: 'Chicken Burrito', description: 'Large flour tortilla, rice, beans, chicken, cheese, salsa', price: 62, image: '', maxQty: 10, isPopular: false },
        { id: 'tf-m2', name: 'Beef Quesadilla', description: 'Grilled flour tortilla, beef, cheese, peppers, sour cream', price: 58, image: '', maxQty: 10, isPopular: false },
        { id: 'tf-m3', name: 'Veggie Bowl', description: 'Rice, black beans, roasted vegetables, guacamole, salsa', price: 52, image: '', maxQty: 10, isPopular: false },
      ],
    },
    {
      id: 'tf-extras', title: 'Extras & Sauces',
      items: [
        { id: 'tf-e1', name: 'Guacamole', description: 'Fresh avocado, lime, onion, cilantro', price: 18, image: '', maxQty: 3, isPopular: false },
        { id: 'tf-e2', name: 'Extra Salsa', description: 'Choice: pico, salsa verde or roja', price: 8, image: '', maxQty: 5, isPopular: false },
        { id: 'tf-e3', name: 'Tortilla Chips', description: 'Fresh corn tortilla chips, sea salt', price: 16, image: '', maxQty: 5, isPopular: false },
      ],
    },
  ],
};

export function getMenu(restaurantId) {
  return MENU_BY_RESTAURANT[restaurantId] || [];
}
