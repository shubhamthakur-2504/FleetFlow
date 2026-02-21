# ⚛️ FleetFlow Frontend

React 18 + Vite frontend for FleetFlow fleet management system with real-time updates and role-based access control.

**Live:** https://fleet-flow-beta.vercel.app/

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build

# Preview production build
npm run preview
```

**Development Server:** http://localhost:5173  
**API Server:** http://localhost:3000 (local) or your Render URL

---

## 🔧 Environment Variables

### Development (`.env.development`)
```env
VITE_API_URL="http://localhost:3000"
```

### Production (`.env.production`)
```env
VITE_API_URL="https://your-backend.onrender.com"
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── Pages/                    # Page components
│   │   ├── Dashboard.jsx         # Fleet overview & stats
│   │   ├── Login.jsx             # User authentication
│   │   ├── Register.jsx          # User registration
│   │   ├── VehicleRegistry.jsx   # Vehicle management
│   │   ├── TripDispatcher.jsx    # Trip dispatch & completion
│   │   ├── Maintenance.jsx       # Maintenance logs
│   │   ├── ExpenseLogging.jsx    # Expense tracking
│   │   ├── DriverPerformance.jsx # Driver metrics
│   │   └── Analytics.jsx         # Fleet analytics & reports
│   │
│   ├── components/               # Reusable components
│   │   ├── ui/                   # shadcn/ui base components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   └── ...other ui components
│   │   ├── NewTripForm.jsx       # Trip creation modal
│   │   ├── NewDriverForm.jsx     # Driver creation modal
│   │   └── NewVehicleForm.jsx    # Vehicle creation modal
│   │
│   ├── lib/                      # API clients & utilities
│   │   ├── api.js                # Axios instance with JWT
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── driver.js             # Driver CRUD operations
│   │   ├── vehicle.js            # Vehicle CRUD operations
│   │   ├── trip.js               # Trip management endpoints
│   │   ├── analytics.js          # Analytics data endpoints
│   │   └── expense.js            # Expense endpoints
│   │
│   ├── App.jsx                   # Main app router
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global tailwind styles
│
├── public/                       # Static assets (favicon, etc)
├── package.json                  # Dependencies & scripts
├── vite.config.js               # Vite bundler config
├── tailwind.config.js           # Tailwind CSS customization
└── README.md                     # This file
```

---

## 🎨 Pages & Features

### 📊 Dashboard
- Real-time fleet statistics
- Active vehicles, trips & revenue
- Vehicle status listing
- Auto-refresh every 30 seconds
- Manual refresh button

### 🔐 Login / Register
- JWT authentication
- Role-based registration
- Secure password handling
- Auto-redirect based on role

### 🚗 Vehicle Registry
- Create, read, update vehicles
- Filter by status
- Soft delete vehicles

### 📍 Trip Dispatcher
- Create trips with vehicle & driver
- Dispatch trips to drivers
- Complete trips with final odometer
- Cancel trips
- **License validation:** Expired drivers filtered
- **Role-based UI:** Permission-aware buttons

### 🔧 Maintenance
- Log maintenance activities
- Track maintenance costs
- View history by vehicle

### 💰 Expense Logging
- Track fuel & maintenance expenses
- Categorize by type
- Search & filter by date

### 👨‍✈️ Driver Performance
- Driver list with metrics
- Safety scores
- License expiry status (red warning if expired)
- Trip count per driver

### 📊 Analytics
- Revenue & profit trends
- Fleet utilization charts
- Vehicle cost analysis
- Driver performance metrics
- Financial KPIs

---

## 🔐 Authentication

### JWT Flow
1. User logs in → Server returns token
2. Token stored in localStorage
3. Axios interceptor auto-includes token in requests
4. On 401 error → Auto-redirect to login

### Role-Based Access Control
```javascript
{user?.role && ["ADMIN", "FLEET_MANAGER"].includes(user.role) && (
  <button>Edit</button>
)}
```

### Available Roles

**👨‍💼 ADMIN** - Full system access
- User management & system configuration
- All operational capabilities

**🚛 FLEET_MANAGER** - Fleet operations
- Vehicle health & lifecycle management
- Driver management & compliance
- Trip dispatch & completion
- Analytics & reporting

**📍 DISPATCHER** - Daily operations
- Create and dispatch trips
- Assign drivers to vehicles
- Complete trips & record metrics
- Cannot: Manage drivers/vehicles, view analytics

---

## 🌍 API Integration

### Axios Setup
```javascript
// api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Auto JWT token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Clients
```javascript
// driver.js
export const driverApi = {
  getAllDrivers: () => api.get("/drivers"),
  createDriver: (data) => api.post("/drivers", data),
  updateDriver: (id, data) => api.patch(`/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/drivers/${id}`),
};
```

---

## ✨ Key Features

### License Expiry Validation
- **Format:** MM/YY (e.g., 03/29 for March 2029)
- **Filtering:** Expired drivers excluded from trip creation
- **Display:** Red warning on expired licenses
- **Validation:** Backend checks license before dispatch

### Real-time Dashboard
- Auto-refresh every 30 seconds
- Shows active fleet count
- Total trips & revenue
- Manual refresh available
- Last update timestamp

### Keep-Alive Pinging
- Pings health endpoint every 12 minutes
- Prevents Render backend spindown
- Automatic background process

### Form Validation
- Required field checks
- Format validation
- Server error display
- User-friendly messages

---

## 🚀 Build & Deployment

### Production Build
```bash
npm run build
# Output: dist/ folder
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Or connect GitHub repo to Vercel for auto-deployment.

### Environment for Production
Set `VITE_API_URL` in Vercel dashboard:
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🎨 Styling

### Tailwind CSS
- Dark theme (slate-900)
- Accent color: amber-500
- Responsive design
- Mobile-first approach

### shadcn/ui
- Pre-built accessible components
- Customizable UI elements
- Professional styling

---

## 🐛 Troubleshooting

### API 404 Errors
```bash
# Check environment variable
echo $VITE_API_URL
# Should match backend URL
```

### License Expiry Not Working
- Use MM/YY format (e.g., 03/29)
- Don't use 03/2029 or 3/29 formats
- Date must be in future

### "No drivers available" Error
- All drivers have expired licenses
- Create new driver with future expiry date
- Or update existing driver's license

### Backend Connection Failed
- Verify backend is running
- Check `VITE_API_URL` is correct
- Check CORS settings on backend

---

## 📦 Dependencies

- **react** - UI framework
- **vite** - Build tool
- **tailwindcss** - Styling
- **shadcn/ui** - Components
- **axios** - HTTP client
- **react-router-dom** - Routing
- **react-icons** - Icons
- **recharts** - Charts

---

#### Author
[**Shubham Thakur**](https://github.com/shubhamthakur-2504)

