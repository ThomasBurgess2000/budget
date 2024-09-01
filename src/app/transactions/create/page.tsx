"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { useNavigation, useList, useOne } from "@refinedev/core";
import { Form, Input, Select, Button } from "antd"; // Add Button import
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

export default function TransactionsCreate() {
  const searchParams = useSearchParams();
  const monthly_budget_id = searchParams.get("monthly_budget_id");

  const { goBack } = useNavigation();
  const [form] = Form.useForm();
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<
    string | null
  >(null);
  const [titleInput, setTitleInput] = useState("");
  const [debouncedTitleInput] = useDebounce(titleInput, 300);

  const { formProps, saveButtonProps, onFinish } = useForm({
    redirect: false,
    onMutationSuccess: () => {
      goBack();
    },
    successNotification: () => {
      return {
        message: "Logged!",
        description: undefined,
        type: "success",
      };
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      await onFinish(values);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const { selectProps: categorySelectProps } = useSelect({
    resource: "Categories",
    filters: [
      {
        field: "monthly_budget",
        operator: "eq",
        value: monthly_budget_id,
      },
    ],
  });

  const { data: categoriesData } = useList({
    resource: "Categories",
    filters: [
      {
        field: "title",
        operator: "eq",
        value: selectedCategoryTitle,
      },
    ],
    pagination: { mode: "off" },
  });

  const categoryIds = categoriesData?.data.map((category) => category.id) || [];

  const { data: transactionsData } = useList({
    resource: "Transactions",
    filters: [
      {
        field: "category",
        operator: "in",
        value: categoryIds,
      },
    ],
  });

  const { data: similarTransactionsData } = useList({
    resource: "Transactions",
    filters: [
      {
        field: "title",
        operator: "contains",
        value: debouncedTitleInput,
      },
    ],
    pagination: { mode: "off" },
  });

  const { data: categoryData } = useOne({
    resource: "Categories",
    id: similarTransactionsData?.data[0]?.category,
    queryOptions: {
      enabled: !!similarTransactionsData?.data[0]?.category,
    },
  });

  useEffect(() => {
    if (selectedCategoryTitle && transactionsData) {
      const titles = transactionsData.data.map(
        (transaction) => transaction.title
      );
      const mostCommonTitle = getMostCommonTitle(titles);

      if (mostCommonTitle && !form.getFieldValue("title")) {
        form.setFieldsValue({ title: mostCommonTitle });
      }
    }
  }, [selectedCategoryTitle, transactionsData, form]);

  useEffect(() => {
    if (
      debouncedTitleInput &&
      similarTransactionsData &&
      !form.getFieldValue("category")
    ) {
      const similarTransaction = similarTransactionsData.data[0];
      if (similarTransaction && similarTransaction.category && categoryData) {
        const categoryTitle = categoryData.data?.title;
        form.setFieldsValue({ category: categoryTitle });
        setSelectedCategoryTitle(categoryTitle);
      }
    }
  }, [debouncedTitleInput, similarTransactionsData, form, categoryData]);

  const getMostCommonTitle = (titles: string[]): string | null => {
    const titleCounts = titles.reduce((acc, title) => {
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let maxCount = 0;
    let mostCommonTitle = null;

    for (const [title, count] of Object.entries(titleCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonTitle = title;
      }
    }

    return mostCommonTitle;
  };

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          form.submit();
        },
      }}
      breadcrumb={false}
    >
      <Form
        {...formProps}
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label={"Category"}
          name={"category"}
          rules={[{ required: true }]}
        >
          <Select
            {...categorySelectProps}
            onChange={(value: any, option: any) => {
              setSelectedCategoryTitle(option?.label ?? null);
            }}
          />
        </Form.Item>
        <Form.Item
          label={"Title"}
          name={["title"]}
          rules={[{ required: true }]}
        >
          <Input
            onChange={(e) => setTitleInput(e.target.value)}
            onFocus={(e) => {
              if (e.target.value) {
                form.setFieldsValue({ title: "" });
              }
            }}
          />
        </Form.Item>
        <Form.Item label={"Amount"} name="amount" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
      </Form>
    </Create>
  );
}
