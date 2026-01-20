/**
 * Settings Types
 * 
 * JSDoc type definitions for settings feature
 */

/**
 * Application settings
 * @typedef {Object} AppSettings
 * @property {number} bottlePrice - Default bottle price
 * @property {number} depositAmount - Deposit amount per bottle
 * @property {CompanyInfo} companyInfo - Company information
 * @property {string} defaultLanguage - Default language (en/ur)
 */

/**
 * Company information
 * @typedef {Object} CompanyInfo
 * @property {string} name - Company name
 * @property {string} [address] - Company address
 * @property {string} [phone] - Company phone
 * @property {string} [email] - Company email
 * @property {string} [website] - Company website
 */
