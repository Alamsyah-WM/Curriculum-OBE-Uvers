import { Flex } from "antd";
import React, { Children } from "react";

type LoginProps = {
    children: React.ReactNode;
}

export default function Login({children}: LoginProps) {
  return (
    <div
      style={{
        backgroundColor: "#F1F1F1",
        minHeight: "100vh",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <Flex
        justify="space-between"
        align="stretch"
        gap={24}
        style={{ height: "calc(100vh - 48px)" }}
      >
        <div
          style={{
            width: "100%",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <img
            src="/1505.jpg"
            alt="uvers"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
            }}
          />
        </div>
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
          }}
        >
            {children}
        </div>
      </Flex>
    </div>
  );
}