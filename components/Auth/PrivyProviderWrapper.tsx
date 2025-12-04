"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
        },
        legal: {
          termsAndConditionsUrl: "/legal/terms",
          privacyPolicyUrl: "/legal/privacy",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
