# InkArt API - Production API Documentation

Node.js/Express backend for e-commerce workflows: authentication, user profile, product catalog, cart, and admin product management.

## Table of Contents
- [Environment](#environment)
- [Run Locally](#run-locally)
- [Base URL and Versioning](#base-url-and-versioning)
- [Authentication](#authentication)
- [Standard Headers](#standard-headers)
- [Standard Response Envelope](#standard-response-envelope)
- [Error Handling](#error-handling)
- [Rate Limiting and Security](#rate-limiting-and-security)
- [API Endpoints](#api-endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [User Profile](#user-profile)
  - [Products (Public)](#products-public)
  - [Cart](#cart)
  - [Admin Auth](#admin-auth)
  - [Admin Products](#admin-products)
- [Data Notes](#data-notes)
- [Planned or Disabled Endpoints](#planned-or-disabled-endpoints)

## Environment
Create a `.env` file in project root:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/inkart
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## Run Locally
```bash
npm install
npm start
```

Server entry: `server.js`

## Base URL and Versioning
- Local base URL: `http://localhost:5000`
- API base path: `/api/v1`
- Full API base URL: `http://localhost:5000/api/v1`

## Authentication
This API uses JWT Bearer tokens.

1. Call register/login endpoint.
2. Read `token` from response.
3. Pass token in protected routes:

```http
Authorization: Bearer <access_token>
```

## Standard Headers
Use these by default unless endpoint says otherwise:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>   # required for protected endpoints only
```

For file uploads:

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

## Standard Response Envelope
Successful responses generally follow:

```json
{
  "success": true,
  "message": "Optional",
  "data": {}
}
```

Validation or operational errors generally follow:

```json
{
  "success": false,
  "status": "fail",
  "message": "Human readable error"
}
```

## Error Handling
Common status codes:
- `200` OK
- `201` Created
- `400` Bad request / validation error
- `401` Unauthorized
- `403` Forbidden
- `404` Not found
- `409` Conflict
- `429` Too many requests
- `500` Internal server error

## Rate Limiting and Security
- Global API rate limit on `/api/*`: 300 requests per 15 minutes per IP.
- Auth login route has stricter limiter: 10 attempts per 15 minutes.
- Helmet, HPP, compression, and CORS are enabled.

## API Endpoints

### Health

#### `GET /`
Health check for service availability.

Response:
```json
{
  "success": true,
  "message": "InkArt API is running",
  "environment": "development"
}
```

---

### Auth
Base path: `/api/v1/auth`

#### `POST /register`
Create a user account.

Headers:
```http
Content-Type: application/json
```

Payload:
```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "secret123",
  "phone": "9876543210"
}
```

Success response (`201`):
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

#### `POST /login`
Login with email and password.

Headers:
```http
Content-Type: application/json
```

Payload:
```json
{
  "email": "aarav@example.com",
  "password": "secret123"
}
```

Success response (`200`):
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

#### `POST /logout` (Protected)
Invalidate session on server side.

Headers:
```http
Authorization: Bearer <token>
```

Success response (`200`):
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

#### `POST /refresh-token`
Issue a fresh access token.

Headers:
```http
Content-Type: application/json
```

Payload:
```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

Success response (`200`):
```json
{
  "success": true,
  "token": "<new_jwt_access_token>"
}
```

#### `PATCH /change-password` (Protected)
Change user password.

Headers:
```http
Content-Type: application/json
Authorization: Bearer <token>
```

Payload:
```json
{
  "currentPassword": "secret123",
  "newPassword": "newSecret123"
}
```

Success response (`200`):
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

### User Profile
Base path: `/api/v1/users`

#### `GET /me` (Protected)
Get current user profile.

Headers:
```http
Authorization: Bearer <token>
```

Success response (`200`):
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

#### `PATCH /me` (Protected, multipart)
Update name/phone/avatar.

Headers:
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form fields:
- `name` (optional)
- `phone` (optional)
- `avatar` (optional file)

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65f000000000000000000001",
      "name": "Aarav Sharma",
      "phone": "9876543210",
      "avatar": {
        "url": "https://res.cloudinary.com/...",
        "publicId": "ecommerce/avatars/..."
      }
    }
  }
}
```

#### `POST /me/addresses` (Protected)
Add a delivery address.

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

Success response (`201`):
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "_id": "65f000000000000000000101",
        "fullName": "Aarav Sharma",
        "city": "Bengaluru",
        "isDefault": true
      }
    ]
  }
}
```

#### `PATCH /me/addresses/:addressId` (Protected)
Update an address.

Payload example:
```json
{
  "city": "Mysuru",
  "isDefault": true
}
```

#### `DELETE /me/addresses/:addressId` (Protected)
Delete an address.

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "addresses": []
  }
}
```

#### `GET /me/orders?page=1&limit=10` (Protected)
Get paginated order history for current user.

Success response (`200`):
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

### Products (Public)
Base path: `/api/v1/products`

#### `GET /`
List products with filtering, sorting, and pagination.

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

Success response (`200`):
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

#### `GET /categories`
Fetch active top-level categories.

#### `GET /:id`
Fetch product by Mongo ID or slug.

#### `GET /:id/variants`
Fetch product variant matrix.

Success response (`200`):
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

### Cart
Base path: `/api/v1/cart` (all endpoints protected)

#### `GET /`
Get current user cart.

Headers:
```http
Authorization: Bearer <token>
```

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "cart": {
      "user": "65f000000000000000000001",
      "items": [],
      "coupon": null,
      "couponDiscount": 0
    }
  }
}
```

#### `POST /items`
Add item to cart.

Payload:
```json
{
  "productId": "65f000000000000000000301",
  "quantity": 2,
  "variantId": "65f000000000000000000401",
  "customizationId": null
}
```

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "cart": {
      "items": [
        {
          "_id": "65f000000000000000000501",
          "product": "65f000000000000000000301",
          "variantId": "65f000000000000000000401",
          "quantity": 2,
          "price": 449
        }
      ]
    }
  }
}
```

#### `PATCH /items/:itemId`
Update item quantity.

Payload:
```json
{
  "quantity": 3
}
```

If `quantity <= 0`, item is removed.

#### `DELETE /items/:itemId`
Remove one cart item.

Success response (`200`):
```json
{
  "success": true,
  "message": "Item removed from cart."
}
```

#### `DELETE /`
Clear cart.

Success response (`200`):
```json
{
  "success": true,
  "message": "Cart cleared."
}
```

---

### Admin Auth
Base path: `/api/v1/admin/auth`

#### `POST /login`
Login for `admin` or `superadmin` users.

Headers:
```http
Content-Type: application/json
```

Payload:
```json
{
  "email": "admin@example.com",
  "password": "adminPass123"
}
```

Success response (`200`):
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

### Admin Products
Base path: `/api/v1/admin/products`

All endpoints require:
```http
Authorization: Bearer <admin_or_superadmin_token>
```

#### `GET /`
List products for admin panel with API features query handling.

#### `POST /` (multipart)
Create product with up to 10 images.

Headers:
```http
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

Form fields (typical):
- `name` (string, required)
- `category` (ObjectId, required)
- `productType` (`stocked` or `on_demand`, required)
- `basePrice` (number, required)
- `discountedPrice` (number, optional)
- `stock` (number, optional)
- `description`, `shortDescription`, `tags`, `isCustomizable`, `printableArea`
- `images` (file[], optional, max 10)

Success response (`201`):
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "65f000000000000000000701",
      "name": "Oversized Tee",
      "basePrice": 799,
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "publicId": "ecommerce/products/..."
        }
      ],
      "createdBy": "65f000000000000000000601"
    }
  }
}
```

#### `GET /:id`
Get product details by id.

#### `PATCH /:id` (multipart)
Update product and append uploaded images.

#### `DELETE /:id`
Soft delete product (`isActive = false`).

Success response (`200`):
```json
{
  "success": true,
  "message": "Product deactivated successfully."
}
```

#### `DELETE /:id/images/:publicId`
Delete a specific product image.

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "images": []
  }
}
```

#### `PATCH /:id/stock`
Update stock for product or variant.

Payload examples:

Set absolute stock:
```json
{
  "quantity": 25,
  "operation": "set"
}
```

Add stock to variant:
```json
{
  "variantId": "65f000000000000000000401",
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

Success response (`200`):
```json
{
  "success": true,
  "message": "Stock updated.",
  "data": {
    "stock": 22
  }
}
```

## Data Notes
- IDs shown are examples.
- Monetary values are numeric and should be treated as INR in this project.
- Protected endpoints require a valid active user/admin account.
- API surface in this README reflects routes currently mounted in `server.js`.

## Planned or Disabled Endpoints
These routes exist in the codebase but are currently commented out or not mounted in `server.js`.

### User Side
- `/api/v1/wishlist`
- `/api/v1/orders`
- `/api/v1/checkout`
- `/api/v1/customization`

### Admin Side
- `/api/v1/admin/categories`
- `/api/v1/admin/orders`
- `/api/v1/admin/uploads`

### Super Admin
- `/api/v1/superadmin`

### Example Planned Contract: Wishlist
Base path: `/api/v1/wishlist` (planned, protected)

`GET /`
```json
{
  "success": true,
  "data": {
    "wishlist": {
      "products": [
        {
          "product": {
            "_id": "65f000000000000000000301",
            "name": "Classic T-Shirt"
          },
          "addedAt": "2026-03-19T10:00:00.000Z"
        }
      ]
    }
  }
}
```

`POST /`
```json
{
  "productId": "65f000000000000000000301"
}
```

`DELETE /:productId`
```json
{
  "success": true,
  "message": "Removed from wishlist."
}
```

### Example Planned Contract: Checkout
Base path: `/api/v1/checkout` (planned, protected)

`POST /coupon/apply`
```json
{
  "code": "SAVE10"
}
```

`POST /create-order`
```json
{
  "addressId": "65f000000000000000000101",
  "notes": "Leave at door"
}
```

`POST /verify-payment`
```json
{
  "razorpayOrderId": "order_abc123",
  "razorpayPaymentId": "pay_xyz123",
  "razorpaySignature": "generated_signature",
  "orderId": "65f000000000000000000201"
}
```
