import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify';
import { generateDiscountLink } from '@/utils/discount-links';

export interface CodeGenerationOptions {
  influencerId: string;
  merchantId: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit?: number;
  expiresAt?: Date;
  autoCreateShopify?: boolean;
  performanceBased?: boolean;
  aiOptimized?: boolean;
  dynamicPricing?: boolean;
  seasonalAdjustment?: boolean;
}

export interface CodePerformance {
  codeId: string;
  usageCount: number;
  revenueGenerated: number;
  conversionRate: number;
  averageOrderValue: number;
  timeToFirstUse: number; // in hours
  customerRetentionRate: number;
  socialEngagementScore: number;
}

export interface AICodeOptimization {
  optimalDiscountValue: number;
  optimalUsageLimit: number;
  optimalExpiryDays: number;
  recommendedStrategy: 'high-value' | 'volume' | 'limited' | 'seasonal';
  confidenceScore: number;
  reasoning: string[];
}

export class AutomatedCodeGenerator {
  private merchantId: string;
  private shopifyAPI?: ShopifyAPI;

  constructor(merchantId: string, accessToken?: string, shopDomain?: string) {
    this.merchantId = merchantId;
    if (accessToken && shopDomain) {
      this.shopifyAPI = new ShopifyAPI(accessToken, shopDomain);
    }
  }

  /**
   * Generate AI-optimized discount codes based on comprehensive performance analysis
   */
  async generateAIOptimizedCodes(influencerId: string, options: Partial<CodeGenerationOptions> = {}) {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        discountCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        ugcPosts: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // AI-powered optimization analysis
    const aiOptimization = await this.performAIOptimization(influencerId, influencer);
    
    // Generate codes based on AI recommendations
    const codes = await Promise.all([
      this.generateStrategyCode(influencer, aiOptimization, 'high-value'),
      this.generateStrategyCode(influencer, aiOptimization, 'volume'),
      this.generateStrategyCode(influencer, aiOptimization, 'limited'),
      this.generateSeasonalCode(influencer, aiOptimization),
    ]);

    return {
      codes,
      aiOptimization,
      influencerPerformance: await this.getInfluencerPerformanceMetrics(influencerId),
    };
  }

  /**
   * Perform AI-powered optimization analysis
   */
  private async performAIOptimization(influencerId: string, influencer: any): Promise<AICodeOptimization> {
    const performance = await this.analyzeInfluencerPerformance(influencerId);
    const marketConditions = await this.analyzeMarketConditions();
    const seasonalFactors = this.analyzeSeasonalFactors();
    const competitorAnalysis = await this.analyzeCompetitorPricing();

    // AI decision logic
    const avgUsage = performance.reduce((sum, p) => sum + p.usageCount, 0) / performance.length || 0;
    const avgRevenue = performance.reduce((sum, p) => sum + p.revenueGenerated, 0) / performance.length || 0;
    const avgConversion = performance.reduce((sum, p) => sum + p.conversionRate, 0) / performance.length || 0;
    const avgRetention = performance.reduce((sum, p) => sum + p.customerRetentionRate, 0) / performance.length || 0;

    // Determine optimal discount value using AI logic
    let optimalDiscountValue = 20; // Default 20%
    let confidenceScore = 0.7;
    const reasoning: string[] = [];

    if (avgRevenue > 2000) {
      optimalDiscountValue = 25;
      reasoning.push('High revenue performance indicates premium positioning');
      confidenceScore += 0.1;
    } else if (avgRevenue < 500) {
      optimalDiscountValue = 15;
      reasoning.push('Lower revenue suggests need for more aggressive pricing');
      confidenceScore += 0.1;
    }

    if (avgConversion > 0.8) {
      optimalDiscountValue += 2;
      reasoning.push('High conversion rate allows for premium pricing');
      confidenceScore += 0.1;
    }

    if (avgRetention > 0.7) {
      optimalDiscountValue += 1;
      reasoning.push('Strong customer retention supports higher value');
      confidenceScore += 0.1;
    }

    // Seasonal adjustments
    if (seasonalFactors.isHolidaySeason) {
      optimalDiscountValue += 5;
      reasoning.push('Holiday season allows for higher discounts');
      confidenceScore += 0.1;
    }

    // Market condition adjustments
    if (competitorAnalysis.averageDiscount > optimalDiscountValue) {
      optimalDiscountValue = Math.min(optimalDiscountValue + 3, 30);
      reasoning.push('Competitive pricing adjustment');
      confidenceScore += 0.05;
    }

    // Determine optimal usage limit
    let optimalUsageLimit = Math.max(50, Math.round(avgUsage * 1.5));
    if (avgConversion > 0.8) {
      optimalUsageLimit = Math.round(optimalUsageLimit * 1.2);
      reasoning.push('High conversion rate supports higher usage limits');
    }

    // Determine optimal expiry period
    let optimalExpiryDays = 30;
    if (avgUsage > 100) {
      optimalExpiryDays = 45;
      reasoning.push('High usage patterns support longer expiry periods');
    } else if (avgUsage < 20) {
      optimalExpiryDays = 14;
      reasoning.push('Lower usage suggests shorter expiry for urgency');
    }

    // Determine recommended strategy
    let recommendedStrategy: 'high-value' | 'volume' | 'limited' | 'seasonal' = 'volume';
    if (avgRevenue > 1500 && avgConversion > 0.6) {
      recommendedStrategy = 'high-value';
      reasoning.push('High revenue and conversion suggest premium strategy');
    } else if (avgUsage > 200) {
      recommendedStrategy = 'volume';
      reasoning.push('High usage patterns suggest volume strategy');
    } else if (seasonalFactors.isHolidaySeason) {
      recommendedStrategy = 'seasonal';
      reasoning.push('Seasonal timing suggests limited-time strategy');
    }

    return {
      optimalDiscountValue,
      optimalUsageLimit,
      optimalExpiryDays,
      recommendedStrategy,
      confidenceScore: Math.min(1.0, confidenceScore),
      reasoning,
    };
  }

  /**
   * Analyze market conditions and competitor pricing
   */
  private async analyzeMarketConditions() {
    // Simulate market analysis
    const currentMonth = new Date().getMonth();
    const isHolidaySeason = currentMonth >= 10 || currentMonth <= 1; // Nov-Feb
    const isBackToSchool = currentMonth >= 7 && currentMonth <= 9; // Aug-Oct

    return {
      isHolidaySeason,
      isBackToSchool,
      marketDemand: isHolidaySeason ? 'high' : 'normal',
      priceElasticity: isHolidaySeason ? 0.8 : 1.2,
    };
  }

  /**
   * Analyze seasonal factors
   */
  private analyzeSeasonalFactors() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    return {
      isHolidaySeason: currentMonth >= 10 || currentMonth <= 1,
      isBlackFriday: currentMonth === 10 && currentDay >= 20,
      isCyberMonday: currentMonth === 11 && currentDay <= 5,
      isValentinesDay: currentMonth === 1 && currentDay >= 10 && currentDay <= 15,
      isSummerSale: currentMonth >= 5 && currentMonth <= 7,
    };
  }

  /**
   * Analyze competitor pricing (simulated)
   */
  private async analyzeCompetitorPricing() {
    // Simulate competitor analysis
    return {
      averageDiscount: 18.5,
      priceRange: { min: 10, max: 30 },
      marketPosition: 'competitive',
    };
  }

  /**
   * Generate strategy-specific codes
   */
  private async generateStrategyCode(influencer: any, optimization: AICodeOptimization, strategy: string) {
    let discountValue = optimization.optimalDiscountValue;
    let usageLimit = optimization.optimalUsageLimit;
    let expiryDays = optimization.optimalExpiryDays;

    switch (strategy) {
      case 'high-value':
        discountValue = Math.round(discountValue * 1.2);
        usageLimit = Math.round(usageLimit * 0.7);
        expiryDays = Math.round(expiryDays * 0.8);
        break;
      case 'volume':
        discountValue = Math.round(discountValue * 0.9);
        usageLimit = Math.round(usageLimit * 1.5);
        expiryDays = Math.round(expiryDays * 1.2);
        break;
      case 'limited':
        discountValue = Math.round(discountValue * 1.3);
        usageLimit = Math.round(usageLimit * 0.4);
        expiryDays = 7; // Short expiry for urgency
        break;
    }

    const code = await this.createDiscountCode({
      influencerId: influencer.id,
      merchantId: this.merchantId,
      discountType: 'PERCENTAGE',
      discountValue,
      usageLimit,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      autoCreateShopify: true,
    });

    return {
      ...code,
      strategy,
      aiOptimized: true,
      confidenceScore: optimization.confidenceScore,
    };
  }

  /**
   * Generate seasonal codes
   */
  private async generateSeasonalCode(influencer: any, optimization: AICodeOptimization) {
    const seasonalFactors = this.analyzeSeasonalFactors();
    
    if (!seasonalFactors.isHolidaySeason && !seasonalFactors.isBlackFriday && 
        !seasonalFactors.isCyberMonday && !seasonalFactors.isValentinesDay) {
      return null; // No seasonal code needed
    }

    let discountValue = optimization.optimalDiscountValue;
    let usageLimit = optimization.optimalUsageLimit;
    let expiryDays = 14; // Short expiry for seasonal urgency

    if (seasonalFactors.isBlackFriday || seasonalFactors.isCyberMonday) {
      discountValue += 10;
      usageLimit = Math.round(usageLimit * 2);
    } else if (seasonalFactors.isHolidaySeason) {
      discountValue += 5;
      usageLimit = Math.round(usageLimit * 1.5);
    }

    const code = await this.createDiscountCode({
      influencerId: influencer.id,
      merchantId: this.merchantId,
      discountType: 'PERCENTAGE',
      discountValue,
      usageLimit,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      autoCreateShopify: true,
    });

    return {
      ...code,
      strategy: 'seasonal',
      aiOptimized: true,
      seasonalFactor: this.getSeasonalFactorName(seasonalFactors),
    };
  }

  /**
   * Get seasonal factor name
   */
  private getSeasonalFactorName(factors: any): string {
    if (factors.isBlackFriday) return 'Black Friday';
    if (factors.isCyberMonday) return 'Cyber Monday';
    if (factors.isValentinesDay) return 'Valentine\'s Day';
    if (factors.isHolidaySeason) return 'Holiday Season';
    if (factors.isSummerSale) return 'Summer Sale';
    return 'Seasonal';
  }

  /**
   * Get comprehensive influencer performance metrics
   */
  private async getInfluencerPerformanceMetrics(influencerId: string) {
    const codes = await prisma.discountCode.findMany({
      where: { influencerId },
      include: { ugcPost: true },
      orderBy: { createdAt: 'desc' },
    });

    const ugcPosts = await prisma.ugcPost.findMany({
      where: { influencerId, isApproved: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = codes.reduce((sum, code) => sum + (code.usageCount * code.discountValue), 0);
    const totalEngagement = ugcPosts.reduce((sum, post) => sum + post.engagement, 0);
    const averageEngagement = ugcPosts.length > 0 ? totalEngagement / ugcPosts.length : 0;

    return {
      totalCodes: codes.length,
      activeCodes: codes.filter(c => c.isActive).length,
      totalUsage: codes.reduce((sum, c) => sum + c.usageCount, 0),
      totalRevenue,
      totalUgcPosts: ugcPosts.length,
      totalEngagement,
      averageEngagement,
      conversionRate: codes.length > 0 ? codes.reduce((sum, c) => sum + c.usageCount, 0) / codes.reduce((sum, c) => sum + (c.usageLimit || 100), 0) : 0,
    };
  }

  /**
   * Analyze influencer performance to determine optimal code settings
   */
  private async analyzeInfluencerPerformance(influencerId: string) {
    const codes = await prisma.discountCode.findMany({
      where: { influencerId },
      include: { ugcPost: true },
      orderBy: { createdAt: 'desc' },
    });

    const performance: CodePerformance[] = codes.map(code => {
      const timeToFirstUse = code.usageCount > 0 
        ? (new Date().getTime() - new Date(code.createdAt).getTime()) / (1000 * 60 * 60)
        : 0;

      // Calculate customer retention (simplified)
      const customerRetentionRate = code.usageCount > 0 ? Math.min(0.9, code.usageCount / 100) : 0;
      
      // Calculate social engagement score
      const socialEngagementScore = code.ugcPost ? code.ugcPost.engagement : 0;

      return {
        codeId: code.id,
        usageCount: code.usageCount,
        revenueGenerated: code.usageCount * code.discountValue,
        conversionRate: code.usageCount / (code.usageLimit || 100),
        averageOrderValue: code.discountValue,
        timeToFirstUse,
        customerRetentionRate,
        socialEngagementScore,
      };
    });

    return performance;
  }

  /**
   * Calculate optimal settings based on performance analysis
   */
  private calculateOptimalSettings(performance: CodePerformance[], influencer: any) {
    const avgUsage = performance.reduce((sum, p) => sum + p.usageCount, 0) / performance.length || 0;
    const avgRevenue = performance.reduce((sum, p) => sum + p.revenueGenerated, 0) / performance.length || 0;
    const avgConversion = performance.reduce((sum, p) => sum + p.conversionRate, 0) / performance.length || 0;

    // Determine optimal discount value based on performance
    let optimalDiscountValue = 20; // Default 20%
    if (avgRevenue > 1000) {
      optimalDiscountValue = 25; // High performers get higher discounts
    } else if (avgRevenue < 100) {
      optimalDiscountValue = 15; // Low performers get lower discounts
    }

    // Determine optimal usage limit
    let optimalUsageLimit = Math.max(50, Math.round(avgUsage * 1.5));
    if (avgConversion > 0.8) {
      optimalUsageLimit = Math.round(optimalUsageLimit * 1.2); // High conversion = higher limit
    }

    return {
      discountValue: optimalDiscountValue,
      usageLimit: optimalUsageLimit,
      discountType: 'PERCENTAGE' as const,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  /**
   * Generate high-value code for maximum revenue
   */
  private async generateHighValueCode(influencer: any, settings: any) {
    const code = await this.createDiscountCode({
      influencerId: influencer.id,
      merchantId: this.merchantId,
      discountType: settings.discountType,
      discountValue: settings.discountValue,
      usageLimit: Math.round(settings.usageLimit * 0.8), // Lower limit for higher value
      expiresAt: settings.expiresAt,
      autoCreateShopify: true,
    });

    return {
      ...code,
      strategy: 'high-value',
      description: 'Optimized for maximum revenue per use',
    };
  }

  /**
   * Generate volume code for maximum reach
   */
  private async generateVolumeCode(influencer: any, settings: any) {
    const code = await this.createDiscountCode({
      influencerId: influencer.id,
      merchantId: this.merchantId,
      discountType: settings.discountType,
      discountValue: Math.round(settings.discountValue * 0.8), // Lower discount for volume
      usageLimit: Math.round(settings.usageLimit * 1.5), // Higher limit for volume
      expiresAt: settings.expiresAt,
      autoCreateShopify: true,
    });

    return {
      ...code,
      strategy: 'volume',
      description: 'Optimized for maximum reach and usage',
    };
  }

  /**
   * Generate limited edition code for exclusivity
   */
  private async generateLimitedCode(influencer: any, settings: any) {
    const code = await this.createDiscountCode({
      influencerId: influencer.id,
      merchantId: this.merchantId,
      discountType: settings.discountType,
      discountValue: Math.round(settings.discountValue * 1.2), // Higher discount for exclusivity
      usageLimit: Math.round(settings.usageLimit * 0.3), // Very low limit for exclusivity
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for urgency
      autoCreateShopify: true,
    });

    return {
      ...code,
      strategy: 'limited',
      description: 'Limited edition for exclusivity and urgency',
    };
  }

  /**
   * Create a single discount code with Shopify integration
   */
  private async createDiscountCode(options: CodeGenerationOptions) {
    const { influencerId, merchantId, discountType, discountValue, usageLimit, expiresAt, autoCreateShopify } = options;

    // Get influencer details
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // Generate unique code
    const code = `${influencer.name}-${Date.now()}`;
    let shopifyPriceRuleId = null;

    // Create in Shopify if enabled
    if (autoCreateShopify && this.shopifyAPI) {
      try {
        const shopifyDiscount = await this.shopifyAPI.createDiscountCode(
          code,
          discountType === 'PERCENTAGE' ? 'percentage' : 'fixed_amount',
          discountValue,
          usageLimit,
          expiresAt
        );
        shopifyPriceRuleId = shopifyDiscount.id.toString();
        console.log(`Created Shopify discount code: ${code}`);
      } catch (error) {
        console.error('Failed to create Shopify discount code:', error);
      }
    }

    // Get merchant settings for link generation
    const merchantSettings = await prisma.merchantSettings.findUnique({
      where: { merchantId },
      select: { website: true, linkPattern: true },
    });

    // Create in database
    const discountCode = await prisma.discountCode.create({
      data: {
        merchantId,
        influencerId,
        code,
        codeType: 'INFLUENCER',
        discountType,
        discountValue,
        usageLimit,
        usageCount: 0,
        isActive: true,
        expiresAt,
        shopifyPriceRuleId,
      },
    });

    // Generate unique link
    const uniqueLink = generateDiscountLink(code, merchantSettings ? {
      website: merchantSettings.website || undefined,
      linkPattern: merchantSettings.linkPattern
    } : undefined);

    return {
      ...discountCode,
      uniqueLink,
    };
  }

  /**
   * Generate optimized discount codes based on influencer performance
   */
  async generateOptimizedCodes(influencerId: string, options: Partial<CodeGenerationOptions> = {}) {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        discountCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // Analyze performance to determine optimal settings
    const performance = await this.analyzeInfluencerPerformance(influencerId);
    const optimalSettings = this.calculateOptimalSettings(performance, influencer);

    // Generate multiple codes with different strategies
    const codes = await Promise.all([
      this.generateHighValueCode(influencer, optimalSettings),
      this.generateVolumeCode(influencer, optimalSettings),
      this.generateLimitedCode(influencer, optimalSettings),
    ]);

    return codes;
  }

  /**
   * Batch generate codes for multiple influencers
   */
  async batchGenerateCodes(influencerIds: string[], options: Partial<CodeGenerationOptions> = {}) {
    const results = [];

    for (const influencerId of influencerIds) {
      try {
        if (options.aiOptimized) {
          const result = await this.generateAIOptimizedCodes(influencerId, options);
          results.push({
            influencerId,
            success: true,
            ...result,
          });
        } else {
          const codes = await this.generateOptimizedCodes(influencerId, options);
          results.push({
            influencerId,
            success: true,
            codes,
          });
        }
      } catch (error) {
        results.push({
          influencerId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Auto-generate codes based on performance triggers
   */
  async autoGenerateBasedOnTriggers() {
    const influencers = await prisma.influencer.findMany({
      where: { 
        merchantId: this.merchantId,
        isActive: true,
      },
      include: {
        discountCodes: {
          where: { isActive: true },
        },
      },
    });

    const triggers = [];

    for (const influencer of influencers) {
      const activeCodes = influencer.discountCodes.length;
      const totalUsage = influencer.discountCodes.reduce((sum, code) => sum + code.usageCount, 0);

      // Trigger: No active codes
      if (activeCodes === 0) {
        triggers.push({
          influencerId: influencer.id,
          reason: 'no_active_codes',
          priority: 'high',
        });
      }

      // Trigger: High usage (80%+ of limit)
      const highUsageCodes = influencer.discountCodes.filter(code => 
        code.usageCount >= (code.usageLimit || 100) * 0.8
      );
      if (highUsageCodes.length > 0) {
        triggers.push({
          influencerId: influencer.id,
          reason: 'high_usage',
          priority: 'medium',
        });
      }

      // Trigger: Expiring soon (within 7 days)
      const expiringCodes = influencer.discountCodes.filter(code => {
        if (!code.expiresAt) return false;
        const daysUntilExpiry = (new Date(code.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 7;
      });
      if (expiringCodes.length > 0) {
        triggers.push({
          influencerId: influencer.id,
          reason: 'expiring_soon',
          priority: 'medium',
        });
      }

      // Trigger: High performer (above average usage)
      if (totalUsage > 500) {
        triggers.push({
          influencerId: influencer.id,
          reason: 'high_performer',
          priority: 'low',
        });
      }

      // Trigger: Seasonal opportunity
      const seasonalFactors = this.analyzeSeasonalFactors();
      if (seasonalFactors.isHolidaySeason || seasonalFactors.isBlackFriday || 
          seasonalFactors.isCyberMonday || seasonalFactors.isValentinesDay) {
        triggers.push({
          influencerId: influencer.id,
          reason: 'seasonal_opportunity',
          priority: 'high',
        });
      }
    }

    return triggers;
  }

  /**
   * Get code performance analytics
   */
  async getCodePerformanceAnalytics(influencerId?: string) {
    const whereClause = influencerId 
      ? { influencerId, merchantId: this.merchantId }
      : { merchantId: this.merchantId };

    const codes = await prisma.discountCode.findMany({
      where: whereClause,
      include: { influencer: true },
      orderBy: { createdAt: 'desc' },
    });

    const analytics = {
      totalCodes: codes.length,
      activeCodes: codes.filter(c => c.isActive).length,
      totalUsage: codes.reduce((sum, c) => sum + c.usageCount, 0),
      totalRevenue: codes.reduce((sum, c) => sum + (c.usageCount * c.discountValue), 0),
      averageUsage: codes.length > 0 ? codes.reduce((sum, c) => sum + c.usageCount, 0) / codes.length : 0,
      topPerformers: codes
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(code => ({
          code: code.code,
          influencer: code.influencer?.name || 'Unknown',
          usage: code.usageCount,
          revenue: code.usageCount * code.discountValue,
        })),
      aiOptimizationStats: {
        totalAIOptimized: codes.filter(c => (c as any).strategy).length,
        averageConfidenceScore: codes.length > 0 ? 
          codes.reduce((sum, c) => sum + ((c as any).confidenceScore || 0), 0) / codes.length : 0,
      },
    };

    return analytics;
  }
} 