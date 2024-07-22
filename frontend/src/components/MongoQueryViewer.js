import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { Box, Button, Text, useClipboard, useColorModeValue } from '@chakra-ui/react';
import { js as beautify } from 'js-beautify';
import React, { useEffect, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const MongoQueryViewer = ({ query }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'gray.100');
    const [formattedQuery, setFormattedQuery] = useState('');
    const { hasCopied, onCopy } = useClipboard(formattedQuery);

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

    if (!query) {
        return (
            <Box bg={bgColor} p={4} borderRadius="md">
                <Text color={textColor}>No query available</Text>
            </Box>
        );
    }

    return (
        <Box bg={bgColor} p={4} borderRadius="md" maxWidth="100%" overflowX="auto" position="relative">
            <Button
                size="sm"
                position="absolute"
                top={4}
                right={4}
                onClick={onCopy}
            >
                {hasCopied ? <CheckIcon /> : <CopyIcon />}
            </Button>
            <SyntaxHighlighter
                language="javascript"
                style={docco}
                customStyle={{
                    backgroundColor: 'transparent',
                    padding: '0',
                }}
                wrapLongLines={true}
            >
                {formattedQuery}
            </SyntaxHighlighter>
        </Box>
    );
};

export default MongoQueryViewer;
