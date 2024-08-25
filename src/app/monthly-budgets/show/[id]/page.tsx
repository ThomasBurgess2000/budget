"use client";

import { useShow, useList, useMany } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Collapse, List as AntdList } from "antd";
import dayjs from "dayjs"; // Import dayjs
import { LogPurchaseButton } from "@components/LogPurchaseButton";
import { useGo } from "@refinedev/core";

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function MonthlyBudgetShow() {
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
        value: dayjs(record?.month).startOf('month').format("YYYY-MM-DD"),
      },
      {
        field: "created_at",
        operator: "lt",
        value: dayjs(record?.month).endOf('month').add(1, 'day').format("YYYY-MM-DD"),
      },
    ],
  });

  const { data: categoriesData, isLoading: categoriesIsLoading } = useMany({
    resource: "Categories",
    ids: transactionsData?.data?.map((transaction) => transaction.category) || [],
    queryOptions: {
      enabled: !!transactionsData?.data,
    },
  });

  if (isLoading || transactionsIsLoading || categoriesIsLoading) {
    return <div>Loading...</div>;
  }

  const groupedTransactions = transactionsData?.data?.reduce((acc, transaction) => {
    const category = categoriesData?.data?.find((cat) => cat.id === transaction.category);
    const categoryId = category?.id;
    if (categoryId && !acc[categoryId]) {
      acc[categoryId] = {
        category: category,
        transactions: [],
        total: 0,
      };
    }
    if (categoryId) {
      acc[categoryId].transactions.push(transaction);
      acc[categoryId].total += transaction.amount;
    }
    return acc;
  }, {});

  return (
    <Show 
      isLoading={isLoading} 
      title={
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>{dayjs(record?.month).format("MMMM YYYY")}</Title>
        </div>
      }
      headerButtons={[]}
    >
      <Collapse>
        {Object.values(groupedTransactions || {}).map((group: any) => (
          <Panel
            header={`${group.category.title} - Total: $${group.total.toFixed(2)}`}
            key={group.category.id}
          >
            <AntdList
              dataSource={group.transactions}
              renderItem={(item: any) => (
                <AntdList.Item
                  onClick={() => go({
                    to: {
                      resource: "Transactions",
                      action: "show",
                      id: item.id,
                    }
                  })}
                  style={{ cursor: 'pointer' }}
                >
                  <Text>
                    {item.title} - ${item.amount.toFixed(2)} - {dayjs(item.created_at).format("M/DD/YY")}
                  </Text>
                </AntdList.Item>
              )}
            />
          </Panel>
        ))}
      </Collapse>
      <LogPurchaseButton />
    </Show>
  );
}