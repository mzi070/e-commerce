# E-Commerce Web Application

A modern full-stack e-commerce application built with React (Vite) and Node.js/Express.

## 🚀 Features

- **Frontend**: React with Vite for fast development
- **Backend**: Node.js with Express REST API
- **Database Ready**: MongoDB with Mongoose ODM
- **State Management**: React Context API for cart management
- **Modern UI**: Responsive design with clean styling

## 📁 Project Structure

```
e-commerce/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React Context providers
│   │   ├── services/        # API service functions
│   │   ├── utils/           # Utility functions
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # CSS styles
│   └── package.json
├── backend/                 # Express backend API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (optional, for database functionality)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend API will be available at `http://localhost:3000`

### Environment Variables

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000/api
```

**Backend (.env)**
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

## 📦 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## 🌟 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

## 🚧 Development Roadmap

- [ ] Add user authentication
- [ ] Implement payment integration
- [ ] Add product search and filtering
- [ ] Create admin dashboard
- [ ] Add product reviews and ratings
- [ ] Implement email notifications

## 📝 License

ISC

## 👨‍💻 Author

Your Name

---

Built with ❤️ using React, Vite, Node.js, and Express
