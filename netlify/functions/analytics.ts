import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    const { error } = await supabase
      .from('analytics_events')
      .insert([
        {
          session_id: data.session_id,
          event_type: data.event_type,
          path: data.path,
          video_unit: data.video_unit,
          seconds_since_start: data.seconds_since_start,
          referrer: data.referrer,
          user_agent: userAgent,
        },
      ]);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Event logged' }),
    };
  } catch (err: any) {
    console.error('Analytics Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
