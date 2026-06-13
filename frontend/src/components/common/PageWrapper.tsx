import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const PageWrapper = ({ children, title, subtitle }: PageWrapperProps) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    sx={{ minHeight: 'calc(100vh - 72px)', px: { xs: 2, md: 4 }, py: 4 }}
  >
    {(title || subtitle) && (
      <Box mb={3}>
        {title && (
          <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
    )}
    {children}
  </Box>
);
