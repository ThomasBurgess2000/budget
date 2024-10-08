import { useNotificationProvider } from "@refinedev/antd";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppIcon } from "@components/app-icon";
import { ColorModeContextProvider } from "@contexts/color-mode";
import { authProviderClient } from "@providers/auth-provider";
import { dataProvider } from "@providers/data-provider";
import "@refinedev/antd/dist/reset.css";
import "../globals.css";

export const metadata: Metadata = {
  title: "Abacus",
  description: "An in and out budgeting app",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = cookieStore.get("theme");
  const defaultMode = theme?.value === "dark" ? "dark" : "light";

  return (
    <html lang="en">
      <body>
        <Suspense>
          <RefineKbarProvider>
            <AntdRegistry>
              <ColorModeContextProvider defaultMode={defaultMode}>
                <Refine
                  routerProvider={routerProvider}
                  authProvider={authProviderClient}
                  dataProvider={{ default: dataProvider }}
                  resources={[
                    {
                      name: "Detailed Views",
                    },
                    {
                      name: "Transactions",
                      create: "/transactions/create",
                      edit: "/transactions/edit/:id",
                      show: "/transactions/show/:id",
                      meta: {
                        canDelete: true,
                        parent: "Detailed Views",
                      },
                    },
                    {
                      name: "Categories",
                      create: "/categories/create",
                      edit: "/categories/edit/:id",
                      show: "/categories/show/:id",
                      meta: {
                        canDelete: true,
                        parent: "Detailed Views",
                      },
                    },
                    {
                      name: "MonthlyBudgets",
                      list: "/monthly-budgets",
                      create: "/monthly-budgets/create",
                      edit: "/monthly-budgets/edit/:id",
                      show: "/monthly-budgets/show/:id",
                      meta: {
                        canDelete: true,
                        label: "Monthly Budgets",
                        parent: "Detailed Views",
                      },
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    useNewQueryKeys: true,
                    projectId: "p6WhNG-KSpYrv-H28LS2",
                    title: { text: "Refine Project", icon: <AppIcon /> },
                  }}
                >
                  {children}
                  <RefineKbar />
                </Refine>
              </ColorModeContextProvider>
            </AntdRegistry>
          </RefineKbarProvider>
        </Suspense>
      </body>
    </html>
  );
}
