# College Canteen Ordering System

A comprehensive full-stack web application for managing college canteen orders with real-time updates, built with React, Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

### For Students
- **User Authentication** - Secure signup/login with JWT tokens
- **Menu Browsing** - View available items with real-time updates
- **Order Placement** - Add items to cart and place orders
- **Payment Options** - Online payment or pay-at-counter
- **Real-time Tracking** - Track order status with live updates
- **Order History** - View past orders and details
- **Account Management** - Manage profile information

### For Staff
- **Admin Dashboard** - Comprehensive management interface
- **Menu Management** - Add, edit, delete, and toggle menu items
- **Deal of the Day** - Set special offers with discounted prices
- **Order Queue** - View and manage incoming orders
- **Status Updates** - Update order preparation status
- **Manual Orders** - Create orders on behalf of customers
- **Payment Confirmation** - Confirm offline payments
- **Real-time Notifications** - Instant updates for new orders

### Technical Features
- **Real-time Communication** - Socket.io for live updates
- **Role-based Access Control** - Separate interfaces for students and staff
- **Responsive Design** - Mobile-friendly interface
- **Order Claiming System** - Staff can place orders for students
- **Payment Status Tracking** - Separate queues for paid/unpaid orders
- **Comprehensive Testing** - Unit and integration tests

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Jest** - Testing framework

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time updates
- **React Testing Library** - Component testing

## 📁 Project Structure

```
college-canteen-ordering/
├── backend/                 # Node.js/Express API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Authentication & validation
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── socket/            # Socket.io handlers
│   ├── tests/             # Backend tests
│   ├── utils/             # Utility functions
│   └── server.js          # Entry point
├── frontend-user/          # Student interface (React)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── test/          # Frontend tests
│   └── package.json
├── frontend-admin/         # Staff interface (React)
│   ├── src/
│   │   ├── components/    # Admin components
│   │   ├── context/       # Admin contexts
│   │   ├── pages/         # Admin pages
│   │   └── test/          # Admin tests
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/college-canteen-ordering.git
   cd college-canteen-ordering
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   
   # Start the server
   npm start
   ```

3. **Student Frontend Setup**
   ```bash
   cd frontend-user
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your API URL
   
   # Start development server
   npm run dev
   ```

4. **Admin Frontend Setup**
   ```bash
   cd frontend-admin
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your API URL
   
   # Start development server
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/college-canteen
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## 📱 Usage

### For Students
1. **Sign up** with name, email, WhatsApp number, and password
2. **Browse menu** and add items to cart
3. **Place order** with preferred payment method
4. **Track order** status in real-time
5. **View history** of past orders

### For Staff
1. **Login** with staff credentials
2. **Manage menu** - add, edit, delete items
3. **Set deals** - configure daily special offers
4. **Process orders** - view queue and update status
5. **Confirm payments** - handle offline payments
6. **Create manual orders** - place orders for customers

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### Frontend Tests
```bash
cd frontend-user
npm test                   # Run student app tests

cd frontend-admin
npm test                   # Run admin app tests
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred database
2. Configure environment variables for production
3. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend Deployment
1. Build the applications:
   ```bash
   cd frontend-user && npm run build
   cd frontend-admin && npm run build
   ```
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update CORS settings in backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Menu Endpoints
- `GET /api/menu` - Get available menu items
- `POST /api/menu` - Create menu item (staff only)
- `PUT /api/menu/:id` - Update menu item (staff only)
- `DELETE /api/menu/:id` - Delete menu item (staff only)

### Order Endpoints
- `POST /api/orders` - Place new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id/status` - Update order status (staff only)

### Staff Endpoints
- `GET /api/staff/orders` - Get order queue
- `POST /api/staff/manual-order` - Create manual order
- `GET /api/staff/pending-payments` - Get pending payments
- `PUT /api/staff/orders/:id/payment` - Confirm payment

## 🔧 Configuration

### Socket.io Events
- `join-order-room` - Join order-specific room
- `order-status-update` - Order status changed
- `new-order` - New order notification
- `payment-confirmed` - Payment confirmation

### User Roles
- **student** - Can place orders, view history
- **staff** - Full admin access, can manage everything

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world canteen management needs
- Thanks to the open-source community

## 📞 Support

For support, email your-email@example.com or create an issue in this repository.

---

**Happy Coding! 🚀**