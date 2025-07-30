import { prisma } from './prisma';

interface InstagramConfig {
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface InstagramMention {
  id: string;
  username: string;
  fullName: string;
  profilePictureUrl: string;
  postId: string;
  postUrl: string;
  content: string;
  mediaUrls: string[];
  engagement: number;
  timestamp: Date;
}

interface InstagramDM {
  recipientId: string;
  message: string;
  code: string;
}

export class InstagramAPI {
  private config: InstagramConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: InstagramConfig) {
    this.config = config;
  }

  // Get business account information
  async getBusinessAccount() {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.businessAccountId}?fields=id,name,username,profile_picture_url&access_token=${this.config.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get Instagram business account:', error);
      throw error;
    }
  }

  // Get mentions and tags
  async getMentions(limit: number = 50): Promise<InstagramMention[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.businessAccountId}/tags?fields=id,username,full_name,profile_picture_url,media{id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count,timestamp}&limit=${limit}&access_token=${this.config.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const mentions: InstagramMention[] = [];
      
      for (const tag of data.data) {
        if (tag.media && tag.media.data) {
          for (const media of tag.media.data) {
            mentions.push({
              id: tag.id,
              username: tag.username,
              fullName: tag.full_name,
              profilePictureUrl: tag.profile_picture_url,
              postId: media.id,
              postUrl: media.permalink,
              content: media.caption || '',
              mediaUrls: media.media_type === 'VIDEO' ? [media.media_url] : [media.thumbnail_url || media.media_url],
              engagement: (media.like_count || 0) + (media.comments_count || 0),
              timestamp: new Date(media.timestamp),
            });
          }
        }
      }
      
      return mentions;
    } catch (error) {
      console.error('Failed to get Instagram mentions:', error);
      throw error;
    }
  }

  // Send DM to user
  async sendDM(dm: InstagramDM): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/messages?access_token=${this.config.accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: dm.recipientId },
            message: {
              text: dm.message,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Instagram DM error:', errorData);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send Instagram DM:', error);
      return false;
    }
  }

  // Subscribe to webhooks
  async subscribeToWebhooks(callbackUrl: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.businessAccountId}/subscribed_apps?access_token=${this.config.accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callback_url: callbackUrl,
            verify_token: this.config.webhookVerifyToken,
            fields: 'mentions,media',
          }),
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Failed to subscribe to Instagram webhooks:', error);
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
      if (event.entry && event.entry[0]?.changes) {
        for (const change of event.entry[0].changes) {
          if (change.field === 'mentions') {
            await this.handleMentionEvent(change.value);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process Instagram webhook:', error);
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
        console.log('No active merchant found for Instagram mention');
        return;
      }

      const settings = merchant.settings.ugcSettings as any;
      
      // Check if this is a random person (not a registered influencer)
      const influencer = await prisma.influencer.findFirst({
        where: {
          merchantId: merchant.id,
          OR: [
            { instagramHandle: mentionData.username },
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
      console.error('Failed to handle Instagram mention event:', error);
    }
  }

  private async handleInfluencerMention(merchantId: string, mentionData: any, influencer: any): Promise<void> {
    // Create UGC post for registered influencer
    await prisma.ugcPost.create({
      data: {
        merchantId,
        influencerId: influencer.id,
        platform: 'INSTAGRAM',
        postUrl: mentionData.postUrl,
        postId: mentionData.postId,
        content: mentionData.content,
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
    const discountCode = await prisma.discountCode.create({
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

Thanks for tagging us in your post! We love seeing our products in action! 💕

Here's a special discount code just for you:
🎫 ${code} (${discountValue}% off your next order)

Shop now: yoursite.com/discount/${code}

Thanks for the love! ❤️`;
  }
} 