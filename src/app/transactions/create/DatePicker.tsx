import React, { useState, useRef, useEffect } from "react";
import { DatePicker, Space, Typography } from "antd";
import type { DatePickerProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import "./DatePicker.css";

type DateComponent = Required<
  NonNullable<DatePickerProps<Dayjs>["components"]>
>["date"];
type GetProps<T> = T extends React.ComponentType<infer P> ? P : never;

const MyDatePanel = (props: GetProps<DateComponent>) => {
  const { value, onSelect } = props;
  const [innerValue, setInnerValue] = useState(value || dayjs());
  const scrollRef = useRef<HTMLDivElement>(null);

  const daysInMonth = innerValue.daysInMonth();
  const currentDay = innerValue.date();

  useEffect(() => {
    if (scrollRef.current) {
      const dayWidth = 60; // Width of each day item in pixels
      const containerWidth = scrollRef.current.clientWidth;
      const selectedDayPosition = (currentDay - 1) * dayWidth;
      let newScrollLeft =
        selectedDayPosition - containerWidth / 2 + dayWidth / 2;
      const maxScrollLeft = scrollRef.current.scrollWidth - containerWidth;
      newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
      scrollRef.current.scrollLeft = newScrollLeft;
    }
  }, [innerValue, currentDay]);

  const handleDaySelect = (day: number) => {
    const newDate = innerValue.date(day);
    setInnerValue(newDate);
    onSelect(newDate);
  };

  const renderDays = () => {
    let days: JSX.Element[] = [];
    Array.from({ length: daysInMonth }, (_, i) => i + 1).forEach((day) => {
      if (day > 0 && day <= daysInMonth) {
        days.push(
          <div
            key={day}
            className={`day-item ${day === currentDay ? "selected" : ""}`}
            onClick={() => handleDaySelect(day)}
          >
            {day}
          </div>
        );
      }
    });
    return days;
  };

  return (
    <Space direction="vertical" align="center" className="p-2">
      <Typography.Title level={4} style={{ margin: 0 }}>
        {innerValue.format("MMMM YYYY")}
      </Typography.Title>
      <div className="scroll-container" ref={scrollRef}>
        {renderDays()}
      </div>
    </Space>
  );
};

interface CustomDatePickerProps {
  value?: Dayjs;
  onChange?: (date: Dayjs | null) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
}) => {
  const handleDateChange: DatePickerProps["onChange"] = (date) => {
    if (date && onChange) {
      const dateOnly = date.startOf("day");
      onChange(dateOnly);
    }
  };

  return (
    <DatePicker
      value={value}
      onChange={handleDateChange}
      showNow={false}
      format="M/D/YYYY"
      inputReadOnly
      allowClear={false}
      components={{
        date: MyDatePanel,
      }}
    />
  );
};

export default CustomDatePicker;
