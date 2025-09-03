import { 
  Box, 
  ChakraProvider, 
  Flex, 
  Spinner,
  Center,
  VStack,
  Text,
  useColorModeValue,
  Container,
  Progress,
  Fade,
  ScaleFade,
  extendTheme,
  ColorModeScript
} from '@chakra-ui/react';
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
const AIProviderSettings = lazy(() => import('./pages/AIProviderSettings'));

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  styles: {
    global: (props) => ({
      'html, body': {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        overflowX: 'hidden',
      },
      '#root': {
        minHeight: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
    Tooltip: {
      baseStyle: {
        borderRadius: 'md',
        px: '3',
        py: '2',
      },
    },
  },
});

const LoadingFallback = () => {
  const spinnerColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Center h="calc(100vh - 32px)">
      <VStack spacing={4}>
        <Spinner 
          size="xl" 
          color={spinnerColor}
          thickness="4px"
          speed="0.65s"
        />
        <Text color={textColor} fontSize="sm">
          Loading content...
        </Text>
      </VStack>
    </Center>
  );
};

const InitialLoader = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const spinnerColor = useColorModeValue('blue.500', 'blue.300');
  
  return (
    <Center h="100vh" bg={bgColor}>
      <ScaleFade initialScale={0.9} in={true}>
        <VStack spacing={6}>
          <Spinner 
            size="xl" 
            color={spinnerColor}
            thickness="4px"
            speed="0.65s"
          />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold">
              MongoDB Explorer
            </Text>
            <Text fontSize="sm" color="gray.500">
              Initializing application...
            </Text>
          </VStack>
        </VStack>
      </ScaleFade>
    </Center>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mongo-token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <InitialLoader />
      </ChakraProvider>
    );
  }

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Router>
          <Flex 
            minH="100vh"
            bg={useColorModeValue('gray.50', 'gray.900')}
          >
            {isAuthenticated && <NavigationMenu />}
            <Box 
              flex={1} 
              overflow="hidden"
              position="relative"
            >
              <Box
                h="100vh"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: useColorModeValue('gray.300', 'gray.600'),
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: useColorModeValue('gray.400', 'gray.500'),
                  },
                }}
              >
                <Container 
                  maxW="container.2xl" 
                  py={8}
                  px={{ base: 4, md: 8 }}
                >
                  <Fade in={!isLoading}>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route 
                          path="/login" 
                          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
                        />
                        <Route 
                          path="/register" 
                          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
                        />
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
                            <AIProviderSettings />
                          </PrivateRoute>
                        } />
                        <Route path="/ai-provider-settings" element={
                          <PrivateRoute isAuthenticated={isAuthenticated}>
                            <AIProviderSettings />
                          </PrivateRoute>
                        } />
                        <Route 
                          path="*" 
                          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} 
                        />
                      </Routes>
                    </Suspense>
                  </Fade>
                </Container>
              </Box>
            </Box>
          </Flex>
        </Router>
      </ChakraProvider>
    </>
  );
};

export default App;
