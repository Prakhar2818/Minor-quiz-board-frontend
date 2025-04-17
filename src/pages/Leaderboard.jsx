import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { Table, Card, Button, message, Typography, Tag, Result } from "antd";

const { Title } = Typography;

const Leaderboard = () => {
  const { code } = useParams();
  const [leaderboardData, setLeaderboardData] = useState({
    leaderboard: [],
    quizTitle: "",
    quizStatus: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await axios.get(`/api/quiz/leaderboard/${code}`);
        if (res.data.success) {
          setLeaderboardData({
            leaderboard: res.data.leaderboard, // Backend already provides sorted and ranked data
            quizTitle: res.data.quizTitle,
            quizStatus: res.data.quizStatus
          });
          setError(null);
        } else {
          throw new Error(res.data.error || "Failed to fetch leaderboard");
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setError(error.response?.data?.error || "Failed to fetch leaderboard");
        message.error(error.response?.data?.error || "Failed to fetch leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [code]);

  const columns = [
    { 
      title: "Rank", 
      dataIndex: "rank", 
      key: "rank",
      width: '20%',
      render: (rank) => (
        <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default'}>
          #{rank}
        </Tag>
      )
    },
    { 
      title: "Player", 
      dataIndex: "username",
      key: "username",
      width: '50%'
    },
    { 
      title: "Score", 
      dataIndex: "score", 
      key: "score",
      width: '30%',
      render: (score) => (
        <Tag color="blue">{score} points</Tag>
      )
    }
  ];

  if (loading) {
    return (
      <div className="auth-container">
        <Card loading={true} className="auth-card">
          Loading...
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <Result
            status="error"
            title="Failed to load leaderboard"
            subTitle={error}
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/home')}>
                Back to Home
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card 
        title={
          <div>
            <Title level={3}>{leaderboardData.quizTitle || 'Quiz Leaderboard'}</Title>
            <Title level={5}>Quiz Code: <Tag color="cyan">{code}</Tag></Title>
            {leaderboardData.quizStatus && (
              <Tag color={leaderboardData.quizStatus === 'completed' ? 'green' : 'blue'}>
                {leaderboardData.quizStatus.charAt(0).toUpperCase() + leaderboardData.quizStatus.slice(1)}
              </Tag>
            )}
          </div>
        } 
        className="auth-card"
      >
        {leaderboardData.leaderboard.length > 0 ? (
          <Table 
            dataSource={leaderboardData.leaderboard} 
            columns={columns} 
            pagination={false} 
            loading={loading}
            rowKey="userId"
            className="leaderboard-table"
          />
        ) : (
          <Result
            status="info"
            title="No Results Yet"
            subTitle="The leaderboard is currently empty. Please wait for the quiz to complete."
          />
        )}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Button 
            type="primary" 
            onClick={() => navigate("/home")}
            size="large"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;
