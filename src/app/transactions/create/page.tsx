"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Form, Input, Select } from "antd";

export default function TransactionsCreate() {
  const { goBack } = useNavigation();

  const { formProps, saveButtonProps } = useForm({
    redirect: false,
    onMutationSuccess: () => {
      goBack();
    },
    successNotification: () => {
      return {
        message: "Logged!",
        description: undefined,
        type: "success",
      }
    }
  });

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
