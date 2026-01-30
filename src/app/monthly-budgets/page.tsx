"use client";

import { List, useTable } from "@refinedev/antd";
import { useGo, useDelete } from "@refinedev/core";
import { Table, Button, Popconfirm, Space, Spin } from "antd";
import dayjs from "dayjs";
import { LogPurchaseButton } from "@components/LogPurchaseButton";
import { useState, useRef, useCallback, useEffect } from "react";

export default function MonthlyBudgetsList() {
  const { tableProps, tableQuery } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "month", order: "desc" }],
    },
  });

  const mostRecentBudget = tableProps?.dataSource?.[0];

  const go = useGo();
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const { mutate: deleteMutate } = useDelete();

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPress = (id: string) => {
    setSelectedBudget(id);
  };

  const handleTouchStart = useCallback((id: string) => {
    longPressTimer.current = setTimeout(() => handleLongPress(id), 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectedBudget &&
        !(e.target as HTMLElement).closest(".delete-button")
      ) {
        setSelectedBudget(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [selectedBudget]);

  const preventContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDelete = (id: string) => {
    deleteMutate(
      {
        resource: "MonthlyBudgets",
        id,
        mutationMode: "pessimistic",
        meta: {
          operation: "delete",
        },
      },
      {
        onSuccess: () => {
          // After successful deletion, refresh the table
          tableQuery.refetch();
        },
      }
    );
  };

  const handleRowClick = useCallback(
    (record: any) => {
      if (!selectedBudget && !navigating) {
        setNavigating(true);
        go({
          to: {
            resource: "MonthlyBudgets",
            action: "show",
            id: record.id,
          },
        });
      }
    },
    [go, selectedBudget, navigating]
  );

  const onRow = useCallback(
    (record: any) => {
      return {
        onClick: () => handleRowClick(record),
        onTouchStart: () => handleTouchStart(record.id),
        onTouchEnd: handleTouchEnd,
        onMouseDown: () => handleTouchStart(record.id),
        onMouseUp: handleTouchEnd,
        onMouseLeave: handleTouchEnd,
        onContextMenu: preventContextMenu,
      };
    },
    [handleRowClick, handleTouchStart, handleTouchEnd, preventContextMenu]
  );

  return (
    <List
      breadcrumb={false}
      title="Monthly Budgets"
      wrapperProps={{
        style: {
          marginBottom: "48px",
        },
        className: "w-full md:w-1/2 mx-auto",
      }}
    >
      <Spin spinning={navigating} tip="Loading...">
      <Table {...tableProps} rowKey="id" showHeader={false} onRow={onRow}>
        <Table.Column
          dataIndex="month"
          title="Month"
          render={(value, record: any) => (
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <span>{dayjs(value).format("MMMM YYYY")}</span>
              {selectedBudget === record.id && (
                <Popconfirm
                  title="Are you sure to delete this budget?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    danger
                    onClick={handleDeleteClick}
                    className="delete-button"
                  >
                    Delete
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )}
          sorter
        />
      </Table>
      </Spin>
      {mostRecentBudget?.id && (
        <LogPurchaseButton monthly_budget_id={mostRecentBudget.id.toString()} />
      )}
    </List>
  );
}
