import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import CreateQuiz from "./pages/CreateQuiz";
import JoinQuiz from "./pages/JoinQuiz";
import QuizRoom from "./pages/QuizRoom";
import Leaderboard from "./pages/Leaderboard";
import { AuthProvider } from "./config/AuthContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/create",
      element: <CreateQuiz />,
    },
    {
      path: "/join",
      element: <JoinQuiz />,
    },
    {
      path: "/quiz/:code",
      element: <QuizRoom />,
    },
    {
      path: "/leaderboard/:code",
      element: <Leaderboard />,
    },
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;

