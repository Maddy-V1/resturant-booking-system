# College Canteen Food Ordering - Student Frontend

A modern, responsive React application for students to order food from their college canteen. Built with React, Tailwind CSS, and modern UI/UX principles.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login/signup system
- **Menu Browsing** - Browse food items with search and category filters
- **Shopping Cart** - Add items, modify quantities, and manage cart
- **Order Placement** - Place orders with pickup location selection
- **Order Tracking** - Real-time order status updates
- **Order History** - View past orders and receipts
- **User Profile** - Manage account information

### UI/UX Features
- **Modern Design** - Clean, card-based interface with soft shadows
- **Responsive Layout** - Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations** - Hover effects, transitions, and micro-interactions
- **Toast Notifications** - Real-time feedback for user actions
- **Loading States** - Skeleton loaders and loading indicators
- **Accessibility** - WCAG compliant design

## 🛠 Tech Stack

- **React 18** - Modern React with hooks and functional components
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication
- **Vite** - Fast build tool and dev server

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable UI components
│   ├── menu/           # Menu-related components
│   ├── cart/           # Shopping cart components
│   ├── orders/         # Order management components
│   └── account/        # User account components
├── context/            # React Context providers
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── test/               # Test files
```

## 🎨 Design System

### Colors
- **Primary**: `#0066FF` (Blue)
- **Accent**: `#FF5722` (Orange)
- **Background**: `#FAFAFA` (Light Gray)
- **Success**: Green variants
- **Error**: Red variants
- **Warning**: Yellow variants

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Components
- **Cards**: `rounded-2xl`, `shadow-md`, hover effects
- **Buttons**: `rounded-full`, gradient backgrounds
- **Inputs**: `rounded-xl`, focus states
- **Badges**: `rounded-full`, color-coded status

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend-user
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 📱 Pages & Components

### 1. Navigation (Navbar)
- Sticky navigation with logo
- Menu items: Home, Menu, Cart, My Orders, Account
- User profile with welcome message
- Mobile-responsive hamburger menu
- Cart badge with item count

### 2. Menu Page
- Grid layout of food cards
- Search functionality
- Category filtering
- Deal badges and discount labels
- Quantity selectors
- Add to cart functionality

### 3. Cart Page
- List of selected items
- Quantity controls
- Remove item functionality
- Pickup location selection
- Price breakdown (subtotal, GST, total)
- Checkout functionality

### 4. Orders Page
- Order history with status badges
- Filter by order status
- Order details and receipts
- Real-time status updates

### 5. Account Page
- User profile information
- Account statistics
- Recent orders summary
- Quick action buttons

## 🧩 Key Components

### MenuItemCard
- Product image with hover effects
- Deal and discount badges
- Quantity selector
- Add to cart button
- Availability status

### CartItemCard
- Item details with image
- Quantity controls
- Remove functionality
- Price calculations

### OrderCard
- Order summary
- Status badge
- Pickup information
- Action buttons

### StatusBadge
- Color-coded order statuses
- Icons for visual clarity
- Multiple sizes

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### Tailwind Configuration
Custom colors, fonts, and animations are configured in `tailwind.config.js`.

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🏗 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Performance Optimizations

- **Code Splitting** - Route-based code splitting
- **Lazy Loading** - Components loaded on demand
- **Image Optimization** - Responsive images with proper sizing
- **Bundle Analysis** - Webpack bundle analyzer integration
- **Caching** - Service worker for offline functionality

## 🔒 Security Features

- **Input Validation** - Client-side form validation
- **XSS Protection** - Sanitized user inputs
- **CSRF Protection** - Token-based authentication
- **Secure Storage** - Encrypted local storage for sensitive data

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ for college students by the development team.