import { Box } from '@chakra-ui/react';
import React from 'react';

const PageWrapper = ({ children }) => {
  return (
    <Box
      w="full"
      h="full"
      overflowX="hidden"
      overflowY="auto"
      position="relative"
    >
      {children}
    </Box>
  );
};

export default PageWrapper;