# Privy Authentication Migration Guide

## Overview
This document outlines the migration from NextAuth to Privy for authentication in the PadLink application. The migration aims to provide a more robust, Web3-ready authentication system while maintaining backward compatibility for existing users.

## Key Changes

### 1. Authentication Provider
- **Old**: NextAuth (Credentials, Google, GitHub)
- **New**: Privy (Email, Socials, Wallet)
- **Hybrid**: The application currently supports BOTH NextAuth and Privy sessions to ensure no user is locked out during the transition.

### Deprecations
- Google sign-in has been removed across the app (NextAuth provider and Privy Google method disabled).
- Guest login has been removed, including backend guest user creation.

### 2. Middleware (`middleware.ts`)
The middleware has been updated to validate sessions from both sources:
1. **Privy Session**: Checks for valid `padlink_session` JWT cookie (verified via `jose`).
2. **NextAuth Session**: Checks for valid `next-auth.session-token` (verified via `next-auth/jwt`).

### 3. User Synchronization
A new API endpoint `POST /api/auth/privy-sync` has been created to sync Privy users to the local database.
- **Trigger**: Called automatically by the client-side `useAuth` hook when a user logs in via Privy but doesn't have a local profile session.
- **Logic**: 
  - Verifies Privy token.
  - Links to existing user by email if found.
  - Creates new user if not found.

### 4. Client-Side Hooks (`useAuth`)
The `useAuth` hook replaces `useSession`. It wraps Privy's `usePrivy` and handles the synchronization with the backend to provide a unified user object (`{ user: { id, role, ... } }`).

## Environment Variables

Ensure the following variables are set in `.env.local`:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-privy-app-secret"

# Existing NextAuth Config (Keep for backward compatibility)
NEXTAUTH_SECRET="your-existing-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## API Endpoints

### `POST /api/auth/privy-sync`
- **Headers**: `Authorization: Bearer <privy_access_token>`
- **Response**: JSON object of the synchronized user.

### `POST /api/wallet/export`
- Wallet export initialization has no rate limit.
- Requires `Authorization: Bearer <privy_access_token>`.

## Rollback Procedure

If critical issues arise with Privy:
1. Revert `middleware.ts` to only check `next-auth` token.
2. Revert `useAuth` hook to use `useSession` from `next-auth/react`.
3. (Optional) Disable Privy provider in `PrivyProviderWrapper.tsx`.

## Future Steps
1. Monitor `LoginLog` for Privy vs NextAuth usage.
2. Once NextAuth usage drops to near zero, remove NextAuth dependencies and code.
3. Deprecate `password` field in `User` model (eventually).
