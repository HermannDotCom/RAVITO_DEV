// supabase/functions/create-team-member/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateMemberRequest {
  organizationId: string
  email: string
  password: string
  fullName: string
  phone?: string
  role: string
  customRoleId?: string
  allowedPages?: string[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ... corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ... corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body:  CreateMemberRequest = await req. json()
    const { organizationId, email, password, fullName, phone, role, customRoleId, allowedPages } = body

    // Validate required fields
    if (!organizationId || !email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields:  organizationId, email, password, fullName, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env. get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create Supabase client with user's token to verify permissions
    const supabaseUser = createClient(
      Deno. env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Get current user
    const { data: { user:  currentUser }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized:  Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has permission to add members to this organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', currentUser.id)
      .eq('organization_id', organizationId)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'You are not a member of this organization' }),
        { status: 403, headers:  { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only owners can add members
    if (membership.role !== 'owner' && membership.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Only organization owners can add members' }),
        { status: 403, headers:  { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check organization quota
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, type, max_members')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Count current members
    const { count:  memberCount, error: countError } = await supabaseAdmin
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (countError) {
      console.error('Error counting members:', countError)
      return new Response(
        JSON.stringify({ error: 'Failed to check member quota' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if ((memberCount ??  0) >= org.max_members) {
      return new Response(
        JSON.stringify({ error: `Member quota reached (${org.max_members} max)` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email already exists
    const { data:  existingUsers } = await supabaseAdmin. auth.admin.listUsers()
    const emailExists = existingUsers?. users?. some(u => u.email?. toLowerCase() === email.toLowerCase())
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the organization owner's role to determine the new member's role type
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', org.owner_id ??  currentUser.id)
      .single()

    const userRole = ownerProfile?. role || 'client'

    // Step 1: Create user in auth.users
    // The trigger 'handle_new_user' will automatically create the profile
    const { data: newUser, error: createUserError } = await supabaseAdmin. auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name:  fullName,
        name: fullName,
        phone:  phone || null,
        role: userRole, // This will be used by the trigger
      }
    })

    if (createUserError || !newUser. user) {
      console.error('Error creating auth user:', createUserError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createUserError?. message || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = newUser.user. id
    console.log('Auth user created successfully:', newUserId)

    // Step 2: Wait a moment for the trigger to create the profile
    // Then UPDATE the profile with additional information (not INSERT)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 3: Update the profile created by the trigger with additional fields
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        name: fullName,
        phone:  phone || null,
        email: email,
        role: userRole,
        is_active: true,
        is_approved: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', newUserId)

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      // Profile might not exist yet if trigger is slow, try upsert
      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUserId,
          full_name:  fullName,
          name: fullName,
          phone: phone || null,
          email: email,
          role: userRole,
          is_active: true,
          is_approved: true,
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (upsertError) {
        console.error('Error upserting profile:', upsertError)
        // Don't fail completely - the user was created, just log the error
      }
    }

    console.log('Profile updated successfully for user:', newUserId)

    // Step 4: Add user to organization_members
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: newUserId,
        email: email,
        role: role,
        status: 'active',
        is_active: true,
        custom_role_id: customRoleId || null,
        allowed_pages:  allowedPages || null,
        password_set_by_owner: true,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('Error adding organization member:', memberError)
      // Rollback:  delete the created user
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: `Failed to add member to organization: ${memberError. message}` }),
        { status: 500, headers: { ... corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Organization member added successfully')

    // Step 5: Send welcome email (optional, don't fail if email fails)
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (resendApiKey) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RAVITO <noreply@ravito.ci>',
            to: [email],
            subject: `Bienvenue dans l'équipe sur RAVITO`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #F97316, #EA580C); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                  .header h1 { color: white; margin: 0; font-size: 24px; }
                  .content { background: #fff; padding: 30px; border:  1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
                  .credentials { background: #f9fafb; padding: 20px; border-radius: 8px; margin:  20px 0; }
                  .credentials p { margin: 8px 0; }
                  .button { display: inline-block; background: #F97316; color:  white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
                  .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Bienvenue sur RAVITO !</h1>
                  </div>
                  <div class="content">
                    <p>Bonjour <strong>${fullName}</strong>,</p>
                    <p>Un compte a été créé pour vous sur la plateforme RAVITO.  Voici vos identifiants de connexion :</p>
                    
                    <div class="credentials">
                      <p><strong>📧 Email :</strong> ${email}</p>
                      <p><strong>🔑 Mot de passe : </strong> ${password}</p>
                    </div>
                    
                    <p>⚠️ Pour votre sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                    
                    <a href="https://ravito.ci" class="button">Se connecter</a>
                    
                    <div class="footer">
                      <p>RAVITO - Le ravitaillement qui ne dort jamais 🌙</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        })

        if (emailResponse.ok) {
          console.log('Welcome email sent successfully')
        } else {
          console.error('Failed to send welcome email:', await emailResponse.text())
        }
      } else {
        console.log('RESEND_API_KEY not configured, skipping welcome email')
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail the request if email fails
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Member created successfully',
        data: {
          userId: newUserId,
          email: email,
          fullName: fullName,
          role: role,
          organizationId: organizationId,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type':  'application/json' } }
    )
  }
})
