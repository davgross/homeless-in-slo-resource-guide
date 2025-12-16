/**
 * Cloudflare Worker for sending emails via Email Routing
 * This worker is bound to the Pages Function as a service binding
 * and provides email sending capabilities without third-party dependencies
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage, Mailbox } from 'mimetext';

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
      const fromName = emailData.from?.name || 'VivaSLO';

      // Debug: log what we received
      console.log('Received emailData:', {
        to: emailData.to,
        replyTo: emailData.replyTo,
        replyToType: typeof emailData.replyTo,
        replyToLength: emailData.replyTo?.length
      });

      // Build MIME message using mimetext
      const msg = createMimeMessage();
      msg.setSender({ name: fromName, addr: fromEmail });
      msg.setRecipient(emailData.to);
      msg.setSubject(emailData.subject);
      msg.addMessage({
        contentType: 'text/plain',
        data: emailData.content
      });

      // Add Reply-To header only if email is provided and appears valid
      // Must use Mailbox class for RFC-5322 compliance
      if (emailData.replyTo &&
          typeof emailData.replyTo === 'string' &&
          emailData.replyTo.trim().length > 0 &&
          emailData.replyTo.includes('@')) {
        console.log('Adding Reply-To:', emailData.replyTo);
        msg.setHeader('Reply-To', new Mailbox(emailData.replyTo));
      } else {
        console.log('Skipping Reply-To header');
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
