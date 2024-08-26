"use client";

import { ThemedLayoutContextProvider } from "@refinedev/antd";
import { Grid, Layout as AntdLayout } from "antd";
import type { RefineThemedLayoutV2Props } from "@refinedev/antd";

export const ThemedLayoutV2: React.FC<RefineThemedLayoutV2Props> = ({
  children,
  Footer,
  OffLayoutArea,
  initialSiderCollapsed,
}) => {
  const breakpoint = Grid.useBreakpoint();
  const isSmall = typeof breakpoint.sm === "undefined" ? true : breakpoint.sm;

  return (
    <ThemedLayoutContextProvider initialSiderCollapsed={initialSiderCollapsed}>
      <AntdLayout style={{ minHeight: "100vh" }} hasSider={false}>
        <AntdLayout>
          <AntdLayout.Content>
            <div
              style={{
                minHeight: 360,
                padding: isSmall ? 24 : 12,
              }}
            >
              {children}
            </div>
            {OffLayoutArea && <OffLayoutArea />}
          </AntdLayout.Content>
          {Footer && <Footer />}
        </AntdLayout>
      </AntdLayout>
    </ThemedLayoutContextProvider>
  );
};
