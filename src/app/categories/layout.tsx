import SharedLayout from "@components/SharedLayout";
import React from "react";

export default function Layout({ children }: React.PropsWithChildren) {
  return <SharedLayout>{children}</SharedLayout>;
}