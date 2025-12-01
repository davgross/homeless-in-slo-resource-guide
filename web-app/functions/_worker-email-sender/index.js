/**
 * Cloudflare Worker for sending emails via Email Routing
 * This worker is bound to the Pages Function as a service binding
 * and provides email sending capabilities without third-party dependencies
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

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

      // Determine sender info
      const fromEmail = emailData.from?.email || 'noreply@vivaslo.org';
      const fromName = emailData.from?.name || 'SLO Homeless Resource Guide';

      // Build MIME message using mimetext
      const msg = createMimeMessage();
      msg.setSender({ name: fromName, addr: fromEmail });
      msg.setRecipient(emailData.to);
      msg.setSubject(emailData.subject);
      msg.addMessage({
        contentType: 'text/plain',
        data: emailData.content
      });

      // Add Reply-To header if provided and valid
      if (emailData.replyTo && emailData.replyTo.trim() && emailData.replyTo.includes('@')) {
        msg.setHeader('Reply-To', emailData.replyTo);
      }

      // Create EmailMessage and send via Email Routing binding
      const message = new EmailMessage(
        fromEmail,
        emailData.to,
        msg.asRaw()
      );

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
