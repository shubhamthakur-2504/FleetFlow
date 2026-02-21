# 🔧 FleetFlow Backend API

Node.js/Express backend for FleetFlow fleet management system with Prisma ORM and PostgreSQL.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Setup database
npx prisma migrate deploy

# Start development server
npm run dev

# Or start production server
npm start
```

Server runs on `http://localhost:3000`

---

## 🔧 Environment Variables

Create `.env` file in root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fleetflow"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"

# Server
PORT=3000
NODE_ENV="development"

# CORS
CLIENT_URL="http://localhost:5173"
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "role": "DISPATCHER"
}

Response: { success: true, message: "...", data: { user, token } }
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response: { success: true, message: "...", data: { user, token } }
```

#### Logout
```http
POST /auth/logout
Headers: Authorization: Bearer {token}

Response: { success: true, message: "Logout successful" }
```

#### Get Profile
```http
GET /auth/profile
Headers: Authorization: Bearer {token}

Response: { success: true, data: { user } }
```

---

### Vehicle Endpoints

#### List Vehicles
```http
GET /vehicles
Headers: Authorization: Bearer {token}

Query Parameters:
  - status: Available | In Shop | On Trip | Retired
  - isRetired: true | false

Response: { success: true, data: [ vehicles ] }
```

#### Create Vehicle
```http
POST /vehicles
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "licensePlate": "MH01AB1234",
  "model": "Tata 407",
  "maxLoad": 5000,
  "odometer": 50000
}

Response: { success: true, message: "...", data: { vehicle } }
```

#### Update Vehicle
```http
PATCH /vehicles/{id}
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "In Shop",
  "odometer": 50100
}

Response: { success: true, message: "...", data: { vehicle } }
```

#### Delete Vehicle
```http
DELETE /vehicles/{id}
Headers: Authorization: Bearer {token}

Response: { success: true, message: "Vehicle deleted successfully" }
```

---

### Driver Endpoints

#### List Drivers
```http
GET /drivers
Headers: Authorization: Bearer {token}

Query Parameters:
  - status: On Duty | Taking a Break | Suspended

Response: { success: true, data: [ drivers ] }
```

#### Create Driver
```http
POST /drivers
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Alice Johnson",
  "licenseNumber": "DL-2024-001",
  "licenseExpiry": "2029-03-31",
  "status": "On Duty"
}

Response: { success: true, message: "...", data: { driver } }
```

#### Update Driver
```http
PATCH /drivers/{id}
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Suspended"
}

Response: { success: true, message: "...", data: { driver } }
```

#### Delete Driver
```http
DELETE /drivers/{id}
Headers: Authorization: Bearer {token}

Response: { success: true, message: "Driver deleted successfully" }
```

---

### Trip Endpoints

#### List Trips
```http
GET /trips
Headers: Authorization: Bearer {token}

Query Parameters:
  - status: Draft | Dispatched | Completed | Cancelled

Response: { success: true, data: [ trips ] }
```

#### Create Trip (Draft)
```http
POST /trips
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": 1,
  "driverId": 1,
  "cargoWeight": 4500
}

Validation:
  - cargoWeight must be <= vehicle.maxLoad
  - driver.licenseExpiry must be in future
  - vehicle.status must be "Available"

Response: { success: true, message: "...", data: { trip } }
```

#### Dispatch Trip
```http
PATCH /trips/{id}/dispatch
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "startOdo": 50100
}

Effects:
  - Trip status: Draft → Dispatched
  - Vehicle status: Available → On Trip
  - Driver status: On Duty (stays)

Response: { success: true, message: "...", data: { trip } }
```

#### Complete Trip
```http
PATCH /trips/{id}/complete
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "endOdo": 50150,
  "revenue": 5000
}

Effects:
  - Trip status: Dispatched → Completed
  - Vehicle status: On Trip → Available
  - Records trip distance and revenue

Response: { success: true, message: "...", data: { trip } }
```

#### Cancel Trip
```http
PATCH /trips/{id}/cancel
Headers: Authorization: Bearer {token}

Requires:
  - Trip status must be "Draft"

Response: { success: true, message: "...", data: { trip } }
```

---

### Analytics Endpoints

#### Overall Analytics
```http
GET /analytics/overall
Headers: Authorization: Bearer {token}

Query Parameters:
  - month: 1-12
  - year: 2024, 2025, etc.

Returns:
  - totalTrips: number
  - totalRevenue: currency
  - totalFuelCost: currency
  - totalMaintenanceCost: currency
  - totalExpense: currency
  - netProfit: currency
  - roi: percentage
  - uniqueVehicles: number

Response: { success: true, data: { analytics } }
```

#### Time Series Analytics
```http
GET /analytics/timeseries
Headers: Authorization: Bearer {token}

Query Parameters:
  - timeRange: month | week | year

Returns: Array of periods with revenue, expenses, ROI

Response: { success: true, data: [ timeSeries ] }
```

#### Vehicle Analytics
```http
GET /analytics/vehicles
Headers: Authorization: Bearer {token}

Query Parameters:
  - limit: 5 (default)

Returns: Top vehicles by cost with metrics

Response: { success: true, data: [ vehicles ] }
```

#### Driver Analytics
```http
GET /analytics/drivers
Headers: Authorization: Bearer {token}

Returns: All drivers with trip count, revenue, safety score

Response: { success: true, data: [ drivers ] }
```

#### Financial Summary
```http
GET /analytics/financial
Headers: Authorization: Bearer {token}

Returns: Overall profit/loss, profit margin

Response: { success: true, data: { financial } }
```

#### Vehicle Utilization
```http
GET /analytics/utilization
Headers: Authorization: Bearer {token}

Returns:
  - activeCount: vehicles on trip
  - idleCount: available vehicles
  - inShopCount: in maintenance
  - utilizationChart: for pie charts

Response: { success: true, data: { utilization } }
```

---

### Log Endpoints

#### Create Maintenance Log
```http
POST /logs
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": 1,
  "type": "Maintenance",
  "description": "Oil change",
  "cost": 2000,
  "date": "2026-02-21"
}

Response: { success: true, message: "...", data: { log } }
```

#### Create Fuel Log
```http
POST /logs
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": 1,
  "type": "Fuel",
  "description": "Fuel refill at pump",
  "cost": 5000,
  "date": "2026-02-21"
}

Response: { success: true, message: "...", data: { log } }
```

#### Get Logs by Vehicle
```http
GET /logs/vehicle/{vehicleId}
Headers: Authorization: Bearer {token}

Response: { success: true, data: [ logs ] }
```

---

### Expense Endpoints

#### Create Expense
```http
POST /expenses
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": 1,
  "category": "Fuel",
  "amount": 5000,
  "date": "2026-02-21",
  "description": "Fuel refill"
}

Response: { success: true, message: "...", data: { expense } }
```

#### Get Expenses
```http
GET /expenses
Headers: Authorization: Bearer {token}

Query Parameters:
  - vehicleId: filter by vehicle
  - category: Fuel | Maintenance | Other
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD

Response: { success: true, data: [ expenses ] }
```

---

## 🔐 User Roles & Permissions

### Permission Matrix
```
ADMIN (System Administrator)
  ├─ ✅ Create trips
  ├─ ✅ Dispatch trips
  ├─ ✅ Complete trips
  ├─ ✅ Create drivers & vehicles
  ├─ ✅ Edit all vehicles
  ├─ ✅ View all analytics
  ├─ ✅ User management
  └─ ✅ Full system access

FLEET_MANAGER (Fleet Operations)
  ├─ ❌ Create trips
  ├─ ✅ Dispatch trips
  ├─ ✅ Complete trips
  ├─ ✅ Create drivers & manage lifecycle
  ├─ ✅ Edit vehicles (health, maintenance, scheduling)
  ├─ ✅ View comprehensive analytics
  └─ ✅ Monitor fleet operations

DISPATCHER (Daily Operations)
  ├─ ✅ Create trips daily
  ├─ ✅ Dispatch trips to drivers
  ├─ ✅ Complete trips & record metrics
  ├─ ❌ Create drivers
  ├─ ❌ Edit vehicles
  └─ ❌ View analytics
```

### Role Descriptions

**👨‍💼 ADMIN**
- Full system access and user management
- System configuration and emergency overrides
- Can perform all operations across the platform

**🚛 FLEET_MANAGER** 
- Oversee vehicle health & asset lifecycle
- Monitor vehicle maintenance & scheduling
- Create and manage driver records
- View comprehensive fleet analytics
- Dispatch and complete trips

**📍 DISPATCHER**
- Create trips and assign drivers
- Dispatch trips to drivers for execution
- Complete trips and record final metrics
- Validate cargo loads against vehicle capacity
- Monitor assigned vehicle real-time status


---

## 🗄️ Database Schema

### Users Table
```javascript
{
  id: Int (Primary Key)
  name: String
  email: String (Unique)
  password: String (Hashed)
  role: ADMIN | FLEET_MANAGER | DISPATCHER
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Vehicles Table
```javascript
{
  id: Int
  licensePlate: String (Unique)
  model: String
  status: Available | In Shop | On Trip | Retired
  maxLoad: Int (kg)
  odometer: Int
  assignedDriver: Driver? (relation)
  isRetired: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Drivers Table
```javascript
{
  id: Int
  name: String
  licenseNumber: String (Unique)
  licenseExpiry: DateTime
  status: On Duty | Taking a Break | Suspended
  safetyScore: Float (0-100)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Trips Table
```javascript
{
  id: Int
  vehicle: Vehicle
  driver: Driver
  status: Draft | Dispatched | Completed | Cancelled
  cargoWeight: Int (kg)
  distance: Int? (endOdo - startOdo)
  revenue: Float?
  startOdo: Int
  endOdo: Int?
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## 📝 Error Handling

All errors follow this format:

```javascript
{
  success: false,
  statusCode: 400,
  message: "Error description",
  errors: [] // Additional error details
}
```

Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## 🚀 Deployment

### Render.com Setup

**Build Command:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

**Start Command:**
```bash
node src/server.js
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for token signing
- `NODE_ENV` - Set to "production"
- `CLIENT_URL` - Frontend URL for CORS

---

## 🐛 Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Database Connection Error
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check credentials

### Migration Issues
```bash
npx prisma migrate deploy
# Or reset (WARNING: deletes data)
npx prisma migrate reset
```

### JWT Token Invalid
- Check `JWT_SECRET` matches between requests
- Verify token format: `Bearer {token}`
- Ensure token hasn't expired

### Author
[**Shubham Thakur**](https://github.com/shubhamthakur-2504)
