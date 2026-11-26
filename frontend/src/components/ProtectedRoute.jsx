import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ requireAuth = true, allowedRoles = [] }) => {
  const { user } = useSelector((state) => state.auth);

  if (!requireAuth) {
    if (user) {
      return (
        <Navigate
          to={user.role === 'admin' ? '/admin' : '/gacha'}
          replace
        />
      );
    }
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/gacha'}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;