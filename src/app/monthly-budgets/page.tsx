"use client";

import {
  CreateButton,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useGo, type BaseRecord } from "@refinedev/core";
import { Space, Table } from "antd";
import dayjs from "dayjs"; // Import dayjs
import { LogPurchaseButton } from "@components/LogPurchaseButton";

export default function MonthlyBudgetsList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  const go = useGo();

  return (
    <List>
      <Table {...tableProps} rowKey="id" showHeader={false}>
        <Table.Column
          dataIndex="month"
          title="Month"
          render={(value) => dayjs(value).format("MMMM YYYY")}
          onCell={(record) => ({
            onClick: () => go({
              to: {
                resource: "MonthlyBudgets",
                action: "show",
                id: record.id,
              }
            })
          })}
        />
      </Table>
      <LogPurchaseButton />
    </List>
  );
}