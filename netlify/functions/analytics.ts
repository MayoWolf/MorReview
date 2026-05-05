import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

type AnalyticsPayload = {
  session_id?: unknown;
  event_type?: unknown;
  path?: unknown;
  video_unit?: unknown;
  seconds_since_start?: unknown;
  referrer?: unknown;
};

const validEventTypes = new Set([
  'start',
  'heartbeat',
  'end',
  'video_play',
  'video_pause',
  'video_ended',
]);

const jsonResponse = (statusCode: number, body: Record<string, string>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const getRequiredEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase analytics environment variables are not configured.');
  }

  return { supabaseUrl, supabaseServiceKey };
};

const parsePayload = (body: string | null): AnalyticsPayload => {
  if (!body) {
    throw new Error('Missing request body.');
  }

  try {
    return JSON.parse(body) as AnalyticsPayload;
  } catch {
    throw new Error('Invalid JSON body.');
  }
};

const asString = (value: unknown) => (typeof value === 'string' ? value : null);
const asNullableString = (value: unknown) => (
  value === null || value === undefined ? null : asString(value)
);
const asNullableNumber = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  let data: AnalyticsPayload;

  try {
    data = parsePayload(event.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request body.';

    return jsonResponse(400, { error: message });
  }

  const sessionId = asString(data.session_id);
  const eventType = asString(data.event_type);
  const path = asString(data.path);
  const secondsSinceStart = asNullableNumber(data.seconds_since_start);

  if (!sessionId || !eventType || !validEventTypes.has(eventType) || !path) {
    return jsonResponse(400, { error: 'Invalid analytics payload.' });
  }

  try {
    const { supabaseUrl, supabaseServiceKey } = getRequiredEnv();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    const { error } = await supabase
      .from('analytics_events')
      .insert([
        {
          session_id: sessionId,
          event_type: eventType,
          path,
          video_unit: asNullableNumber(data.video_unit),
          seconds_since_start: secondsSinceStart,
          referrer: asNullableString(data.referrer),
          user_agent: userAgent,
        },
      ]);

    if (error) throw error;

    return jsonResponse(200, { message: 'Event logged' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected analytics error.';

    console.error('Analytics Error:', err);
    return jsonResponse(500, { error: message });
  }
};
