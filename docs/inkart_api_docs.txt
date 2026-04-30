# InkArt API Documentation

Document version: 1.0.0  
Last updated: 2026-03-19  
Base URL (local): `http://localhost:5000`  
API prefix: `/api/v1`

## 1. Overview
InkArt API provides:
- User authentication
- User profile and address management
- Public product catalog
- User cart operations
- Admin authentication
- Admin product management

This document covers **currently mounted routes** in `server.js`.

## 2. Conventions

### 2.1 Authentication
Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

### 2.2 Request Headers
Default:

```http
Content-Type: application/json
Accept: application/json
```

For upload endpoints:

```http
Content-Type: multipart/form-data
```

### 2.3 Response Envelope
Success:

```json
{
  "success": true,
  "message": "optional",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "status": "fail",
  "message": "Human readable error"
}
```

### 2.4 Common Status Codes
- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `429` Too Many Requests
- `500` Internal Server Error

## 3. Security and Limits
- Global limiter: `300 requests / 15 min` on `/api/*`
- Auth login limiter: `10 requests / 15 min`
- Middleware: `helmet`, `hpp`, `compression`, `cors`

## 4. Endpoint Index

| Module | Method | Path | Auth |
|---|---|---|---|
| Health | GET | `/` | No |
| Auth | POST | `/api/v1/auth/register` | No |
| Auth | POST | `/api/v1/auth/login` | No |
| Auth | POST | `/api/v1/auth/logout` | Yes |
| Auth | POST | `/api/v1/auth/refresh-token` | No |
| Auth | PATCH | `/api/v1/auth/change-password` | Yes |
| Profile | GET | `/api/v1/users/me` | Yes |
| Profile | PATCH | `/api/v1/users/me` | Yes |
| Profile | POST | `/api/v1/users/me/addresses` | Yes |
| Profile | PATCH | `/api/v1/users/me/addresses/:addressId` | Yes |
| Profile | DELETE | `/api/v1/users/me/addresses/:addressId` | Yes |
| Profile | GET | `/api/v1/users/me/orders` | Yes |
| Products | GET | `/api/v1/products` | No |
| Products | GET | `/api/v1/products/categories` | No |
| Products | GET | `/api/v1/products/:id` | No |
| Products | GET | `/api/v1/products/:id/variants` | No |
| Cart | GET | `/api/v1/cart` | Yes |
| Cart | POST | `/api/v1/cart/items` | Yes |
| Cart | PATCH | `/api/v1/cart/items/:itemId` | Yes |
| Cart | DELETE | `/api/v1/cart/items/:itemId` | Yes |
| Cart | DELETE | `/api/v1/cart` | Yes |
| Admin Auth | POST | `/api/v1/admin/auth/login` | No |
| Admin Products | GET | `/api/v1/admin/products` | Admin/Superadmin |
| Admin Products | POST | `/api/v1/admin/products` | Admin/Superadmin |
| Admin Products | GET | `/api/v1/admin/products/:id` | Admin/Superadmin |
| Admin Products | PATCH | `/api/v1/admin/products/:id` | Admin/Superadmin |
| Admin Products | DELETE | `/api/v1/admin/products/:id` | Admin/Superadmin |
| Admin Products | DELETE | `/api/v1/admin/products/:id/images/:publicId` | Admin/Superadmin |
| Admin Products | PATCH | `/api/v1/admin/products/:id/stock` | Admin/Superadmin |

## 5. Detailed API Reference

## 5.1 Health

### GET `/`
Service health check.

Response `200`:
```json
{
  "success": true,
  "message": "InkArt API is running",
  "environment": "development"
}
```

---

## 5.2 Auth
Base path: `/api/v1/auth`

### POST `/register`
Create user and return access + refresh token.

Payload:
```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "secret123",
  "phone": "9876543210"
}
```

cURL:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Sharma","email":"aarav@example.com","password":"secret123","phone":"9876543210"}'
```

Response `201`:
```json
{
  "success": true,
  "token": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "data": {
    "user": {
      "_id": "65f000000000000000000001",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "phone": "9876543210",
      "role": "user"
    }
  }
}
```

### POST `/login`
Payload:
```json
{
  "email": "aarav@example.com",
  "password": "secret123"
}
```

Response `200`:
```json
{
  "success": true,
  "token": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "data": {
    "user": {
      "_id": "65f000000000000000000001",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "role": "user"
    }
  }
}
```

### POST `/logout` (Protected)
Response `200`:
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### POST `/refresh-token`
Payload:
```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

Response `200`:
```json
{
  "success": true,
  "token": "<new_jwt_access_token>"
}
```

### PATCH `/change-password` (Protected)
Payload:
```json
{
  "currentPassword": "secret123",
  "newPassword": "newSecret123"
}
```

Response `200`:
```json
{
  "success": true,
  "token": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "data": {
    "user": {
      "_id": "65f000000000000000000001",
      "email": "aarav@example.com"
    }
  }
}
```

---

## 5.3 User Profile
Base path: `/api/v1/users`

### GET `/me` (Protected)
Response `200`:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65f000000000000000000001",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "addresses": []
    }
  }
}
```

### PATCH `/me` (Protected, multipart)
Form fields:
- `name` (optional)
- `phone` (optional)
- `avatar` (file, optional)

### POST `/me/addresses` (Protected)
Payload:
```json
{
  "label": "Home",
  "fullName": "Aarav Sharma",
  "phone": "9876543210",
  "line1": "221B MG Road",
  "line2": "Near Metro",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "country": "India",
  "isDefault": true
}
```

### PATCH `/me/addresses/:addressId` (Protected)
Payload:
```json
{
  "city": "Mysuru",
  "isDefault": true
}
```

### DELETE `/me/addresses/:addressId` (Protected)
Response `200`:
```json
{
  "success": true,
  "data": {
    "addresses": []
  }
}
```

### GET `/me/orders?page=1&limit=10` (Protected)
Response `200`:
```json
{
  "success": true,
  "results": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "data": {
    "orders": [
      {
        "_id": "65f000000000000000000201",
        "orderNumber": "ORD-202603-00001",
        "total": 899
      }
    ]
  }
}
```

---

## 5.4 Products (Public)
Base path: `/api/v1/products`

### GET `/`
Query params:
- `category=<categoryId>`
- `productType=stocked|on_demand`
- `inStock=true`
- `minPrice=100`
- `maxPrice=1000`
- `tags=gift,festival`
- `search=keyword`
- `sort=price_asc|price_desc|rating|newest|popular`
- `page=1`
- `limit=20`

Response `200`:
```json
{
  "success": true,
  "results": 2,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  },
  "data": {
    "products": [
      {
        "_id": "65f000000000000000000301",
        "name": "Classic T-Shirt",
        "basePrice": 499,
        "discountedPrice": 399,
        "productType": "stocked",
        "isActive": true
      }
    ]
  }
}
```

### GET `/categories`
Fetch active top-level categories.

### GET `/:id`
Get single product by MongoDB `_id` or slug.

### GET `/:id/variants`
Response `200`:
```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "_id": "65f000000000000000000401",
        "name": "Size",
        "value": "L",
        "priceModifier": 50,
        "stock": 12
      }
    ],
    "productType": "stocked"
  }
}
```

---

## 5.5 Cart
Base path: `/api/v1/cart` (all protected)

### GET `/`
Fetch cart for current user.

### POST `/items`
Payload:
```json
{
  "productId": "65f000000000000000000301",
  "quantity": 2,
  "variantId": "65f000000000000000000401",
  "customizationId": null
}
```

### PATCH `/items/:itemId`
Payload:
```json
{
  "quantity": 3
}
```

### DELETE `/items/:itemId`
Response `200`:
```json
{
  "success": true,
  "message": "Item removed from cart."
}
```

### DELETE `/`
Response `200`:
```json
{
  "success": true,
  "message": "Cart cleared."
}
```

---

## 5.6 Admin Auth
Base path: `/api/v1/admin/auth`

### POST `/login`
Payload:
```json
{
  "email": "admin@example.com",
  "password": "adminPass123"
}
```

Response `200`:
```json
{
  "success": true,
  "token": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "data": {
    "user": {
      "_id": "65f000000000000000000601",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

---

## 5.7 Admin Products
Base path: `/api/v1/admin/products`

All endpoints require admin or superadmin token.

### GET `/`
List products for admin panel.

### POST `/` (multipart)
Create product with `images` (max 10 files).

Typical fields:
- `name` (required)
- `category` (required)
- `productType` (`stocked|on_demand`)
- `basePrice` (required)
- `discountedPrice`, `stock`, `description`, `shortDescription`, `tags`

### GET `/:id`
Get product details.

### PATCH `/:id` (multipart)
Update product and optionally append image files.

### DELETE `/:id`
Soft delete (sets `isActive=false`).

### DELETE `/:id/images/:publicId`
Delete one image from the product.

### PATCH `/:id/stock`
Payload examples:

Set absolute stock:
```json
{
  "quantity": 25,
  "operation": "set"
}
```

Add stock:
```json
{
  "quantity": 10,
  "operation": "add"
}
```

Subtract stock:
```json
{
  "quantity": 3,
  "operation": "subtract"
}
```

Variant stock update:
```json
{
  "variantId": "65f000000000000000000401",
  "quantity": 10,
  "operation": "add"
}
```

---

## 6. Notes
- Currency values are treated as INR in this project.
- IDs in examples are sample values.
- Additional modules exist in the codebase but are currently not mounted.
