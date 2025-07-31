# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an investment analysis application (invest_friends) with a NestJS backend and React frontend, designed to provide stock market data visualization and financial analysis tools.

## Tech Stack

**Backend:**
- NestJS with TypeScript
- PostgreSQL with TypeORM
- JWT authentication with Passport.js (Google, Naver, Kakao OAuth)
- External APIs: KIS (Korea Investment Securities), DART (Financial Supervisory Service)

**Frontend:**
- React 19 with TypeScript
- Vite as build tool
- TailwindCSS for styling
- Chart.js for data visualization
- React Router for navigation
- Axios for API calls

## Development Commands

### Backend Commands (run from /backend directory)
```bash
# Install dependencies
pnpm install

# Run development server
npm run start:dev  # or npm run dev

# Build
npm run build

# Run tests
npm test
npm run test:watch  # Watch mode
npm run test:cov    # Coverage
npm run test:e2e    # E2E tests

# Linting and formatting
npm run lint
npm run prettier
npm run prettier:fix
```

### Frontend Commands (run from /frontend directory)
```bash
# Install dependencies
pnpm install

# Run development server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

## Environment Setup

Backend requires a `.env` file with:
- Database connection (PostgreSQL)
- JWT secrets
- OAuth credentials (Google, Naver, Kakao)
- KIS API credentials (`KIS_APP_KEY`, `KIS_APP_SECRET`)
- DART API key

## Architecture Overview

### Backend Architecture

**Module Structure:**
- `AppModule` - Root module importing all feature modules
- `StockModule` - Stock market data features
  - `KisModule` - KIS API integration for real-time stock/index prices
  - `DartModule` - DART API integration for financial statements and corp codes
  - `ChartModule` - Chart data processing and aggregation
- `AuthModule` - OAuth authentication (Google, Naver, Kakao)
- `LoginModule` - JWT-based login/refresh token management
- `DatabaseModule` - PostgreSQL/TypeORM configuration

**Key Services:**
- `KisService` - Handles KIS API token management and stock/index price queries
- `DartService` - Manages corp codes and financial statement data with fallback to mock data
- `ChartService` - Aggregates data from KIS/DART for frontend consumption

**Database Entities:**
- `CorpCode` - Corporation codes mapping (stock code ↔ corp code)
- `Auth` - User authentication data

### Frontend Architecture

**Component Structure:**
- `/components/charts/` - Reusable chart components
  - `StockChart` - Individual stock price charts
  - `FinancialChart` - Financial statement visualizations
  - `IndexChart` - KOSPI/KOSDAQ index charts
  - `ComparisonChart` - Stock vs market index comparison
- `/pages/charts/` - Main dashboard page combining all charts
- `/services/` - API integration layer
  - `chart/index.ts` - Chart data API calls
  - `auth/index.ts` - Authentication API calls

**State Management:**
- Context API for authentication state
- Local component state for chart data

## API Integration Notes

### KIS API
- Requires access token (auto-refreshed by `KisService`)
- Endpoints used:
  - `/uapi/domestic-stock/v1/quotations/inquire-price` - Current price
  - `/uapi/domestic-stock/v1/quotations/inquire-daily-price` - Daily charts
  - `/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice` - Intraday charts
  - `/uapi/domestic-stock/v1/quotations/inquire-index-daily-price` - Index charts

### DART API
- Financial statements API with automatic fallback to mock data
- Corp code management with auto-refresh on module initialization

## Testing Approach

- Backend: Jest for unit tests, Supertest for E2E
- Frontend: Component testing with React Testing Library (if configured)
- Run specific backend test: `npm test -- <test-file-name>`

## Common Development Tasks

### Adding a New Stock API Endpoint
1. Add DTO in `/backend/src/stock/kis/dto/kis.dto.ts`
2. Implement service method in `KisService`
3. Add controller endpoint in `KisController`
4. Update frontend service in `/frontend/src/services/chart/index.ts`
5. Create/update React components as needed

### Running with Mock Data
The `DartService` automatically falls back to mock data when DART API fails, useful for development without API keys.

## Port Configuration
- Backend: 3000 (configurable via PORT env var)
- Frontend: 5173 (Vite default)
- Database: PostgreSQL default (5432)

## Swagger Documentation
Available at `http://localhost:3000/api/v1` in development mode.