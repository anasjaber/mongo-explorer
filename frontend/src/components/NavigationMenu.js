import {
  InfoIcon,
  LinkIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TimeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  HamburgerIcon,
  CloseIcon
} from '@chakra-ui/icons';
import {
  Button,
  Link as ChakraLink,
  Flex,
  VStack,
  useColorModeValue,
  Box,
  Text,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  HStack,
  Collapse,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi';

const NavigationMenu = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const iconColor = useColorModeValue('gray.500', 'gray.400');
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleLogout = () => {
    localStorage.removeItem('mongo-token');
    navigate('/login');
  };

  const navItems = [
    { 
      path: '/', 
      label: 'Connections', 
      icon: LinkIcon,
      description: 'Manage database connections'
    },
    { 
      path: '/queries', 
      label: 'Queries', 
      icon: SearchIcon,
      description: 'Execute and save queries'
    },
    { 
      path: '/ai-query-generator', 
      label: 'AI Query Generator', 
      icon: StarIcon,
      description: 'Generate queries with AI',
      badge: 'AI'
    },
    { 
      path: '/query-logs', 
      label: 'Query Logs', 
      icon: TimeIcon,
      description: 'View query history'
    },
    { 
      path: '/query-profiler', 
      label: 'Query Profiler', 
      icon: InfoIcon,
      description: 'Analyze query performance'
    },
    { 
      path: '/openai-settings', 
      label: 'AI Provider Settings', 
      icon: SettingsIcon,
      description: 'Configure AI provider settings'
    }
  ];

  const isActive = (path) => location.pathname === path;

  // Close drawer on navigation for mobile
  const handleNavigation = () => {
    if (isMobile) {
      onClose();
    }
  };

  // Sidebar content component (reused for both desktop and mobile)
  const SidebarContent = ({ onNavigate }) => (
    <Flex
      direction="column"
      h="full"
      p={isCollapsed && !isMobile ? 2 : 4}
    >
      {/* Header */}
      <Flex
        align="center"
        justify={isCollapsed && !isMobile ? 'center' : 'space-between'}
        mb={6}
        position="relative"
      >
        {!isCollapsed || isMobile ? (
          <>
            <Box>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Mongo Explorer
              </Text>
              <Text fontSize="xs" color={iconColor}>
                Database Manager
              </Text>
            </Box>
            {!isMobile && (
              <IconButton
                icon={<ChevronLeftIcon />}
                size="sm"
                variant="ghost"
                onClick={() => setIsCollapsed(true)}
                aria-label="Collapse sidebar"
              />
            )}
          </>
        ) : (
          <IconButton
            icon={<ChevronRightIcon />}
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          />
        )}
      </Flex>

      <Divider mb={4} />

      {/* Navigation Items */}
      <VStack
        align="stretch"
        spacing={2}
        flex={1}
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
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
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            label={isCollapsed && !isMobile ? item.label : item.description}
            placement="right"
            hasArrow
            isDisabled={isMobile}
          >
            <ChakraLink
              as={Link}
              to={item.path}
              onClick={onNavigate}
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent={isCollapsed && !isMobile ? 'center' : 'flex-start'}
              py={3}
              px={isCollapsed && !isMobile ? 0 : 4}
              borderRadius="lg"
              bg={isActive(item.path) ? activeBg : 'transparent'}
              color={isActive(item.path) ? activeColor : textColor}
              fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
              fontSize="sm"
              transition="all 0.2s"
              _hover={{
                textDecoration: 'none',
                bg: hoverBg,
                transform: isCollapsed && !isMobile ? 'none' : 'translateX(2px)'
              }}
              role="group"
            >
              {isActive(item.path) && (
                <Box
                  position="absolute"
                  left="-4px"
                  top="50%"
                  transform="translateY(-50%)"
                  w="3px"
                  h="70%"
                  bg={activeColor}
                  borderRadius="full"
                />
              )}
              <Flex align="center" justify={isCollapsed && !isMobile ? 'center' : 'flex-start'} w="full">
                <Box
                  as={item.icon}
                  boxSize={5}
                  color={isActive(item.path) ? activeColor : iconColor}
                  transition="color 0.2s"
                  _groupHover={{ color: activeColor }}
                />
                {(!isCollapsed || isMobile) && (
                  <>
                    <Text ml={3} flex={1}>
                      {item.label}
                    </Text>
                    {item.badge && (
                      <Badge
                        colorScheme="purple"
                        size="sm"
                        borderRadius="full"
                        px={2}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Flex>
            </ChakraLink>
          </Tooltip>
        ))}
      </VStack>

      <Divider my={4} />

      {/* Footer Actions */}
      <VStack spacing={3} align="stretch">
        {/* User Menu */}
        {!isCollapsed || isMobile ? (
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              w="full"
              textAlign="left"
              px={4}
              py={2}
              borderRadius="lg"
              _hover={{ bg: hoverBg }}
            >
              <HStack>
                <Avatar size="sm" name="User" bg="blue.500" />
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    User Account
                  </Text>
                  <Text fontSize="xs" color={iconColor}>
                    Manage profile
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<FiLogOut />}
                onClick={handleLogout}
                color="red.500"
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Tooltip label="Logout" placement="right">
            <IconButton
              icon={<FiLogOut />}
              onClick={handleLogout}
              colorScheme="red"
              variant="ghost"
              size="sm"
              aria-label="Logout"
            />
          </Tooltip>
        )}
      </VStack>
    </Flex>
  );

  // Render desktop sidebar or mobile drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile hamburger button */}
        <IconButton
          icon={<HamburgerIcon />}
          onClick={onOpen}
          position="fixed"
          top={4}
          left={4}
          zIndex={20}
          colorScheme="blue"
          aria-label="Open menu"
          size="md"
        />

        {/* Mobile drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="full">
          <DrawerOverlay />
          <DrawerContent bg={sidebarBg}>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Mongo Explorer
              </Text>
              <Text fontSize="xs" color={iconColor}>
                Database Manager
              </Text>
            </DrawerHeader>
            <DrawerBody p={0}>
              <SidebarContent onNavigate={handleNavigation} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop sidebar
  return (
    <Box
      w={isCollapsed ? '70px' : '280px'}
      h="100vh"
      bg={sidebarBg}
      borderRight="1px"
      borderColor={borderColor}
      transition="width 0.2s"
      position="relative"
      boxShadow="lg"
      display={{ base: 'none', md: 'block' }}
    >
      <SidebarContent onNavigate={() => {}} />
    </Box>
  );
};

export default NavigationMenu;
