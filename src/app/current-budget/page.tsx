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
    if (!isLoading && data?.data?.length && data?.data?.length > 0) {
      const currentMonthBudget = data.data[0];
      if (!currentMonthBudget.id) {
        return;
      }
      go({
        to: {
          resource: "MonthlyBudgets",
          action: "show",
          id: currentMonthBudget.id,
        },
      });
    }
  }, [isLoading, data, go]);

  return <div>Redirecting to the current month&apos;s budget...</div>;
}