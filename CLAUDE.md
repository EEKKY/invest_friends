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
- OpenAI integration via Agentica for natural language processing

**Frontend:**

- React 19 with TypeScript
- Vite as build tool with SWC
- TailwindCSS v4 (using @tailwindcss/vite plugin)
- Chart.js (with react-chartjs-2) for data visualization
- React Router DOM v7 for navigation
- Axios for API calls
- shadcn/ui component library
- React Hook Form with Zod validation

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
OPENAI_API_KEY=your-openai-api-key

# Application
APP_HOST=http://localhost:3000
NODE_ENV=development
PORT=3000
```

## Architecture Overview

### Backend Architecture

**Module Structure:**

- `AppModule` - Root module importing all feature modules with global ConfigModule
- `DatabaseModule` - PostgreSQL/TypeORM configuration
- `AuthModule` - OAuth authentication strategies (Google, Naver, Kakao)
- `LoginModule` - JWT-based login/refresh token management
- `JwtAuthModule` - JWT authentication guards and strategies
- `SocialModule` - Social OAuth callback handling
- `KisModule` - KIS API integration for real-time stock/index prices
- `DartModule` - DART API integration for financial statements and corp codes
- `AgenticaModule` - AI-powered natural language processing for API interactions
- `InvestmentAnalysisModule` - Comprehensive investment analysis aggregating data from multiple sources
- `ChatModule` - Chat functionality for investment discussions

**Key Services:**

- `KisService` - Handles KIS API token management and stock/index price queries
- `DartService` - Manages corp codes and financial statement data with fallback to mock data
- `AgenticaService` - Processes natural language queries using OpenAI and converts them to API calls
- `InvestmentAnalysisService` - Provides comprehensive stock analysis combining KIS, DART, and AI insights

**Database Entities:**

- `CorpCode` - Corporation codes mapping (stock code ↔ corp code)
- `Auth` - User authentication data

### Frontend Architecture

**Component Structure:**

- `/components/charts/` - Reusable chart components
  - `StockChart` - Individual stock price charts
  - `FinancialChart` - Financial statement visualizations
  - `ComparisonChart` - Stock vs market index comparison
- `/components/investment-analysis/` - Investment analysis components
  - `StockPriceChart` - Real-time price visualization
  - `FinancialStatementsView` - Financial data display
  - `CompanyInfoCard` - Company overview
  - `InvestmentMetricsCard` - Key investment metrics
  - `PeerComparisonView` - Competitor analysis
  - `AnalystNewsView` - News and analyst reports
- `/components/chat/` - Chat interface components
  - `ChatArea` - Main chat display
  - `ChatInput` - Message input interface
- `/pages/` - Main application pages
  - `charts/` - Main dashboard page
  - `investment-analysis/` - Detailed analysis page
  - `login/`, `login2/` - Authentication pages
  - `auth/callback` - OAuth callback handler
- `/services/` - API integration layer
  - `chart/index.ts` - Chart data API calls
  - `auth/index.ts` - Authentication API calls
  - `investment-analysis/index.ts` - Investment analysis API
  - `chat/index.ts` - Chat API integration

**State Management:**

- Context API for authentication state (`AuthContext`)
- Chat context for managing chat sessions (`ChatContext`)
- Common context for shared UI state
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
- Run specific backend test: `pnpm test -- <test-file-name>`
- Run backend tests with coverage: `pnpm test:cov`
- Run backend E2E tests: `pnpm test:e2e`

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

### Project Setup

This project consists of two separate applications managed with pnpm:

```
invest_friends/
├── backend/              # NestJS backend application
├── frontend/             # React frontend application
├── Jenkinsfile          # CI/CD pipeline
└── CLAUDE.md            # This file
```

Note: Each directory has its own `pnpm-lock.yaml` and manages dependencies independently.

### Key Configuration Files

**Backend:**
- `backend/nest-cli.json` - NestJS CLI configuration
- `backend/tsconfig.json` - TypeScript configuration
- `backend/.eslintrc.js` - ESLint configuration
- `backend/.prettierrc` - Prettier configuration

**Frontend:**
- `frontend/vite.config.ts` - Vite build configuration with path aliases
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/components.json` - shadcn/ui configuration
- TailwindCSS v4 configured via @tailwindcss/vite plugin

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

### Frontend API Configuration

The frontend uses axios with interceptors for:
- Automatic token attachment from localStorage
- Global error handling with toast notifications
- Automatic redirect to login on 401 errors
- Base URL configuration via `VITE_API_BASE_URL` environment variable

### CI/CD Pipeline

Jenkins pipeline (Node.js 24) performs:
1. pnpm installation globally
2. Backend: Install dependencies, lint, build, and start
3. Frontend: Install dependencies, lint, build, and preview
4. Uses `--frozen-lockfile` to ensure consistent dependencies

## Code Quality Standards

### Backend ESLint Rules
- **Required**: Explicit function return types and module boundary types
- **Forbidden**: `any` type usage, empty functions (except arrow functions)
- **Enforced**: Single quotes, semicolons, max line length 150 chars
- **Member ordering**: public static → protected static → public instance → protected instance → private instance
- **Warnings**: Unused variables, console.log, debugger statements

### Prettier Configuration
- Single quotes
- Trailing commas in all cases

## Important Notes

- Database synchronization is enabled (`synchronize: true`) - disable in production
- JWT tokens stored in localStorage (migration to cookies planned)
- CORS is configured to allow all origins (*) in development
- Mock data fallback is available for both KIS and DART services when APIs fail
- Swagger API documentation includes all endpoints with proper tagging
- Path alias `@` configured in frontend for `src` directory imports
- TypeORM configured with auto entity loading and connection retry disabled
