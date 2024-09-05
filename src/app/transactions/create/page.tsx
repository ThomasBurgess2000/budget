"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { useNavigation, useList, useOne } from "@refinedev/core";
import { Form, Input, Select, Row, Col, InputNumber } from "antd"; // Add DatePicker import
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import CustomDatePicker from "./DatePicker";

const { Option } = Select;

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
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);
  const [selectBeforeValue, setSelectBeforeValue] = useState("add");

  const handleAmountChange = (plusMinus: string, amount: number | null) => {
    if (amount !== null) {
      const adjustedValue =
        plusMinus === "minus" ? -Math.abs(amount) : Math.abs(amount);
      formProps.form?.setFieldsValue({ amount: adjustedValue });
    }
  };

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
      // Ensure the amount is negative if "minus" is selected
      if (selectBeforeValue === "minus") {
        values.amount = -Math.abs(values.amount);
      }
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
      !userSelectedCategory // Check if user hasn't selected a category
    ) {
      const similarTransaction = similarTransactionsData.data[0];
      if (similarTransaction && similarTransaction.category && categoryData) {
        const categoryTitle = categoryData.data?.title;
        form.setFieldsValue({ category: categoryTitle });
        setSelectedCategoryTitle(categoryTitle);
      }
    }
  }, [
    debouncedTitleInput,
    similarTransactionsData,
    form,
    categoryData,
    userSelectedCategory,
  ]);

  useEffect(() => {
    if (titleInput === "Rollover") {
      setSelectBeforeValue("minus");
    }
  }, [titleInput, form]);

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
        if (title === "Rollover") {
          setSelectBeforeValue("minus");
        }
      }
    }

    return mostCommonTitle;
  };

  const currentDate = dayjs();

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          form.submit();
        },
      }}
      breadcrumb={false}
      wrapperProps={{
        style: {
          marginBottom: "48px",
        },
        className: "w-full md:w-1/2 mx-auto",
      }}
    >
      <Form
        {...formProps}
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ...formProps.initialValues,
          created_at: formProps.initialValues?.created_at
            ? dayjs(formProps.initialValues.created_at)
            : currentDate,
        }}
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
              setUserSelectedCategory(true); // Set flag when user selects a category
            }}
          />
        </Form.Item>
        <Form.Item
          label={"Title"}
          name={["title"]}
          rules={[{ required: true }]}
        >
          <Input
            onChange={(e) => {
              setTitleInput(e.target.value);
              if (e.target.value === "Rollover") {
                setSelectBeforeValue("minus");
              }
            }}
            onFocus={(e) => {
              // Only clear the title if it was auto-populated and not manually entered
              if (e.target.value && !titleInput) {
                form.setFieldsValue({ title: "" });
              }
            }}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={"Amount"}
              name="amount"
              rules={[{ required: true }]}
            >
              <InputNumber
                addonBefore={
                  <Select
                    value={selectBeforeValue}
                    style={{ width: 60 }}
                    onChange={(value) => {
                      setSelectBeforeValue(value);
                      const currentAmount = form.getFieldValue("amount");
                      handleAmountChange(value, currentAmount);
                    }}
                  >
                    <Option value="add">+</Option>
                    <Option value="minus">-</Option>
                  </Select>
                }
                changeOnWheel={false}
                controls={false}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={"Date"}
              name="created_at"
              rules={[{ required: true }]}
            >
              <CustomDatePicker />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
}
