import { Box, Button, Link as ChakraLink, FormControl, FormLabel, Heading, Input, Text, useToast, VStack } from '@chakra-ui/react';
import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7073/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            const token = response.data.token;
            localStorage.setItem('mongo-token', token);
            toast({
                title: 'Login successful',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            window.location.href = '/'; // Redirect to main page with refresh
        } catch (error) {
            toast({
                title: 'Login failed',
                description: error.response?.data || 'An error occurred. Please check your credentials and try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
        setIsLoading(false);
    };

    return (
        <Box maxWidth="400px" margin="auto" mt={8} p={5} boxShadow="lg" borderRadius="md" bg="white">
            <VStack spacing={6} as="form" onSubmit={handleSubmit}>
                <Heading>Login</Heading>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </FormControl>
                <Button type="submit" colorScheme="blue" isLoading={isLoading} width="full">Login</Button>
                <Text>
                    Don't have an account?{' '}
                    <ChakraLink as={Link} to="/register" color="blue.500">
                        Register here
                    </ChakraLink>
                </Text>
            </VStack>
        </Box>
    );
};

export default Login;
