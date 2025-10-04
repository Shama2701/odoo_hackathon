import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Save,
  Business,
  Public,
  AttachMoney,
  Settings,
  Person,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const CompanySettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: '',
    currencySymbol: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    settings: {
      allowMultiCurrency: true,
      requireReceipts: false,
      autoApproveUnder: 0,
      maxExpenseAmount: 10000,
      approvalWorkflow: 'sequential',
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    fetchCompanyData();
    fetchCountries();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies');
      const company = response.data.data.company;
      
      setFormData({
        name: company.name || '',
        country: company.country || '',
        currency: company.currency || '',
        currencySymbol: company.currencySymbol || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        settings: {
          allowMultiCurrency: company.settings?.allowMultiCurrency ?? true,
          requireReceipts: company.settings?.requireReceipts ?? false,
          autoApproveUnder: company.settings?.autoApproveUnder ?? 0,
          maxExpenseAmount: company.settings?.maxExpenseAmount ?? 10000,
          approvalWorkflow: company.settings?.approvalWorkflow || 'sequential',
        }
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to fetch company information');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await api.get('/countries');
      const countriesData = response.data.data.countries;
      setCountries(countriesData);
      
      // Extract unique currencies
      const uniqueCurrencies = [...new Set(countriesData.map(c => c.currency))];
      setCurrencies(uniqueCurrencies);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (error) setError(null);
  };

  const handleCountryChange = (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        country: newValue.name,
        currency: newValue.currency,
        currencySymbol: newValue.currencySymbol
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.country || !formData.currency) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await api.put('/companies', formData);
      
      toast.success('Company settings updated successfully');
      setError(null);
    } catch (error) {
      console.error('Error updating company:', error);
      const message = error.response?.data?.message || 'Failed to update company settings';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount, currency = formData.currency) => {
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
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Company Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your company information and expense management preferences
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Business sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Company Information
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Company Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Country */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    fullWidth
                    options={countries}
                    getOptionLabel={(option) => option.name}
                    value={countries.find(country => country.name === formData.country) || null}
                    onChange={handleCountryChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Country"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Public />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.currency} ({option.currencySymbol})
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>

                {/* Currency */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.currency}
                      label="Currency"
                      onChange={handleChange}
                      name="currency"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {currencies.map((currency) => (
                        <MenuItem key={currency} value={currency}>
                          {currency}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Currency Symbol */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Currency Symbol"
                    name="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    multiline
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Phone */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Website */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                  />
                </Grid>

                {/* Save Button */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Settings */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Settings sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Expense Settings
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.allowMultiCurrency}
                      onChange={handleChange}
                      name="settings.allowMultiCurrency"
                    />
                  }
                  label="Allow Multi-Currency Expenses"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.requireReceipts}
                      onChange={handleChange}
                      name="settings.requireReceipts"
                    />
                  }
                  label="Require Receipts"
                />

                <TextField
                  fullWidth
                  label="Auto-approve under amount"
                  name="settings.autoApproveUnder"
                  type="number"
                  value={formData.settings.autoApproveUnder}
                  onChange={handleChange}
                  sx={{ mt: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Expenses under this amount will be auto-approved"
                />

                <TextField
                  fullWidth
                  label="Maximum expense amount"
                  name="settings.maxExpenseAmount"
                  type="number"
                  value={formData.settings.maxExpenseAmount}
                  onChange={handleChange}
                  sx={{ mt: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Maximum amount allowed for a single expense"
                />

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Approval Workflow</InputLabel>
                  <Select
                    value={formData.settings.approvalWorkflow}
                    label="Approval Workflow"
                    onChange={handleChange}
                    name="settings.approvalWorkflow"
                  >
                    <MenuItem value="sequential">Sequential</MenuItem>
                    <MenuItem value="parallel">Parallel</MenuItem>
                    <MenuItem value="conditional">Conditional</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Company Summary */}
          <Card elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Company Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Company:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.name || 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Country:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.country || 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Currency:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.currency} ({formData.currencySymbol})
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Admin:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.name}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Auto-approve:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(formData.settings.autoApproveUnder)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanySettings;
