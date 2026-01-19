# Email Sender Worker

This Cloudflare Worker provides email sending capabilities using Cloudflare Email Routing for the VivaSLO feedback system.

## Overview

This Worker is deployed separately and connected to the Cloudflare Pages Function via a service binding. It uses Cloudflare's native Email Routing feature, avoiding third-party dependencies.

## Prerequisites

Before deploying this Worker, you must:

1. **Enable Email Routing** for your domain (vivaslo.org) in the Cloudflare dashboard
   - Go to Email > Email Routing in your Cloudflare dashboard
   - Follow the setup wizard to enable Email Routing

2. **Verify destination email address**
   - Add and verify `showerthepeopleslo@gmail.com` as a destination address
   - You'll receive a verification email that must be confirmed

3. **Configure DNS for sending**
   - Email Routing requires proper SPF/DKIM records (these are auto-configured by Cloudflare when you enable Email Routing)
   - The 'from' address in emails must use a domain where Email Routing is active (currently set to `noreply@vivaslo.org`)

## Deployment Steps

### 1. Deploy the Email Sender Worker

From the `web-app/functions/_worker-email-sender` directory:

```bash
# Deploy the worker
wrangler deploy

# Or if you need to login first:
wrangler login
wrangler deploy
```

This will deploy the Worker and create the email sending binding.

### 2. Configure Service Binding in Pages

After deploying the Worker, you need to bind it to your Cloudflare Pages project:

1. Go to the Cloudflare dashboard
2. Navigate to **Workers & Pages**
3. Select your Pages project (slo-homeless-resource-guide or similar)
4. Go to **Settings** > **Functions** > **Service bindings**
5. Click **Add binding**
6. Configure:
   - **Variable name**: `EMAIL_SENDER`
   - **Service**: Select `email-sender-worker` from the dropdown
   - **Environment**: Select the environment to bind (Production and/or Preview)
7. Click **Save**

### 3. Deploy the Pages site

After configuring the service binding:

```bash
cd /path/to/web-app
npm run build
# The build output will be deployed automatically via Cloudflare Pages git integration
# OR manually deploy with:
# wrangler pages deploy dist
```

## Testing

To test the email functionality:

1. Visit your site at https://vivaslo.org
2. Click the feedback button (💬)
3. Fill out the form with test data
4. Submit
5. Check that you receive the email at showerthepeopleslo@gmail.com

## Troubleshooting

### Error: "EMAIL_SENDER service binding not configured"

This means the service binding wasn't set up in step 2 above. Go back to the Cloudflare dashboard and add the binding.

### Error: "Failed to send email"

Common causes:
- Email Routing not enabled for the domain
- Destination email address not verified
- The 'from' address doesn't match a domain with Email Routing enabled

Check the Worker logs in the Cloudflare dashboard:
1. Go to **Workers & Pages**
2. Select `email-sender-worker`
3. Click **Logs** tab

### Testing locally

For local development, you can use Wrangler's local mode, but you'll need to provide test bindings:

```bash
# In the worker directory
wrangler dev

# Note: Email sending won't work in local dev mode
# You'll need to deploy to test actual email functionality
```

## Architecture

```
User Browser
    ↓ (POST /api/feedback)
Cloudflare Pages Function (functions/api/feedback.js)
    ↓ (Service Binding: EMAIL_SENDER)
Email Sender Worker (this worker)
    ↓ (Email Routing Binding)
Cloudflare Email Routing
    ↓
showerthepeopleslo@gmail.com
```

## Configuration

### Changing the recipient email

To change where feedback is sent:

1. Update `wrangler.toml`: Change `destination_address`
2. Verify the new email address in Cloudflare Email Routing
3. Update `functions/api/feedback.js`: Change the `to` field in the `sendEmail` call
4. Redeploy both the Worker and Pages site

### Changing the sender email

The sender email must use a domain where Email Routing is active. To change it:

1. Update `index.js`: Change the `from.email` field
2. Ensure Email Routing is enabled for that domain
3. Redeploy the Worker

## Security Notes

- The Worker only accepts POST requests
- The service binding ensures only your Pages Functions can call this Worker
- The Email Routing binding restricts sending to verified destination addresses
- No API keys or secrets are required (Cloudflare handles authentication via bindings)

## Migration from MailChannels

This Worker replaces the previous MailChannels integration, which was discontinued in August 2024. The new implementation uses Cloudflare's native Email Routing, which is:

- Free for Cloudflare customers
- More reliable (no third-party dependencies)
- Better integrated with Cloudflare's infrastructure
- More secure (no API keys to manage)
