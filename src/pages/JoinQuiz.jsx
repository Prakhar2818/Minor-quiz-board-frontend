// src/pages/JoinQuiz.js
import React, { useState, useContext } from "react";
import { Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../config/AuthContext";
import axios from "../utils/axios";

const JoinQuiz = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const handleJoin = async () => {
    setLoading(true);
    try {
      await axios.post('/api/quiz/join', {
        code: code,
        userId: auth.userId
      });
      message.success("Successfully joined the quiz!");
      navigate(`/quiz/${code}`);
    } catch (err) {
      message.error(err.response?.data?.error || "Error joining quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card title="Join Quiz" className="auth-card">
        <Input
          placeholder="Enter Quiz Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button 
          type="primary" 
          block 
          onClick={handleJoin} 
          loading={loading}
          style={{ marginTop: "1rem" }}
        >
          Join
        </Button>
      </Card>
    </div>
  );
};

export default JoinQuiz;
