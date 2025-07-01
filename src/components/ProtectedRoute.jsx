import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const accessToken = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");
  // Jika tidak ada token atau role tidak termasuk yang diizinkan
  if (!accessToken || !role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
