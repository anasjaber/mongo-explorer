import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    SearchIcon,
    WarningIcon,
    InfoOutlineIcon,
    TimeIcon,
    CheckCircleIcon,
    CloseIcon,
    ViewIcon,
    RepeatIcon,
    AddIcon
} from '@chakra-ui/icons';
import {
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
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
    Fade,
    ScaleFade,
    Progress,
    Container,
    Grid,
    GridItem,
    useBreakpointValue,
    Stack,
    Tag,
    TagLabel,
    TagLeftIcon,
    Code,
    FormControl,
    FormLabel,
    FormHelperText,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    chakra
} from '@chakra-ui/react';
import * as signalR from '@microsoft/signalr';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaMagic, FaPlus } from 'react-icons/fa';
import { 
    FiDatabase, 
    FiActivity, 
    FiClock,
    FiPlay,
    FiPause,
    FiZap,
    FiFilter,
    FiWifi,
    FiWifiOff,
    FiTrendingUp,
    FiCopy,
    FiLayers,
    FiInfo
} from 'react-icons/fi';
import ReactJson from 'react-json-view';
import MongoQueryViewer from '../components/MongoQueryViewer';

import api from './api';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7073/api';

const PAGE_SIZE = 10;

const QueryProfiler = () => {
    const [connections, setConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState('');
    const [allQueries, setAllQueries] = useState([]);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [queryContent, setQueryContent] = useState('');
    const [suggestedIndexes, setSuggestedIndexes] = useState([]);
    const [isProfiling, setIsProfiling] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestingIndexes, setIsSuggestingIndexes] = useState(false);
    const [creatingIndex, setCreatingIndex] = useState(null);
    const [filterCollection, setFilterCollection] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filteredQueries, setFilteredQueries] = useState([]);
    const [connectionName, setConnectionName] = useState('');

    const toast = useToast();
    const hubConnectionRef = useRef(null);
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const accentColor = useColorModeValue('blue.500', 'blue.400');
    const successColor = useColorModeValue('green.500', 'green.400');
    const warningColor = useColorModeValue('yellow.500', 'yellow.400');
    const errorColor = useColorModeValue('red.500', 'red.400');
    const tableHoverBg = useColorModeValue('gray.50', 'gray.600');
    const isMobile = useBreakpointValue({ base: true, md: false });

    const { isOpen: isQueryModalOpen, onOpen: onOpenQueryModal, onClose: onCloseQueryModal } = useDisclosure();
    const { isOpen: isIndexModalOpen, onOpen: onOpenIndexModal, onClose: onCloseIndexModal } = useDisclosure();

    const startSignalRConnection = useCallback(() => {
        if (hubConnectionRef.current) {
            hubConnectionRef.current.stop();
        }

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL.replace('/api', '')}/queryProfilerHub`)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    if (retryContext.elapsedMilliseconds < 60000) {
                        // If we've been reconnecting for less than 60 seconds so far,
                        // wait between 0 and 10 seconds before the next reconnect attempt.
                        return Math.random() * 10000;
                    } else {
                        // If we've been reconnecting for more than 60 seconds so far, stop reconnecting.
                        return null;
                    }
                }
            })
            .build();

        hubConnectionRef.current = newConnection;

        newConnection.start()
            .then(() => {
                console.log('SignalR Connected');
                setIsConnected(true);
                newConnection.on('ReceiveProfiledQuery', query => {
                    setAllQueries(prev => [query, ...prev]);
                });
            })
            .catch(err => {
                console.error('SignalR Connection Error: ', err);
                setIsConnected(false);
                toast({
                    title: "Connection Error",
                    description: "Failed to connect to real-time updates. Please try selecting the connection again.",
                    status: "error",
                    duration: null,
                    isClosable: true,
                });
            });

        newConnection.onclose(() => {
            console.log('SignalR Disconnected');
            setIsConnected(false);
        });

        newConnection.onreconnecting(() => {
            console.log('SignalR Reconnecting');
            setIsConnected(false);
            toast({
                title: "Reconnecting",
                description: "Attempting to reconnect to real-time updates...",
                status: "warning",
                duration: null,
                isClosable: false,
            });
        });

        newConnection.onreconnected(() => {
            console.log('SignalR Reconnected');
            setIsConnected(true);
            toast({
                title: "Reconnected",
                description: "Successfully reconnected to real-time updates.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        });
    }, [toast, API_BASE_URL]);

    useEffect(() => {
        if (selectedConnection) {
            startSignalRConnection();
            fetchProfiledQueries(selectedConnection);
            checkProfilingStatus(selectedConnection);
        }

        return () => {
            if (hubConnectionRef.current) {
                hubConnectionRef.current.stop();
            }
        };
    }, [selectedConnection, startSignalRConnection]);

    const checkProfilingStatus = async (connectionId) => {
        try {
            const response = await api.get(`/QueryProfiler/profiling-status/${connectionId}`);
            setIsProfiling(response.data);
        } catch (error) {
            handleError('Error checking profiling status', error);
        }
    };



    const fetchConnections = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/MongoConnection`);
            setConnections(Array.isArray(response.data) ? response.data : response.data.items || []);
        } catch (error) {
            handleError('Error loading connections', error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const fetchProfiledQueries = useCallback(async (connectionId) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/QueryProfiler/profiled-queries/${connectionId}`);
            const items = Array.isArray(response.data.items) ? response.data.items : [];
            setAllQueries(prev => [...items, ...prev]);
        } catch (error) {
            handleError('Error fetching profiled queries', error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (selectedConnection) {
            fetchProfiledQueries(selectedConnection);
        }
    }, [selectedConnection, fetchProfiledQueries]);

    const handleStartProfiling = async () => {
        try {
            await api.post(`/QueryProfiler/start-profiling/${selectedConnection}`);
            setIsProfiling(true);
            handleSuccess('Profiling started');
            setAllQueries([]);
            setFilteredQueries([]);
            setCurrentPage(1);

            // Ensure SignalR connection is active
            if (!isConnected) {
                startSignalRConnection();
            }
        } catch (error) {
            handleError('Error starting profiling', error);
        }
    };

    const handleStopProfiling = async () => {
        try {
            await api.post(`/QueryProfiler/stop-profiling/${selectedConnection}`);
            setIsProfiling(false);
            handleSuccess('Profiling stopped');
        } catch (error) {
            handleError('Error stopping profiling', error);
        }
    };


    const applyFilter = useCallback(() => {
        const filtered = allQueries.filter(
            query => filterCollection === '' || query.collection.includes(filterCollection)
        );
        setFilteredQueries(filtered);
        setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));
        setCurrentPage(1);
    }, [allQueries, filterCollection]);

    useEffect(() => {
        applyFilter();
    }, [applyFilter, allQueries]);

    const handleQueryClick = (query) => {
        setSelectedQuery(query);
        setQueryContent(query.queryShape);
        onOpenQueryModal();
    };

    const handleSuggestIndexes = async (query) => {
        setIsSuggestingIndexes(true);
        setSelectedQuery(query);
        try {
            const response = await api.post(`/QueryProfiler/suggest-indexes`, {
                query: query.queryShape
            });
            setSuggestedIndexes(response.data);
            onOpenIndexModal();
        } catch (error) {
            handleError('Failed to suggest indexes', error);
        }
        setIsSuggestingIndexes(false);
    };

    const handleCreateIndex = async (indexDefinition, idx) => {
        setCreatingIndex(idx);
        try {
            const response = await api.post(`/QueryProfiler/create-index`, {
                connectionId: selectedConnection,
                collection: indexDefinition.collectionName,
                pipeline: JSON.stringify(indexDefinition.index),
            });

            handleSuccess('Index created successfully');
            // Optionally, you can update the UI to reflect the new index
            setSuggestedIndexes(prevIndexes => prevIndexes.filter((_, index) => index !== idx));
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Handle the "Index already exists" conflict
                toast({
                    title: "Index Already Exists",
                    description: "The suggested index already exists in the collection.",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                handleError('Error creating index', error);
            }
        }
        setCreatingIndex(null);
    };

    const handleSuccess = (title, description = '') => {
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
        let errorMessage = 'An error occurred';
        
        if (error.response?.data) {
            const errorData = error.response.data;
            if (typeof errorData === 'string') {
                errorMessage = errorData;
                // Check for AI provider configuration message
                if (errorData.includes('API key is not configured') || errorData.includes('AI provider')) {
                    errorMessage = 'AI provider is not configured. Please go to AI Provider Settings to configure your AI service.';
                }
            } else if (errorData.title) {
                errorMessage = errorData.title;
                if (errorData.errors) {
                    const errorDetails = Object.entries(errorData.errors)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('; ');
                    if (errorDetails) {
                        errorMessage += ` - ${errorDetails}`;
                    }
                }
            } else if (errorData.message) {
                errorMessage = errorData.message;
                if (errorMessage.includes('API key is not configured') || errorMessage.includes('AI provider')) {
                    errorMessage = 'AI provider is not configured. Please go to AI Provider Settings to configure your AI service.';
                }
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast({
            title,
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
        });
    };

    const displayedQueries = filteredQueries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                bgGradient="linear(to-r, orange.400, orange.600)"
                                bgClip="text"
                            >
                                Query Profiler
                            </Heading>
                            <Text fontSize="sm" color={mutedColor}>
                                Monitor and optimize MongoDB query performance in real-time
                            </Text>
                        </VStack>
                        <HStack>
                            <Badge 
                                colorScheme={isConnected ? "green" : "gray"}
                                variant="subtle"
                                p={2}
                                borderRadius="md"
                            >
                                <Icon 
                                    as={isConnected ? FiWifi : FiWifiOff} 
                                    mr={1}
                                />
                                {isConnected ? "Connected" : "Disconnected"}
                            </Badge>
                            <Tooltip label="Refresh connections">
                                <IconButton
                                    icon={<RepeatIcon />}
                                    onClick={fetchConnections}
                                    isLoading={isLoading}
                                    variant="ghost"
                                    aria-label="Refresh"
                                />
                            </Tooltip>
                        </HStack>
                    </HStack>
                    <Divider />
                </Box>

                {/* Stats Overview */}
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiActivity} />
                                        <Text>Profiling Status</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="lg">
                                    <Badge 
                                        colorScheme={isProfiling ? "green" : "gray"}
                                        fontSize="md"
                                        p={2}
                                    >
                                        {isProfiling ? "Active" : "Inactive"}
                                    </Badge>
                                </StatNumber>
                                <StatHelpText>
                                    {isProfiling ? "Monitoring queries" : "Not monitoring"}
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiDatabase} />
                                        <Text>Total Queries</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={accentColor}>
                                    {allQueries.length}
                                </StatNumber>
                                <StatHelpText>Captured queries</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiClock} />
                                        <Text>Avg. Execution</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={warningColor}>
                                    {allQueries.length > 0 
                                        ? Math.round(allQueries.reduce((sum, q) => sum + q.executionTimeMs, 0) / allQueries.length)
                                        : 0
                                    }ms
                                </StatNumber>
                                <StatHelpText>Average time</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiTrendingUp} />
                                        <Text>Slow Queries</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={errorColor}>
                                    {allQueries.filter(q => q.executionTimeMs > 100).length}
                                </StatNumber>
                                <StatHelpText>&gt; 100ms</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Control Panel */}
                <Card bg={cardBg} borderRadius="xl" boxShadow="md" overflow="hidden">
                    <CardHeader 
                        bg={useColorModeValue('orange.50', 'gray.700')}
                        borderBottom="1px"
                        borderColor={borderColor}
                    >
                        <HStack spacing={3}>
                            <Icon as={FiActivity} color="orange.500" boxSize={5} />
                            <Heading size="md">Profiling Controls</Heading>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={5} align="stretch">
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    <HStack spacing={1}>
                                        <Icon as={FiDatabase} color={mutedColor} />
                                        <Text>Database Connection</Text>
                                    </HStack>
                                </FormLabel>
                                <Select
                                    placeholder="Select a connection to profile"
                                    value={selectedConnection}
                                    onChange={(e) => {
                                        setSelectedConnection(e.target.value);
                                        const conn = connections.find(c => c.id === e.target.value);
                                        setConnectionName(conn?.name || '');
                                    }}
                                    isDisabled={connections.length === 0 || isLoading}
                                    size="lg"
                                    borderRadius="lg"
                                >
                                    {connections.map((conn) => (
                                        <option key={conn.id} value={conn.id}>{conn.name}</option>
                                    ))}
                                </Select>
                                <FormHelperText fontSize="xs">
                                    Select the database connection you want to profile
                                </FormHelperText>
                            </FormControl>

                            {selectedConnection && (
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                                    <GridItem>
                                        <Button
                                            onClick={isProfiling ? handleStopProfiling : handleStartProfiling}
                                            colorScheme={isProfiling ? "red" : "green"}
                                            isLoading={isLoading}
                                            leftIcon={<Icon as={isProfiling ? FiPause : FiPlay} />}
                                            size="lg"
                                            width="full"
                                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                            transition="all 0.2s"
                                        >
                                            {isProfiling ? "Stop Profiling" : "Start Profiling"}
                                        </Button>
                                    </GridItem>
                                    
                                    <GridItem>
                                        <HStack spacing={2}>
                                            <Icon 
                                                as={isConnected ? CheckCircleIcon : WarningIcon} 
                                                color={isConnected ? successColor : warningColor}
                                                boxSize={5}
                                            />
                                            <Text fontSize="sm" color={isConnected ? successColor : warningColor}>
                                                {isConnected ? "Real-time updates active" : "Reconnecting..."}
                                            </Text>
                                        </HStack>
                                    </GridItem>
                                </Grid>
                            )}

                            {isProfiling && !isConnected && (
                                <Alert status="warning" borderRadius="lg" variant="subtle">
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle fontSize="sm">Connection Issue</AlertTitle>
                                        <AlertDescription fontSize="xs">
                                            Real-time updates are not connected. Try selecting the connection again.
                                        </AlertDescription>
                                    </Box>
                                </Alert>
                            )}

                            <Divider />

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    <HStack spacing={1}>
                                        <Icon as={FiFilter} color={mutedColor} />
                                        <Text>Filter Queries</Text>
                                    </HStack>
                                </FormLabel>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none">
                                        <SearchIcon color={mutedColor} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Filter by collection name..."
                                        value={filterCollection}
                                        onChange={(e) => setFilterCollection(e.target.value)}
                                        borderRadius="lg"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                applyFilter();
                                            }
                                        }}
                                    />
                                </InputGroup>
                                <FormHelperText fontSize="xs">
                                    Search for queries by collection name
                                </FormHelperText>
                            </FormControl>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Query Results Table */}
                <Card borderRadius="xl" boxShadow="md" overflow="hidden">
                    <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
                        <HStack justify="space-between">
                            <HStack spacing={3}>
                                <Icon as={FiLayers} color={accentColor} boxSize={5} />
                                <Heading size="md">Profiled Queries</Heading>
                            </HStack>
                            {filteredQueries.length > 0 && (
                                <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                                    {filteredQueries.length} {filteredQueries.length === 1 ? 'Query' : 'Queries'}
                                </Badge>
                            )}
                        </HStack>
                    </CardHeader>
                    <CardBody p={0}>
                        {isLoading ? (
                            <Center py={10}>
                                <VStack spacing={4}>
                                    <Spinner size="xl" color={accentColor} thickness="4px" />
                                    <Text color={mutedColor}>Loading queries...</Text>
                                </VStack>
                            </Center>
                        ) : displayedQueries.length > 0 ? (
                            <>
                                <Box overflowX="auto">
                                    <Table variant="simple" size="md">
                                        <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                                            <Tr>
                                                <Th>Query Details</Th>
                                                <Th>Performance</Th>
                                                <Th>Actions</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {displayedQueries.map((query) => (
                                                <Tr 
                                                    key={query.id}
                                                    _hover={{ bg: tableHoverBg }}
                                                    transition="background 0.2s"
                                                >
                                                    <Td>
                                                        <VStack align="start" spacing={2}>
                                                            <HStack spacing={2}>
                                                                <Icon as={FiDatabase} color={accentColor} boxSize={4} />
                                                                <Text fontWeight="semibold">{query.collection}</Text>
                                                            </HStack>
                                                            <Code
                                                                p={2}
                                                                borderRadius="md"
                                                                fontSize="xs"
                                                                maxWidth="400px"
                                                                isTruncated
                                                                cursor="pointer"
                                                                onClick={() => handleQueryClick(query)}
                                                                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                                                            >
                                                                {query.queryShape}
                                                            </Code>
                                                            <HStack spacing={1}>
                                                                <Icon as={FiClock} boxSize={3} color={mutedColor} />
                                                                <Text fontSize="xs" color={mutedColor}>
                                                                    {new Date(query.timestamp).toLocaleString()}
                                                                </Text>
                                                            </HStack>
                                                        </VStack>
                                                    </Td>
                                                    <Td>
                                                        <VStack align="start" spacing={2}>
                                                            <Badge 
                                                                colorScheme={
                                                                    query.executionTimeMs < 50 ? "green" :
                                                                    query.executionTimeMs < 100 ? "yellow" : "red"
                                                                }
                                                                fontSize="sm"
                                                                px={3}
                                                                py={1}
                                                            >
                                                                {(() => {
                                                                    // Handle both integer ms and TimeSpan string formats
                                                                    const time = query.executionTimeMs;
                                                                    if (typeof time === 'number') {
                                                                        return `${time}ms`;
                                                                    } else if (typeof time === 'string') {
                                                                        // Parse TimeSpan format (e.g., "00:00:00.0790294")
                                                                        const match = time.match(/(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
                                                                        if (match) {
                                                                            const hours = parseInt(match[1]);
                                                                            const minutes = parseInt(match[2]);
                                                                            const seconds = parseInt(match[3]);
                                                                            const ms = Math.round(parseFloat(`0.${match[4]}`) * 1000);
                                                                            const totalMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
                                                                            return `${totalMs}ms`;
                                                                        }
                                                                        // If can't parse, show the original value without "MS" suffix
                                                                        return time.replace(/MS$/i, 'ms');
                                                                    }
                                                                    return '0ms';
                                                                })()}
                                                            </Badge>
                                                            {query.executionTimeMs > 100 && (
                                                                <Tag size="sm" colorScheme="red" variant="subtle">
                                                                    <TagLeftIcon as={WarningIcon} />
                                                                    <TagLabel>Slow Query</TagLabel>
                                                                </Tag>
                                                            )}
                                                        </VStack>
                                                    </Td>
                                                    <Td>
                                                        <HStack spacing={2}>
                                                            <Tooltip label="View full query">
                                                                <IconButton
                                                                    icon={<ViewIcon />}
                                                                    onClick={() => handleQueryClick(query)}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    colorScheme="blue"
                                                                    aria-label="View Query"
                                                                />
                                                            </Tooltip>
                                                            <Tooltip label="Suggest indexes with AI">
                                                                <IconButton
                                                                    icon={<Icon as={FaMagic} />}
                                                                    onClick={() => handleSuggestIndexes(query)}
                                                                    isLoading={isSuggestingIndexes && selectedQuery?.id === query.id}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    colorScheme="purple"
                                                                    aria-label="Suggest Indexes"
                                                                />
                                                            </Tooltip>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                                
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <Box p={4} borderTop="1px" borderColor={borderColor}>
                                        <Flex justify="center">
                                            <HStack spacing={4}>
                                                <IconButton
                                                    icon={<ChevronLeftIcon />}
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    isDisabled={currentPage === 1}
                                                    variant="outline"
                                                    aria-label="Previous Page"
                                                />
                                                <HStack spacing={2}>
                                                    <Text fontSize="sm" fontWeight="medium">
                                                        Page
                                                    </Text>
                                                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                                                        {currentPage} / {totalPages}
                                                    </Badge>
                                                </HStack>
                                                <IconButton
                                                    icon={<ChevronRightIcon />}
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    isDisabled={currentPage === totalPages}
                                                    variant="outline"
                                                    aria-label="Next Page"
                                                />
                                            </HStack>
                                        </Flex>
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Center py={10}>
                                <VStack spacing={4}>
                                    <Icon as={FiDatabase} boxSize={12} color={mutedColor} />
                                    <VStack spacing={2}>
                                        <Heading size="md">No Queries Captured</Heading>
                                        <Text color={mutedColor} textAlign="center">
                                            {isProfiling 
                                                ? "Waiting for queries to be executed..."
                                                : "Start profiling to capture query performance data"
                                            }
                                        </Text>
                                    </VStack>
                                    {!isProfiling && selectedConnection && (
                                        <Button
                                            colorScheme="green"
                                            leftIcon={<Icon as={FiPlay} />}
                                            onClick={handleStartProfiling}
                                            size="lg"
                                        >
                                            Start Profiling
                                        </Button>
                                    )}
                                </VStack>
                            </Center>
                        )}
                    </CardBody>
                </Card>

                {/* Query Details Modal */}
                <Modal isOpen={isQueryModalOpen} onClose={onCloseQueryModal} size="xl">
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent borderRadius="xl">
                        <ModalHeader borderBottom="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Icon as={ViewIcon} color={accentColor} boxSize={5} />
                                <Text>Query Details</Text>
                                {selectedQuery && (
                                    <Badge colorScheme="blue" fontSize="sm">
                                        {selectedQuery.collection}
                                    </Badge>
                                )}
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={4} align="stretch">
                                {selectedQuery && (
                                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                        <GridItem>
                                            <Text fontSize="xs" color={mutedColor}>Execution Time</Text>
                                            <Badge 
                                                colorScheme={
                                                    selectedQuery.executionTimeMs < 50 ? "green" :
                                                    selectedQuery.executionTimeMs < 100 ? "yellow" : "red"
                                                }
                                                fontSize="lg"
                                                px={3}
                                                py={1}
                                            >
                                                {(() => {
                                                    // Handle both integer ms and TimeSpan string formats
                                                    const time = selectedQuery.executionTimeMs;
                                                    if (typeof time === 'number') {
                                                        return `${time}ms`;
                                                    } else if (typeof time === 'string') {
                                                        // Parse TimeSpan format (e.g., "00:00:00.0790294")
                                                        const match = time.match(/(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
                                                        if (match) {
                                                            const hours = parseInt(match[1]);
                                                            const minutes = parseInt(match[2]);
                                                            const seconds = parseInt(match[3]);
                                                            const ms = Math.round(parseFloat(`0.${match[4]}`) * 1000);
                                                            const totalMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
                                                            return `${totalMs}ms`;
                                                        }
                                                        // If can't parse, show the original value without "MS" suffix
                                                        return time.replace(/MS$/i, 'ms');
                                                    }
                                                    return '0ms';
                                                })()}
                                            </Badge>
                                        </GridItem>
                                        <GridItem>
                                            <Text fontSize="xs" color={mutedColor}>Timestamp</Text>
                                            <Text fontSize="sm" fontWeight="medium">
                                                {new Date(selectedQuery.timestamp).toLocaleString()}
                                            </Text>
                                        </GridItem>
                                    </Grid>
                                )}
                                <Box 
                                    bg={useColorModeValue('gray.900', 'gray.950')}
                                    p={4}
                                    borderRadius="lg"
                                >
                                    <MongoQueryViewer query={queryContent} />
                                </Box>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTop="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Button 
                                    leftIcon={<Icon as={FiCopy} />}
                                    variant="ghost"
                                    onClick={() => {
                                        navigator.clipboard.writeText(queryContent);
                                        handleSuccess('Query copied to clipboard');
                                    }}
                                >
                                    Copy Query
                                </Button>
                                <Button colorScheme="blue" onClick={onCloseQueryModal}>
                                    Close
                                </Button>
                            </HStack>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Suggested Indexes Modal */}
                <Modal isOpen={isIndexModalOpen} onClose={onCloseIndexModal} size="xl">
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent borderRadius="xl">
                        <ModalHeader borderBottom="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Icon as={FiZap} color="purple.500" boxSize={5} />
                                <Text>AI-Suggested Indexes</Text>
                                <Badge colorScheme="purple" fontSize="sm">AI-Powered</Badge>
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack align="stretch" spacing={4}>
                                {suggestedIndexes.length ? (
                                    <>
                                        <Alert status="info" borderRadius="lg" variant="subtle">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle fontSize="sm">Index Suggestions</AlertTitle>
                                                <AlertDescription fontSize="xs">
                                                    These indexes are suggested by AI to optimize your query performance.
                                                    Review carefully before creating.
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                        {suggestedIndexes.map((indexDefinition, idx) => (
                                            <Card key={idx} variant="outline" borderRadius="lg">
                                                <CardBody>
                                                    <VStack align="stretch" spacing={3}>
                                                        <HStack justify="space-between">
                                                            <Badge colorScheme="green" fontSize="sm">
                                                                Index #{idx + 1}
                                                            </Badge>
                                                            <Text fontSize="xs" color={mutedColor}>
                                                                Collection: {indexDefinition.collectionName}
                                                            </Text>
                                                        </HStack>
                                                        <Box 
                                                            bg={useColorModeValue('gray.50', 'gray.900')}
                                                            p={3}
                                                            borderRadius="md"
                                                        >
                                                            <ReactJson
                                                                src={indexDefinition}
                                                                theme={useColorModeValue('rjv-default', 'monokai')}
                                                                collapsed={1}
                                                                collapseStringsAfterLength={50}
                                                                enableClipboard={(copy) => {
                                                                    let copyText = JSON.stringify(copy.src, null, 2);
                                                                    navigator.clipboard.writeText(copyText);
                                                                    handleSuccess('Index definition copied');
                                                                    return true;
                                                                }}
                                                                displayDataTypes={false}
                                                                displayObjectSize={true}
                                                                style={{
                                                                    fontSize: '12px',
                                                                    backgroundColor: 'transparent'
                                                                }}
                                                            />
                                                        </Box>
                                                        <Button
                                                            colorScheme="green"
                                                            size="sm"
                                                            onClick={() => handleCreateIndex(indexDefinition, idx)}
                                                            isLoading={creatingIndex === idx}
                                                            loadingText="Creating..."
                                                            leftIcon={<AddIcon />}
                                                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                                            transition="all 0.2s"
                                                        >
                                                            Create This Index
                                                        </Button>
                                                    </VStack>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </>
                                ) : (
                                    <Center py={6}>
                                        <VStack spacing={4}>
                                            <Icon as={InfoOutlineIcon} boxSize={12} color={mutedColor} />
                                            <Text color={mutedColor}>No index suggestions available for this query</Text>
                                        </VStack>
                                    </Center>
                                )}
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTop="1px" borderColor={borderColor}>
                            <Button colorScheme="blue" onClick={onCloseIndexModal}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Fade>
    );
};

export default QueryProfiler;
