import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Table, Card, Button } from "antd";

const Leaderboard = () => {
  const { code } = useParams();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/quiz/leaderboard/${code}`
        );
        setScores(res.data.map((score, index) => ({
          ...score,
          rank: index + 1,
          key: index
        })));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [code]);

  const columns = [
    { title: "Rank", dataIndex: "rank", key: "rank" },
    { title: "User", dataIndex: "userId", key: "userId" },
    { title: "Score", dataIndex: "score", key: "score" },
  ];

  return (
    <div className="auth-container">
      <Card title={`Leaderboard - ${code}`} className="auth-card">
        <Table 
          dataSource={scores} 
          columns={columns} 
          pagination={false} 
          loading={loading}
        />
        <Button 
          type="primary" 
          style={{ marginTop: "20px" }} 
          onClick={() => navigate("/home")}
        >
          Back to Home
        </Button>
      </Card>
    </div>
  );
};

export default Leaderboard;
