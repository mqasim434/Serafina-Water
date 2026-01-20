/**
 * Users Initialization
 * 
 * Creates default admin user if no users exist
 */

import * as usersService from './service.js';

/**
 * Initialize default admin user if no users exist
 * @returns {Promise<void>}
 */
export async function initializeDefaultAdmin() {
  try {
    const users = await usersService.loadUsers();
    
    // If no users exist, create default admin
    if (users.length === 0) {
      const defaultAdmin = {
        username: 'admin',
        password: 'admin', // Should be changed after first login
        email: 'admin@serafina.com',
        role: 'admin',
        displayName: 'Administrator',
        isActive: true,
      };
      
      await usersService.createUser(defaultAdmin, []);
      console.log('Default admin user created: admin/admin');
    }
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
}
