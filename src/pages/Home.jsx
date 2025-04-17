import React from "react";
import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h2>Welcome to Quiz Board</h2>
      <div className="home-options">
        <div className="row g-4">
          <div className="col-md-6">
            <Card title="Create Quiz" bordered>
              <p>Create a quiz and share with others.</p>
              <Button type="primary" onClick={() => navigate("/create")}>
                Create
              </Button>
            </Card>
          </div>
          <div className="col-md-6">
            <Card title="Join Quiz" bordered>
              <p>Join a quiz using code provided by host.</p>
              <Button onClick={() => navigate("/join")}>Join</Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
