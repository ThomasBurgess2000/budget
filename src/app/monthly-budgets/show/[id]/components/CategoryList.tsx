import { GoConfig } from "@refinedev/core";
import { GoConfigWithResource } from "@refinedev/core/dist/hooks/router/use-go";
import {
  Button,
  Collapse,
  GlobalToken,
  InputNumber,
  Typography,
  List as AntdList,
} from "antd";
import { Transaction } from "../page";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const { Text } = Typography;

const { Panel } = Collapse;
export default function CategoryList({
  viewMode,
  handleAmountClick,
  handleAmountChange,
  editingCategory,
  rolloverAmounts,
  handleRollover,
  go,
  token,
  sortedCategories,
}: {
  viewMode: string;
  handleAmountClick: (categoryId: string) => void;
  handleAmountChange: (categoryId: string, newAmount: number | null) => void;
  editingCategory: string | null;
  rolloverAmounts: Record<string, number>;
  handleRollover: (categoryId: string, categoryTitle: string) => void;
  go: (config: GoConfigWithResource | GoConfig) => string | void;
  token: GlobalToken;
  sortedCategories: any[];
}) {
  const getHeaderValue = (group: any) => {
    if (group.category.type === "income") {
      return `$${group.category.amount_budgeted.toFixed(2)}`;
    }

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
  return (
    <Collapse>
      {sortedCategories.map((group: any) => (
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
          style={
            group.category.type === "income"
              ? {
                  boxShadow: `3px 0 0 ${token.colorSuccess} inset`,
                }
              : { boxShadow: `3px 0 0 orange inset` }
          }
        >
          {group.transactions.length > 0 ? (
            <>
              {Object.entries(
                group.transactions.reduce(
                  (
                    acc: Record<string, Transaction[]>,
                    transaction: Transaction
                  ) => {
                    // Convert the date to UTC, then format it
                    const date = dayjs(transaction.created_at).utc().format("Do");
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
                        <Text>{item.amount < 0 ? Math.abs(item.amount).toFixed(2) : (-item.amount).toFixed(2)}</Text>
                      </AntdList.Item>
                    )}
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="md:flex md:items-center">
                <Text>No transactions for this category yet.</Text>
                {rolloverAmounts[group.category.title] > 0 && (
                  <Button
                    onClick={() =>
                      handleRollover(group.category.id, group.category.title)
                    }
                    className="md:ml-2 mt-2"
                  >
                    Rollover ${rolloverAmounts[group.category.title].toFixed(2)}?
                  </Button>
                )}
              </div>
            </>
          )}
        </Panel>
      ))}
    </Collapse>
  );
}
