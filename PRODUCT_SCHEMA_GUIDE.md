# 📦 Product Schema Field Guide

## Complete Field Breakdown

### **Required Fields** (Cannot be deleted without breaking the app)

#### 1. **`name`** - Product Name
```javascript
name: {
  type: String,
  required: [true, 'Product name is required'],
  trim: true
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 105: Validation (required)
- ✅ `routes/orders.js` - Line 114: Saved in order items
- ✅ `routes/orders.js` - Line 108: Error message
- ✅ `models/Product.js` - Line 80: Text search index
- ✅ Used in populate queries: `'name images'`, `'name price images'`

**If you delete:** 
- ❌ Product creation will fail (validation error)
- ❌ Orders won't have product names
- ❌ Search functionality will break (text index)

---

#### 2. **`description`** - Product Description
```javascript
description: {
  type: String,
  required: [true, 'Product description is required']
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 106: Validation (required)
- ✅ `models/Product.js` - Line 80: Text search index

**If you delete:**
- ❌ Product creation will fail (validation error)
- ❌ Search won't work for descriptions

---

#### 3. **`price`** - Product Price
```javascript
price: {
  type: Number,
  required: [true, 'Product price is required'],
  min: [0, 'Price must be positive']
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 107: Validation
- ✅ `routes/products.js` - Line 37-39: Price filtering (minPrice, maxPrice)
- ✅ `routes/orders.js` - Line 116: Used in order calculation
- ✅ `routes/orders.js` - Line 117: Order total calculation
- ✅ `routes/cart.js` - Line 15: Populated in cart (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 101: Saved in cart items
- ✅ `routes/cart.js` - Line 42: Populated in order items (`'name price images'`)

**If you delete:**
- ❌ Product creation will fail
- ❌ Price filtering won't work
- ❌ Orders can't calculate totals
- ❌ Cart can't show prices

---

#### 4. **`category`** - Product Category (Reference)
```javascript
category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: [true, 'Product category is required']
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 108: Validation (required)
- ✅ `routes/products.js` - Line 28-30: Category filtering
- ✅ `routes/products.js` - Line 51: Populated in queries (`'name slug'`)
- ✅ `routes/products.js` - Line 80: Populated (`'name slug description'`)
- ✅ `routes/products.js` - Line 143: Populated in update

**If you delete:**
- ❌ Product creation will fail
- ❌ Can't filter products by category
- ❌ Category relationships broken

---

#### 5. **`stock`** - Available Quantity
```javascript
stock: {
  type: Number,
  required: [true, 'Stock quantity is required'],
  min: [0, 'Stock cannot be negative'],
  default: 0
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 109: Validation
- ✅ `routes/orders.js` - Line 105: Stock check before order
- ✅ `routes/orders.js` - Line 121: Stock decremented on order
- ✅ `routes/orders.js` - Line 225: Stock restored on cancel
- ✅ `routes/cart.js` - Line 15: Populated (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 67: Stock check before adding to cart
- ✅ `routes/cart.js` - Line 89: Stock check when updating quantity
- ✅ `routes/cart.js` - Line 106: Populated (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 152: Stock check when updating cart item
- ✅ `routes/cart.js` - Line 162: Populated (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 191: Populated (`'name price images stock'`)

**If you delete:**
- ❌ Can't track inventory
- ❌ Orders can oversell products
- ❌ Cart can add out-of-stock items

---

#### 6. **`isActive`** - Product Availability
```javascript
isActive: {
  type: Boolean,
  default: true
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 26: Default filter (`isActive: true`)
- ✅ `routes/products.js` - Line 179: Soft delete (sets to false)
- ✅ `routes/cart.js` - Line 60: Check before adding to cart

**If you delete:**
- ❌ Can't hide/deactivate products
- ❌ Deleted products will show in listings
- ❌ Cart can add inactive products

---

### **Optional Fields** (Can be deleted more safely)

#### 7. **`compareAtPrice`** - Original/Compare Price
```javascript
compareAtPrice: {
  type: Number,
  min: [0, 'Compare at price must be positive']
}
```

**Where it's used:**
- ❌ **NOT USED ANYWHERE** - Safe to delete

**If you delete:**
- ✅ No impact - field is not referenced in code

---

#### 8. **`sku`** - Stock Keeping Unit
```javascript
sku: {
  type: String,
  unique: true,
  trim: true,
  sparse: true
}
```

**Where it's used:**
- ❌ **NOT USED ANYWHERE** - Safe to delete

**If you delete:**
- ✅ No impact - field is not referenced in code

---

#### 9. **`images`** - Product Images Array
```javascript
images: [{
  type: String
}]
```

**Where it's used:**
- ✅ `routes/orders.js` - Line 19: Populated (`'name images'`)
- ✅ `routes/orders.js` - Line 42: Populated (`'name images price'`)
- ✅ `routes/orders.js` - Line 141: Populated (`'name images'`)
- ✅ `routes/cart.js` - Line 15: Populated (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 106: Populated (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 162: Populated (`'name price images stock'`)
- ✅ `routes/cart.js` - Line 191: Populated (`'name price images stock'`)

**If you delete:**
- ⚠️ Frontend won't have product images
- ⚠️ Orders won't show product images
- ⚠️ Cart won't show product images
- ✅ Backend will still work, but UI will be broken

---

#### 10. **`weight`** - Product Weight
```javascript
weight: {
  type: Number,
  min: [0, 'Weight must be positive']
}
```

**Where it's used:**
- ❌ **NOT USED ANYWHERE** - Safe to delete

**If you delete:**
- ✅ No impact - field is not referenced in code

---

#### 11. **`dimensions`** - Product Dimensions
```javascript
dimensions: {
  length: Number,
  width: Number,
  height: Number
}
```

**Where it's used:**
- ❌ **NOT USED ANYWHERE** - Safe to delete

**If you delete:**
- ✅ No impact - field is not referenced in code

---

#### 12. **`tags`** - Product Tags Array
```javascript
tags: [{
  type: String,
  trim: true
}]
```

**Where it's used:**
- ✅ `models/Product.js` - Line 80: Text search index

**If you delete:**
- ⚠️ Search won't include tags
- ✅ Backend will still work, but search will be less effective

---

#### 13. **`isFeatured`** - Featured Product Flag
```javascript
isFeatured: {
  type: Boolean,
  default: false
}
```

**Where it's used:**
- ✅ `routes/products.js` - Line 18: Query validation
- ✅ `routes/products.js` - Line 32-34: Featured filter

**If you delete:**
- ⚠️ Can't filter featured products
- ✅ Backend will still work, but featured filter will break

---

#### 14. **`rating`** - Product Rating
```javascript
rating: {
  average: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  count: {
    type: Number,
    default: 0
  }
}
```

**Where it's used:**
- ❌ **NOT USED ANYWHERE** - Safe to delete

**If you delete:**
- ✅ No impact - field is not referenced in code

---

## 🗑️ How to Delete Fields Safely

### Step-by-Step Process:

#### 1. **Identify the Field**
   - Check if it's **required** or **optional**
   - Check where it's used (see above)

#### 2. **Remove from Schema** (`models/Product.js`)
   ```javascript
   // DELETE this field from productSchema
   compareAtPrice: { ... },  // ← Remove this
   ```

#### 3. **Remove from Validation** (`routes/products.js`)
   ```javascript
   // If field was validated, remove validation
   body('compareAtPrice').optional()...  // ← Remove this
   ```

#### 4. **Remove from Filters/Queries** (`routes/products.js`)
   ```javascript
   // If used in filtering, remove filter logic
   if (req.query.compareAtPrice) { ... }  // ← Remove this
   ```

#### 5. **Remove from Populate Queries**
   ```javascript
   // If field was in populate, remove it
   .populate('items.product', 'name price images compareAtPrice')
   // Change to:
   .populate('items.product', 'name price images')
   ```

#### 6. **Remove from Business Logic**
   - Check `routes/orders.js` for any references
   - Check `routes/cart.js` for any references
   - Remove any code that uses the field

#### 7. **Remove from Text Index** (`models/Product.js`)
   ```javascript
   // If field was in text search index
   productSchema.index({ name: 'text', description: 'text', tags: 'text', compareAtPrice: 'text' });
   // Remove the field from index
   productSchema.index({ name: 'text', description: 'text', tags: 'text' });
   ```

#### 8. **Update Documentation**
   - Update `BACKEND_GUIDE.md` if field was mentioned
   - Update API documentation

---

## 📋 Quick Reference: Safe to Delete

### ✅ **Completely Safe to Delete** (Not used anywhere):
- `compareAtPrice`
- `sku`
- `weight`
- `dimensions`
- `rating`

### ⚠️ **Delete with Caution** (Used but not critical):
- `images` - Used in populate, but backend works without it
- `tags` - Used in search index, but search still works
- `isFeatured` - Used in filtering, but can be removed

### ❌ **DO NOT DELETE** (Critical fields):
- `name` - Required, used everywhere
- `description` - Required, used in search
- `price` - Required, used in orders/cart
- `category` - Required, used in filtering
- `stock` - Required, used in inventory management
- `isActive` - Used in filtering and soft delete

---

## 🔍 Example: Deleting `compareAtPrice`

### Step 1: Remove from Schema
```javascript
// models/Product.js
const productSchema = new mongoose.Schema({
  name: { ... },
  description: { ... },
  price: { ... },
  // compareAtPrice: { ... },  ← DELETE THIS
  sku: { ... },
  // ... rest of fields
});
```

### Step 2: Check for Usage
- ✅ Not in validation
- ✅ Not in filters
- ✅ Not in populate
- ✅ Not in business logic

### Step 3: Done!
- No other changes needed
- Field can be safely removed

---

## 🔍 Example: Deleting `images` (More Complex)

### Step 1: Remove from Schema
```javascript
// models/Product.js
// images: [{ type: String }],  ← DELETE THIS
```

### Step 2: Update Populate Queries

**In `routes/orders.js`:**
```javascript
// Line 19: Change from
.populate('items.product', 'name images')
// To:
.populate('items.product', 'name')

// Line 42: Change from
.populate('items.product', 'name images price')
// To:
.populate('items.product', 'name price')

// Line 141: Change from
.populate('items.product', 'name images')
// To:
.populate('items.product', 'name')
```

**In `routes/cart.js`:**
```javascript
// Line 15, 106, 162, 191: Change from
.populate('items.product', 'name price images stock')
// To:
.populate('items.product', 'name price stock')
```

### Step 3: Done!
- All references removed
- Backend will work, but frontend won't have images

---

## 🛠️ Tools to Help You

### Search for Field Usage:
```bash
# Search for field name in codebase
grep -r "compareAtPrice" .
grep -r "images" .
grep -r "\.stock" .
```

### Check Validation:
```bash
# Search for validation rules
grep -r "body('compareAtPrice')" .
```

### Check Populate:
```bash
# Search for populate queries
grep -r "populate.*images" .
```

---

## ⚠️ Important Notes

1. **Database Migration**: If you delete a field that has existing data, the data will remain in the database but won't be accessible. Consider:
   - Running a migration to remove old data
   - Or just leave it (MongoDB won't complain)

2. **Frontend Impact**: Even if backend works, frontend might break if it expects certain fields

3. **API Documentation**: Update your API docs if you remove fields

4. **Testing**: Always test after removing fields:
   - Create a product
   - Add to cart
   - Create an order
   - Check all endpoints

---

## 📝 Summary Checklist

When deleting a field, check:
- [ ] Remove from schema (`models/Product.js`)
- [ ] Remove from validation (`routes/products.js`)
- [ ] Remove from filters/queries (`routes/products.js`)
- [ ] Remove from populate queries (all route files)
- [ ] Remove from business logic (`routes/orders.js`, `routes/cart.js`)
- [ ] Remove from text index (`models/Product.js`)
- [ ] Update documentation
- [ ] Test all endpoints
- [ ] Check frontend compatibility

---

**Need help deleting a specific field? Let me know which one and I'll provide exact code changes!** 🚀

