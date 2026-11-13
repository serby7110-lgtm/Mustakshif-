/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Gmail Service (Google Workspace API)
 * Handles sending emails, contact form submissions, and bookmarks summaries
 * via client-side OAuth Bearer token to Google's Gmail API.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Encodes an RFC 2822 email message in base64url format for Gmail API
 */
export function createBase64Email({ to, subject, bodyText, bodyHtml }: SendEmailParams): string {
  const boundary = '____mustakshif_boundary____' + Math.random().toString(36).substring(2);
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const lines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyHtml || bodyText || '',
    '',
    `--${boundary}--`,
  ];

  const rawMessage = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using Gmail API with client-side OAuth Bearer token
 */
export async function sendGmailMessage(
  accessToken: string,
  params: SendEmailParams
): Promise<GmailSendResult> {
  try {
    const raw = createBase64Email(params);
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || `Gmail API Error (${res.status})`;
      return { success: false, error: msg };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown Gmail error',
    };
  }
}
