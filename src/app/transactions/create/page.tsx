"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { useNavigation, useList, useOne } from "@refinedev/core";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  Checkbox,
  Spin,
  Typography,
} from "antd";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import dayjs, { Dayjs } from "dayjs";
import CustomDatePicker from "./DatePicker";
import { Card } from "antd/lib";

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
  const [continueLogging, setContinueLogging] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();

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
      if (!continueLogging) {
        goBack();
      } else {
        // Clear the form
        form.resetFields();
        // Reset the date to the current date or first day of budget month
        form.setFieldsValue({ created_at: dayjs(currentDate) });
      }
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

      // Format the created_at field as a date-only string
      if (values.created_at) {
        values.created_at = values.created_at.format("YYYY-MM-DD");
      }

      setTitleInput("");
      setUserSelectedCategory(false);
      setSelectBeforeValue("add");
      setSelectedCategoryTitle(null);
      setSelectedDate(undefined);
      setSelectedCategory(undefined);
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

  const { data: currentMonthCategoryData } = useList({
    resource: "Categories",
    filters: [
      {
        field: "monthly_budget",
        operator: "eq",
        value: monthly_budget_id,
      },
      {
        field: "title",
        operator: "eq",
        value: categoryData?.data?.title,
      },
    ],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!categoryData?.data?.title,
    },
  });

  // Fetch the budget data
  const { data: budgetData, isLoading: isBudgetLoading } = useOne({
    resource: "MonthlyBudgets",
    id: monthly_budget_id || "",
    queryOptions: {
      enabled: !!monthly_budget_id,
    },
  });

  // Extract the budget month
  const budgetMonth: Dayjs | undefined = budgetData?.data?.month
    ? dayjs(budgetData.data.month)
    : undefined;

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
      titleInput !== "" &&
      debouncedTitleInput &&
      similarTransactionsData &&
      !userSelectedCategory // Check if user hasn't selected a category
    ) {
      const similarTransaction = similarTransactionsData.data[0];
      if (similarTransaction && similarTransaction.category && categoryData) {
        const categoryId = currentMonthCategoryData?.data[0]?.id;
        const categoryTitle = currentMonthCategoryData?.data[0]?.title;
        if (!categoryTitle) return; // If the category title is null, return

        form.setFieldsValue({ category: categoryId }); // Set the category ID
        setSelectedCategoryTitle(categoryTitle);
      }
    }
  }, [
    debouncedTitleInput,
    similarTransactionsData,
    form,
    categoryData,
    userSelectedCategory,
    titleInput,
    currentMonthCategoryData,
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

  const { data: alreadyRecordedTransactionsData } = useList({
    resource: "Transactions",
    filters: [
      {
        field: "created_at",
        operator: "eq",
        value: selectedDate,
      },
      {
        field: "category",
        operator: "eq",
        value: selectedCategory,
      },
    ],
    queryOptions: {
      enabled: !!selectedDate && !!selectedCategory,
    },
  });

  const currentDate = dayjs();

  if (isBudgetLoading) {
    return <Spin />;
  }

  return (
    <>
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
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Form
          {...formProps}
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(_, values) => {
            setSelectedDate(values.created_at?.format("YYYY-MM-DD"));
          }}
          initialValues={{
            ...formProps.initialValues,
            created_at: formProps.initialValues?.created_at
              ? dayjs(formProps.initialValues.created_at)
              : budgetMonth && !budgetMonth.isSame(currentDate, "month")
              ? budgetMonth.startOf("month")
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
                setSelectedCategory(value);
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
                      style={{ width: 100 }}
                      onChange={(value) => {
                        setSelectBeforeValue(value);
                        const currentAmount = form.getFieldValue("amount");
                        handleAmountChange(value, currentAmount);
                      }}
                    >
                      <Option value="add">Expense</Option>
                      <Option value="minus">Income</Option>
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
                <CustomDatePicker month={budgetMonth} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Checkbox
          checked={continueLogging}
          onChange={(e) => setContinueLogging(e.target.checked)}
        >
          Continue Logging
        </Checkbox>
      </Create>
      {alreadyRecordedTransactionsData?.data &&
        alreadyRecordedTransactionsData?.data.length > 0 &&
        selectedDate &&
        selectedCategory && (
          <div className="flex justify-center">
            <Card className="w-full md:w-1/2">
              <Typography.Text>
                Already recorded transactions for this date and category:
                <br />
                <br />
                {alreadyRecordedTransactionsData?.data.map((transaction) => (
                  <>
                    <Typography.Text key={transaction.id}>
                      {transaction.title} - ${transaction.amount}
                    </Typography.Text>
                    <br />
                  </>
                ))}
              </Typography.Text>
            </Card>
          </div>
        )}
    </>
  );
}
