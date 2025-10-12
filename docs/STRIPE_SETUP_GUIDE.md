# Stripe Business Account Setup Guide for PrizmBets

## Quick Answers
- **Do you need a business bank account before creating Stripe?** NO! You can create your Stripe account now and add the bank account later.
- **Can you start development now?** YES! Use test mode with test API keys.

## Step 1: Create Your Stripe Account (Can Do Now)
1. Go to https://stripe.com and click "Start now"
2. Enter your email and create a password
3. Fill in your business information:
   - Business name
   - Business address
   - Your personal information (as the account owner)
4. Select "I'm not ready to activate payments" to stay in test mode

## Step 2: Get Your Test API Keys (Do This Now)
1. Log into Stripe Dashboard: https://dashboard.stripe.com
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to Developers > API keys
4. Copy your test keys:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`
5. Add these to your `.env` files

## Step 3: Create Subscription Products (Do This Now in Test Mode)
1. In Stripe Dashboard, go to Products
2. Click "Add product"
3. Create your subscription tiers:
   
   **Pro Plan:**
   - Name: SmartBets Pro
   - Pricing: $19.99/month
   - Recurring billing
   
   **Premium Plan:**
   - Name: SmartBets Premium
   - Pricing: $39.99/month
   - Recurring billing

4. Save the price IDs (format: `price_...`)
5. Add these to your backend `.env` file

## Step 4: Add Business Bank Account (Do Tomorrow)
1. Once your business bank account is open, log into Stripe
2. Go to Settings > Bank accounts and scheduling
3. Click "Add bank account"
4. Enter your business details:
   - Business bank routing number
   - Business bank account number
   - Confirm business name matches bank records
5. Verify with micro-deposits (1-2 business days)
6. Set as default payout account

## Step 5: Activate Live Payments (After Bank Verification)
1. Once bank is verified, go to Settings > Account details
2. Click "Activate payments"
3. Complete any remaining business verification
4. Switch from test mode to live mode
5. Get your live API keys and update production `.env`

## Important Notes
- **Test Mode is Perfect for Development**: All features work in test mode
- **Test Card Numbers**: Use `4242 4242 4242 4242` with any future date and CVC
- **Webhook Testing**: Use Stripe CLI for local webhook testing
- **Documentation**: https://stripe.com/docs

## Current Status Checklist
- [ ] Stripe account created
- [ ] Test API keys obtained
- [ ] Test products created
- [ ] Development environment configured
- [ ] Business bank account added (pending)
- [ ] Live mode activated (pending)

## Support Resources
- Stripe Support: https://support.stripe.com
- API Documentation: https://stripe.com/docs/api
- Testing Guide: https://stripe.com/docs/testing