"use client";

import CustomDatePicker from "@app/transactions/create/DatePicker";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Row, Col, InputNumber } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;

export default function TransactionsEdit() {
  const { formProps, saveButtonProps, query, onFinish } = useForm({
    meta: {
      select: "*, Categories(id,title)",
    },
    successNotification: () => {
      return {
        message: "Updated!",
        description: undefined,
        type: "success",
      };
    },
  });

  const blogPostsData = query?.data?.data;

  const { selectProps: categorySelectProps } = useSelect({
    resource: "Categories",
    defaultValue: blogPostsData?.categories?.id,
  });

  const [selectBeforeValue, setSelectBeforeValue] = useState("add");

  const handleSubmit = async (values: any) => {
    try {
      // Ensure the amount is negative if "minus" is selected
      if (selectBeforeValue === "minus") {
        values.amount = -Math.abs(values.amount);
      }
      await onFinish(values);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleAmountChange = (plusMinus: string, amount: number | null) => {
    if (amount !== null) {
      const adjustedValue =
        plusMinus === "minus" ? -Math.abs(amount) : Math.abs(amount);
      formProps.form?.setFieldsValue({ amount: adjustedValue });
    }
  };

  return (
    <Edit
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          formProps.form?.submit();
        },
      }}
      wrapperProps={{
        style: {
          marginBottom: "48px",
        },
        className: "w-full md:w-1/2 mx-auto",
      }}
    >
      <Form
        {...formProps}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ...formProps.initialValues,
          created_at: formProps.initialValues?.created_at
            ? dayjs(formProps.initialValues.created_at).utc()
            : undefined,
        }}
      >
        <Form.Item
          label={"Category"}
          name={"category"}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select {...categorySelectProps} />
        </Form.Item>
        <Form.Item
          label={"Title"}
          name={["title"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
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
                    style={{ width: 60 }}
                    onChange={(value) => {
                      setSelectBeforeValue(value);
                      const currentAmount =
                        formProps.form?.getFieldValue("amount");
                      handleAmountChange(value, currentAmount);
                    }}
                  >
                    <Option value="add">+</Option>
                    <Option value="minus">-</Option>
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
              getValueProps={(value) => ({
                value: value ? dayjs(value).utc() : undefined,
              })}
            >
              <CustomDatePicker />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
}
