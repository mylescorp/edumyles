# EduMyles

> Multi-tenant, modular school management platform for East Africa

EduMyles is a comprehensive school management system designed specifically for East African educational institutions. It provides a unified platform for administrators, teachers, students, and parents to manage all aspects of school operations from admissions and academics to finance and communications.

## 🚀 Key Features

### Core Modules
- **Student Information System (SIS)** - Complete student lifecycle management
- **Admissions & Enrollment** - Streamlined application and onboarding
- **Finance & Fee Management** - Multi-payment gateway support (M-Pesa, Airtel Money, Stripe)
- **Timetable & Scheduling** - Smart scheduling and resource allocation
- **Academics & Gradebook** - Comprehensive academic tracking and reporting
- **HR & Payroll** - Staff management and automated payroll
- **Library Management** - Digital library catalog and circulation
- **Transport Management** - Route planning and fleet tracking
- **Communications** - SMS, email, and in-app messaging
- **eWallet** - Digital wallet for students and staff
- **Marketplace** - School supplies and services marketplace

### Platform Features
- **Multi-tenant Architecture** - Each school operates in isolated environment
- **Subdomain Routing** - `{school}.edumyles.com` for each institution
- **Real-time Updates** - Live data synchronization using Convex
- **Mobile Apps** - Native iOS and Android applications
- **Offline Support** - Critical functionality available offline
- **Role-based Access** - Granular permissions for all user types

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui | Web application UI |
| **Backend** | Convex (real-time serverless DB + compute) | Real-time database and serverless functions |
| **Authentication** | WorkOS (magic links, SSO, Organizations) | User authentication and organization management |
| **Mobile** | React Native (Expo) | Cross-platform mobile applications |
| **SMS Gateway** | Africa's Talking | SMS notifications and alerts |
| **Email Service** | Resend + React Email | Transactional email delivery |
| **Payments** | M-Pesa (Daraja), Airtel Money, Stripe, Bank Transfer | Multi-provider payment processing |
| **Hosting** | Vercel (subdomain routing) | Application deployment and scaling |
| **Build System** | Turbo (monorepo management) | Optimized build and development workflow |
| **Package Manager** | npm | Dependency management |

## 📁 Repository Structure

```
edumyles/
│
├── frontend/              # Next.js App Router — school portal ({slug}.edumyles.com)
│   ├── src/
│   │   ├── app/           # Route segments (auth, dashboard, admin, portal)
│   │   │   ├── admin/     # Platform admin interface
│   │   │   ├── auth/      # Authentication flows
│   │   │   ├── portal/    # School portal (student/parent/teacher views)
│   │   │   └── platform/  # Platform management
│   │   ├── components/    # UI components (ui, forms, tables, charts)
│   │   ├── hooks/         # Convex subscription hooks and custom React hooks
│   │   └── lib/           # Utilities, constants, formatters, validations
│   ├── convex/            # Generated Convex client code
│   └── package.json       # Frontend dependencies and scripts
│
├── mobile/                # React Native (Expo) — iOS & Android
│   ├── src/
│   │   ├── screens/       # Mobile app screens
│   │   ├── components/    # Reusable mobile components
│   │   ├── hooks/         # Mobile-specific hooks
│   │   └── lib/           # Mobile utilities and helpers
│   └── package.json       # Mobile dependencies and Expo config
│
├── convex/                # Convex — real-time serverless backend
│   ├── modules/           # Domain modules (one folder per module)
│   │   ├── sis/           # Student Information System
│   │   ├── admissions/    # Admissions & Enrollment
│   │   ├── finance/       # Fee & Finance Management
│   │   ├── timetable/     # Timetable & Scheduling
│   │   ├── academics/     # Academics & Gradebook
│   │   ├── hr/            # HR & Payroll
│   │   ├── library/       # Library Management
│   │   ├── transport/     # Transport Management
│   │   ├── communications/# Communication & Notifications
│   │   ├── ewallet/       # eWallet
│   │   ├── marketplace/   # eCommerce
│   │   └── portal/        # Portal-specific functionality
│   ├── helpers/           # requireTenantContext, audit log, notifications
│   ├── platform/          # Master admin, tenant provisioning, billing
│   ├── schema.ts          # Complete database schema definition
│   └── convex.json        # Convex configuration
│
├── landing/               # Next.js marketing site (edumyles.com root)
│   ├── src/
│   │   ├── app/           # Landing page routes
│   │   ├── components/    # Marketing components
│   │   └── lib/           # Landing page utilities
│   └── package.json       # Landing page dependencies
│
├── shared/                # Shared TypeScript types, constants, validators
│   ├── src/
│   │   ├── types/         # Shared types used by frontend + mobile + backend
│   │   ├── constants/     # Roles, tiers, modules, curriculum codes
│   │   └── validators/    # Shared Zod schemas
│   └── package.json       # Shared package configuration
│
├── infra/                 # Infrastructure config
│   ├── vercel/            # Vercel deployment configurations
│   ├── env-templates/     # .env.example — template for all environment variables
│   └── scripts/           # Deployment and maintenance scripts
│
├── docs/                  # Project documentation
│   ├── README.md           # Documentation index
│   ├── IMPLEMENTATION_PLAN.md    # Detailed implementation roadmap
│   ├── PROJECT_PROGRESS_ANALYSIS.md  # Current project status
│   ├── tech_spec.md       # Technical specifications
│   └── guides/             # User flows, build guides, action plans
│
├── .env.local             # Local environment variables (DO NOT COMMIT)
├── .gitignore            # Git ignore patterns
├── turbo.json            # Turbo monorepo configuration
├── vercel.json           # Vercel deployment configuration
├── package.json          # Root package.json with workspace configuration
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git** for version control
- **Convex account** (free tier available)
- **WorkOS account** (for authentication)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Mylesoft-Technologies/edumyles.git
cd edumyles

# 2. Install dependencies across all workspaces
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and configuration

# 4. Start the development environment
npm run dev
```

### Individual Service Development

```bash
# Frontend (port 3000)
npm run dev:frontend

# Convex backend
npm run dev:backend

# Landing page (port 3001)
npm run dev:landing

# Mobile app (requires Expo CLI)
npm run dev:mobile
```

### Environment Setup

1. **Convex Backend**
   ```bash
   cd convex
   npx convex dev
   # This will create a new Convex deployment and update your .env.local
   ```

2. **WorkOS Authentication**
   - Create a WorkOS account at https://dashboard.workos.com
   - Set up OAuth application with redirect URI: `http://localhost:3000/auth/callback`
   - Copy API key and Client ID to your `.env.local`

3. **Payment Gateways** (Optional for development)
   - M-Pesa: Create Daraja account at https://developer.safaricom.co.ke
   - Stripe: Create account at https://dashboard.stripe.com
   - Airtel Money: Create account at https://developers.airtel.africa

### Development Workflow

```bash
# Type checking across all packages
npm run type-check

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Clean build artifacts
npm run clean

# Build all packages
npm run build
```

## 🏗 Architecture Principles

### Multi-Tenancy
- **Tenant Isolation:** Every Convex query must call `requireTenantContext(ctx)` first
- **No Cross-Tenant Access:** `tenantId` is the first field on every table and every index
- **Data Segregation:** Each school operates in a completely isolated environment

### Security & Compliance
- **Secret Management:** Never committed to git — stored in GitHub org secrets and injected at build time
- **Role-Based Access:** Granular permissions for all user types (admin, teacher, student, parent)
- **Audit Logging:** All actions are logged with user context and timestamps
- **Data Privacy:** GDPR-compliant data handling and storage

### Performance & Scalability
- **Real-time Updates:** Convex provides instant data synchronization across all clients
- **Offline Support:** Critical functionality available even without internet connection
- **CDN Optimization:** Static assets served via Vercel's global CDN
- **Database Indexing:** Optimized queries for fast data retrieval

### Code Quality
- **TypeScript First:** Full type safety across frontend, backend, and mobile
- **Shared Types:** Common types and validators in `shared/` package
- **Component Reusability:** Modular UI components with consistent design system
- **Testing:** Comprehensive test coverage for critical business logic

## 🌐 Deployment

### Production Deployment

```bash
# Deploy all services to Vercel
npm run build
vercel --prod

# Deploy Convex backend
cd convex
npx convex deploy
```

### Environment Variables

Production environment variables are managed through:
- **Vercel Environment Variables** for frontend and landing page
- **Convex Environment Variables** for backend secrets
- **GitHub Organization Secrets** for CI/CD pipelines

### Domain Configuration

- **Landing Page:** `https://edumyles.com`
- **School Portals:** `https://{school}.edumyles.com`
- **API Endpoints:** `https://api.edumyles.com`
- **Mobile API:** `https://mobile-api.edumyles.com`

## 📚 Documentation

### Project Documentation
See [`docs/README.md`](docs/README.md) for the full index of project documents.

> 📌 **Important:** Documentation PDFs are stored securely and referenced via links, not committed to git.

### Key Documents
- **Product Requirements Document** - Complete feature specifications
- **System Architecture** - Technical architecture and infrastructure
- **Database Design** - Convex schema and data relationships
- **API Specification** - All backend endpoints and data structures
- **Implementation Plan** - Development roadmap and priorities
- **User Flows** - End-to-end user journey diagrams

### API Documentation
- **Convex Functions:** Auto-generated documentation in Convex dashboard
- **REST Endpoints:** Available in `docs/api/` directory
- **Mobile API:** Shared with web backend for consistency

## 🤝 Contributing

### Development Guidelines

1. **Branch Strategy:** Use feature branches from `develop`
2. **Code Reviews:** All PRs require review and approval
3. **Type Safety:** Ensure TypeScript compiles without errors
4. **Testing:** Write tests for new features and bug fixes
5. **Documentation:** Update docs for any API or feature changes

### Submitting Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run type-check
npm run lint
npm run test

# Commit and push
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name

# Create pull request
# Link to relevant issues and include screenshots
```

### Code Style

- **ESLint + Prettier:** Automatic formatting and linting
- **Conventional Commits:** Use semantic commit messages
- **Component Naming:** PascalCase for components, camelCase for functions
- **File Organization:** Group related files in appropriate directories

## 🔧 Troubleshooting

### Common Issues

**Convex Connection Issues**
```bash
# Restart Convex development server
cd convex
npx convex dev --force
```

**Environment Variable Issues**
```bash
# Verify environment variables
npm run env:check

# Reset environment
cp .env.example .env.local
```

**Build Issues**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Getting Help

- **Documentation:** Check `docs/` directory first
- **Issues:** Create GitHub issue with detailed description
- **Discussions:** Use GitHub Discussions for questions
- **Support:** Contact development team for urgent issues

## 📄 License

Proprietary — © Mylesoft Technologies. All rights reserved.

---

**EduMyles** - Empowering Education in East Africa Through Technology
