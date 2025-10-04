const express = require('express');
const axios = require('axios');

const router = express.Router();

// @route   GET /api/countries
// @desc    Get list of countries with their currencies
// @access  Public
router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    const countries = response.data;
    
    const formattedCountries = countries
      .filter(country => country.currencies && Object.keys(country.currencies).length > 0)
      .map(country => {
        const currencyCode = Object.keys(country.currencies)[0];
        const currencyInfo = country.currencies[currencyCode];
        
        return {
          name: country.name.common,
          officialName: country.name.official,
          currency: currencyCode,
          currencySymbol: currencyInfo.symbol || currencyCode,
          currencyName: currencyInfo.name
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      status: 'success',
      data: { countries: formattedCountries }
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch countries'
    });
  }
});

module.exports = router;
