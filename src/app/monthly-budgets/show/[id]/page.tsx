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
import {
  Typography,
  Collapse,
  List as AntdList,
  Button,
  Modal,
  InputNumber,
} from "antd";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);
import { LogPurchaseButton } from "@components/LogPurchaseButton";
import { DeleteOutlined } from "@ant-design/icons";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  created_at: string;
}

const { Title, Text } = Typography;
const { Panel } = Collapse;

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

  // Fetch previous month's budget
  const previousMonth = dayjs(record?.month).subtract(1, "month");
  const { data: prevBudgetData, isLoading: prevBudgetIsLoading } = useList({
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
  });

  const prevBudgetId = prevBudgetData?.data?.[0].id;

  // Fetch previous month's categories
  const { data: prevCategoriesData, isLoading: prevCategoriesIsLoading } =
    useList({
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
    });

  // Fetch previous month's transactions
  const { data: prevTransactionsData, isLoading: prevTransactionsIsLoading } =
    useList({
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

  const { data: transactionsData, isLoading: transactionsIsLoading } = useList({
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
  });

  const { data: categoriesData, isLoading: categoriesIsLoading } = useList({
    resource: "Categories",
    filters: [
      {
        field: "monthly_budget",
        operator: "eq",
        value: record?.id,
      },
    ],
    queryOptions: {
      enabled: !!record,
    },
  });

  if (isLoading || transactionsIsLoading || categoriesIsLoading) {
    return <div>Loading...</div>;
  }

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
    };

    return acc;
  }, {});

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

  const getHeaderValue = (group: any) => {
    switch (viewMode) {
      case "Planned":
        return (
          <span onClick={() => handleAmountClick(group.category.id)}>
            {editingCategory === group.category.id ? (
              <InputNumber
                defaultValue={group.category.amount_budgeted}
                onBlur={(e) =>
                  handleAmountChange(
                    group.category.id,
                    parseFloat(e.target.value)
                  )
                }
                onPressEnter={(e) =>
                  handleAmountChange(
                    group.category.id,
                    parseFloat((e.target as HTMLInputElement).value)
                  )
                }
                autoFocus
                style={{ width: "100px" }}
              />
            ) : (
              `$${group.category.amount_budgeted.toFixed(2)}`
            )}
          </span>
        );
      case "Spent":
        return `$${group.total.toFixed(2)}`;
      case "Remaining":
        return `$${(group.category.amount_budgeted - group.total).toFixed(2)}`;
    }
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
    >
      {isEditMode ? (
        <AntdList
          dataSource={Object.values(groupedTransactions || {})}
          renderItem={(group: any) => (
            <AntdList.Item
              style={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div
                onClick={() =>
                  go({
                    to: {
                      resource: "Categories",
                      action: "edit",
                      id: group.category.id,
                    },
                  })
                }
              >
                <Text>{group.category.title}</Text>
              </div>
              <div>
                <Text>${group.category.amount_budgeted.toFixed(2)}</Text>
                <DeleteOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(group.category.id);
                  }}
                  style={{ marginLeft: "16px", color: "#ff4d4f" }}
                />
              </div>
            </AntdList.Item>
          )}
        />
      ) : (
        <Collapse>
          {Object.values(groupedTransactions || {}).map((group: any) => (
            <Panel
              header={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span>{group.category.title}</span>
                  <span>{getHeaderValue(group)}</span>
                </div>
              }
              key={group.category.id}
            >
              {group.transactions.length > 0 ? (
                <>
                  {Object.entries(
                    group.transactions.reduce(
                      (
                        acc: Record<string, Transaction[]>,
                        transaction: Transaction
                      ) => {
                        const date = dayjs(transaction.created_at).format("Do");
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(transaction);
                        return acc;
                      },
                      {}
                    )
                  ).map(([date, transactions]) => (
                    <div key={date}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          borderBottom: "1px solid #e8e8e8",
                          paddingBottom: "4px",
                        }}
                      >
                        {date}
                      </Text>
                      <AntdList
                        dataSource={transactions as Transaction[]}
                        renderItem={(item: Transaction) => (
                          <AntdList.Item
                            onClick={() =>
                              go({
                                to: {
                                  resource: "Transactions",
                                  action: "show",
                                  id: item.id,
                                },
                              })
                            }
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text>{item.title}</Text>
                            <Text>${item.amount.toFixed(2)}</Text>
                          </AntdList.Item>
                        )}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <Text>No transactions for this category yet.</Text>
                  {rolloverAmounts[group.category.title] > 0 && (
                    <Button
                      onClick={() =>
                        handleRollover(group.category.id, group.category.title)
                      }
                      style={{ marginTop: "8px" }}
                    >
                      Rollover $
                      {rolloverAmounts[group.category.title].toFixed(2)}?
                    </Button>
                  )}
                </>
              )}
            </Panel>
          ))}
        </Collapse>
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
      <LogPurchaseButton />
    </Show>
  );
}
