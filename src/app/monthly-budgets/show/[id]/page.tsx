"use client";

import { useMemo, useState } from "react";
import {
  useShow,
  useList,
  useGo,
  useCreate,
  useUpdate,
  useDelete,
} from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Button, Modal, theme } from "antd";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);
import { LogPurchaseButton } from "@components/LogPurchaseButton";
import BudgetSummary from "./components/BudgetSummary";
import EditModeList from "./components/EditModeList";
import CategoryList from "./components/CategoryList";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  created_at: string;
}

const { Title } = Typography;

export default function MonthlyBudgetShow() {
  const [viewMode, setViewMode] = useState<"Planned" | "Spent" | "Remaining">(
    "Planned"
  );
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { query } = useShow();
  const { data, isLoading } = query;
  const record = data?.data;
  const go = useGo();
  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteCategory } = useDelete();
  const { token } = theme.useToken();

  // Fetch previous month's budget
  const previousMonth = dayjs(record?.month).subtract(1, "month");
  const { data: prevBudgetData } = useList({
    resource: "MonthlyBudgets",
    filters: [
      {
        field: "month",
        operator: "eq",
        value: previousMonth.format("YYYY-MM-DD"),
      },
    ],
    queryOptions: {
      enabled: !!record,
    },
    pagination: {
      mode: "off",
    },
  });

  const prevBudgetId = prevBudgetData?.data?.[0]?.id;

  // Fetch previous month's categories
  const { data: prevCategoriesData } = useList({
    resource: "Categories",
    filters: [
      {
        field: "monthly_budget",
        operator: "eq",
        value: prevBudgetId,
      },
    ],
    queryOptions: {
      enabled: !!prevBudgetId,
    },
    pagination: {
      mode: "off",
    },
  });

  // Fetch previous month's transactions
  const { data: prevTransactionsData } = useList({
    resource: "Transactions",
    filters: [
      {
        field: "category",
        operator: "in",
        value: prevCategoriesData?.data?.map((category) => category.id) || [],
      },
    ],
    queryOptions: {
      enabled: !!prevCategoriesData?.data,
    },
    pagination: {
      mode: "off",
    },
  });

  // Calculate rollover amounts for each category in the previous month
  const rolloverAmounts = useMemo(() => {
    if (!prevCategoriesData?.data || !prevTransactionsData?.data) {
      return {};
    }

    return prevCategoriesData.data.reduce((acc, category) => {
      const categoryTransactions = prevTransactionsData.data.filter(
        (transaction) => transaction.category === category.id
      );

      const totalSpent = categoryTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      const rolloverAmount = category.amount_budgeted - totalSpent;

      acc[category.title] = rolloverAmount > 0 ? rolloverAmount : 0;

      return acc;
    }, {});
  }, [prevCategoriesData, prevTransactionsData]);

  const { data: transactionsData } = useList({
    resource: "Transactions",
    queryOptions: {
      enabled: !!record,
    },
    filters: [
      {
        field: "created_at",
        operator: "gte",
        value: dayjs(record?.month).startOf("month").format("YYYY-MM-DD"),
      },
      {
        field: "created_at",
        operator: "lt",
        value: dayjs(record?.month)
          .endOf("month")
          .add(1, "day")
          .format("YYYY-MM-DD"),
      },
    ],
    pagination: {
      mode: "off",
    },
  });

  const { data: categoriesData } = useList({
    resource: "Categories",
    filters: [
      {
        field: "monthly_budget",
        operator: "eq",
        value: record?.id,
      },
    ],
    pagination: {
      mode: "off",
    },
    queryOptions: {
      enabled: !!record,
    },
  });

  const groupedTransactions = categoriesData?.data?.reduce((acc, category) => {
    const categoryTransactions =
      transactionsData?.data?.filter(
        (transaction) => transaction.category === category.id
      ) || [];

    // Sort transactions by date in descending order
    const sortedTransactions = categoryTransactions.sort(
      (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
    );

    acc[category.id!] = {
      category: category,
      transactions: sortedTransactions,
      total: sortedTransactions.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: sortedTransactions.length,
    };

    return acc;
  }, {});

  // Sort categories by transaction count in descending order
  const sortedCategories = Object.values(groupedTransactions || {}).sort(
    (a: any, b: any) => {
      // Check if either category is an income category
      const aIsIncome = a.category.type === "income";
      const bIsIncome = b.category.type === "income";

      // If one is income and the other isn't, prioritize the income category
      if (aIsIncome && !bIsIncome) return -1;
      if (!aIsIncome && bIsIncome) return 1;

      // If both are income or both are not income, sort by transaction count
      return b.transactionCount - a.transactionCount;
    }
  );

  const getButtonColor = () => {
    switch (viewMode) {
      case "Planned":
        return "purple";
      case "Spent":
        return "green";
      case "Remaining":
        return "orange";
    }
  };

  const handleRollover = async (categoryId: string, categoryTitle: string) => {
    const amount = rolloverAmounts[categoryTitle] || 0;
    if (amount <= 0) return;

    Modal.confirm({
      title: `Rollover $${amount.toFixed(2)}?`,
      content: "This will create a new transaction for the rollover amount.",
      onOk: async () => {
        await create({
          resource: "Transactions",
          values: {
            title: "Rollover",
            amount: -amount,
            category: categoryId,
            created_at: dayjs(record?.month)
              .startOf("month")
              .format("YYYY-MM-DD"),
          },
        });
        query.refetch();
      },
    });
  };

  const handleAmountClick = (categoryId: string) => {
    if (viewMode === "Planned") {
      setEditingCategory(categoryId);
    }
  };

  const handleAmountChange = (categoryId: string, newAmount: number | null) => {
    if (newAmount !== null) {
      update({
        resource: "Categories",
        id: categoryId,
        values: { amount_budgeted: newAmount },
        mutationMode: "optimistic",
      });
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this category?",
      content: "This will also delete all associated transactions.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: () => {
        deleteCategory({
          resource: "Categories",
          id: categoryId,
          mutationMode: "pessimistic",
        });
      },
    });
  };

  return (
    <Show
      isLoading={isLoading}
      title={
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Title level={3} style={{ margin: 0 }}>
            {dayjs(record?.month).format("MMMM YYYY")}
          </Title>
        </div>
      }
      breadcrumb={false}
      headerButtons={[
        <Button
          key="viewMode"
          onClick={() =>
            setViewMode((prev) =>
              prev === "Planned"
                ? "Spent"
                : prev === "Spent"
                ? "Remaining"
                : "Planned"
            )
          }
          style={{ backgroundColor: getButtonColor(), color: "white" }}
        >
          {viewMode}
        </Button>,
      ]}
      headerProps={{
        onBack: () => {
          go({
            to: {
              resource: "MonthlyBudgets",
              action: "list",
            },
          });
        },
      }}
      wrapperProps={{
        style: {
          marginBottom: "48px",
        },
        className: "w-full md:w-1/2 mx-auto",
      }}
    >
      <BudgetSummary groupedTransactions={groupedTransactions} />

      {isEditMode ? (
        <EditModeList
          sortedCategories={sortedCategories}
          go={go}
          token={token}
          handleDeleteCategory={handleDeleteCategory}
        />
      ) : (
        <CategoryList
          viewMode={viewMode}
          handleAmountClick={handleAmountClick}
          handleAmountChange={handleAmountChange}
          editingCategory={editingCategory}
          rolloverAmounts={rolloverAmounts}
          handleRollover={handleRollover}
          go={go}
          token={token}
          sortedCategories={sortedCategories}
        />
      )}
      <div style={{ marginTop: "16px", float: "right" }}>
        {isEditMode && (
          <Button
            onClick={() =>
              go({
                to: {
                  resource: "Categories",
                  action: "create",
                },
                query: {
                  monthly_budget_id: record?.id,
                },
              })
            }
            style={{ marginRight: "8px" }}
          >
            Add Category
          </Button>
        )}
        <Button onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? "Leave Editing" : "Edit Categories"}
        </Button>
      </div>
      {record?.id && (
        <LogPurchaseButton monthly_budget_id={record.id.toString()} />
      )}
    </Show>
  );
}
