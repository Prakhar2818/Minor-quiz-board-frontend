import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Button, Card, Radio, Checkbox, Input, Progress, Space, 
  Alert, Avatar, List, Result, message, Spin, Typography,
  Row, Col, Tag
} from 'antd';
import { AuthContext } from "../config/AuthContext";
import socket from "../socket";
import axios from "../utils/axios";
import { PlayCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const QuizRoom = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  
  const [quiz, setQuiz] = useState({ createdBy: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorId, setCreatorId] = useState(null);  // This will store the creator's ID
  const [players, setPlayers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/quiz/${code}`);
      const quizData = response.data;
      
      if (!quizData) {
        throw new Error("Quiz not found");
      }


      const isCreatorStatus = quizData.creatorName === auth.username;
      
      console.log("=== Quiz Data Debug ===");
      console.log("Quiz Data:", quizData);
      console.log("Current username:", auth.username);
      console.log("Quiz creatorName:", quizData.creatorName);
      console.log("Is creator?", isCreatorStatus);
      
      setQuiz(quizData);
      setQuestions(quizData.questions || []);
      setQuizStarted(quizData.status === 'active');
      setIsCreator(isCreatorStatus); 

      console.log(quizData.participants);
      
      if (quizData.participants) {
        setPlayers(quizData.participants);
      }
      
      console.log("Creator status set to:", isCreatorStatus);
      
      setError(null);
    } catch (error) {
      console.error("Failed to fetch quiz details:", error);
      const errorMessage = error.response?.data?.error || "Failed to load quiz";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.userId) {
      message.error("Please login to join the quiz");
      navigate('/login');
      return;
    }
    
    if (code) {
      fetchQuizDetails();
    }
  }, [code, auth.userId, navigate]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", { 
      code, 
      username: auth.username,
      userId: auth.userId,
    });

    // Updated quiz-ended event handler to handle the new socket response
    socket.on("quiz-ended", (data) => {
      console.log("Quiz ended event received", data); // Debug log
      setQuizEnded(true);
      
      if (data.redirect) {
        message.info("Quiz has ended! Redirecting to leaderboard...");
        // Store final score before redirecting
        const finalScore = score;
        localStorage.setItem(`quiz_${code}_final_score`, finalScore);
        // Redirect to leaderboard
        navigate(`/leaderboard/${code}`);
      }
    });

    socket.on("quiz-error", (error) => {
      message.error(error.message);
    });

    socket.on("player-joined", (data) => {
      setPlayers(currentPlayers => {
        const playerExists = currentPlayers.some(p => p.userId === data.userId);
        if (!playerExists) {
          return [...currentPlayers, data];
        }
        return currentPlayers;
      });
      message.info(`${data.username} joined the quiz`);
    });

    socket.on("player-list", (playerList) => {
      setPlayers(playerList);
    });

    socket.on("quiz-started", (data) => {
      setQuizStarted(true);
      if (data.questions) {
        setQuestions(data.questions);
        setQuestionIndex(0);
        setTimeLeft(data.questions[0]?.timeLimit || 30);
      }
    });

    return () => {
      socket.emit("leave-room", { 
        code, 
        username: auth.username, 
        userId: auth.userId
      });
      socket.off("player-joined");
      socket.off("player-list");
      socket.off("quiz-started");
      socket.off("quiz-ended");
      socket.off("quiz-error");
    };
  }, [code, auth.username, auth.userId, navigate]);

  const handleStart = async () => {
    // Check if current user is the creator
    if (!isCreator || quiz.creatorName !== auth.username) {
      message.error("Only the quiz creator can start the quiz");
      return;
    }

    try {
      const response = await axios.post(`/api/quiz/start`, {
        code,
        creatorName: auth.username
      });

      if (response.data.success) {
        socket.emit('start-quiz', { code });
        setQuizStarted(true);
        setQuestions(response.data.questions);
        message.success("Quiz started successfully!");
      }
    } catch (error) {
      console.error("Failed to start quiz:", error);
      message.error(error.response?.data?.error || 'Failed to start quiz');
    }
  };

  const handleSubmit = async () => {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      message.warning("Please select an answer");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/quiz/submit-answer`, {
        code,
        userId: auth.userId,
        questionIndex,
        answer: Array.isArray(answer) ? answer.sort().join(',') : answer
      });

      setSubmitted(true);

      if (response.data.success) {
        // Update the score with the currentScore from backend
        setScore(response.data.currentScore);

        if (response.data.correct) {
          message.success(`Correct! You earned ${response.data.points} points!`);
        } else {
          message.error(`Incorrect. The correct answer was: ${response.data.correctAnswer}`);
        }

        // Move to next question or end quiz
        if (questionIndex < questions.length - 1) {
          setTimeout(() => {
            setQuestionIndex(prev => prev + 1);
            setAnswer("");
            setSubmitted(false);
            setTimeLeft(questions[questionIndex + 1]?.timeLimit || 30);
          }, 2000);
        } else {
          message.info("Quiz completed! Redirecting to leaderboard...");
          // Store final score before redirecting
          localStorage.setItem(`quiz_${code}_final_score`, response.data.currentScore);
          
          // Emit completion event with final score
          socket.emit('player-completed', {
            code,
            userId: auth.userId,
            username: auth.username,
            finalScore: response.data.currentScore
          });

          setQuizEnded(true);
          setTimeout(() => {
            navigate(`/leaderboard/${code}`);
          }, 2000);
        }
      }
      if (response.data.correct) {
        setScore(prev => prev + 1);
        message.success('Correct answer!');
      } else {
        message.error(`Incorrect. The correct answer was: ${response.data.correctAnswer}`);
      }
    } catch (error) {
      message.error('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handleEndQuiz = async () => {
    if (!isCreator) {
      message.error("Only the quiz creator can end the quiz");
      return;
    }

    try {
      // First make the API call to end the quiz
      const response = await axios.post(`/api/quiz/${code}/end`, {
        code,
        createdBy: quiz.createdBy // Using the quiz's createdBy ID
      });

      if (response.data.success) {
        // Emit socket event after successful API call
        socket.emit('end-quiz', { 
          code,
          createdBy: quiz.createdBy,
          finalScores: response.data.finalScores // Pass the final scores from API response
        });

        setQuizEnded(true);
        message.success("Quiz ended successfully");
        
        // Navigate to leaderboard
        navigate(`/leaderboard/${code}`);
      }
    } catch (error) {
      console.error("Failed to end quiz:", error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        message.error("Only quiz creator can end the quiz");
      } else if (error.response?.status === 400) {
        message.error("Quiz is already completed");
      } else if (error.response?.status === 404) {
        message.error("Quiz not found");
      } else {
        message.error(error.response?.data?.error || "Failed to end quiz");
      }
    }
  };

  const currentQuestion = questions[questionIndex] || {};

  if (loading) {
    return (
      <div className="quiz-container">
        <Card className="quiz-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: '20px' }}>Loading Quiz...</Title>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container">
        <Card className="quiz-card">
          <Result
            status="error"
            title="Failed to load quiz"
            subTitle={error}
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/home')}>
                Back Home
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-container">
        <Card className="quiz-card">
          <Result
            status="404"
            title="Quiz Not Found"
            subTitle="The quiz you're looking for doesn't exist."
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/home')}>
                Back Home
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  const renderCreatorControls = () => {
    // Check if current user is the creator
    if (!isCreator || quiz.creatorName !== auth.username) {
      return null;
    }

    return (
      <div style={{ marginTop: '20px' }}>
        <Alert
          message="Host Controls"
          description={
            players.length < 2 
              ? "Please wait for at least 2 players to join before starting the quiz."
              : "You can now start the quiz. All players are ready!"
          }
          type={players.length < 2 ? "warning" : "success"}
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Button
          type="primary"
          size="large"
          block
          onClick={handleStart}
          disabled={players.length < 2}
          style={{ 
            height: '50px',
            fontSize: '18px',
            backgroundColor: players.length < 2 ? '#d9d9d9' : '#1890ff',
          }}
          icon={<PlayCircleOutlined />}
        >
          {players.length < 2 ? 'Waiting for Players...' : 'Start Quiz Now'}
        </Button>
      </div>
    );
  };

  if (!quizStarted) {
    return (
      <div className="quiz-container">
        <Card 
          title={
            <Space>
              <Title level={3}>{quiz.title || 'Quiz Lobby'}</Title>
              <Tag color="blue">Code: {code}</Tag>
              {auth.userId === quiz.createdBy && 
                <Tag color="gold">You are the host</Tag>
              }
            </Space>
          }
          className="quiz-card"
          extra={
            <Space>
              <Tag color="cyan">Created by: {quiz.creatorName}</Tag>
              <Avatar.Group maxCount={2}>
                {players.map(player => (
                  <Avatar key={player.userId}>
                    {player.username?.[0]?.toUpperCase()}
                  </Avatar>
                ))}
              </Avatar.Group>
              <span>Players: {players.length}</span>
            </Space>
          }
        >
          {renderCreatorControls()}
          
          <List
            header={<Title level={4}>Players in Lobby</Title>}
            bordered
            dataSource={players}
            renderItem={(player) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ 
                      backgroundColor: player.userId === quiz.createdBy ? '#f56a00' : '#1890ff' 
                    }}>
                      {player.username?.[0]?.toUpperCase()}
                    </Avatar>
                  }
                  title={
                    <Space>
                      {player.username}
                      {player.userId === auth.userId && 
                        <Tag color="green">You</Tag>
                      }
                      {player.userId === quiz.createdBy && 
                        <Tag color="orange">Host</Tag>
                      }
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          
          {(!isCreator || auth.userId !== quiz.createdBy) && (
            <Alert
              message="Waiting for host to start the quiz..."
              type="info"
              showIcon
              style={{ marginTop: '20px' }}
            />
          )}
        </Card>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <Result
            status="success"
            title="Quiz Completed!"
            subTitle={`Your final score: ${score} out of ${questions.length}`}
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
    <div className="quiz-container">
      <Card
        className="quiz-card"
        title={
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={3}>{quiz.title}</Title>
            <Space>
              <Tag color="blue">Score: {score}</Tag>
              {/* Only show End Quiz button if isCreator is true */}
              {isCreator && (
                <Button 
                  type="primary" 
                  danger
                  onClick={handleEndQuiz}
                  disabled={quiz.status === 'completed'}
                >
                  End Quiz
                </Button>
              )}
            </Space>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Progress 
              percent={(timeLeft/30) * 100} 
              status="active"
              showInfo={false}
            />
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              Time Left: {timeLeft}s
            </div>
          </Col>
          
          <Col span={24}>
            <Card type="inner" title={`Question ${questionIndex + 1} of ${questions.length}`}>
              <Title level={4}>{currentQuestion.text}</Title>
              
              {currentQuestion.type === "single" && (
                <Radio.Group 
                  onChange={(e) => setAnswer(e.target.value)} 
                  value={answer}
                  disabled={submitted}
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentQuestion.options?.map((opt, idx) => (
                      <Radio key={idx} value={opt} style={{ width: '100%' }}>
                        <Card hoverable={!submitted} style={{ width: '100%' }}>
                          {opt}
                        </Card>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              )}

              {currentQuestion.type === "multiple" && (
                <Checkbox.Group
                  onChange={setAnswer}
                  value={answer}
                  disabled={submitted}
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentQuestion.options?.map((opt, idx) => (
                      <Checkbox key={idx} value={opt} style={{ width: '100%' }}>
                        <Card hoverable={!submitted} style={{ width: '100%' }}>
                          {opt}
                        </Card>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}
            </Card>
          </Col>

          <Col span={24} style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              disabled={submitted || !answer}
              loading={loading}
            >
              Submit Answer
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default QuizRoom;
