import React, { useState } from "react";
import { useGo } from "@refinedev/core";
import { Button } from "antd";

type LogPurchaseButtonProps =
  | {
      monthly_budget_id: string;
      href?: never;
    }
  | {
      monthly_budget_id?: never;
      href: string;
    };

export const LogPurchaseButton: React.FC<LogPurchaseButtonProps> = (props) => {
  const go = useGo();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="primary"
      loading={loading}
      style={{
        position: "fixed",
        bottom: "12px",
        right: "12px",
      }}
      onClick={() => {
        setLoading(true);
        if ("href" in props) {
          go({ to: props.href, type: "replace" });
          return;
        }

        go({
          to: {
            resource: "Transactions",
            action: "create",
          },
          query: { monthly_budget_id: props.monthly_budget_id },
        });
      }}
    >
      Log Purchase
    </Button>
  );
};
