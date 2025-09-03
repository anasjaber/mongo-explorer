import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SearchIcon,
  TimeIcon,
  ViewIcon,
  ExternalLinkIcon,
  InfoOutlineIcon,
  WarningIcon,
  RepeatIcon,
  AddIcon,
  CheckIcon,
  CopyIcon
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
  Container,
  Grid,
  GridItem,
  useBreakpointValue,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Code,
  Avatar,
  AvatarBadge,
  Link,
  Progress
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { 
  FiDatabase, 
  FiClock,
  FiUser,
  FiPlay,
  FiZap,
  FiFilter,
  FiActivity,
  FiCopy,
  FiLayers,
  FiFileText,
  FiTrendingUp
} from 'react-icons/fi';
import ReactJson from 'react-json-view';
import { useNavigate } from 'react-router-dom';
import MongoQueryViewer from '../components/MongoQueryViewer';
import api from './api';

const QueryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedQuery, setSelectedQuery] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState('');
  const [suggestedIndexes, setSuggestedIndexes] = useState([]);
  const [isSuggestingIndexes, setIsSuggestingIndexes] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  
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
  const {
    isOpen: isQueryModalOpen,
    onOpen: onOpenQueryModal,
    onClose: onCloseQueryModal
  } = useDisclosure();
  const {
    isOpen: isIndexModalOpen,
    onOpen: onOpenIndexModal,
    onClose: onCloseIndexModal
  } = useDisclosure();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/QueryLog`, {
        params: {
          page: currentPage,
          pageSize: 10,
          filter: filter
        }
      });
      setLogs(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);
    } catch (error) {
      handleError('Error fetching logs', error);
    }
    setIsLoading(false);
  }, [currentPage, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSuggestIndexes = async (query) => {
    setIsSuggestingIndexes(true);
    try {
      const response = await api.get(`/QueryProfiler/query-logs/suggest-indexes/${query.id}`);
      // Ensure suggestedIndexes is always an array
      setSuggestedIndexes(Array.isArray(response.data) ? response.data : []);
      setSelectedQuery(query);
      onOpenIndexModal();
    } catch (error) {
      handleError('Error suggesting indexes', error);
      setSuggestedIndexes([]); // Reset to empty array in case of error
    }
    setIsSuggestingIndexes(false);
  };

  const handleCreateIndex = async (pipelineVal, idx) => {
    debugger;
    setCreatingIndex(idx);
    const pipeline = JSON.stringify(pipelineVal.index);
    const collection = pipelineVal.collectionName;
    try {
      await api.post(`/QueryProfiler/query-logs/create-index`, {
        queryId: selectedQuery.queryId,
        pipeline,
        collection
      });
      handleSuccess('Index created successfully');
    } catch (error) {
      handleError('Error creating index', error);
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
                bgGradient="linear(to-r, cyan.400, cyan.600)"
                bgClip="text"
              >
                Query Logs
              </Heading>
              <Text fontSize="sm" color={mutedColor}>
                View and analyze historical query execution logs
              </Text>
            </VStack>
            <HStack>
              <Tooltip label="Refresh logs">
                <IconButton
                  icon={<RepeatIcon />}
                  onClick={fetchLogs}
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
                    <Icon as={FiFileText} />
                    <Text>Total Logs</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl" color={accentColor}>
                  {totalItems}
                </StatNumber>
                <StatHelpText>Historical records</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card variant="outline" size="sm">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  <HStack spacing={2}>
                    <Icon as={FiClock} />
                    <Text>Avg. Duration</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl" color={warningColor}>
                  {logs.length > 0 
                    ? Math.round(logs.reduce((sum, l) => sum + (l.duration || 0), 0) / logs.length)
                    : 0
                  }ms
                </StatNumber>
                <StatHelpText>Query execution</StatHelpText>
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
                  {logs.filter(l => l.duration > 1000).length}
                </StatNumber>
                <StatHelpText>&gt; 1000ms</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" size="sm">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  <HStack spacing={2}>
                    <Icon as={FiActivity} />
                    <Text>Current Page</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl">
                  {currentPage}/{totalPages}
                </StatNumber>
                <StatHelpText>10 per page</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Search Section */}
        <Card borderRadius="xl" boxShadow="sm">
          <CardBody>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiFilter} color={mutedColor} />
              </InputLeftElement>
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search logs by query text, user, or query name..."
                borderRadius="lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                    fetchLogs();
                  }
                }}
              />
            </InputGroup>
          </CardBody>
        </Card>

        {/* Logs Table */}
        <Card borderRadius="xl" boxShadow="md" overflow="hidden">
          <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={FiLayers} color={accentColor} boxSize={5} />
                <Heading size="md">Execution History</Heading>
              </HStack>
              {logs.length > 0 && (
                <Badge colorScheme="cyan" fontSize="sm" px={3} py={1} borderRadius="full">
                  {logs.length} {logs.length === 1 ? 'Log' : 'Logs'}
                </Badge>
              )}
            </HStack>
          </CardHeader>
          <CardBody p={0}>
            {isLoading ? (
              <Center py={10}>
                <VStack spacing={4}>
                  <Spinner size="xl" color={accentColor} thickness="4px" />
                  <Text color={mutedColor}>Loading query logs...</Text>
                </VStack>
              </Center>
            ) : logs.length > 0 ? (
              <>
                <Box overflowX="auto">
                  <Table variant="simple" size="md">
                    <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                      <Tr>
                        <Th>Execution Details</Th>
                        <Th>Query Information</Th>
                        <Th>Performance</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {logs.map((log) => (
                        <Tr 
                          key={log.id}
                          _hover={{ bg: tableHoverBg }}
                          transition="background 0.2s"
                        >
                          <Td>
                            <VStack align="start" spacing={2}>
                              <HStack spacing={2}>
                                <Icon as={FiClock} color={mutedColor} boxSize={4} />
                                <Text fontSize="sm" fontWeight="medium">
                                  {new Date(log.runAt).toLocaleDateString()}
                                </Text>
                                <Text fontSize="xs" color={mutedColor}>
                                  {new Date(log.runAt).toLocaleTimeString()}
                                </Text>
                              </HStack>
                              <HStack spacing={2}>
                                <Avatar size="xs" name={log.runBy}>
                                  <AvatarBadge boxSize="1em" bg="green.500" />
                                </Avatar>
                                <Text fontSize="sm" color={mutedColor}>
                                  {log.runBy || 'Unknown User'}
                                </Text>
                              </HStack>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={2}>
                              {log.queryName && (
                                <Link
                                  onClick={() => navigate(`/queries?queryId=${log.queryId}`)}
                                  color={accentColor}
                                  fontWeight="medium"
                                  fontSize="sm"
                                  _hover={{ textDecoration: 'underline' }}
                                >
                                  <HStack spacing={1}>
                                    <Icon as={FiDatabase} />
                                    <Text>{log.queryName}</Text>
                                    <ExternalLinkIcon boxSize={3} />
                                  </HStack>
                                </Link>
                              )}
                              <Code
                                p={2}
                                borderRadius="md"
                                fontSize="xs"
                                maxWidth="350px"
                                isTruncated
                                cursor="pointer"
                                onClick={() => {
                                  setSelectedQuery(log.queryText);
                                  setSelectedLog(log);
                                  onOpenQueryModal();
                                }}
                                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                              >
                                {log.queryText}
                              </Code>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={2}>
                              <Badge 
                                colorScheme={
                                  log.duration < 100 ? "green" :
                                  log.duration < 1000 ? "yellow" : "red"
                                }
                                fontSize="sm"
                                px={3}
                                py={1}
                              >
                                <HStack spacing={1}>
                                  <Icon as={FiActivity} />
                                  <Text>{log.duration}ms</Text>
                                </HStack>
                              </Badge>
                              {log.duration > 1000 && (
                                <Tag size="sm" colorScheme="red" variant="subtle">
                                  <TagLeftIcon as={WarningIcon} />
                                  <TagLabel>Slow</TagLabel>
                                </Tag>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="View full query">
                                <IconButton
                                  icon={<ViewIcon />}
                                  onClick={() => {
                                    setSelectedQuery(log.queryText);
                                    setSelectedLog(log);
                                    onOpenQueryModal();
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  aria-label="View Query"
                                />
                              </Tooltip>
                              <Tooltip label="Suggest indexes with AI">
                                <IconButton
                                  icon={<Icon as={FaMagic} />}
                                  onClick={() => handleSuggestIndexes(log)}
                                  isLoading={isSuggestingIndexes && selectedLog?.id === log.id}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="purple"
                                  aria-label="Suggest Indexes"
                                />
                              </Tooltip>
                              {log.queryId && (
                                <Tooltip label="Open in Query Manager">
                                  <IconButton
                                    icon={<ExternalLinkIcon />}
                                    onClick={() => navigate(`/queries?queryId=${log.queryId}`)}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="cyan"
                                    aria-label="Open Query"
                                  />
                                </Tooltip>
                              )}
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
                          <Badge colorScheme="cyan" fontSize="md" px={3} py={1}>
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
                  <Icon as={FiFileText} boxSize={12} color={mutedColor} />
                  <VStack spacing={2}>
                    <Heading size="md">No Query Logs Found</Heading>
                    <Text color={mutedColor} textAlign="center">
                      {filter 
                        ? "No logs match your search criteria"
                        : "Query execution logs will appear here"
                      }
                    </Text>
                  </VStack>
                  {filter && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilter('');
                        setCurrentPage(1);
                        fetchLogs();
                      }}
                    >
                      Clear Filter
                    </Button>
                  )}
                </VStack>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Query Detail Modal */}
        <Modal isOpen={isQueryModalOpen} onClose={onCloseQueryModal} size="xl">
          <ModalOverlay backdropFilter="blur(5px)" />
          <ModalContent borderRadius="xl">
            <ModalHeader borderBottom="1px" borderColor={borderColor}>
              <HStack spacing={3}>
                <Icon as={ViewIcon} color={accentColor} boxSize={5} />
                <Text>Query Details</Text>
                {selectedLog && (
                  <Badge colorScheme="cyan" fontSize="sm">
                    {selectedLog.queryName || 'Unnamed Query'}
                  </Badge>
                )}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={4} align="stretch">
                {selectedLog && (
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <GridItem>
                      <Text fontSize="xs" color={mutedColor}>Executed By</Text>
                      <HStack spacing={2}>
                        <Avatar size="xs" name={selectedLog.runBy} />
                        <Text fontSize="sm" fontWeight="medium">
                          {selectedLog.runBy}
                        </Text>
                      </HStack>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color={mutedColor}>Duration</Text>
                      <Badge 
                        colorScheme={
                          selectedLog.duration < 100 ? "green" :
                          selectedLog.duration < 1000 ? "yellow" : "red"
                        }
                        fontSize="lg"
                        px={3}
                        py={1}
                      >
                        {selectedLog.duration}ms
                      </Badge>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color={mutedColor}>Executed At</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {new Date(selectedLog.runAt).toLocaleString()}
                      </Text>
                    </GridItem>
                  </Grid>
                )}
                <Box 
                  bg={useColorModeValue('gray.900', 'gray.950')}
                  p={4}
                  borderRadius="lg"
                  maxH="400px"
                  overflowY="auto"
                >
                  <MongoQueryViewer query={selectedQuery} />
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter borderTop="1px" borderColor={borderColor}>
              <HStack spacing={3}>
                <Button 
                  leftIcon={<Icon as={FiCopy} />}
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedQuery);
                    handleSuccess('Query copied to clipboard');
                  }}
                >
                  Copy Query
                </Button>
                {selectedLog?.queryId && (
                  <Button
                    leftIcon={<ExternalLinkIcon />}
                    variant="ghost"
                    colorScheme="cyan"
                    onClick={() => {
                      navigate(`/queries?queryId=${selectedLog.queryId}`);
                      onCloseQueryModal();
                    }}
                  >
                    Open in Manager
                  </Button>
                )}
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
                {Array.isArray(suggestedIndexes) && suggestedIndexes.length > 0 ? (
                  <>
                    <Alert status="info" borderRadius="lg" variant="subtle">
                      <AlertIcon />
                      <Box>
                        <AlertTitle fontSize="sm">Index Optimization</AlertTitle>
                        <AlertDescription fontSize="xs">
                          These indexes are AI-suggested to improve query performance.
                          Review each suggestion before creating.
                        </AlertDescription>
                      </Box>
                    </Alert>
                    {suggestedIndexes.map((value, idx) => (
                      <Card key={idx} variant="outline" borderRadius="lg">
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Badge colorScheme="green" fontSize="sm">
                                Index #{idx + 1}
                              </Badge>
                              {value.collectionName && (
                                <Text fontSize="xs" color={mutedColor}>
                                  Collection: {value.collectionName}
                                </Text>
                              )}
                            </HStack>
                            <Box 
                              bg={useColorModeValue('gray.50', 'gray.900')}
                              p={3}
                              borderRadius="md"
                            >
                              <ReactJson
                                src={value}
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
                            <HStack justify="space-between">
                              <Text fontSize="xs" color={mutedColor}>
                                This index will optimize query performance
                              </Text>
                              <Button
                                colorScheme="green"
                                size="sm"
                                onClick={() => handleCreateIndex(value, idx)}
                                isLoading={creatingIndex === idx}
                                loadingText="Creating..."
                                leftIcon={<AddIcon />}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s"
                              >
                                Create Index
                              </Button>
                            </HStack>
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

export default QueryLogs;
