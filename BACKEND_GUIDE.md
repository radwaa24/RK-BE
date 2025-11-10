# 🚀 Complete Backend Structure Guide

## 📁 Project Structure Overview

```
backend/
├── server.js              # Main entry point - starts the server
├── package.json           # Project dependencies and scripts
├── .env                   # Environment variables (create from env.example)
├── env.example            # Template for environment variables
│
├── models/                # Database schemas (MongoDB collections)
│   ├── User.js           # User model (customers & admins)
│   ├── Product.js        # Product model (items for sale)
│   ├── Order.js          # Order model (customer purchases)
│   ├── Category.js       # Category model (product categories)
│   └── Cart.js           # Cart model (shopping cart)
│
├── routes/                # API endpoints (URL paths)
│   ├── auth.js           # Authentication routes (login, register)
│   ├── products.js       # Product CRUD operations
│   ├── orders.js         # Order management
│   ├── categories.js     # Category management
│   ├── cart.js           # Shopping cart operations
│   └── users.js          # User management
│
├── middleware/            # Functions that run before routes
│   ├── auth.js           # Authentication & authorization checks
│   └── errorHandler.js   # Global error handling
│
└── utils/                 # Helper functions
    └── generateToken.js  # JWT token generation
```

---

## 📂 Step-by-Step Folder Explanation

### 1. **`server.js`** - The Main Entry Point

**What it does:**

- Starts the Express server
- Connects to MongoDB database
- Sets up middleware (CORS, JSON parsing)
- Registers all API routes
- Handles errors globally

**Key Components:**

```javascript
// Sets up CORS (allows frontend to call backend)
app.use(cors({ origin: "http://localhost:3000" }));

// Parses JSON request bodies
app.use(express.json());

// Registers routes
app.use("/api/auth", authRoutes); // Authentication endpoints
app.use("/api/products", productRoutes); // Product endpoints
// ... etc
```

**How it works:**

1. Loads environment variables from `.env` file
2. Connects to MongoDB database
3. Starts listening on port 5000 (or PORT from .env)
4. All API requests go through this file first

---

### 2. **`models/`** - Database Schemas

**What it does:**

- Defines the structure of data stored in MongoDB
- Each model = one collection in the database
- Defines what fields are required, their types, and validation rules

#### **`models/User.js`**

- Stores user information (name, email, password, role)
- Automatically hashes passwords before saving
- Has methods like `comparePassword()` for login

**Fields:**

- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password (never stored in plain text)
- `role` - Either 'user' or 'admin'
- `phone` - Optional phone number
- `address` - Optional shipping address
- `isActive` - Whether account is active

#### **`models/Product.js`**

- Stores product information

**Fields:**

- `name` - Product name
- `description` - Product description
- `price` - Product price
- `category` - Reference to Category model
- `stock` - Available quantity
- `images` - Array of image URLs
- `isFeatured` - Whether product is featured
- `rating` - Average rating and count

#### **`models/Order.js`**

- Stores order information

**Fields:**

- `user` - Reference to User who placed order
- `items` - Array of products ordered
- `total` - Total price
- `status` - Order status (pending, processing, shipped, etc.)
- `shippingAddress` - Delivery address

#### **`models/Category.js`**

- Stores product categories

**Fields:**

- `name` - Category name
- `description` - Category description
- `slug` - URL-friendly name
- `isActive` - Whether category is active

#### **`models/Cart.js`**

- Stores shopping cart items

**Fields:**

- `user` - Reference to User
- `items` - Array of products in cart
- `total` - Total cart value

---

### 3. **`routes/`** - API Endpoints

**What it does:**

- Defines all the API endpoints (URLs) your frontend can call
- Each file handles requests for a specific resource
- Contains the business logic for each endpoint

#### **`routes/auth.js`** - Authentication

**Endpoints:**

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current logged-in user (Protected)

**How it works:**

1. Validates input data
2. Checks if user exists
3. Hashes password (for register)
4. Generates JWT token
5. Returns token and user info

#### **`routes/products.js`** - Product Management

**Endpoints:**

- `GET /api/products` - Get all products (with filters, search, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

#### **`routes/orders.js`** - Order Management

**Endpoints:**

- `GET /api/orders` - Get all orders (user's orders or all for admin)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order (Protected)
- `PUT /api/orders/:id/status` - Update order status (Admin only)
- `DELETE /api/orders/:id` - Cancel order

#### **`routes/categories.js`** - Category Management

**Endpoints:**

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

#### **`routes/cart.js`** - Shopping Cart

**Endpoints:**

- `GET /api/cart` - Get user's cart (Protected)
- `POST /api/cart` - Add item to cart (Protected)
- `PUT /api/cart/:itemId` - Update cart item quantity (Protected)
- `DELETE /api/cart/:itemId` - Remove item from cart (Protected)
- `DELETE /api/cart` - Clear entire cart (Protected)

#### **`routes/users.js`** - User Management

**Endpoints:**

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete/deactivate user

---

### 4. **`middleware/`** - Request Interceptors

**What it does:**

- Functions that run BEFORE your route handlers
- Used for authentication, validation, error handling

#### **`middleware/auth.js`**

**`protect` middleware:**

- Checks if user is logged in
- Verifies JWT token from Authorization header
- Attaches user info to `req.user`
- Used on routes marked as "Protected"

**`authorize` middleware:**

- Checks if user has required role (admin, user, etc.)
- Used to restrict routes to admins only

**How it works:**

```javascript
// In a route file:
router.get("/protected-route", protect, async (req, res) => {
  // req.user is now available (from protect middleware)
  // User is guaranteed to be authenticated
});

router.post("/admin-route", protect, authorize("admin"), async (req, res) => {
  // User is authenticated AND is an admin
});
```

#### **`middleware/errorHandler.js`**

- Catches all errors from routes
- Formats error responses consistently
- Must be last middleware in server.js

---

### 5. **`utils/`** - Helper Functions

#### **`utils/generateToken.js`**

- Creates JWT (JSON Web Token) for authentication
- Token contains user ID
- Token expires after 7 days (configurable)

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create `.env` File

Copy `env.example` to `.env` and fill in your values:

```bash
# Windows PowerShell
Copy-Item env.example .env

# Or manually create .env file with:
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start the Server

```bash
# Development mode (auto-restarts on changes)
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

---

## 🌐 How to Call APIs

### Base URL

```
http://localhost:5000/api
```

### Authentication Flow

#### 1. Register a New User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Save the `token` - you'll need it for protected routes!**

#### 2. Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as register (returns token)

#### 3. Get Current User (Protected Route)

```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Product APIs

#### Get All Products

```bash
GET http://localhost:5000/api/products
```

**With Filters:**

```bash
GET http://localhost:5000/api/products?category=CATEGORY_ID&minPrice=10&maxPrice=100&search=laptop&page=1&limit=10
```

#### Get Single Product

```bash
GET http://localhost:5000/api/products/PRODUCT_ID
```

#### Create Product (Admin Only)

```bash
POST http://localhost:5000/api/products
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "category": "CATEGORY_ID",
  "stock": 50,
  "images": ["https://example.com/image1.jpg"]
}
```

#### Update Product (Admin Only)

```bash
PUT http://localhost:5000/api/products/PRODUCT_ID
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "price": 899.99,
  "stock": 45
}
```

#### Delete Product (Admin Only)

```bash
DELETE http://localhost:5000/api/products/PRODUCT_ID
Authorization: Bearer ADMIN_TOKEN
```

---

### Cart APIs (All Protected)

#### Get User's Cart

```bash
GET http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN
```

#### Add Item to Cart

```bash
POST http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "product": "PRODUCT_ID",
  "quantity": 2
}
```

#### Update Cart Item Quantity

```bash
PUT http://localhost:5000/api/cart/ITEM_ID
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "quantity": 5
}
```

#### Remove Item from Cart

```bash
DELETE http://localhost:5000/api/cart/ITEM_ID
Authorization: Bearer YOUR_TOKEN
```

#### Clear Entire Cart

```bash
DELETE http://localhost:5000/api/cart
Authorization: Bearer YOUR_TOKEN
```

---

### Order APIs

#### Create Order (Protected)

```bash
POST http://localhost:5000/api/orders
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "product": "PRODUCT_ID",
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
  "paymentMethod": "credit_card"
}
```

#### Get User's Orders

```bash
GET http://localhost:5000/api/orders
Authorization: Bearer YOUR_TOKEN
```

---

## 🧪 How to Test APIs

### Method 1: Using Postman (Recommended)

1. **Download Postman:** https://www.postman.com/downloads/

2. **Create a Collection:**

   - Click "New" → "Collection"
   - Name it "RK E-commerce API"

3. **Test Register Endpoint:**

   - Click "Add Request"
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/register`
   - Go to "Body" tab → Select "raw" → Select "JSON"
   - Paste:
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Click "Send"
   - **Copy the token from response!**

4. **Test Protected Route:**

   - Create new request: `GET http://localhost:5000/api/auth/me`
   - Go to "Authorization" tab
   - Type: "Bearer Token"
   - Paste your token
   - Click "Send"

5. **Save Token as Variable:**
   - In Postman, create an environment
   - Add variable: `token`
   - In register/login response, use "Tests" tab:
     ```javascript
     pm.environment.set("token", pm.response.json().token);
     ```
   - Then use `{{token}}` in Authorization header

---

### Method 2: Using cURL (Command Line)

#### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

#### Get Products

```bash
curl http://localhost:5000/api/products
```

#### Get Protected Route (with token)

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Method 3: Using JavaScript (Fetch API)

```javascript
// Register
const register = async () => {
  const response = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    }),
  });

  const data = await response.json();
  console.log("Token:", data.token);
  return data.token;
};

// Get Products
const getProducts = async () => {
  const response = await fetch("http://localhost:5000/api/products");
  const data = await response.json();
  console.log("Products:", data);
};

// Protected Route
const getMe = async (token) => {
  const response = await fetch("http://localhost:5000/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log("User:", data);
};
```

---

### Method 4: Using Thunder Client (VS Code Extension)

1. Install "Thunder Client" extension in VS Code
2. Click Thunder Client icon in sidebar
3. Create new request
4. Set method, URL, headers, body
5. Click "Send"

---

## 🔐 Understanding Authentication

### How JWT Works:

1. **User logs in** → Server validates credentials
2. **Server generates JWT token** → Contains user ID
3. **Client saves token** → Usually in localStorage or cookies
4. **Client sends token** → In `Authorization: Bearer TOKEN` header
5. **Server validates token** → `protect` middleware checks token
6. **Server attaches user** → `req.user` contains user info

### Token Format:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1...xyz
```

### Protected vs Public Routes:

**Public Routes (No token needed):**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/categories`

**Protected Routes (Token required):**

- `GET /api/auth/me`
- `GET /api/cart`
- `POST /api/cart`
- `POST /api/orders`
- `GET /api/orders`

**Admin Only Routes (Token + Admin role required):**

- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/categories`
- `GET /api/users`

---

## 📊 Request/Response Flow

```
1. Client sends request
   ↓
2. Express receives request
   ↓
3. Middleware runs (CORS, JSON parsing)
   ↓
4. Route handler executes
   ↓
5. If protected route → auth middleware checks token
   ↓
6. Business logic runs (database queries, etc.)
   ↓
7. Response sent back to client
   ↓
8. If error → errorHandler middleware catches it
```

---

## 🐛 Common Issues & Solutions

### Issue: "MONGODB_URI is not defined"

**Solution:** Create `.env` file with `MONGODB_URI` variable

### Issue: "Not authorized to access this route"

**Solution:**

- Make sure you're sending token in Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Token might be expired (default: 7 days)

### Issue: "User role 'user' is not authorized"

**Solution:** You need admin role. Either:

- Manually change role in database
- Register as admin (if allowed)
- Use an admin account

### Issue: "Cannot GET /api/..."

**Solution:**

- Make sure server is running (`npm run dev`)
- Check if route exists in routes folder
- Verify route is registered in server.js

### Issue: CORS errors

**Solution:**

- Check `FRONTEND_URL` in `.env` matches your frontend URL
- Or set `FRONTEND_URL=*` for development (not recommended for production)

---

## 📝 Quick Reference

### Health Check

```bash
GET http://localhost:5000/api/health
```

### All Endpoints Summary

**Auth:**

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (Protected)

**Products:**

- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create (Admin)
- `PUT /api/products/:id` - Update (Admin)
- `DELETE /api/products/:id` - Delete (Admin)

**Cart:**

- `GET /api/cart` - Get cart (Protected)
- `POST /api/cart` - Add item (Protected)
- `PUT /api/cart/:itemId` - Update item (Protected)
- `DELETE /api/cart/:itemId` - Remove item (Protected)
- `DELETE /api/cart` - Clear cart (Protected)

**Orders:**

- `GET /api/orders` - List orders (Protected)
- `GET /api/orders/:id` - Get order (Protected)
- `POST /api/orders` - Create order (Protected)
- `PUT /api/orders/:id/status` - Update status (Admin)
- `DELETE /api/orders/:id` - Cancel order (Protected)

**Categories:**

- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category
- `POST /api/categories` - Create (Admin)
- `PUT /api/categories/:id` - Update (Admin)
- `DELETE /api/categories/:id` - Delete (Admin)

**Users:**

- `GET /api/users` - List users (Admin)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

---

## 🎯 Next Steps

1. **Test all endpoints** using Postman or Thunder Client
2. **Create an admin user** (manually in database or via code)
3. **Test protected routes** with authentication
4. **Connect your frontend** to these APIs
5. **Add more features** as needed

---

## 💡 Tips

- Always check the server console for errors
- Use `npm run dev` for development (auto-restarts)
- Keep your `.env` file secure (never commit it)
- Test endpoints in this order: Register → Login → Protected routes
- Use Postman Collections to organize your API tests
- Check MongoDB to see if data is being saved correctly

---

**Happy Coding! 🚀**
