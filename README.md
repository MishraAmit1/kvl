# KVL - Kashi Vishwanath Logistics Management System

A comprehensive logistics and transportation management system built with modern web technologies. KVL provides complete solutions for managing consignments, vehicles, drivers, customers, and freight operations.

## 🚀 Features

### Core Functionality
- **Consignment Management**: Track and manage shipments with unique IDs (KVL-796+)
- **Vehicle Fleet Management**: Manage vehicle information and assignments
- **Driver Management**: Track driver details and assignments
- **Customer Management**: Maintain customer database and relationships
- **Freight Bill Generation**: Create and manage freight bills with PDF export
- **Load Chalan System**: Generate load chalans for shipments
- **Payment Tracking**: Track payment receipts with date management
- **Status Management**: Multiple status options (Assigned, Booked, Transit, Delivered)

### Advanced Features
- **PDF Generation**: Automated PDF reports for bills and chalans
- **Email Integration**: SendGrid integration for notifications
- **Authentication System**: Secure user authentication with JWT
- **Rate Limiting**: API protection with express-rate-limit
- **Database Integration**: MongoDB with Mongoose ODM
- **File Upload**: Multer integration for document management
- **Real-time Updates**: Modern React frontend with state management

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **File Storage**: Supabase integration
- **Email Service**: SendGrid
- **PDF Generation**: jsPDF, PDFKit, jsPDF-AutoTable
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: Nodemon, dotenv

### Frontend (Admin Panel)
- **Framework**: React 19 with Vite
- **UI Library**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS with animations
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
kvl/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middlewares
│   │   ├── utils/          # Utility functions
│   │   ├── validation/     # Input validation
│   │   └── database/       # Database connection
│   ├── public/             # Static files
│   └── package.json
└── admin-panel/            # React Admin Interface
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── stores/         # Zustand stores
    │   ├── contexts/       # React contexts
    │   └── hooks/          # Custom hooks
    ├── public/             # Static assets
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- Supabase account (for file storage)
- SendGrid account (for emails)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   JWT_SECRET=your_jwt_secret
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Frontend Setup

1. **Navigate to admin panel directory**
   ```bash
   cd admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open `http://localhost:5173` in your browser

## 📊 API Endpoints

### Authentication
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/register` - User registration

### Core Resources
- `GET|POST /api/v1/customers` - Customer management
- `GET|POST /api/v1/vehicles` - Vehicle management
- `GET|POST /api/v1/drivers` - Driver management
- `GET|POST /api/v1/consignments` - Consignment management
- `GET|POST /api/v1/freight-bills` - Freight bill operations
- `GET|POST /api/v1/load-chalans` - Load chalan operations

## 🔧 Key Features in Detail

### Consignment Management
- Unique ID generation starting from KVL-796
- Editable consignment IDs by admin
- Multiple status tracking (Assigned, Booked, Transit, Delivered)
- Payment receipt tracking with optional date entry
- Vehicle assignment with proper fleet integration

### PDF Generation
- Automated freight bill generation
- Load chalan PDF creation
- Custom formatting and branding
- Email delivery integration

### Payment Tracking
- Payment receipt functionality
- Date management (current or custom)
- Database persistence for filtering
- Admin dashboard integration

## 🚀 Deployment

### Backend Deployment
```bash
# Build and start
npm start
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Preview build
npm run preview
```

### Vercel Deployment
The project includes `vercel.json` configuration for easy Vercel deployment.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting (1000 requests/hour per IP)
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Notes

### Current Development Tasks
- Consignment ID editing functionality
- Payment receipt system implementation
- Vehicle assignment dropdown fixes
- Status management enhancements

### Known Issues
- Vehicle dropdown showing only one option (needs fix)
- Consignment ID format customization pending

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**AMS (Amit Mishra)**
- GitHub: [@MishraAmit1](https://github.com/MishraAmit1)

## 📞 Support

For support and questions, please create an issue in the GitHub repository or contact the development team.

---

**KVL - Streamlining Logistics Operations** 🚛📦