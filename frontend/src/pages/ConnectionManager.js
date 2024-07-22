import { CheckIcon, CloseIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
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
    HStack,
    Heading,
    Input,
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
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import ReactJson from 'react-json-view';

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

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
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
            handleSuccess('Connection test successful', 'The connection is working correctly.');
        } catch (error) {
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

    return (
        <VStack spacing={8} align="stretch">
            <Heading as="h1" size="lg">Connection Manager</Heading>

            <Box as="form" onSubmit={handleSubmit} bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                <VStack spacing={4}>
                    <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                            name="name"
                            value={editingConnection ? editingConnection.name : newConnection.name}
                            onChange={handleInputChange}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Connection String</FormLabel>
                        <Input
                            name="connectionString"
                            value={editingConnection ? editingConnection.connectionString : newConnection.connectionString}
                            onChange={handleInputChange}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Database Name</FormLabel>
                        <Input
                            name="databaseName"
                            value={editingConnection ? editingConnection.databaseName : newConnection.databaseName}
                            onChange={handleInputChange}
                        />
                    </FormControl>
                    <HStack>
                        <Button type="submit" colorScheme="blue" isLoading={isLoading} leftIcon={editingConnection ? <EditIcon /> : <CheckIcon />}>
                            {editingConnection ? 'Update Connection' : 'Add Connection'}
                        </Button>
                        {editingConnection && (
                            <Button onClick={handleCancelEdit} colorScheme="gray" leftIcon={<CloseIcon />}>
                                Cancel Edit
                            </Button>
                        )}
                    </HStack>
                </VStack>
            </Box>

            {isLoading ? (
                <Spinner size="xl" alignSelf="center" />
            ) : connections.length > 0 ? (
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Database Name</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {connections.map((conn) => (
                            <Tr key={conn.id}>
                                <Td>{conn.name}</Td>
                                <Td>{conn.databaseName}</Td>
                                <Td>
                                    <HStack spacing={2}>
                                        <Button onClick={() => handleEdit(conn)} size="sm" colorScheme="yellow" leftIcon={<EditIcon />}>
                                            Edit
                                        </Button>
                                        <Button onClick={() => handleTestConnection(conn)} size="sm" colorScheme="green" leftIcon={<CheckIcon />}>
                                            Test
                                        </Button>
                                        <Button onClick={() => handleFetchSchema(conn.id)} size="sm" colorScheme="blue" leftIcon={<ViewIcon />}>
                                            View Schema
                                        </Button>
                                        <Button onClick={() => confirmDelete(conn.id)} size="sm" colorScheme="red" leftIcon={<DeleteIcon />}>
                                            Delete
                                        </Button>
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            ) : (
                <Text>No connections available. Add a new connection to get started.</Text>
            )}

            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsAlertOpen(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Confirm Delete
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to delete this connection? This action cannot be undone.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsAlertOpen(false)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={() => handleDelete(connectionIdToDelete)} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Modal isOpen={isTestModalOpen} onClose={onCloseTestModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Testing Connection</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>Testing connection to {testingConnection && testingConnection.name}...</Text>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isSchemaModalOpen} onClose={onCloseSchemaModal} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Schema</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {schema && (
                            <ReactJson
                                src={schema}
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
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onCloseSchemaModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </VStack>
    );
};

export default ConnectionManager;
