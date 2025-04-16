import React from "react";
import { Button, Card, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className=" home-container">
        <h2>Welcome to Quiz Board</h2>
        <Row gutter={16} className="home-options">
          <Col span={12}>
            <Card title="Create Quiz" bordered>
              <p>Create a quiz and share with others.</p>
              <Button type="primary" onClick={() => navigate("/create")}>
                Create
              </Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Join Quiz" bordered>
              <p>Join a quiz using code provided by host.</p>
              <Button onClick={() => navigate("/join")}>Join</Button>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Home;
