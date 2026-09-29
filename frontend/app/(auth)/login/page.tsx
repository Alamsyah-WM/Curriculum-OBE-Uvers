"use client";

import { Button, Flex, Form, Input, message } from "antd";
import "@/component/typhography.css";
import { login } from "@/service/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      const response = await login({
        email: values.email,
        password: values.password,
      });

      if (response.token) {
        // localStorage.setItem("token", response.token);
        document.cookie = `token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      }

      if (response.roles && Array.isArray(response.roles) && response.roles.length > 0) {
        localStorage.setItem("roles", JSON.stringify(response.roles));        
      }

      message.success("Login success");
      router.push("/role");
    } catch (error: any) {
      message.error(error?.message || "Login failed");
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        height: "100%",
      }}
    >
      <div
        style={{
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div
          className="title-large"
          style={{
            marginBottom: 8,
          }}
        >
          Welcome Back👋
        </div>

        <div
          className="roboto-mono"
          style={{
            marginBottom: 12,
          }}
        >
          Please login to your account
        </div>

        <Form
          layout="vertical"
          form={form}
          style={{ width: 320 }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Masukan Email Anda!" },
              { type: "email", message: "Format email tidak valid!" },
            ]}
            style={{ marginBottom: 10 }}
          >
            <div>
              <Input placeholder="Email" />
              <div
                className="body-small"
                style={{
                  marginLeft: 12,
                  marginTop: 8,
                  opacity: 0.5,
                }}
              >
                Email
              </div>            
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Masukan Password Anda!" }]}
            style={{ marginBottom: 12 }}
          >
            <div>
              <Input.Password placeholder="Password" />
              <div
                className="body-small"
                style={{
                  marginLeft: 12,
                  marginTop: 8,
                  opacity: 0.5,
                }}
              >
                Password
              </div>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: "#016FB9" }}
              block
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Flex>
  );
}