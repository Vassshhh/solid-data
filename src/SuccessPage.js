import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      // Redirect to dashboard or another protected route after setting the token
      navigate('/dashboard');
    } else {
      // Handle case where no token is present, maybe redirect to login
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div>
      <h1>Processing your request...</h1>
      <p>If you are not redirected automatically, please check your URL.</p>
    </div>
  );
};

export default SuccessPage;
