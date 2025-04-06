import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Radio, Checkbox, Input, Progress, Space, Alert, Avatar, List, Result, message, Spin } from 'antd';
import { AuthContext } from "../config/AuthContext";
import socket from "../socket";
import axios from "../utils/axios";

const QuizRoom = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  
  const [isCreator, setIsCreator] = useState(false);
  const [players, setPlayers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await axios.get(`/api/quiz/${code}`);
        const quizData = response.data;
        
        setQuestions(quizData.questions || []);
        setQuizStarted(quizData.status === 'active');
        setIsCreator(quizData.createdBy === auth.userId);
        
        if (quizData.players) {
          setPlayers(quizData.players);
        }
      } catch (error) {
        console.error("Failed to fetch quiz details:", error);
        message.error("Failed to fetch quiz details");
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [code, auth.userId, navigate]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", { 
      code, 
      username: auth.username,
      userId: auth.userId,
      isCreator: isCreator
    });

    socket.on("quiz-ended", () => {
      setQuizEnded(true);
      message.info("Quiz has ended!");
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
      socket.emit("leave-room", { code, username: auth.username, userId: auth.userId });
      socket.off("player-joined");
      socket.off("player-list");
      socket.off("quiz-started");
      socket.off("quiz-ended");
    };
  }, [code, auth.username, auth.userId, isCreator]);

  const handleStart = async () => {
    try {
      const response = await axios.post(`/api/quiz/start`, {
        code,
        userId: auth.userId
      });

      if (response.data.success) {
        socket.emit('start-quiz', { 
          code, 
          questions: response.data.questions,
          startedBy: auth.userId
        });
        setQuizStarted(true);
        setQuestions(response.data.questions);
      }
    } catch (error) {
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
      await axios.post(`/api/quiz/${code}/end`, {
        userId: auth.userId
      });
      
      socket.emit('end-quiz', { code });
      setQuizEnded(true);
      message.success("Quiz ended successfully");
      navigate(`/leaderboard/${code}`);
    } catch (error) {
      message.error("Failed to end quiz");
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '10px' }}>Loading quiz...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="auth-container">
        <Card 
          title={`Quiz Lobby (${code})`} 
          className="auth-card"
          extra={<span>Players: {players.length}</span>}
        >
          <List
            header={<div style={{ fontWeight: 'bold' }}>Players in Lobby:</div>}
            bordered
            dataSource={players}
            renderItem={(player) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: '#1890ff' }}>
                      {player.username ? player.username.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  }
                  title={player.username || 'Anonymous'}
                  description={player.userId === auth.userId ? '(You)' : 
                             player.isCreator ? '(Creator)' : ''}
                />
              </List.Item>
            )}
          />
          {isCreator ? (
            <Space direction="vertical" style={{ width: '100%', marginTop: '20px' }}>
              <Button 
                type="primary" 
                onClick={handleStart}
                disabled={players.length < 1}
                block
              >
                Start Quiz ({players.length} {players.length === 1 ? 'player' : 'players'})
              </Button>
            </Space>
          ) : (
            <Alert
              message="Waiting for quiz creator to start the quiz"
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

  const currentQ = questions[questionIndex];

  if (!currentQ) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '10px' }}>Loading question...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card 
        title={`Question ${questionIndex + 1} of ${questions.length}`} 
        className="auth-card"
        extra={
          <Space>
            <span>Score: {score}</span>
            {isCreator && (
              <Button 
                type="primary" 
                danger
                onClick={handleEndQuiz}
              >
                End Quiz
              </Button>
            )}
          </Space>
        }
      >
        <p>{currentQ.text}</p>

        {currentQ.type === "single" && (
          <Radio.Group 
            onChange={(e) => setAnswer(e.target.value)} 
            value={answer}
            disabled={submitted}
          >
            <Space direction="vertical">
              {currentQ.options?.map((opt, idx) => (
                <Radio key={idx} value={opt}>{opt}</Radio>
              ))}
            </Space>
          </Radio.Group>
        )}

        {currentQ.type === "mcq" && (
          <Checkbox.Group 
            onChange={(values) => setAnswer(values)} 
            value={answer}
            disabled={submitted}
          >
            <Space direction="vertical">
              {currentQ.options?.map((opt, idx) => (
                <Checkbox key={idx} value={opt}>{opt}</Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        )}

        {currentQ.type === "text" && (
          <Input.TextArea 
            rows={3} 
            onChange={(e) => setAnswer(e.target.value)} 
            value={answer}
            disabled={submitted}
            placeholder="Type your answer here..."
          />
        )}

        <div style={{ marginTop: "1rem" }}>
          <Progress 
            percent={(timeLeft / (currentQ.timeLimit || 30)) * 100} 
            status={timeLeft < 5 ? "exception" : "active"}
            showInfo={false} 
          />
          <p>Time Left: {timeLeft}s</p>
        </div>

        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={submitted || !answer || (Array.isArray(answer) && answer.length === 0)}
          loading={loading}
          block
          style={{ marginTop: "1rem" }}
        >
          Submit Answer
        </Button>
      </Card>
    </div>
  );
};

export default QuizRoom;
