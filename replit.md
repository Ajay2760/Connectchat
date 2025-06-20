# Chat Application

## Overview

This is a full-stack real-time chat application built with React on the frontend and Express.js on the backend. The application supports both direct messaging and group chats, with user presence tracking and real-time message updates through polling.

## System Architecture

The application follows a traditional client-server architecture with the following key components:

- **Frontend**: React SPA with TypeScript, using Vite for development and build tooling
- **Backend**: Express.js REST API server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query for server state management and caching

## Key Components

### Frontend Architecture
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Theme Support**: Light/dark mode with system preference detection

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints for users, chats, and messages
- **Data Access**: Drizzle ORM with PostgreSQL
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Development Setup**: Vite integration for hot module replacement

### Database Schema
The application uses four main tables:
- **users**: User accounts with online status tracking
- **chats**: Chat rooms (direct or group type)
- **chat_members**: Many-to-many relationship between users and chats
- **messages**: Chat messages with sender and timestamp information

### Real-time Updates
- **Polling Strategy**: Client-side polling every 2.5 seconds for new messages
- **Presence Updates**: User online status updated every 30 seconds
- **Query Invalidation**: React Query cache invalidation for real-time data consistency

## Data Flow

1. **User Registration**: Users create accounts with unique usernames
2. **Chat Creation**: Users can create direct chats or group chats
3. **Message Flow**: Messages are sent via REST API and retrieved through polling
4. **Presence Tracking**: Online status is maintained through periodic heartbeat updates
5. **Real-time Updates**: UI updates automatically through React Query cache invalidation

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database driver for Neon
- **drizzle-orm**: Type-safe ORM with schema validation
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds

### UI and Styling
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Conditional className utility
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:
- **Development**: `npm run dev` runs both frontend and backend with hot reloading
- **Production Build**: `npm run build` creates optimized bundles for both client and server
- **Production Server**: `npm run start` serves the built application
- **Database**: PostgreSQL 16 module configured in Replit environment
- **Port Configuration**: Server runs on port 5000, exposed as port 80 externally

### Build Process
1. Frontend build creates static assets in `dist/public`
2. Backend build bundles server code with esbuild to `dist/index.js`
3. Static assets are served by Express in production
4. Environment variables manage database connections and build modes

## Recent Changes
- June 20, 2025: Added exit button functionality to leave chat sessions
- June 20, 2025: Implemented friend discovery system for finding and chatting with online users
- June 20, 2025: Created music rooms feature for listening to songs together with friends
- June 20, 2025: Enhanced chat interface with three tabs: Direct chats, Groups, and Music rooms
- June 20, 2025: Added comprehensive friend interaction features and explanations

## Key Features Added
### Friend Discovery System
- "Find Friends" button in Direct tab to discover online users
- Real-time friend search and instant chat initiation
- Clear explanation of how to chat with friends in the welcome screen

### Music Rooms
- Dedicated music rooms for listening to songs together
- Song sharing functionality with URL support (YouTube, Spotify, etc.)
- Special music-themed UI with purple/pink gradients
- Separate tab for music room management

### Enhanced User Experience
- Exit button (red logout icon) to leave the application
- Improved welcome screen with feature explanations
- Real-time online status indicators for friends
- Better visual distinction between chat types

## Changelog
- June 20, 2025. Initial setup
- June 20, 2025. Enhanced with friend discovery and music features

## User Preferences

Preferred communication style: Simple, everyday language.