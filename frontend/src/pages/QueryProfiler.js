import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
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
    VStack
} from '@chakra-ui/react';
import * as signalR from '@microsoft/signalr';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaMagic, FaPlus } from 'react-icons/fa';
import ReactJson from 'react-json-view';
import MongoQueryViewer from '../components/MongoQueryViewer';

import api from './api';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7073/api';

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

    const toast = useToast();
    const hubConnectionRef = useRef(null);
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

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
            handleError('Error suggesting indexes', error);
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

    const handleSuccess = (title) => {
        toast({
            title,
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const handleError = (title, error) => {
        toast({
            title,
            description: error.response?.data || error.message || 'An error occurred',
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
    };

    const displayedQueries = filteredQueries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <VStack spacing={8} align="stretch">
            <Heading as="h1" size="lg">Query Profiler</Heading>

            <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                <VStack spacing={4} align="stretch">
                    <Select
                        placeholder="Select connection"
                        value={selectedConnection}
                        onChange={(e) => setSelectedConnection(e.target.value)}
                        isDisabled={connections.length === 0 || isLoading}
                    >
                        {connections.map((conn) => (
                            <option key={conn.id} value={conn.id}>{conn.name}</option>
                        ))}
                    </Select>

                    {selectedConnection && (
                        <>
                            <Button
                                onClick={isProfiling ? handleStopProfiling : handleStartProfiling}
                                colorScheme={isProfiling ? "red" : "green"}
                                isLoading={isLoading}
                            >
                                {isProfiling ? "Stop Profiling" : "Start Profiling"}
                            </Button>
                            {isProfiling && !isConnected && (
                                <Text color="red.500">
                                    Warning: Real-time updates are not connected. Please try selecting the connection again.
                                </Text>
                            )}
                        </>
                    )}


                    <HStack>
                        <Input
                            placeholder="Filter by collection name"
                            value={filterCollection}
                            onChange={(e) => setFilterCollection(e.target.value)}
                        />
                        <Button
                            leftIcon={<SearchIcon />}
                            onClick={applyFilter}
                            colorScheme="blue"
                        >
                            Search
                        </Button>
                    </HStack>
                </VStack>
            </Box>

            <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                {isLoading ? (
                    <Flex justify="center">
                        <Spinner size="xl" />
                    </Flex>
                ) : (
                    <>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Timestamp</Th>
                                    <Th>Collection</Th>
                                    <Th>Query</Th>
                                    <Th>Execution Time (ms)</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {displayedQueries.map((query) => (
                                    <Tr key={query.id}>
                                        <Td>{new Date(query.timestamp).toLocaleString()}</Td>
                                        <Td>{query.collection}</Td>
                                        <Td>
                                            <Text
                                                isTruncated
                                                maxWidth="300px"
                                                cursor="pointer"
                                                textDecoration="underline"
                                                onClick={() => handleQueryClick(query)}
                                            >
                                                {query.queryShape}
                                            </Text>
                                        </Td>
                                        <Td>{query.executionTimeMs}</Td>
                                        <Td>
                                            <Tooltip label="Suggest Indexes">
                                                <IconButton
                                                    icon={<FaMagic />}
                                                    onClick={() => handleSuggestIndexes(query)}
                                                    isLoading={isSuggestingIndexes}
                                                    colorScheme="blue"
                                                    size="sm"
                                                    aria-label="Suggest Indexes"
                                                />
                                            </Tooltip>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                        <Flex justifyContent="center" mt={4}>
                            <HStack>
                                <IconButton
                                    icon={<ChevronLeftIcon />}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    isDisabled={currentPage === 1}
                                    aria-label="Previous Page"
                                />
                                <Text>Page {currentPage} of {totalPages}</Text>
                                <IconButton
                                    icon={<ChevronRightIcon />}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    isDisabled={currentPage === totalPages}
                                    aria-label="Next Page"
                                />
                            </HStack>
                        </Flex>
                    </>
                )}
            </Box>

            <Modal isOpen={isQueryModalOpen} onClose={onCloseQueryModal} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Mongo Query</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                            <MongoQueryViewer query={queryContent} />
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onCloseQueryModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isIndexModalOpen} onClose={onCloseIndexModal} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Suggested Indexes for Query</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="stretch" spacing={4}>
                            {suggestedIndexes.length ? (
                                suggestedIndexes.map((indexDefinition, idx) => (
                                    <Box key={idx} borderWidth={1} borderRadius="md" p={4}>
                                        <ReactJson
                                            src={indexDefinition}
                                            theme="rjv-default"
                                            collapsed={1}
                                            collapseStringsAfterLength={50}
                                            enableClipboard={(copy) => {
                                                let copyText = JSON.stringify(copy.src, null, 2);
                                                navigator.clipboard.writeText(copyText);
                                                return true;
                                            }}
                                            displayDataTypes={false}
                                            displayObjectSize={false}
                                        />
                                        <Button
                                            mt={2}
                                            colorScheme="green"
                                            size="sm"
                                            onClick={() => handleCreateIndex(indexDefinition, idx)}
                                            isLoading={creatingIndex === idx}
                                            leftIcon={<FaPlus />}
                                        >
                                            Create Index
                                        </Button>
                                    </Box>
                                ))
                            ) : (
                                <Alert status="info">
                                    <AlertIcon />
                                    No suggested indexes available.
                                </Alert>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onCloseIndexModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </VStack>
    );
};

export default QueryProfiler;
