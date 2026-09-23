import { Navigate, Route, Routes } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { HostPage } from "./pages/HostPage.tsx";
import { JoinPage } from "./pages/JoinPage.tsx";
import { PlayPage } from "./pages/PlayPage.tsx";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/host/:code" element={<HostPage />} />
      <Route path="/board/:code" element={<BoardPage />} />
      <Route path="/play/:code" element={<PlayPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
