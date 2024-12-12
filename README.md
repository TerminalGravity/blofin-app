# BloFin Trading Application

A modern web application for BloFin's cryptocurrency trading platform, providing access to Perpetual Futures trading, market data, and account management.

## Features

- Real-time market data through WebSocket connections
- Perpetual Futures trading interface
- Account management and API key integration
- Demo trading environment support
- Copy trading functionality

## Development Setup

### Prerequisites

- Bun (latest version recommended)
- Docker and Docker Compose (for containerized development)

### Environment Configuration

The project uses different environment files for development and production:

- `.env.development` - Development environment variables (demo trading API endpoints)
- `.env.production` - Production environment variables (live trading API endpoints)

API Endpoints:

- Production REST API: `https://openapi.blofin.com`
- Demo Trading REST API: `https://demo-trading-openapi.blofin.com`

### Build Setup

```bash
# install dependencies
$ bun install

# serve with hot reload at localhost:3000
$ bun run dev

# build for production and launch server
$ bun run build
$ bun run start

# generate static project
$ bun run generate
```

### Docker Setup

#### Development

```bash
# Run the development environment
$ bun run docker:dev
# or
$ docker-compose up

# Build and run the development environment
$ docker-compose up --build
```

#### Production

```bash
# Run the production environment
$ bun run docker:prod
# or
$ docker-compose -f docker-compose.prod.yml up

# Build and run the production environment
$ docker-compose -f docker-compose.prod.yml up --build

# View logs
$ bun run docker:logs

# Stop containers
$ bun run docker:stop
```

### Development Tools

- **TypeScript**: Full TypeScript support for enhanced type safety and developer experience
- **ESLint**: JavaScript/TypeScript linting with Vue.js specific rules
- **Prettier**: Consistent code formatting
- **StyleLint**: CSS/SCSS linting for maintainable styles
- **Bun**: Fast JavaScript/TypeScript runtime and package manager

## Project Structure

### Core Directories

### `assets`

Static assets including images, styles, and fonts used throughout the application.

### `components`

Reusable Vue.js components organized by feature:

- Trading components
- Market data displays
- Account management interfaces
- Common UI elements

### `layouts`

Application layouts including:

- Default trading interface
- Authentication layouts
- Mobile-responsive views

### `pages`

Application routes and views for:

- Trading dashboard
- Account management
- Market analysis
- API key management

### `plugins`

Core functionality plugins:

- API integrations
- WebSocket connections
- Authentication handlers
- Trading utilities

### `services`

API service integrations:

- REST API clients
- WebSocket handlers
- Trading operations
- Market data services

### `store`

Vuex state management for:

- User authentication
- Trading state
- Market data
- Application settings

For detailed explanation on how things work, check out:

- [BloFin API Documentation](https://blofin.com/docs)
- [Nuxt.js Documentation](https://nuxtjs.org)
- [Bun Documentation](https://bun.sh)
