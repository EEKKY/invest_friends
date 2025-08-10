# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an investment analysis application (invest_friends) with a NestJS backend and React frontend, designed to provide stock market data visualization and financial analysis tools for Korean stock markets.

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
- Chart.js (with react-chartjs-2) for data visualization
- React Router v7 for navigation
- Axios for API calls
- shadcn/ui component library

## Development Commands

### Backend Commands (run from /backend directory)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm start:dev  # or pnpm dev

# Build
pnpm build

# Run tests
pnpm test
pnpm test:watch  # Watch mode
pnpm test:cov    # Coverage
pnpm test:e2e    # E2E tests

# Linting and formatting
pnpm lint
pnpm prettier
pnpm prettier:fix
```

### Frontend Commands (run from /frontend directory)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Preview production build
pnpm preview
```

## Environment Setup

Backend requires a `.env` file with:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=invest_friends

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
KAKAO_CLIENT_ID=your-kakao-client-id

# External APIs
KIS_APP_KEY=your-kis-app-key
KIS_APP_SECRET=your-kis-app-secret
DART_API_KEY=your-dart-api-key
```

## Architecture Overview

### Backend Architecture

**Module Structure:**

- `AppModule` - Root module importing all feature modules with global ConfigModule
- `DatabaseModule` - PostgreSQL/TypeORM configuration
- `AuthModule` - OAuth authentication strategies (Google, Naver, Kakao)
- `LoginModule` - JWT-based login/refresh token management
- `JwtAuthModule` - JWT authentication guards and strategies
- `ChartModule` - Main stock market data module that imports:
  - `KisModule` - KIS API integration for real-time stock/index prices
  - `DartModule` - DART API integration for financial statements and corp codes

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

## Project Structure

### Monorepo Setup

This project uses pnpm workspaces with the following structure:

```
invest_friends/
├── backend/              # NestJS backend application
├── frontend/             # React frontend application
├── pnpm-workspace.yaml   # Workspace configuration
├── Jenkinsfile          # CI/CD pipeline
└── CLAUDE.md            # This file
```

### Key Configuration Files

**Backend:**
- `backend/nest-cli.json` - NestJS CLI configuration
- `backend/tsconfig.json` - TypeScript configuration
- `backend/.eslintrc.js` - ESLint configuration
- `backend/.prettierrc` - Prettier configuration

**Frontend:**
- `frontend/vite.config.ts` - Vite build configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tailwind.config.js` - TailwindCSS configuration
- `frontend/components.json` - shadcn/ui configuration

## Development Workflow

### Starting Development

1. Install dependencies in both directories:
   ```bash
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```

2. Set up the backend `.env` file (see Environment Setup section)

3. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && pnpm dev

   # Terminal 2 - Frontend  
   cd frontend && pnpm dev
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api/v1

### Database Management

- TypeORM is configured with `synchronize: true` in development
- Entities are auto-loaded from `src/**/*.entity.ts`
- Migrations are not currently set up

### Authentication Flow

1. User clicks OAuth login button (Google/Naver/Kakao)
2. Redirected to OAuth provider
3. Callback to `/auth/{provider}/callback`
4. JWT tokens issued (access + refresh)
5. Frontend stores tokens and includes in API requests

### Mock Data Development

Both KIS and DART services include automatic fallback to mock data when API calls fail. This enables development without valid API credentials:

- `KisService`: Returns realistic stock price movements
- `DartService`: Returns sample financial statements

Set `NODE_ENV=development` to enable detailed error logging.
