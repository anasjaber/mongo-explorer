import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
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
  useToast,
  Card,
  CardBody,
  CardHeader,
  Icon,
  InputGroup,
  InputLeftElement,
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
  Progress,
  Tooltip,
  IconButton,
  Code,
  Container,
  Grid,
  GridItem,
  useBreakpointValue,
  Flex,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Collapse
} from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { FaMagic, FaWpforms } from 'react-icons/fa';
import { 
  FiDatabase, 
  FiFolder, 
  FiCpu, 
  FiInfo,
  FiEye,
  FiCopy,
  FiCheck,
  FiZap,
  FiCode,
  FiMessageSquare,
  FiLayers,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  ViewIcon, 
  CopyIcon, 
  CheckIcon, 
  InfoOutlineIcon,
  StarIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import ReactJson from 'react-json-view';
import MongoQueryViewer from '../components/MongoQueryViewer';
import api from './api';
const AIQueryGenerator = ({ onClose, isDialog }) => {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [schema, setSchema] = useState(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.400');
  const successColor = useColorModeValue('green.500', 'green.400');
  const warningColor = useColorModeValue('yellow.500', 'yellow.400');
  const codeBg = useColorModeValue('gray.900', 'gray.950');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const isMobile = useBreakpointValue({ base: true, md: false });
  
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
        position: 'top-right',
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
        position: 'top-right',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post(`/AIQueryGenerator/generate`, {
        connectionId: selectedConnection.value,
        collectionNames: selectedCollections.map(collection => collection.value),
        naturalLanguageQuery
      });

      setGeneratedQuery(response.data);

      toast({
        title: 'Query generated successfully',
        description: 'Your MongoDB query has been generated using AI',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      handleError('Error generating query', error);
    }
    setIsGenerating(false);
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
      position: 'top-right',
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Query has been copied to your clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
    setTimeout(() => setCopiedQuery(false), 2000);
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
      position: 'top-right',
    });
    return false; // Prevent default copy behavior
  };

  return (
    <Fade in={true}>
      <VStack spacing={8} align="stretch">
        {!isDialog && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <VStack align="start" spacing={1}>
                <Heading 
                  as="h1" 
                  size="lg"
                  bgGradient="linear(to-r, purple.400, purple.600)"
                  bgClip="text"
                >
                  AI Query Generator
                </Heading>
                <Text fontSize="sm" color={mutedColor}>
                  Generate MongoDB queries using natural language powered by AI
                </Text>
              </VStack>
              {!isDialog && (
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
              )}
            </HStack>
            <Divider />
          </Box>
        )}

        {!isDialog && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card variant="outline" size="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={mutedColor}>
                    <HStack spacing={2}>
                      <Icon as={FiDatabase} />
                      <Text>Connections</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="2xl" color={accentColor}>
                    {connections.length}
                  </StatNumber>
                  <StatHelpText>Available</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card variant="outline" size="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={mutedColor}>
                    <HStack spacing={2}>
                      <Icon as={FiFolder} />
                      <Text>Collections</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="2xl" color={successColor}>
                    {selectedCollections.length}
                  </StatNumber>
                  <StatHelpText>Selected</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card variant="outline" size="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={mutedColor}>
                    <HStack spacing={2}>
                      <Icon as={FiZap} />
                      <Text>AI Model</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="lg" color={warningColor}>
                    GPT-4
                  </StatNumber>
                  <StatHelpText>Active</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        <Card
          as="form"
          onSubmit={handleSubmit}
          bg={cardBg}
          borderRadius="xl"
          boxShadow="md"
          overflow="hidden"
        >
          <CardHeader 
            bg={useColorModeValue('purple.50', 'gray.700')}
            borderBottom="1px"
            borderColor={borderColor}
          >
            <HStack spacing={3}>
              <Icon as={FiCpu} color="purple.500" boxSize={6} />
              <VStack align="start" spacing={0}>
                <Heading size="md">Query Configuration</Heading>
                <Text fontSize="xs" color={mutedColor}>
                  Select your database connection and describe what you want to query
                </Text>
              </VStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={6}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5} w="full">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="medium" display="inline-flex" alignItems="center">
                      <HStack spacing={1}>
                        <Icon as={FiDatabase} color={mutedColor} />
                        <Text>Database Connection</Text>
                      </HStack>
                    </FormLabel>
                    <Select
                      value={selectedConnection}
                      onChange={(option) => setSelectedConnection(option)}
                      isDisabled={isLoading}
                      options={connections.map(conn => ({ value: conn.id, label: conn.name }))}
                      placeholder="Select a connection"
                      chakraStyles={{
                        control: (provided) => ({
                          ...provided,
                          borderRadius: 'lg',
                          minHeight: '48px',
                          borderColor: borderColor,
                          _hover: {
                            borderColor: accentColor
                          }
                        })
                      }}
                    />
                    <FormHelperText fontSize="xs">
                      Choose the database connection to use
                    </FormHelperText>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      <HStack spacing={1}>
                        <Icon as={FiFolder} color={mutedColor} />
                        <Text>Collections (Optional)</Text>
                      </HStack>
                    </FormLabel>
                    <HStack>
                      <Box flex={1}>
                        <Select
                          isMulti
                          value={selectedCollections}
                          onChange={(options) => setSelectedCollections(options)}
                          isDisabled={isLoading || !selectedConnection}
                          options={collections.map(collection => ({ value: collection, label: collection }))}
                          placeholder="Select collections to include"
                          chakraStyles={{
                            control: (provided) => ({
                              ...provided,
                              borderRadius: 'lg',
                              minHeight: '48px',
                              borderColor: borderColor,
                              _hover: {
                                borderColor: accentColor
                              }
                            })
                          }}
                        />
                      </Box>
                      <Tooltip label="View database schema">
                        <Button 
                          onClick={fetchSchema} 
                          variant="outline"
                          colorScheme="purple"
                          isLoading={isLoading}
                          isDisabled={selectedCollections.length === 0}
                          leftIcon={<Icon as={FiEye} />}
                        >
                          Schema
                        </Button>
                      </Tooltip>
                    </HStack>
                    <FormHelperText fontSize="xs">
                      Select specific collections or leave empty for all
                    </FormHelperText>
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" display="inline-flex" alignItems="center">
                  <HStack spacing={1}>
                    <Icon as={FiMessageSquare} color={mutedColor} />
                    <Text>Describe Your Query in Natural Language</Text>
                    <Badge colorScheme="purple" fontSize="xs">AI-Powered</Badge>
                  </HStack>
                </FormLabel>
                <Box 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  borderColor={borderColor}
                  bg={useColorModeValue('white', 'gray.800')}
                  p={2}
                  _hover={{ borderColor: accentColor }}
                  transition="border-color 0.2s"
                >
                  <Textarea
                    value={naturalLanguageQuery}
                    onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                    placeholder="Example: Find all users who registered in the last 30 days and have made at least one purchase, sorted by registration date"
                    isDisabled={isGenerating}
                    minH="120px"
                    border="none"
                    _focus={{ border: 'none', boxShadow: 'none' }}
                    fontSize="sm"
                  />
                </Box>
                <FormHelperText fontSize="xs">
                  Describe what data you want to retrieve in plain English. Be as specific as possible.
                </FormHelperText>
              </FormControl>

              <Divider />

              <HStack justify="space-between" w="full">
                <HStack spacing={2}>
                  {generatedQuery && (
                    <Tag size="lg" colorScheme="green" variant="subtle">
                      <TagLeftIcon as={CheckIcon} />
                      <TagLabel>Query Generated</TagLabel>
                    </Tag>
                  )}
                </HStack>
                <HStack spacing={3}>
                  {isDialog && generatedQuery && (
                    <Button 
                      onClick={handleGenerateClick} 
                      colorScheme="green" 
                      leftIcon={<CheckIcon />}
                      size="md"
                    >
                      Use This Query
                    </Button>
                  )}
                  <Button
                    colorScheme="purple"
                    isLoading={isGenerating}
                    loadingText="Generating..."
                    leftIcon={<Icon as={FaMagic} />}
                    type="submit"
                    size="lg"
                    px={8}
                    isDisabled={!selectedConnection || !naturalLanguageQuery}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Generate Query
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {generatedQuery && (
          <ScaleFade initialScale={0.9} in={!!generatedQuery}>
            <Card borderRadius="xl" boxShadow="md" overflow="hidden">
              <CardHeader 
                bg={useColorModeValue('green.50', 'gray.700')}
                borderBottom="1px"
                borderColor={borderColor}
              >
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Icon as={FiCode} color={successColor} boxSize={5} />
                    <Heading size="md">Generated MongoDB Query</Heading>
                  </HStack>
                  <HStack spacing={2}>
                    <Tooltip label={copiedQuery ? "Copied!" : "Copy query"}>
                      <IconButton
                        icon={copiedQuery ? <CheckIcon /> : <CopyIcon />}
                        onClick={() => copyToClipboard(generatedQuery)}
                        size="sm"
                        variant="ghost"
                        colorScheme={copiedQuery ? "green" : "gray"}
                        aria-label="Copy query"
                      />
                    </Tooltip>
                  </HStack>
                </HStack>
              </CardHeader>
              <CardBody>
                <Box 
                  bg={useColorModeValue('gray.900', 'gray.950')}
                  p={6}
                  borderRadius="lg"
                  position="relative"
                >
                  <MongoQueryViewer query={generatedQuery} />
                </Box>
                <Alert status="info" mt={4} borderRadius="lg" variant="subtle">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">AI-Generated Query</AlertTitle>
                    <AlertDescription fontSize="xs">
                      This query was generated by AI based on your natural language description. 
                      Please review it before executing in production.
                    </AlertDescription>
                  </Box>
                </Alert>
              </CardBody>
            </Card>
          </ScaleFade>
        )}

        <Modal 
          isOpen={isOpen} 
          onClose={onModalClose} 
          size="6xl"
          scrollBehavior="inside"
        >
          <ModalOverlay backdropFilter="blur(5px)" />
          <ModalContent 
            borderRadius="xl" 
            maxH="90vh"
            mx={4}
          >
            <ModalHeader borderBottom="1px" borderColor={borderColor}>
              <HStack spacing={3}>
                <Icon as={FiLayers} color={accentColor} boxSize={5} />
                <Text>Database Schema</Text>
                {selectedCollections.length > 0 && (
                  <Badge colorScheme="purple" fontSize="sm">
                    {selectedCollections.length} collection{selectedCollections.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6} overflowY="auto">
              <Box 
                bg={useColorModeValue('gray.50', 'gray.900')}
                p={4}
                borderRadius="lg"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: borderColor,
                    borderRadius: '4px',
                  },
                }}
              >
                {schema ? (
                  <ReactJson
                    src={schema}
                    theme={useColorModeValue('rjv-default', 'monokai')}
                    collapseStringsAfterLength={100}
                    displayDataTypes={false}
                    displayObjectSize={true}
                    enableClipboard={customCopyHandler}
                    collapsed={1}
                    style={{
                      fontSize: '14px',
                      fontFamily: 'Monaco, monospace',
                      backgroundColor: 'transparent'
                    }}
                  />
                ) : (
                  <Center py={10}>
                    <VStack spacing={4}>
                      <Spinner size="xl" color={accentColor} thickness="4px" />
                      <Text color={mutedColor}>Loading schema...</Text>
                    </VStack>
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
                    if (schema) {
                      navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
                      toast({
                        title: 'Schema copied to clipboard',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                        position: 'top-right',
                      });
                    }
                  }}
                >
                  Copy Schema
                </Button>
                <Button colorScheme="blue" onClick={onModalClose}>
                  Close
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {!Array.isArray(connections) && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                Unable to load connections. Please refresh the page or check your database configuration.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {isGenerating && (
          <Box 
            position="fixed" 
            bottom={4} 
            right={4} 
            bg={cardBg} 
            p={4} 
            borderRadius="lg" 
            boxShadow="lg"
            zIndex={1000}
          >
            <HStack spacing={3}>
              <Spinner size="sm" color={accentColor} />
              <Text fontSize="sm">AI is generating your query...</Text>
            </HStack>
          </Box>
        )}
      </VStack>
    </Fade>
  );
};

AIQueryGenerator.propTypes = {
  onClose: PropTypes.func.isRequired,
  isDialog: PropTypes.bool
};

export default AIQueryGenerator;
