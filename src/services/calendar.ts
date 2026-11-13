/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Google Calendar Service (Google Workspace API)
 * Handles scheduling myth reading sessions, reminders, and listing calendar events
 * via client-side OAuth Bearer token to Google Calendar API.
 */

export interface CalendarEventInput {
  summary: string;
  description: string;
  startTime: string; // ISO string or YYYY-MM-DDTHH:mm:ss
  endTime: string;   // ISO string or YYYY-MM-DDTHH:mm:ss
  timeZone?: string;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export interface CalendarOperationResult {
  success: boolean;
  event?: CalendarEventItem;
  error?: string;
}

/**
 * Creates a reading session event in the user's primary Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarOperationResult> {
  try {
    const tz = event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh';
    
    // Format start and end as proper ISO dates
    const startIso = new Date(event.startTime).toISOString();
    const endIso = new Date(event.endTime).toISOString();

    const body = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: startIso,
        timeZone: tz,
      },
      end: {
        dateTime: endIso,
        timeZone: tz,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 },
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || `Google Calendar Error (${res.status})`;
      return { success: false, error: msg };
    }

    const data: CalendarEventItem = await res.json();
    return { success: true, event: data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown Calendar error',
    };
  }
}

/**
 * Lists upcoming reading sessions scheduled by Mustakshif
 */
export async function listUpcomingReadingEvents(
  accessToken: string
): Promise<CalendarEventItem[]> {
  try {
    const nowIso = new Date().toISOString();
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', nowIso);
    url.searchParams.set('q', 'مستكشف');
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '10');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.items || []) as CalendarEventItem[];
  } catch {
    return [];
  }
}

/**
 * Deletes a scheduled reading session event from Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.status === 204 || res.ok) {
      return { success: true };
    }

    const errJson = await res.json().catch(() => ({}));
    return { success: false, error: errJson.error?.message || 'فشل حذف الموعد' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'تعذر الاتصال بـ Google Calendar',
    };
  }
}
