'use client';

import { Page, Layout, Card, Text, Button, BlockStack, TextField, Select, Badge, Banner, Avatar, Tag } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { Settings, Users, Hash, Instagram, Save, MessageCircle, Shield, UserPlus, Activity, Globe, FileText, Download, CreditCard } from 'lucide-react';
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanSelectionModal } from '@/components/PlanSelectionModal';

export default function SettingsPage() {
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const [socialMediaAccounts] = useState<Array<{
    id: string;
    platform: string;
    username: string;
    displayName?: string;
    isActive: boolean;
  }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  
  // Handle OAuth results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success) {
      setSaveMessage(`✅ ${success === 'instagram_connected' ? 'Instagram' : 'TikTok'} connected successfully!`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setSaveMessage(`❌ Connection failed: ${error}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  // Edit mode states
  const [merchantEditMode, setMerchantEditMode] = useState(false);
  const [influencerEditMode, setInfluencerEditMode] = useState(false);
  const [ugcEditMode, setUgcEditMode] = useState(false);
  const [teamEditMode, setTeamEditMode] = useState(false);
  const [domainEditMode, setDomainEditMode] = useState(false);
  const [legalEditMode, setLegalEditMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    linkPattern: '/discount/{{code}}',
    socialMedia: {
      instagram: '',
      tiktok: '',
      twitter: '',
      youtube: '',
    },
    merchantSettings: {
      businessType: 'ECOMMERCE',
      currency: 'USD',
      timezone: 'UTC',
      language: 'EN',
      emailNotifications: 'ALL',
      smsNotifications: false,
    },
    discountSettings: {
      defaultPercentage: 20,
      maxPercentage: 50,
      minPercentage: 5,
      autoApprove: false,
    },
    commissionSettings: {
      defaultRate: 10,
      maxRate: 25,
      minRate: 5,
      autoPayout: false,
    },
    influencerSettings: {
      autoApprove: false,
      minFollowers: 1000,
      minEngagementRate: 2.0,
      maxInfluencers: 1000,
      minPayoutAmount: 50,
    },
    ugcSettings: {
      autoApprove: false,
      minEngagement: 100,
      requiredHashtags: [''],
      excludedWords: [''],
      codeDelayHours: 2,
      codeDelayMinutes: 0,
      maxCodesPerDay: 50,
      maxCodesPerInfluencer: 1,
      discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discountValue: 20,
      discountUsageLimit: 100,
    },
    payoutSettings: {
      autoPayout: false,
      payoutSchedule: 'WEEKLY' as 'WEEKLY' | 'MONTHLY' | 'MANUAL',
      minimumPayout: 50,
      stripeAccountId: '',
    },
    domainSettings: {
      customDomain: '',
    },
    legalSettings: {
      termsUrl: '',
      privacyUrl: '',
    },
    teamSettings: {
      members: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'OWNER' as 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
        },
        {
          id: '2',
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          role: 'MANAGER' as 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
        },
      ],
    },
  });

  useEffect(() => {
    fetchSettings();
    fetchInvoices();
  }, []);

  const fetchSettings = async () => {
    try {
      // Get the current shop from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop') || localStorage.getItem('shop');
      
      if (!shop) {
        console.error('No shop parameter found');
        return;
      }

      // First get the merchant by shop
      const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
      const merchantData = await merchantResponse.json();
      
      if (!merchantData.id) {
        console.error('Failed to fetch merchant data');
        return;
      }

      const merchantId = merchantData.id;
      
      // Use the settings data from merchant response if available, otherwise fetch from settings API
      let data;
      if (merchantData.settings) {
        data = merchantData.settings;
      } else {
        const response = await fetch('/api/settings', {
          headers: {
            'x-merchant-id': merchantId
          }
        });
        const settingsResponse = await response.json();
        data = settingsResponse.data || settingsResponse;
      }
      
      setFormData({
        name: data.name || '',
        email: data.email || '',
        website: data.website || '',
        linkPattern: data.linkPattern || '/discount/{{code}}',
        socialMedia: {
          instagram: data.socialMedia?.instagram || '',
          tiktok: data.socialMedia?.tiktok || '',
          twitter: data.socialMedia?.twitter || '',
          youtube: data.socialMedia?.youtube || '',
        },
        merchantSettings: {
          businessType: 'ECOMMERCE',
          currency: 'USD',
          timezone: 'UTC',
          language: 'EN',
          emailNotifications: 'ALL',
          smsNotifications: false,
        },
        discountSettings: {
          defaultPercentage: data.discountSettings?.defaultPercentage || 20,
          maxPercentage: data.discountSettings?.maxPercentage || 50,
          minPercentage: data.discountSettings?.minPercentage || 5,
          autoApprove: data.discountSettings?.autoApprove || false,
        },
        commissionSettings: {
          defaultRate: data.commissionSettings?.defaultRate || 10,
          maxRate: data.commissionSettings?.maxRate || 25,
          minRate: data.commissionSettings?.minRate || 5,
          autoPayout: data.commissionSettings?.autoPayout || false,
        },
        influencerSettings: {
          autoApprove: data.influencerSettings?.autoApprove || false,
          minFollowers: data.influencerSettings?.minFollowers || 1000,
          minEngagementRate: data.influencerSettings?.minEngagementRate || 2.0,
          maxInfluencers: data.influencerSettings?.maxInfluencers || 1000,
          minPayoutAmount: data.influencerSettings?.minPayoutAmount || 50,
        },
        ugcSettings: {
          autoApprove: data.ugcSettings?.autoApprove || false,
          minEngagement: data.ugcSettings?.minEngagement || 100,
          requiredHashtags: data.ugcSettings?.requiredHashtags || [''],
          excludedWords: data.ugcSettings?.excludedWords || [''],
          codeDelayHours: data.ugcSettings?.codeDelayHours || 2,
          codeDelayMinutes: data.ugcSettings?.codeDelayMinutes || 0,
          maxCodesPerDay: data.ugcSettings?.maxCodesPerDay || 50,
          maxCodesPerInfluencer: data.ugcSettings?.maxCodesPerInfluencer || 1,
          discountType: data.ugcSettings?.discountType || 'PERCENTAGE',
          discountValue: data.ugcSettings?.discountValue || 20,
          discountUsageLimit: data.ugcSettings?.discountUsageLimit || 100,
        },
        payoutSettings: {
          autoPayout: data.payoutSettings?.autoPayout || false,
          payoutSchedule: data.payoutSettings?.payoutSchedule || 'WEEKLY',
          minimumPayout: data.payoutSettings?.minimumPayout || 50,
          stripeAccountId: data.payoutSettings?.stripeAccountId || '',
        },
        domainSettings: {
          customDomain: '',
        },
        legalSettings: {
          termsUrl: '',
          privacyUrl: '',
        },
        teamSettings: {
          members: [
            {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'OWNER' as 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
            },
            {
              id: '2',
              name: 'Sarah Wilson',
              email: 'sarah@example.com',
              role: 'MANAGER' as 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
            },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        console.log('No merchant ID found, skipping invoices fetch');
        return;
      }

      setInvoicesLoading(true);
      const response = await fetch(`/api/subscription/invoices?merchantId=${merchantId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInvoices(data.invoices || []);
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // const handleSaveSettings = async () => {
  //   setIsSaving(true);
  //   try {
  //     const response = await fetch('/api/settings', {
  //       method: 'PUT',
  //       headers: { 
  //         'Content-Type': 'application/json',
  //         'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd' // Demo merchant ID
  //       },
  //       body: JSON.stringify(formData),
  //     });

  //     if (response.ok) {
  //       setSaveMessage('Settings saved successfully!');
  //       setTimeout(() => setSaveMessage(''), 3000);
  //     }
  //   } catch (error) {
  //     console.error('Failed to save settings:', error);
  //       setSaveMessage('Failed to save settings');
  //       setTimeout(() => setSaveMessage(''), 3000);
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const handleSaveMerchantSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Get the current shop from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop') || localStorage.getItem('shop');
      
      if (!shop) {
        setSaveMessage('No shop parameter found');
        return;
      }

      // First get the merchant by shop
      const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
      const merchantData = await merchantResponse.json();
      
      if (!merchantData.success || !merchantData.merchant) {
        setSaveMessage('Failed to fetch merchant data');
        return;
      }

      const merchantId = merchantData.merchant.id;
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          website: formData.website,
          linkPattern: formData.linkPattern,
          socialMedia: formData.socialMedia,
          merchantSettings: formData.merchantSettings,
          payoutSettings: formData.payoutSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage('Merchant settings saved successfully!');
        setMerchantEditMode(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save merchant settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving merchant settings:', error);
      setSaveMessage('Error saving merchant settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getMerchantId = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop') || localStorage.getItem('shop');
    
    if (!shop) {
      throw new Error('No shop parameter found');
    }

    const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
    const merchantData = await merchantResponse.json();
    
    if (!merchantData.success || !merchantData.merchant) {
      throw new Error('Failed to fetch merchant data');
    }

    return merchantData.merchant.id;
  };

  const handleSaveInfluencerSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify({
          discountSettings: formData.discountSettings,
          commissionSettings: formData.commissionSettings,
          influencerSettings: formData.influencerSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage('Influencer settings saved successfully!');
        setInfluencerEditMode(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save influencer settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving influencer settings:', error);
      setSaveMessage('Error saving influencer settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUgcSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify({
          ugcSettings: formData.ugcSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage('UGC settings saved successfully!');
        setUgcEditMode(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save UGC settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving UGC settings:', error);
      setSaveMessage('Error saving UGC settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTeamSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify({
          teamSettings: formData.teamSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage('Team settings saved successfully!');
        setTeamEditMode(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save team settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving team settings:', error);
      setSaveMessage('Error saving team settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDomainSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify({
          domainSettings: formData.domainSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage('Domain settings saved successfully!');
        setDomainEditMode(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save domain settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving domain settings:', error);
      setSaveMessage('Error saving domain settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLegalSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify({
          legalSettings: formData.legalSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage('Legal settings saved successfully!');
        setLegalEditMode(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save legal settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving legal settings:', error);
      setSaveMessage('Error saving legal settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // const handleReconnectSocialMedia = (platform: string) => {
  //   console.log(`Reconnecting ${platform}...`);
  //   setSaveMessage(`${platform} reconnection initiated...`);
  //   setTimeout(() => setSaveMessage(''), 3000);
  // };

  const handleDisconnectSocialMedia = (id: string) => {
    console.log(`Disconnecting social media account with ID: ${id}`);
    setSaveMessage('Social media account disconnected successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    console.log(`Removing team member ${memberId}...`);
    setSaveMessage('Team member removed successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleViewAllActivity = () => {
    console.log('Opening activity log...');
    setSaveMessage('Opening activity log...');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleUpgradeToPro = () => {
    console.log('Redirecting to upgrade page...');
    setSaveMessage('Redirecting to upgrade page...');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleVerifyDomain = () => {
    console.log('Verifying domain...');
    setSaveMessage('Domain verification in progress...');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleUploadDocument = (type: string) => {
    console.log(`Uploading ${type} document...`);
    setSaveMessage(`${type} document uploaded successfully!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleExportData = () => {
    console.log('Exporting data...');
    setSaveMessage('Data export initiated...');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleDeleteData = () => {
    console.log('Deleting all data...');
    setSaveMessage('Data deletion initiated...');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleChangePlan = () => {
    setShowPlanModal(true);
  };

  const handlePlanChange = async (newPlan: string) => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        setSaveMessage('❌ No merchant ID found');
        return;
      }

      const currentPlan = subscription?.subscription?.plan?.name || 'Starter';

      // If downgrading to free plan, handle immediately
      if (newPlan === 'STARTER') {
        const response = await fetch('/api/subscription/change-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            merchantId, 
            newPlan: 'STARTER',
            currentPlan 
          }),
        });

        if (response.ok) {
          setSaveMessage('✅ Plan changed to Starter successfully');
          // Refresh subscription data
          window.location.reload();
        } else {
          setSaveMessage('❌ Failed to change plan');
        }
        return;
      }

      // For paid plans, redirect to payment
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          merchantId, 
          newPlan,
          currentPlan 
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // If we're in an iframe context, redirect to top level
        if (window !== window.top && window.top !== null) {
          window.top!.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        setSaveMessage('❌ Failed to create payment session');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      setSaveMessage('❌ Error changing plan');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        setSaveMessage('❌ No merchant ID found');
        return;
      }

      if (!subscription?.subscription) {
        setSaveMessage('❌ No active subscription to cancel');
        return;
      }

      const confirmed = window.confirm(
        'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.'
      );

      if (!confirmed) return;

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          merchantId,
          cancelAtPeriodEnd: true 
        }),
      });

      if (response.ok) {
        setSaveMessage('✅ Subscription will be canceled at the end of your current billing period');
        // Refresh subscription data
        window.location.reload();
      } else {
        setSaveMessage('❌ Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setSaveMessage('❌ Error canceling subscription');
    }
  };

  const handleUpdatePayment = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        setSaveMessage('❌ No merchant ID found');
        return;
      }

      const response = await fetch('/api/subscription/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // If we're in an iframe context, redirect to top level
        if (window !== window.top && window.top !== null) {
          window.top!.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        const error = await response.json();
        setSaveMessage(`❌ Failed to update payment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setSaveMessage('❌ Error updating payment method');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        setSaveMessage('❌ No merchant ID found');
        return;
      }

      const response = await fetch(`/api/subscription/invoices?merchantId=${merchantId}&invoiceId=${invoiceId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSaveMessage('✅ Invoice downloaded successfully');
      } else {
        setSaveMessage('❌ Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setSaveMessage('❌ Error downloading invoice');
    }
  };

  const handleDownloadAllInvoices = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        setSaveMessage('❌ No merchant ID found');
        return;
      }

      const response = await fetch(`/api/subscription/invoices?merchantId=${merchantId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.invoices) {
          // Download each invoice
          for (const invoice of data.invoices) {
            if (invoice.download_url) {
              const link = document.createElement('a');
              link.href = invoice.download_url;
              link.download = `invoice-${invoice.number}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
          setSaveMessage('✅ All invoices downloaded successfully');
        } else {
          setSaveMessage('❌ No invoices available for download');
        }
      } else {
        setSaveMessage('❌ Failed to download invoices');
      }
    } catch (error) {
      console.error('Error downloading invoices:', error);
      setSaveMessage('❌ Error downloading invoices');
    }
  };

  const addHashtag = () => {
    setFormData(prev => ({
      ...prev,
      ugcSettings: {
        ...prev.ugcSettings,
        requiredHashtags: [...prev.ugcSettings.requiredHashtags, ''],
      },
    }));
  };

  const updateHashtag = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ugcSettings: {
        ...prev.ugcSettings,
        requiredHashtags: prev.ugcSettings.requiredHashtags.map((tag, i) => 
          i === index ? value : tag
        ),
      },
    }));
  };

  const removeHashtag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ugcSettings: {
        ...prev.ugcSettings,
        requiredHashtags: prev.ugcSettings.requiredHashtags.filter((_, i) => i !== index),
      },
    }));
  };

  if (isLoading) {
    return (
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
    >
      {saveMessage && (
        <Layout.Section>
          <Banner
            title={saveMessage.includes('successfully') ? 'Success' : 'Error'}
            tone={saveMessage.includes('successfully') ? 'success' : 'critical'}
          />
        </Layout.Section>
      )}

      <Layout>
        {/* Merchant Settings */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      Merchant Settings
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="slim"
                      variant="secondary"
                      onClick={() => setMerchantEditMode(!merchantEditMode)}
                    >
                      {merchantEditMode ? 'Cancel' : 'Edit'}
                    </Button>
                    {merchantEditMode && (
                      <Button
                        size="slim"
                        onClick={handleSaveMerchantSettings}
                        icon={() => React.createElement(Save, { className: "w-4 h-4" })}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Basic Information
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Store Name"
                      value={formData.name}
                      onChange={(value) => setFormData({ ...formData, name: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(value) => setFormData({ ...formData, email: value })}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Website Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Store Website"
                      value={formData.website}
                      onChange={(value) => setFormData({ ...formData, website: value })}
                      placeholder="https://www.mystore.com"
                      helpText="Enter your store's website URL for discount link generation"
                      autoComplete="off"
                    />
                    <TextField
                      label="Link Pattern"
                      value={formData.linkPattern}
                      onChange={(value) => setFormData({ ...formData, linkPattern: value })}
                      placeholder="/discount/{{code}}"
                      helpText="URL pattern for discount links. Use &#123;&#123;code&#125;&#125; as placeholder"
                      autoComplete="off"
                    />
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Text variant="bodySm" tone="subdued" as="p">
                      <strong>Example:</strong> If your website is &quot;www.mystore.com&quot; and pattern is &quot;/discount/&#123;&#123;code&#125;&#125;&quot;, 
                      discount links will be generated as &quot;www.mystore.com/discount/SAVE20OFF&quot;
                    </Text>
                  </div>
                </div>

                <div>
                                      <Text variant="bodyMd" as="p" fontWeight="bold">
                      Social Media Connection
                    </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {React.createElement(Instagram, { className: "w-5 h-5 text-pink-600" })}
                          <Text variant="bodyMd" fontWeight="semibold" as="p">
                            Instagram
                          </Text>
                        </div>
                        <Badge tone="success">Connected</Badge>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Connected to @{formData.socialMedia.instagram || 'yourstore'}
                      </Text>
                      <div className="mt-2">
                        <Button 
                          size="slim" 
                          variant="secondary"
                          onClick={() => {
                            const merchantId = localStorage.getItem('merchantId');
                            if (merchantId) {
                              window.location.href = `/api/auth/instagram?merchantId=${merchantId}`;
                            }
                          }}
                        >
                          Connect
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {React.createElement(Hash, { className: "w-5 h-5 text-black" })}
                          <Text variant="bodyMd" fontWeight="semibold" as="p">
                            TikTok
                          </Text>
                        </div>
                        <Badge tone="success">Connected</Badge>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Connected to @{formData.socialMedia.tiktok || 'yourstore'}
                      </Text>
                      <div className="mt-2">
                        <Button 
                          size="slim" 
                          variant="secondary"
                          onClick={() => {
                            const merchantId = localStorage.getItem('merchantId');
                            if (merchantId) {
                              window.location.href = `/api/auth/tiktok?merchantId=${merchantId}`;
                            }
                          }}
                        >
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Connected accounts will automatically detect brand mentions and send discount codes via DM.
                    </Text>
                  </div>
                  
                  {/* Social Media Account Management */}
                  <div className="mt-4">
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      Connected Accounts
                    </Text>
                    <div className="space-y-3">
                      {socialMediaAccounts?.map((account) => (
                        <div key={account.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {account.platform === 'INSTAGRAM' ? (
                                React.createElement(Instagram, { className: "w-5 h-5 text-pink-600" })
                              ) : (
                                React.createElement(Hash, { className: "w-5 h-5 text-black" })
                              )}
                              <div>
                                <Text variant="bodyMd" fontWeight="semibold" as="p">
                                  @{account.username}
                                </Text>
                                <Text variant="bodySm" tone="subdued" as="p">
                                  {account.displayName} • {account.platform}
                                </Text>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge tone={account.isActive ? "success" : "warning"}>
                                {account.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                size="slim"
                                variant="secondary"
                                onClick={() => handleDisconnectSocialMedia(account.id)}
                              >
                                Disconnect
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Business Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Business Type"
                      options={[
                        { label: 'E-commerce', value: 'ECOMMERCE' },
                        { label: 'Fashion & Apparel', value: 'FASHION' },
                        { label: 'Beauty & Cosmetics', value: 'BEAUTY' },
                        { label: 'Electronics', value: 'ELECTRONICS' },
                        { label: 'Food & Beverage', value: 'FOOD' },
                        { label: 'Other', value: 'OTHER' },
                      ]}
                      value={formData.merchantSettings?.businessType || 'ECOMMERCE'}
                      onChange={(value) => setFormData({
                        ...formData,
                        merchantSettings: { ...formData.merchantSettings, businessType: value }
                      })}
                    />
                    <TextField
                      label="Currency"
                      value={formData.merchantSettings?.currency || 'USD'}
                      onChange={(value) => setFormData({
                        ...formData,
                        merchantSettings: { ...formData.merchantSettings, currency: value }
                      })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Timezone"
                      value={formData.merchantSettings?.timezone || 'UTC'}
                      onChange={(value) => setFormData({
                        ...formData,
                        merchantSettings: { ...formData.merchantSettings, timezone: value }
                      })}
                      autoComplete="off"
                    />
                    <Select
                      label="Language"
                      options={[
                        { label: 'English', value: 'EN' },
                        { label: 'Spanish', value: 'ES' },
                        { label: 'French', value: 'FR' },
                        { label: 'German', value: 'DE' },
                        { label: 'Italian', value: 'IT' },
                      ]}
                      value={formData.merchantSettings?.language || 'EN'}
                      onChange={(value) => setFormData({
                        ...formData,
                        merchantSettings: { ...formData.merchantSettings, language: value }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Payout Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Payout Schedule"
                      options={[
                        { label: 'Weekly', value: 'WEEKLY' },
                        { label: 'Monthly', value: 'MONTHLY' },
                        { label: 'Manual', value: 'MANUAL' },
                      ]}
                      value={formData.payoutSettings.payoutSchedule}
                      onChange={(value) => setFormData({
                        ...formData,
                        payoutSettings: { ...formData.payoutSettings, payoutSchedule: value as 'WEEKLY' | 'MONTHLY' | 'MANUAL' }
                      })}
                    />
                    <TextField
                      label="Minimum Payout Amount ($)"
                      type="number"
                      value={String(formData.payoutSettings.minimumPayout)}
                      onChange={(value) => setFormData({
                        ...formData,
                        payoutSettings: { ...formData.payoutSettings, minimumPayout: parseFloat(value) }
                      })}
                      min="0"
                      autoComplete="off"
                    />
                    <TextField
                      label="Stripe Account ID"
                      value={formData.payoutSettings.stripeAccountId}
                      onChange={(value) => setFormData({
                        ...formData,
                        payoutSettings: { ...formData.payoutSettings, stripeAccountId: value }
                      })}
                      placeholder="acct_..."
                      autoComplete="off"
                    />
                    <Select
                      label="Auto-Payout"
                      options={[
                        { label: 'Yes', value: 'true' },
                        { label: 'No', value: 'false' },
                      ]}
                      value={formData.payoutSettings.autoPayout ? 'true' : 'false'}
                      onChange={(value) => setFormData({
                        ...formData,
                        payoutSettings: { ...formData.payoutSettings, autoPayout: value === 'true' }
                      })}
                    />
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      {formData.payoutSettings.autoPayout ? 'Automatically' : 'Manually'} process payouts {formData.payoutSettings.payoutSchedule.toLowerCase()} when balance reaches {formData.payoutSettings.minimumPayout}.
                    </Text>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Notification Settings
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Email Notifications"
                      options={[
                        { label: 'All Notifications', value: 'ALL' },
                        { label: 'Important Only', value: 'IMPORTANT' },
                        { label: 'None', value: 'NONE' },
                      ]}
                      value={formData.merchantSettings?.emailNotifications || 'ALL'}
                      onChange={(value) => setFormData({
                        ...formData,
                        merchantSettings: { ...formData.merchantSettings, emailNotifications: value }
                      })}
                    />
                    <Select
                      label="SMS Notifications"
                      options={[
                        { label: 'Enabled', value: 'true' },
                        { label: 'Disabled', value: 'false' },
                      ]}
                      value={formData.merchantSettings?.smsNotifications ? 'true' : 'false'}
                      onChange={(value) => setFormData({
                        ...formData,
                        merchantSettings: { ...formData.merchantSettings, smsNotifications: value === 'true' }
                      })}
                    />
                  </div>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>



        {/* Influencer Settings */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      Influencer Settings
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="slim"
                      variant="secondary"
                      onClick={() => setInfluencerEditMode(!influencerEditMode)}
                    >
                      {influencerEditMode ? 'Cancel' : 'Edit'}
                    </Button>
                    {influencerEditMode && (
                      <Button
                        size="slim"
                        onClick={handleSaveInfluencerSettings}
                        icon={() => React.createElement(Save, { className: "w-4 h-4" })}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Discount Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      label="Default Discount (%)"
                      type="number"
                      value={String(formData.discountSettings.defaultPercentage)}
                      onChange={(value) => setFormData({
                        ...formData,
                        discountSettings: { ...formData.discountSettings, defaultPercentage: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      autoComplete="off"
                    />
                    <TextField
                      label="Minimum Discount (%)"
                      type="number"
                      value={String(formData.discountSettings.minPercentage)}
                      onChange={(value) => setFormData({
                        ...formData,
                        discountSettings: { ...formData.discountSettings, minPercentage: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      autoComplete="off"
                    />
                    <TextField
                      label="Maximum Discount (%)"
                      type="number"
                      value={String(formData.discountSettings.maxPercentage)}
                      onChange={(value) => setFormData({
                        ...formData,
                        discountSettings: { ...formData.discountSettings, maxPercentage: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Commission Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      label="Default Commission Rate (%)"
                      type="number"
                      value={String(formData.commissionSettings.defaultRate)}
                      onChange={(value) => setFormData({
                        ...formData,
                        commissionSettings: { ...formData.commissionSettings, defaultRate: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      autoComplete="off"
                    />
                    <TextField
                      label="Minimum Commission (%)"
                      type="number"
                      value={String(formData.commissionSettings.minRate)}
                      onChange={(value) => setFormData({
                        ...formData,
                        commissionSettings: { ...formData.commissionSettings, minRate: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      autoComplete="off"
                    />
                    <TextField
                      label="Maximum Commission (%)"
                      type="number"
                      value={String(formData.commissionSettings.maxRate)}
                      onChange={(value) => setFormData({
                        ...formData,
                        commissionSettings: { ...formData.commissionSettings, maxRate: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Influencer Management
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Auto-Approve Influencers"
                      options={[
                        { label: 'Yes', value: 'true' },
                        { label: 'No', value: 'false' },
                      ]}
                      value={formData.influencerSettings.autoApprove ? 'true' : 'false'}
                      onChange={(value) => setFormData({
                        ...formData,
                        influencerSettings: { ...formData.influencerSettings, autoApprove: value === 'true' }
                      })}
                    />
                    <TextField
                      label="Minimum Follower Count"
                      type="number"
                      value={String(formData.influencerSettings.minFollowers)}
                      onChange={(value) => setFormData({
                        ...formData,
                        influencerSettings: { ...formData.influencerSettings, minFollowers: parseInt(value) }
                      })}
                      min="0"
                      autoComplete="off"
                    />
                    <TextField
                      label="Minimum Engagement Rate (%)"
                      type="number"
                      value={String(formData.influencerSettings.minEngagementRate)}
                      onChange={(value) => setFormData({
                        ...formData,
                        influencerSettings: { ...formData.influencerSettings, minEngagementRate: parseFloat(value) }
                      })}
                      min="0"
                      max="100"
                      step={0.1}
                      autoComplete="off"
                    />
                    <TextField
                      label="Maximum Influencers"
                      type="number"
                      value={String(formData.influencerSettings.maxInfluencers)}
                      onChange={(value) => setFormData({
                        ...formData,
                        influencerSettings: { ...formData.influencerSettings, maxInfluencers: parseInt(value) }
                      })}
                      min="1"
                      max="10000"
                      autoComplete="off"
                    />
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Auto-approve influencers with {formData.influencerSettings.minFollowers || 1000}+ followers and {formData.influencerSettings.minEngagementRate || 2}%+ engagement rate. 
                      Maximum {formData.influencerSettings.maxInfluencers || 1000} influencers allowed.
                    </Text>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Payout Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Auto-Payout"
                      options={[
                        { label: 'Yes', value: 'true' },
                        { label: 'No', value: 'false' },
                      ]}
                      value={formData.commissionSettings.autoPayout ? 'true' : 'false'}
                      onChange={(value) => setFormData({
                        ...formData,
                        commissionSettings: { ...formData.commissionSettings, autoPayout: value === 'true' }
                      })}
                    />
                    <TextField
                      label="Minimum Payout Amount ($)"
                      type="number"
                      value={String(formData.influencerSettings.minPayoutAmount)}
                      onChange={(value) => setFormData({
                        ...formData,
                        influencerSettings: { ...formData.influencerSettings, minPayoutAmount: parseFloat(value) }
                      })}
                      min="0"
                      autoComplete="off"
                    />
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      {formData.commissionSettings.autoPayout ? 'Automatically' : 'Manually'} process payouts when balance reaches {formData.influencerSettings.minPayoutAmount || 50}.
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* UGC Settings */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      UGC Settings
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="slim"
                      variant="secondary"
                      onClick={() => setUgcEditMode(!ugcEditMode)}
                    >
                      {ugcEditMode ? 'Cancel' : 'Edit'}
                    </Button>
                    {ugcEditMode && (
                      <Button
                        size="slim"
                        onClick={handleSaveUgcSettings}
                        icon={() => React.createElement(Save, { className: "w-4 h-4" })}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Minimum Engagement"
                    type="number"
                    value={String(formData.ugcSettings.minEngagement)}
                    onChange={(value) => setFormData({
                      ...formData,
                      ugcSettings: { ...formData.ugcSettings, minEngagement: parseInt(value) }
                    })}
                    min="0"
                    autoComplete="off"
                  />
                  <Select
                    label="Auto-Approve Posts"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={formData.ugcSettings.autoApprove ? 'true' : 'false'}
                    onChange={(value) => setFormData({
                      ...formData,
                      ugcSettings: { ...formData.ugcSettings, autoApprove: value === 'true' }
                    })}
                  />
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    UGC Discount Code Settings
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Discount Type"
                      options={[
                        { label: 'Percentage Discount', value: 'PERCENTAGE' },
                        { label: 'Fixed Amount', value: 'FIXED_AMOUNT' },
                      ]}
                      value={formData.ugcSettings.discountType || 'PERCENTAGE'}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, discountType: value as 'PERCENTAGE' | 'FIXED_AMOUNT' }
                      })}
                    />
                    <TextField
                      label={formData.ugcSettings.discountType === 'PERCENTAGE' ? "Discount Percentage (%)" : "Fixed Amount ($)"}
                      type="number"
                      value={String(formData.ugcSettings.discountValue || 20)}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, discountValue: parseFloat(value) }
                      })}
                      min={formData.ugcSettings.discountType === 'PERCENTAGE' ? "1" : "1"}
                      max={formData.ugcSettings.discountType === 'PERCENTAGE' ? "100" : "1000"}
                      autoComplete="off"
                    />
                    <TextField
                      label="Usage Limit"
                      type="number"
                      value={String(formData.ugcSettings.discountUsageLimit || 100)}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, discountUsageLimit: parseInt(value) }
                      })}
                      min="1"
                      max="10000"
                      autoComplete="off"
                    />
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      {formData.ugcSettings.discountType === 'PERCENTAGE' 
                        ? `${formData.ugcSettings.discountValue || 20}% discount codes will be sent to UGC creators`
                        : `$${formData.ugcSettings.discountValue || 20} fixed discount codes will be sent to UGC creators`
                      }. Each code can be used up to {formData.ugcSettings.discountUsageLimit || 100} times.
                    </Text>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Code Delivery Timer Settings
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <TextField
                      label="Delay Hours"
                      type="number"
                      value={String(formData.ugcSettings.codeDelayHours)}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, codeDelayHours: parseInt(value) }
                      })}
                      min="0"
                      max="24"
                      autoComplete="off"
                    />
                    <TextField
                      label="Delay Minutes"
                      type="number"
                      value={String(formData.ugcSettings.codeDelayMinutes)}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, codeDelayMinutes: parseInt(value) }
                      })}
                      min="0"
                      max="59"
                      autoComplete="off"
                    />
                    <TextField
                      label="Max Codes Per Day"
                      type="number"
                      value={String(formData.ugcSettings.maxCodesPerDay)}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, maxCodesPerDay: parseInt(value) }
                      })}
                      min="1"
                      max="1000"
                      autoComplete="off"
                    />
                    <TextField
                      label="Max Codes Per Influencer (24h)"
                      type="number"
                      value={String(formData.ugcSettings.maxCodesPerInfluencer)}
                      onChange={(value) => setFormData({
                        ...formData,
                        ugcSettings: { ...formData.ugcSettings, maxCodesPerInfluencer: parseInt(value) }
                      })}
                      min="1"
                      max="10"
                      autoComplete="off"
                    />
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Code will be sent {formData.ugcSettings.codeDelayHours}h {formData.ugcSettings.codeDelayMinutes}m after post approval. 
                      Maximum {formData.ugcSettings.maxCodesPerDay} codes per day, {formData.ugcSettings.maxCodesPerInfluencer} per influencer in 24 hours.
                    </Text>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Required Hashtags
                  </Text>
                  <div className="mt-2 space-y-2">
                    {formData.ugcSettings.requiredHashtags.map((hashtag, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <TextField
                          label="Hashtag"
                          value={hashtag}
                          onChange={(value) => updateHashtag(index, value)}
                          placeholder="#yourbrand"
                          autoComplete="off"
                        />
                        <Button
                          size="slim"
                          variant="secondary"
                          onClick={() => removeHashtag(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="slim"
                      onClick={addHashtag}
                    >
                      Add Hashtag
                    </Button>
                  </div>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Team & Permissions */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      Team & Permissions
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="slim"
                      variant="secondary"
                      onClick={() => setTeamEditMode(!teamEditMode)}
                    >
                      {teamEditMode ? 'Cancel' : 'Edit'}
                    </Button>
                    {teamEditMode && (
                      <Button
                        size="slim"
                        onClick={handleSaveTeamSettings}
                        icon={() => React.createElement(Save, { className: "w-4 h-4" })}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Text variant="bodyMd" as="p" fontWeight="bold">
                        Team Members
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Manage who has access to your SocialBoost account
                      </Text>
                    </div>
                    <Button
                      size="slim"
                      onClick={() => setShowInviteModal(true)}
                      icon={() => React.createElement(UserPlus, { className: "w-4 h-4" })}
                    >
                      Invite Member
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Current User */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar size="sm" name="John Doe" />
                        <div>
                          <Text variant="bodyMd" fontWeight="semibold" as="p">
                            John Doe
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            john@example.com
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Tag>Owner</Tag>
                        <Text variant="bodySm" tone="subdued" as="p">
                          You
                        </Text>
                      </div>
                    </div>

                    {/* Team Member */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar size="sm" name="Sarah Wilson" />
                        <div>
                          <Text variant="bodyMd" fontWeight="semibold" as="p">
                            Sarah Wilson
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            sarah@example.com
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          label="Role"
                          options={[
                            { label: 'Admin', value: 'ADMIN' },
                            { label: 'Manager', value: 'MANAGER' },
                            { label: 'Viewer', value: 'VIEWER' },
                          ]}
                          value="MANAGER"
                          onChange={() => {}}
                        />
                        <Button 
                          size="slim" 
                          variant="secondary" 
                          tone="critical"
                          onClick={() => handleRemoveTeamMember('2')}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Role Permissions
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {React.createElement(Shield, { className: "w-4 h-4 text-blue-600" })}
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          Admin
                        </Text>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Full access to all settings, team management, and billing
                      </Text>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {React.createElement(Users, { className: "w-4 h-4 text-green-600" })}
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          Manager
                        </Text>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Can manage influencers, UGC, and basic settings
                      </Text>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {React.createElement(Activity, { className: "w-4 h-4 text-gray-600" })}
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          Viewer
                        </Text>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        View-only access to reports and analytics
                      </Text>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      Activity Log
                    </Text>
                    <Button 
                      size="slim" 
                      variant="secondary"
                      onClick={handleViewAllActivity}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        {React.createElement(Activity, { className: "w-4 h-4 text-blue-600" })}
                        <Text variant="bodySm" as="p">
                          Sarah Wilson approved UGC post
                        </Text>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        2 hours ago
                      </Text>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        {React.createElement(Activity, { className: "w-4 h-4 text-green-600" })}
                        <Text variant="bodySm" as="p">
                          Discount code sent to influencer
                        </Text>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        4 hours ago
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {React.createElement(Shield, { className: "w-4 h-4 text-blue-600" })}
                    <Text variant="bodyMd" fontWeight="semibold" as="p">
                      Upgrade to Pro
                    </Text>
                  </div>
                  <Text variant="bodySm" as="p">
                    Get advanced team features like custom roles, detailed activity logs, and priority support.
                  </Text>
                  <Button 
                    size="slim" 
                    onClick={handleUpgradeToPro}
                  >
                    Upgrade Now
                  </Button>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Custom Domain */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      Custom Domain
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="slim"
                      variant="secondary"
                      onClick={() => setDomainEditMode(!domainEditMode)}
                    >
                      {domainEditMode ? 'Cancel' : 'Edit'}
                    </Button>
                    {domainEditMode && (
                      <Button
                        size="slim"
                        onClick={handleSaveDomainSettings}
                        icon={() => React.createElement(Save, { className: "w-4 h-4" })}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Domain Configuration
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Custom Domain"
                      value={formData.domainSettings?.customDomain || ''}
                      onChange={(value) => setFormData({
                        ...formData,
                        domainSettings: { ...formData.domainSettings, customDomain: value }
                      })}
                      placeholder="influencers.yourstore.com"
                      autoComplete="off"
                    />
                    <div className="flex items-end">
                      <Button 
                        size="slim" 
                        variant="secondary"
                        onClick={handleVerifyDomain}
                      >
                        Verify Domain
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Your influencer links will use: {formData.domainSettings?.customDomain || 'socialboost.app/yourstore'}
                    </Text>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {React.createElement(Globe, { className: "w-4 h-4 text-blue-600" })}
                    <Text variant="bodyMd" fontWeight="semibold" as="p">
                      Premium Feature
                    </Text>
                  </div>
                  <Text variant="bodySm" as="p">
                    Custom domains are available on Pro and Enterprise plans. Upgrade to get branded influencer links.
                  </Text>
                  <Button 
                    size="slim" 
                    onClick={handleUpgradeToPro}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Legal & Compliance */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      Legal & Compliance
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="slim"
                      variant="secondary"
                      onClick={() => setLegalEditMode(!legalEditMode)}
                    >
                      {legalEditMode ? 'Cancel' : 'Edit'}
                    </Button>
                    {legalEditMode && (
                      <Button
                        size="slim"
                        onClick={handleSaveLegalSettings}
                        icon={() => React.createElement(Save, { className: "w-4 h-4" })}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Legal Documents
                  </Text>
                  <div className="space-y-4">
                    <div>
                      <Text variant="bodyMd" fontWeight="semibold" as="p">
                        Terms & Conditions
                      </Text>
                      <div className="flex items-center space-x-2 mt-2">
                        <TextField
                          label="Terms of Service URL"
                          value={formData.legalSettings?.termsUrl || ''}
                          onChange={(value) => setFormData({
                            ...formData,
                            legalSettings: { ...formData.legalSettings, termsUrl: value },
                          })}
                          placeholder="https://yourstore.com/terms"
                          autoComplete="off"
                        />
                        <Button 
                          size="slim" 
                          variant="secondary"
                          onClick={() => handleUploadDocument('Terms & Conditions')}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Text variant="bodyMd" fontWeight="semibold" as="p">
                        Privacy Policy
                      </Text>
                      <div className="flex items-center space-x-2 mt-2">
                        <TextField
                          label="Privacy Policy URL"
                          value={formData.legalSettings?.privacyUrl || ''}
                          onChange={(value) => setFormData({
                            ...formData,
                            legalSettings: { ...formData.legalSettings, privacyUrl: value },
                          })}
                          placeholder="https://yourstore.com/privacy"
                          autoComplete="off"
                        />
                        <Button 
                          size="slim" 
                          variant="secondary"
                          onClick={() => handleUploadDocument('Privacy Policy')}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Data Protection
                  </Text>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          Data Export Request
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Download all data associated with your account
                        </Text>
                      </div>
                      <Button 
                        size="slim" 
                        variant="secondary" 
                        icon={() => React.createElement(Download, { className: "w-4 h-4" })}
                        onClick={handleExportData}
                      >
                        Export Data
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          Data Deletion Request
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Permanently delete all data (irreversible)
                        </Text>
                      </div>
                      <Button 
                        size="slim" 
                        variant="secondary" 
                        tone="critical"
                        onClick={handleDeleteData}
                      >
                        Delete All Data
                      </Button>
                    </div>
                  </div>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Billing & Subscription */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <Text variant="headingMd" as="h2">
                      Billing & Subscription
                    </Text>
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Current Plan
                  </Text>
                  <div className="border rounded-lg p-4">
                    {subscriptionLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Text variant="bodyMd" tone="subdued" as="p">
                          Loading subscription data...
                        </Text>
                      </div>
                    ) : subscription?.subscription ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <Text variant="bodyMd" fontWeight="semibold" as="p">
                              {subscription.subscription.plan?.name || 'Starter'} Plan
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              ${((subscription.subscription.plan?.priceCents || 0) / 100).toFixed(2)}/month
                            </Text>
                          </div>
                          <Tag>
                            {subscription.subscription.status === 'ACTIVE' ? 'Active' : subscription.subscription.status}
                          </Tag>
                        </div>
                        {subscription.usage && (
                          <div className="mb-3 p-3 bg-gray-50 rounded">
                            <Text variant="bodySm" fontWeight="semibold" as="p">
                              Usage This Month:
                            </Text>
                            <div className="flex justify-between mt-1">
                              <Text variant="bodySm" tone="subdued" as="p">
                                UGC Posts: {subscription.usage.ugcCount} / {subscription.usage.ugcLimit === -1 ? '∞' : subscription.usage.ugcLimit}
                              </Text>
                              <Text variant="bodySm" tone="subdued" as="p">
                                Influencers: {subscription.usage.influencerCount} / {subscription.usage.influencerLimit === -1 ? '∞' : subscription.usage.influencerLimit}
                              </Text>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="slim" 
                            variant="secondary"
                            onClick={handleChangePlan}
                          >
                            Change Plan
                          </Button>
                          <Button 
                            size="slim" 
                            variant="secondary"
                            onClick={handleCancelSubscription}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <Text variant="bodyMd" fontWeight="semibold" as="p">
                              No Active Plan
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              You&apos;re currently on the free plan
                            </Text>
                          </div>
                          <Tag>Free</Tag>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="slim" 
                            variant="primary"
                            onClick={handleChangePlan}
                          >
                            Upgrade Plan
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Payment Method
                  </Text>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5" />
                        <div>
                          <Text variant="bodyMd" fontWeight="semibold" as="p">
                            Visa ending in 4242
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Expires 12/25
                          </Text>
                        </div>
                      </div>
                      <Button 
                        size="slim" 
                        variant="secondary"
                        onClick={handleUpdatePayment}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      Billing History
                    </Text>
                    <Button 
                      size="slim" 
                      variant="secondary" 
                      icon={() => React.createElement(Download, { className: "w-4 h-4" })}
                      onClick={handleDownloadAllInvoices}
                    >
                      Download All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {invoicesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : invoices.length > 0 ? (
                      invoices.map((invoice, index) => (
                        <div key={invoice.id || index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <Text variant="bodySm" fontWeight="semibold" as="p">
                              {invoice.number || `Invoice ${index + 1}`}
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              {invoice.created ? 
                                new Date(invoice.created * 1000).toLocaleDateString() : 
                                'Date not available'
                              }
                            </Text>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Text variant="bodySm" fontWeight="semibold" as="p">
                              ${((invoice.amount_paid || 0) / 100).toFixed(2)}
                            </Text>
                            <Button 
                              size="slim" 
                              variant="secondary"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              disabled={!invoice.download_url}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <Text variant="bodySm" tone="subdued" as="p">
                          No billing history available
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>



      </Layout>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        currentPlan={subscription?.subscription?.plan?.name}
        onPlanChange={handlePlanChange}
        isLoading={isSaving}
      />
    </Page>
  );
} 