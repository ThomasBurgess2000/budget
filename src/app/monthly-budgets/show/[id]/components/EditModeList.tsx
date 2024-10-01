import { GoConfig } from "@refinedev/core";
import { GoConfigWithResource } from "@refinedev/core/dist/hooks/router/use-go";
import { Typography, List as AntdList, GlobalToken } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;
export default function EditModeList({
  sortedCategories,
  handleDeleteCategory,
  go,
  token,
  monthly_budget_id,
}: {
  sortedCategories: any[];
  handleDeleteCategory: (categoryId: string) => void;
  go: (config: GoConfigWithResource | GoConfig) => string | void;
  token: GlobalToken;
  monthly_budget_id: string;
}) {
  return (
    <AntdList
      dataSource={sortedCategories}
      renderItem={(group: any) => (
        <AntdList.Item
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            paddingLeft: "6px",
            ...(group.category.type === "income" ? {
                boxShadow: `3px 0 0 ${token.colorSuccess} inset`,
              }
            : { boxShadow: `3px 0 0 orange inset` }),
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
                query: {
                  monthly_budget_id: monthly_budget_id,
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
  );
}
