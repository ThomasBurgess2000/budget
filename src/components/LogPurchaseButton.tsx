import React from "react";
import { useGo } from "@refinedev/core";

export const LogPurchaseButton: React.FC = () => {
  const go = useGo();

  return (
    <button
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "10px 20px",
        backgroundColor: "#1890ff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
      onClick={() => go({ to: "/transactions/create" })}
    >
      Log Purchase
    </button>
  );
};