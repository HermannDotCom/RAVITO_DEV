# OrderMomentum System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DISTRI-NIGHT APP                              │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      CLIENT INTERFACE                           │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │         OrderMomentum Dashboard (Default View)            │  │ │
│  │  │                                                            │  │ │
│  │  │  [Suggestions Tab] [Heatmap Tab] [Achievements Tab]       │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │ │
│  │  │   Smart     │  │   Supply    │  │    Achievement       │   │ │
│  │  │ Suggestions │  │   Heatmap   │  │      Badges          │   │ │
│  │  │             │  │             │  │                      │   │ │
│  │  │  🧠 AI      │  │  🗺️ Live   │  │  🏆 Gamification     │   │ │
│  │  │  Time-based │  │  Real-time  │  │  6 Badge Types       │   │ │
│  │  │  History    │  │  Zone Data  │  │  Progress Tracking   │   │ │
│  │  │  Trends     │  │  Top Items  │  │  Unlock Animations   │   │ │
│  │  └─────────────┘  └─────────────┘  └──────────────────────┘   │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │                  AI Chatbot (Floating)                    │  │ │
│  │  │  💬 Conversational recommendations                        │  │ │
│  │  │  🔍 Keyword recognition                                   │  │ │
│  │  │  ⚡ Quick suggestions                                     │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │            Enhanced Payment Interface                     │  │ │
│  │  │  💳 Payment processing                                    │  │ │
│  │  │  🎉 Success celebration (confetti)                        │  │ │
│  │  │  🎁 Mystery bonus reveal                                  │  │ │
│  │  │  🏆 Achievement unlock                                    │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

                                  ↓ ↑
                         Data Flow & Services

┌─────────────────────────────────────────────────────────────────────┐
│                          SERVICES LAYER                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              orderMomentumService.ts                          │  │
│  │                                                                │  │
│  │  • getSmartOrderSuggestions()                                 │  │
│  │    - Time-of-day analysis                                     │  │
│  │    - Historical pattern detection                             │  │
│  │    - Zone trend analysis                                      │  │
│  │                                                                │  │
│  │  • generateMysteryBonus()                                     │  │
│  │    - 30% probability                                          │  │
│  │    - 5-15% discount range                                     │  │
│  │                                                                │  │
│  │  • getZoneDemandHeatmap()                                     │  │
│  │    - Last 2 hours of data                                     │  │
│  │    - Zone aggregation                                         │  │
│  │    - Product popularity                                       │  │
│  │                                                                │  │
│  │  • getChatbotRecommendation()                                 │  │
│  │    - Keyword matching                                         │  │
│  │    - Product suggestions                                      │  │
│  │                                                                │  │
│  │  • getPersonalizedGreeting()                                  │  │
│  │    - Time-based messages                                      │  │
│  │    - Contextual greetings                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              achievementService.ts                            │  │
│  │                                                                │  │
│  │  • checkAndUnlockAchievements()                               │  │
│  │    - Order analysis                                           │  │
│  │    - Criteria checking                                        │  │
│  │    - Badge unlocking                                          │  │
│  │                                                                │  │
│  │  • getUserAchievements()                                      │  │
│  │    - Fetch user badges                                        │  │
│  │    - Progress tracking                                        │  │
│  │                                                                │  │
│  │  • ACHIEVEMENTS constant                                      │  │
│  │    - 6 badge definitions                                      │  │
│  │    - Criteria thresholds                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

                                  ↓ ↑
                          Database Interactions

┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                             │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │     orders       │  │ user_achievements│  │    products      │  │
│  │                  │  │                  │  │                  │  │
│  │  • id            │  │  • id            │  │  • id            │  │
│  │  • client_id     │  │  • user_id       │  │  • name          │  │
│  │  • total_amount  │  │  • achievement   │  │  • category      │  │
│  │  • zone_id       │  │    _type         │  │  • brand         │  │
│  │  • created_at    │  │  • unlocked_at   │  │  • price         │  │
│  │  • paid_at       │  │  • created_at    │  │  • is_active     │  │
│  │  • status        │  │                  │  │  • image_url     │  │
│  │                  │  │  RLS enabled     │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   order_items    │  │      zones       │  │    profiles      │  │
│  │                  │  │                  │  │                  │  │
│  │  • order_id      │  │  • id            │  │  • id            │  │
│  │  • product_id    │  │  • name          │  │  • name          │  │
│  │  • quantity      │  │  • description   │  │  • role          │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

                                  ↓ ↑
                         Animation & UI Libraries

┌─────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL DEPENDENCIES                          │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  framer-motion   │  │ canvas-confetti  │  │    recharts      │  │
│  │                  │  │                  │  │                  │  │
│  │  • Animations    │  │  • Celebrations  │  │  • Charts        │  │
│  │  • Transitions   │  │  • Confetti      │  │  • Heatmap       │  │
│  │  • Gestures      │  │  • Effects       │  │  • Viz           │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘


USER FLOW DIAGRAM
═════════════════

Start → Login
         │
         ↓
    [Personalized Greeting]
         │
         ↓
    OrderMomentum Dashboard (Default)
         │
         ├─→ Smart Suggestions Tab
         │   • Time-based products
         │   • Historical favorites
         │   • Zone trends
         │   • Mystery bonus badge
         │
         ├─→ Supply Heatmap Tab
         │   • Live zone demand
         │   • Color-coded intensity
         │   • Top products per zone
         │   • Auto-refresh (2 min)
         │
         ├─→ Achievements Tab
         │   • Unlocked badges
         │   • Progress indicators
         │   • Badge descriptions
         │
         └─→ AI Chatbot (Always Available)
             • Product queries
             • Recommendations
             • Quick suggestions
         │
         ↓
    Browse Catalog / Add to Cart
         │
         ↓
    Checkout & Payment
         │
         ↓
    [Enhanced Payment Interface]
         │
         ├─→ Processing
         │
         └─→ Success!
             │
             ├─→ [Confetti Celebration]
             ├─→ [Badge Unlocks]
             └─→ [Mystery Bonus Reveal]


DATA FLOW DIAGRAM
═════════════════

User Action → Component → Service → Database → Response

Example: Smart Suggestions
─────────────────────────

User opens         SmartSuggestions     orderMomentumService     Database
Dashboard      →   Component        →   getSmartOrderSuggestions() → Query:
                                                                     - user orders
                                                                     - zone orders
                                                                     - products
                   ↓                    ↓                           ↓
                   Display              Process:                    Return:
                   suggestions   ←      • Time analysis             - order history
                                        • Frequency calc            - zone trends
                                        • Zone trends               - product data
                                        • Confidence score

Example: Achievement Unlock
───────────────────────────

Payment           EnhancedPayment      achievementService       Database
Success       →   Interface       →    checkAndUnlock()     →   Query:
                                                                 - user orders
                  ↓                    ↓                        - existing badges
                  Show                 Analyze:                 ↓
                  celebration   ←      • Order count            Insert:
                  + badges             • Time of order          - new badges
                                       • Amount
                                       • Zone count


ENGAGEMENT PSYCHOLOGY
═══════════════════════

Variable Rewards (Mystery Bonus)
↓
"Will I get a discount this time?"
↓
Anticipation & Excitement

Progress Tracking (Badges)
↓
"I'm 3 orders away from Consistent King!"
↓
Motivation & Achievement

Social Proof (Heatmap)
↓
"Everyone in my zone is ordering this!"
↓
FOMO & Peer Influence

Instant Gratification (Confetti)
↓
"That was satisfying!"
↓
Positive Reinforcement

Personalization (Greetings & AI)
↓
"This app understands me!"
↓
Emotional Connection

Gamification (Multiple Badges)
↓
"I want to unlock them all!"
↓
Collection Completion Drive
```

## Component Interaction Map

```
OrderMomentumDashboard
├── PersonalizedGreeting (appears on mount)
├── Tab System
│   ├── SmartSuggestions
│   │   ├── Uses: orderMomentumService.getSmartOrderSuggestions()
│   │   ├── Uses: orderMomentumService.generateMysteryBonus()
│   │   └── Integrates: useCart.addToCart()
│   │
│   ├── SupplyHeatmap
│   │   ├── Uses: orderMomentumService.getZoneDemandHeatmap()
│   │   ├── Auto-refresh: setInterval(2 min)
│   │   └── Color coding: intensity calculation
│   │
│   └── AchievementList
│       ├── Uses: achievementService.getUserAchievements()
│       └── Component: AchievementBadge (per badge)
│
└── AIChatbot (floating, always visible)
    ├── Uses: orderMomentumService.getChatbotRecommendation()
    ├── Keyword matching
    └── Product display

EnhancedPaymentInterface
├── Wraps: PaymentInterface (existing)
└── On Success:
    ├── Calls: achievementService.checkAndUnlockAchievements()
    ├── Calls: orderMomentumService.generateMysteryBonus()
    └── Shows: OrderCelebration
        ├── Canvas-confetti animation
        ├── Badge reveal
        └── Mystery bonus reveal
```

## Key Technologies

| Technology | Purpose | Usage |
|------------|---------|-------|
| **Framer Motion** | Animations | All transitions, entrance/exit animations |
| **Canvas Confetti** | Celebrations | Order success confetti effect |
| **Recharts** | Visualizations | Heatmap and future charts |
| **React Hooks** | State Management | useState, useEffect, useCallback |
| **Supabase** | Database | Orders, achievements, products queries |
| **TypeScript** | Type Safety | All components and services typed |

## Performance Optimization Strategy

1. **Lazy Loading**: Components load on-demand
2. **Memoization**: useMemo for expensive calculations
3. **useCallback**: Prevent function recreation
4. **Debouncing**: Chatbot input (future)
5. **Auto-refresh Intervals**: Controlled update frequency
6. **Database Indexes**: Fast queries on user_id, achievement_type
7. **RLS Policies**: Security without performance hit

---

Built with ❤️ for DISTRI-NIGHT
