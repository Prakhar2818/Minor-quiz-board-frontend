import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { Table, Card, Button, message, Typography, Tag, Result, Space, Statistic, Row, Col } from "antd";
import { AuthContext } from "../config/AuthContext";

const { Title } = Typography;

const Leaderboard = () => {
  const { code } = useParams();
  const [leaderboardData, setLeaderboardData] = useState({
    quiz: {},
    leaderboard: [],
    submissionHistory: [],
    metadata: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await axios.get(`/api/quiz/leaderboard/${code}`);
        
        if (res.data.success) {
          setLeaderboardData({
            quiz: res.data.quiz,
            leaderboard: res.data.leaderboard,
            submissionHistory: res.data.submissionHistory,
            metadata: res.data.metadata
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
      width: '15%',
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
      width: '35%',
      render: (username, record) => (
        <Space>
          {username}
          {record.userId === auth.userId && <Tag color="green">You</Tag>}
        </Space>
      )
    },
    { 
      title: "Score", 
      dataIndex: "score", 
      key: "score",
      width: '25%',
      render: (score) => (
        <Tag color="blue">{score} points</Tag>
      )
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      width: '25%',
      render: (percentage) => (
        <Tag color={percentage >= 70 ? 'green' : percentage >= 40 ? 'orange' : 'red'}>
          {percentage}%
        </Tag>
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
            <Title level={3}>{leaderboardData.quiz.title || 'Quiz Leaderboard'}</Title>
            <Title level={5}>
              Quiz Code: <Tag color="cyan">{code}</Tag>
              {leaderboardData.quiz.category && (
                <Tag color="purple" style={{ marginLeft: 8 }}>{leaderboardData.quiz.category}</Tag>
              )}
            </Title>
            <Tag color={leaderboardData.quiz.status === 'completed' ? 'green' : 'blue'}>
              {leaderboardData.quiz.status?.charAt(0).toUpperCase() + leaderboardData.quiz.status?.slice(1)}
            </Tag>
          </div>
        } 
        className="auth-card"
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic 
              title="Average Score" 
              value={Math.round(leaderboardData.metadata.averageScore * 10) / 10}
              suffix="points"
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Highest Score" 
              value={leaderboardData.metadata.highestScore}
              suffix="points"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Total Participants" 
              value={leaderboardData.quiz.totalParticipants || 0}
            />
          </Col>
        </Row>

        {leaderboardData.leaderboard?.length > 0 ? (
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
