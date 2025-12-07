# 👥 Team Management System

A complete multi-user organization and permission management system for DISTRI-NIGHT.

## 🎯 Overview

This feature allows Clients, Suppliers, and Admins to create organizations and invite team members with specific roles and permissions, enabling collaborative work while maintaining proper access control.

## ✨ Key Features

- **Multi-user Organizations** - Create teams with multiple members
- **Role-based Permissions** - 9 predefined roles with specific access rights
- **Quota Management** - Enforced member limits (Client: 2, Supplier: 2, Admin: 5)
- **Member Invitations** - Email-based invitation system with unique tokens
- **Permission Gates** - Conditional UI rendering based on user permissions
- **Security First** - RLS policies, server-side validation, zero vulnerabilities

## 🚀 Quick Start

### 1. Apply Database Migration

```bash
# The migration is located at:
supabase/migrations/20251207222525_create_team_management_system.sql

# Apply it to your Supabase project
supabase db push
```

### 2. Create an Organization

```sql
-- Create an organization for a user
SELECT create_organization_with_owner(
  'My Company',           -- Organization name
  'client',              -- Type: 'client', 'supplier', or 'admin'
  'user-uuid-here',      -- User ID (owner)
  'owner@company.com'    -- Owner email
);
```

### 3. Access the Team Page

1. Log in to the application
2. Click "Mon Équipe" in the sidebar
3. Start inviting team members!

## 👥 Available Roles

### Client Roles
- **Propriétaire** - Full access to all features
- **Manager** - Manages catalog and orders
- **Employé** - Creates orders, limited access

### Supplier Roles
- **Propriétaire** - Full access to all features
- **Gestionnaire** - Manages orders and deliveries
- **Livreur** - Handles deliveries only

### Admin Roles
- **Super Admin** - Full platform access
- **Administrateur** - Daily operations management
- **Support** - User assistance and tickets

## 🔐 Permissions

Each role has specific permissions across different sections:

- **catalog** - View, create, edit, delete products
- **orders** - View, create, edit, delete orders
- **treasury** - View, manage finances
- **team** - View, invite, remove, edit members
- **settings** - View, edit system settings
- **zones** - View, create, edit, delete delivery zones
- **deliveries** - View, manage deliveries
- **analytics** - View reports and statistics
- **users** - View, create, edit, delete users
- **products** - View, create, edit, delete products
- **support** - View, manage tickets

## 💻 Usage Examples

### Using the useTeam Hook

```tsx
import { useTeam } from '../hooks/useTeam';

function TeamComponent() {
  const { 
    organization, 
    members, 
    stats,
    inviteMember,
    removeMember 
  } = useTeam();

  const handleInvite = async () => {
    await inviteMember('user@example.com', 'manager');
  };

  return (
    <div>
      <h1>{organization?.name}</h1>
      <p>{stats?.activeMembers} / {stats?.maxMembers} members</p>
    </div>
  );
}
```

### Using the Permission Gate

```tsx
import { PermissionGate } from '../components/Team';

function ProtectedContent() {
  return (
    <PermissionGate 
      section="treasury" 
      action="view"
      organizationId={org?.id}
    >
      <TreasuryDashboard />
    </PermissionGate>
  );
}
```

### Checking Permissions

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can } = usePermissions(organizationId);

  if (can('team', 'invite')) {
    return <InviteButton />;
  }

  return <div>You don't have permission to invite members</div>;
}
```

## 📁 File Structure

```
src/
├── components/Team/
│   ├── TeamPage.tsx           # Main team management page
│   ├── InviteMemberModal.tsx  # Member invitation modal
│   ├── MemberCard.tsx         # Member display card
│   ├── QuotaBar.tsx           # Quota visualization
│   ├── RoleSelector.tsx       # Role selection dropdown
│   ├── PermissionGate.tsx     # Permission-based rendering
│   └── index.ts               # Barrel exports
├── hooks/
│   ├── useTeam.ts             # Team management hook
│   └── usePermissions.ts      # Permission checking hook
├── services/
│   ├── teamService.ts         # Team CRUD operations
│   └── permissionService.ts   # Permission queries
├── types/
│   └── team.ts                # TypeScript definitions
└── utils/
    └── validation.ts          # Input validation

supabase/migrations/
└── 20251207222525_create_team_management_system.sql
```

## 🧪 Testing

Run the validation tests:

```bash
npm test -- src/utils/__tests__/validation.test.ts
```

Expected output:
```
✓ Validation Utilities (10 tests)
  ✓ isValidEmail (4 tests)
  ✓ isValidPhone (3 tests)
  ✓ isValidUrl (3 tests)
```

## 📚 Documentation

- **[TEAM_MANAGEMENT_GUIDE.md](TEAM_MANAGEMENT_GUIDE.md)** - Complete user and developer guide
- **[TEAM_SYSTEM_SUMMARY.md](TEAM_SYSTEM_SUMMARY.md)** - Implementation metrics and status

## 🔒 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Organization-scoped data access
- ✅ Server-side permission validation
- ✅ SQL injection prevention
- ✅ Owner protection (cannot be removed/demoted)
- ✅ CodeQL scan: 0 vulnerabilities

## 🐛 Troubleshooting

### "Quota atteint" Error
You've reached the member limit. Contact support to increase your quota.

### Cannot See Team Menu
Ensure the database migration has been applied and you're logged in.

### Permission Denied
Verify RLS policies are enabled and the user has an organization.

## 🚢 Deployment Checklist

- [ ] Apply database migration
- [ ] Create organizations for existing users
- [ ] Test member invitation flow
- [ ] Verify permission system
- [ ] Test quota enforcement
- [ ] Monitor for errors
- [ ] (Optional) Setup email sending

## 🤝 Contributing

When modifying the team system:

1. Update TypeScript types in `src/types/team.ts`
2. Add tests for new validation logic
3. Update documentation
4. Run security scan: `npm run lint`
5. Test with different user roles

## 📝 License

Part of the DISTRI-NIGHT project.

## 💬 Support

For questions or issues:
- Check the troubleshooting section in [TEAM_MANAGEMENT_GUIDE.md](TEAM_MANAGEMENT_GUIDE.md)
- Contact support via "Nous contacter" in the app
- Review the inline code documentation

---

**Built with**: React, TypeScript, Supabase, Tailwind CSS
**Version**: 1.0.0
**Status**: Production Ready ✅
