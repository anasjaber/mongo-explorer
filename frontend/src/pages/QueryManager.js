import { 
    AddIcon, 
    CheckIcon, 
    CloseIcon, 
    DeleteIcon, 
    DownloadIcon, 
    EditIcon, 
    SearchIcon, 
    StarIcon, 
    ViewIcon,
    WarningIcon,
    RepeatIcon,
    CopyIcon,
    TimeIcon,
    InfoOutlineIcon
} from '@chakra-ui/icons';
import {
    Alert,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    Box,
    Button,
    FormControl,
    FormLabel,
    FormHelperText,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Tab,
    Table,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Textarea,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
    Text,
    Badge,
    Card,
    CardBody,
    CardHeader,
    Divider,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Icon,
    Flex,
    Center,
    Container,
    Stack,
    Fade,
    ScaleFade,
    Collapse,
    Progress,
    Grid,
    GridItem,
    useBreakpointValue,
    Code,
    Tag,
    TagLabel,
    TagLeftIcon,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider
} from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { lazy, default as React, useCallback, useEffect, useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { 
    FiDatabase, 
    FiServer, 
    FiCode, 
    FiPlay, 
    FiDownload, 
    FiStar,
    FiCopy,
    FiEye,
    FiFilter,
    FiFolder,
    FiClock,
    FiActivity
} from 'react-icons/fi';
import ReactJson from 'react-json-view';
import { useLocation, useNavigate } from 'react-router-dom';
import api from './api';

const AIQueryGenerator = lazy(() => import('./AIQueryGenerator'));

const useQuery = () => new URLSearchParams(useLocation().search);

const QueryManager = () => {
    const query = useQuery();
    const queryId = query.get('queryId');
    const navigate = useNavigate();
    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBg = useColorModeValue('gray.50', 'gray.600');
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const successColor = useColorModeValue('green.500', 'green.400');
    const errorColor = useColorModeValue('red.500', 'red.400');
    const warningColor = useColorModeValue('yellow.500', 'yellow.400');
    const accentColor = useColorModeValue('blue.500', 'blue.400');
    const tableBg = useColorModeValue('gray.50', 'gray.800');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.700');
    const codeBg = useColorModeValue('gray.900', 'gray.950');
    const isMobile = useBreakpointValue({ base: true, md: false });

    const [queries, setQueries] = useState([]);
    const [favoriteQueries, setFavoriteQueries] = useState([]);
    const [connections, setConnections] = useState([]);
    const [collections, setCollections] = useState([]);
    const [currentQuery, setCurrentQuery] = useState({
        id: null,
        title: '',
        description: '',
        queryText: '',
        connectionId: '',
        collectionName: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [queryResult, setQueryResult] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [schemaData, setSchemaData] = useState(null);
    const [filter, setFilter] = useState('');

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [queryToDelete, setQueryToDelete] = useState(null);
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [executingQueries, setExecutingQueries] = useState(new Set());
    const cancelRef = React.useRef();

    const handleDeleteQuery = async (queryId) => {
        setQueryToDelete(queryId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setIsLoading(true);
        try {
            await api.delete(`/Query/${queryToDelete}`);
            handleSuccess('Query deleted', 'The query has been deleted successfully.');
            fetchQueries();
            fetchFavoriteQueries();
        } catch (error) {
            handleError('Error deleting query', error);
        }
        setIsLoading(false);
        setIsDeleteDialogOpen(false);
    };

    const { isOpen: isAIGeneratorOpen, onOpen: onOpenAIGenerator, onClose: onCloseAIGenerator } = useDisclosure();
    const { isOpen: isSchemaModalOpen, onOpen: onOpenSchemaModal, onClose: onCloseSchemaModal } = useDisclosure();
    const { isOpen: isResultModalOpen, onOpen: onOpenResultModal, onClose: onCloseResultModal } = useDisclosure();

    const fetchQueries = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/Query`, { params: { filter } });
            setQueries(response.data.items || []);
        } catch (error) {
            handleError('Error fetching queries', error);
        }
        setIsLoading(false);
    }, [filter]);

    const fetchFavoriteQueries = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/Query/favorites`, { params: { filter } });
            setFavoriteQueries(response.data || []);
        } catch (error) {
            handleError('Error fetching favorite queries', error);
        }
        setIsLoading(false);
    }, [filter]);

    const fetchConnections = useCallback(async () => {
        try {
            const response = await api.get(`/MongoConnection`);
            setConnections(response.data.items || []);
        } catch (error) {
            handleError('Error fetching connections', error);
        }
    }, []);

    const fetchCollections = useCallback(async (connectionId) => {
        try {
            const response = await api.get(`/MongoConnection/${connectionId}/collections`);
            setCollections(response.data || []);
        } catch (error) {
            handleError('Error fetching collections', error);
        }
    }, []);

    useEffect(() => {
        fetchQueries();
        fetchFavoriteQueries();
        fetchConnections();
    }, [fetchQueries, fetchFavoriteQueries, fetchConnections]);

    useEffect(() => {
        if (queryId) {
            fetchQueryById(queryId);
        }
    }, [queryId]);

    const fetchQueryById = async (id) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/Query/${id}`);
            setIsEditing(true);
            setCurrentQuery(response.data);
            await fetchCollections(response.data.connectionId);
        } catch (error) {
            handleError('Error fetching query', error);
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuery(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing) {
                await api.put(`/Query/${currentQuery.id}`, currentQuery);
                handleSuccess('Query updated', 'The query has been updated successfully.');
            } else {
                await api.post(`/Query`, currentQuery);
                handleSuccess('Query added', 'New query has been added successfully.');
            }
            resetForm();
            fetchQueries();
            fetchFavoriteQueries();
            navigate('/queries');
        } catch (error) {
            handleError(isEditing ? 'Error updating query' : 'Error adding query', error);
        }
        setIsLoading(false);
    };

    const handleExecuteQuery = async (query, download = false) => {
        setIsLoading(true);
        setSelectedQuery(query);

        try {
            const response = await api.post(`/Query/${query.id}/execute`);
            setQueryResult(response.data);

            if (download) {
                const jsonResponse = await api.get(`/Query/${query.id}/download-json`, {
                    responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([jsonResponse.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `query_result_${query.id}.json`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
            } else {
                handleSuccess('Query executed successfully');
                onOpenResultModal();
            }
        } catch (error) {
            handleError('Error executing query', error);
        }

        setIsLoading(false);
    };

    const handleConnectionChange = async (selectedOption) => {
        if (selectedOption) {
            setCurrentQuery(prev => ({ ...prev, connectionId: selectedOption.value, collectionName: '' }));
            await fetchCollections(selectedOption.value);
        } else {
            setCurrentQuery(prev => ({ ...prev, connectionId: '', collectionName: '' }));
            setCollections([]);
        }
    };

    const handleCollectionChange = (selectedOption) => {
        setCurrentQuery(prev => ({ ...prev, collectionName: selectedOption ? selectedOption.value : '' }));
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentQuery({ id: null, title: '', description: '', queryText: '', connectionId: '', collectionName: '' });
        setCollections([]);
    };

    const handleAIGeneratorClose = (generatedQueryText) => {
        onCloseAIGenerator();
        if (generatedQueryText) {
            setCurrentQuery(prev => ({ ...prev, queryText: generatedQueryText }));
        }
    };

    const handleFetchSchema = async (connectionId, collectionName) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/MongoSchema/${connectionId}?includedCollections=${collectionName}`);
            setSchemaData(JSON.parse(response.data.formattedSchema));
            onOpenSchemaModal();
        } catch (error) {
            handleError('Error fetching schema', error);
        }
        setIsLoading(false);
    };

    const handleFavourite = async (query) => {
        try {
            await api.post(`/Query/${query.id}/favourite`, { isFavourite: !query.isFavourite });
            fetchQueries();
            fetchFavoriteQueries();
            handleSuccess('Favourite updated');
        } catch (error) {
            handleError('Error updating favourite', error);
        }
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
        toast({
            title,
            description: error.response?.data || error.message || 'An error occurred',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
        });
    };

    const customCopyHandler = (copy) => {
        const { name, namespace } = copy;
        // Remove 'root' from the beginning of the namespace if it exists
        const cleanNamespace = namespace[0] === 'root' ? namespace.slice(1) : namespace;
        // Combine the namespace and name, ensuring no duplication
        const fullPath = [...cleanNamespace].join('.');
        navigator.clipboard.writeText(fullPath);
        toast({
            title: 'Copied to clipboard',
            description: `Field path: ${fullPath}`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
        return false; // Prevent default copy behavior
    };

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
                                bgGradient="linear(to-r, blue.400, blue.600)"
                                bgClip="text"
                            >
                                Query Manager
                            </Heading>
                            <Text fontSize="sm" color={mutedColor}>
                                Create, manage and execute MongoDB queries
                            </Text>
                        </VStack>
                        <HStack>
                            <Tooltip label="Refresh queries">
                                <IconButton
                                    icon={<RepeatIcon />}
                                    onClick={() => {
                                        fetchQueries();
                                        fetchFavoriteQueries();
                                    }}
                                    isLoading={isLoading}
                                    variant="ghost"
                                    aria-label="Refresh"
                                />
                            </Tooltip>
                            <Button
                                leftIcon={<AddIcon />}
                                colorScheme="blue"
                                onClick={() => {
                                    resetForm();
                                    setIsFormExpanded(true);
                                }}
                                size="md"
                            >
                                New Query
                            </Button>
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
                                        <Icon as={FiDatabase} />
                                        <Text>Total Queries</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={accentColor}>
                                    {queries.length}
                                </StatNumber>
                                <StatHelpText>Saved queries</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiStar} />
                                        <Text>Favorites</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={warningColor}>
                                    {favoriteQueries.length}
                                </StatNumber>
                                <StatHelpText>Starred queries</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiActivity} />
                                        <Text>Total Runs</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={successColor}>
                                    {queries.reduce((acc, q) => acc + (q.runCount || 0), 0)}
                                </StatNumber>
                                <StatHelpText>Executions</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiServer} />
                                        <Text>Connections</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={textColor}>
                                    {connections.length}
                                </StatNumber>
                                <StatHelpText>Available</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Query Form */}
                <Collapse in={isFormExpanded || isEditing} animateOpacity>
                    <Card
                        as="form"
                        onSubmit={handleSubmit}
                        bg={cardBg}
                        borderRadius="xl"
                        boxShadow="md"
                        overflow="hidden"
                    >
                        <CardHeader 
                            bg={useColorModeValue('blue.50', 'gray.700')}
                            borderBottom="1px"
                            borderColor={borderColor}
                        >
                            <HStack justify="space-between">
                                <HStack spacing={3}>
                                    <Icon 
                                        as={isEditing ? EditIcon : AddIcon} 
                                        color={accentColor}
                                        boxSize={5}
                                    />
                                    <Heading size="md">
                                        {isEditing ? 'Edit Query' : 'Create New Query'}
                                    </Heading>
                                </HStack>
                                <IconButton
                                    icon={<CloseIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsFormExpanded(false);
                                        resetForm();
                                    }}
                                    aria-label="Close form"
                                />
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5}>
                                <GridItem colSpan={{ base: 1, md: 2 }}>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            Query Title
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiCode} color={mutedColor} />
                                            </InputLeftElement>
                                            <Input
                                                name="title"
                                                value={currentQuery.title}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Find active users"
                                                size="lg"
                                                borderRadius="lg"
                                                focusBorderColor={accentColor}
                                            />
                                        </InputGroup>
                                        <FormHelperText fontSize="xs">
                                            A descriptive name for your query
                                        </FormHelperText>
                                    </FormControl>
                                </GridItem>

                                <GridItem colSpan={{ base: 1, md: 2 }}>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            Description
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={InfoOutlineIcon} color={mutedColor} />
                                            </InputLeftElement>
                                            <Input
                                                name="description"
                                                value={currentQuery.description}
                                                onChange={handleInputChange}
                                                placeholder="What does this query do?"
                                                size="lg"
                                                borderRadius="lg"
                                                focusBorderColor={accentColor}
                                            />
                                        </InputGroup>
                                        <FormHelperText fontSize="xs">
                                            Brief description of the query purpose
                                        </FormHelperText>
                                    </FormControl>
                                </GridItem>

                                <GridItem>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            <HStack spacing={1}>
                                                <Icon as={FiDatabase} color={mutedColor} />
                                                <Text>Connection</Text>
                                            </HStack>
                                        </FormLabel>
                                        <Select
                                            value={currentQuery.connectionId ? { 
                                                value: currentQuery.connectionId, 
                                                label: connections.find(conn => conn.id === currentQuery.connectionId)?.name || '' 
                                            } : null}
                                            onChange={handleConnectionChange}
                                            options={connections.map(conn => ({ value: conn.id, label: conn.name }))}
                                            placeholder="Select a connection"
                                            chakraStyles={{
                                                control: (provided) => ({
                                                    ...provided,
                                                    borderRadius: 'lg',
                                                    minHeight: '48px'
                                                })
                                            }}
                                        />
                                    </FormControl>
                                </GridItem>

                                <GridItem>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            <HStack spacing={1}>
                                                <Icon as={FiFolder} color={mutedColor} />
                                                <Text>Collection</Text>
                                            </HStack>
                                        </FormLabel>
                                        <Select
                                            value={currentQuery.collectionName ? { 
                                                value: currentQuery.collectionName, 
                                                label: currentQuery.collectionName 
                                            } : null}
                                            onChange={handleCollectionChange}
                                            options={collections.map(coll => ({ value: coll, label: coll }))}
                                            placeholder="Select a collection"
                                            isDisabled={!currentQuery.connectionId}
                                            chakraStyles={{
                                                control: (provided) => ({
                                                    ...provided,
                                                    borderRadius: 'lg',
                                                    minHeight: '48px'
                                                })
                                            }}
                                        />
                                    </FormControl>
                                </GridItem>

                                <GridItem colSpan={{ base: 1, md: 2 }}>
                                    <FormControl isRequired>
                                        <HStack justify="space-between" mb={2}>
                                            <FormLabel fontSize="sm" fontWeight="medium">
                                                MongoDB Query
                                            </FormLabel>
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="purple"
                                                leftIcon={<FaMagic />}
                                                onClick={onOpenAIGenerator}
                                            >
                                                Generate with AI
                                            </Button>
                                        </HStack>
                                        <Box 
                                            borderWidth="1px" 
                                            borderRadius="lg" 
                                            borderColor={borderColor}
                                            bg={useColorModeValue('gray.50', 'gray.900')}
                                            p={2}
                                        >
                                            <Textarea
                                                name="queryText"
                                                value={currentQuery.queryText}
                                                onChange={handleInputChange}
                                                h="30vh"
                                                fontFamily="mono"
                                                fontSize="sm"
                                                placeholder="db.collection.find({})\n.sort({})\n.limit(10)"
                                                bg="transparent"
                                                border="none"
                                                _focus={{ border: 'none', boxShadow: 'none' }}
                                            />
                                        </Box>
                                        <FormHelperText fontSize="xs">
                                            Enter your MongoDB query in JavaScript format
                                        </FormHelperText>
                                    </FormControl>
                                </GridItem>

                                <GridItem colSpan={{ base: 1, md: 2 }}>
                                    <Divider my={2} />
                                    <HStack justify="flex-end" spacing={3}>
                                        {isEditing && (
                                            <Button 
                                                onClick={resetForm} 
                                                variant="ghost"
                                                leftIcon={<CloseIcon />}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <Button 
                                            type="submit" 
                                            colorScheme="blue" 
                                            isLoading={isLoading}
                                            loadingText={isEditing ? 'Updating...' : 'Saving...'}
                                            leftIcon={isEditing ? <EditIcon /> : <CheckIcon />}
                                            size="md"
                                            px={6}
                                        >
                                            {isEditing ? 'Update Query' : 'Save Query'}
                                        </Button>
                                    </HStack>
                                </GridItem>
                            </Grid>
                        </CardBody>
                    </Card>
                </Collapse>

                {/* Search Section */}
                <Card borderRadius="xl" boxShadow="sm">
                    <CardBody>
                        <FormControl>
                            <HStack spacing={4}>
                                <InputGroup flex={1}>
                                    <InputLeftElement pointerEvents="none">
                                        <Icon as={FiFilter} color={mutedColor} />
                                    </InputLeftElement>
                                    <Input
                                        type="text"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        placeholder="Search queries by title, description, collection, or connection..."
                                        size="lg"
                                        borderRadius="lg"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                fetchQueries();
                                                fetchFavoriteQueries();
                                            }
                                        }}
                                    />
                                </InputGroup>
                                <Button 
                                    onClick={() => { 
                                        fetchQueries(); 
                                        fetchFavoriteQueries(); 
                                    }} 
                                    leftIcon={<SearchIcon />} 
                                    colorScheme="blue"
                                    size="lg"
                                    px={8}
                                >
                                    Search
                                </Button>
                            </HStack>
                        </FormControl>
                    </CardBody>
                </Card>

                {/* Queries Tabs */}
                <Tabs variant="enclosed" colorScheme="blue">
                    <TabList bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg lg 0 0">
                        <Tab 
                            _selected={{ 
                                color: accentColor, 
                                bg: cardBg,
                                borderColor: borderColor,
                                borderBottom: 'none'
                            }}
                        >
                            <HStack spacing={2}>
                                <Icon as={FiDatabase} />
                                <Text>All Queries</Text>
                                <Badge colorScheme="gray" borderRadius="full">
                                    {queries.length}
                                </Badge>
                            </HStack>
                        </Tab>
                        <Tab 
                            _selected={{ 
                                color: warningColor, 
                                bg: cardBg,
                                borderColor: borderColor,
                                borderBottom: 'none'
                            }}
                        >
                            <HStack spacing={2}>
                                <Icon as={FiStar} />
                                <Text>Favorites</Text>
                                <Badge colorScheme="yellow" borderRadius="full">
                                    {favoriteQueries.length}
                                </Badge>
                            </HStack>
                        </Tab>
                    </TabList>

                <TabPanels>
                    <TabPanel>
                        <QueryTable
                            queries={queries}
                            isLoading={isLoading}
                            handleEditQuery={(query) => {
                                setIsEditing(true);
                                setCurrentQuery(query);
                                fetchCollections(query.connectionId);
                            }}
                            handleExecuteQuery={handleExecuteQuery}
                            handleDeleteQuery={handleDeleteQuery}
                            handleFavourite={handleFavourite}
                            handleFetchSchema={handleFetchSchema}
                        />
                    </TabPanel>
                    <TabPanel>
                        <QueryTable
                            queries={favoriteQueries}
                            isLoading={isLoading}
                            handleEditQuery={(query) => {
                                setIsEditing(true);
                                setCurrentQuery(query);
                                fetchCollections(query.connectionId);
                            }}
                            handleExecuteQuery={handleExecuteQuery}
                            handleDeleteQuery={handleDeleteQuery}
                            handleFavourite={handleFavourite}
                            handleFetchSchema={handleFetchSchema}
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <Modal isOpen={isSchemaModalOpen} onClose={onCloseSchemaModal} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Schema Viewer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {schemaData && (
                            <ReactJson
                                src={schemaData}
                                theme="rjv-default"
                                collapsed={1}
                                collapseStringsAfterLength={50}
                                enableClipboard={customCopyHandler}
                                displayDataTypes={false}
                                displayObjectSize={false}
                            />
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onCloseSchemaModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isAIGeneratorOpen} onClose={onCloseAIGenerator} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>AI Query Generator</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <AIQueryGenerator onClose={handleAIGeneratorClose} isDialog={true} />
                    </ModalBody>
                </ModalContent>
            </Modal>

                {/* Query Result Modal */}
                <Modal isOpen={isResultModalOpen} onClose={onCloseResultModal} size="full">
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent borderRadius="xl" m={4}>
                        <ModalHeader borderBottom="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Icon as={CheckIcon} color={successColor} boxSize={5} />
                                <Text>Query Results</Text>
                                {selectedQuery && (
                                    <Badge colorScheme="blue" fontSize="sm">
                                        {selectedQuery.title}
                                    </Badge>
                                )}
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <Box 
                                bg={useColorModeValue('gray.50', 'gray.900')}
                                p={4}
                                borderRadius="lg"
                                maxH="70vh"
                                overflowY="auto"
                            >
                                {queryResult ? (
                                    <ReactJson
                                        src={queryResult}
                                        theme={useColorModeValue('rjv-default', 'monokai')}
                                        collapsed={1}
                                        collapseStringsAfterLength={50}
                                        enableClipboard={(copy) => {
                                            let copyText = JSON.stringify(copy.src, null, 2);
                                            navigator.clipboard.writeText(copyText);
                                            toast({
                                                title: 'Copied to clipboard',
                                                status: 'success',
                                                duration: 2000,
                                                isClosable: true,
                                                position: 'top-right'
                                            });
                                            return true;
                                        }}
                                        displayDataTypes={false}
                                        displayObjectSize={true}
                                        style={{
                                            fontSize: '14px',
                                            fontFamily: 'Monaco, monospace'
                                        }}
                                    />
                                ) : (
                                    <Center>
                                        <Spinner size="xl" color={accentColor} />
                                    </Center>
                                )}
                            </Box>
                        </ModalBody>
                        <ModalFooter borderTop="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Button 
                                    leftIcon={<Icon as={FiCopy} />}
                                    variant="ghost"
                                    onClick={() => {
                                        if (queryResult) {
                                            navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2));
                                            toast({
                                                title: 'Results copied to clipboard',
                                                status: 'success',
                                                duration: 2000,
                                                isClosable: true,
                                                position: 'top-right'
                                            });
                                        }
                                    }}
                                >
                                    Copy All
                                </Button>
                                <Button 
                                    leftIcon={<DownloadIcon />}
                                    variant="ghost"
                                    onClick={() => handleExecuteQuery(selectedQuery, true)}
                                >
                                    Download JSON
                                </Button>
                                <Button colorScheme="blue" onClick={onCloseResultModal}>
                                    Close
                                </Button>
                            </HStack>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    isOpen={isDeleteDialogOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    motionPreset="slideInBottom"
                >
                    <AlertDialogOverlay backdropFilter="blur(5px)">
                        <AlertDialogContent borderRadius="xl">
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                <HStack spacing={3}>
                                    <Icon as={WarningIcon} color={warningColor} boxSize={5} />
                                    <Text>Delete Query</Text>
                                </HStack>
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                <VStack align="start" spacing={3}>
                                    <Text>
                                        Are you sure you want to delete this query?
                                    </Text>
                                    <Box
                                        p={3}
                                        bg={useColorModeValue('red.50', 'red.900')}
                                        borderRadius="md"
                                        borderLeft="4px"
                                        borderColor={errorColor}
                                    >
                                        <Text fontSize="sm" fontWeight="medium" color={errorColor}>
                                            This action cannot be undone
                                        </Text>
                                    </Box>
                                </VStack>
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button 
                                    ref={cancelRef} 
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    colorScheme="red" 
                                    onClick={confirmDelete} 
                                    ml={3}
                                    leftIcon={<DeleteIcon />}
                                >
                                    Delete Query
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </VStack>
        </Fade>
    );
};

const QueryTable = ({ queries, isLoading, handleEditQuery, handleExecuteQuery, handleDeleteQuery, handleFavourite, handleFetchSchema }) => {
    const tableBg = useColorModeValue('white', 'gray.700');
    const tableHoverBg = useColorModeValue('gray.50', 'gray.600');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const accentColor = useColorModeValue('blue.500', 'blue.400');

    return (
        <Card borderRadius="xl" boxShadow="md" overflow="hidden">
            <CardBody p={0}>
                {isLoading ? (
                    <Center py={10}>
                        <VStack spacing={4}>
                            <Spinner size="xl" color={accentColor} thickness="4px" />
                            <Text color={mutedColor}>Loading queries...</Text>
                        </VStack>
                    </Center>
                ) : queries.length > 0 ? (
                    <Box overflowX="auto">
                        <Table variant="simple" size="md">
                            <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                                <Tr>
                                    <Th>Query Details</Th>
                                    <Th>Database</Th>
                                    <Th>Statistics</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {queries.map((query) => (
                                    <Tr 
                                        key={query.id}
                                        _hover={{ bg: tableHoverBg }}
                                        transition="background 0.2s"
                                    >
                                        <Td>
                                            <VStack align="start" spacing={1}>
                                                <HStack spacing={2}>
                                                    <Text fontWeight="semibold">{query.title}</Text>
                                                    {query.isFavourite && (
                                                        <Icon as={FiStar} color="yellow.400" boxSize={4} />
                                                    )}
                                                </HStack>
                                                <Text fontSize="sm" color={mutedColor} noOfLines={1}>
                                                    {query.description}
                                                </Text>
                                            </VStack>
                                        </Td>
                                        <Td>
                                            <VStack align="start" spacing={1}>
                                                <HStack spacing={1}>
                                                    <Icon as={FiDatabase} color={accentColor} boxSize={3} />
                                                    <Text fontSize="sm">{query.connection?.name}</Text>
                                                </HStack>
                                                <HStack spacing={1}>
                                                    <Icon as={FiFolder} color={mutedColor} boxSize={3} />
                                                    <Text fontSize="sm" color={mutedColor}>
                                                        {query.collectionName}
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                        </Td>
                                        <Td>
                                            <VStack align="start" spacing={1}>
                                                <HStack spacing={2}>
                                                    <Tag size="sm" variant="subtle" colorScheme="blue">
                                                        <TagLeftIcon as={FiPlay} />
                                                        <TagLabel>{query.runCount || 0} runs</TagLabel>
                                                    </Tag>
                                                </HStack>
                                                {query.lastRun && (
                                                    <HStack spacing={1}>
                                                        <Icon as={FiClock} boxSize={3} color={mutedColor} />
                                                        <Text fontSize="xs" color={mutedColor}>
                                                            {new Date(query.lastRun).toLocaleDateString()}
                                                        </Text>
                                                    </HStack>
                                                )}
                                            </VStack>
                                        </Td>
                                        <Td>
                                            <HStack spacing={1} wrap="wrap">
                                                <Menu>
                                                    <MenuButton
                                                        as={IconButton}
                                                        icon={<FiPlay />}
                                                        size="sm"
                                                        variant="solid"
                                                        colorScheme="green"
                                                        aria-label="Execute options"
                                                    />
                                                    <MenuList>
                                                        <MenuItem 
                                                            icon={<CheckIcon />} 
                                                            onClick={() => handleExecuteQuery(query)}
                                                        >
                                                            Execute Query
                                                        </MenuItem>
                                                        <MenuItem 
                                                            icon={<DownloadIcon />} 
                                                            onClick={() => handleExecuteQuery(query, true)}
                                                        >
                                                            Download Results
                                                        </MenuItem>
                                                        <MenuDivider />
                                                        <MenuItem 
                                                            icon={<ViewIcon />} 
                                                            onClick={() => handleFetchSchema(query.connectionId, query.collectionName)}
                                                        >
                                                            View Schema
                                                        </MenuItem>
                                                    </MenuList>
                                                </Menu>

                                                <Tooltip label="Edit query">
                                                    <IconButton
                                                        icon={<EditIcon />}
                                                        onClick={() => handleEditQuery(query)}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme="blue"
                                                        aria-label="Edit"
                                                    />
                                                </Tooltip>

                                                <Tooltip label={query.isFavourite ? "Remove from favorites" : "Add to favorites"}>
                                                    <IconButton
                                                        icon={<StarIcon />}
                                                        onClick={() => handleFavourite(query)}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme={query.isFavourite ? "yellow" : "gray"}
                                                        aria-label="Favourite"
                                                    />
                                                </Tooltip>

                                                <Tooltip label="Delete query">
                                                    <IconButton
                                                        icon={<DeleteIcon />}
                                                        onClick={() => handleDeleteQuery(query.id)}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        aria-label="Delete"
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                ) : (
                    <Center py={10}>
                        <VStack spacing={4}>
                            <Icon as={FiDatabase} boxSize={12} color={mutedColor} />
                            <VStack spacing={2}>
                                <Heading size="md">No Queries Yet</Heading>
                                <Text color={mutedColor} textAlign="center">
                                    Create your first query to get started with data exploration
                                </Text>
                            </VStack>
                        </VStack>
                    </Center>
                )}
            </CardBody>
        </Card>
    );
};

export default QueryManager;
