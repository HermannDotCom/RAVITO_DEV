import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegistrationData {
  userId: string;
  email: string;
  name: string;
  role: "client" | "supplier" | "admin";
  businessName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: RegistrationData = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Check if profile exists
    let profileExists = false;
    try {
      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${data.userId}&select=id`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const profiles = await profileResponse.json();
      profileExists = profiles && profiles.length > 0;
    } catch (error) {
      console.error("Error checking profile:", error);
    }

    // If profile doesn't exist, create it
    if (!profileExists) {
      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            id: data.userId,
            email: data.email,
            name: data.name,
            role: data.role,
            business_name: data.businessName || null,
            is_active: true,
            is_approved: data.role === "admin",
            approval_status: data.role === "admin" ? "approved" : "pending",
          }),
        }
      );

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        console.error("Error creating profile:", error);
        throw new Error(`Failed to create profile: ${error}`);
      }
    }

    // Check if organization exists
    let orgExists = false;
    try {
      const orgResponse = await fetch(
        `${supabaseUrl}/rest/v1/organizations?owner_id=eq.${data.userId}&select=id`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const orgs = await orgResponse.json();
      orgExists = orgs && orgs.length > 0;
    } catch (error) {
      console.error("Error checking organization:", error);
    }

    // If organization doesn't exist, create it
    if (!orgExists) {
      const orgName =
        data.role === "client"
          ? `${data.name} (Client)`
          : data.role === "supplier"
          ? data.businessName || data.name
          : `${data.name} (Admin)`;

      const orgResponse = await fetch(
        `${supabaseUrl}/rest/v1/organizations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            owner_id: data.userId,
            name: orgName,
            type: data.role,
            max_members: 5,
          }),
        }
      );

      if (!orgResponse.ok) {
        const error = await orgResponse.text();
        console.error("Error creating organization:", error);
        throw new Error(`Failed to create organization: ${error}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile and organization setup complete",
        profileCreated: !profileExists,
        organizationCreated: !orgExists,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in post-registration:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
