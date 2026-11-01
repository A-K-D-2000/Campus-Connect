import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FAQs from "./pages/FAQs";
import Announcements from "./pages/Announcements";
import Discussion from "./pages/Discussion";
import PostPage from "./pages/PostPage";
import MyActivity from './pages/MyActivity';

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/discussion/:id" element={<PostPage />} />
          <Route path="/my-activity" element={<MyActivity />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
