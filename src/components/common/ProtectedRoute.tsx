import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { RootState } from "../../store";
import { setModalStatus } from "../../store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  if (!user) {
    dispatch(setModalStatus({ modal: "login", status: true }));
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
