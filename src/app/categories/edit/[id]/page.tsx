"use client";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export default function CategoryEdit() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
    </Edit>
  );
}