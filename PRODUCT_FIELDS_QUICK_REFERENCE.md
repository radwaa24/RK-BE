# 📦 Product Schema Fields - Quick Reference

## Field Usage Map

| Field              | Required?  | Used In                                    | Safe to Delete?             |
| ------------------ | ---------- | ------------------------------------------ | --------------------------- |
| **name**           | ✅ Yes     | Validation, Orders, Search Index           | ❌ NO - Critical            |
| **description**    | ✅ Yes     | Validation, Search Index                   | ❌ NO - Critical            |
| **price**          | ✅ Yes     | Validation, Filters, Orders, Cart          | ❌ NO - Critical            |
| **category**       | ✅ Yes     | Validation, Filters, Populate              | ❌ NO - Critical            |
| **stock**          | ✅ Yes     | Validation, Orders, Cart (multiple places) | ❌ NO - Critical            |
| **isActive**       | ⚠️ Default | Filters, Soft Delete, Cart Check           | ❌ NO - Important           |
| **images**         | ❌ No      | Populate (Orders, Cart)                    | ⚠️ YES - But breaks UI      |
| **tags**           | ❌ No      | Search Index                               | ⚠️ YES - But reduces search |
| **isFeatured**     | ⚠️ Default | Filters                                    | ⚠️ YES - But breaks filter  |
| **compareAtPrice** | ❌ No      | Nowhere                                    | ✅ YES - Completely safe    |
| **sku**            | ❌ No      | Nowhere                                    | ✅ YES - Completely safe    |
| **weight**         | ❌ No      | Nowhere                                    | ✅ YES - Completely safe    |
| **dimensions**     | ❌ No      | Nowhere                                    | ✅ YES - Completely safe    |
| **rating**         | ❌ No      | Nowhere                                    | ✅ YES - Completely safe    |

---

## 🎯 Where Each Field is Used

### **name**

```
✅ routes/products.js:105  → Validation
✅ routes/orders.js:114    → Saved in order
✅ models/Product.js:80    → Search index
✅ All populate queries    → 'name images', 'name price images'
```

### **description**

```
✅ routes/products.js:106  → Validation
✅ models/Product.js:80   → Search index
```

### **price**

```
✅ routes/products.js:107  → Validation
✅ routes/products.js:37  → Price filtering
✅ routes/orders.js:116   → Order calculation
✅ routes/cart.js:101     → Cart items
✅ All populate queries    → 'name price images stock'
```

### **category**

```
✅ routes/products.js:108 → Validation
✅ routes/products.js:28  → Category filtering
✅ routes/products.js:51  → Populate queries
```

### **stock**

```
✅ routes/products.js:109 → Validation
✅ routes/orders.js:105   → Stock check
✅ routes/orders.js:121   → Stock decrement
✅ routes/orders.js:225   → Stock restore
✅ routes/cart.js:67      → Stock check (add)
✅ routes/cart.js:89      → Stock check (update)
✅ routes/cart.js:152     → Stock check (update item)
✅ All populate queries    → 'name price images stock'
```

### **isActive**

```
✅ routes/products.js:26  → Default filter
✅ routes/products.js:179 → Soft delete
✅ routes/cart.js:60      → Active check
```

### **images**

```
✅ routes/orders.js:19     → Populate
✅ routes/orders.js:42     → Populate
✅ routes/orders.js:141    → Populate
✅ routes/cart.js:15      → Populate (4 places)
```

### **tags**

```
✅ models/Product.js:80   → Search index
```

### **isFeatured**

```
✅ routes/products.js:18  → Query validation
✅ routes/products.js:32 → Filter
```

---

## 🗑️ Deletion Impact Summary

### ✅ **Zero Impact** (Safe to Delete):

- `compareAtPrice`
- `sku`
- `weight`
- `dimensions`
- `rating`

**Action:** Just remove from schema, nothing else needed.

---

### ⚠️ **Low Impact** (Delete but update code):

- `images` → Remove from 7 populate queries
- `tags` → Remove from search index
- `isFeatured` → Remove filter logic

**Action:** Remove from schema + update populate/filter code.

---

### ❌ **High Impact** (DO NOT DELETE):

- `name` → Used in 5+ places
- `description` → Required + search
- `price` → Required + orders + cart
- `category` → Required + filtering
- `stock` → Required + inventory
- `isActive` → Filtering + soft delete

**Action:** DO NOT DELETE - Critical for app functionality.

---

## 📝 Quick Deletion Guide

### For Safe Fields (compareAtPrice, sku, etc.):

1. Delete from `models/Product.js`
2. Done! ✅

### For Used Fields (images, tags, isFeatured):

1. Delete from `models/Product.js`
2. Search codebase: `grep -r "fieldName" .`
3. Remove from all found locations
4. Test endpoints

### For Critical Fields:

**DON'T DELETE** - App will break! ❌

---

## 🔍 Search Commands

```bash
# Find all uses of a field
grep -r "compareAtPrice" .
grep -r "\.images" .
grep -r "isFeatured" .

# Find in populate queries
grep -r "populate.*images" .

# Find in validation
grep -r "body('images')" .
```

---

**See `PRODUCT_SCHEMA_GUIDE.md` for detailed explanations!**
