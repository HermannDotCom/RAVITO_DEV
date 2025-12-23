import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendNotificationRequest {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const request: SendNotificationRequest = await req.json();
    const { userId, type, title, body, data, channels } = request;

    if (!userId || !type || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get user notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no preferences exist, use defaults
    const userPrefs = preferences || {
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
    };

    // 2. Check if notification type is enabled for this user
    const notificationTypeKey = `notify_${type.replace(/-/g, '_')}`;
    if (userPrefs[notificationTypeKey] === false) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification not sent - disabled by user preferences',
          sent: { push: false, email: false, sms: false }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      push: false,
      email: false,
      sms: false,
      database: false
    };

    // 3. Store notification in database
    try {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message: body,
          data: data || {},
          is_read: false
        });

      if (!insertError) {
        results.database = true;
      } else {
        console.error('Error inserting notification:', insertError);
      }
    } catch (err) {
      console.error('Exception inserting notification:', err);
    }

    // 4. Send push notification if enabled
    if ((channels?.push ?? true) && userPrefs.push_enabled) {
      // TODO: Implement web push notification sending
      // This requires:
      // 1. Retrieve push subscriptions for the user
      // 2. Use web-push library to send notifications
      // 3. Handle expired subscriptions
      
      // For MVP, push notifications are handled by the frontend
      // via realtime database subscriptions
      results.push = false; // Will be true when implemented
    }

    // 5. Send email notification if enabled
    if ((channels?.email ?? false) && userPrefs.email_enabled) {
      // TODO: Call send-email edge function
      // This requires configuring email templates and integrating with email service
      results.email = false; // Will be true when implemented
    }

    // 6. Send SMS notification if enabled (future feature)
    if ((channels?.sms ?? false) && userPrefs.sms_enabled) {
      // TODO: Implement SMS sending via SMS provider
      results.sms = false; // Will be true when implemented
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification processed',
        sent: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
