"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  MarkdownField,
  NumberField,
  Show,
  TextField,
} from "@refinedev/antd";
import { useNavigation, useOne, useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

export default function TransactionsShow() {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;
  const { goBack } = useNavigation();

  const record = data?.data;

  const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    resource: "Categories",
    id: record?.category || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          <EditButton />
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} onSuccess={() => goBack()} />
          )}
        </>
      )}
      breadcrumb={false}
    >
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
      <DateField
        value={dayjs(record?.created_at).utc().format("YYYY-MM-DD HH:mm:ss")}
      />
    </Show>
  );
}
