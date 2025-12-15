/**
 * Auth Diagnostics Tool
 * Run this to check Supabase connection and configuration
 */

import { supabase } from '../lib/supabase';

export interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export async function runAuthDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // 1. Check environment variables
  console.log('=== RUNNING AUTH DIAGNOSTICS ===');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    results.push({
      test: 'Environment Variables',
      status: 'error',
      message: 'VITE_SUPABASE_URL is not defined'
    });
  } else {
    results.push({
      test: 'Supabase URL',
      status: 'success',
      message: `URL configured: ${supabaseUrl.substring(0, 30)}...`
    });
  }

  if (!supabaseKey) {
    results.push({
      test: 'Supabase Key',
      status: 'error',
      message: 'VITE_SUPABASE_ANON_KEY is not defined'
    });
  } else {
    results.push({
      test: 'Supabase Key',
      status: 'success',
      message: `Key configured (${supabaseKey.length} chars)`
    });
  }

  // 2. Test Supabase connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(0);

    if (error) {
      results.push({
        test: 'Database Connection',
        status: 'error',
        message: 'Failed to connect to Supabase',
        details: {
          code: error.code,
          message: error.message,
          hint: error.hint
        }
      });
    } else {
      results.push({
        test: 'Database Connection',
        status: 'success',
        message: 'Successfully connected to Supabase'
      });
    }
  } catch (err) {
    results.push({
      test: 'Database Connection',
      status: 'error',
      message: 'Exception while testing connection',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  // 3. Test auth session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      results.push({
        test: 'Auth Session',
        status: 'warning',
        message: 'Error getting session',
        details: error
      });
    } else if (session) {
      results.push({
        test: 'Auth Session',
        status: 'success',
        message: `Active session found for user: ${session.user.id}`
      });
    } else {
      results.push({
        test: 'Auth Session',
        status: 'warning',
        message: 'No active session (user not logged in)'
      });
    }
  } catch (err) {
    results.push({
      test: 'Auth Session',
      status: 'error',
      message: 'Exception while getting session',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  // 4. Test RLS policies (if logged in)
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        results.push({
          test: 'Profile Access (RLS)',
          status: 'error',
          message: 'RLS policies may be blocking profile access',
          details: {
            userId: session.user.id,
            error: error.message,
            code: error.code,
            hint: error.hint
          }
        });
      } else if (!profile) {
        results.push({
          test: 'Profile Access (RLS)',
          status: 'error',
          message: 'Profile not found in database',
          details: {
            userId: session.user.id,
            note: 'User authenticated but profile missing'
          }
        });
      } else {
        results.push({
          test: 'Profile Access (RLS)',
          status: 'success',
          message: `Profile accessible: ${profile.role} (${profile.name})`,
          details: profile
        });
      }
    } else {
      results.push({
        test: 'Profile Access (RLS)',
        status: 'warning',
        message: 'Skipped (no active session)'
      });
    }
  } catch (err) {
    results.push({
      test: 'Profile Access (RLS)',
      status: 'error',
      message: 'Exception while testing profile access',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  console.log('=== DIAGNOSTICS COMPLETE ===');
  console.table(results.map(r => ({
    Test: r.test,
    Status: r.status,
    Message: r.message
  })));

  return results;
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).runAuthDiagnostics = runAuthDiagnostics;
}
