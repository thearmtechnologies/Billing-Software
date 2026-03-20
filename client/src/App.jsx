import { useEffect, useContext } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import UserProvider, { UserContext } from "./context/userContext";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import Clients from "./pages/Clients";
import EditInvoice from "./pages/EditInvoice";
import InvoiceView from "./components/InvoiceView";
import Register from "./pages/Register";
import { Toaster } from "react-hot-toast";
import Profile from "./pages/Profile";
import ServiceManagement from "./pages/ServiceManagement";
import ClientLedger from "./pages/ClientLedger";
import BankDetailsForm from "./components/BankDetailsForm";
import PaymentManagement from "./components/PaymentManagement";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";

const AxiosInterceptor = ({ children }) => {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          if (error.config && !error.config.url.includes('/login') && !error.config.url.includes('/register')) {
            setCurrentUser(null);
            navigate('/login', { replace: true });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate, setCurrentUser]);

  return children;
};

function App() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page, #F7F7F8)' }}>
      <UserProvider>
        <AxiosInterceptor>
          <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' },
          }}
        />

        <Routes>
          {/* Public Routes - No Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />

          {/* Protected Routes - With Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id/ledger" element={<ClientLedger />} />
            <Route path="/services" element={<ServiceManagement />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/edit/:id" element={<EditInvoice />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bank-details" element={<BankDetailsForm />} />
            <Route path="/invoices/:id/payments" element={<PaymentManagement />} />
          </Route>

          {/* Fallback route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AxiosInterceptor>
      </UserProvider>
    </div>
  );
}

export default App;