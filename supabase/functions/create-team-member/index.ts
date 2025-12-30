import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMemberRequest {
  organizationId: string;
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  role: string;
  allowedPages?: string[];
  customRoleId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user has permission to create members
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: CreateMemberRequest = await req.json();
    const { 
      organizationId, 
      email, 
      fullName, 
      phone, 
      password, 
      role,
      allowedPages,
      customRoleId
    } = body;

    // Validate required fields
    if (!organizationId || !email || !fullName || !password || !role) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Verify user has permission to create members in this organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, owner_id, type')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Organization not found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Check if user is owner or has team management permissions
    const isOwner = orgData.owner_id === user.id;
    if (!isOwner) {
      // Check if user has team management permissions
      const { data: memberData } = await supabaseAdmin
        .from('organization_members')
        .select('id, role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!memberData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Unauthorized to create members' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(u => u.email === email);

    if (emailExists) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Un utilisateur avec cet email existe déjà' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      }
    });

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors de la création de l\'utilisateur' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: fullName,
        phone: phone || null,
        email: email,
        role: orgData.type,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors de la création du profil' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Create organization member
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: newUser.user.id,
        email: email,
        role: role,
        status: 'active',
        is_active: true,
        password_set_by_owner: true,
        accepted_at: new Date().toISOString(),
        custom_role_id: customRoleId || null,
        allowed_pages: allowedPages || null,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating member:', memberError);
      // If member creation fails, clean up user and profile
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      await supabaseAdmin.from('profiles').delete().eq('id', newUser.user.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors de la création du membre' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Send welcome email via send-email function
    try {
      const { data: orgName } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          type: 'welcome_member',
          to: email,
          data: {
            memberName: fullName,
            organizationName: orgName?.name || 'RAVITO',
            email: email,
            password: password,
            role: role,
          }
        }
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the operation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: memberData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-team-member function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
