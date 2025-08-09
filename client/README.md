# CRM System - Frontend

A modern CRM (Customer Relationship Management) system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Overview of contacts, opportunities, tasks, and revenue
- **Contact Management**: Create, edit, and manage customer contacts
- **Opportunity Tracking**: Track sales opportunities through the pipeline
- **Task Management**: Assign and track tasks with priorities and due dates
- **User Management**: Admin panel for managing users and permissions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live data updates and notifications

## Tech Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ and npm
- Backend API server running on port 3001

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=CRM System
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build

1. Create a production build:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   ├── UI/             # Basic UI components
│   └── Forms/          # Form components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── api.ts          # API client configuration
│   └── utils.ts        # Utility functions
├── pages/              # Next.js pages
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Authentication

The application uses JWT-based authentication. Users must log in to access the CRM features. The authentication state is managed globally using React Context.

## API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in `src/lib/api.ts` and organized by feature modules.

## Styling

The application uses Tailwind CSS for styling with custom components defined in `src/styles/globals.css`. The design system includes:

- Custom color palette
- Consistent spacing and typography
- Reusable component classes
- Responsive design utilities

## Contributing

1. Follow the existing code style and conventions
2. Use TypeScript for all new code
3. Add proper error handling and loading states
4. Test your changes thoroughly
5. Update documentation as needed

## License

This project is licensed under the MIT License.