"use client";

import { Create, useForm } from "@refinedev/antd";
import { useGo } from "@refinedev/core";
import { Form, Input, InputNumber } from "antd";
import { useSearchParams } from "next/navigation";

export default function CategoryCreate() {
  const searchParams = useSearchParams();
  const monthly_budget_id = searchParams.get("monthly_budget_id");

  const go = useGo();

  const { formProps, saveButtonProps } = useForm({
    redirect: false, 
    onMutationSuccess: () => {
      // After successful creation, navigate back to the monthly budget show page
      if (monthly_budget_id) {
        go({
          to: {
            resource: "MonthlyBudgets",
            action: "show",
            id: monthly_budget_id,
          },
        });
      } else {
        // Fallback to categories list if no monthly_budget_id is available
        go({ to: { resource: "Categories", action: "list" } });
      }
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values) => {
          return formProps.onFinish?.({
            ...values,
            monthly_budget: monthly_budget_id,
          });
        }}
      >
        <Form.Item label="Title" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Amount Budgeted"
          name="amount_budgeted"
          rules={[{ required: true }]}
        >
          <InputNumber
            formatter={(value) =>
              `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>
        {/* Hidden field for monthly_budget */}
        <Form.Item
          name="monthly_budget"
          hidden
          initialValue={monthly_budget_id}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
}
