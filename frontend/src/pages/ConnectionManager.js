import { 
    AddIcon,
    CheckIcon, 
    CloseIcon, 
    DeleteIcon, 
    EditIcon, 
    ViewIcon,
    LinkIcon,
    InfoOutlineIcon,
    WarningIcon,
    RepeatIcon
} from '@chakra-ui/icons';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
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
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
    useColorModeValue,
    useDisclosure,
    useToast,
    Badge,
    Card,
    CardBody,
    CardHeader,
    IconButton,
    Tooltip,
    Divider,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Icon,
    Flex,
    Center,
    Grid,
    GridItem,
    Container,
    Stack,
    Fade,
    ScaleFade,
    useBreakpointValue,
    Collapse,
    InputRightElement,
    Progress
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import { FiDatabase, FiServer, FiLink, FiActivity, FiLock, FiUnlock, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';

import api from './api';


const ConnectionManager = () => {
    const [connections, setConnections] = useState([]);
    const [newConnection, setNewConnection] = useState({ name: '', connectionString: '', databaseName: '' });
    const [editingConnection, setEditingConnection] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(null);
    const [schema, setSchema] = useState(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [connectionIdToDelete, setConnectionIdToDelete] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [testResults, setTestResults] = useState({});
    const [isFormExpanded, setIsFormExpanded] = useState(false);

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
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { isOpen: isSchemaModalOpen, onOpen: onOpenSchemaModal, onClose: onCloseSchemaModal } = useDisclosure();
    const { isOpen: isTestModalOpen, onOpen: onOpenTestModal, onClose: onCloseTestModal } = useDisclosure();
    const cancelRef = React.useRef();

    const fetchConnections = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/MongoConnection`);
            setConnections(Array.isArray(response.data) ? response.data : response.data.items || []);
        } catch (error) {
            handleError('Error fetching connections', error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingConnection) {
            setEditingConnection({ ...editingConnection, [name]: value });
        } else {
            setNewConnection({ ...newConnection, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingConnection) {
                await api.put(`/MongoConnection/${editingConnection.id}`, editingConnection);
                handleSuccess('Connection updated', 'The connection has been updated successfully.');
                setEditingConnection(null);
            } else {
                await api.post(`/MongoConnection`, newConnection);
                handleSuccess('Connection added', 'New connection has been added successfully.');
                setNewConnection({ name: '', connectionString: '', databaseName: '' });
            }
            fetchConnections();
        } catch (error) {
            handleError(editingConnection ? 'Error updating connection' : 'Error adding connection', error);
        }
        setIsLoading(false);
    };

    const handleEdit = (connection) => {
        setEditingConnection(connection);
        setNewConnection({ name: '', connectionString: '', databaseName: '' });
    };

    const handleCancelEdit = () => {
        setEditingConnection(null);
        setNewConnection({ name: '', connectionString: '', databaseName: '' });
    };

    const handleDelete = async (id) => {
        setIsLoading(true);
        try {
            await api.delete(`/MongoConnection/${id}`);
            handleSuccess('Connection deleted', 'The connection has been removed.');
            fetchConnections();
        } catch (error) {
            handleError('Error deleting connection', error);
        }
        setIsLoading(false);
        setIsAlertOpen(false);
    };

    const confirmDelete = (id) => {
        setConnectionIdToDelete(id);
        setIsAlertOpen(true);
    };

    const handleTestConnection = async (connection) => {
        setTestingConnection(connection);
        onOpenTestModal();
        try {
            await api.post(`/MongoConnection/test`, connection);
            setTestResults(prev => ({ ...prev, [connection.id]: 'success' }));
            handleSuccess('Connection test successful', 'The connection is working correctly.');
        } catch (error) {
            setTestResults(prev => ({ ...prev, [connection.id]: 'error' }));
            handleError('Connection test failed', error);
        } finally {
            setTestingConnection(null);
            onCloseTestModal();
        }
    };

    const handleFetchSchema = async (connectionId) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/MongoSchema/${connectionId}`);
            setSchema(JSON.parse(response.data.formattedSchema));
            onOpenSchemaModal();
        } catch (error) {
            handleError('Error fetching schema', error);
        }
        setIsLoading(false);
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
                                Connection Manager
                            </Heading>
                            <Text fontSize="sm" color={mutedColor}>
                                Manage your MongoDB database connections
                            </Text>
                        </VStack>
                        <HStack>
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
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiDatabase} />
                                        <Text>Total Connections</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={accentColor}>
                                    {connections.length}
                                </StatNumber>
                                <StatHelpText>
                                    {connections.length > 0 ? 'Active databases' : 'No connections yet'}
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiActivity} />
                                        <Text>Connection Status</Text>
                                    </HStack>
                                </StatLabel>
                                <StatNumber fontSize="2xl" color={successColor}>
                                    {Object.values(testResults).filter(r => r === 'success').length}
                                </StatNumber>
                                <StatHelpText>Successfully tested</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    
                    <Card variant="outline" size="sm">
                        <CardBody>
                            <Stat>
                                <StatLabel color={mutedColor}>
                                    <HStack spacing={2}>
                                        <Icon as={FiServer} />
                                        <Text>Quick Actions</Text>
                                    </HStack>
                                </StatLabel>
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    leftIcon={<AddIcon />}
                                    onClick={() => setIsFormExpanded(true)}
                                    mt={2}
                                    variant="outline"
                                >
                                    Add Connection
                                </Button>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Connection Form */}
                <Collapse in={isFormExpanded || editingConnection !== null} animateOpacity>
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
                                        as={editingConnection ? EditIcon : AddIcon} 
                                        color={accentColor}
                                        boxSize={5}
                                    />
                                    <Heading size="md">
                                        {editingConnection ? 'Edit Connection' : 'Add New Connection'}
                                    </Heading>
                                </HStack>
                                <IconButton
                                    icon={<CloseIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsFormExpanded(false);
                                        handleCancelEdit();
                                    }}
                                    aria-label="Close form"
                                />
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={5}>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium">
                                        Connection Name
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FiDatabase} color={mutedColor} />
                                        </InputLeftElement>
                                        <Input
                                            name="name"
                                            value={editingConnection ? editingConnection.name : newConnection.name}
                                            onChange={handleInputChange}
                                            placeholder="My MongoDB Database"
                                            size="lg"
                                            borderRadius="lg"
                                            focusBorderColor={accentColor}
                                        />
                                    </InputGroup>
                                    <FormHelperText fontSize="xs">
                                        A friendly name to identify this connection
                                    </FormHelperText>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium">
                                        Connection String
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FiLink} color={mutedColor} />
                                        </InputLeftElement>
                                        <Input
                                            name="connectionString"
                                            type={showPassword ? "text" : "password"}
                                            value={editingConnection ? editingConnection.connectionString : newConnection.connectionString}
                                            onChange={handleInputChange}
                                            placeholder="mongodb://localhost:27017"
                                            size="lg"
                                            borderRadius="lg"
                                            focusBorderColor={accentColor}
                                            pr="4.5rem"
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button 
                                                h="1.75rem" 
                                                size="sm" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                variant="ghost"
                                            >
                                                <Icon as={showPassword ? FiEyeOff : FiEye} />
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                    <FormHelperText fontSize="xs">
                                        MongoDB connection URI including authentication
                                    </FormHelperText>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium">
                                        Database Name
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FiServer} color={mutedColor} />
                                        </InputLeftElement>
                                        <Input
                                            name="databaseName"
                                            value={editingConnection ? editingConnection.databaseName : newConnection.databaseName}
                                            onChange={handleInputChange}
                                            placeholder="myDatabase"
                                            size="lg"
                                            borderRadius="lg"
                                            focusBorderColor={accentColor}
                                        />
                                    </InputGroup>
                                    <FormHelperText fontSize="xs">
                                        The specific database to connect to
                                    </FormHelperText>
                                </FormControl>

                                <Divider />

                                <HStack w="full" justify="flex-end" spacing={3}>
                                    {editingConnection && (
                                        <Button 
                                            onClick={handleCancelEdit} 
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
                                        loadingText={editingConnection ? 'Updating...' : 'Adding...'}
                                        leftIcon={editingConnection ? <EditIcon /> : <AddIcon />}
                                        size="md"
                                        px={6}
                                    >
                                        {editingConnection ? 'Update Connection' : 'Add Connection'}
                                    </Button>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </Collapse>

                {/* Connections List */}
                {isLoading ? (
                    <Center py={10}>
                        <VStack spacing={4}>
                            <Spinner size="xl" color={accentColor} thickness="4px" />
                            <Text color={mutedColor}>Loading connections...</Text>
                        </VStack>
                    </Center>
                ) : connections.length > 0 ? (
                    <Card borderRadius="xl" overflow="hidden" boxShadow="md">
                        <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
                            <HStack justify="space-between">
                                <Heading size="md">Your Connections</Heading>
                                <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                                    {connections.length} {connections.length === 1 ? 'Connection' : 'Connections'}
                                </Badge>
                            </HStack>
                        </CardHeader>
                        <CardBody p={0}>
                            <Box overflowX="auto">
                                <Table variant="simple" size={isMobile ? 'sm' : 'md'}>
                                    <Thead bg={tableBg}>
                                        <Tr>
                                            <Th>Status</Th>
                                            <Th>Name</Th>
                                            <Th>Database</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {connections.map((conn) => (
                                            <Tr 
                                                key={conn.id}
                                                _hover={{ bg: tableHoverBg }}
                                                transition="background 0.2s"
                                            >
                                                <Td>
                                                    <Tooltip 
                                                        label={
                                                            testResults[conn.id] === 'success' 
                                                                ? 'Connection tested successfully'
                                                                : testResults[conn.id] === 'error'
                                                                ? 'Connection test failed'
                                                                : 'Not tested yet'
                                                        }
                                                    >
                                                        <Badge
                                                            colorScheme={
                                                                testResults[conn.id] === 'success' 
                                                                    ? 'green'
                                                                    : testResults[conn.id] === 'error'
                                                                    ? 'red'
                                                                    : 'gray'
                                                            }
                                                            variant="subtle"
                                                            fontSize="xs"
                                                        >
                                                            <Icon 
                                                                as={
                                                                    testResults[conn.id] === 'success'
                                                                        ? FiUnlock
                                                                        : testResults[conn.id] === 'error'
                                                                        ? FiLock
                                                                        : FiActivity
                                                                }
                                                                mr={1}
                                                            />
                                                            {
                                                                testResults[conn.id] === 'success'
                                                                    ? 'Active'
                                                                    : testResults[conn.id] === 'error'
                                                                    ? 'Error'
                                                                    : 'Unknown'
                                                            }
                                                        </Badge>
                                                    </Tooltip>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Icon as={FiDatabase} color={accentColor} />
                                                        <Text fontWeight="medium">{conn.name}</Text>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <Text color={mutedColor} fontSize="sm">
                                                        {conn.databaseName}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2} wrap="wrap">
                                                        <Tooltip label="Edit connection">
                                                            <IconButton
                                                                icon={<EditIcon />}
                                                                onClick={() => {
                                                                    handleEdit(conn);
                                                                    setIsFormExpanded(true);
                                                                }}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="blue"
                                                                aria-label="Edit"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="Test connection">
                                                            <IconButton
                                                                icon={<CheckIcon />}
                                                                onClick={() => handleTestConnection(conn)}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="green"
                                                                aria-label="Test"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="View schema">
                                                            <IconButton
                                                                icon={<ViewIcon />}
                                                                onClick={() => handleFetchSchema(conn.id)}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="purple"
                                                                aria-label="Schema"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="Delete connection">
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                onClick={() => confirmDelete(conn.id)}
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
                        </CardBody>
                    </Card>
                ) : (
                    <Card borderRadius="xl" boxShadow="md">
                        <CardBody>
                            <Center py={10}>
                                <VStack spacing={4}>
                                    <Icon as={FiDatabase} boxSize={12} color={mutedColor} />
                                    <VStack spacing={2}>
                                        <Heading size="md" color={textColor}>
                                            No Connections Yet
                                        </Heading>
                                        <Text color={mutedColor} textAlign="center">
                                            Add your first MongoDB connection to get started
                                        </Text>
                                    </VStack>
                                    <Button
                                        colorScheme="blue"
                                        leftIcon={<AddIcon />}
                                        onClick={() => setIsFormExpanded(true)}
                                        size="lg"
                                    >
                                        Add Your First Connection
                                    </Button>
                                </VStack>
                            </Center>
                        </CardBody>
                    </Card>
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    isOpen={isAlertOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={() => setIsAlertOpen(false)}
                    motionPreset="slideInBottom"
                >
                    <AlertDialogOverlay backdropFilter="blur(5px)">
                        <AlertDialogContent borderRadius="xl">
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                <HStack spacing={3}>
                                    <Icon as={WarningIcon} color={warningColor} boxSize={5} />
                                    <Text>Confirm Delete</Text>
                                </HStack>
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                <VStack align="start" spacing={3}>
                                    <Text>
                                        Are you sure you want to delete this connection?
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
                                    onClick={() => setIsAlertOpen(false)}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    colorScheme="red" 
                                    onClick={() => handleDelete(connectionIdToDelete)} 
                                    ml={3}
                                    leftIcon={<DeleteIcon />}
                                >
                                    Delete Connection
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>

                {/* Test Connection Modal */}
                <Modal isOpen={isTestModalOpen} onClose={onCloseTestModal} isCentered>
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent borderRadius="xl">
                        <ModalHeader>
                            <HStack spacing={3}>
                                <Spinner size="sm" color={accentColor} />
                                <Text>Testing Connection</Text>
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4} align="start">
                                <HStack spacing={3}>
                                    <Icon as={FiActivity} color={accentColor} boxSize={5} />
                                    <Text>
                                        Testing connection to <Text as="span" fontWeight="bold">
                                            {testingConnection && testingConnection.name}
                                        </Text>
                                    </Text>
                                </HStack>
                                <Progress size="xs" isIndeterminate colorScheme="blue" w="full" borderRadius="full" />
                                <Text fontSize="sm" color={mutedColor}>
                                    Establishing connection to database...
                                </Text>
                            </VStack>
                        </ModalBody>
                    </ModalContent>
                </Modal>

                {/* Schema Viewer Modal */}
                <Modal isOpen={isSchemaModalOpen} onClose={onCloseSchemaModal} size="full">
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent borderRadius="xl" m={4}>
                        <ModalHeader borderBottom="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Icon as={ViewIcon} color={accentColor} boxSize={5} />
                                <Text>Database Schema</Text>
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
                                {schema && (
                                    <ReactJson
                                        src={schema}
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
                                )}
                            </Box>
                        </ModalBody>
                        <ModalFooter borderTop="1px" borderColor={borderColor}>
                            <HStack spacing={3}>
                                <Button 
                                    leftIcon={<Icon as={FiCopy} />}
                                    variant="ghost"
                                    onClick={() => {
                                        if (schema) {
                                            navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
                                            toast({
                                                title: 'Schema copied to clipboard',
                                                status: 'success',
                                                duration: 2000,
                                                isClosable: true,
                                            });
                                        }
                                    }}
                                >
                                    Copy Schema
                                </Button>
                                <Button colorScheme="blue" onClick={onCloseSchemaModal}>
                                    Close
                                </Button>
                            </HStack>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Fade>
    );
};

export default ConnectionManager;
