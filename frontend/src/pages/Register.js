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
    FormHelperText,
    Divider,
    useColorModeValue,
    Progress,
    HStack
} from '@chakra-ui/react';
import { EmailIcon, LockIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7073/api';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const toast = useToast();
    const navigate = useNavigate();
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.600', 'gray.400');
    const successColor = useColorModeValue('green.500', 'green.400');
    const errorColor = useColorModeValue('red.500', 'red.400');

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

    const calculatePasswordStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 25;
        if (pass.match(/[a-z]+/)) strength += 25;
        if (pass.match(/[A-Z]+/)) strength += 25;
        if (pass.match(/[0-9]+/) || pass.match(/[^a-zA-Z0-9]+/)) strength += 25;
        return strength;
    };

    const validatePassword = (value) => {
        setPassword(value);
        setPasswordStrength(calculatePasswordStrength(value));
        
        if (!value) {
            setPasswordError('Password is required');
        } else if (value.length < 6) {
            setPasswordError('Password must be at least 6 characters');
        } else {
            setPasswordError('');
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 25) return 'red';
        if (passwordStrength <= 50) return 'orange';
        if (passwordStrength <= 75) return 'yellow';
        return 'green';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (emailError || !email || !password) return;
        
        if (password !== confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please make sure both passwords are identical',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
            return;
        }
        
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
            toast({
                title: 'Welcome aboard!',
                description: 'Registration successful. Redirecting to login...',
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            toast({
                title: 'Registration failed',
                description: error.response?.data || 'An error occurred. Please check your details and try again.',
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
                            Create Account
                        </Heading>
                        <Text fontSize="sm" color={textColor}>
                            Sign up to get started with MongoDB Explorer
                        </Text>
                    </VStack>

                    <VStack spacing={5} width="full">
                        <FormControl isRequired isInvalid={!!emailError}>
                            <FormLabel fontSize="sm" fontWeight="medium" display="inline-flex" alignItems="center">Email Address</FormLabel>
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

                        <FormControl isRequired isInvalid={!!passwordError}>
                            <FormLabel fontSize="sm" fontWeight="medium" display="inline-flex" alignItems="center">Password</FormLabel>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={LockIcon} color="gray.400" />
                                </InputLeftElement>
                                <Input 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => validatePassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    size="lg"
                                    borderRadius="lg"
                                    focusBorderColor="blue.500"
                                    _hover={{ borderColor: 'blue.300' }}
                                />
                            </InputGroup>
                            {password && (
                                <Box mt={2}>
                                    <Progress 
                                        value={passwordStrength} 
                                        size="xs" 
                                        colorScheme={getPasswordStrengthColor()}
                                        borderRadius="full"
                                    />
                                    <Text fontSize="xs" mt={1} color={textColor}>
                                        Password strength: {passwordStrength <= 25 ? 'Weak' : 
                                                          passwordStrength <= 50 ? 'Fair' : 
                                                          passwordStrength <= 75 ? 'Good' : 'Strong'}
                                    </Text>
                                </Box>
                            )}
                            <FormErrorMessage>{passwordError}</FormErrorMessage>
                            <FormHelperText fontSize="xs">
                                Use at least 6 characters with a mix of letters and numbers
                            </FormHelperText>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="medium" display="inline-flex" alignItems="center">Confirm Password</FormLabel>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={LockIcon} color="gray.400" />
                                </InputLeftElement>
                                <Input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    size="lg"
                                    borderRadius="lg"
                                    focusBorderColor="blue.500"
                                    _hover={{ borderColor: 'blue.300' }}
                                />
                            </InputGroup>
                            {confirmPassword && (
                                <HStack mt={2} spacing={2}>
                                    <Icon 
                                        as={password === confirmPassword ? CheckIcon : CloseIcon} 
                                        color={password === confirmPassword ? successColor : errorColor}
                                        boxSize={3}
                                    />
                                    <Text 
                                        fontSize="xs" 
                                        color={password === confirmPassword ? successColor : errorColor}
                                    >
                                        {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                    </Text>
                                </HStack>
                            )}
                        </FormControl>
                    </VStack>

                    <Button 
                        type="submit" 
                        colorScheme="blue" 
                        isLoading={isLoading}
                        loadingText="Creating account..."
                        width="full"
                        size="lg"
                        fontSize="md"
                        borderRadius="lg"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                    >
                        Sign Up
                    </Button>

                    <VStack spacing={4} width="full">
                        <Divider />
                        <Text fontSize="sm" color={textColor}>
                            Already have an account?{' '}
                            <ChakraLink 
                                as={Link} 
                                to="/login" 
                                color="blue.500"
                                fontWeight="medium"
                                _hover={{ 
                                    textDecoration: 'underline',
                                    color: 'blue.600'
                                }}
                            >
                                Sign in here
                            </ChakraLink>
                        </Text>
                    </VStack>
                </VStack>
            </Box>
        </Container>
    );
};

export default Register;
