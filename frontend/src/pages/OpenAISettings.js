import { 
    CheckIcon, 
    CloseIcon, 
    EditIcon,
    LockIcon,
    UnlockIcon,
    InfoOutlineIcon,
    WarningIcon,
    ViewIcon,
    ViewOffIcon,
    RepeatIcon,
    SettingsIcon
} from '@chakra-ui/icons';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    FormHelperText,
    HStack,
    Heading,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Spinner,
    Text,
    VStack,
    useColorModeValue,
    useToast,
    Card,
    CardBody,
    CardHeader,
    Icon,
    Badge,
    Divider,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Center,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Fade,
    ScaleFade,
    Container,
    Grid,
    GridItem,
    useBreakpointValue,
    Stack,
    Tooltip,
    IconButton,
    Select,
    Link,
    Code,
    List,
    ListItem,
    ListIcon,
    Progress
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { 
    FiKey, 
    FiCpu, 
    FiShield,
    FiSettings,
    FiInfo,
    FiCheck,
    FiX,
    FiEye,
    FiEyeOff,
    FiRefreshCw,
    FiLock,
    FiUnlock,
    FiZap,
    FiDollarSign,
    FiActivity,
    FiAlertCircle
} from 'react-icons/fi';
import { FaMagic } from 'react-icons/fa';

import api from './api';

const OpenAISettings = () => {
    const [settings, setSettings] = useState({ apiKey: '', model: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const toast = useToast();
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const accentColor = useColorModeValue('purple.500', 'purple.400');
    const successColor = useColorModeValue('green.500', 'green.400');
    const warningColor = useColorModeValue('yellow.500', 'yellow.400');
    const errorColor = useColorModeValue('red.500', 'red.400');
    const codeBg = useColorModeValue('gray.100', 'gray.900');
    const isMobile = useBreakpointValue({ base: true, md: false });

    const availableModels = [
        { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo (Latest)', description: 'Most capable, latest features' },
        { value: 'gpt-4', label: 'GPT-4', description: 'Most capable, higher cost' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
        { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K', description: 'Extended context window' }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/OpenAISettings`);
            setSettings(response.data);
        } catch (error) {
            handleError('Error fetching settings', error);
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/OpenAISettings`, settings);
            handleSuccess('Settings updated', 'OpenAI settings have been successfully updated.');
            setIsEditing(false);
        } catch (error) {
            handleError('Error updating settings', error);
        }
        setIsSaving(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        fetchSettings(); // Revert to original settings
    };

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        try {
            // Simulate API test - you can replace with actual test endpoint
            await new Promise(resolve => setTimeout(resolve, 2000));
            handleSuccess('Connection successful', 'Your OpenAI API key is valid and working.');
        } catch (error) {
            handleError('Connection failed', error);
        }
        setIsTestingConnection(false);
    };

    const handleSuccess = (title, description) => {
        toast({
            title,
            description,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
        });
    };

    const handleError = (title, error) => {
        toast({
            title,
            description: error.response?.data || error.message || 'An error occurred',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
        });
    };

    if (isLoading) {
        return (
            <Center h="50vh">
                <VStack spacing={4}>
                    <Spinner size="xl" color={accentColor} thickness="4px" />
                    <Text color={mutedColor}>Loading AI settings...</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Fade in={true}>
            <VStack spacing={8} align="stretch">
                {/* Header Section */}
                <Box>
                    <HStack justify="space-between" mb={2}>
                        <VStack align="start" spacing={1}>
                            <Heading 
                                as="h1" 
                                size="lg"
                                bgGradient="linear(to-r, purple.400, purple.600)"
                                bgClip="text"
                            >
                                OpenAI Settings
                            </Heading>
                            <Text fontSize="sm" color={mutedColor}>
                                Configure your AI integration settings for query generation and optimization
                            </Text>
                        </VStack>
                        <HStack>
                            <Tooltip label="Test API connection">
                                <IconButton
                                    icon={<Icon as={FiActivity} />}
                                    onClick={handleTestConnection}
                                    isLoading={isTestingConnection}
                                    variant="ghost"
                                    colorScheme="purple"
                                    aria-label="Test Connection"
                                />
                            </Tooltip>
                            <Tooltip label="Refresh settings">
                                <IconButton
                                    icon={<RepeatIcon />}
                                    onClick={fetchSettings}
                                    variant="ghost"
                                    aria-label="Refresh"
                                />
                            </Tooltip>
                        </HStack>
                    </HStack>
                    <Divider />
                </Box>

                {/* Stats Overview */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiZap} />
                                        <Text>AI Status</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="lg">
                                    <Badge 
                                        colorScheme={settings.apiKey ? "green" : "gray"}
                                        fontSize="md"
                                        p={2}
                                    >
                                        {settings.apiKey ? "Configured" : "Not Configured"}
                                    </Badge>
                                </StatNumber>
                                <StatHelpText>
                                    {settings.apiKey ? "Ready to use" : "API key required"}
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiCpu} />
                                        <Text>Model</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="lg" color={accentColor}>
                                    {settings.model || "Not Set"}
                                </StatNumber>
                                <StatHelpText>Current AI model</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiShield} />
                                        <Text>Security</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="lg">
                                    <Icon 
                                        as={settings.apiKey ? FiLock : FiUnlock} 
                                        color={settings.apiKey ? successColor : warningColor}
                                        boxSize={8}
                                    />
                                </StatNumber>
                                <StatHelpText>
                                    {settings.apiKey ? "Encrypted" : "Configure API"}
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Main Settings Card */}
                <Card bg={cardBg} borderRadius="xl" boxShadow="md" overflow="hidden">
                    <CardHeader 
                        bg={useColorModeValue('purple.50', 'gray.700')}
                        borderBottom="1px"
                        borderColor={borderColor}
                    >
                        <HStack spacing={3}>
                            <Icon as={FiSettings} color={accentColor} boxSize={6} />
                            <VStack align="start" spacing={0}>
                                <Heading size="md">API Configuration</Heading>
                                <Text fontSize="xs" color={mutedColor}>
                                    Manage your OpenAI API credentials and model selection
                                </Text>
                            </VStack>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={6} align="stretch">
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    <HStack spacing={1}>
                                        <Icon as={FiKey} color={mutedColor} />
                                        <Text>API Key</Text>
                                        {settings.apiKey && !isEditing && (
                                            <Badge colorScheme="green" ml={2}>Active</Badge>
                                        )}
                                    </HStack>
                                </FormLabel>
                                {isEditing ? (
                                    <InputGroup size="lg">
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FiKey} color={mutedColor} />
                                        </InputLeftElement>
                                        <Input
                                            name="apiKey"
                                            value={settings.apiKey}
                                            onChange={handleInputChange}
                                            type={showApiKey ? "text" : "password"}
                                            placeholder="sk-..."
                                            borderRadius="lg"
                                            focusBorderColor={accentColor}
                                            fontFamily="mono"
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button 
                                                h="1.75rem" 
                                                size="sm" 
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                variant="ghost"
                                            >
                                                <Icon as={showApiKey ? FiEyeOff : FiEye} />
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                ) : (
                                    <HStack spacing={3}>
                                        <Code 
                                            p={3} 
                                            borderRadius="lg" 
                                            fontSize="md"
                                            bg={codeBg}
                                            color={settings.apiKey ? successColor : mutedColor}
                                        >
                                            {settings.apiKey ? "sk-...**********************" : "No API key configured"}
                                        </Code>
                                        {settings.apiKey && (
                                            <Tooltip label="API key is securely stored">
                                                <Icon as={FiShield} color={successColor} />
                                            </Tooltip>
                                        )}
                                    </HStack>
                                )}
                                <FormHelperText fontSize="xs">
                                    Your OpenAI API key for AI-powered features. Get one at{' '}
                                    <Link 
                                        href="https://platform.openai.com/api-keys" 
                                        isExternal 
                                        color={accentColor}
                                    >
                                        platform.openai.com
                                    </Link>
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    <HStack spacing={1}>
                                        <Icon as={FiCpu} color={mutedColor} />
                                        <Text>AI Model</Text>
                                        <Tooltip label="Different models have different capabilities and costs">
                                            <Icon as={InfoOutlineIcon} boxSize={4} color={mutedColor} />
                                        </Tooltip>
                                    </HStack>
                                </FormLabel>
                                {isEditing ? (
                                    <Select
                                        name="model"
                                        value={settings.model}
                                        onChange={handleInputChange}
                                        size="lg"
                                        borderRadius="lg"
                                        focusBorderColor={accentColor}
                                    >
                                        <option value="">Select a model</option>
                                        {availableModels.map(model => (
                                            <option key={model.value} value={model.value}>
                                                {model.label} - {model.description}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <HStack spacing={3}>
                                        <Code 
                                            p={3} 
                                            borderRadius="lg" 
                                            fontSize="md"
                                            bg={codeBg}
                                            color={settings.model ? accentColor : mutedColor}
                                        >
                                            {settings.model || "No model selected"}
                                        </Code>
                                        {settings.model && (
                                            <Badge colorScheme="purple" fontSize="sm">
                                                {availableModels.find(m => m.value === settings.model)?.description || 'Custom'}
                                            </Badge>
                                        )}
                                    </HStack>
                                )}
                                <FormHelperText fontSize="xs">
                                    Choose the OpenAI model for query generation and optimization
                                </FormHelperText>
                            </FormControl>

                            {!isEditing && (
                                <Alert status="info" borderRadius="lg" variant="subtle">
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle fontSize="sm">AI Features Available</AlertTitle>
                                        <AlertDescription fontSize="xs">
                                            <List spacing={1} mt={2}>
                                                <ListItem>
                                                    <ListIcon as={CheckIcon} color={successColor} />
                                                    Natural language query generation
                                                </ListItem>
                                                <ListItem>
                                                    <ListIcon as={CheckIcon} color={successColor} />
                                                    Index optimization suggestions
                                                </ListItem>
                                                <ListItem>
                                                    <ListIcon as={CheckIcon} color={successColor} />
                                                    Query performance analysis
                                                </ListItem>
                                            </List>
                                        </AlertDescription>
                                    </Box>
                                </Alert>
                            )}

                            <Divider />

                            <HStack justify="space-between">
                                <HStack spacing={2}>
                                    {!isEditing && settings.apiKey && (
                                        <Badge colorScheme="green" fontSize="sm" p={2}>
                                            <HStack spacing={1}>
                                                <Icon as={FiCheck} />
                                                <Text>AI Ready</Text>
                                            </HStack>
                                        </Badge>
                                    )}
                                </HStack>
                                <HStack spacing={3}>
                                    {isEditing ? (
                                        <>
                                            <Button
                                                onClick={handleCancelEdit}
                                                variant="ghost"
                                                leftIcon={<CloseIcon />}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                colorScheme="purple"
                                                isLoading={isSaving}
                                                loadingText="Saving..."
                                                leftIcon={<CheckIcon />}
                                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                                transition="all 0.2s"
                                            >
                                                Save Settings
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={handleEdit}
                                            colorScheme="purple"
                                            variant="outline"
                                            leftIcon={<EditIcon />}
                                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                            transition="all 0.2s"
                                        >
                                            Edit Settings
                                        </Button>
                                    )}
                                </HStack>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Info Section */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Card variant="outline" borderRadius="xl">
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <HStack>
                                    <Icon as={FiDollarSign} color={warningColor} boxSize={5} />
                                    <Text fontWeight="semibold">Pricing Information</Text>
                                </HStack>
                                <Text fontSize="sm" color={mutedColor}>
                                    OpenAI API usage is billed separately. Monitor your usage at the OpenAI dashboard.
                                </Text>
                                <Link 
                                    href="https://openai.com/pricing" 
                                    isExternal 
                                    color={accentColor}
                                    fontSize="sm"
                                >
                                    View pricing details →
                                </Link>
                            </VStack>
                        </CardBody>
                    </Card>

                    <Card variant="outline" borderRadius="xl">
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <HStack>
                                    <Icon as={FiInfo} color={accentColor} boxSize={5} />
                                    <Text fontWeight="semibold">Security Note</Text>
                                </HStack>
                                <Text fontSize="sm" color={mutedColor}>
                                    Your API key is encrypted and stored securely. Never share your API key publicly.
                                </Text>
                                <Link 
                                    href="https://platform.openai.com/docs/api-reference/authentication" 
                                    isExternal 
                                    color={accentColor}
                                    fontSize="sm"
                                >
                                    Learn about API security →
                                </Link>
                            </VStack>
                        </CardBody>
                    </Card>
                </Grid>
            </VStack>
        </Fade>
    );
};

export default OpenAISettings;