import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CreditCard,
  CheckCircle,
  Schedule,
  AttachMoney,
  TrendingUp,
  People,
  Warning,
  Add,
  Visibility,
} from '@mui/icons-material';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    approvedExpenses: 0,
    totalAmount: 0,
    teamMembers: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch expenses
      const expensesResponse = await api.get('/expenses?limit=5');
      setRecentExpenses(expensesResponse.data.data.expenses);

      // Calculate stats based on user role
      const expenses = expensesResponse.data.data.expenses;
      const allExpensesResponse = await api.get('/expenses?limit=1000');
      const allExpenses = allExpensesResponse.data.data.expenses;

      let calculatedStats = {
        totalExpenses: allExpenses.length,
        pendingApprovals: allExpenses.filter(e => e.status === 'pending_approval').length,
        approvedExpenses: allExpenses.filter(e => e.status === 'approved').length,
        totalAmount: allExpenses.reduce((sum, e) => sum + e.amountInBaseCurrency, 0),
        teamMembers: 0
      };

      // If user is admin or manager, get team members count
      if (user.role === 'admin' || user.role === 'manager') {
        try {
          const usersResponse = await api.get('/users');
          calculatedStats.teamMembers = usersResponse.data.data.users.length;
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending_approval':
        return 'warning';
      case 'submitted':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount, currency = user?.company?.currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Welcome Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your expenses today.
        </Typography>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                  <CreditCard />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalExpenses}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 40, height: 40 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approvals
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.pendingApprovals}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 40, height: 40 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Approved Expenses
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.approvedExpenses}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 40, height: 40 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(stats.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button
              component={RouterLink}
              to="/expenses/new"
              variant="outlined"
              fullWidth
              startIcon={<Add />}
              sx={{ p: 1.5, justifyContent: 'flex-start' }}
            >
              Submit New Expense
            </Button>
          </Grid>
          
          {(user.role === 'admin' || user.role === 'manager') && (
            <Grid item xs={12} md={4}>
              <Button
                component={RouterLink}
                to="/approvals"
                variant="outlined"
                fullWidth
                startIcon={<Visibility />}
                sx={{ p: 1.5, justifyContent: 'flex-start' }}
              >
                Review Approvals
              </Button>
            </Grid>
          )}
          
          {user.role === 'admin' && (
            <Grid item xs={12} md={4}>
              <Button
                component={RouterLink}
                to="/users/new"
                variant="outlined"
                fullWidth
                startIcon={<People />}
                sx={{ p: 1.5, justifyContent: 'flex-start' }}
              >
                Add New User
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Recent Expenses */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Recent Expenses
            </Typography>
            <Button
              component={RouterLink}
              to="/expenses"
              variant="text"
              color="primary"
              size="small"
            >
              View all
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ p: 2 }}>
          {recentExpenses.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Warning sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No expenses found
              </Typography>
              <Button
                component={RouterLink}
                to="/expenses/new"
                variant="contained"
                color="primary"
                size="small"
              >
                Submit your first expense
              </Button>
            </Box>
          ) : (
            <Box>
              {recentExpenses.map((expense) => (
                <Card key={expense._id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {expense.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(expense.expenseDate).toLocaleDateString()} • {expense.category}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {formatCurrency(expense.amountInBaseCurrency)}
                        </Typography>
                        <Chip
                          label={expense.status.replace('_', ' ')}
                          color={getStatusColor(expense.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
