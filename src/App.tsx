import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Login from "./pages/Login";
import GetStarted from "./pages/GetStarted";
import ActivateDriver from "./pages/ActivateDriver";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import TripDetail from "./pages/TripDetail";
import Chat from "./pages/Chat";
import PublishTrip from "./pages/PublishTrip";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NeedRide from "./pages/NeedRide";
import CompatiblePassengers from "./pages/CompatiblePassengers";
import DriverRequests from "./pages/DriverRequests";
import MyTrips from "./pages/MyTrips";
import Rate from "./pages/Rate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/activate-driver" element={<ActivateDriver />} />
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/chat/:tripId" element={<Chat />} />
          <Route path="/publish" element={<PublishTrip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/need-ride" element={<NeedRide />} />
          <Route path="/compatible-passengers" element={<CompatiblePassengers />} />
          <Route path="/driver-requests" element={<DriverRequests />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/rate" element={<Rate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
