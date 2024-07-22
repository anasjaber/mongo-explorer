import { Box, ChakraProvider, Flex, Spinner } from '@chakra-ui/react';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import NavigationMenu from './components/NavigationMenu';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';

const AIQueryGenerator = lazy(() => import('./pages/AIQueryGenerator'));
const ConnectionManager = lazy(() => import('./pages/ConnectionManager'));
const QueryLogs = lazy(() => import('./pages/QueryLogs'));
const QueryManager = lazy(() => import('./pages/QueryManager'));
const QueryProfiler = lazy(() => import('./pages/QueryProfiler'));
const OpenAISettings = lazy(() => import('./pages/OpenAISettings'));

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mongo-token');
    console.log('Token:', token); // Debugging line
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    console.log('Loading...'); // Debugging line
    return <ChakraProvider><Spinner size="xl" /></ChakraProvider>;
  }

  console.log('Is Authenticated:', isAuthenticated); // Debugging line

  return (
    <ChakraProvider>
      <Router>
        <Flex minH="100vh">
          {isAuthenticated && <NavigationMenu />}
          <Box flex={1} p={4}>
            <Suspense fallback={<Spinner size="xl" />}>
              <Routes>
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
                <Route path="/" element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <ConnectionManager />
                  </PrivateRoute>
                } />
                <Route path="/queries" element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <QueryManager />
                  </PrivateRoute>
                } />
                <Route path="/ai-query-generator" element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <AIQueryGenerator />
                  </PrivateRoute>
                } />
                <Route path="/query-logs" element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <QueryLogs />
                  </PrivateRoute>
                } />
                <Route path="/query-profiler" element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <QueryProfiler />
                  </PrivateRoute>
                } />
                <Route path="/openai-settings" element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <OpenAISettings />
                  </PrivateRoute>
                } />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
              </Routes>
            </Suspense>
          </Box>
        </Flex>
      </Router>
    </ChakraProvider>
  );
};

export default App;
