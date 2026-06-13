import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassCardProps extends BoxProps {
  hover?: boolean;
  gradient?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, hover = false, gradient, sx, ...props }, ref) => (
    <Box
      ref={ref}
      component={hover ? motion.div : 'div'}
      {...(hover
        ? {
            whileHover: { y: -4, boxShadow: '0 20px 60px rgba(99, 102, 241, 0.2)' },
            transition: { duration: 0.2 },
          }
        : {})}
      sx={{
        background: gradient || 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  )
);

GlassCard.displayName = 'GlassCard';
