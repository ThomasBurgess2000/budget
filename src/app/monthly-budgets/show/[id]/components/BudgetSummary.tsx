"use client";

import { BaseRecord } from "@refinedev/core";
import { Typography } from "antd";
import { useMemo } from "react";
const { Text } = Typography;

export default function BudgetSummary({
  groupedTransactions,
}: {
  groupedTransactions: BaseRecord | undefined;
}) {
  const budgetSummary = useMemo(() => {
    if (!groupedTransactions) return { totalExpenses: 0, totalIncome: 0 };

    return Object.values(groupedTransactions).reduce(
      (acc, group: any) => {
        if (group.category.type === "income") {
          acc.totalIncome += group.category.amount_budgeted;
        } else {
          acc.totalExpenses += group.category.amount_budgeted;
        }
        return acc;
      },
      { totalExpenses: 0, totalIncome: 0 }
    );
  }, [groupedTransactions]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <Text strong>
        Total Budgeted: $
        {budgetSummary.totalExpenses.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        of $
        {budgetSummary.totalIncome.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    </div>
  );
}
