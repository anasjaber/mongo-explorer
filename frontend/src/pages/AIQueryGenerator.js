import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { FaMagic, FaWpforms } from 'react-icons/fa';
import ReactJson from 'react-json-view';
import api from './api';

const AIQueryGenerator = ({ onClose, isDialog }) => {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState(null);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchCollections(selectedConnection.value);
    }
  }, [selectedConnection]);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/MongoConnection`);
      setConnections(Array.isArray(response.data) ? response.data : response.data.items || []);
    } catch (error) {
      handleError('Error fetching connections', error);
    }
    setIsLoading(false);
  };

  const fetchCollections = async (connectionId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/MongoConnection/${connectionId}/collections`);
      setCollections(response.data || []);
    } catch (error) {
      handleError('Error fetching collections', error);
    }
    setIsLoading(false);
  };

  const fetchSchema = async () => {
    if (selectedCollections.length === 0) {
      toast({
        title: 'No collections selected',
        description: 'Please select at least one collection to view the schema.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const includedCollections = selectedCollections.map(collection => `includedCollections=${collection.value}`).join('&');
      const response = await api.get(`/MongoSchema/${selectedConnection.value}?${includedCollections}`);
      setSchema(JSON.parse(response.data.formattedSchema));
      onOpen();
    } catch (error) {
      handleError('Error fetching schema', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConnection) {
      toast({
        title: 'Connection required',
        description: 'Please select a connection before generating a query.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/AIQueryGenerator/generate`, {
        connectionId: selectedConnection.value,
        collectionNames: selectedCollections.map(collection => collection.value),
        naturalLanguageQuery
      });

      setGeneratedQuery(response.data);

      toast({
        title: 'Query generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      handleError('Error generating query', error);
    }
    setIsLoading(false);
  };

  const handleGenerateClick = () => {
    if (generatedQuery) {
      onClose(generatedQuery);
    }
  };

  const handleError = (title, error) => {
    console.error(title, error);
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
      {!isDialog && (
        <Heading as="h1" size="lg">AI Query Generator</Heading>
      )}

      <Box as="form" onSubmit={handleSubmit} bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Connection</FormLabel>
            <Select
              value={selectedConnection}
              onChange={(option) => setSelectedConnection(option)}
              isDisabled={isLoading}
              options={connections.map(conn => ({ value: conn.id, label: conn.name }))}
              placeholder="Select a connection"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Collections</FormLabel>
            <HStack>
              <Select
                isMulti
                value={selectedCollections}
                onChange={(options) => setSelectedCollections(options)}
                isDisabled={isLoading}
                options={collections.map(collection => ({ value: collection, label: collection }))}
                placeholder="Select collections"
              />
              <Button onClick={fetchSchema} colorScheme="blue" isLoading={isLoading}>View Schema</Button>
            </HStack>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Natural Language Query</FormLabel>
            <Textarea
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              placeholder="Describe your query in natural language"
              isDisabled={isLoading}
            />
          </FormControl>
          <HStack spacing={4}>
            <Button
              colorScheme="blue"
              isLoading={isLoading}
              leftIcon={<FaMagic />}
              type="submit"
            >
              Generate Query
            </Button>
            {isDialog && (
              <Button onClick={handleGenerateClick} colorScheme="orange" leftIcon={<FaWpforms />}>
                Get Query
              </Button>
            )}
          </HStack>
        </VStack>
      </Box>

      {generatedQuery && (
        <Box p={4}>
          <Heading size="md" mb={4}>Generated Query</Heading>
          <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <Box p={4} borderRadius="md" whiteSpace="pre-wrap" overflow="auto">
              {typeof generatedQuery === 'object' ? (
                <ReactJson
                  src={generatedQuery}
                  theme="rjv-default"
                  collapseStringsAfterLength={100}
                  style={{ padding: "20px", backgroundColor: "#fff" }}
                  displayDataTypes={false}
                  displayObjectSize={false}
                  collapsed={false}
                  enableClipboard={(copy) => {
                    let copyText = JSON.stringify(copy.src, null, 2);
                    navigator.clipboard.writeText(copyText);
                    return true;
                  }}
                />
              ) : (
                <Text as="pre">{JSON.stringify(generatedQuery, null, 2)}</Text>
              )}
            </Box>
          </Box>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onModalClose} size="xl">
        <ModalOverlay />
        <ModalContent maxWidth="80%">
          <ModalHeader>Schema Viewer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {schema ? (
              <ReactJson
                src={schema}
                theme="rjv-default"
                collapseStringsAfterLength={100}
                style={{ padding: "20px", backgroundColor: "#fff" }}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={customCopyHandler}
                collapsed={false}
              />
            ) : (
              <Spinner size="xl" />
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {!Array.isArray(connections) && (
        <Text color="red.500">
          Error: Connections data is not in the expected format. Please try refreshing the page.
        </Text>
      )}
    </VStack>
  );
};

AIQueryGenerator.propTypes = {
  onClose: PropTypes.func.isRequired,
  isDialog: PropTypes.bool
};

export default AIQueryGenerator;
