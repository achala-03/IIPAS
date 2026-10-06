import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
