import { AddIcon, CheckIcon, CloseIcon, DeleteIcon, DownloadIcon, EditIcon, SearchIcon, StarIcon, ViewIcon } from '@chakra-ui/icons';
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
} from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { lazy, default as React, useCallback, useEffect, useState } from 'react';
import { FaMagic } from 'react-icons/fa';
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
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

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
        <VStack spacing={8} align="stretch">
            <Heading as="h1" size="lg">{isEditing ? 'Edit Query' : 'Add New Query'}</Heading>

            <Box as="form" onSubmit={handleSubmit} bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                <VStack spacing={4}>
                    <FormControl isRequired>
                        <FormLabel>Title</FormLabel>
                        <Input name="title" value={currentQuery.title} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Description</FormLabel>
                        <Input name="description" value={currentQuery.description} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Connection</FormLabel>
                        <Select
                            value={currentQuery.connectionId ? { value: currentQuery.connectionId, label: connections.find(conn => conn.id === currentQuery.connectionId)?.name || '' } : null}
                            onChange={handleConnectionChange}
                            options={connections.map(conn => ({ value: conn.id, label: conn.name }))}
                            placeholder="Select a connection"
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Collection</FormLabel>
                        <Select
                            value={currentQuery.collectionName ? { value: currentQuery.collectionName, label: currentQuery.collectionName } : null}
                            onChange={handleCollectionChange}
                            options={collections.map(coll => ({ value: coll, label: coll }))}
                            placeholder="Select a collection"
                            isDisabled={!currentQuery.connectionId}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Query Text</FormLabel>
                        <Textarea name="queryText" value={currentQuery.queryText} onChange={handleInputChange} h="50vh" />
                    </FormControl>
                    <HStack spacing={4}>
                        <Button type="submit" colorScheme="blue" isLoading={isLoading} leftIcon={isEditing ? <EditIcon /> : <AddIcon />}>
                            {isEditing ? 'Update Query' : 'Add Query'}
                        </Button>
                        {isEditing && (
                            <Button onClick={resetForm} colorScheme="gray" leftIcon={<CloseIcon />}>
                                Cancel Edit
                            </Button>
                        )}
                        <Button onClick={onOpenAIGenerator} colorScheme="blue" leftIcon={<FaMagic />}>
                            Generate with AI
                        </Button>
                    </HStack>
                </VStack>
            </Box>

            <FormControl>
                <FormLabel>Filter Queries</FormLabel>
                <HStack spacing={4}>
                    <Input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter by Title, Description, Collection, or Connection"
                    />
                    <Button onClick={() => { fetchQueries(); fetchFavoriteQueries(); }} leftIcon={<SearchIcon />} colorScheme="blue">Search</Button>
                </HStack>
            </FormControl>

            <Tabs>
                <TabList>
                    <Tab>All Queries</Tab>
                    <Tab>Favourites</Tab>
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

            <Modal isOpen={isResultModalOpen} onClose={onCloseResultModal} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Query Result</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {queryResult ? (
                            <ReactJson
                                src={queryResult}
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
                        ) : (
                            <Spinner size="xl" />
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onCloseResultModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <AlertDialog
                isOpen={isDeleteDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteDialogOpen(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Query
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to delete this query? This action cannot be undone.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </VStack>
    );
};

const QueryTable = ({ queries, isLoading, handleEditQuery, handleExecuteQuery, handleDeleteQuery, handleFavourite, handleFetchSchema }) => {
    return (
        <Box overflowX="auto">
            {isLoading ? (
                <Spinner size="xl" />
            ) : queries.length > 0 ? (
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Title</Th>
                            <Th>Description</Th>
                            <Th>Collection</Th>
                            <Th>Connection</Th>
                            <Th>Last Run</Th>
                            <Th>Run Count</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {queries.map((query) => (
                            <Tr key={query.id}>
                                <Td>{query.title}</Td>
                                <Td>{query.description}</Td>
                                <Td>{query.collectionName}</Td>
                                <Td>{query.connection?.name}</Td>
                                <Td>{query.lastRun ? new Date(query.lastRun).toLocaleString() : 'Never'}</Td>
                                <Td>{query.runCount}</Td>
                                <Td>
                                    <HStack spacing={2}>
                                        <Tooltip label="Edit">
                                            <IconButton
                                                icon={<EditIcon />}
                                                onClick={() => handleEditQuery(query)}
                                                size="sm"
                                                colorScheme="yellow"
                                                aria-label="Edit"
                                            />
                                        </Tooltip>
                                        <Tooltip label="Execute">
                                            <IconButton
                                                icon={<CheckIcon />}
                                                onClick={() => handleExecuteQuery(query)}
                                                size="sm"
                                                colorScheme="green"
                                                aria-label="Execute"
                                            />
                                        </Tooltip>
                                        <Tooltip label="Delete">
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                onClick={() => handleDeleteQuery(query.id)}
                                                size="sm"
                                                colorScheme="red"
                                                aria-label="Delete"
                                            />
                                        </Tooltip>
                                        <Tooltip label="Download JSON">
                                            <IconButton
                                                icon={<DownloadIcon />}
                                                onClick={() => handleExecuteQuery(query, true)}
                                                size="sm"
                                                colorScheme="blue"
                                                aria-label="Download JSON"
                                            />
                                        </Tooltip>
                                        <Tooltip label={query.isFavourite ? "Remove from Favourites" : "Add to Favourites"}>
                                            <IconButton
                                                icon={<StarIcon />}
                                                onClick={() => handleFavourite(query)}
                                                size="sm"
                                                colorScheme={query.isFavourite ? "yellow" : "gray"}
                                                aria-label="Favourite"
                                            />
                                        </Tooltip>
                                        <Tooltip label="View Schema">
                                            <IconButton
                                                icon={<ViewIcon />}
                                                onClick={() => handleFetchSchema(query.connectionId, query.collectionName)}
                                                size="sm"
                                                colorScheme="blue"
                                                aria-label="View Schema"
                                            />
                                        </Tooltip>
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            ) : (
                <Alert status="info">
                    <AlertIcon />
                    No queries available. Add a new query to get started.
                </Alert>
            )}
        </Box>
    );
};

export default QueryManager;
