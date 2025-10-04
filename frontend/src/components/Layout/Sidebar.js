import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Dashboard,
  CreditCard,
  CheckCircle,
  People,
  Settings,
  Public,
} from '@mui/icons-material';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Dashboard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Expenses', href: '/expenses', icon: CreditCard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Approvals', href: '/approvals', icon: CheckCircle, roles: ['admin', 'manager'] },
    { name: 'Users', href: '/users', icon: People, roles: ['admin'] },
    { name: 'Approval Rules', href: '/approval-rules', icon: Settings, roles: ['admin'] },
    { name: 'Company Settings', href: '/company-settings', icon: Public, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Box sx={{ flexGrow: 1, pt: 2 }}>
        <List>
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.href}
                  selected={isActive(item.href)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Info */}
      <Paper elevation={0} sx={{ m: 1, p: 2, backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Sidebar;
