# Overview

XaviaBot is a Facebook Messenger chatbot built with Node.js that uses the Facebook Chat API (FCA) to interact with users in Messenger groups and conversations. The bot features a plugin-based architecture supporting commands, events, and message handlers. It includes economy features, AI integration (Gemini), admin controls, and various utility commands. The bot supports multiple databases (JSON/MongoDB), multi-language support, and includes anti-spam/anti-change protection mechanisms.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Architecture Decisions

### Plugin System
- **Modular plugin architecture** with three main types:
  - **Commands**: User-invoked actions triggered by prefix (e.g., `!help`, `!balance`)
  - **Events**: Facebook event handlers (subscribe, unsubscribe, thread updates, etc.)
  - **OnMessage**: Passive message processors (level system, AFK detection, prefix display)
- **Hot-reload capability** for plugins without full restart
- **Per-plugin language support** with fallback to system language
- **Dynamic dependency installation** for plugin requirements

### Data Management
- **Dual database support**: JSON files or MongoDB
  - JSON mode uses file-based storage with periodic auto-save (5-minute intervals)
  - MongoDB mode with Mongoose ODM for scalable deployments
- **In-memory caching** via Map structures for performance
- **Separate controllers** for Users and Threads with unified API
- **Data models** include user info, thread info, experience points, money, and custom plugin data

### Authentication & State Management
- **Facebook appstate handling** with optional encryption for Replit/Glitch
- **Replit Database integration** for secure appstate storage in Replit environment
- **Auto-refresh mechanisms** for login state and MQTT connection
- **Environment-aware configuration** (detects Replit, Glitch, GitHub, OS type)

### Permission System
- **Three-tier permission model**:
  - Level 0: Regular users
  - Level 1: Group admins
  - Level 2: Bot moderators
- **Absolute permissions** for super admins (bypass maintain mode)
- **Per-command permission requirements**
- **Thread-level and user-level ban system**

### Message Processing Pipeline
1. Event logging with configurable verbosity (0-2)
2. Database update for user/thread info
3. Event type routing (message, message_reply, reaction, etc.)
4. Command detection and cooldown checking
5. Plugin execution with error handling
6. Reply/reaction tracking for interactive flows

### Economy System
- **Virtual currency** with balance tracking
- **Banking features** including deposits, withdrawals, loans
- **Gambling games** (color-color, flip, sicbo)
- **Daily rewards and work commands**
- **Transfer system with fees**
- **Decimal.js** for precise financial calculations

## Design Patterns

### Event-Driven Architecture
- Central event listener (`handleListen`) dispatches to specialized handlers
- Plugin events registered dynamically at load time
- Reply and reaction events support callback-based interactions

### Controller Pattern
- Unified Controllers (Users, Threads) abstract database operations
- Support both JSON and MongoDB backends transparently
- Auto-update mechanisms with configurable intervals

### Module Loading Strategy
- Dynamic ES6 module imports using `pathToFileURL`
- Dependency scanning and auto-installation for plugins
- Global module registry accessible throughout application

### Error Handling
- Graceful degradation for missing data/failed API calls
- Per-plugin error isolation preventing bot crashes
- Comprehensive logging with custom logger module

## Configuration Management
- **Main config** (`config.main.json`): Core bot settings, FCA options, moderators
- **Plugin config** (`config.plugins.json`): Per-plugin customization
- **Login config**: Email/password for Facebook authentication
- **Environment variables**: API keys, database URLs, encryption keys

## External Service Integration
- **Facebook Chat API** via multiple FCA implementations (fca-unofficial, aryan-nix-fca, etc.)
- **Replit Database** for persistent storage in Replit environment
- **ImgBB** for image hosting (optional)
- **Custom APIs** for Nino chat, Gemini AI, XaviaStore marketplace

## Performance Optimizations
- **In-memory caching** reduces database reads
- **Batch operations** for thread info updates
- **Cleanup scripts** remove temporary files on startup
- **Rate limiting** on dashboard endpoints
- **Lazy loading** of user/thread data with 4-hour refresh

## Security Considerations
- **Appstate encryption** using AES with secret keys
- **CORS and Helmet** middleware on Express server
- **Rate limiting** prevents abuse of admin endpoints
- **Input sanitization** for commands
- **Permission checks** before command execution

# External Dependencies

## Core Dependencies
- **@xaviabot/fca-unofficial** / **aryan-nix-fca** / **chatbox-fca-remake** / **ws3-fca** / **ryuu-fca-api**: Facebook Chat API implementations
- **@replit/database**: Key-value database for Replit deployments
- **mongoose**: MongoDB ODM for scalable database option
- **express**: HTTP server for dashboard/API endpoints
- **axios**: HTTP client for external API calls

## Utility Libraries
- **moment-timezone**: Timezone-aware date/time handling
- **chalk**: Terminal output colorization
- **semver**: Version comparison for updates
- **dotenv**: Environment variable management
- **fs-extra**: Enhanced file system operations
- **js-yaml**: YAML parsing for language files
- **crypto-js**: Encryption/decryption utilities

## Media Processing
- **@distube/ytdl-core** / **ytdl-core**: YouTube video downloading
- **yt-search**: YouTube search functionality
- **fluent-ffmpeg** / **ffmpeg-static**: Audio/video processing
- **node-cron**: Scheduled task execution

## Additional Services
- **helmet**: Security headers for Express
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting
- **sanitize-html**: HTML sanitization
- **pastebin-js**: Pastebin integration
- **python-shell**: Python script execution
- **decimal.js**: Arbitrary-precision decimal arithmetic
- **string-similarity**: String comparison algorithms
- **systeminformation**: System metrics collection
- **wikijs**: Wikipedia API wrapper

## Database Notes
- The application supports MongoDB via Mongoose models
- JSON mode uses file-based storage as an alternative
- Postgres is not currently implemented but could be added via database abstraction layer