const SESSION_KEY = 'mor_session_id';
const START_TIME = Date.now();

const getSessionId = () => {
  let sessionId = null;

  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
  } catch {
    return crypto.randomUUID();
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    try {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      // Keep analytics non-blocking if storage is unavailable.
    }
  }

  return sessionId;
};

const getSecondsSinceStart = () => Math.floor((Date.now() - START_TIME) / 1000);

const sendEvent = (eventType: string, videoUnit?: number, useBeacon = false) => {
  const payload = {
    session_id: getSessionId(),
    event_type: eventType,
    path: window.location.pathname,
    video_unit: videoUnit ?? null,
    seconds_since_start: getSecondsSinceStart(),
    referrer: document.referrer || null,
  };

  const url = '/.netlify/functions/analytics';

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(url, JSON.stringify(payload));
  } else {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((err) => console.error('Failed to send analytics', err));
  }
};

export const startAnalytics = () => {
  sendEvent('start');

  const heartbeatInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendEvent('heartbeat');
    }
  }, 15000);

  const handlePageHide = () => {
    sendEvent('end', undefined, true);
    clearInterval(heartbeatInterval);
  };

  window.addEventListener('pagehide', handlePageHide);

  return () => {
    clearInterval(heartbeatInterval);
    window.removeEventListener('pagehide', handlePageHide);
  };
};

export const trackVideoPlay = (unit: number) => sendEvent('video_play', unit);
export const trackVideoPause = (unit: number) => sendEvent('video_pause', unit);
export const trackVideoEnded = (unit: number) => sendEvent('video_ended', unit);
