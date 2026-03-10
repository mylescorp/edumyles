/**
 * WorkOS Integration Service
 * 
 * This module provides WorkOS SSO integration including:
 * - Authentication flow management
 * - User provisioning and synchronization
 * - Organization management
 * - Session handling
 * - Token management
 */

export interface WorkOSConfig {
  clientId: string;
  apiKey: string;
  redirectUri: string;
  organizationId?: string;
  environment: 'production' | 'development';
}

export interface WorkOSUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  organizations: WorkOSOrganization[];
  profilePictureUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOSOrganization {
  id: string;
  name: string;
  domain: string;
  role: string;
  permissions: string[];
}

export interface WorkOSSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: WorkOSUser;
  organization?: WorkOSOrganization;
}

export interface WorkOSAuthResponse {
  user: WorkOSUser;
  session: WorkOSSession;
}

/**
 * WorkOS Service Class
 */
export class WorkOSService {
  private static instance: WorkOSService;
  private config: WorkOSConfig | null = null;
  private currentSession: WorkOSSession | null = null;
  
  private constructor() {}
  
  static getInstance(): WorkOSService {
    if (!WorkOSService.instance) {
      WorkOSService.instance = new WorkOSService();
    }
    return WorkOSService.instance;
  }
  
  /**
   * Initialize WorkOS configuration
   */
  initialize(config: WorkOSConfig): void {
    this.config = config;
    
    // Load session from localStorage if available
    this.loadSessionFromStorage();
  }
  
  /**
   * Get WorkOS authorization URL
   */
  getAuthorizationUrl(): string {
    if (!this.config) {
      throw new Error('WorkOS not configured');
    }
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'profile email organizations',
      state: this.generateState(),
    });
    
    if (this.config.organizationId) {
      params.append('organization', this.config.organizationId);
    }
    
    const baseUrl = this.config.environment === 'production' 
      ? 'https://api.workos.com/sso/authorize'
      : 'https://api.workos.com/sso/authorize';
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<WorkOSAuthResponse> {
    if (!this.config) {
      throw new Error('WorkOS not configured');
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await this.fetchToken(code);
      
      // Get user information
      const userInfo = await this.fetchUserInfo(tokenResponse.access_token);
      
      // Get organization information
      const organizations = await this.fetchUserOrganizations(tokenResponse.access_token);
      
      // Create user object
      const user: WorkOSUser = {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        role: userInfo.role || 'member',
        permissions: userInfo.permissions || [],
        organizations,
        profilePictureUrl: userInfo.profile_picture_url,
        lastLoginAt: new Date().toISOString(),
        createdAt: userInfo.created_at,
        updatedAt: userInfo.updated_at,
      };
      
      // Create session
      const session: WorkOSSession = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
        user,
        organization: organizations.find(org => org.id === this.config?.organizationId),
      };
      
      // Store session
      this.currentSession = session;
      this.saveSessionToStorage();
      
      return { user, session };
    } catch (error) {
      console.error('WorkOS token exchange failed:', error);
      throw error;
    }
  }
  
  /**
   * Fetch access token from WorkOS
   */
  private async fetchToken(code: string): Promise<any> {
    const response = await fetch('https://api.workos.com/sso/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        client_id: this.config!.clientId,
        client_secret: this.config!.apiKey,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config!.redirectUri,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to exchange code: ${error.error || 'Unknown error'}`);
    }
    
    return response.json();
  }
  
  /**
   * Fetch user information from WorkOS
   */
  private async fetchUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.workos.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  }
  
  /**
   * Fetch user organizations from WorkOS
   */
  private async fetchUserOrganizations(accessToken: string): Promise<WorkOSOrganization[]> {
    const response = await fetch('https://api.workos.com/organizations', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }
    
    const data = await response.json();
    return data.organizations || [];
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.currentSession?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await fetch('https://api.workos.com/sso/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config!.apiKey}`,
        },
        body: JSON.stringify({
          client_id: this.config!.clientId,
          client_secret: this.config!.apiKey,
          grant_type: 'refresh_token',
          refresh_token: this.currentSession.refreshToken,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const tokenData = await response.json();
      
      // Update session
      this.currentSession.accessToken = tokenData.access_token;
      this.currentSession.expiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      if (tokenData.refresh_token) {
        this.currentSession.refreshToken = tokenData.refresh_token;
      }
      
      this.saveSessionToStorage();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear session and force re-authentication
      this.logout();
      throw error;
    }
  }
  
  /**
   * Get current session
   */
  getCurrentSession(): WorkOSSession | null {
    return this.currentSession;
  }
  
  /**
   * Get current user
   */
  getCurrentUser(): WorkOSUser | null {
    return this.currentSession?.user || null;
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.currentSession) {
      return false;
    }
    
    // Check if token is expired
    if (Date.now() >= this.currentSession.expiresAt) {
      // Try to refresh token
      if (this.currentSession.refreshToken) {
        this.refreshAccessToken().catch(() => {
          this.logout();
        });
        return false;
      } else {
        this.logout();
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Logout user
   */
  logout(): void {
    this.currentSession = null;
    localStorage.removeItem('workos_session');
    
    // Optionally revoke token with WorkOS
    if (this.currentSession?.accessToken) {
      this.revokeToken(this.currentSession.accessToken).catch(console.error);
    }
  }
  
  /**
   * Revoke access token
   */
  private async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch('https://api.workos.com/sso/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config!.apiKey}`,
        },
        body: JSON.stringify({
          token: accessToken,
        }),
      });
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  }
  
  /**
   * Save session to localStorage
   */
  private saveSessionToStorage(): void {
    if (this.currentSession) {
      localStorage.setItem('workos_session', JSON.stringify(this.currentSession));
    }
  }
  
  /**
   * Load session from localStorage
   */
  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem('workos_session');
      if (stored) {
        const session = JSON.parse(stored) as WorkOSSession;
        
        // Check if session is still valid
        if (Date.now() < session.expiresAt) {
          this.currentSession = session;
        } else {
          // Clear expired session
          localStorage.removeItem('workos_session');
        }
      }
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      localStorage.removeItem('workos_session');
    }
  }
  
  /**
   * Generate random state for OAuth flow
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Validate state parameter
   */
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }
  
  /**
   * Get user permissions from WorkOS
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    if (!this.currentSession) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`https://api.workos.com/users/${userId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      
      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return [];
    }
  }
  
  /**
   * Update user role in WorkOS
   */
  async updateUserRole(userId: string, role: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`https://api.workos.com/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
        body: JSON.stringify({
          role,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      // Update local session
      if (this.currentSession.user.id === userId) {
        this.currentSession.user.role = role;
        this.saveSessionToStorage();
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }
  
  /**
   * Create user in WorkOS
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    password?: string;
  }): Promise<WorkOSUser> {
    if (!this.currentSession) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch('https://api.workos.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create user: ${error.error || 'Unknown error'}`);
      }
      
      const createdUser = await response.json();
      
      return {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.first_name,
        lastName: createdUser.last_name,
        role: createdUser.role || 'member',
        permissions: createdUser.permissions || [],
        organizations: createdUser.organizations || [],
        profilePictureUrl: createdUser.profile_picture_url,
        createdAt: createdUser.created_at,
        updatedAt: createdUser.updated_at,
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }
  
  /**
   * Delete user from WorkOS
   */
  async deleteUser(userId: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`https://api.workos.com/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }
  
  /**
   * Sync user with local database
   */
  async syncUserWithDatabase(user: WorkOSUser): Promise<void> {
    // This would typically sync with your local database
    // For now, we'll just log the sync action
    console.log('Syncing user with database:', user);
    
    // In a real implementation, you would:
    // 1. Check if user exists in local database
    // 2. Create or update user record
    // 3. Sync roles and permissions
    // 4. Update last login timestamp
  }
}

// Export singleton instance
export const workos = WorkOSService.getInstance();

// Utility functions
export const initializeWorkOS = (config: WorkOSConfig) => {
  workos.initialize(config);
};

export const getWorkOSAuthUrl = () => {
  return workos.getAuthorizationUrl();
};

export const authenticateWithWorkOS = async (code: string) => {
  return workos.exchangeCodeForTokens(code);
};

export const getCurrentWorkOSUser = () => {
  return workos.getCurrentUser();
};

export const isWorkOSAuthenticated = () => {
  return workos.isAuthenticated();
};

export const logoutWorkOS = () => {
  workos.logout();
};
