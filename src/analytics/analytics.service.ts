import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev30d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalContacts,
      contacts24h,
      contacts7d,
      respondedContacts,
      totalSubscribers,
      activeSubscribers,
      newSubscribers30d,
      prevSubscribers30d,
      unresolvedContacts,
      totalPosts,
      draftPosts,
      publishedThisMonth,
    ] = await Promise.all([
      this.prisma.contactRequest.count(),
      this.prisma.contactRequest.count({
        where: { createdAt: { gte: last24h } },
      }),
      this.prisma.contactRequest.count({
        where: { createdAt: { gte: last7d } },
      }),
      this.prisma.contactRequest.count({ where: { status: 'RESPONDED' } }),
      this.prisma.subscriber.count(),
      this.prisma.subscriber.count({ where: { isActive: true } }),
      this.prisma.subscriber.count({ where: { createdAt: { gte: last30d } } }),
      this.prisma.subscriber.count({
        where: { createdAt: { gte: prev30d, lt: last30d } },
      }),
      this.prisma.contactRequest.count({ where: { status: 'NEW' } }),
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: 'DRAFT' } }),
      this.prisma.post.count({
        where: { status: 'PUBLISHED', publishedAt: { gte: last30d } },
      }),
    ]);

    const responseRate =
      totalContacts > 0
        ? Math.round((respondedContacts / totalContacts) * 100)
        : 0;

    const subscriberGrowth =
      prevSubscribers30d > 0
        ? Math.round(
            ((newSubscribers30d - prevSubscribers30d) / prevSubscribers30d) *
              100,
          )
        : newSubscribers30d > 0
          ? 100
          : 0;

    return {
      contacts: {
        total: totalContacts,
        last24h: contacts24h,
        last7d: contacts7d,
        unresolved: unresolvedContacts,
        responseRate,
      },
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        newLast30d: newSubscribers30d,
        growthPercent: subscriberGrowth,
      },
      blog: {
        total: totalPosts,
        drafts: draftPosts,
        publishedThisMonth,
      },
    };
  }

  async getRecentActivity(limit = 20) {
    const [recentContacts, recentSubscribers, recentPosts] = await Promise.all([
      this.prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          respondedAt: true,
        },
      }),
      this.prisma.subscriber.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.post.findMany({
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
    ]);

    type ActivityItem = {
      id: string;
      type:
        | 'contact_new'
        | 'contact_responded'
        | 'subscriber_added'
        | 'subscriber_deactivated'
        | 'post_published'
        | 'post_draft';
      label: string;
      detail: string;
      timestamp: Date;
    };

    const activities: ActivityItem[] = [];

    for (const c of recentContacts) {
      activities.push({
        id: `contact-new-${c.id}`,
        type: 'contact_new',
        label: 'New contact request',
        detail: `${c.name} <${c.email}>`,
        timestamp: c.createdAt,
      });
      if (c.status === 'RESPONDED' && c.respondedAt) {
        activities.push({
          id: `contact-responded-${c.id}`,
          type: 'contact_responded',
          label: 'Contact marked as responded',
          detail: `${c.name} <${c.email}>`,
          timestamp: c.respondedAt,
        });
      }
    }

    for (const s of recentSubscribers) {
      activities.push({
        id: `sub-${s.id}`,
        type: s.isActive ? 'subscriber_added' : 'subscriber_deactivated',
        label: s.isActive ? 'New subscriber' : 'Subscriber deactivated',
        detail: s.email,
        timestamp: s.createdAt,
      });
    }

    for (const p of recentPosts) {
      activities.push({
        id: `post-${p.id}`,
        type: p.status === 'PUBLISHED' ? 'post_published' : 'post_draft',
        label:
          p.status === 'PUBLISHED' ? 'Post published' : 'Post saved as draft',
        detail: p.title,
        timestamp: p.updatedAt,
      });
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, limit);
  }
}
