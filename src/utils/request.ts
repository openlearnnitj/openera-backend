import { Request } from 'express';

export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  browserInfo: {
    name?: string;
    version?: string;
    os?: string;
    platform?: string;
  };
  deviceInfo: {
    type?: string;
    vendor?: string;
    model?: string;
  };
}

export class RequestUtils {
  /**
   * Extract client IP address from request
   */
  static getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip'];
    
    if (typeof forwarded === 'string') {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim();
    }
    
    if (typeof realIP === 'string') {
      return realIP;
    }
    
    if (typeof cfConnectingIP === 'string') {
      return cfConnectingIP;
    }
    
    return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Extract user agent from request
   */
  static getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
  }

  /**
   * Parse browser information from user agent
   */
  static parseBrowserInfo(userAgent: string): ClientInfo['browserInfo'] {
    const browserInfo: ClientInfo['browserInfo'] = {};

    // Chrome
    if (userAgent.includes('Chrome')) {
      browserInfo.name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      browserInfo.name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo.name = 'Safari';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      browserInfo.name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }

    // Operating System
    if (userAgent.includes('Windows NT')) {
      browserInfo.os = 'Windows';
      if (userAgent.includes('Windows NT 10.0')) browserInfo.platform = 'Windows 10';
      else if (userAgent.includes('Windows NT 6.3')) browserInfo.platform = 'Windows 8.1';
      else if (userAgent.includes('Windows NT 6.2')) browserInfo.platform = 'Windows 8';
      else if (userAgent.includes('Windows NT 6.1')) browserInfo.platform = 'Windows 7';
    } else if (userAgent.includes('Mac OS X')) {
      browserInfo.os = 'macOS';
      const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
      if (match) browserInfo.platform = `macOS ${match[1].replace(/_/g, '.')}`;
    } else if (userAgent.includes('Linux')) {
      browserInfo.os = 'Linux';
      if (userAgent.includes('Ubuntu')) browserInfo.platform = 'Ubuntu';
      else if (userAgent.includes('Android')) browserInfo.platform = 'Android';
    } else if (userAgent.includes('iPhone')) {
      browserInfo.os = 'iOS';
      browserInfo.platform = 'iPhone';
    } else if (userAgent.includes('iPad')) {
      browserInfo.os = 'iOS';
      browserInfo.platform = 'iPad';
    }

    return browserInfo;
  }

  /**
   * Parse device information from user agent
   */
  static parseDeviceInfo(userAgent: string): ClientInfo['deviceInfo'] {
    const deviceInfo: ClientInfo['deviceInfo'] = {};

    // Mobile devices
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      deviceInfo.type = 'mobile';
      
      // Android devices
      if (userAgent.includes('Android')) {
        deviceInfo.vendor = 'Android';
        // Try to extract device model
        const match = userAgent.match(/;\s*(.*?)\s*Build/);
        if (match) deviceInfo.model = match[1];
      }
      
      // iPhone
      if (userAgent.includes('iPhone')) {
        deviceInfo.vendor = 'Apple';
        deviceInfo.model = 'iPhone';
      }
      
      // iPad
      if (userAgent.includes('iPad')) {
        deviceInfo.vendor = 'Apple';
        deviceInfo.model = 'iPad';
      }
    }
    // Tablet
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceInfo.type = 'tablet';
    }
    // Desktop
    else {
      deviceInfo.type = 'desktop';
    }

    return deviceInfo;
  }

  /**
   * Get comprehensive client information
   */
  static getClientInfo(req: Request): ClientInfo {
    const userAgent = this.getUserAgent(req);
    
    return {
      ipAddress: this.getClientIP(req),
      userAgent,
      browserInfo: this.parseBrowserInfo(userAgent),
      deviceInfo: this.parseDeviceInfo(userAgent),
    };
  }

  /**
   * Check if request is from a bot/crawler
   */
  static isBot(userAgent: string): boolean {
    const botPatterns = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /rogerbot/i,
      /linkedinbot/i,
      /embedly/i,
      /quora\s+link\s+preview/i,
      /showyoubot/i,
      /outbrain/i,
      /pinterest/i,
      /developers\.google\.com\/\+\/web\/snippet\//i,
      /crawler/i,
      /spider/i,
      /bot/i,
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Validate IP address format
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    return ipv6Regex.test(ip);
  }
}
