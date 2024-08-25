"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export default function TransactionsCreate() {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: categorySelectProps } = useSelect({
    resource: "Categories",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
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
    </Create>
  );
}
