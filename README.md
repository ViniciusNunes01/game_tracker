# Game Tracker

**Version 1.4.0**  
**Developer**: Vinicius Martins Nunes

A comprehensive mobile application for managing personal game collections, built with React Native and Expo. This project showcases modern mobile development practices, clean architecture principles, and seamless integration with external APIs.

## Overview

Game Tracker is a full-featured mobile application that allows users to catalog their video game collection, track their progress, and maintain a wishlist of games they want to acquire. The application integrates with the IGDB (Internet Game Database) API to provide accurate game information, cover art, and metadata.

## Key Features

### Collection Management
- **Personalized Catalog**: Create and manage a comprehensive game library with customizable collection titles
- **Game Search Integration**: Real-time search powered by IGDB API with intelligent filtering to exclude DLCs, bundles, and special editions
- **Multi-Platform Support**: Track games across multiple platforms (PlayStation, Nintendo, Xbox, PC, and more)
- **Physical & Digital Media Tracking**: Distinguish between physical and digital ownership
- **Custom Status System**: Organize games by status (Backlog, Playing, Completed, Platinum, Abandoned) with full customization support

### Advanced Filtering System
- **Dynamic Filters**: Filter by platform, media type, or custom categories
- **Collapsible Search Interface**: Clean, animated search drawer that preserves screen space
- **Real-time Search**: Instant filtering as you type with case-insensitive matching
- **Custom Filter Creation**: Add and manage personalized filter categories

### Wishlist Management
- **Dedicated Wishlist**: Separate screen for games you plan to acquire
- **IGDB Integration**: Add games directly from search results with official metadata
- **Platform Selection**: Choose specific platforms for wishlist items
- **Duplicate Detection**: Intelligent checking to prevent duplicate entries

### Rich Media Support
- **Multiple Image Types**: Support for cover art, banners, screenshots, and artworks
- **Image Gallery**: Browse and select from available game artwork
- **High-Resolution Images**: Utilizes IGDB's CDN for quality imagery
- **Custom Cover Selection**: Choose preferred artwork from available options

### Data Persistence
- **Local Storage**: All data stored locally using AsyncStorage for offline access
- **No Account Required**: Privacy-focused design with no user tracking
- **Fast Performance**: Instant load times with optimized data structures

## Technical Architecture

### Technology Stack

**Framework & Runtime**
- React Native 0.81.5
- Expo SDK 54
- React 19.1.0
- TypeScript 5.9.2

**Navigation & Routing**
- Expo Router 6.0 (file-based routing)
- React Navigation 7.x
- Type-safe navigation with generated routes

**State Management & Storage**
- React Hooks (useState, useCallback, useMemo)
- AsyncStorage for persistent data
- Focus effects for screen state synchronization

**API Integration**
- Axios for HTTP requests
- IGDB API v4 (Twitch OAuth)
- Token management with automatic refresh

**UI & Animation**
- React Native Animated API
- Expo Haptics for tactile feedback
- Expo Image for optimized image loading
- Custom animated components

**Development Tools**
- ESLint with Expo configuration
- TypeScript strict mode
- Babel for transpilation
- EAS (Expo Application Services) for builds

### Project Structure

```
game-tracker/
├── app/                          # File-based routing (Expo Router)
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── index.tsx            # Home screen (collection)
│   │   ├── settings.tsx         # Settings screen
│   │   └── _layout.tsx          # Tab layout configuration
│   ├── game/                    # Game-related screens
│   │   ├── [idGame].tsx         # Game details (dynamic route)
│   │   ├── new.tsx              # Add new game
│   │   └── edit/
│   │       └── [idGame].tsx     # Edit game (dynamic route)
│   ├── wishlist.tsx             # Wishlist screen
│   ├── modal.tsx                # Modal presentations
│   └── _layout.tsx              # Root layout
├── src/
│   ├── components/              # Reusable components
│   │   ├── GameCard/           # Game card component
│   │   ├── ui/                 # UI primitives
│   │   └── external-link.tsx   # External navigation
│   ├── services/               # Business logic layer
│   │   ├── gameService.ts      # Game operations
│   │   ├── igdbService.ts      # IGDB API integration
│   │   ├── platformService.ts  # Platform data
│   │   └── storageService.ts   # AsyncStorage operations
│   └── types/                  # TypeScript definitions
│       ├── Game.ts             # Game interface
│       └── Platform.ts         # Platform interface
├── assets/                     # Static resources
└── scripts/                    # Utility scripts
```

### Design Patterns & Best Practices

**Separation of Concerns**
- Services layer abstracts business logic from UI
- Type definitions centralized in dedicated directory
- Components focused on presentation logic

**Type Safety**
- Comprehensive TypeScript interfaces
- Strict type checking enabled
- Type-safe routing with Expo Router

**API Integration Strategy**
- Centralized API client configuration
- Token management with automatic caching
- Error handling with graceful fallbacks
- Query optimization with field selection

**Data Management**
- Immutable state updates
- Optimistic UI updates
- Efficient list rendering with FlatList
- Memoization for expensive computations

**User Experience**
- Haptic feedback for interactions
- Loading states for async operations
- Animated transitions and gestures
- Keyboard-aware scrolling

## IGDB API Integration

### Authentication Flow
The application implements OAuth 2.0 Client Credentials flow with Twitch/IGDB:
1. Request access token using client credentials
2. Cache token for subsequent requests
3. Include token in all API requests
4. Automatic token refresh on expiration

### Game Search Implementation
- **Intelligent Filtering**: Excludes bundles, DLCs, special editions, and soundtracks
- **Game Type Validation**: Filters based on IGDB game_type field (main games, remasters, standalone expansions)
- **Duplicate Prevention**: Normalizes and deduplicates search results
- **Chronological Sorting**: Orders results by release date
- **Field Selection**: Optimizes API calls by requesting only necessary fields

### Image Management
- **Multiple Sizes**: Support for thumbnail, cover, and full-resolution images
- **CDN Integration**: Leverages IGDB's Cloudinary CDN
- **Lazy Loading**: Images loaded on-demand for performance
- **Fallback Handling**: Graceful degradation for missing artwork

## Development Highlights

### Performance Optimizations
- **useMemo**: Computed values cached for filtered game lists
- **useCallback**: Stable function references prevent unnecessary re-renders
- **FlatList**: Virtualized list rendering for large collections
- **Image Optimization**: Expo Image with caching and priority loading

### State Management Strategy
- Local component state for UI interactions
- AsyncStorage for persistent application state
- Focus effects for screen-level state synchronization
- Optimistic updates for immediate feedback

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Graceful API failure handling
- Validation before data persistence

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (macOS) or Android Emulator
- IGDB API credentials (Client ID and Secret)

### Environment Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_IGDB_CLIENT_ID=your_client_id
EXPO_PUBLIC_IGDB_CLIENT_SECRET=your_client_secret
```

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd game-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app

## Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

## Future Development & Scalability

### Planned Features
- **Cloud Synchronization**: Cross-device sync with backend integration
- **Social Features**: Share collections and compare with friends
- **Statistics Dashboard**: Track playtime, completion rates, and trends
- **Advanced Search**: Genre, developer, and rating filters
- **Barcode Scanner**: Quick physical game addition via barcode
- **Export Functionality**: CSV/JSON export of collection data
- **Achievement Tracking**: Integration with platform trophy/achievement systems
- **Price Tracking**: Monitor game prices across stores
- **Recommendation Engine**: Suggest games based on collection

### Scalability Considerations
- **Backend Integration**: Migration to cloud-based storage (Firebase/Supabase)
- **Database Migration**: Transition from AsyncStorage to SQLite for complex queries
- **User Authentication**: Implement secure auth system for multi-device support
- **Caching Strategy**: Implement more sophisticated caching with TTL
- **Image Optimization**: CDN integration for custom uploaded images
- **Analytics Integration**: User behavior tracking for UX improvements
- **Internationalization**: Multi-language support with i18n
- **Accessibility**: Enhanced screen reader support and contrast options

### Technical Debt & Improvements
- Implement automated testing (Jest, React Native Testing Library)
- Add error monitoring (Sentry integration)
- Implement CI/CD pipeline with EAS Build
- Code splitting and lazy loading for larger codebase
- Performance monitoring with React Native Performance
- Migration to React Server Components (when stable)

## Technical Competencies Demonstrated

This project demonstrates proficiency in:

- **Mobile Development**: Cross-platform iOS and Android development
- **Modern React Patterns**: Hooks, context, memoization, and optimization techniques
- **TypeScript**: Strong typing, interfaces, and type safety
- **API Integration**: RESTful API consumption, OAuth implementation
- **State Management**: Local state, persistent storage, and data synchronization
- **UX/UI Design**: Intuitive interfaces, animations, and user feedback
- **Software Architecture**: Layered architecture, separation of concerns
- **Async Programming**: Promises, async/await, error handling
- **Performance**: Optimization techniques for mobile platforms
- **Version Control**: Git workflow and project organization

## Platform Support

- **iOS**: 15.0+
- **Android**: 6.0+ (API level 23)
- **Web**: Modern browsers (experimental)

## License

This project is private and proprietary.

© 2026 Vinicius Martins Nunes. All rights reserved.

## Contact

**Developer**: Vinicius Martins Nunes

For questions, suggestions, or collaboration opportunities, please reach out through the repository issues or contact information in the profile.

---

**Current Version**: 1.4.0  
**Last Updated**: March 2026  
**Status**: Active Development
