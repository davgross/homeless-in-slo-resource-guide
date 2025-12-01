/**
 * Cloudflare Worker for sending emails via Email Routing
 * This worker is bound to the Pages Function as a service binding
 * and provides email sending capabilities without third-party dependencies
 */

export default {
  async fetch(request, env) {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse the email request
      const emailData = await request.json();

      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.content) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          details: 'to, subject, and content are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Construct the email using EmailMessage
      // Note: The 'from' address must use a domain where Email Routing is active
      const message = {
        from: emailData.from || {
          email: 'noreply@vivaslo.org',
          name: 'SLO Homeless Resource Guide'
        },
        to: [{ email: emailData.to }],
        subject: emailData.subject,
        text: emailData.content
      };

      // Add reply-to if provided
      if (emailData.replyTo) {
        message.reply_to = { email: emailData.replyTo };
      }

      // Send the email using the Email Routing binding
      // The EMAIL binding is configured in wrangler.toml
      await env.EMAIL.send(message);

      return new Response(JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error sending email:', error);

      return new Response(JSON.stringify({
        error: 'Failed to send email',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
