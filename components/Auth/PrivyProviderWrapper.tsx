"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

class PrivyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("PrivyProvider failed to initialize:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>;
    }

    return this.props.children;
  }
}

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    return <>{children}</>;
  }

  const solanaConnectors = toSolanaWalletConnectors({
    shouldAutoConnect: true,
  });

  return (
    <PrivyErrorBoundary>
      <PrivyProvider
        appId={appId}
        config={{
          loginMethods: ["email", "wallet", "google"],
          appearance: {
            theme: "dark",
            accentColor: "#676FFF",
            walletChainType: "ethereum-and-solana",
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
            solana: {
              createOnLogin: "users-without-wallets",
            },
          },
          externalWallets: {
            solana: {
              connectors: solanaConnectors,
            },
          },
          legal: {
            termsAndConditionsUrl: "/legal/terms",
            privacyPolicyUrl: "/legal/privacy",
          },
        }}
      >
        {children}
      </PrivyProvider>
    </PrivyErrorBoundary>
  );
}
