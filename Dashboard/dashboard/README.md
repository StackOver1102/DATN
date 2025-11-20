# 3D Models Admin Dashboard

Admin dashboard for the 3D Models platform built with Next.js, NextAuth.js, and React Query.

## Features

- Authentication with NextAuth.js
- Data fetching with React Query
- Protected routes with middleware
- User management
- Product management
- Order tracking
- Transaction history

## Tech Stack

- Next.js 14 with App Router
- NextAuth.js for authentication
- React Query for data fetching and caching
- TypeScript for type safety
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-replace-in-production
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable React components
- `/providers` - React context providers
- `/lib` - Utility functions and hooks
- `/types` - TypeScript type definitions

## Authentication

The dashboard uses NextAuth.js for authentication with a credentials provider that connects to the backend API. Protected routes are handled by the middleware.

## API Integration

React Query is used for data fetching, caching, and state management. Custom hooks in `/lib/hooks/useApi.ts` provide an easy way to interact with the backend API.