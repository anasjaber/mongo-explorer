import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Heading,
    Input,
    Spinner,
    Text,
    VStack,
    useColorModeValue,
    useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import api from './api';

const OpenAISettings = () => {
    const [settings, setSettings] = useState({ apiKey: '', model: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/OpenAISettings`);
            setSettings(response.data);
        } catch (error) {
            handleError('Error fetching settings', error);
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/OpenAISettings`, settings);
            handleSuccess('Settings updated', 'OpenAI settings have been successfully updated.');
            setIsEditing(false);
        } catch (error) {
            handleError('Error updating settings', error);
        }
        setIsSaving(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        fetchSettings(); // Revert to original settings
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

    if (isLoading) {
        return (
            <VStack spacing={8} align="stretch">
                <Spinner size="xl" alignSelf="center" />
                <Text mt={4} textAlign="center">Loading settings...</Text>
            </VStack>
        );
    }

    return (
        <VStack spacing={8} align="stretch">
            <Heading as="h1" size="lg">OpenAI Settings</Heading>

            <Box bg={bgColor} p={5} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                <VStack spacing={4} align="stretch">
                    <FormControl>
                        <FormLabel>API Key</FormLabel>
                        {isEditing ? (
                            <Input
                                name="apiKey"
                                value={settings.apiKey}
                                onChange={handleInputChange}
                                type="password"
                                placeholder="Enter your OpenAI API key"
                            />
                        ) : (
                            <Text>••••••••••••••••</Text>
                        )}
                    </FormControl>
                    <FormControl>
                        <FormLabel>Model</FormLabel>
                        {isEditing ? (
                            <Input
                                name="model"
                                value={settings.model}
                                onChange={handleInputChange}
                                placeholder="Enter the OpenAI model (e.g., gpt-3.5-turbo)"
                            />
                        ) : (
                            <Text>{settings.model}</Text>
                        )}
                    </FormControl>
                    <HStack>
                        {isEditing ? (
                            <>
                                <Button
                                    onClick={handleSubmit}
                                    colorScheme="blue"
                                    isLoading={isSaving}
                                    loadingText="Saving"
                                    leftIcon={<CheckIcon />}
                                >
                                    Save Settings
                                </Button>
                                <Button
                                    onClick={handleCancelEdit}
                                    colorScheme="gray"
                                    leftIcon={<CloseIcon />}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleEdit}
                                colorScheme="yellow"
                                leftIcon={<EditIcon />}
                            >
                                Edit Settings
                            </Button>
                        )}
                    </HStack>
                </VStack>
            </Box>
        </VStack>
    );
};

export default OpenAISettings;
