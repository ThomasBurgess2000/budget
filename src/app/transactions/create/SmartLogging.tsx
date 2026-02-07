"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Button,
  Card,
  List,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  message,
  Spin,
  Typography,
  Row,
  Col,
  DatePicker,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import { useList, useNavigation } from "@refinedev/core";
import type { UploadFile } from "antd/es/upload/interface";
import type {
  SuggestedTransaction,
  SmartLoggingResponse,
  Category,
} from "@/types/smart-logging";
import dayjs from "dayjs";

const { Text } = Typography;

interface SmartLoggingProps {
  monthlyBudgetId: string;
}

export default function SmartLogging({ monthlyBudgetId }: SmartLoggingProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedTransaction[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { goBack } = useNavigation();

  const { data: categoriesData } = useList<Category>({
    resource: "Categories",
    filters: [
      {
        field: "monthly_budget",
        operator: "eq",
        value: monthlyBudgetId,
      },
    ],
    pagination: { mode: "off" },
  });

  const categories = categoriesData?.data || [];

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) return;

      event.preventDefault();

      const newFiles: UploadFile[] = [];

      imageItems.forEach((item, index) => {
        const file = item.getAsFile();
        if (file && fileList.length + newFiles.length < 5) {
          const uid = `pasted-${Date.now()}-${index}`;
          const uploadFile: UploadFile = {
            uid,
            name: `pasted-image-${index + 1}.png`,
            status: "done",
            originFileObj: file as any,
            thumbUrl: URL.createObjectURL(file),
          };
          newFiles.push(uploadFile);
        }
      });

      if (newFiles.length > 0) {
        setFileList((prev) => [...prev, ...newFiles]);
        message.success(`Pasted ${newFiles.length} image(s)`);
      }
    },
    [fileList.length]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const compressImage = (file: File, maxDim = 1600, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (fileList.length === 0) {
      message.warning("Please upload at least one receipt image");
      return;
    }

    setAnalyzing(true);
    setSuggestions([]);

    try {
      const base64Images = await Promise.all(
        fileList.map(async (file) => {
          if (file.originFileObj) {
            return compressImage(file.originFileObj);
          }
          return "";
        })
      );

      const validImages = base64Images.filter((img) => img !== "");

      const response = await fetch("/api/smart-logging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: validImages,
          monthly_budget_id: monthlyBudgetId,
        }),
      });

      const data: SmartLoggingResponse = await response.json();

      if (data.error) {
        message.error(data.error);
        return;
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        message.success(`Found ${data.suggestions.length} transaction(s)`);
      } else {
        message.info("No transactions found in the images");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      message.error("Failed to analyze images");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateSuggestion = (id: string, updates: Partial<SuggestedTransaction>) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleApprove = (id: string) => {
    updateSuggestion(id, { status: "approved" });
  };

  const handleReject = (id: string) => {
    updateSuggestion(id, { status: "rejected" });
  };

  const handleApproveAll = () => {
    setSuggestions((prev) =>
      prev.map((s) => (s.status === "pending" ? { ...s, status: "approved" } : s))
    );
  };

  const handleSubmit = async () => {
    const approvedTransactions = suggestions.filter((s) => s.status === "approved");

    if (approvedTransactions.length === 0) {
      message.warning("No transactions approved for submission");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/smart-logging/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: approvedTransactions.map((t) => ({
            title: t.title,
            amount: t.amount,
            category_id: t.category_id,
            transaction_date: t.transaction_date,
            description: t.description,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(`Created ${approvedTransactions.length} transaction(s)`);
        goBack();
      } else {
        message.error(data.error || "Failed to create transactions");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to submit transactions");
    } finally {
      setSubmitting(false);
    }
  };

  const approvedCount = suggestions.filter((s) => s.status === "approved").length;
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div style={{ padding: "0 24px" }}>
      <Card title="Upload Receipt Photos" style={{ marginBottom: 16 }}>
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={handleUploadChange}
          beforeUpload={() => false}
          accept="image/*"
          multiple
        >
          {fileList.length < 5 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          You can also paste images directly (Ctrl+V / Cmd+V)
        </Text>
        <Button
          type="primary"
          icon={<ScanOutlined />}
          onClick={handleAnalyze}
          loading={analyzing}
          disabled={fileList.length === 0}
          style={{ marginTop: 16 }}
        >
          {analyzing ? "Analyzing..." : "Analyze Photos"}
        </Button>
      </Card>

      {analyzing && (
        <Card style={{ marginBottom: 16, textAlign: "center" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: 16 }}>
            Analyzing receipt images with AI...
          </Text>
        </Card>
      )}

      {suggestions.length > 0 && (
        <>
          <Card
            title={
              <Space>
                <span>Suggested Transactions</span>
                {pendingCount > 0 && <Tag color="blue">{pendingCount} pending</Tag>}
                {approvedCount > 0 && <Tag color="green">{approvedCount} approved</Tag>}
              </Space>
            }
            extra={
              pendingCount > 0 && (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleApproveAll}
                >
                  Approve All
                </Button>
              )
            }
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={suggestions}
              renderItem={(item) => (
                <List.Item
                  style={{
                    backgroundColor:
                      item.status === "approved"
                        ? "#f6ffed"
                        : item.status === "rejected"
                        ? "#fff2f0"
                        : "transparent",
                    padding: 16,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} sm={12} md={6}>
                        <Text strong>Title</Text>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateSuggestion(item.id, { title: e.target.value })
                          }
                          disabled={item.status === "rejected"}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <Text strong>Amount</Text>
                        <InputNumber
                          value={item.amount}
                          onChange={(value) =>
                            updateSuggestion(item.id, { amount: value || 0 })
                          }
                          disabled={item.status === "rejected"}
                          style={{ width: "100%" }}
                          prefix="$"
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Text strong>Category</Text>
                        <Select
                          value={String(item.category_id)}
                          onChange={(value) => {
                            const category = categories.find((c) => String(c.id) === String(value));
                            updateSuggestion(item.id, {
                              category_id: String(value),
                              category_name: category?.title || "",
                            });
                          }}
                          disabled={item.status === "rejected"}
                          style={{ width: "100%" }}
                          options={categories.map((c) => ({
                            value: String(c.id),
                            label: c.title,
                          }))}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <Text strong>Date</Text>
                        <DatePicker
                          value={dayjs(item.transaction_date)}
                          onChange={(date) =>
                            updateSuggestion(item.id, {
                              transaction_date: date?.format("YYYY-MM-DD") || item.transaction_date,
                            })
                          }
                          disabled={item.status === "rejected"}
                          style={{ width: "100%" }}
                        />
                      </Col>
                      <Col xs={24} sm={24} md={4}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          {item.status === "pending" ? (
                            <Space wrap>
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                size="small"
                                onClick={() => handleApprove(item.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                danger
                                icon={<CloseOutlined />}
                                size="small"
                                onClick={() => handleReject(item.id)}
                              >
                                Reject
                              </Button>
                            </Space>
                          ) : item.status === "approved" ? (
                            <Space wrap>
                              <Tag color="green">Approved</Tag>
                              <Button
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => updateSuggestion(item.id, { status: "pending" })}
                              >
                                Undo
                              </Button>
                            </Space>
                          ) : (
                            <Space wrap>
                              <Tag color="red">Rejected</Tag>
                              <Button
                                size="small"
                                onClick={() => updateSuggestion(item.id, { status: "pending" })}
                              >
                                Undo
                              </Button>
                            </Space>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              disabled={approvedCount === 0}
            >
              Submit {approvedCount > 0 ? `${approvedCount} Transaction(s)` : ""}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
