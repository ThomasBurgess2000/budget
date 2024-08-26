"use client";

import { List, useTable } from "@refinedev/antd";
import { useGo } from "@refinedev/core";
import { Table } from "antd";
import dayjs from "dayjs"; // Import dayjs
import { LogPurchaseButton } from "@components/LogPurchaseButton";

export default function MonthlyBudgetsList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  const go = useGo();

  return (
    <List breadcrumb={false} title="Monthly Budgets">
      <Table {...tableProps} rowKey="id" showHeader={false}>
        <Table.Column
          dataIndex="month"
          title="Month"
          render={(value) => dayjs(value).format("MMMM YYYY")}
          onCell={(record) => ({
            onClick: () =>
              go({
                to: {
                  resource: "MonthlyBudgets",
                  action: "show",
                  id: record.id,
                },
              }),
          })}
        />
      </Table>
      <LogPurchaseButton />
    </List>
  );
}
