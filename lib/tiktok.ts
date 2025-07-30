import { prisma } from './prisma';

interface TikTokConfig {
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface TikTokMention {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  videoId: string;
  videoUrl: string;
  description: string;
  mediaUrls: string[];
  engagement: number;
  timestamp: Date;
}

interface TikTokDM {
  recipientId: string;
  message: string;
  code: string;
}

export class TikTokAPI {
  private config: TikTokConfig;
  private baseUrl = 'https://open.tiktokapis.com/v2';

  constructor(config: TikTokConfig) {
    this.config = config;
  }

  // Get business account information
  async getBusinessAccount() {
    try {
      const response = await fetch(
        `${this.baseUrl}/user/info/`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get TikTok business account:', error);
      throw error;
    }
  }

  // Get mentions and tags (TikTok API for mentions)
  async getMentions(limit: number = 50): Promise<TikTokMention[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/video/query/?fields=["video_id","title","cover_image_url","video_description","like_count","comment_count","share_count","create_time"]&max_count=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`);
      }
      
      await response.json(); // Response not used in this simulation
      const mentions: TikTokMention[] = [];
      
      // Note: TikTok API doesn't directly provide mentions like Instagram
      // This would need to be implemented with hashtag monitoring or manual detection
      // For now, we'll simulate the structure
      
      return mentions;
    } catch (error) {
      console.error('Failed to get TikTok mentions:', error);
      throw error;
    }
  }

  // Send DM to user (TikTok doesn't have direct DM API, would need alternative)
  async sendDM(dm: TikTokDM): Promise<boolean> {
    try {
      // TikTok doesn't provide direct DM API like Instagram
      // Alternative approaches:
      // 1. Comment on their video with the code
      // 2. Use TikTok's business messaging features
      // 3. Send email if available
      
      console.log(`TikTok DM simulation: Sending code ${dm.code} to ${dm.recipientId}`);
      console.log(`Message: ${dm.message}`);
      
      // For now, we'll simulate success
      // In production, this would integrate with TikTok's business messaging
      return true;
    } catch (error) {
      console.error('Failed to send TikTok DM:', error);
      return false;
    }
  }

  // Subscribe to webhooks (TikTok webhook setup)
  async subscribeToWebhooks(callbackUrl: string): Promise<boolean> {
    try {
      // TikTok webhook subscription would be done through their developer portal
      // This is a simulation of the process
      console.log(`Subscribing to TikTok webhooks with callback: ${callbackUrl}`);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to TikTok webhooks:', error);
      return false;
    }
  }

  // Verify webhook
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  // Process webhook event
  async processWebhookEvent(event: any): Promise<void> {
    try {
      // TikTok webhook structure would be different from Instagram
      // This is a simulation based on expected structure
      if (event.event_type === 'mention' || event.event_type === 'tag') {
        await this.handleMentionEvent(event.data);
      }
    } catch (error) {
      console.error('Failed to process TikTok webhook:', error);
    }
  }

  private async handleMentionEvent(mentionData: any): Promise<void> {
    try {
      // Get merchant settings
      const merchant = await prisma.merchant.findFirst({
        where: { isActive: true },
        include: { settings: true },
      });

      if (!merchant || !merchant.settings) {
        console.log('No active merchant found for TikTok mention');
        return;
      }

      const settings = merchant.settings.ugcSettings as any;
      
      // Check if this is a random person (not a registered influencer)
      const influencer = await prisma.influencer.findFirst({
        where: {
          merchantId: merchant.id,
          OR: [
            { tiktokHandle: mentionData.username },
            { email: mentionData.email },
          ],
        },
      });

      if (influencer) {
        // This is a registered influencer - handle differently
        await this.handleInfluencerMention(merchant.id, mentionData, influencer);
      } else {
        // This is a random person - send reward DM
        await this.handleRandomPersonMention(merchant.id, mentionData, settings);
      }
    } catch (error) {
      console.error('Failed to handle TikTok mention event:', error);
    }
  }

  private async handleInfluencerMention(merchantId: string, mentionData: any, influencer: any): Promise<void> {
    // Create UGC post for registered influencer
    await prisma.ugcPost.create({
      data: {
        merchantId,
        influencerId: influencer.id,
        platform: 'TIKTOK',
        postUrl: mentionData.videoUrl,
        postId: mentionData.videoId,
        content: mentionData.description,
        mediaUrls: mentionData.mediaUrls,
        engagement: mentionData.engagement,
        isApproved: false, // Require manual approval for influencers
        isRewarded: false,
      },
    });

    console.log(`Created UGC post for influencer ${influencer.name}`);
  }

  private async handleRandomPersonMention(merchantId: string, mentionData: any, settings: any): Promise<void> {
    // Check engagement threshold
    if (mentionData.engagement < settings.minEngagement) {
      console.log(`Engagement too low for random mention: ${mentionData.engagement}`);
      return;
    }

    // Check daily code limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const codesSentToday = await prisma.discountCode.count({
      where: {
        merchantId,
        influencerId: null, // Random people don't have influencerId
        createdAt: {
          gte: today,
        },
      },
    });

    if (codesSentToday >= settings.maxCodesPerDay) {
      console.log('Daily code limit reached for random mentions');
      return;
    }

    // Generate unique discount code
    const code = this.generateRandomCode(mentionData.username, settings.discountValue);
    
    // Create discount code
    await prisma.discountCode.create({
      data: {
        merchantId,
        code,
        discountType: settings.discountType,
        discountValue: settings.discountValue,
        usageLimit: settings.discountUsageLimit,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send DM with discount code
    const message = this.createRandomPersonMessage(code, settings.discountValue);
    const dmSent = await this.sendDM({
      recipientId: mentionData.id,
      message,
      code,
    });

    if (dmSent) {
      console.log(`Sent discount code ${code} to random person @${mentionData.username}`);
    }
  }

  private generateRandomCode(username: string, discountValue: number): string {
    const firstName = username.charAt(0).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${firstName}${discountValue}${random}`;
  }

  private createRandomPersonMessage(code: string, discountValue: number): string {
    return `Hey! 👋

Thanks for tagging us in your video! We love seeing our products in action! 💕

Here's a special discount code just for you:
🎫 ${code} (${discountValue}% off your next order)

Shop now: yoursite.com/discount/${code}

Thanks for the love! ❤️`;
  }
} 