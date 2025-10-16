/**
 * Advanced Stealth Engine for Browser Automation
 */

import { Page } from 'puppeteer';
import { logger } from '@/lib/utils/logger';

export class AdvancedStealthEngine {
  private fingerprintCache: Map<string, any>;
  private behaviorProfiles: any[];
  private mouseMovements: Array<{ x: number; y: number }>;

  constructor() {
    this.fingerprintCache = new Map();
    this.behaviorProfiles = [];
    this.mouseMovements = [];
    logger.info('Advanced Stealth Engine initialized');
  }

  async enhanceStealth(page: Page): Promise<void> {
    const stealthScripts = [
      this.overrideWebdriver(),
      this.mockPlugins(),
      this.spoofTimezone(),
      this.mockWebGL(),
      this.overridePermissions(),
      this.randomizeMouseMovements(),
      this.spoofAudioContext(),
      this.mockBattery(),
      this.overrideLanguage(),
      this.mockHardwareConcurrency(),
      this.overrideChromeRuntime(),
    ];

    for (const script of stealthScripts) {
      try {
        await page.evaluateOnNewDocument(script);
      } catch (error) {
        logger.warning(`Stealth script failed: ${error}`);
      }
    }

    await this.simulateHumanBehavior(page);
  }

  private overrideWebdriver(): string {
    return `
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    `;
  }

  private mockPlugins(): string {
    return `
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          },
          {
            0: {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format"},
            description: "Portable Document Format",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer"
          }
        ],
      });
    `;
  }

  private spoofTimezone(): string {
    return `
      const originalDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(...args) {
        const instance = new originalDateTimeFormat(...args);
        const originalResolvedOptions = instance.resolvedOptions;
        instance.resolvedOptions = function() {
          const options = originalResolvedOptions.call(this);
          options.timeZone = 'America/New_York';
          return options;
        };
        return instance;
      };
    `;
  }

  private mockWebGL(): string {
    return `
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.call(this, parameter);
      };
    `;
  }

  private overridePermissions(): string {
    return `
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    `;
  }

  private randomizeMouseMovements(): string {
    return `
      const originalPageX = Object.getOwnPropertyDescriptor(MouseEvent.prototype, 'pageX');
      Object.defineProperty(MouseEvent.prototype, 'pageX', {
        get: function() {
          return originalPageX.get.call(this) + (Math.random() * 2 - 1);
        }
      });
    `;
  }

  private spoofAudioContext(): string {
    return `
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function() {
        const result = originalGetChannelData.apply(this, arguments);
        for (let i = 0; i < result.length; i++) {
          result[i] += (Math.random() * 0.0001) - 0.00005;
        }
        return result;
      };
    `;
  }

  private mockBattery(): string {
    return `
      Object.defineProperty(navigator, 'getBattery', {
        get: () => () => Promise.resolve({
          level: 0.85,
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true
        })
      });
    `;
  }

  private overrideLanguage(): string {
    return `
      Object.defineProperty(navigator, 'language', {
        get: () => 'en-US'
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    `;
  }

  private mockHardwareConcurrency(): string {
    return `
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4
      });
    `;
  }

  private overrideChromeRuntime(): string {
    return `
      window.chrome = {
        runtime: {}
      };
    `;
  }

  private async simulateHumanBehavior(page: Page): Promise<void> {
    try {
      await this.randomMouseMovements(page);
      await this.randomScrolling(page);
      await this.delay(Math.random() * 3000 + 2000);
    } catch (error) {
      logger.warning(`Human behavior simulation failed: ${error}`);
    }
  }

  private async randomMouseMovements(page: Page): Promise<void> {
    try {
      const viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));

      const points = this.generateBezierCurve(
        { x: Math.floor(Math.random() * (viewport.width / 4)), y: Math.floor(Math.random() * (viewport.height / 4)) },
        { x: Math.floor(Math.random() * (viewport.width / 4)) + (3 * viewport.width / 4), y: Math.floor(Math.random() * (viewport.height / 4)) + (3 * viewport.height / 4) },
        20
      );

      for (const point of points) {
        await page.mouse.move(point.x, point.y);
        await this.delay(Math.random() * 40 + 10);
      }
    } catch (error) {
      logger.warning(`Mouse movement simulation failed: ${error}`);
    }
  }

  private generateBezierCurve(
    start: { x: number; y: number },
    end: { x: number; y: number },
    numPoints: number = 20
  ): Array<{ x: number; y: number }> {
    const control1 = {
      x: Math.floor(Math.random() * Math.abs(end.x - start.x)) + Math.min(start.x, end.x),
      y: Math.floor(Math.random() * Math.abs(end.y - start.y)) + Math.min(start.y, end.y),
    };
    const control2 = {
      x: Math.floor(Math.random() * Math.abs(end.x - start.x)) + Math.min(start.x, end.x),
      y: Math.floor(Math.random() * Math.abs(end.y - start.y)) + Math.min(start.y, end.y),
    };

    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x =
        Math.pow(1 - t, 3) * start.x +
        3 * Math.pow(1 - t, 2) * t * control1.x +
        3 * (1 - t) * Math.pow(t, 2) * control2.x +
        Math.pow(t, 3) * end.x;
      const y =
        Math.pow(1 - t, 3) * start.y +
        3 * Math.pow(1 - t, 2) * t * control1.y +
        3 * (1 - t) * Math.pow(t, 2) * control2.y +
        Math.pow(t, 3) * end.y;
      points.push({ x: Math.floor(x), y: Math.floor(y) });
    }

    return points;
  }

  private async randomScrolling(page: Page): Promise<void> {
    try {
      const scrollAmount = Math.floor(Math.random() * 400 + 100);
      const scrollDirection = Math.random() > 0.5 ? 1 : -1;

      await page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount * scrollDirection);

      await this.delay(Math.random() * 1500 + 500);
    } catch (error) {
      logger.warning(`Scroll simulation failed: ${error}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}