"use client";

import {
  DeleteButton,
  EditButton,
  getDefaultSortOrder,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table, InputNumber } from "antd";
import { useState } from "react";
import { useUpdate } from "@refinedev/core";

export default function CategoryList() {
  const { tableProps, sorters } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [
        {
          field: "title",
          order: "asc",
        },
      ],
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const { mutate } = useUpdate();

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="title"
          title="Title"
          defaultSortOrder={getDefaultSortOrder("title", sorters)}
        />
        <Table.Column
          dataIndex="amount_budgeted"
          title="Amount Budgeted"
          render={(value, record: BaseRecord) =>
            editingId === record.id ? (
              <InputNumber
                defaultValue={value}
                formatter={(value) =>
                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                onPressEnter={(e) => {
                  const newValue = parseFloat(
                    (e.target as HTMLInputElement).value.replace(
                      /\$\s?|(,*)/g,
                      ""
                    )
                  );
                  console.log(newValue);
                  if (!isNaN(newValue)) {
                    mutate({
                      resource: "Categories",
                      id: record.id,
                      values: { amount_budgeted: newValue },
                    });
                    setEditingId(null);
                  }
                }}
                onBlur={(e) => {
                  const newValue = parseFloat(
                    e.target.value.replace(/\$\s?|(,*)/g, "")
                  );
                  if (!isNaN(newValue)) {
                    mutate({
                      resource: "Categories",
                      id: record.id,
                      values: { amount_budgeted: newValue },
                    });
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <span onClick={() => setEditingId(record.id?.toString() ?? null)}>
                ${value?.toLocaleString() ?? "0"}
              </span>
            )
          }
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
