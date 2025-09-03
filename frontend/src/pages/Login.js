import { 
    Box, 
    Button, 
    Link as ChakraLink, 
    FormControl, 
    FormLabel, 
    Heading, 
    Input, 
    Text, 
    useToast, 
    VStack,
    Container,
    Icon,
    InputGroup,
    InputLeftElement,
    FormErrorMessage,
    Divider,
    useColorModeValue
} from '@chakra-ui/react';
import { EmailIcon, LockIcon } from '@chakra-ui/icons';
import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7073/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const toast = useToast();
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBg = useColorModeValue('blue.50', 'blue.900');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    const validateEmail = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError('Email is required');
        } else if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
        setEmail(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (emailError || !email || !password) return;
        
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            const token = response.data.token;
            localStorage.setItem('mongo-token', token);
            toast({
                title: 'Welcome back!',
                description: 'Login successful',
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
            window.location.href = '/';
        } catch (error) {
            toast({
                title: 'Login failed',
                description: error.response?.data || 'An error occurred. Please check your credentials and try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        }
        setIsLoading(false);
    };

    return (
        <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
            <Box
                maxWidth="md"
                margin="auto"
                p={{ base: '6', md: '10' }}
                boxShadow="xl"
                borderRadius="xl"
                bg={bgColor}
                border="1px"
                borderColor={borderColor}
            >
                <VStack spacing={8} as="form" onSubmit={handleSubmit}>
                    <VStack spacing={2}>
                        <Heading 
                            size="xl" 
                            fontWeight="bold"
                            bgGradient="linear(to-r, blue.400, blue.600)"
                            bgClip="text"
                        >
                            Welcome Back
                        </Heading>
                        <Text fontSize="sm" color={textColor}>
                            Enter your credentials to access your account
                        </Text>
                    </VStack>

                    <VStack spacing={5} width="full">
                        <FormControl isRequired isInvalid={!!emailError}>
                            <FormLabel fontSize="sm" fontWeight="medium">Email Address</FormLabel>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={EmailIcon} color="gray.400" />
                                </InputLeftElement>
                                <Input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => validateEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    size="lg"
                                    borderRadius="lg"
                                    focusBorderColor="blue.500"
                                    _hover={{ borderColor: 'blue.300' }}
                                />
                            </InputGroup>
                            <FormErrorMessage>{emailError}</FormErrorMessage>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="medium">Password</FormLabel>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={LockIcon} color="gray.400" />
                                </InputLeftElement>
                                <Input 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    size="lg"
                                    borderRadius="lg"
                                    focusBorderColor="blue.500"
                                    _hover={{ borderColor: 'blue.300' }}
                                />
                            </InputGroup>
                        </FormControl>
                    </VStack>

                    <Button 
                        type="submit" 
                        colorScheme="blue" 
                        isLoading={isLoading}
                        loadingText="Signing in..."
                        width="full"
                        size="lg"
                        fontSize="md"
                        borderRadius="lg"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                    >
                        Sign In
                    </Button>

                    <VStack spacing={4} width="full">
                        <Divider />
                        <Text fontSize="sm" color={textColor}>
                            Don't have an account?{' '}
                            <ChakraLink 
                                as={Link} 
                                to="/register" 
                                color="blue.500"
                                fontWeight="medium"
                                _hover={{ 
                                    textDecoration: 'underline',
                                    color: 'blue.600'
                                }}
                            >
                                Create one now
                            </ChakraLink>
                        </Text>
                    </VStack>
                </VStack>
            </Box>
        </Container>
    );
};

export default Login;
