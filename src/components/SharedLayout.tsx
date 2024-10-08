import { authProviderServer } from "@providers/auth-provider";
import { ThemedLayoutV2 } from "./layout";
import { redirect } from "next/navigation";
import React from "react";

export default async function SharedLayout({
  children,
}: React.PropsWithChildren) {
  const data = await getData();

  if (!data.authenticated) {
    return redirect(data?.redirectTo || "/login");
  }

  return <ThemedLayoutV2>{children}</ThemedLayoutV2>;
}

async function getData() {
  const { authenticated, redirectTo } = await authProviderServer.check();

  return {
    authenticated,
    redirectTo,
  };
}
