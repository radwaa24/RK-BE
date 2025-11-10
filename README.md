# RK E-commerce Backend API

A comprehensive Node.js/Express backend API for an e-commerce platform with MongoDB integration.

## Features

- ✅ User Authentication (JWT-based)
- ✅ Product Management (CRUD operations)
- ✅ Order Management (CRUD operations)
- ✅ Shopping Cart functionality
- ✅ Category Management
- ✅ User Management
- ✅ Role-based Access Control (Admin/User)
- ✅ Input Validation
- ✅ Error Handling
- ✅ MongoDB Integration with Mongoose

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **dotenv** - Environment variables

## Installation

1. Clone the repository or navigate to the backend directory:
```bash
cd rk/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rk-ecommerce

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Products
- `GET /api/products` - Get all products (with filtering, pagination, search)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders
- `GET /api/orders` - Get all orders (User's orders or all for Admin)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order (Protected)
- `PUT /api/orders/:id/status` - Update order status (Admin only)
- `DELETE /api/orders/:id` - Cancel/Delete order

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Cart
- `GET /api/cart` - Get user's cart (Protected)
- `POST /api/cart` - Add item to cart (Protected)
- `PUT /api/cart/:itemId` - Update cart item quantity (Protected)
- `DELETE /api/cart/:itemId` - Remove item from cart (Protected)
- `DELETE /api/cart` - Clear cart (Protected)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete/Deactivate user

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Example Requests

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Product (Admin)
```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "category_id",
  "stock": 100,
  "images": ["url1", "url2"]
}
```

### Create Order
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "paymentMethod": "credit_card",
  "tax": 10,
  "shipping": 5
}
```

## Project Structure

```
backend/
├── models/          # Mongoose models
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Category.js
│   └── Cart.js
├── routes/          # API routes
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   ├── categories.js
│   ├── cart.js
│   └── users.js
├── middleware/      # Custom middleware
│   ├── auth.js
│   └── errorHandler.js
├── utils/           # Utility functions
│   └── generateToken.js
├── server.js        # Main server file
├── package.json
└── README.md
```

## Database Models

### User
- name, email, password, role, phone, address, isActive

### Product
- name, description, price, category, images, stock, tags, isActive, isFeatured, rating

### Order
- user, orderNumber, items, subtotal, tax, shipping, total, shippingAddress, paymentMethod, status

### Category
- name, description, slug, image, isActive

### Cart
- user, items, total

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- CORS configuration

## Development

The project uses nodemon for automatic server restarts during development:

```bash
npm run dev
```

## Production

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper MongoDB connection string
4. Set up proper CORS origins
5. Use process manager like PM2

## License

ISC

