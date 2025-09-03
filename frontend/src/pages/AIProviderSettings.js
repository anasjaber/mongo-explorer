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
    Radio,
    RadioGroup,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel
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
    FiAlertCircle,
    FiCloud,
    FiGlobe
} from 'react-icons/fi';
import { FaMagic, FaRobot } from 'react-icons/fa';
import { SiOpenai, SiAnthropic } from 'react-icons/si';

import api from './api';

const AIProviderSettings = () => {
    const [settings, setSettings] = useState({ 
        provider: 'OpenAI', 
        apiKey: '', 
        model: '',
        apiUrl: '',
        additionalSettings: ''
    });
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
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

    const providers = [
        { 
            id: 'OpenAI', 
            name: 'OpenAI', 
            icon: SiOpenai,
            description: 'GPT models from OpenAI',
            docsUrl: 'https://platform.openai.com/docs',
            color: 'green'
        },
        { 
            id: 'OpenRouter', 
            name: 'OpenRouter', 
            icon: FiGlobe,
            description: 'Access multiple AI models through one API',
            docsUrl: 'https://openrouter.ai/docs',
            color: 'blue'
        }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (settings.provider && isEditing) {
            fetchAvailableModels(settings.provider);
        }
    }, [settings.provider, isEditing]);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/AIProviderSettings`);
            setSettings(response.data);
        } catch (error) {
            // Try legacy endpoint for backward compatibility
            try {
                const response = await api.get(`/OpenAISettings`);
                setSettings({
                    provider: 'OpenAI',
                    apiKey: response.data.apiKey || '',
                    model: response.data.model || '',
                    apiUrl: '',
                    additionalSettings: ''
                });
            } catch (legacyError) {
                handleError('Error fetching settings', error);
            }
        }
        setIsLoading(false);
    };

    const fetchAvailableModels = async (provider) => {
        console.log('Fetching models for provider:', provider);
        setIsLoadingModels(true);
        try {
            const response = await api.get(`/AIProviderSettings/available-models?provider=${provider}`);
            console.log('Models response:', response.data);
            setAvailableModels(response.data.models || []);
            
            // If no models returned and it's OpenRouter, show a warning
            if (provider === 'OpenRouter' && (!response.data.models || response.data.models.length === 0)) {
                console.warn('No OpenRouter models returned from API');
                handleError('Models Not Available', { response: { data: 'Unable to fetch OpenRouter models. Using fallback list.' } });
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            console.error('Error details:', error.response);
            
            // Provide fallback models for OpenRouter if API fails
            if (provider === 'OpenRouter') {
                const fallbackModels = [
                    { value: 'openai/gpt-4-turbo-preview', label: 'GPT-4 Turbo', description: 'Latest GPT-4 model', contextLength: 128000 },
                    { value: 'openai/gpt-4', label: 'GPT-4', description: 'Most capable GPT-4', contextLength: 8192 },
                    { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient', contextLength: 16385 },
                    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', description: 'Most capable Claude model', contextLength: 200000 },
                    { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet', description: 'Balanced Claude model', contextLength: 200000 },
                    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', description: 'Fast Claude model', contextLength: 200000 },
                    { value: 'google/gemini-pro', label: 'Gemini Pro', description: 'Google\'s AI model', contextLength: 32768 },
                    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', description: 'Open source LLM', contextLength: 131072 },
                    { value: 'mistralai/mistral-large', label: 'Mistral Large', description: 'Powerful open model', contextLength: 32768 }
                ];
                setAvailableModels(fallbackModels);
                console.log('Using fallback models for OpenRouter');
            } else {
                setAvailableModels([]);
            }
        } finally {
            setIsLoadingModels(false);
        }
    };
    
    const formatContextLength = (length) => {
        if (!length) return 'N/A';
        if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
        if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
        return length.toString();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleProviderChange = (value) => {
        setSettings(prev => ({ ...prev, provider: value, model: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/AIProviderSettings`, settings);
            handleSuccess('Settings updated', 'AI provider settings have been successfully updated.');
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
            const response = await api.post('/AIProviderSettings/test-connection');
            if (response.data.success) {
                handleSuccess('Connection successful', response.data.message);
            } else {
                handleError('Connection failed', { response: { data: response.data.message } });
            }
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

    const getProviderIcon = (providerId) => {
        const provider = providers.find(p => p.id === providerId);
        return provider ? provider.icon : FaRobot;
    };

    const getProviderColor = (providerId) => {
        const provider = providers.find(p => p.id === providerId);
        return provider ? provider.color : 'purple';
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
                                AI Provider Settings
                            </Heading>
                            <Text fontSize="sm" color={mutedColor}>
                                Configure your AI provider for query generation and optimization
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
                                        <Icon as={FiCloud} />
                                        <Text>Provider</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="lg">
                                    <HStack spacing={2}>
                                        <Icon as={getProviderIcon(settings.provider)} color={`${getProviderColor(settings.provider)}.500`} />
                                        <Text>{settings.provider || "Not Set"}</Text>
                                    </HStack>
                                </StatNumber>
                                <StatHelpText>AI service provider</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiZap} />
                                        <Text>Status</Text>
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
                                <StatNumber fontSize="md" color={accentColor} isTruncated>
                                    {settings.model ? settings.model.split('/').pop() : "Not Set"}
                                </StatNumber>
                                <StatHelpText>Current AI model</StatHelpText>
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
                                <Heading size="md">AI Configuration</Heading>
                                <Text fontSize="xs" color={mutedColor}>
                                    Select your AI provider and configure API credentials
                                </Text>
                            </VStack>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={6} align="stretch">
                            {/* Provider Selection */}
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    <HStack spacing={1}>
                                        <Icon as={FiCloud} color={mutedColor} />
                                        <Text>AI Provider</Text>
                                    </HStack>
                                </FormLabel>
                                {isEditing ? (
                                    <RadioGroup value={settings.provider} onChange={handleProviderChange}>
                                        <Stack spacing={3}>
                                            {providers.map(provider => (
                                                <Card 
                                                    key={provider.id} 
                                                    variant="outline" 
                                                    cursor="pointer"
                                                    borderColor={settings.provider === provider.id ? accentColor : borderColor}
                                                    borderWidth={settings.provider === provider.id ? 2 : 1}
                                                    _hover={{ borderColor: accentColor }}
                                                >
                                                    <CardBody p={3}>
                                                        <Radio value={provider.id} colorScheme="purple">
                                                            <HStack spacing={3}>
                                                                <Icon as={provider.icon} boxSize={6} color={`${provider.color}.500`} />
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="medium">{provider.name}</Text>
                                                                    <Text fontSize="xs" color={mutedColor}>
                                                                        {provider.description}
                                                                    </Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Radio>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </Stack>
                                    </RadioGroup>
                                ) : (
                                    <HStack spacing={3}>
                                        <Card variant="outline" p={3}>
                                            <HStack spacing={3}>
                                                <Icon as={getProviderIcon(settings.provider)} boxSize={6} color={`${getProviderColor(settings.provider)}.500`} />
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="medium">{settings.provider || "No provider selected"}</Text>
                                                    <Text fontSize="xs" color={mutedColor}>
                                                        {providers.find(p => p.id === settings.provider)?.description || "Select a provider to get started"}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                        </Card>
                                    </HStack>
                                )}
                            </FormControl>

                            {/* API Key */}
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
                                            placeholder={settings.provider === 'OpenRouter' ? "sk-or-..." : "sk-..."}
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
                                            {settings.apiKey ? 
                                                (settings.provider === 'OpenRouter' ? "sk-or-...**********************" : "sk-...**********************") 
                                                : "No API key configured"}
                                        </Code>
                                        {settings.apiKey && (
                                            <Tooltip label="API key is securely stored">
                                                <Icon as={FiShield} color={successColor} />
                                            </Tooltip>
                                        )}
                                    </HStack>
                                )}
                                <FormHelperText fontSize="xs">
                                    {settings.provider === 'OpenRouter' ? (
                                        <>
                                            Your OpenRouter API key. Get one at{' '}
                                            <Link 
                                                href="https://openrouter.ai/keys" 
                                                isExternal 
                                                color={accentColor}
                                            >
                                                openrouter.ai/keys
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            Your OpenAI API key for AI-powered features. Get one at{' '}
                                            <Link 
                                                href="https://platform.openai.com/api-keys" 
                                                isExternal 
                                                color={accentColor}
                                            >
                                                platform.openai.com
                                            </Link>
                                        </>
                                    )}
                                </FormHelperText>
                            </FormControl>

                            {/* Model Selection */}
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
                                    isLoadingModels ? (
                                        <HStack spacing={3} p={3}>
                                            <Spinner size="sm" color={accentColor} />
                                            <Text fontSize="sm" color={mutedColor}>
                                                Loading available models...
                                            </Text>
                                        </HStack>
                                    ) : (
                                        <VStack spacing={3} align="stretch">
                                            <Select
                                                name="model"
                                                value={settings.model}
                                                onChange={handleInputChange}
                                                size="lg"
                                                borderRadius="lg"
                                                focusBorderColor={accentColor}
                                                placeholder="Select a model"
                                            >
                                                {availableModels.map(model => (
                                                    <option key={model.value} value={model.value}>
                                                        {model.label}
                                                    </option>
                                                ))}
                                            </Select>
                                            {settings.model && availableModels.length > 0 && (
                                                <Card variant="outline" size="sm">
                                                    <CardBody p={3}>
                                                        <VStack align="start" spacing={2}>
                                                            <HStack spacing={3} w="full" justify="space-between">
                                                                <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
                                                                    Model Details
                                                                </Text>
                                                                {availableModels.find(m => m.value === settings.model)?.contextLength && (
                                                                    <Badge colorScheme="blue" fontSize="xs">
                                                                        Context: {formatContextLength(availableModels.find(m => m.value === settings.model)?.contextLength)}
                                                                    </Badge>
                                                                )}
                                                            </HStack>
                                                            <Text fontSize="xs" color={mutedColor}>
                                                                {availableModels.find(m => m.value === settings.model)?.description || 'No description available'}
                                                            </Text>
                                                        </VStack>
                                                    </CardBody>
                                                </Card>
                                            )}
                                            {availableModels.length === 0 && (
                                                <Alert status="warning" borderRadius="lg" fontSize="sm">
                                                    <AlertIcon />
                                                    <Text>
                                                        No models available. Please check your provider selection.
                                                    </Text>
                                                </Alert>
                                            )}
                                        </VStack>
                                    )
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
                                    Choose the AI model for query generation and optimization
                                </FormHelperText>
                            </FormControl>

                            {/* Custom API URL (for OpenRouter) */}
                            {settings.provider === 'OpenRouter' && isEditing && (
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="medium">
                                        <HStack spacing={1}>
                                            <Icon as={FiGlobe} color={mutedColor} />
                                            <Text>API URL (Optional)</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Input
                                        name="apiUrl"
                                        value={settings.apiUrl || ''}
                                        onChange={handleInputChange}
                                        placeholder="https://openrouter.ai/api/v1"
                                        size="lg"
                                        borderRadius="lg"
                                        focusBorderColor={accentColor}
                                    />
                                    <FormHelperText fontSize="xs">
                                        Leave empty to use the default OpenRouter API URL
                                    </FormHelperText>
                                </FormControl>
                            )}

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
                                    {settings.provider === 'OpenRouter' ? 
                                        'OpenRouter charges based on model usage. Each model has different pricing.' :
                                        'OpenAI API usage is billed separately. Monitor your usage at the OpenAI dashboard.'
                                    }
                                </Text>
                                <Link 
                                    href={settings.provider === 'OpenRouter' ? 
                                        "https://openrouter.ai/models" : 
                                        "https://openai.com/pricing"
                                    } 
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
                                    href={providers.find(p => p.id === settings.provider)?.docsUrl || '#'} 
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

export default AIProviderSettings;