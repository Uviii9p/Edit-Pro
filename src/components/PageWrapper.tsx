'use client';

import { motion } from 'framer-motion';

export const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 5 }}
            transition={{ 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1] 
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};
