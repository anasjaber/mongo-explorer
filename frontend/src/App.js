import { Box, ChakraProvider, Flex, Spinner } from '@chakra-ui/react';
import React, { Suspense, lazy } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import NavigationMenu from './components/NavigationMenu';

const AIQueryGenerator = lazy(() => import('./pages/AIQueryGenerator'));
const ConnectionManager = lazy(() => import('./pages/ConnectionManager'));
const QueryLogs = lazy(() => import('./pages/QueryLogs'));
const QueryManager = lazy(() => import('./pages/QueryManager'));
const QueryProfiler = lazy(() => import('./pages/QueryProfiler'));

const App = () => {
  return (
    <ChakraProvider>
      <Router>
        <Flex minH="100vh">
          <NavigationMenu />
          <Box flex={1} p={4}>
            <Suspense fallback={<Spinner size="xl" />}>
              <Routes>
                <Route path="/" element={<ConnectionManager />} />
                <Route path="/queries" element={<QueryManager />} />
                <Route path="/ai-query-generator" element={<AIQueryGenerator />} />
                <Route path="/query-logs" element={<QueryLogs />} />
                <Route path="/query-profiler" element={<QueryProfiler />} />
              </Routes>
            </Suspense>
          </Box>
        </Flex>
      </Router>
    </ChakraProvider>
  );
};

export default App;
