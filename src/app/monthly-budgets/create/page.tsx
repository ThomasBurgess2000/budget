"use client";

import { Create, useForm } from "@refinedev/antd";
import { useList, useCreate } from "@refinedev/core";
import { Form, DatePicker, notification } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { BaseRecord, HttpError } from "@refinedev/core";

export default function MonthlyBudgetsCreate() {
  const { formProps, saveButtonProps, onFinish } = useForm<
    BaseRecord,
    HttpError
  >();
  const { mutate: createCategory } = useCreate();

  const { data: monthlyBudgets } = useList({
    resource: "MonthlyBudgets",
    pagination: { mode: "off" },
    sorters: [{ field: "month", order: "desc" }],
  });

  const { data: allCategories } = useList({
    resource: "Categories",
    pagination: { mode: "off" },
  });

  const handleFormSubmit = async (values: any) => {
    try {
      const result = await onFinish(values);

      if (result?.data?.id) {
        const newBudgetId = result.data.id;
        const selectedMonth = dayjs(values.month);

        // Find the previous month's budget
        const prevMonthBudget = monthlyBudgets?.data?.find((budget) =>
          dayjs(budget.month).isBefore(selectedMonth, "month")
        );

        if (prevMonthBudget) {
          const prevCategories = allCategories?.data?.filter(
            (category) => category.monthly_budget === prevMonthBudget.id
          );

          // Create new categories for the new budget
          for (const category of prevCategories || []) {
            await createCategory({
              resource: "Categories",
              values: {
                title: category.title,
                amount_budgeted: category.amount_budgeted,
                monthly_budget: newBudgetId,
                type: category.type,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("Error creating monthly budget:", error);
      notification.error({
        message: "Failed to create monthly budget with categories.",
      });
    }
  };

  useEffect(() => {
    const getDefaultMonth = () => {
      const currentMonth = dayjs().startOf("month");
      const existingBudget = monthlyBudgets?.data?.find(
        (budget) =>
          dayjs(budget.month).format("YYYY-MM") ===
          currentMonth.format("YYYY-MM")
      );
      return existingBudget ? currentMonth.add(1, "month") : currentMonth;
    };

    const defaultMonth = getDefaultMonth();
    formProps.form?.setFieldsValue({ month: defaultMonth });
  }, [monthlyBudgets, formProps.form]);

  return (
    <Create
      saveButtonProps={saveButtonProps}
      breadcrumb={false}
      title="Create Monthly Budget"
    >
      <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
        <Form.Item label="Month" name="month" rules={[{ required: true }]}>
          <DatePicker picker="month" format="MMMM YYYY" />
        </Form.Item>
      </Form>
    </Create>
  );
}
