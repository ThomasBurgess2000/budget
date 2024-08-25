"use client";

import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export default function TransactionsEdit() {
  const { formProps, saveButtonProps, queryResult } = useForm({
    meta: {
      select: "*, Categories(id,title)",
    },
  });

  const blogPostsData = queryResult?.data?.data;

  const { selectProps: categorySelectProps } = useSelect({
    resource: "Categories",
    defaultValue: blogPostsData?.categories?.id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Title"}
          name={["title"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={"Amount"}
          name="amount"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item
          label={"Category"}
          name={"category"}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select {...categorySelectProps} />
        </Form.Item>
      </Form>
    </Edit>
  );
}
