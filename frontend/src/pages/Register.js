import { Box, Button, Link as ChakraLink, FormControl, FormLabel, Heading, Input, Text, useToast, VStack } from '@chakra-ui/react';
import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7073/api';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
            toast({
                title: 'Registration successful',
                description: 'You can now login with your credentials',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate('/login');
        } catch (error) {
            toast({
                title: 'Registration failed',
                description: error.response?.data || 'An error occurred. Please check your details and try again.',
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
                <Heading>Register</Heading>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </FormControl>
                <Button type="submit" colorScheme="blue" isLoading={isLoading} width="full">Register</Button>
                <Text>
                    Already have an account?{' '}
                    <ChakraLink as={Link} to="/login" color="blue.500">
                        Login here
                    </ChakraLink>
                </Text>
            </VStack>
        </Box>
    );
};

export default Register;
