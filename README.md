# Serafina Water Management System

A comprehensive water delivery management system built with React, Redux, and Firebase.

## Features

- 🏢 **Customer Management** - Manage customers with custom product pricing
- 📦 **Product Management** - Add and manage bottle products
- 🛒 **Order Management** - Place orders with payment tracking
- 🔄 **Bottle Returns** - Track bottle returns
- 💰 **Payment Tracking** - Track payments and outstanding balances
- 📊 **Reports** - Generate various business reports
- 💵 **Cash Management** - Track cash on hand, daily/weekly/monthly summaries
- 💸 **Expense Management** - Track and categorize expenses
- 👥 **User Management** - Admin can create staff accounts
- 🌐 **Multi-language** - English and Urdu support
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18, Redux Toolkit, React Router
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore
- **Authentication**: Custom Firestore-based authentication
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/serafina-water.git
cd serafina-water
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your Firebase configuration
```

4. Start development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173)

### Default Login

- **Username**: `admin`
- **Password**: `admin`

⚠️ **Change this password immediately after first login!**

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import repository on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

See [GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md) for complete CI/CD setup.

## Project Structure

```
src/
├── features/          # Feature modules
│   ├── auth/         # Authentication
│   ├── customers/     # Customer management
│   ├── products/      # Product management
│   ├── orders/        # Order management
│   ├── bottles/       # Bottle tracking
│   ├── payments/      # Payment tracking
│   ├── expenses/      # Expense management
│   ├── cash/          # Cash management
│   ├── reports/       # Reports
│   ├── settings/      # Settings
│   └── users/         # User management
├── pages/             # Page components
├── shared/            # Shared components and utilities
└── store/             # Redux store configuration
```

## Environment Variables

Required environment variables (see `.env.example`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Documentation

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment options
- [GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md) - CI/CD setup guide

## License

Private project - All rights reserved

## Support

For issues and questions, please contact the development team.
