import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GetStarted from "./pages/GetStarted";
import ActivateDriver from "./pages/ActivateDriver";
import EditProfile from "./pages/EditProfile";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import TripDetail from "./pages/TripDetail";
import Chat from "./pages/Chat";
import PublishTrip from "./pages/PublishTrip";
import PublishHub from "./pages/PublishHub";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import LinkMercadoPago from "./pages/LinkMercadoPago";
import AdminDashboard from "./pages/AdminDashboard";
import NeedRide from "./pages/NeedRide";
import CompatiblePassengers from "./pages/CompatiblePassengers";
import DriverRequests from "./pages/DriverRequests";
import MyTrips from "./pages/MyTrips";
import Rate from "./pages/Rate";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import FAQ from "./pages/FAQ";
import Help from "./pages/Help";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Notifications from "./pages/Notifications";
import CommissionRateBootstrap from "./components/CommissionRateBootstrap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CommissionRateBootstrap />
          <Routes>
            {/* Public routes */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/help" element={<Help />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failure" element={<PaymentFailure />} />

            {/* Protected routes */}
            <Route path="/get-started" element={<ProtectedRoute><GetStarted /></ProtectedRoute>} />
            <Route path="/activate-driver" element={<ProtectedRoute><ActivateDriver /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/trip/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
            <Route path="/chat/:bookingId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/publish" element={<ProtectedRoute><PublishTrip /></ProtectedRoute>} />
            <Route path="/publish-hub" element={<ProtectedRoute><PublishHub /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/link-mercadopago" element={<ProtectedRoute><LinkMercadoPago /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/need-ride" element={<ProtectedRoute><NeedRide /></ProtectedRoute>} />
            <Route path="/compatible-passengers" element={<ProtectedRoute><CompatiblePassengers /></ProtectedRoute>} />
            <Route path="/driver-requests" element={<ProtectedRoute><DriverRequests /></ProtectedRoute>} />
            <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
            <Route path="/rate" element={<ProtectedRoute><Rate /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
