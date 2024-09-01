"use client";

import { useEffect } from "react";
import { useGo, useList } from "@refinedev/core";
import dayjs from "dayjs";

export default function CurrentBudget() {
  const go = useGo();
  const { data, isLoading } = useList({
    resource: "MonthlyBudgets",
    filters: [
      {
        field: "month",
        operator: "eq",
        value: dayjs().startOf('month').format("YYYY-MM-DD"),
      },
    ],
  });

  useEffect(() => {
    if (!isLoading) {
      if (data?.data?.length && data.data[0].id) {
        // Redirect to the current month's budget if it exists
        go({
          to: {
            resource: "MonthlyBudgets",
            action: "show",
            id: data.data[0].id,
          },
        });
      } else {
        // Redirect to the monthly budget list page if the current month's budget doesn't exist
        go({
          to: {
            resource: "MonthlyBudgets",
            action: "list",
          },
        });
      }
    }
  }, [isLoading, data, go]);

  return <div>Redirecting...</div>;
}