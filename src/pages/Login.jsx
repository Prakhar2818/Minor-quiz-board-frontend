import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message } from "antd";
import axios from "axios";
import { AuthContext } from "../config/AuthContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, values);
      setAuth({ token: res.data.token, username: res.data.username });
      message.success("Login successful!");
      navigate("/home");
    } catch (error) {
      message.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card title="Login to Quiz Board" className="auth-card">
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Login
          </Button>
        </Form>
        <div className="auth-footer">
          Don't have an account? <a href="/signup">Signup</a>
        </div>
      </Card>
    </div>
  );
};

export default Login;
