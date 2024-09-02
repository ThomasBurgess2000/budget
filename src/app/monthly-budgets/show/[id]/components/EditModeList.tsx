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
}: {
  sortedCategories: any[];
  handleDeleteCategory: (categoryId: string) => void;
  go: (config: GoConfigWithResource | GoConfig) => string | void;
  token: GlobalToken;
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
            ...(group.category.type === "income" && {
              border: `2px solid ${token.colorSuccess}`,
              marginBottom: token.marginXS,
            }),
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
  );
}
