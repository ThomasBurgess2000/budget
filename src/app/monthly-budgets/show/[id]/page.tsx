"use client";

import { useState } from "react";
import { useShow, useList, useGo } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Collapse, List as AntdList, Button } from "antd";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);
import { LogPurchaseButton } from "@components/LogPurchaseButton";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  created_at: string;
}

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function MonthlyBudgetShow() {
  const [viewMode, setViewMode] = useState<"Planned" | "Spent" | "Remaining">("Planned");
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;
  const go = useGo();

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
    const categoryTransactions = transactionsData?.data?.filter(
      (transaction) => transaction.category === category.id
    ) || [];
    
    // Sort transactions by date in descending order
    const sortedTransactions = categoryTransactions.sort((a, b) => 
      dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
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
      case "Planned": return "purple";
      case "Spent": return "green";
      case "Remaining": return "orange";
    }
  };

  const getHeaderValue = (group: any) => {
    switch (viewMode) {
      case "Planned": return `$${group.category.amount_budgeted.toFixed(2)}`;
      case "Spent": return `$${group.total.toFixed(2)}`;
      case "Remaining": return `$${(group.category.amount_budgeted - group.total).toFixed(2)}`;
    }
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
          onClick={() => setViewMode(prev => prev === "Planned" ? "Spent" : prev === "Spent" ? "Remaining" : "Planned")}
          style={{ backgroundColor: getButtonColor(), color: "white" }}
        >
          {viewMode}
        </Button>
      ]}
    >
      <Collapse>
        {Object.values(groupedTransactions || {}).map((group: any) => (
          <Panel
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{group.category.title}</span>
                <span>{getHeaderValue(group)}</span>
              </div>
            }
            key={group.category.id}
          >
            {group.transactions.length > 0 ? (
              <>
                {Object.entries(
                  group.transactions.reduce((acc: Record<string, Transaction[]>, transaction: Transaction) => {
                    const date = dayjs(transaction.created_at).format('Do');
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(transaction);
                    return acc;
                  }, {})
                ).map(([date, transactions]) => (
                  <div key={date}>
                    <Text strong style={{ 
                      display: 'block', 
                      marginBottom: '8px',
                      borderBottom: '1px solid #e8e8e8',
                      paddingBottom: '4px'
                    }}>
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
                          style={{ cursor: "pointer" }}
                        >
                          <Text>
                            {item.title} - ${item.amount.toFixed(2)}
                          </Text>
                        </AntdList.Item>
                      )}
                    />
                  </div>
                ))}
              </>
            ) : (
              <Text>No transactions for this category yet.</Text>
            )}
          </Panel>
        ))}
      </Collapse>
      <Button
        style={{ marginTop: '16px', float: 'right' }}
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
      >
        Add Category
      </Button>
      <LogPurchaseButton />
    </Show>
  );
}