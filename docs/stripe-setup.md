# Stripe Payment Integration Setup

This guide will help you set up Stripe payment integration for CodingIT to enable pro features and subscriptions.

## Prerequisites

1. A Stripe account ([sign up here](https://stripe.com))
2. Access to your Stripe Dashboard
3. CodingIT development environment set up

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook endpoint secret from Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key (test mode)

# Product Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_PRO=price_...  # Pro plan monthly price ID
STRIPE_PRICE_ID_ENTERPRISE=price_...  # Enterprise plan monthly price ID
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

1. Go to **Products** in your Stripe Dashboard
2. Create the following products:

**Pro Plan:**
- Name: "Pro"
- Description: "For serious developers"
- Pricing: $9/month recurring
- Copy the Price ID and set it as `STRIPE_PRICE_ID_PRO`

**Enterprise Plan:**
- Name: "Enterprise" 
- Description: "For teams and organizations"
- Pricing: $25/month recurring
- Copy the Price ID and set it as `STRIPE_PRICE_ID_ENTERPRISE`

### 2. Configure Webhooks

1. Go to **Webhooks** in your Stripe Dashboard
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhooks`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET`

### 3. Enable Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable the customer portal
3. Configure allowed features:
   - Update payment methods
   - Download invoices
   - Cancel subscriptions
   - Update billing information

## Database Migration

Run the subscription database migration:

```bash
# Apply the migration using your preferred method
# For Supabase, you can run the SQL in the SQL editor
cat migrations/001_add_subscriptions.sql
```

The migration creates:
- Subscription columns in the `teams` table
- `team_usage_limits` table for tracking feature usage
- `subscription_events` table for audit logs
- Functions for usage validation and tracking

## Testing

### Test Mode Setup

1. Use Stripe test mode keys (starting with `sk_test_` and `pk_test_`)
2. Use test card numbers for payments:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Webhook Testing

Use Stripe CLI to forward webhooks to your local development:

```bash
# Install Stripe CLI
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

## Feature Limits Configuration

The system includes these default limits:

### Free Plan
- 5 GitHub imports per month
- 100MB storage
- 1,000 API calls per month
- 30s execution time limit

### Pro Plan ($9/month)
- 50 GitHub imports per month
- 5GB storage  
- 50,000 API calls per month
- 300s execution time limit

### Enterprise Plan ($25/month)
- Unlimited GitHub imports
- Unlimited storage
- Unlimited API calls
- 600s execution time limit

## API Endpoints

The integration provides these endpoints:

- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create billing portal session  
- `POST /api/stripe/webhooks` - Handle webhook events
- `GET /api/subscription/usage` - Get subscription and usage data
- `POST /api/integrations/github/import` - Import GitHub repo with usage tracking

## Usage Tracking

Features automatically track usage:

- GitHub imports increment `github_imports` counter
- File storage updates `storage_mb` counter
- API calls increment `api_calls` counter
- Execution time tracks `execution_time_seconds`

Usage resets monthly and is enforced before API calls.

## Going Live

### Production Setup

1. Switch to live mode in Stripe Dashboard
2. Update environment variables with live keys (`sk_live_`, `pk_live_`)
3. Update webhook endpoint URL to production domain
4. Test payment flows thoroughly
5. Set up monitoring for webhook failures

### Security Considerations

- Never expose secret keys in client-side code
- Validate webhook signatures
- Use HTTPS in production
- Monitor for suspicious usage patterns
- Implement rate limiting on API endpoints

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Verify webhook endpoint is accessible
   - Ensure request body is not modified

2. **Checkout redirects fail**
   - Verify success/cancel URLs are absolute
   - Check customer creation in Stripe Dashboard
   - Ensure price IDs are correct

3. **Usage limits not enforcing**
   - Run database migration
   - Check team initialization function
   - Verify middleware is applied to API routes

4. **Portal access denied**
   - Ensure customer has Stripe customer ID
   - Check portal configuration in Stripe
   - Verify session creation

### Debug Commands

```bash
# Check environment variables
echo $STRIPE_SECRET_KEY | cut -c1-10

# Test webhook endpoint
curl -X POST http://localhost:3000/api/stripe/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check database tables
# Run in your database console:
SELECT * FROM team_usage_limits WHERE team_id = 'your-team-id';
```

For additional help, check the Stripe documentation or contact support.