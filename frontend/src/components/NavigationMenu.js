import { InfoIcon, SearchIcon, SettingsIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { Link as ChakraLink, Flex, Heading, VStack, useColorMode, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavigationMenu = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('gray.100', 'gray.700');
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Connections', icon: SettingsIcon },
    { path: '/queries', label: 'Queries', icon: SearchIcon },
    { path: '/ai-query-generator', label: 'AI Query Generator', icon: StarIcon },
    { path: '/query-logs', label: 'Query Logs', icon: TimeIcon },
    { path: '/query-profiler', label: 'Query Profiler', icon: InfoIcon },
  ];

  return (
    <VStack
      w="250px"
      h="100vh"
      p={5}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      spacing={4}
      align="stretch"
    >
      <Flex justify="space-between" align="center">
        <Heading size="md">MongoDB Manager</Heading>
      </Flex>
      {navItems.map((item) => (
        <ChakraLink
          key={item.path}
          as={Link}
          to={item.path}
          py={2}
          px={4}
          borderRadius="md"
          display="flex"
          alignItems="center"
          bg={location.pathname === item.path ? activeBg : 'transparent'}
          _hover={{ textDecoration: 'none', bg: activeBg }}
        >
          <item.icon mr={3} />
          {item.label}
        </ChakraLink>
      ))}
    </VStack>
  );
};

export default NavigationMenu;