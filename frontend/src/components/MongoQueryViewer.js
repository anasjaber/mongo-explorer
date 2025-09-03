import { 
    CheckIcon, 
    CopyIcon, 
    InfoOutlineIcon,
    TimeIcon,
    ViewIcon
} from '@chakra-ui/icons';
import { 
    Badge,
    Box, 
    Button,
    Card,
    CardBody,
    CardHeader,
    Center,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    SimpleGrid,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Text, 
    Tooltip,
    useClipboard, 
    useColorMode,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react';
import { FiCode, FiCopy, FiDatabase, FiEye, FiFileText, FiLayers } from 'react-icons/fi';
import { js as beautify } from 'js-beautify';
import React, { useEffect, useMemo, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
    atomOneDark,
    atomOneLight,
    monokai,
    nord,
    dracula,
    github
} from 'react-syntax-highlighter/dist/esm/styles/hljs';

const MongoQueryViewer = ({ query, metadata = {} }) => {
    const { colorMode } = useColorMode();
    const bgColor = useColorModeValue('white', 'gray.800');
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const headerBg = useColorModeValue('gray.50', 'gray.700');
    const headerCardBg = useColorModeValue('blue.50', 'gray.700');
    const metadataBg = useColorModeValue('blue.50', 'blue.900');
    const codeBg = useColorModeValue('#f8f9fa', '#1a202c');
    const scrollTrackBg = useColorModeValue('#f1f1f1', '#2d3748');
    const scrollThumbBg = useColorModeValue('#888', '#4a5568');
    const scrollThumbHoverBg = useColorModeValue('#555', '#718096');
    const lineNumberColor = useColorModeValue('#999', '#666');
    const toast = useToast();
    
    const [formattedQuery, setFormattedQuery] = useState('');
    const [syntaxTheme, setSyntaxTheme] = useState('auto');
    const [wrapLines, setWrapLines] = useState(true);
    const { hasCopied, onCopy: originalOnCopy } = useClipboard(formattedQuery);

    // Get the appropriate syntax theme based on selection and color mode
    const getSyntaxTheme = () => {
        const themes = {
            auto: colorMode === 'light' ? atomOneLight : atomOneDark,
            light: atomOneLight,
            dark: atomOneDark,
            monokai: monokai,
            nord: nord,
            dracula: dracula,
            github: github
        };
        return themes[syntaxTheme] || themes.auto;
    };

    // Calculate query statistics
    const queryStats = useMemo(() => {
        if (!formattedQuery || formattedQuery === 'No query available') {
            return { lines: 0, chars: 0, complexity: 'N/A' };
        }
        
        const lines = formattedQuery.split('\n').length;
        const chars = formattedQuery.length;
        
        // Simple complexity calculation based on query structure
        let complexity = 'Simple';
        if (formattedQuery.includes('aggregate') || formattedQuery.includes('$lookup')) {
            complexity = 'Complex';
        } else if (formattedQuery.includes('$and') || formattedQuery.includes('$or') || lines > 10) {
            complexity = 'Moderate';
        }
        
        return { lines, chars, complexity };
    }, [formattedQuery]);

    useEffect(() => {
        formatQuery(query);
    }, [query]);

    // Function to format the query string
    const formatQuery = (queryString) => {
        if (!queryString) {
            setFormattedQuery('No query available');
            return;
        }

        try {
            const cleanedQuery = queryString.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            const beautifiedQuery = beautify(cleanedQuery, {
                indent_size: 2,
                space_in_empty_paren: true,
                preserve_newlines: true,
                break_chained_methods: true,
                max_preserve_newlines: 2,
            });
            setFormattedQuery(beautifiedQuery);
        } catch (error) {
            console.error("Error formatting query:", error);
            setFormattedQuery(queryString);
        }
    };

    const onCopy = () => {
        originalOnCopy();
        toast({
            title: "Query Copied",
            description: "MongoDB query has been copied to clipboard",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top-right",
        });
    };

    if (!query) {
        return (
            <Center py={10}>
                <VStack spacing={4}>
                    <Icon as={FiDatabase} boxSize={12} color={mutedColor} />
                    <VStack spacing={2}>
                        <Heading size="md">No Query Available</Heading>
                        <Text color={mutedColor} textAlign="center">
                            Query will appear here when available
                        </Text>
                    </VStack>
                </VStack>
            </Center>
        );
    }

    return (
        <VStack spacing={4} align="stretch">
            {/* Header with gradient */}
            <Box 
                bgGradient="linear(to-r, blue.400, blue.600)"
                color="white"
                p={6}
                borderRadius="lg"
                boxShadow="md"
            >
                <VStack align="start" spacing={2}>
                    <HStack spacing={3}>
                        <Icon as={FiCode} boxSize={6} />
                        <Heading size="lg">MongoDB Query Viewer</Heading>
                    </HStack>
                    <Text opacity={0.9}>
                        Formatted query with syntax highlighting
                    </Text>
                </VStack>
            </Box>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Card variant="outline" size="sm">
                    <CardBody>
                        <Stat>
                            <StatLabel color={mutedColor}>
                                <HStack spacing={2}>
                                    <Icon as={FiFileText} />
                                    <Text>Lines</Text>
                                </HStack>
                            </StatLabel>
                            <StatNumber fontSize="2xl" color="blue.500">
                                {queryStats.lines}
                            </StatNumber>
                            <StatHelpText>Total lines of code</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card variant="outline" size="sm">
                    <CardBody>
                        <Stat>
                            <StatLabel color={mutedColor}>
                                <HStack spacing={2}>
                                    <Icon as={FiLayers} />
                                    <Text>Characters</Text>
                                </HStack>
                            </StatLabel>
                            <StatNumber fontSize="2xl" color="green.500">
                                {queryStats.chars}
                            </StatNumber>
                            <StatHelpText>Total character count</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card variant="outline" size="sm">
                    <CardBody>
                        <Stat>
                            <StatLabel color={mutedColor}>
                                <HStack spacing={2}>
                                    <Icon as={FiDatabase} />
                                    <Text>Complexity</Text>
                                </HStack>
                            </StatLabel>
                            <StatNumber fontSize="2xl" color={
                                queryStats.complexity === 'Simple' ? 'green.500' :
                                queryStats.complexity === 'Moderate' ? 'yellow.500' : 'red.500'
                            }>
                                {queryStats.complexity}
                            </StatNumber>
                            <StatHelpText>Query complexity level</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
            </SimpleGrid>

            {/* Main Query Card */}
            <Card>
                <CardHeader 
                    bg={headerCardBg}
                    borderBottom="1px"
                    borderColor={borderColor}
                >
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                        <HStack spacing={3}>
                            <Icon as={FiCode} color="blue.500" boxSize={5} />
                            <VStack align="start" spacing={0}>
                                <Heading size="md">Query Content</Heading>
                                <Text fontSize="xs" color={mutedColor}>
                                    Formatted MongoDB query
                                </Text>
                            </VStack>
                        </HStack>

                        {/* Action Buttons */}
                        <HStack spacing={2}>
                            {/* Theme Selector */}
                            <Menu>
                                <MenuButton
                                    as={IconButton}
                                    icon={<FiEye />}
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Select theme"
                                />
                                <MenuList>
                                    <MenuItem onClick={() => setSyntaxTheme('auto')}>
                                        Auto Theme
                                    </MenuItem>
                                    <MenuItem onClick={() => setSyntaxTheme('light')}>
                                        Light Theme
                                    </MenuItem>
                                    <MenuItem onClick={() => setSyntaxTheme('dark')}>
                                        Dark Theme
                                    </MenuItem>
                                    <MenuItem onClick={() => setSyntaxTheme('monokai')}>
                                        Monokai
                                    </MenuItem>
                                    <MenuItem onClick={() => setSyntaxTheme('nord')}>
                                        Nord
                                    </MenuItem>
                                    <MenuItem onClick={() => setSyntaxTheme('dracula')}>
                                        Dracula
                                    </MenuItem>
                                    <MenuItem onClick={() => setSyntaxTheme('github')}>
                                        GitHub
                                    </MenuItem>
                                </MenuList>
                            </Menu>

                            {/* Line Wrap Toggle */}
                            <Tooltip label={wrapLines ? "Disable line wrap" : "Enable line wrap"}>
                                <IconButton
                                    icon={<InfoOutlineIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setWrapLines(!wrapLines)}
                                    aria-label="Toggle line wrap"
                                    color={wrapLines ? 'blue.500' : 'gray.500'}
                                />
                            </Tooltip>

                            {/* Copy Button */}
                            <Button
                                size="sm"
                                onClick={onCopy}
                                leftIcon={hasCopied ? <CheckIcon /> : <FiCopy />}
                                colorScheme={hasCopied ? "green" : "blue"}
                                variant={hasCopied ? "solid" : "outline"}
                            >
                                {hasCopied ? "Copied!" : "Copy Query"}
                            </Button>
                        </HStack>
                    </Flex>
                </CardHeader>

                {/* Metadata Bar (if provided) */}
                {metadata && Object.keys(metadata).length > 0 && (
                    <Flex
                        px={4}
                        py={2}
                        bg={metadataBg}
                        borderBottom="1px solid"
                        borderColor={borderColor}
                        gap={3}
                        flexWrap="wrap"
                    >
                        {metadata.collection && (
                            <HStack spacing={1}>
                                <Text fontSize="xs" color={mutedColor}>Collection:</Text>
                                <Badge colorScheme="purple" variant="subtle">
                                    {metadata.collection}
                                </Badge>
                            </HStack>
                        )}
                        {metadata.operation && (
                            <HStack spacing={1}>
                                <Text fontSize="xs" color={mutedColor}>Operation:</Text>
                                <Badge colorScheme="cyan" variant="subtle">
                                    {metadata.operation}
                                </Badge>
                            </HStack>
                        )}
                        {metadata.executionTime && (
                            <HStack spacing={1}>
                                <TimeIcon boxSize={3} color={mutedColor} />
                                <Text fontSize="xs" color={mutedColor}>
                                    {metadata.executionTime}ms
                                </Text>
                            </HStack>
                        )}
                        {metadata.database && (
                            <HStack spacing={1}>
                                <Text fontSize="xs" color={mutedColor}>Database:</Text>
                                <Badge colorScheme="blue" variant="subtle">
                                    {metadata.database}
                                </Badge>
                            </HStack>
                        )}
                    </Flex>
                )}

                <CardBody>
                    {/* Query Content */}
                    <Box 
                        p={4}
                        maxHeight="600px"
                        overflowY="auto"
                        overflowX={wrapLines ? "hidden" : "auto"}
                        bg={codeBg}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={borderColor}
                        css={{
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: scrollTrackBg,
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: scrollThumbBg,
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: scrollThumbHoverBg,
                            },
                        }}
                    >
                        <SyntaxHighlighter
                            language="javascript"
                            style={getSyntaxTheme()}
                            customStyle={{
                                backgroundColor: 'transparent',
                                padding: '0',
                                margin: '0',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            }}
                            wrapLongLines={wrapLines}
                            showLineNumbers={queryStats.lines > 1}
                            lineNumberStyle={{
                                minWidth: '2.5em',
                                paddingRight: '1em',
                                color: lineNumberColor,
                                userSelect: 'none',
                            }}
                        >
                            {formattedQuery}
                        </SyntaxHighlighter>
                    </Box>
                </CardBody>
            </Card>
        </VStack>
    );
};

export default MongoQueryViewer;