"use client";

import { Create, useForm } from "@refinedev/antd";
import { Form, DatePicker } from "antd";
import dayjs from "dayjs";

export default function MonthlyBudgetsCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Month"
          name="month"
          rules={[
            {
              required: true,
            },
          ]}
          initialValue={dayjs().startOf("month")}
        >
          <DatePicker picker="month" format="MMMM YYYY" />
        </Form.Item>
      </Form>
    </Create>
  );
}
