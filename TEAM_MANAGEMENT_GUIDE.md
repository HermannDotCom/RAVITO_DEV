# Team Management System - Implementation Guide

## Overview

The team management system allows Clients, Suppliers, and Admins to create organizations and invite team members with specific roles and permissions. This feature enables collaborative work while maintaining proper access control.

## Features

- **Multi-user Organizations**: Create organizations with multiple members
- **Role-based Access Control**: Predefined roles with specific permissions
- **Quota Management**: Enforced member limits (Client: 2, Supplier: 2, Admin: 5)
- **Invitation System**: Email-based member invitations
- **Permission Gates**: UI elements that respect user permissions
- **Real-time Updates**: Database changes reflected immediately

## Database Setup

### Migration

Apply the migration to your Supabase database:

```bash
# The migration file is located at:
supabase/migrations/20251207222525_create_team_management_system.sql
```

This creates:
- `organizations` table
- `organization_members` table
- `role_permissions` table (with seeded data)
- SQL functions for permission checks
- RLS policies for security

### Creating an Organization

When a user registers, you can create their organization automatically using the SQL function:

```sql
SELECT create_organization_with_owner(
  'My Organization Name',
  'client', -- or 'supplier', 'admin'
  'user-uuid-here',
  'user@email.com'
);
```

## User Roles and Permissions

### Client Roles

1. **Propriétaire (Owner)**
   - Full access to all features
   - Can manage team members
   - Can view and manage treasury
   - Can modify settings

2. **Manager**
   - Can manage catalog and orders
   - Can view treasury (read-only)
   - Cannot manage team or settings

3. **Employé (Employee)**
   - Can view catalog
   - Can create orders
   - Limited read-only access

### Supplier Roles

1. **Propriétaire (Owner)**
   - Full access to all features
   - Can manage zones and team
   - Can manage deliveries and treasury
   - Has access to analytics

2. **Gestionnaire (Manager)**
   - Can manage orders and deliveries
   - Can view and edit zones
   - Can view analytics
   - Cannot manage treasury or team

3. **Livreur (Driver)**
   - Can manage assigned deliveries
   - Limited to delivery operations
   - No access to treasury or analytics

### Admin Roles

1. **Super Admin**
   - Full platform access
   - Can manage all users and data
   - Can manage team and settings

2. **Administrateur (Administrator)**
   - Can manage daily operations
   - Can manage users and orders
   - Cannot delete critical data

3. **Support**
   - Can view users and orders
   - Can manage support tickets
   - Limited to support operations

## Using the Team Page

### Accessing the Team Page

1. Log in to your account
2. Click on "Mon Équipe" in the sidebar
3. View your organization's members

### Inviting a Member

1. Click the "Inviter" button
2. Enter the member's email address
3. Select their role from the dropdown
4. Click "Inviter" to send the invitation

**Note**: The system checks quota before allowing invitations. If you've reached your limit, the invite button will be disabled.

### Managing Members

- **Edit Role**: Click the menu (⋮) on a member card and select "Modifier le rôle"
- **Remove Member**: Click the menu (⋮) and select "Retirer du groupe"

**Note**: You cannot edit or remove the organization owner.

## Using Permission Gates in Code

The `PermissionGate` component allows you to conditionally render UI based on permissions:

```tsx
import { PermissionGate } from '../components/Team';

<PermissionGate 
  section="treasury" 
  action="view"
  organizationId={organization?.id}
>
  <TreasuryContent />
</PermissionGate>
```

## Using the Hooks

### useTeam Hook

```tsx
import { useTeam } from '../hooks/useTeam';

function MyComponent() {
  const { 
    organization, 
    members, 
    stats, 
    isLoading,
    inviteMember,
    removeMember,
    updateMemberRole 
  } = useTeam();

  // Invite a member
  const handleInvite = async () => {
    const success = await inviteMember('user@example.com', 'manager');
    if (success) {
      console.log('Member invited successfully');
    }
  };
}
```

### usePermissions Hook

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can, permissions, isLoading } = usePermissions(organizationId);

  if (can('treasury', 'view')) {
    // User can view treasury
  }
}
```

## API Reference

### TeamService

```typescript
// Get user's organization
getOrganization(userId: string): Promise<Organization | null>

// Get organization members
getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>

// Invite a member
inviteMember(orgId: string, email: string, role: MemberRole): Promise<Result>

// Remove a member
removeMember(memberId: string): Promise<Result>

// Update member role
updateMemberRole(memberId: string, newRole: MemberRole): Promise<Result>

// Accept invitation
acceptInvitation(token: string, userId: string): Promise<Result>

// Get team statistics
getTeamStats(orgId: string): Promise<TeamStats>
```

### PermissionService

```typescript
// Get user permissions
getUserPermissions(userId: string, orgId: string): Promise<Permissions>

// Check specific permission
hasPermission(userId: string, orgId: string, section: string, action: PermissionAction): Promise<boolean>

// Get role permissions
getRolePermissions(orgType: OrganizationType, role: MemberRole): Promise<RolePermission | null>

// Get available roles
getAvailableRoles(orgType: OrganizationType): Promise<RolePermission[]>
```

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS enabled with policies that enforce organization boundaries
2. **Permission Checks**: Always verify permissions on both client and server side
3. **Owner Protection**: Owners cannot be removed or have their role changed
4. **Quota Enforcement**: Server-side function ensures quota limits are respected

## Testing Checklist

- [ ] Create an organization for each user type (client, supplier, admin)
- [ ] Invite members with different roles
- [ ] Verify quota enforcement (try inviting more than allowed)
- [ ] Test role updates
- [ ] Test member removal
- [ ] Verify permission gates work correctly
- [ ] Test with multiple organizations
- [ ] Verify RLS policies prevent unauthorized access

## Troubleshooting

### Issue: "Quota atteint" when inviting members

**Solution**: You've reached your organization's member limit. Contact support to increase your quota.

### Issue: Cannot see team menu item

**Solution**: Ensure you're logged in and the migration has been applied to the database.

### Issue: Permission denied errors

**Solution**: Check that RLS policies are enabled and the user is properly associated with an organization.

### Issue: Invitation emails not being sent

**Note**: Email sending requires additional setup with Supabase Edge Functions or an external email service. The invitation token is stored in the database for manual acceptance or future implementation.

## Future Enhancements

Potential improvements for post-MVP:

1. **Email Integration**: Implement automated invitation emails using Supabase Edge Functions
2. **Custom Roles**: Allow organizations to create custom roles with specific permissions
3. **Activity Log**: Track member actions for audit purposes
4. **Quota Upgrades**: Allow organizations to purchase additional member slots
5. **Member Profiles**: Enhanced member information and avatars
6. **Two-Factor Authentication**: Additional security for team members
7. **Bulk Invitations**: Invite multiple members at once via CSV upload

## Support

For questions or issues with the team management system, please contact support through the "Nous contacter" menu item in the application.
