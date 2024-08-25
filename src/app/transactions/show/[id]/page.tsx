"use client";

import { DateField, MarkdownField, NumberField, Show, TextField } from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;

export default function TransactionsShow() {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;

  const record = data?.data;

  const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    resource: "Categories",
    id: record?.category || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>{"Title"}</Title>
      <TextField value={record?.title} />
      <Title level={5}>{"Amount"}</Title>
      <TextField value={`$${record?.amount}`} />
      <Title level={5}>{"Category"}</Title>
      <TextField
        value={
          categoryIsLoading ? <>Loading...</> : <>{categoryData?.data?.title}</>
        }
      />
      <Title level={5}>{"Created At"}</Title>
      <DateField value={record?.created_at} />
    </Show>
  );
}
