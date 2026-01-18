/**
 * Cloudflare Pages Function for handling feedback submissions
 * This endpoint receives feedback from the web app and sends it via email
 * using Cloudflare Email Routing through a service-bound Worker
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Parse the request body
    const data = await request.json();

    // Validate required fields
    if (!data.message || !data.type) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: 'Message and type are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Format the email content
    const emailContent = formatFeedbackEmail(data);

    // Send email via Email Routing through service-bound Worker
    // Note: The EMAIL_SENDER binding must be configured in the Cloudflare dashboard
    // under Pages project Settings > Functions > Service bindings
    const emailResponse = await sendEmail(env, {
      to: 'showerthepeopleslo@gmail.com',
      subject: `Feedback (${data.type}) - VivaSLO`,
      content: emailContent,
      replyTo: data.email && isValidEmail(data.email) ? data.email : null
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback submitted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error processing feedback:', error);

    return new Response(JSON.stringify({
      error: 'Failed to submit feedback',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Format feedback data into email content
 */
function formatFeedbackEmail(data) {
  let content = `
FEEDBACK SUBMISSION
===================

From: ${data.name || 'Anonymous'}
Email: ${data.email || 'Not provided'}
Type: ${data.type}
Timestamp: ${data.timestamp || new Date().toISOString()}

Current Section: ${data.section || 'Not specified'}`;

  if (data.directoryEntry) {
    content += `\nDirectory Entry: ${data.directoryEntry}`;
  }

  content += `\nPage URL: ${data.url || 'Not provided'}

MESSAGE:
--------
${data.message}

---
This feedback was submitted via the VivaSLO web app.
`;

  return content;
}

/**
 * Send email via Email Routing through service-bound Worker
 * The EMAIL_SENDER service binding must be configured in Cloudflare dashboard
 */
async function sendEmail(env, { to, subject, content, replyTo }) {
  // Check if the EMAIL_SENDER binding is available
  if (!env.EMAIL_SENDER) {
    throw new Error('EMAIL_SENDER service binding not configured. Please add it in the Cloudflare dashboard.');
  }

  const emailPayload = {
    to: to,
    subject: subject,
    content: content,
    from: {
      email: 'noreply@vivaslo.org',
      name: 'VivaSLO'
    },
    ...(replyTo && { replyTo: replyTo })
  };

  // Call the service-bound Worker
  return await env.EMAIL_SENDER.fetch('https://email-sender/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailPayload)
  });
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
