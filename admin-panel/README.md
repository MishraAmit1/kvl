# Gajpati Industries Admin Panel

A modern admin panel built with React, Vite, and shadcn/ui for managing Gajpati Industries' products, plants, blogs, and inquiries.

## Features

- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark/Light Mode**: Toggle between themes
- ⚡ **Fast Performance**: Built with Vite for lightning-fast development
- 🔄 **State Management**: Zustand for simple state management
- 📊 **Data Fetching**: TanStack Query for efficient data fetching
- 🎯 **TypeScript Ready**: Easy to migrate to TypeScript if needed

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **HTTP Client**: Fetch API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend setup)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd frontend/admin-panel
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.jsx      # Main layout component
│   ├── Sidebar.jsx     # Navigation sidebar
│   └── Header.jsx      # Top header bar
├── contexts/           # React contexts
│   └── ThemeContext.jsx
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Plants.jsx
│   ├── Natures.jsx
│   ├── Blogs.jsx
│   ├── Inquiries.jsx
│   └── Users.jsx
├── services/           # API services
│   └── api.js
├── stores/             # Zustand stores
│   └── authStore.js
├── lib/                # Utility functions
│   └── utils.js
└── hooks/              # Custom hooks
    └── use-mobile.jsx
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend Integration

This admin panel is designed to work with the Gajpati Industries backend API. Make sure your backend server is running and accessible at the configured API URL.

### API Endpoints

The admin panel expects the following API structure:

- **Auth**: `/auth/login`, `/auth/register`
- **Products**: `/products` (GET, POST, PUT, DELETE)
- **Plants**: `/plants` (GET, POST, PUT, DELETE)
- **Natures**: `/natures` (GET, POST, PUT, DELETE)
- **Blogs**: `/blogs` (GET, POST, PUT, DELETE)
- **Inquiries**: `/inquiries` (GET, POST, PUT, DELETE)
- **Users**: `/users` (GET, POST, PUT, DELETE)

## Customization

### Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add <component-name>
```

### Styling

The project uses Tailwind CSS with a custom color palette. You can customize colors in `tailwind.config.js` and CSS variables in `src/index.css`.

### Theme

The admin panel supports both light and dark themes. The theme context manages theme switching and persistence.

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
