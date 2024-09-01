import React from "react";
import { useGo } from "@refinedev/core";

export const LogPurchaseButton: React.FC<{ monthly_budget_id: string }> = ({
  monthly_budget_id,
}) => {
  const go = useGo();

  return (
    <button
      style={{
        position: "fixed",
        bottom: "12px",
        right: "12px",
        padding: "10px 20px",
        backgroundColor: "#1890ff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
      onClick={() =>
        go({
          to: {
            resource: "Transactions",
            action: "create",
          },
          query: { monthly_budget_id },
        })
      }
    >
      Log Purchase
    </button>
  );
};
