# Kanghan POS (ຮ້ານຄ້ວ້ານຄານ)

Modern Point of Sale system for restaurants built with Next.js 16, Prisma, and MySQL.

## Features

- 🍽️ **Table Management** - Open/close tables with guest count tracking
- 📝 **Order Taking** - Multi-round ordering with item notes
- 👨‍🍳 **Kitchen Display System (KDS)** - Separate screens for Kitchen, Cafe, and Water stations
- 💰 **Checkout & Payment** - Cash and QR payment methods with discount support
- 📊 **Admin Dashboard** - Menu management, user management, reports with charts
- 📜 **Order History** - View and print receipts for past orders
- 🔐 **PIN Authentication** - Role-based access control (Admin, Server, Kitchen, Cafe, Water)
- 🌐 **Lao Language UI** - Full support for Lao language
- 💵 **LAK Currency** - Formatted for Lao Kip

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router + Turbopack)
- **Language**: TypeScript
- **Database**: MySQL 8.0 with Prisma ORM 5.22
- **Authentication**: JWT + bcrypt PIN-based auth
- **Styling**: TailwindCSS
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL 8.0
- Docker & Docker Compose (for production)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/tay1862/kanghan_pos.git
cd kanghan_pos
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Setup database**
```bash
# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

6. **Access the application**
- Open http://localhost:3000/kanghan/login
- Use PIN `1234` for Admin access

### Default PINs (from seed data)

- **Admin**: 1234
- **Server**: 2222, 3333
- **Kitchen**: 4444, 5555
- **Cafe**: 6666
- **Water**: 7777

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Clone on VPS**
```bash
git clone https://github.com/tay1862/kanghan_pos.git
cd kanghan_pos
```

2. **Create production environment file**
```bash
cp .env.example .env.production
# Edit .env.production with production values
```

3. **Set environment variables**
```bash
export MYSQL_ROOT_PASSWORD=your_secure_root_password
export MYSQL_PASSWORD=your_secure_password
export JWT_SECRET=your_super_secret_jwt_key_min_32_characters
export NEXT_PUBLIC_APP_URL=https://your-domain.com
```

4. **Deploy using script**
```bash
./deploy.sh production
```

Or manually:
```bash
docker-compose up -d --build
```

5. **Health check**
```bash
./health-check.sh https://your-domain.com
```

### Option 2: Manual VPS Setup

1. **Install Node.js 20+**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install MySQL 8.0**
```bash
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

3. **Clone and setup**
```bash
git clone https://github.com/tay1862/kanghan_pos.git
cd kanghan_pos
npm ci
npx prisma generate
```

4. **Build application**
```bash
npm run build
```

5. **Run migrations and seed**
```bash
npx prisma migrate deploy
npx prisma db seed
```

6. **Start with PM2**
```bash
npm install -g pm2
pm2 start npm --name "kanghan-pos" -- start
pm2 save
pm2 startup
```

## CI/CD with GitHub Actions

The repository includes automated deployment via GitHub Actions.

### Setup GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `VPS_HOST`: Your VPS IP address or domain
- `VPS_USERNAME`: SSH username (e.g., root or ubuntu)
- `VPS_SSH_KEY`: Private SSH key for authentication
- `VPS_PORT`: SSH port (default: 22)
- `VPS_APP_URL`: Full application URL (e.g., https://pos.yourdomain.com)

### Automatic Deployment

Push to `main` or `master` branch triggers automatic deployment:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

GitHub Actions will:
1. Run TypeScript checks
2. Run ESLint
3. Build the application
4. Deploy to VPS via SSH
5. Restart Docker containers
6. Run health checks

## Project Structure

```
kanghan_pos/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── [slug]/        # Restaurant-specific routes
│   │   │   ├── login/     # PIN login
│   │   │   ├── tables/    # Table management
│   │   │   ├── order/     # Order taking
│   │   │   ├── checkout/  # Payment
│   │   │   ├── kitchen/   # Kitchen KDS
│   │   │   ├── cafe/      # Cafe KDS
│   │   │   ├── water/     # Water KDS
│   │   │   └── admin/     # Admin dashboard
│   │   └── api/           # API routes
│   └── lib/               # Utilities
├── Dockerfile             # Production Docker image
├── docker-compose.yml     # Docker orchestration
├── deploy.sh             # Deployment script
└── health-check.sh       # Health check script
```

## API Endpoints

### Authentication
- `POST /api/[slug]/auth/login` - PIN login
- `POST /api/[slug]/auth/logout` - Logout

### Tables
- `GET /api/[slug]/tables` - List tables
- `POST /api/[slug]/tables/open` - Open table

### Orders
- `GET /api/[slug]/orders/[orderId]` - Get order details
- `POST /api/[slug]/orders/[orderId]/rounds` - Create new round
- `POST /api/[slug]/orders/[orderId]/pay` - Process payment

### KDS
- `GET /api/[slug]/kds/[station]` - Get KDS items (kitchen/cafe/water)
- `PATCH /api/[slug]/order-items/[itemId]/status` - Update item status

### Admin
- `GET /api/[slug]/admin/menu` - List menu items
- `GET /api/[slug]/admin/orders` - Order history
- `GET /api/[slug]/admin/reports` - Sales reports

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/kanghan_pos` |
| `JWT_SECRET` | Secret for JWT tokens | Min 32 characters |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NODE_ENV` | Environment | `production` or `development` |

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
docker-compose ps

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Application Not Starting
```bash
# View application logs
docker-compose logs app

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### Migration Issues
```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Deploy pending migrations
npx prisma migrate deploy
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
