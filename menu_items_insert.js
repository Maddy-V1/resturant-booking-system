// College Canteen Menu (Realistic Photos + Balanced Pricing)

db.menuitems.insertMany([
    {
      name: "Masala Dosa",
      description: "Crispy dosa filled with spiced potato filling, served with sambar and coconut chutney",
      price: 30,
      imageUrl: "https://images.unsplash.com/photo-1601050690394-0e6ec90f6d9b?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Chole Bhature",
      description: "Fluffy bhature served with spicy chole curry and onion salad",
      price: 50,
      imageUrl: "https://images.unsplash.com/photo-1603899122778-e0df6e7f9c56?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: true,
      createdAt: new Date()
    },
    {
      name: "Pasta",
      description: "Tasty white sauce pasta cooked with veggies and herbs",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1605478571978-b4a5f2e7ad0c?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: true,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Fries",
      description: "Golden crispy french fries, lightly salted",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1606755962773-0b6f1d3a9d63?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Thali",
      description: "Complete Indian meal – dal, sabzi, rice, roti & pickle",
      price: 50,
      imageUrl: "https://images.unsplash.com/photo-1632560579760-4a7c31974c68?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: true,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Rajma Rice",
      description: "Rajma curry served with steamed rice and salad",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1623041175274-62dbdf9ccf9f?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Chole Rice",
      description: "Chickpeas curry served with steamed rice",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1603899122778-e0df6e7f9c56?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Fried Rice",
      description: "Veg fried rice tossed with soya sauce and spices",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Dal Makhani Rice",
      description: "Creamy dal makhani served with steamed rice",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1645950747979-047eeb56f3b9?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "live",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    }
  ]);
  
  // Ready / Packaged Items
  db.menuitems.insertMany([
    {
      name: "Samosa",
      description: "Crispy fried samosa stuffed with potato masala",
      price: 10,
      imageUrl: "https://images.unsplash.com/photo-1627308595183-231dfd38c1d2?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: true,
      createdAt: new Date()
    },
    {
      name: "Bread Pakora",
      description: "Fried bread snack filled with spiced potato mix",
      price: 12,
      imageUrl: "https://images.unsplash.com/photo-1615486364011-1cbd0839db24?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Sandwich",
      description: "Fresh vegetable sandwich with green chutney",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1603046891728-3a506b60368f?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Bourbon Biscuit",
      description: "Chocolate cream biscuits - 100g pack",
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1604909053369-3f2ee9b9d7cf?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Water Bottle",
      description: "500ml packaged drinking water",
      price: 10,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Pepsi 200ml",
      description: "Pepsi soft drink - 200ml bottle",
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Pepsi 500ml",
      description: "Pepsi soft drink - 500ml bottle",
      price: 30,
      imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Coca Cola 200ml",
      description: "Coca Cola - 200ml bottle",
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1ea24c7?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
      name: "Coca Cola 500ml",
      description: "Coca Cola - 500ml bottle",
      price: 30,
      imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1ea24c7?w=400&h=300&fit=crop&crop=center",
      available: true,
      type: "packaged",
      sometimes: false,
      isDealOfDay: false,
      createdAt: new Date()
    },
    {
        name: "Tropicana 200ml",
        description: "Tropicana Orange Juice - 200ml pack",
        price: 25,
        imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop&crop=center",
        available: true,
        type: "packaged",
        sometimes: false,
        isDealOfDay: false,
        createdAt: new Date()
      },
      {
        name: "Tropicana 400ml",
        description: "Tropicana Orange Juice - 400ml pack",
        price: 40,
        imageUrl: "https://images.unsplash.com/photo-1542444469-5f1b4f6f6f0a?w=400&h=300&fit=crop&crop=center",
        available: true,
        type: "packaged",
        sometimes: false,
        isDealOfDay: false,
        createdAt: new Date()
      },
      {
        name: "Lays Blue (50g)",
        description: "Lays Classic Salted Chips - 50g pack",
        price: 20,
        imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=300&fit=crop&crop=center",
        available: true,
        type: "packaged",
        sometimes: false,
        isDealOfDay: false,
        createdAt: new Date()
      },
      {
        name: "Lays Green (50g)",
        description: "Lays Magic Masala Chips - 50g pack",
        price: 20,
        imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=300&fit=crop&crop=center",
        available: true,
        type: "packaged",
        sometimes: false,
        isDealOfDay: false,
        createdAt: new Date()
      },
      {
        name: "Cheekos (50g)",
        description: "Crunchy corn snack (Cheekos) - 50g pack",
        price: 25,
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&crop=center",
        available: true,
        type: "packaged",
        sometimes: false,
        isDealOfDay: false,
        createdAt: new Date()
      }
  ]);
  