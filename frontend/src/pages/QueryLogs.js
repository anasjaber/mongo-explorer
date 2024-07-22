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
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import ReactJson from 'react-json-view';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7073/api';

const QueryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuery, setSelectedQuery] = useState({});
  const [filter, setFilter] = useState('');
  const [suggestedIndexes, setSuggestedIndexes] = useState([]);
  const [isSuggestingIndexes, setIsSuggestingIndexes] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
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
      const response = await axios.get(`${API_BASE_URL}/QueryLog`, {
        params: {
          page: currentPage,
          pageSize: 10,
          filter: filter
        }
      });
      setLogs(response.data.items);
      setTotalPages(response.data.totalPages);
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
      const response = await axios.get(`${API_BASE_URL}/QueryProfiler/query-logs/suggest-indexes/${query.id}`);
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
      await axios.post(`${API_BASE_URL}/QueryProfiler/query-logs/create-index`, {
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

  return (
    <VStack spacing={8} align="stretch">
      <Heading as="h1" size="lg">Query Logs</Heading>

      <HStack>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by any column"
        />
        <Button onClick={fetchLogs} leftIcon={<SearchIcon />} colorScheme="blue">Search</Button>
      </HStack>

      <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
        {isLoading ? (
          <Spinner size="xl" />
        ) : (
          <>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Run At</Th>
                  <Th>Run By</Th>
                  <Th>Duration (ms)</Th>
                  <Th>Query Text</Th>
                  <Th>Query Name</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr key={log.id}>
                    <Td>{new Date(log.runAt).toLocaleString()}</Td>
                    <Td>{log.runBy}</Td>
                    <Td>{log.duration}</Td>
                    <Td>
                      <Text
                        isTruncated
                        maxWidth="300px"
                        cursor="pointer"
                        textDecoration="underline"
                        onClick={() => {
                          setSelectedQuery(JSON.parse(log.queryText));
                          onOpenQueryModal();
                        }}
                      >
                        {log.queryText}
                      </Text>
                    </Td>
                    <Td>
                      <Button
                        variant="link"
                        onClick={() => navigate(`/queries?queryId=${log.queryId}`)}
                      >
                        {log.queryName}
                      </Button>
                    </Td>
                    <Td>
                      <Tooltip label="Suggest Indexes">
                        <IconButton
                          icon={<FaMagic />}
                          onClick={() => handleSuggestIndexes(log)}
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
          <ModalHeader>Query Detail</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
              <ReactJson
                src={selectedQuery}
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
              {Array.isArray(suggestedIndexes) && suggestedIndexes.length > 0 ? (
                suggestedIndexes.map((value, idx) => (
                  <Box key={idx} borderWidth={1} borderRadius="md" p={4}>
                    <ReactJson
                      src={value}
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
                      onClick={() => handleCreateIndex(value, idx)}
                      isLoading={creatingIndex === idx}
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

export default QueryLogs;
