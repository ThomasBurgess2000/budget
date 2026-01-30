import React, { useState } from "react";
import { useGo } from "@refinedev/core";
import { Button } from "antd";

export const LogPurchaseButton: React.FC<{ monthly_budget_id: string }> = ({
  monthly_budget_id,
}) => {
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
        go({
          to: {
            resource: "Transactions",
            action: "create",
          },
          query: { monthly_budget_id },
        });
      }}
    >
      Log Purchase
    </Button>
  );
};
