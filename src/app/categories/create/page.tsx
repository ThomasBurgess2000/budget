"use client";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export default function CategoryCreate() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Amount Budgeted"
          name="amountBudgeted"
          rules={[{ required: true }]}
        >
          <InputNumber
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      </Form>
    </Create>
  );
}