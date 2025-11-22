# DISTRI-NIGHT Production Excellence Framework
## Deployment and Operations Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Monitoring Services](#monitoring-services)
4. [Dashboard Access](#dashboard-access)
5. [Alert Configuration](#alert-configuration)
6. [Testing Strategy](#testing-strategy)
7. [CI/CD Integration](#cicd-integration)
8. [Operational Procedures](#operational-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Metrics Reference](#metrics-reference)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file:
```env
# Sentry Configuration (Optional)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Monitoring Configuration
VITE_ENABLE_MONITORING=true
VITE_MONITORING_SAMPLE_RATE=0.1

# Supabase Configuration (Existing)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Tests
```bash
# Unit and integration tests
npm test

# E2E tests
npm run test:e2e

# Install Playwright browsers (first time only)
npm run playwright:install
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Environment Setup

### Development Environment
- **Node.js:** 18+ required
- **Package Manager:** npm or yarn
- **Testing:** Vitest + Playwright
- **Build Tool:** Vite

### Production Environment
- **Hosting:** Vercel, Netlify, or any static hosting
- **Backend:** Supabase (already configured)
- **Monitoring:** Sentry.io (optional)
- **CDN:** CloudFlare or similar

## Monitoring Services

### 1. Error Tracking (Sentry)
Captures and tracks all errors in production.

**Setup:**
```typescript
import { initializeMonitoring } from './services/monitoring';

initializeMonitoring({
  sentry: {
    dsn: process.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  }
});
```

**Usage:**
```typescript
import { captureException } from './services/monitoring/errorTracking';

try {
  // Your code
} catch (error) {
  captureException(error, { 
    userId: user.id,
    action: 'place_order' 
  });
}
```

### 2. Performance Monitoring
Tracks Web Vitals and user experience.

**Metrics Tracked:**
- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

**Access Metrics:**
```typescript
import { performanceMonitoring } from './services/monitoring/performanceMonitoring';

const metrics = performanceMonitoring.getMetrics();
const uxScore = performanceMonitoring.calculateUXScore();
const rating = performanceMonitoring.getPerformanceRating();
```

### 3. Database Performance Monitoring
Tracks query performance and provides optimization recommendations.

**Usage:**
```typescript
import { dbPerformanceMonitoring } from './services/monitoring/databaseMonitoring';

// Wrap database queries
const orders = await dbPerformanceMonitoring.trackQuery(
  'fetch_user_orders',
  () => supabase.from('orders').select('*').eq('user_id', userId)
);

// Get health report
const health = await dbPerformanceMonitoring.getDatabaseHealth();
console.log(`Database status: ${health.status}`);

// Get optimization recommendations
const recommendations = dbPerformanceMonitoring.getOptimizationRecommendations();
```

### 4. Business Metrics
Tracks KPIs and business health.

**Available Metrics:**
```typescript
import { businessMetrics } from './services/monitoring/businessMetrics';

// Revenue metrics
const revenue = await businessMetrics.getRevenueMetrics();
console.log(`Today's revenue: ${revenue.today} FCFA`);

// Transaction metrics
const transactions = await businessMetrics.getTransactionMetrics();
console.log(`Success rate: ${transactions.successRate}%`);

// Comprehensive report
const report = await businessMetrics.getBusinessHealthReport();
```

### 5. Alert Manager
Manages alerts and notifications.

**Severity Levels:**
- **P0 (Critical):** System down, requires immediate paging
- **P1 (High):** Degraded performance, team alert
- **P2 (Medium):** Warning, investigation needed
- **P3 (Low):** Info, ticket creation

**Usage:**
```typescript
import { alertManager } from './services/monitoring/alertManager';

// Check metric against thresholds
alertManager.checkMetric('error_rate', 2.5);

// Create custom alert
alertManager.createAlert({
  severity: 'P1',
  title: 'High Memory Usage',
  message: 'Server memory usage exceeded 80%',
  context: { server: 'web-01', usage: 85 }
});

// Get active alerts
const alerts = alertManager.getActiveAlerts();

// Acknowledge/resolve alerts
alertManager.acknowledgeAlert(alertId, 'john@example.com');
alertManager.resolveAlert(alertId, 'john@example.com', 'Restarted server');
```

## Dashboard Access

### Executive Dashboard
For CEO, Founders, Leadership.

**Metrics:**
- Revenue (today, week, month)
- Active users
- System health (99.8% uptime)
- NPS score
- Growth trends

**Implementation:**
```typescript
import { ExecutiveDashboard } from './components/Monitoring/ExecutiveDashboard';

function AdminPanel() {
  return (
    <div>
      <h1>Leadership Overview</h1>
      <ExecutiveDashboard />
    </div>
  );
}
```

### Operations Dashboard
For DevOps, SRE, Engineering.

**Metrics:**
- Error rate (target: <1%)
- API response time (P95)
- Database health
- Web Vitals (LCP, INP, CLS)
- Active alerts
- System performance

**Implementation:**
```typescript
import { OperationsDashboard } from './components/Monitoring/OperationsDashboard';

function OpsPanel() {
  return (
    <div>
      <h1>System Operations</h1>
      <OperationsDashboard />
    </div>
  );
}
```

## Alert Configuration

### Default Thresholds

```typescript
// P0 - Critical (Page on-call)
{
  error_rate: > 2%,
  payment_success: < 99%
}

// P1 - High (Slack alert)
{
  error_rate: > 1%,
  p95_latency: > 500ms,
  page_load_time: > 3000ms
}

// P2 - Medium (Investigation)
{
  db_connection_pool: > 80%,
  cache_hit_rate: < 70%
}
```

### Custom Thresholds

```typescript
import { alertManager } from './services/monitoring/alertManager';

// Add custom threshold
alertManager.addThreshold({
  metric: 'api_calls_per_minute',
  condition: 'gt',
  value: 1000,
  severity: 'P2',
  message: 'High API call rate detected'
});

// Remove threshold
alertManager.removeThreshold('api_calls_per_minute', 'P2');
```

## Testing Strategy

### Unit Tests (13 tests)
```bash
npm test
```

Tests for contexts and utilities.

### Integration Tests (55 tests)
```bash
npm test
```

Tests for:
- Business metrics calculations (14 tests)
- Database performance monitoring (18 tests)
- Alert management (23 tests)

### E2E Tests (15+ scenarios)
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

**E2E Test Suites:**
1. **Client Order Flow** - Browse → Order → Payment → Tracking
2. **Supplier Fulfillment** - View → Offer → Accept → Deliver
3. **Admin Management** - Users → Analytics → Settings

### Performance Tests
E2E tests include performance monitoring:
- Dashboard load: < 5 seconds
- Order list load: < 3 seconds
- Page transitions: < 1 second

## CI/CD Integration

### GitHub Actions Workflow
Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run unit tests
        run: npm test
        
      - name: Run build
        run: npm run build
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:5173
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Your deployment commands
          echo "Deploying to production..."
```

### Quality Gates

**Pre-merge Requirements:**
- ✅ All tests passing
- ✅ No ESLint errors
- ✅ TypeScript compilation successful
- ✅ Build successful
- ✅ Code coverage > 80% (optional)

## Operational Procedures

### Daily Checks
- [ ] Review active alerts (< 5 minutes)
- [ ] Check error rate trend (target: <0.5%)
- [ ] Monitor system health (target: 99.9% uptime)

### Weekly Tasks
- [ ] Review slow query reports
- [ ] Analyze performance trends
- [ ] Update optimization recommendations
- [ ] Clear old resolved alerts

### Monthly Tasks
- [ ] Review alert thresholds
- [ ] Update runbooks
- [ ] Analyze cost optimization
- [ ] Review business metrics trends
- [ ] Conduct performance audit

### Incident Response

**P0 (Critical) - < 15 min MTTR:**
1. Page on-call engineer
2. Assess impact
3. Implement hotfix or rollback
4. Communicate to stakeholders
5. Post-incident review within 24h

**P1 (High) - < 1 hour MTTR:**
1. Alert team via Slack
2. Investigate root cause
3. Implement fix
4. Monitor for resolution
5. Document learnings

**P2 (Medium) - < 4 hours MTTR:**
1. Create investigation ticket
2. Analyze metrics
3. Plan fix
4. Implement and test
5. Deploy fix

## Troubleshooting

### Common Issues

#### 1. High Error Rate
**Symptom:** Error rate > 1%

**Actions:**
```bash
# Check recent errors in Sentry
# Review error logs
# Check alert context for specific errors
```

**Common Causes:**
- API endpoint down
- Database connection issues
- Third-party service failure

#### 2. Slow Database Queries
**Symptom:** P95 latency > 500ms

**Actions:**
```typescript
// Check slow queries
const slowQueries = dbPerformanceMonitoring.getSlowQueries(500);
console.log(slowQueries);

// Get optimization recommendations
const recommendations = dbPerformanceMonitoring.getOptimizationRecommendations();
```

**Common Fixes:**
- Add database indexes
- Optimize query joins
- Implement caching

#### 3. Low Cache Hit Rate
**Symptom:** Cache hit rate < 70%

**Actions:**
```typescript
// Check cache metrics
const cache = dbPerformanceMonitoring.getCacheMetrics();
console.log(`Hit rate: ${cache.hitRate}%`);
```

**Common Fixes:**
- Adjust cache TTL
- Increase cache size
- Review cache invalidation strategy

## Metrics Reference

### Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| INP | < 200ms | 200ms - 500ms | > 500ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |

### Business Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Transaction Success Rate | > 99% | < 98% |
| Average Response Time | < 250ms | > 500ms |
| Error Rate | < 0.5% | > 1% |
| Uptime | > 99.9% | < 99.5% |
| NPS Score | > 70 | < 50 |
| Churn Rate | < 3% | > 5% |

### Database Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Average Query Duration | < 100ms | > 200ms |
| P95 Query Duration | < 250ms | > 500ms |
| Query Success Rate | > 99% | < 98% |
| Cache Hit Rate | > 80% | < 70% |
| Connection Pool Usage | < 70% | > 80% |

## Support and Resources

### Documentation
- [MONITORING_FRAMEWORK.md](./MONITORING_FRAMEWORK.md) - Complete framework documentation
- [README.md](./README.md) - Project overview
- [QUICK_ACCESS.md](./QUICK_ACCESS.md) - Quick access guide

### External Resources
- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals](https://web.dev/vitals/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

### Contact
For issues or questions:
1. Check this documentation
2. Review [GitHub Issues](https://github.com/HermannDotCom/DISTRI-NIGHT/issues)
3. Contact DevOps team

---

**Last Updated:** 2025-11-22
**Version:** 1.0.0
**Status:** Production Ready ✅
